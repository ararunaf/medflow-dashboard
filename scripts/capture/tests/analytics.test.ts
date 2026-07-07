#!/usr/bin/env node
/**
 * Testes — Analytics Executivo (MEDICFLOW-ANALYTICS-01).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mapSessionToAnalyticsRecord } from "../../../src/lib/capture/analytics/session-record.ts";
import { applyAnalyticsFilters } from "../../../src/lib/capture/analytics/filters.ts";
import { buildExecutiveKpis } from "../../../src/lib/capture/analytics/aggregators/executive.ts";
import { buildQualityIndicators } from "../../../src/lib/capture/analytics/aggregators/quality.ts";
import { buildOperatorComparisons } from "../../../src/lib/capture/analytics/aggregators/operators.ts";
import { buildAnalyticsTrends } from "../../../src/lib/capture/analytics/aggregators/trends.ts";
import {
  buildAnalyticsExportSections,
  buildAnalyticsSummaryCsvRows,
} from "../../../src/lib/capture/analytics/export-builder.ts";
import type { AnalyticsSessionRecord } from "../../../src/lib/capture/analytics/types.ts";
import type { LearningMetricsStore } from "../../../src/lib/capture/learning/types/learning-record.ts";

function makeRecord(overrides: Partial<AnalyticsSessionRecord> = {}): AnalyticsSessionRecord {
  return {
    sessionId: "s1",
    sessionStatus: "REVIEW",
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-02T12:00:00.000Z",
    queue: "aguardando_revisao",
    approvalStatus: "em_revisao",
    operatorName: "Unimed",
    operatorAnsCode: "123456",
    guideType: "consulta",
    riskLevel: "Médio",
    riskScore: 55,
    estimatedFinancialImpact: 1000,
    isCritical: false,
    ocrConfidence: 92,
    parserConfidence: 88,
    auditFindingsCount: 2,
    auditBlockingCount: 0,
    correctionAccepted: 1,
    correctionEdited: 0,
    correctionRejected: 1,
    correctionPending: 0,
    correctionTotal: 2,
    reviewEnteredAt: "2026-07-01T11:00:00.000Z",
    reviewDurationMs: 86_400_000,
    approvalDurationMs: null,
    glosaRuleHits: [{ ruleId: "TISS-001", count: 1 }],
    ...overrides,
  };
}

function makeLearningMetrics(): LearningMetricsStore {
  return {
    version: "learning_metrics_v1",
    tenantId: "t1",
    computedAt: "2026-07-06T00:00:00.000Z",
    engineVersion: "1",
    totalRecords: 10,
    globalAcceptanceRate: 0.6,
    globalEditRate: 0.2,
    globalRejectRate: 0.2,
    globalAverageConfidence: 0.85,
    globalAverageTimeToDecisionMs: 5000,
    byRule: [
      {
        ruleId: "TISS-001",
        usageCount: 5,
        acceptanceRate: 0.6,
        editRate: 0.2,
        rejectRate: 0.2,
        averageConfidence: 0.9,
        falsePositiveRate: 0.1,
        averageTimeToDecisionMs: 4000,
      },
    ],
    byField: [
      {
        field: "codigoProcedimento",
        usageCount: 4,
        acceptanceRate: 0.5,
        editRate: 0.25,
        rejectRate: 0.25,
        averageConfidence: 0.88,
      },
    ],
    temporalEvolution: [],
  };
}

describe("Analytics — session record", () => {
  it("mapeia metadata do pipeline para registro analítico", () => {
    const row = {
      id: "sess-abc",
      status: "REVIEW",
      created_at: "2026-07-01T10:00:00.000Z",
      updated_at: "2026-07-03T10:00:00.000Z",
      metadata: {
        ocr: { status: "completed", averageConfidence: 91 },
        parser: { status: "completed", guideType: "consulta", overallConfidence: 87 },
        audit: { status: "completed", totalFindings: 3, blocking: false },
        correction: {
          status: "completed",
          totalProposals: 2,
          acceptedCount: 1,
          editedCount: 0,
          rejectedCount: 1,
          pendingCount: 0,
        },
        riskAssessment: {
          overallRiskLevel: "Alto",
          overallRiskScore: 72,
          estimatedFinancialImpact: 2500,
        },
        riskAssessmentPreview: {
          operatorName: "Bradesco Saúde",
          operatorAnsCode: "999888",
          guideType: "consulta",
        },
        review: {
          approvalStatus: "em_revisao",
          decisions: [],
          enteredAt: "2026-07-01T12:00:00.000Z",
        },
        captureEvents: [
          {
            type: "proposal_generated",
            sessionId: "sess-abc",
            at: "2026-07-02T10:00:00.000Z",
            payload: { field: "dataAtendimento" },
          },
          {
            type: "learning_recorded",
            sessionId: "sess-abc",
            at: "2026-07-02T11:00:00.000Z",
            payload: { ruleId: "AUT-01" },
          },
        ],
      },
    };

    const record = mapSessionToAnalyticsRecord(row);
    assert.equal(record.operatorName, "Bradesco Saúde");
    assert.equal(record.guideType, "consulta");
    assert.equal(record.ocrConfidence, 91);
    assert.equal(record.parserConfidence, 87);
    assert.equal(record.auditFindingsCount, 3);
    assert.equal(record.estimatedFinancialImpact, 2500);
    assert.equal(record.glosaRuleHits.length, 2);
  });
});

describe("Analytics — filtros", () => {
  it("filtra por operadora e tipo", () => {
    const records = [
      makeRecord({ sessionId: "a", operatorName: "Unimed", guideType: "consulta" }),
      makeRecord({ sessionId: "b", operatorName: "Amil", guideType: "sp_sadt" }),
    ];
    const filtered = applyAnalyticsFilters(records, { operator: "Amil" });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]!.sessionId, "b");
  });
});

describe("Analytics — agregações executivas", () => {
  it("consolida KPIs financeiros e operacionais", () => {
    const records = [
      makeRecord({
        approvalStatus: "aprovada",
        queue: "aprovadas",
        isCritical: true,
        estimatedFinancialImpact: 2000,
        correctionAccepted: 2,
        correctionTotal: 2,
      }),
      makeRecord({
        sessionId: "s2",
        approvalStatus: "reprovada",
        queue: "reprovadas",
        operatorName: "Amil",
        guideType: "sp_sadt",
        riskLevel: "Baixo",
        estimatedFinancialImpact: 500,
      }),
    ];

    const kpis = buildExecutiveKpis(records);
    assert.equal(kpis.totalGuidesProcessed, 2);
    assert.equal(kpis.guidesApproved, 1);
    assert.equal(kpis.guidesRejected, 1);
    assert.equal(kpis.guidesCritical, 1);
    assert.equal(kpis.financialRiskImpact, 2500);
    assert.equal(kpis.potentialSavingsFromCorrections, 2250);
    assert.ok(kpis.guidesByOperator.some((o) => o.label === "Amil"));
  });
});

describe("Analytics — qualidade", () => {
  it("usa learning metrics quando disponível", () => {
    const q = buildQualityIndicators([makeRecord()], makeLearningMetrics());
    assert.equal(q.suggestionAcceptanceRate, 60);
    assert.equal(q.topGlosaRules[0]!.ruleId, "TISS-001");
    assert.equal(q.topCorrectedFields[0]!.field, "codigoProcedimento");
    assert.equal(q.ocrAccuracyAvg, 92);
  });
});

describe("Analytics — comparativo operadoras", () => {
  it("ranqueia operadoras por volume", () => {
    const rows = buildOperatorComparisons([
      makeRecord({ operatorName: "Unimed" }),
      makeRecord({ sessionId: "s2", operatorName: "Unimed" }),
      makeRecord({ sessionId: "s3", operatorName: "Amil" }),
    ]);
    assert.equal(rows[0]!.operator, "Unimed");
    assert.equal(rows[0]!.guideCount, 2);
    assert.equal(rows[0]!.operationalRank, 1);
    assert.equal(rows[1]!.operationalRank, 2);
  });
});

describe("Analytics — tendências", () => {
  it("gera séries temporais em janela fixa", () => {
    const asOf = new Date("2026-07-06T12:00:00.000Z");
    const trends = buildAnalyticsTrends(
      [
        makeRecord({ createdAt: "2026-07-05T10:00:00.000Z", riskScore: 40 }),
        makeRecord({
          sessionId: "s2",
          createdAt: "2026-07-05T14:00:00.000Z",
          riskScore: 60,
          correctionAccepted: 1,
          correctionTotal: 1,
        }),
      ],
      7,
      asOf,
    );
    assert.equal(trends.volume.length, 7);
    const jul5 = trends.volume.find((p) => p.dayKey === "2026-07-05");
    assert.equal(jul5?.value, 2);
    const riskJul5 = trends.risk.find((p) => p.dayKey === "2026-07-05");
    assert.equal(riskJul5?.value, 50);
  });
});

describe("Analytics — exportação", () => {
  it("monta seções para PDF/Excel e CSV resumo", () => {
    const snapshot = {
      asOf: "2026-07-06T00:00:00.000Z",
      filtersApplied: {},
      sessionCount: 1,
      executive: buildExecutiveKpis([makeRecord()]),
      quality: buildQualityIndicators([makeRecord()], null),
      operators: buildOperatorComparisons([makeRecord()]),
      trends: buildAnalyticsTrends([makeRecord()], 7),
    };

    const sections = buildAnalyticsExportSections(snapshot);
    assert.ok(sections.some((s) => s.title === "Resumo Executivo"));
    assert.ok(sections.some((s) => s.title === "Comparativo por Operadora"));

    const csv = buildAnalyticsSummaryCsvRows(snapshot);
    assert.equal(csv.length, 5);
    assert.equal(csv[0]!.metric, "total_guides");
  });
});

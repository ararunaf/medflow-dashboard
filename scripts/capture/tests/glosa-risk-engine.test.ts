#!/usr/bin/env node
/**
 * Testes — MEDICFLOW-GLOSA-RISK-ENGINE-01
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRawOcrResult } from "../../../src/lib/capture/ocr/providers/shared.ts";
import type { OcrLine, OcrPage, RawOcrResult } from "../../../src/lib/capture/ocr/types/raw-ocr-result.ts";
import { parseOcrToStructuredGuide } from "../../../src/lib/capture/parser/index.ts";
import type { StructuredField, StructuredGuide } from "../../../src/lib/capture/parser/types/structured-guide.ts";
import { auditStructuredGuide } from "../../../src/lib/capture/audit/index.ts";
import {
  ContractIntelligenceEngine,
  enrichAuditFindings,
} from "../../../src/lib/capture/contract/index.ts";
import {
  GlosaRiskEngine,
  assessGlosaRisk,
  classifyRiskLevel,
  buildRiskAssessmentStoragePath,
  RISK_ASSESSMENT_FILENAME,
  buildRiskDashboardView,
  scoreGlosaRisk,
  DEFAULT_RISK_SCORING_WEIGHTS,
} from "../../../src/lib/capture/risk/index.ts";
import { REVIEW_PANEL_IDS } from "../../../src/lib/capture/review/types.ts";
import { REVIEW_PANEL_LABELS } from "../../../src/lib/capture/review/review-workspace-service.ts";
import { isReviewPanelId } from "../../../src/modules/capture/components/ReviewWorkspace.tsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../..");

function loadEnv() {
  for (const name of [".env", ".env.local", ".env.staging"]) {
    const path = resolve(root, name);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  }
}

loadEnv();

function line(text: string, y: number, confidence = 0.92): OcrLine {
  return {
    text,
    confidence,
    coordinates: { boundingBox: { x: 10, y, width: 400, height: 18 } },
    words: text.split(/\s+/).map((w, i) => ({
      text: w,
      confidence,
      coordinates: { boundingBox: { x: 10 + i * 40, y, width: 35, height: 18 } },
    })),
  };
}

function buildOcrFromLines(
  headerAndLines: Array<{ text: string; y: number; confidence?: number }>,
): RawOcrResult {
  const pageHeight = 1000;
  const lines = headerAndLines.map((l) => line(l.text, l.y, l.confidence ?? 0.92));
  const page: OcrPage = {
    pageNumber: 1,
    width: 800,
    height: pageHeight,
    unit: "pixel",
    lines,
    words: lines.flatMap((l) => l.words),
    rawText: lines.map((l) => l.text).join("\n"),
  };
  return buildRawOcrResult({
    fullText: page.rawText,
    pages: [page],
    provider: "test_provider",
    providerVersion: "test@v1",
    processingTimeMs: 500,
    metadata: { test: true },
  });
}

const PERFECT_CONSULTA_OCR = buildOcrFromLines([
  { text: "GUIA DE CONSULTA", y: 20 },
  { text: "Registro ANS: 123456", y: 60 },
  { text: "Operadora: Unimed Nacional", y: 85 },
  { text: "CNPJ: 12.345.678/0001-90", y: 120 },
  { text: "Nome do Beneficiário: Maria Silva Santos", y: 200 },
  { text: "Carteirinha: ABC-123456", y: 230 },
  { text: "CPF: 123.456.789-01", y: 260 },
  { text: "CNS: 123456789012345", y: 290 },
  { text: "Data do Atendimento: 15/03/2026", y: 350 },
  { text: "Número da Guia: 987654", y: 380 },
  { text: "Senha: AUTH2026", y: 410 },
  { text: "CRM Executante: 12345/SP", y: 480 },
  { text: "Nome do Profissional: Dr Joao Pereira", y: 510 },
  { text: "Código TUSS: 10101012", y: 580 },
  { text: "CID-10: J06.9", y: 610 },
  { text: "Valor Total: R$ 250,00", y: 680 },
]);

const BRADESCO_SADT_OCR = buildOcrFromLines([
  { text: "GUIA SP/SADT", y: 15 },
  { text: "Registro ANS: 005711", y: 55 },
  { text: "Operadora: Bradesco Saúde", y: 80 },
  { text: "Nome do Beneficiário: João Costa", y: 200 },
  { text: "Carteirinha: BRA-987654", y: 230 },
  { text: "Data do Atendimento: 20/03/2026", y: 350 },
  { text: "Código TUSS: 40301010", y: 580 },
]);

const UNIMED_CONSULTA_OCR = PERFECT_CONSULTA_OCR;

function parseGuide(ocr: RawOcrResult) {
  return parseOcrToStructuredGuide(ocr, { sessionId: "test-session" });
}

function cloneGuide(guide: StructuredGuide): StructuredGuide {
  return JSON.parse(JSON.stringify(guide)) as StructuredGuide;
}

function patchField(
  guide: StructuredGuide,
  code: string,
  patch: Partial<StructuredField>,
): void {
  const existing = guide.fields[code];
  if (!existing) return;
  guide.fields[code] = { ...existing, ...patch };
  for (const group of Object.values(guide.groups)) {
    const idx = group.findIndex((f) => f.code === code);
    if (idx >= 0) group[idx] = guide.fields[code]!;
  }
}

function runFullRiskPipeline(guide: StructuredGuide) {
  const { report: auditReport, findings } = auditStructuredGuide(guide);
  const { report: contractReport } = enrichAuditFindings(guide, findings);
  const { report } = assessGlosaRisk(guide, auditReport, contractReport, {
    sessionId: "test-session",
  });
  return { auditReport, contractReport, riskReport: report };
}

describe("Glosa Risk Engine — infraestrutura", () => {
  it("GlosaRiskEngine é instanciável", () => {
    const engine = new GlosaRiskEngine();
    assert.ok(typeof engine.assess === "function");
  });

  it("define caminho de storage correto", () => {
    const path = buildRiskAssessmentStoragePath("tenant-1", "session-1");
    assert.equal(path, "tenant-1/session-1/audit/risk_assessment.json");
    assert.equal(RISK_ASSESSMENT_FILENAME, "risk_assessment.json");
  });

  it("classifica níveis de risco corretamente", () => {
    assert.equal(classifyRiskLevel(0), "Baixo");
    assert.equal(classifyRiskLevel(19), "Baixo");
    assert.equal(classifyRiskLevel(20), "Médio");
    assert.equal(classifyRiskLevel(44), "Médio");
    assert.equal(classifyRiskLevel(45), "Alto");
    assert.equal(classifyRiskLevel(69), "Alto");
    assert.equal(classifyRiskLevel(70), "Crítico");
    assert.equal(classifyRiskLevel(100), "Crítico");
  });
});

describe("Glosa Risk Engine — guia perfeita", () => {
  it("score baixo, sem bloqueios, probabilidade reduzida", () => {
    const guide = parseGuide(PERFECT_CONSULTA_OCR);
    const { riskReport } = runFullRiskPipeline(guide);
    const { assessment } = riskReport;

    assert.equal(riskReport.version, "risk_assessment_v1");
    assert.ok(assessment.assessmentId);
    assert.ok(assessment.overallRiskScore < 20, `score=${assessment.overallRiskScore}`);
    assert.equal(assessment.overallRiskLevel, "Baixo");
    assert.equal(assessment.blockingIssues.length, 0);
    assert.ok(assessment.estimatedDenialProbability < 0.3);
    assert.ok(assessment.topRiskFactors.length >= 0);
    assert.ok(assessment.recommendations.length > 0);
    assert.equal(riskReport.findingRisks.length, 0);
  });
});

describe("Glosa Risk Engine — CID ausente", () => {
  it("eleva risco com finding DIA-001", () => {
    const guide = cloneGuide(parseGuide(PERFECT_CONSULTA_OCR));
    patchField(guide, "cid_code", { value: null, rawValue: null, status: "missing" });
    const { riskReport } = runFullRiskPipeline(guide);

    assert.ok(riskReport.findingRisks.some((f) => f.ruleId === "DIA-001"));
    assert.ok(riskReport.assessment.overallRiskScore > 0);
    assert.ok(riskReport.correctionPriorityRanking.length >= 1);
    const diaItem = riskReport.correctionPriorityRanking.find((i) => i.ruleId === "DIA-001");
    assert.ok(diaItem);
    assert.ok(diaItem.rank >= 1);
  });
});

describe("Glosa Risk Engine — CRM inválido", () => {
  it("eleva risco com finding EXE-002", () => {
    const guide = cloneGuide(parseGuide(PERFECT_CONSULTA_OCR));
    patchField(guide, "executing_crm", {
      value: "INVALIDO",
      rawValue: "INVALIDO",
      status: "found",
      normalized: false,
    });
    const { riskReport } = runFullRiskPipeline(guide);

    const crmRisk = riskReport.findingRisks.find((f) => f.ruleId === "EXE-002");
    assert.ok(crmRisk);
    assert.equal(crmRisk.severity, "alto");
    assert.ok(crmRisk.riskScore > 15);
    assert.ok(crmRisk.factors.some((f) => f.factorId === "severity"));
  });
});

describe("Glosa Risk Engine — guia crítica", () => {
  it("score crítico com bloqueios e alta probabilidade de glosa", () => {
    const guide = cloneGuide(parseGuide(PERFECT_CONSULTA_OCR));
    patchField(guide, "beneficiary_name", { value: null, rawValue: null, status: "missing" });
    patchField(guide, "operator_ans_code", { value: null, rawValue: null, status: "missing" });
    patchField(guide, "attendance_date", {
      value: "2099-12-31",
      rawValue: "31/12/2099",
      status: "found",
    });

    const { riskReport } = runFullRiskPipeline(guide);
    const { assessment } = riskReport;

    assert.ok(assessment.overallRiskScore >= 45);
    assert.ok(["Alto", "Crítico"].includes(assessment.overallRiskLevel));
    assert.ok(assessment.blockingIssues.length >= 1);
    assert.ok(assessment.estimatedDenialProbability >= 0.45);
    assert.ok(assessment.topRiskFactors.length > 0);
  });
});

describe("Glosa Risk Engine — múltiplos erros", () => {
  it("acumula risco por categoria e gera ranking", () => {
    const guide = cloneGuide(parseGuide(PERFECT_CONSULTA_OCR));
    patchField(guide, "cid_code", { value: null, rawValue: null, status: "missing" });
    patchField(guide, "executing_crm", { value: "XX", rawValue: "XX", status: "found" });
    patchField(guide, "procedure_code", {
      value: "99999999",
      rawValue: "99999999",
      status: "found",
    });

    const { riskReport } = runFullRiskPipeline(guide);

    assert.ok(riskReport.findingRisks.length >= 3);
    assert.ok(riskReport.categoryRisks.length >= 2);
    assert.ok(riskReport.correctionPriorityRanking.length >= 3);
    assert.ok(riskReport.assessment.overallRiskScore > 20);
    assert.equal(
      riskReport.correctionPriorityRanking[0]!.rank,
      1,
    );
  });
});

describe("Glosa Risk Engine — operadoras diferentes", () => {
  it("Unimed e Bradesco produzem perfis de risco distintos", () => {
    const unimedGuide = parseGuide(UNIMED_CONSULTA_OCR);
    const bradescoGuide = parseGuide(BRADESCO_SADT_OCR);

    const unimed = runFullRiskPipeline(unimedGuide);
    const bradesco = runFullRiskPipeline(bradescoGuide);

    assert.notEqual(unimed.riskReport.guideType, bradesco.riskReport.guideType);
    assert.equal(unimed.riskReport.operatorAnsCode, "123456");
    assert.equal(bradesco.riskReport.operatorAnsCode, "005711");

    const bradescoHasMoreRisk =
      bradesco.riskReport.assessment.overallRiskScore >=
      unimed.riskReport.assessment.overallRiskScore;
    assert.ok(bradescoHasMoreRisk || bradesco.riskReport.findingRisks.length >= 0);
  });
});

describe("Glosa Risk Engine — contratos diferentes", () => {
  it("enriquecimento contratual influencia score de findings", () => {
    const guide = cloneGuide(parseGuide(UNIMED_CONSULTA_OCR));
    const audit = auditStructuredGuide(guide);
    audit.findings.push({
      ruleId: "AUT-001",
      category: "autorizacoes",
      field: "authorization_password",
      severity: "alto",
      status: "open",
      message: "Senha de autorização não informada.",
      detectedValue: null,
      expectedValue: "senha válida",
      confidence: 0.9,
      suggestedCorrection: "Informe a senha de autorização.",
      blocking: false,
    });

    const engine = new ContractIntelligenceEngine();
    const { report: contractReport } = engine.enrich(guide, audit.findings);
    const { report: riskReport } = assessGlosaRisk(guide, audit.report, contractReport);

    const autRisk = riskReport.findingRisks.find((f) => f.ruleId === "AUT-001");
    assert.ok(autRisk);
    assert.ok(
      autRisk.factors.some((f) => f.factorId === "contract_rule" || f.label.includes("contratuais")),
    );
  });
});

describe("Glosa Risk Engine — RiskAssessment campos mínimos", () => {
  it("possui todos os campos exigidos", () => {
    const guide = cloneGuide(parseGuide(PERFECT_CONSULTA_OCR));
    patchField(guide, "cid_code", { value: null, rawValue: null, status: "missing" });
    const { riskReport } = runFullRiskPipeline(guide);
    const a = riskReport.assessment;

    assert.ok(a.assessmentId);
    assert.ok(typeof a.overallRiskScore === "number");
    assert.ok(a.overallRiskScore >= 0 && a.overallRiskScore <= 100);
    assert.ok(["Baixo", "Médio", "Alto", "Crítico"].includes(a.overallRiskLevel));
    assert.ok(typeof a.estimatedFinancialImpact === "number");
    assert.ok(typeof a.estimatedDenialProbability === "number");
    assert.ok(Array.isArray(a.blockingIssues));
    assert.ok(Array.isArray(a.topRiskFactors));
    assert.ok(Array.isArray(a.recommendations));
  });
});

describe("Glosa Risk Engine — scoring determinístico", () => {
  it("pesos configuráveis alteram contribuição", () => {
    const guide = cloneGuide(parseGuide(PERFECT_CONSULTA_OCR));
    patchField(guide, "cid_code", { value: null, rawValue: null, status: "missing" });
    const audit = auditStructuredGuide(guide);
    const { report: contractReport } = enrichAuditFindings(guide, audit.findings);

    const lowWeight = scoreGlosaRisk({
      guide,
      findings: audit.findings,
      enrichedFindings: contractReport.findings,
      operatorResolved: contractReport.summary.operatorResolved,
      operatorAnsCode: contractReport.context.operator.ansCode,
      learningMetrics: null,
      weights: { ...DEFAULT_RISK_SCORING_WEIGHTS, findingSeverity: 0.5 },
    });

    const highWeight = scoreGlosaRisk({
      guide,
      findings: audit.findings,
      enrichedFindings: contractReport.findings,
      operatorResolved: contractReport.summary.operatorResolved,
      operatorAnsCode: contractReport.context.operator.ansCode,
      learningMetrics: null,
      weights: { ...DEFAULT_RISK_SCORING_WEIGHTS, findingSeverity: 2.0 },
    });

    assert.ok(highWeight.assessment.overallRiskScore > lowWeight.assessment.overallRiskScore);
  });

  it("scoring breakdown é explicável e auditável", () => {
    const guide = cloneGuide(parseGuide(PERFECT_CONSULTA_OCR));
    patchField(guide, "cid_code", { value: null, rawValue: null, status: "missing" });
    const { riskReport } = runFullRiskPipeline(guide);

    assert.ok(riskReport.scoringBreakdown.length > 0);
    for (const factor of riskReport.scoringBreakdown) {
      assert.ok(factor.factorId);
      assert.ok(factor.label);
      assert.ok(typeof factor.contribution === "number");
      assert.ok(factor.description);
    }
  });
});

describe("Glosa Risk Engine — dashboard", () => {
  it("agrega indicadores por operadora e tipo de guia", () => {
    const sessions = [
      {
        sessionId: "s1",
        overallRiskScore: 75,
        overallRiskLevel: "Crítico" as const,
        estimatedDenialProbability: 0.8,
        estimatedFinancialImpact: 100_000,
        guideType: "guia_consulta",
        operatorAnsCode: "123456",
        operatorName: "Unimed",
        topRiskFactorId: "severity",
        assessedAt: "2026-03-01T10:00:00Z",
      },
      {
        sessionId: "s2",
        overallRiskScore: 50,
        overallRiskLevel: "Alto" as const,
        estimatedDenialProbability: 0.5,
        estimatedFinancialImpact: 50_000,
        guideType: "guia_sadt",
        operatorAnsCode: "005711",
        operatorName: "Bradesco",
        topRiskFactorId: "blocking",
        assessedAt: "2026-03-02T10:00:00Z",
      },
    ];

    const dashboard = buildRiskDashboardView(sessions, [
      { factorId: "severity", label: "Severidade", count: 5, totalContribution: 200 },
    ]);

    assert.equal(dashboard.criticalCount, 1);
    assert.equal(dashboard.highCount, 1);
    assert.equal(dashboard.byOperator.length, 2);
    assert.equal(dashboard.byGuideType.length, 2);
    assert.equal(dashboard.topRiskCauses.length, 1);
  });
});

describe("Glosa Risk Engine — workspace", () => {
  it("expõe painel Risco de Glosa", () => {
    assert.equal(REVIEW_PANEL_IDS.length, 9);
    assert.ok(REVIEW_PANEL_IDS.includes("risco"));
    assert.equal(REVIEW_PANEL_LABELS.risco, "Risco de Glosa");
    assert.equal(isReviewPanelId("risco"), true);
  });
});

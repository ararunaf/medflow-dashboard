#!/usr/bin/env node
/**
 * Testes — Centro Operacional de Processamento (MEDICFLOW-PROCESSING-CENTER-01).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveProcessingQueue, isTerminalQueue } from "../../../src/lib/capture/processing/queue-mapper.ts";
import {
  computePriorityScore,
  sortByPriority,
  isCriticalGuide,
  normalizeRiskScore,
} from "../../../src/lib/capture/processing/prioritizer.ts";
import { applyProcessingFilters, countByQueue } from "../../../src/lib/capture/processing/filters.ts";
import {
  buildProcessingDashboard,
  formatFinancialImpact,
  formatProcessingDuration,
} from "../../../src/lib/capture/processing/dashboard.ts";
import { buildReviewWorkspaceUrl } from "../../../src/lib/capture/processing/processing-center-store.ts";
import type { ProcessingGuideItem } from "../../../src/lib/capture/processing/types.ts";

function makeGuide(overrides: Partial<ProcessingGuideItem> = {}): ProcessingGuideItem {
  return {
    sessionId: "sess-1",
    filename: "guia.pdf",
    queue: "aguardando_revisao",
    status: "REVIEW",
    approvalStatus: "em_revisao",
    operatorName: "Unimed",
    operatorAnsCode: "123456",
    guideType: "consulta",
    riskLevel: "Médio",
    riskScore: 55,
    estimatedFinancialImpact: 1200,
    contractualPriority: 40,
    waitTimeMs: 3_600_000,
    responsibleProfileId: "profile-1",
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-06T10:00:00.000Z",
    priorityScore: 0.5,
    isCritical: false,
    ...overrides,
  };
}

describe("Processing Center — filas operacionais", () => {
  it("mapeia OCR pendente para status OCR_PENDING", () => {
    const queue = resolveProcessingQueue("OCR_PENDING", { ocr: { status: "pending" } });
    assert.equal(queue, "ocr_pendente");
  });

  it("mapeia parser quando OCR concluído", () => {
    const queue = resolveProcessingQueue("OCR_COMPLETED", {
      ocr: { status: "completed" },
      parser: { status: "pending" },
    });
    assert.equal(queue, "parser");
  });

  it("mapeia auditoria quando parser concluído", () => {
    const queue = resolveProcessingQueue("AUDITING", {
      ocr: { status: "completed" },
      parser: { status: "completed" },
      audit: { status: "pending" },
    });
    assert.equal(queue, "auditoria");
  });

  it("mapeia correção quando aguardando correções", () => {
    const queue = resolveProcessingQueue("REVIEW", {
      review: { approvalStatus: "aguardando_correcoes", decisions: [] },
    });
    assert.equal(queue, "correcao");
  });

  it("mapeia aguardando revisão em REVIEW", () => {
    const queue = resolveProcessingQueue("REVIEW", {
      review: { approvalStatus: "em_revisao", decisions: [] },
    });
    assert.equal(queue, "aguardando_revisao");
  });

  it("mapeia aprovadas", () => {
    assert.equal(resolveProcessingQueue("APPROVED", {}), "aprovadas");
    assert.equal(
      resolveProcessingQueue("REVIEW", { review: { approvalStatus: "aprovada", decisions: [] } }),
      "aprovadas",
    );
  });

  it("mapeia reprovadas", () => {
    const queue = resolveProcessingQueue("REVIEW", {
      review: { approvalStatus: "reprovada", decisions: [] },
    });
    assert.equal(queue, "reprovadas");
  });

  it("identifica filas terminais", () => {
    assert.equal(isTerminalQueue("aprovadas"), true);
    assert.equal(isTerminalQueue("ocr_pendente"), false);
  });
});

describe("Processing Center — priorização", () => {
  it("prioriza maior risco financeiro e score", () => {
    const low = makeGuide({
      sessionId: "low",
      riskScore: 20,
      estimatedFinancialImpact: 100,
      priorityScore: computePriorityScore({
        riskScore: 20,
        riskLevel: "Baixo",
        estimatedFinancialImpact: 100,
        contractualPriority: 10,
        waitTimeMs: 1000,
        operatorName: "A",
      }),
    });
    const high = makeGuide({
      sessionId: "high",
      riskScore: 90,
      riskLevel: "Crítico",
      estimatedFinancialImpact: 50_000,
      priorityScore: computePriorityScore({
        riskScore: 90,
        riskLevel: "Crítico",
        estimatedFinancialImpact: 50_000,
        contractualPriority: 80,
        waitTimeMs: 86_400_000,
        operatorName: "B",
      }),
      isCritical: true,
    });

    const sorted = sortByPriority([low, high]);
    assert.equal(sorted[0]!.sessionId, "high");
    assert.ok(sorted[0]!.priorityScore > sorted[1]!.priorityScore);
  });

  it("normaliza score de risco por nível", () => {
    assert.equal(normalizeRiskScore(null, "Crítico"), 1);
    assert.equal(normalizeRiskScore(50, null), 0.5);
  });

  it("detecta guia crítica", () => {
    assert.equal(isCriticalGuide("Crítico", 50), true);
    assert.equal(isCriticalGuide("Baixo", 85), true);
    assert.equal(isCriticalGuide("Baixo", 30), false);
  });
});

describe("Processing Center — filtros", () => {
  const items = [
    makeGuide({ sessionId: "a", operatorName: "Unimed", guideType: "consulta", queue: "parser" }),
    makeGuide({
      sessionId: "b",
      operatorName: "Bradesco Saúde",
      guideType: "sp_sadt",
      queue: "auditoria",
      riskLevel: "Alto",
    }),
    makeGuide({
      sessionId: "c",
      operatorName: "Unimed",
      guideType: "internacao",
      queue: "aprovadas",
      approvalStatus: "aprovada",
    }),
  ];

  it("filtra por operadora", () => {
    const filtered = applyProcessingFilters(items, { operator: "unimed" });
    assert.equal(filtered.length, 2);
  });

  it("filtra por tipo de guia", () => {
    const filtered = applyProcessingFilters(items, { guideType: "sp_sadt" });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]!.sessionId, "b");
  });

  it("filtra por fila ativa", () => {
    const filtered = applyProcessingFilters(items, {}, "parser");
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]!.sessionId, "a");
  });

  it("conta guias por fila", () => {
    const counts = countByQueue(items);
    assert.equal(counts.parser, 1);
    assert.equal(counts.auditoria, 1);
    assert.equal(counts.aprovadas, 1);
  });
});

describe("Processing Center — navegação workspace", () => {
  it("gera URL de retorno ao centro de processamento", () => {
    const url = buildReviewWorkspaceUrl("abc-123", "/processamento", "correcao");
    assert.equal(url, "/captura/revisao/abc-123?returnTo=%2Fprocessamento&queue=correcao");
  });

  it("gera URL sem fila quando omitida", () => {
    const url = buildReviewWorkspaceUrl("abc-123");
    assert.equal(url, "/captura/revisao/abc-123?returnTo=%2Fprocessamento");
  });
});

describe("Processing Center — dashboard operacional", () => {
  it("agrega métricas do dashboard", () => {
    const items = [
      makeGuide({
        isCritical: true,
        estimatedFinancialImpact: 5000,
        queue: "aguardando_revisao",
        operatorName: "Unimed",
      }),
      makeGuide({
        sessionId: "sess-2",
        isCritical: false,
        estimatedFinancialImpact: 2000,
        queue: "aprovadas",
        operatorName: "Unimed",
        createdAt: "2026-07-01T08:00:00.000Z",
        updatedAt: "2026-07-01T12:00:00.000Z",
      }),
      makeGuide({
        sessionId: "sess-3",
        estimatedFinancialImpact: 1000,
        queue: "parser",
        operatorName: "Amil",
      }),
    ];

    const dashboard = buildProcessingDashboard(items);
    assert.equal(dashboard.totalGuides, 3);
    assert.equal(dashboard.criticalGuides, 1);
    assert.equal(dashboard.totalFinancialRisk, 8000);
    assert.equal(dashboard.byOperator.length, 2);
    assert.equal(dashboard.byStatus.length, 7);
    assert.ok(dashboard.averageProcessingTimeMs > 0);
  });

  it("formata impacto financeiro e duração", () => {
    assert.ok(formatFinancialImpact(1500).includes("1.500"));
    assert.equal(formatProcessingDuration(0), "—");
    assert.ok(formatProcessingDuration(3_600_000).includes("1h"));
  });
});

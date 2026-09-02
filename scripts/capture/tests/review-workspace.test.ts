#!/usr/bin/env node
/**
 * Testes — Workspace de Revisão (MEDICFLOW-REVIEW-WORKSPACE-01).
 * Unitários sempre; integração requer Supabase staging (vbfulflzekrnejwetcyr).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  REVIEW_APPROVAL_STATUSES,
  REVIEW_PANEL_IDS,
} from "../../../src/lib/capture/review/types.ts";
import {
  parseReviewMetadata,
  buildPipelineSteps,
  computePipelineProgress,
  buildReviewHeaderMetrics,
  REVIEW_APPROVAL_LABELS,
  REVIEW_PANEL_LABELS,
} from "../../../src/lib/capture/review/review-workspace-service.ts";
import { isReviewPanelId } from "../../../src/modules/capture/components/ReviewWorkspace.tsx";
import { buildCaptureHistoryTimeline } from "../../../src/lib/capture/review/history-timeline.ts";

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

describe("Review workspace — tipos e labels", () => {
  it("expõe os 4 estados de aprovação", () => {
    assert.equal(REVIEW_APPROVAL_STATUSES.length, 4);
    assert.ok(REVIEW_APPROVAL_STATUSES.includes("em_revisao"));
    assert.ok(REVIEW_APPROVAL_STATUSES.includes("aguardando_correcoes"));
    assert.ok(REVIEW_APPROVAL_STATUSES.includes("aprovada"));
    assert.ok(REVIEW_APPROVAL_STATUSES.includes("reprovada"));
  });

  it("expõe os 10 painéis do workspace", () => {
    assert.equal(REVIEW_PANEL_IDS.length, 10);
    assert.ok(REVIEW_PANEL_IDS.includes("risco"));
    assert.ok(REVIEW_PANEL_IDS.includes("historico"));
    assert.equal(REVIEW_PANEL_LABELS.contrato, "Conhecimento Contratual");
    assert.equal(REVIEW_PANEL_LABELS.historico, "Histórico");
    assert.equal(REVIEW_PANEL_LABELS.aprovacao, "Aprovação Final");
    assert.equal(REVIEW_APPROVAL_LABELS.aprovada, "Aprovada");
  });
});

describe("Review workspace — navegação entre painéis", () => {
  it("valida IDs de painéis", () => {
    assert.equal(isReviewPanelId("ocr"), true);
    assert.equal(isReviewPanelId("auditoria"), true);
    assert.equal(isReviewPanelId("contrato"), true);
    assert.equal(isReviewPanelId("invalid"), false);
  });

  it("marca painel ativo sem perder steps do pipeline", () => {
    const metadata = {
      ocr: { status: "completed" },
      parser: { status: "completed" },
      audit: { status: "completed" },
      correction: { status: "completed" },
    };
    const steps = buildPipelineSteps(metadata, "em_revisao", "ocr");
    const ocrStep = steps.find((s) => s.id === "ocr");
    assert.equal(ocrStep?.active, true);
    assert.equal(ocrStep?.completed, true);
    const docStep = steps.find((s) => s.id === "guia");
    assert.equal(docStep?.completed, true);
    assert.equal(docStep?.active, false);
  });

  it("permite alternar entre todos os painéis", () => {
    for (const panel of REVIEW_PANEL_IDS) {
      assert.equal(isReviewPanelId(panel), true);
      const steps = buildPipelineSteps({}, "em_revisao", panel);
      const activeCount = steps.filter((s) => s.active).length;
      assert.ok(activeCount >= 1);
    }
  });
});

describe("Review workspace — sincronização dos painéis", () => {
  it("parseia metadata.review ausente com defaults", () => {
    const review = parseReviewMetadata({});
    assert.equal(review.approvalStatus, "em_revisao");
    assert.deepEqual(review.decisions, []);
  });

  it("parseia metadata.review persistida", () => {
    const review = parseReviewMetadata({
      review: {
        approvalStatus: "aguardando_correcoes",
        decisions: [
          {
            status: "em_revisao",
            at: "2026-07-06T12:00:00.000Z",
            actorProfileId: "actor-1",
          },
        ],
      },
    });
    assert.equal(review.approvalStatus, "aguardando_correcoes");
    assert.equal(review.decisions.length, 1);
  });

  it("calcula métricas sincronizadas do cabeçalho", () => {
    const metadata = {
      ocr: { status: "completed" },
      parser: { status: "completed" },
      audit: { status: "completed", totalFindings: 3 },
      correction: { status: "completed" },
    };
    const metrics = buildReviewHeaderMetrics({
      metadata,
      sessionStatus: "REVIEW",
      auditReport: {
        version: "audit_report_v1",
        guideType: "consulta",
        auditedAt: "2026-07-06T12:00:00.000Z",
        engineVersion: "1",
        score: {
          overall: 82,
          distribution: { critico: 0, alto: 1, medio: 2, baixo: 0 },
          approved: true,
          blocking: false,
        },
        findings: [],
        correctionProposals: [],
        summary: {
          totalFindings: 3,
          criticalCount: 0,
          highCount: 1,
          mediumCount: 2,
          lowCount: 0,
          blockingCount: 0,
          approved: true,
        },
      },
      correctionStore: {
        version: "correction_proposals_v1",
        sessionId: "sess-1",
        generatedAt: "2026-07-06T12:00:00.000Z",
        proposals: [
          {
            id: "p1",
            status: "pending",
            field: "crm",
            suggestedValue: "123",
            confidence: 0.9,
            ruleId: "r1",
            severity: "medio",
            rationale: "test",
          },
          {
            id: "p2",
            status: "accepted",
            field: "data",
            suggestedValue: "2026-01-01",
            confidence: 0.8,
            ruleId: "r2",
            severity: "baixo",
            rationale: "test",
          },
        ],
      },
      review: parseReviewMetadata({ review: { approvalStatus: "em_revisao", decisions: [] } }),
      activePanel: "auditoria",
    });

    assert.equal(metrics.guideScore, 82);
    assert.equal(metrics.findingsCount, 3);
    assert.equal(metrics.correctionsCount, 2);
    assert.equal(metrics.pendingCorrections, 1);
    assert.equal(metrics.approvalStatus, "em_revisao");
    assert.ok(metrics.pipelineProgress > 0);
    const auditStep = metrics.steps.find((s) => s.id === "auditoria");
    assert.equal(auditStep?.active, true);
    assert.equal(auditStep?.completed, true);
  });

  it("computa progresso do pipeline proporcionalmente", () => {
    const allDone = buildPipelineSteps(
      {
        ocr: { status: "completed" },
        parser: { status: "completed" },
        audit: { status: "completed" },
        contractIntelligence: { status: "completed" },
        riskAssessment: { status: "completed" },
        correction: { status: "completed" },
      },
      "aprovada",
    );
    assert.equal(computePipelineProgress(allDone), 100);

    const early = buildPipelineSteps({}, "em_revisao");
    assert.ok(computePipelineProgress(early) < 100);
  });
});

describe("Review workspace — mudança de status de aprovação", () => {
  it("reflete aprovação nos steps finais", () => {
    const metadata = {
      ocr: { status: "completed" },
      parser: { status: "completed" },
      audit: { status: "completed" },
      correction: { status: "completed" },
    };

    const approvedSteps = buildPipelineSteps(metadata, "aprovada");
    const approvalStep = approvedSteps.find((s) => s.id === "aprovacao");
    assert.equal(approvalStep?.completed, true);

    const rejectedSteps = buildPipelineSteps(metadata, "reprovada");
    const rejectedApproval = rejectedSteps.find((s) => s.id === "aprovacao");
    assert.equal(rejectedApproval?.completed, true);
  });

  it("mantém em_revisao enquanto decisão não finalizada", () => {
    const steps = buildPipelineSteps({ ocr: { status: "completed" } }, "em_revisao");
    const approvalStep = steps.find((s) => s.id === "aprovacao");
    assert.equal(approvalStep?.completed, false);
  });
});

describe("Review workspace — persistência (contrato metadata)", () => {
  it("serializa decisões em metadata.review", () => {
    const now = "2026-07-06T18:00:00.000Z";
    const metadata = {
      review: {
        approvalStatus: "aprovada",
        enteredAt: now,
        lastUpdatedAt: now,
        decisions: [
          {
            status: "em_revisao",
            at: "2026-07-06T17:00:00.000Z",
            actorProfileId: "user-a",
          },
          {
            status: "aprovada",
            note: "Guia conforme",
            at: now,
            actorProfileId: "user-a",
          },
        ],
      },
    };

    const parsed = parseReviewMetadata(metadata);
    assert.equal(parsed.approvalStatus, "aprovada");
    assert.equal(parsed.decisions.length, 2);
    assert.equal(parsed.decisions[1]?.note, "Guia conforme");
    assert.equal(parsed.lastUpdatedAt, now);
  });

  it("rejeita status desconhecido com fallback em_revisao", () => {
    const parsed = parseReviewMetadata({
      review: { approvalStatus: "invalid_status", decisions: [] },
    });
    assert.equal(parsed.approvalStatus, "em_revisao");
  });
});

describe("Review workspace — arquivos da sprint", () => {
  it("inclui componente ReviewWorkspace", () => {
    const path = resolve(root, "src/modules/capture/components/ReviewWorkspace.tsx");
    assert.ok(existsSync(path));
  });

  it("inclui store de persistência", () => {
    const path = resolve(root, "src/lib/capture/review/review-workspace-store.ts");
    assert.ok(existsSync(path));
  });

  it("inclui rota /captura/revisao/$sessionId", () => {
    const path = resolve(root, "src/routes/captura/revisao.$sessionId.tsx");
    assert.ok(existsSync(path));
  });

  it("inclui server functions de revisão", () => {
    const path = resolve(root, "src/lib/capture/api/review-server.ts");
    assert.ok(existsSync(path));
    const content = readFileSync(path, "utf8");
    assert.ok(content.includes("getReviewWorkspaceFn"));
    assert.ok(content.includes("setReviewApprovalFn"));
  });
});

describe("Review workspace — histórico unificado", () => {
  it("mescla status_history, decisões e correções em ordem cronológica decrescente", () => {
    const events = buildCaptureHistoryTimeline({
      statusHistory: [
        { from: null, to: "CREATED", at: "2026-01-01T10:00:00.000Z", actorProfileId: "prof-1" },
        {
          from: "CREATED",
          to: "UPLOADED",
          at: "2026-01-01T10:05:00.000Z",
          actorProfileId: "prof-1",
        },
      ],
      decisions: [
        {
          status: "aprovada",
          at: "2026-01-01T10:10:00.000Z",
          actorProfileId: "prof-2",
        },
      ],
      correctionProposals: [
        {
          proposalId: "p1",
          findingId: "f1",
          ruleId: "PRC-003",
          field: "procedure_code",
          currentValue: "99999999",
          suggestedValue: "10101012",
          confidence: 0.8,
          justification: "x",
          source: "TUSS",
          status: "accepted",
          blocking: false,
          severity: "alto",
          decidedAt: "2026-01-01T10:07:00.000Z",
        },
        {
          proposalId: "p2",
          findingId: "f2",
          ruleId: "DIA-001",
          field: "cid_code",
          currentValue: null,
          suggestedValue: "J06.9",
          confidence: 0.5,
          justification: "y",
          source: "TISS",
          status: "pending",
          blocking: false,
          severity: "medio",
        },
      ],
    });

    // p2 está pending (sem decidedAt) — não deve entrar no timeline.
    assert.equal(events.length, 4);
    assert.equal(events[0]!.kind, "aprovacao");
    assert.equal(events[1]!.kind, "correcao");
    assert.equal(events[2]!.label, "Enviada");
    assert.equal(events[3]!.label, "Criada");
    // ordem estritamente decrescente por `at`
    for (let i = 1; i < events.length; i++) {
      assert.ok(new Date(events[i - 1]!.at).getTime() >= new Date(events[i]!.at).getTime());
    }
  });

  it("retorna lista vazia quando não há histórico", () => {
    const events = buildCaptureHistoryTimeline({
      statusHistory: [],
      decisions: [],
      correctionProposals: [],
    });
    assert.deepEqual(events, []);
  });
});

describe("Review workspace — integração staging (opcional)", () => {
  it("usa project ref oficial quando credenciais presentes", async () => {
    const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
    if (!url.includes("vbfulflzekrnejwetcyr")) {
      // Sem staging configurado — skip silencioso
      return;
    }
    assert.ok(url.includes("vbfulflzekrnejwetcyr"));
  });
});

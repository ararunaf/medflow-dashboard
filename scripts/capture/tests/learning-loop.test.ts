#!/usr/bin/env node
/**
 * Testes — MEDICFLOW-LEARNING-LOOP-01
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRawOcrResult } from "../../../src/lib/capture/ocr/providers/shared.ts";
import type { OcrLine, OcrPage, RawOcrResult } from "../../../src/lib/capture/ocr/types/raw-ocr-result.ts";
import { auditStructuredGuide } from "../../../src/lib/capture/audit/index.ts";
import { parseOcrToStructuredGuide } from "../../../src/lib/capture/parser/index.ts";
import type { StructuredField, StructuredGuide } from "../../../src/lib/capture/parser/types/structured-guide.ts";
import {
  generateCorrectionProposals,
  decideProposalInStore,
  CORRECTION_ENGINE_VERSION,
  type CorrectionProposal,
  type CorrectionProposalStore,
} from "../../../src/lib/capture/correction/index.ts";
import {
  LearningLoopEngine,
  LEARNING_ENGINE_VERSION,
  buildLearningId,
  proposalToLearningRecord,
  appendRecordIfNew,
  appendRecordsIfNew,
  calculateRuleMetrics,
  calculateFieldMetrics,
  calculateTemporalEvolution,
  calculateMetricsFromRecords,
  buildEmptyRecordsStore,
  extractDecidedRecordsFromStore,
  LEARNING_RECORDS_FILENAME,
  LEARNING_METRICS_FILENAME,
  buildLearningRecordsStoragePath,
  buildLearningMetricsStoragePath,
  generateRecommendations,
  buildDashboardView,
} from "../../../src/lib/capture/learning/index.ts";
import type { LearningRecord, LearningRecordsStore } from "../../../src/lib/capture/learning/index.ts";

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

const CONSULTA_OCR = buildOcrFromLines([
  { text: "GUIA DE CONSULTA", y: 20 },
  { text: "Registro ANS: 123456", y: 60 },
  { text: "Operadora: Unimed Nacional", y: 85 },
  { text: "CNPJ: 12.345.678/0001-90", y: 120 },
  { text: "Nome do Beneficiário: Maria Silva Santos", y: 200 },
  { text: "Carteirinha: ABC-123456", y: 230 },
  { text: "CPF: 123.456.789-01", y: 260 },
  { text: "Data do Atendimento: 15/03/2026", y: 350 },
  { text: "CRM Executante: 12345/SP", y: 480 },
  { text: "Nome do Profissional: Dr Joao Pereira", y: 510 },
  { text: "Código TUSS: 10101012", y: 580 },
  { text: "CID-10: J06.9", y: 610 },
  { text: "Valor Total: R$ 250,00", y: 680 },
]);

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

function buildCorrectionStore(
  proposals: CorrectionProposal[],
  sessionId = "sess-learning",
): CorrectionProposalStore {
  return {
    version: "correction_proposals_v1",
    sessionId,
    generatedAt: "2026-07-06T10:00:00.000Z",
    engineVersion: CORRECTION_ENGINE_VERSION,
    proposals,
  };
}

function buildLearningStore(records: LearningRecord[], tenantId = "tenant-1"): LearningRecordsStore {
  return {
    version: "learning_records_v1",
    tenantId,
    updatedAt: new Date().toISOString(),
    engineVersion: LEARNING_ENGINE_VERSION,
    records,
  };
}

function decideProposal(
  store: CorrectionProposalStore,
  proposalId: string,
  action: "accept" | "edit" | "reject",
  editedValue?: string,
): CorrectionProposal {
  return decideProposalInStore(store, { proposalId, action, editedValue });
}

const perfectGuide = parseOcrToStructuredGuide(CONSULTA_OCR);
const engine = new LearningLoopEngine();

describe("Learning Loop — Infraestrutura", () => {
  it("LearningLoopEngine é instanciável", async () => {
    assert.ok(typeof engine.proposalToRecord === "function");
    assert.ok(typeof engine.calculateMetrics === "function");
  });

  it("paths seguem convenção tenant/learning/", async () => {
    assert.equal(
      buildLearningRecordsStoragePath("tenant-abc"),
      "tenant-abc/learning/learning_records.json",
    );
    assert.equal(
      buildLearningMetricsStoragePath("tenant-abc"),
      "tenant-abc/learning/learning_metrics.json",
    );
    assert.equal(LEARNING_RECORDS_FILENAME, "learning_records.json");
    assert.equal(LEARNING_METRICS_FILENAME, "learning_metrics.json");
  });

  it("módulos existem no filesystem", async () => {
    const base = resolve(root, "src/lib/capture/learning");
    assert.ok(existsSync(resolve(base, "engine/learning-loop-engine.ts")));
    assert.ok(existsSync(resolve(base, "engine/recommendation-engine.ts")));
    assert.ok(existsSync(resolve(base, "services/learning-loop-service.ts")));
    assert.ok(existsSync(resolve(base, "infrastructure/learning-storage.ts")));
    assert.ok(existsSync(resolve(root, "src/modules/capture/components/CaptureLearningPanel.tsx")));
  });
});

describe("Learning Loop — Registro de aceitação", () => {
  it("converte proposta aceita em LearningRecord", async () => {
    const guide = cloneGuide(perfectGuide);
    patchField(guide, "cid_code", { value: null, rawValue: null, status: "missing" });
    const proposals = generateCorrectionProposals((await auditStructuredGuide(guide)).findings, "sess-1");
    const store = buildCorrectionStore(proposals);
    const accepted = decideProposal(store, proposals[0]!.proposalId, "accept");

    const record = proposalToLearningRecord(accepted, "sess-1", store.generatedAt);
    assert.ok(record);
    assert.equal(record!.learningId, buildLearningId(accepted.proposalId));
    assert.equal(record!.action, "accept");
    assert.equal(record!.accepted, true);
    assert.equal(record!.edited, false);
    assert.equal(record!.rejected, false);
    assert.equal(record!.finalValue, accepted.suggestedValue);
    assert.ok(record!.timestamp);
    assert.ok(typeof record!.confidence === "number");
    assert.ok((record!.timeToDecisionMs ?? 0) >= 0);
  });
});

describe("Learning Loop — Registro de edição", () => {
  it("converte proposta editada em LearningRecord", async () => {
    const guide = cloneGuide(perfectGuide);
    patchField(guide, "cid_code", { value: null, rawValue: null, status: "missing" });
    const proposals = generateCorrectionProposals((await auditStructuredGuide(guide)).findings, "sess-edit");
    const store = buildCorrectionStore(proposals);
    const edited = decideProposal(store, proposals[0]!.proposalId, "edit", "J06.9");

    const record = proposalToLearningRecord(edited, "sess-edit", store.generatedAt);
    assert.ok(record);
    assert.equal(record!.action, "edit");
    assert.equal(record!.edited, true);
    assert.equal(record!.finalValue, "J06.9");
  });
});

describe("Learning Loop — Registro de rejeição", () => {
  it("converte proposta rejeitada em LearningRecord", async () => {
    const guide = cloneGuide(perfectGuide);
    patchField(guide, "cid_code", { value: null, rawValue: null, status: "missing" });
    const proposals = generateCorrectionProposals((await auditStructuredGuide(guide)).findings, "sess-reject");
    const store = buildCorrectionStore(proposals);
    const rejected = decideProposal(store, proposals[0]!.proposalId, "reject");

    const record = proposalToLearningRecord(rejected, "sess-reject", store.generatedAt);
    assert.ok(record);
    assert.equal(record!.action, "reject");
    assert.equal(record!.rejected, true);
    assert.equal(record!.finalValue, rejected.currentValue);
  });
});

describe("Learning Loop — Múltiplas decisões", () => {
  it("registra múltiplas decisões sem duplicar", async () => {
    const guide = cloneGuide(perfectGuide);
    patchField(guide, "cid_code", { value: null, rawValue: null, status: "missing" });
    patchField(guide, "executing_crm", { value: "XX", rawValue: "XX", status: "found" });
    const proposals = generateCorrectionProposals(
      (await auditStructuredGuide(guide)).findings,
      "sess-multi",
    );
    const store = buildCorrectionStore(proposals);

    const accepted = decideProposal(store, proposals[0]!.proposalId, "accept");
    const rejected = decideProposal(store, proposals[1]!.proposalId, "reject");

    const updatedProposals = proposals.map((p) => {
      if (p.proposalId === accepted.proposalId) return accepted;
      if (p.proposalId === rejected.proposalId) return rejected;
      return p;
    });

    const records = extractDecidedRecordsFromStore(
      "sess-multi",
      updatedProposals,
      store.generatedAt,
    );
    assert.equal(records.length, 2);

    let learningStore = buildEmptyRecordsStore("tenant-1");
    learningStore = appendRecordsIfNew(learningStore, records);
    assert.equal(learningStore.records.length, 2);

    const duplicate = appendRecordIfNew(learningStore, records[0]!);
    assert.equal(duplicate.records.length, 2);
  });
});

describe("Learning Loop — Cálculo de métricas", () => {
  it("calcula taxas globais e por regra", async () => {
    const guide = cloneGuide(perfectGuide);
    patchField(guide, "cid_code", { value: null, rawValue: null, status: "missing" });
    patchField(guide, "executing_crm", { value: "XX", rawValue: "XX", status: "found" });
    patchField(guide, "procedure_code", {
      value: "99999999",
      rawValue: "99999999",
      status: "found",
    });
    const proposals = generateCorrectionProposals(
      (await auditStructuredGuide(guide)).findings,
      "sess-metrics",
    );
    const store = buildCorrectionStore(proposals);

    const decided = [
      decideProposal(store, proposals[0]!.proposalId, "accept"),
      decideProposal(store, proposals[1]!.proposalId, "reject"),
      decideProposal(store, proposals[2]!.proposalId, "edit", "10101012"),
    ];

    const updatedProposals = proposals.map((p) => {
      const d = decided.find((x) => x.proposalId === p.proposalId);
      return d ?? p;
    });

    const records = extractDecidedRecordsFromStore(
      "sess-metrics",
      updatedProposals,
      store.generatedAt,
    );
    const learningStore = buildLearningStore(records);
    const metrics = calculateMetricsFromRecords(learningStore);

    assert.equal(metrics.totalRecords, records.length);
    assert.ok(metrics.globalAcceptanceRate >= 0 && metrics.globalAcceptanceRate <= 1);
    assert.ok(metrics.globalEditRate >= 0 && metrics.globalEditRate <= 1);
    assert.ok(metrics.globalRejectRate >= 0 && metrics.globalRejectRate <= 1);
    assert.ok(metrics.byRule.length >= 1);
    assert.ok(metrics.byField.length >= 1);
    assert.ok(metrics.temporalEvolution.length >= 1);

    const ruleMetrics = calculateRuleMetrics(records);
    for (const rm of ruleMetrics) {
      assert.ok(rm.usageCount >= 1);
      assert.ok(typeof rm.acceptanceRate === "number");
      assert.ok(typeof rm.editRate === "number");
      assert.ok(typeof rm.rejectRate === "number");
      assert.ok(typeof rm.falsePositiveRate === "number");
      assert.ok(typeof rm.averageConfidence === "number");
      assert.equal(rm.falsePositiveRate, rm.rejectRate);
    }

    const fieldMetrics = calculateFieldMetrics(records);
    assert.ok(fieldMetrics.length >= 1);

    const temporal = calculateTemporalEvolution(records);
    assert.ok(temporal.every((b) => b.total === b.accepted + b.edited + b.rejected));
  });
});

describe("Learning Loop — Persistência (modelo JSON)", () => {
  it("store serializa com version learning_records_v1", async () => {
    const guide = cloneGuide(perfectGuide);
    patchField(guide, "cid_code", { value: null, rawValue: null, status: "missing" });
    const proposals = generateCorrectionProposals((await auditStructuredGuide(guide)).findings, "sess-json");
    const store = buildCorrectionStore(proposals);
    const accepted = decideProposal(store, proposals[0]!.proposalId, "accept");
    const record = proposalToLearningRecord(accepted, "sess-json", store.generatedAt)!;
    const learningStore = buildLearningStore([record]);

    const json = JSON.parse(JSON.stringify(learningStore)) as LearningRecordsStore;
    assert.equal(json.version, "learning_records_v1");
    assert.equal(json.engineVersion, LEARNING_ENGINE_VERSION);
    assert.equal(json.records.length, 1);
    assert.ok(json.records[0]!.learningId);
    assert.ok(json.records[0]!.proposalId);
    assert.ok(json.records[0]!.ruleId);
    assert.ok(json.records[0]!.field);
  });

  it("metrics serializa com version learning_metrics_v1", () => {
    const store = buildLearningStore([]);
    const metrics = calculateMetricsFromRecords(store);
    const json = JSON.parse(JSON.stringify(metrics));
    assert.equal(json.version, "learning_metrics_v1");
    assert.equal(json.engineVersion, LEARNING_ENGINE_VERSION);
    assert.equal(json.totalRecords, 0);
  });
});

describe("Learning Loop — Recomendações", () => {
  it("gera recomendações observacionais", () => {
    const records: LearningRecord[] = [
      {
        learningId: "lr-1",
        sessionId: "s1",
        proposalId: "p1",
        ruleId: "DIA-001",
        field: "cid_code",
        action: "reject",
        originalValue: null,
        suggestedValue: "J06.9",
        finalValue: null,
        confidence: 0.3,
        accepted: false,
        edited: false,
        rejected: true,
        timestamp: "2026-07-06T12:00:00.000Z",
      },
      {
        learningId: "lr-2",
        sessionId: "s1",
        proposalId: "p2",
        ruleId: "DIA-001",
        field: "cid_code",
        action: "reject",
        originalValue: null,
        suggestedValue: "J06.8",
        finalValue: null,
        confidence: 0.35,
        accepted: false,
        edited: false,
        rejected: true,
        timestamp: "2026-07-06T12:01:00.000Z",
      },
      {
        learningId: "lr-3",
        sessionId: "s2",
        proposalId: "p3",
        ruleId: "EXE-002",
        field: "executing_crm",
        action: "accept",
        originalValue: "XX",
        suggestedValue: "12345/SP",
        finalValue: "12345/SP",
        confidence: 0.9,
        accepted: true,
        edited: false,
        rejected: false,
        timestamp: "2026-07-06T12:02:00.000Z",
      },
      {
        learningId: "lr-4",
        sessionId: "s2",
        proposalId: "p4",
        ruleId: "PRC-003",
        field: "procedure_code",
        action: "edit",
        originalValue: "99999999",
        suggestedValue: "10101012",
        finalValue: "10101020",
        confidence: 0.6,
        accepted: false,
        edited: true,
        rejected: false,
        timestamp: "2026-07-06T12:03:00.000Z",
      },
    ];

    const metrics = calculateMetricsFromRecords(buildLearningStore(records));
    const recommendations = generateRecommendations(metrics);

    assert.ok(recommendations.length >= 1);
    const messages = recommendations.map((r) => r.message);
    assert.ok(
      messages.some((m) => m.includes("DIA-001") && m.includes("baixa aceitação")),
      `Esperava recomendação de baixa aceitação DIA-001, got: ${messages.join("; ")}`,
    );
    assert.ok(
      messages.some((m) => m.includes("CRM") && m.includes("alta confiança")),
      `Esperava recomendação CRM alta confiança, got: ${messages.join("; ")}`,
    );
    assert.ok(
      messages.some((m) => m.includes("TUSS") && m.includes("editadas")),
      `Esperava recomendação TUSS editadas, got: ${messages.join("; ")}`,
    );
  });

  it("dashboard agrega rankings e recomendações", async () => {
    const records: LearningRecord[] = [
      {
        learningId: "lr-a",
        sessionId: "s1",
        proposalId: "p1",
        ruleId: "DIA-001",
        field: "cid_code",
        action: "accept",
        originalValue: null,
        suggestedValue: "J06.9",
        finalValue: "J06.9",
        confidence: 0.8,
        accepted: true,
        edited: false,
        rejected: false,
        timestamp: "2026-07-06T10:00:00.000Z",
      },
    ];
    const metrics = calculateMetricsFromRecords(buildLearningStore(records));
    const dashboard = buildDashboardView(metrics);

    assert.ok(dashboard.metrics);
    assert.ok(Array.isArray(dashboard.recommendations));
    assert.ok(Array.isArray(dashboard.topAcceptedRules));
    assert.ok(Array.isArray(dashboard.topRejectedRules));
    assert.ok(Array.isArray(dashboard.topEditedFields));
  });
});

describe("Learning Loop — Dashboard (componente)", () => {
  it("CaptureLearningPanel exporta componente React", async () => {
    const mod = await import("../../../src/modules/capture/components/CaptureLearningPanel.tsx");
    assert.ok(typeof mod.CaptureLearningPanel === "function");
  });
});

describe("Learning Loop — Campos mínimos LearningRecord", () => {
  it("possui todos os campos exigidos", async () => {
    const guide = cloneGuide(perfectGuide);
    patchField(guide, "cid_code", { value: null, rawValue: null, status: "missing" });
    const proposals = generateCorrectionProposals((await auditStructuredGuide(guide)).findings, "sess-fields");
    const store = buildCorrectionStore(proposals);
    const accepted = decideProposal(store, proposals[0]!.proposalId, "accept");
    const record = proposalToLearningRecord(accepted, "sess-fields", store.generatedAt)!;

    const required = [
      "learningId",
      "proposalId",
      "ruleId",
      "field",
      "action",
      "originalValue",
      "suggestedValue",
      "finalValue",
      "confidence",
      "accepted",
      "edited",
      "rejected",
      "timestamp",
    ] as const;

    for (const key of required) {
      assert.ok(key in record, `campo ausente: ${key}`);
    }
  });
});
#!/usr/bin/env node
/**
 * Testes — MEDICFLOW-CORRECTION-ASSISTANT-01
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
import type { AuditFinding } from "../../../src/lib/capture/audit/types/audit-finding.ts";
import {
  CorrectionProposalEngine,
  generateCorrectionProposals,
  buildFindingId,
  buildProposalId,
  CORRECTION_ENGINE_VERSION,
  CORRECTION_PROPOSALS_FILENAME,
  buildCorrectionProposalsStoragePath,
  buildCorrectionSummaryFromStore,
  decideProposalInStore,
  proposalDecisionEventType,
  type CorrectionProposalStore,
} from "../../../src/lib/capture/correction/index.ts";
import {
  buildCaptureEvent,
  appendCaptureEvent,
} from "../../../src/lib/capture/infrastructure/capture-events.ts";

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

function buildStore(proposals: CorrectionProposalStore["proposals"]): CorrectionProposalStore {
  return {
    version: "correction_proposals_v1",
    sessionId: "sess-test",
    generatedAt: new Date().toISOString(),
    engineVersion: CORRECTION_ENGINE_VERSION,
    proposals,
  };
}

const engine = new CorrectionProposalEngine();
const perfectGuide = parseOcrToStructuredGuide(CONSULTA_OCR);

describe("Correction Assistant — Infraestrutura", () => {
  it("CorrectionProposalEngine é instanciável", async () => {
    assert.ok(typeof engine.generateFromFindings === "function");
  });

  it("correction_proposals.json path segue convenção audit/", async () => {
    const path = buildCorrectionProposalsStoragePath("tenant-1", "session-abc");
    assert.equal(path, "tenant-1/session-abc/audit/correction_proposals.json");
    assert.equal(CORRECTION_PROPOSALS_FILENAME, "correction_proposals.json");
  });
});

describe("Correction Assistant — Geração de propostas", () => {
  it("gera uma proposta por finding", async () => {
    const guide = cloneGuide(perfectGuide);
    patchField(guide, "cid_code", { value: null, rawValue: null, status: "missing" });
    patchField(guide, "executing_crm", {
      value: "XX",
      rawValue: "XX",
      status: "found",
    });
    const { findings } = await auditStructuredGuide(guide);
    const proposals = generateCorrectionProposals(findings, "sess-1");
    assert.equal(proposals.length, findings.length);
    assert.ok(proposals.length >= 2);
  });

  it("proposta possui campos mínimos exigidos", async () => {
    const guide = cloneGuide(perfectGuide);
    patchField(guide, "cid_code", { value: null, rawValue: null, status: "missing" });
    const { findings } = await auditStructuredGuide(guide);
    const [proposal] = generateCorrectionProposals(findings, "sess-1");
    assert.ok(proposal);
    assert.ok(proposal.proposalId);
    assert.equal(proposal.findingId, buildFindingId(findings[0]!));
    assert.equal(proposal.proposalId, buildProposalId(proposal.findingId));
    assert.ok(proposal.field);
    assert.ok("currentValue" in proposal);
    assert.ok("suggestedValue" in proposal);
    assert.ok(typeof proposal.confidence === "number");
    assert.ok(proposal.justification);
    assert.ok(proposal.source);
    assert.equal(proposal.status, "pending");
    assert.ok(typeof proposal.blocking === "boolean");
    assert.ok(proposal.severity);
  });

  it("mapeia fonte TUSS para procedimentos", async () => {
    const guide = cloneGuide(perfectGuide);
    patchField(guide, "procedure_code", {
      value: "99999999",
      rawValue: "99999999",
      status: "found",
    });
    const { findings } = await auditStructuredGuide(guide);
    const proposal = generateCorrectionProposals(findings, "sess-1").find(
      (p) => p.ruleId === "PRC-003",
    );
    assert.ok(proposal);
    assert.equal(proposal.source, "TUSS");
    assert.ok(proposal.legalReference?.includes("TUSS"));
  });

  it("mapeia fonte Contrato para autorização", () => {
    const finding: AuditFinding = {
      ruleId: "AUT-001",
      category: "autorizacoes",
      field: "authorization_password",
      severity: "critico",
      status: "open",
      message: "Senha ausente",
      detectedValue: null,
      expectedValue: null,
      confidence: 0.4,
      suggestedCorrection: "Informe a senha de autorização.",
      blocking: true,
    };
    const [proposal] = generateCorrectionProposals([finding], "sess-auth");
    assert.equal(proposal!.source, "Contrato");
    assert.ok(proposal!.legalReference?.includes("Contrato"));
  });
});

describe("Correction Assistant — Confiança", () => {
  it("classifica confiança baixa quando finding tem confidence baixa", () => {
    const finding: AuditFinding = {
      ruleId: "PAT-003",
      category: "paciente",
      field: "beneficiary_cpf",
      severity: "medio",
      status: "open",
      message: "CPF inválido",
      detectedValue: "123",
      expectedValue: "CPF com 11 dígitos",
      confidence: 0.2,
      suggestedCorrection: "Corrija o CPF.",
      blocking: false,
    };
    const [proposal] = generateCorrectionProposals([finding], "sess-low");
    assert.ok(proposal!.confidence < 0.5);
  });

  it("eleva confiança quando expectedValue está presente", async () => {
    const finding: AuditFinding = {
      ruleId: "EXE-002",
      category: "executante",
      field: "executing_crm",
      severity: "alto",
      status: "open",
      message: "CRM inválido",
      detectedValue: "XX",
      expectedValue: "12345/UF",
      confidence: 0.55,
      suggestedCorrection: "Corrija o CRM.",
      blocking: false,
    };
    const [proposal] = generateCorrectionProposals([finding], "sess-mid");
    assert.ok(proposal!.confidence >= 0.65);
    assert.equal(proposal!.suggestedValue, "12345/UF");
  });
});

describe("Correction Assistant — Campo bloqueante", () => {
  it("propaga flag blocking do finding", async () => {
    const guide = cloneGuide(perfectGuide);
    patchField(guide, "beneficiary_name", { value: null, rawValue: null, status: "missing" });
    const { findings } = await auditStructuredGuide(guide);
    const blockingFinding = findings.find((f) => f.ruleId === "PAT-001");
    assert.ok(blockingFinding?.blocking);
    const proposal = generateCorrectionProposals(findings, "sess-block").find(
      (p) => p.ruleId === "PAT-001",
    );
    assert.ok(proposal?.blocking);
  });
});

describe("Correction Assistant — Decisões do usuário", () => {
  it("proposta aceita", async () => {
    const guide = cloneGuide(perfectGuide);
    patchField(guide, "cid_code", { value: null, rawValue: null, status: "missing" });
    const { findings } = await auditStructuredGuide(guide);
    const store = buildStore(generateCorrectionProposals(findings, "sess-accept"));
    const target = store.proposals[0]!;
    const updated = decideProposalInStore(store, {
      proposalId: target.proposalId,
      action: "accept",
    });
    assert.equal(updated.status, "accepted");
    assert.ok(updated.decidedAt);
    assert.equal(proposalDecisionEventType("accept"), "proposal_accepted");
  });

  it("proposta rejeitada", async () => {
    const guide = cloneGuide(perfectGuide);
    patchField(guide, "cid_code", { value: null, rawValue: null, status: "missing" });
    const { findings } = await auditStructuredGuide(guide);
    const store = buildStore(generateCorrectionProposals(findings, "sess-reject"));
    const target = store.proposals[0]!;
    const updated = decideProposalInStore(store, {
      proposalId: target.proposalId,
      action: "reject",
    });
    assert.equal(updated.status, "rejected");
    assert.equal(proposalDecisionEventType("reject"), "proposal_rejected");
  });

  it("proposta editada", async () => {
    const guide = cloneGuide(perfectGuide);
    patchField(guide, "cid_code", { value: null, rawValue: null, status: "missing" });
    const { findings } = await auditStructuredGuide(guide);
    const store = buildStore(generateCorrectionProposals(findings, "sess-edit"));
    const target = store.proposals[0]!;
    const updated = decideProposalInStore(store, {
      proposalId: target.proposalId,
      action: "edit",
      editedValue: "J06.9",
    });
    assert.equal(updated.status, "edited");
    assert.equal(updated.editedValue, "J06.9");
    assert.equal(proposalDecisionEventType("edit"), "proposal_edited");
  });

  it("múltiplas propostas com estados independentes", async () => {
    const guide = cloneGuide(perfectGuide);
    patchField(guide, "cid_code", { value: null, rawValue: null, status: "missing" });
    patchField(guide, "executing_crm", {
      value: "XX",
      rawValue: "XX",
      status: "found",
    });
    const { findings } = await auditStructuredGuide(guide);
    const proposals = generateCorrectionProposals(findings, "sess-multi");
    assert.ok(proposals.length >= 2);

    const store = buildStore(proposals);
    const first = decideProposalInStore(store, {
      proposalId: proposals[0]!.proposalId,
      action: "accept",
    });
    const second = decideProposalInStore(store, {
      proposalId: proposals[1]!.proposalId,
      action: "reject",
    });
    const merged = {
      ...store,
      proposals: store.proposals.map((p) => {
        if (p.proposalId === first.proposalId) return first;
        if (p.proposalId === second.proposalId) return second;
        return p;
      }),
    };
    assert.equal(merged.proposals.filter((p) => p.status === "accepted").length, 1);
    assert.equal(merged.proposals.filter((p) => p.status === "rejected").length, 1);
    assert.equal(
      merged.proposals.filter((p) => p.status === "pending").length,
      proposals.length - 2,
    );
  });
});

describe("Correction Assistant — Persistência", () => {
  it("store serializa para JSON com version correction_proposals_v1", async () => {
    const guide = cloneGuide(perfectGuide);
    patchField(guide, "cid_code", { value: null, rawValue: null, status: "missing" });
    const { findings } = await auditStructuredGuide(guide);
    const store = buildStore(generateCorrectionProposals(findings, "sess-persist"));
    const json = JSON.parse(JSON.stringify(store)) as CorrectionProposalStore;
    assert.equal(json.version, "correction_proposals_v1");
    assert.equal(json.engineVersion, CORRECTION_ENGINE_VERSION);
    assert.ok(json.proposals.length > 0);
  });

  it("summary reflete contagens por status", async () => {
    const guide = cloneGuide(perfectGuide);
    patchField(guide, "cid_code", { value: null, rawValue: null, status: "missing" });
    patchField(guide, "executing_crm", {
      value: "XX",
      rawValue: "XX",
      status: "found",
    });
    const proposals = generateCorrectionProposals(
      (await auditStructuredGuide(guide)).findings,
      "sess-summary",
    );
    const accepted = decideProposalInStore(buildStore(proposals), {
      proposalId: proposals[0]!.proposalId,
      action: "accept",
    });
    const nextStore = buildStore(
      proposals.map((p) => (p.proposalId === accepted.proposalId ? accepted : p)),
    );
    const summary = buildCorrectionSummaryFromStore(
      nextStore,
      "tenant/sess/audit/correction_proposals.json",
    );
    assert.equal(summary.status, "completed");
    assert.equal(summary.totalProposals, proposals.length);
    assert.equal(summary.acceptedCount, 1);
    assert.ok((summary.pendingCount ?? 0) >= 1);
  });
});

describe("Correction Assistant — Telemetria", () => {
  it("registra eventos proposal_generated, accepted, edited, rejected", () => {
    const sessionId = "sess-tel";
    let metadata: Record<string, unknown> = {};

    metadata = appendCaptureEvent(
      metadata,
      buildCaptureEvent("proposal_generated", sessionId, {
        proposalId: "prop-1",
        findingId: "DIA-001::cid_code",
      }),
    );
    metadata = appendCaptureEvent(
      metadata,
      buildCaptureEvent("proposal_accepted", sessionId, { proposalId: "prop-1" }),
    );
    metadata = appendCaptureEvent(
      metadata,
      buildCaptureEvent("proposal_edited", sessionId, {
        proposalId: "prop-2",
        editedValue: "J06.9",
      }),
    );
    metadata = appendCaptureEvent(
      metadata,
      buildCaptureEvent("proposal_rejected", sessionId, { proposalId: "prop-3" }),
    );
    metadata = appendCaptureEvent(
      metadata,
      buildCaptureEvent("proposal_applied", sessionId, { proposalId: "prop-4" }),
    );

    const events = metadata.captureEvents as Array<{ type: string }>;
    assert.equal(events.length, 5);
    assert.deepEqual(
      events.map((e) => e.type),
      [
        "proposal_generated",
        "proposal_accepted",
        "proposal_edited",
        "proposal_rejected",
        "proposal_applied",
      ],
    );
  });
});
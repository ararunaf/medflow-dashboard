#!/usr/bin/env node
/**
 * Testes — MEDICFLOW-PREVENTIVE-AUDIT-01
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
import {
  PreventiveAuditEngine,
  auditStructuredGuide,
  ALL_AUDIT_RULES,
  AUDIT_RULE_COUNT,
  AUDIT_REPORT_FILENAME,
  buildAuditReportStoragePath,
  calculateAuditScore,
} from "../../../src/lib/capture/audit/index.ts";

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

const SADT_OCR = buildOcrFromLines([
  { text: "GUIA SP/SADT", y: 15 },
  { text: "Registro ANS: 654321", y: 55 },
  { text: "CNPJ Contratado: 98.765.432/0001-10", y: 100 },
  { text: "Nome do Beneficiário: Carlos Eduardo Lima", y: 180 },
  { text: "Carteirinha: XYZ-789012", y: 210 },
  { text: "CRM Solicitante: 54321/RJ", y: 280 },
  { text: "Nome do Solicitante: Dra Ana Costa", y: 310 },
  { text: "CRM Executante: 98765/MG", y: 420 },
  { text: "Data do Atendimento: 25/04/2026", y: 500 },
  { text: "Senha: SADT2026", y: 530 },
  { text: "Data de Execução: 20/04/2026", y: 560 },
  { text: "CID: K80.2", y: 580 },
  { text: "Código TUSS: 40101010", y: 650 },
  { text: "Valor Total: R$ 1.500,00", y: 720 },
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

const perfectGuide = parseOcrToStructuredGuide(CONSULTA_OCR);
const engine = new PreventiveAuditEngine();

describe("Preventive Audit — Infraestrutura", () => {
  it("PreventiveAuditEngine é instanciável", () => {
    assert.ok(typeof engine.audit === "function");
  });

  it(`${AUDIT_RULE_COUNT} regras iniciais registradas`, () => {
    assert.ok(AUDIT_RULE_COUNT >= 30);
    assert.equal(ALL_AUDIT_RULES.length, AUDIT_RULE_COUNT);
    const ids = new Set(ALL_AUDIT_RULES.map((r) => r.id));
    assert.equal(ids.size, ALL_AUDIT_RULES.length, "IDs de regras devem ser únicos");
  });

  it("audit_report.json path segue convenção audit/", () => {
    const path = buildAuditReportStoragePath("tenant-1", "session-abc");
    assert.equal(path, "tenant-1/session-abc/audit/audit_report.json");
    assert.equal(AUDIT_REPORT_FILENAME, "audit_report.json");
  });
});

describe("Preventive Audit — Guia perfeita", () => {
  it("guia consulta completa — score 100, aprovada, zero findings", () => {
    const { report, findings } = auditStructuredGuide(perfectGuide);
    assert.equal(findings.length, 0);
    assert.equal(report.score.overall, 100);
    assert.equal(report.score.approved, true);
    assert.equal(report.score.blocking, false);
    assert.equal(report.summary.approved, true);
    assert.equal(report.version, "audit_report_v1");
  });
});

describe("Preventive Audit — CID ausente", () => {
  it("gera finding DIA-001 quando CID missing", () => {
    const guide = cloneGuide(perfectGuide);
    patchField(guide, "cid_code", { value: null, rawValue: null, status: "missing" });
    const { findings } = auditStructuredGuide(guide);
    const cidFinding = findings.find((f) => f.ruleId === "DIA-001");
    assert.ok(cidFinding, "DIA-001 deve ser emitido");
    assert.equal(cidFinding.category, "diagnostico");
    assert.equal(cidFinding.severity, "medio");
  });
});

describe("Preventive Audit — CRM inválido", () => {
  it("gera finding EXE-002 para CRM malformado", () => {
    const guide = cloneGuide(perfectGuide);
    patchField(guide, "executing_crm", {
      value: "INVALIDO",
      rawValue: "INVALIDO",
      status: "found",
      normalized: false,
    });
    const { findings } = auditStructuredGuide(guide);
    const crmFinding = findings.find((f) => f.ruleId === "EXE-002");
    assert.ok(crmFinding, "EXE-002 deve ser emitido");
    assert.equal(crmFinding.field, "executing_crm");
    assert.equal(crmFinding.severity, "alto");
  });
});

describe("Preventive Audit — TUSS incompatível", () => {
  it("gera finding PRC-003 para código fora do catálogo", () => {
    const guide = cloneGuide(perfectGuide);
    patchField(guide, "procedure_code", {
      value: "99999999",
      rawValue: "99999999",
      status: "found",
    });
    const { findings } = auditStructuredGuide(guide);
    const tussFinding = findings.find((f) => f.ruleId === "PRC-003");
    assert.ok(tussFinding, "PRC-003 deve ser emitido");
    assert.equal(tussFinding.detectedValue, "99999999");
  });
});

describe("Preventive Audit — Campos obrigatórios vazios", () => {
  it("gera findings críticos para beneficiário e operadora ausentes", () => {
    const guide = cloneGuide(perfectGuide);
    patchField(guide, "beneficiary_name", { value: null, rawValue: null, status: "missing" });
    patchField(guide, "operator_ans_code", { value: null, rawValue: null, status: "missing" });
    const { findings } = auditStructuredGuide(guide);
    assert.ok(findings.some((f) => f.ruleId === "PAT-001"));
    assert.ok(findings.some((f) => f.ruleId === "OPR-001"));
    assert.ok(findings.some((f) => f.blocking));
  });
});

describe("Preventive Audit — Datas inconsistentes", () => {
  it("gera finding DAT-004 quando execução é anterior ao atendimento", () => {
    const guide = parseOcrToStructuredGuide(SADT_OCR);
    const { findings } = auditStructuredGuide(guide);
    const dateFinding = findings.find((f) => f.ruleId === "DAT-004");
    assert.ok(dateFinding, "DAT-004 deve ser emitido");
    assert.equal(dateFinding.field, "execution_date");
  });
});

describe("Preventive Audit — Autorização ausente", () => {
  it("gera finding AUT-001 em SADT sem senha", () => {
    const sadtNoAuth = buildOcrFromLines([
      { text: "GUIA SP/SADT", y: 15 },
      { text: "Registro ANS: 654321", y: 55 },
      { text: "CNPJ Contratado: 98.765.432/0001-10", y: 100 },
      { text: "Nome do Beneficiário: Carlos Eduardo Lima", y: 180 },
      { text: "Carteirinha: XYZ-789012", y: 210 },
      { text: "CRM Solicitante: 54321/RJ", y: 280 },
      { text: "CRM Executante: 98765/MG", y: 420 },
      { text: "Data do Atendimento: 25/04/2026", y: 500 },
      { text: "Código TUSS: 40101010", y: 650 },
      { text: "Valor Total: R$ 1.500,00", y: 720 },
    ]);
    const guide = parseOcrToStructuredGuide(sadtNoAuth);
    const { findings } = auditStructuredGuide(guide);
    const authFinding = findings.find((f) => f.ruleId === "AUT-001");
    assert.ok(authFinding, "AUT-001 deve ser emitido");
    assert.equal(authFinding.blocking, true);
    assert.equal(authFinding.severity, "critico");
  });
});

describe("Preventive Audit — Múltiplos erros", () => {
  it("acumula findings de categorias distintas", () => {
    const guide = cloneGuide(perfectGuide);
    patchField(guide, "cid_code", { value: null, rawValue: null, status: "missing" });
    patchField(guide, "executing_crm", {
      value: "XX",
      rawValue: "XX",
      status: "found",
    });
    patchField(guide, "procedure_code", {
      value: "99999999",
      rawValue: "99999999",
      status: "found",
    });
    const { findings, report } = auditStructuredGuide(guide);
    assert.ok(findings.length >= 3);
    const categories = new Set(findings.map((f) => f.category));
    assert.ok(categories.size >= 2);
    assert.ok(report.score.overall < 100);
    assert.ok(report.summary.totalFindings >= 3);
  });
});

describe("Preventive Audit — Guia bloqueante", () => {
  it("marca blocking quando data futura (DAT-003)", () => {
    const guide = cloneGuide(perfectGuide);
    patchField(guide, "attendance_date", {
      value: "2099-12-31",
      rawValue: "31/12/2099",
      status: "found",
    });
    const { report, findings } = auditStructuredGuide(guide);
    const blockingFinding = findings.find((f) => f.ruleId === "DAT-003");
    assert.ok(blockingFinding);
    assert.equal(report.score.blocking, true);
    assert.equal(report.score.approved, false);
    assert.ok(report.summary.blockingCount >= 1);
  });
});

describe("Preventive Audit — Guia aprovada", () => {
  it("score ≥ 70 e sem bloqueios => approved", () => {
    const guide = cloneGuide(perfectGuide);
    patchField(guide, "cid_code", { value: null, rawValue: null, status: "missing" });
    const { report } = auditStructuredGuide(guide);
    assert.equal(report.score.blocking, false);
    assert.equal(report.score.approved, true);
    assert.ok(report.score.overall >= 70);
  });
});

describe("Preventive Audit — Score e distribuição", () => {
  it("calcula distribuição por severidade", () => {
    const findings = [
      {
        ruleId: "T1",
        category: "paciente" as const,
        field: "x",
        severity: "critico" as const,
        status: "open" as const,
        message: "m",
        detectedValue: null,
        expectedValue: null,
        confidence: 0,
        suggestedCorrection: "c",
        blocking: true,
      },
      {
        ruleId: "T2",
        category: "datas" as const,
        field: "y",
        severity: "medio" as const,
        status: "open" as const,
        message: "m",
        detectedValue: null,
        expectedValue: null,
        confidence: 0,
        suggestedCorrection: "c",
        blocking: false,
      },
    ];
    const score = calculateAuditScore(findings);
    assert.equal(score.distribution.critico, 1);
    assert.equal(score.distribution.medio, 1);
    assert.equal(score.overall, 67);
  });

  it("gera correctionProposals para cada finding", () => {
    const guide = cloneGuide(perfectGuide);
    patchField(guide, "cid_code", { value: null, rawValue: null, status: "missing" });
    const { report } = auditStructuredGuide(guide);
    assert.equal(report.correctionProposals.length, report.findings.length);
    assert.equal(report.correctionProposals[0]!.autoFixable, false);
  });
});

describe("Preventive Audit — AuditFinding modelo", () => {
  it("findings possuem campos mínimos exigidos", () => {
    const guide = cloneGuide(perfectGuide);
    patchField(guide, "cid_code", { value: null, rawValue: null, status: "missing" });
    const { findings } = auditStructuredGuide(guide);
    const f = findings[0]!;
    assert.ok(f.ruleId);
    assert.ok(f.category);
    assert.ok(f.field);
    assert.ok(f.severity);
    assert.equal(f.status, "open");
    assert.ok(f.message);
    assert.ok("detectedValue" in f);
    assert.ok("expectedValue" in f);
    assert.ok(typeof f.confidence === "number");
    assert.ok(f.suggestedCorrection);
    assert.ok(typeof f.blocking === "boolean");
  });
});

describe("Preventive Audit — Modularidade", () => {
  it("permite registrar regras customizadas sem alterar engine", () => {
    const customEngine = new PreventiveAuditEngine([
      {
        id: "CUSTOM-001",
        name: "Teste",
        description: "Regra custom",
        category: "paciente",
        severity: "baixo",
        blocking: false,
        field: "beneficiary_name",
        message: "Custom rule triggered",
        suggestedCorrection: "Fix it",
        evaluate: (ctx) =>
          ctx.isPresent("beneficiary_name")
            ? {
                ruleId: "CUSTOM-001",
                category: "paciente",
                field: "beneficiary_name",
                severity: "baixo",
                status: "open",
                message: "Custom rule triggered",
                detectedValue: ctx.getValue("beneficiary_name"),
                expectedValue: null,
                confidence: 1,
                suggestedCorrection: "Fix it",
                blocking: false,
              }
            : null,
      },
    ]);
    const { findings } = customEngine.audit(perfectGuide);
    assert.equal(findings.length, 1);
    assert.equal(findings[0]!.ruleId, "CUSTOM-001");
  });
});

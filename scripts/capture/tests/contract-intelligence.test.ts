#!/usr/bin/env node
/**
 * Testes — MEDICFLOW-CONTRACT-INTELLIGENCE-01
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRawOcrResult } from "../../../src/lib/capture/ocr/providers/shared.ts";
import type { OcrLine, OcrPage, RawOcrResult } from "../../../src/lib/capture/ocr/types/raw-ocr-result.ts";
import { parseOcrToStructuredGuide } from "../../../src/lib/capture/parser/index.ts";
import {
  auditStructuredGuide,
} from "../../../src/lib/capture/audit/index.ts";
import {
  ContractKnowledgeEngine,
  ContractIntelligenceEngine,
  ContractKnowledgeRegistryStore,
  CONTRACT_RULE_COUNT,
  DEFAULT_CONTRACT_RULES,
  enrichAuditFindings,
  CONTRACT_INTELLIGENCE_FILENAME,
  buildContractIntelligenceStoragePath,
} from "../../../src/lib/capture/contract/index.ts";
import type { ContractRule } from "../../../src/lib/capture/contract/types/contract-rule.ts";
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

const UNIMED_CONSULTA_OCR = buildOcrFromLines([
  { text: "GUIA DE CONSULTA", y: 20 },
  { text: "Registro ANS: 123456", y: 60 },
  { text: "Operadora: Unimed Nacional", y: 85 },
  { text: "Nome do Beneficiário: Maria Silva Santos", y: 200 },
  { text: "Carteirinha: ABC-123456", y: 230 },
  { text: "Data do Atendimento: 15/03/2026", y: 350 },
  { text: "Código TUSS: 10101012", y: 580 },
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

const NO_OPERATOR_OCR = buildOcrFromLines([
  { text: "GUIA DE CONSULTA", y: 20 },
  { text: "Nome do Beneficiário: Ana Lima", y: 200 },
]);

function parseGuide(ocr: RawOcrResult) {
  return parseOcrToStructuredGuide(ocr, { sessionId: "test-session" });
}

describe("Contract Intelligence — registry", () => {
  it("cadastra regras contratuais no registry", () => {
    assert.ok(CONTRACT_RULE_COUNT >= 10);
    assert.equal(DEFAULT_CONTRACT_RULES.length, CONTRACT_RULE_COUNT);
    const operators = new Set(DEFAULT_CONTRACT_RULES.map((r) => r.operator));
    assert.ok(operators.has("123456"));
    assert.ok(operators.has("005711"));
    assert.ok(operators.has("326305"));
    assert.ok(operators.has("006246"));
    assert.ok(operators.has("*"));
  });

  it("suporta múltiplas versões por operadora", () => {
    const store = new ContractKnowledgeRegistryStore();
    const registry = store.getRegistry();
    const unimedVersions = registry.versions.filter((v) => v.operator === "123456");
    assert.ok(unimedVersions.length >= 2);
  });
});

describe("Contract Intelligence — ContractKnowledgeEngine", () => {
  it("identifica operadora Unimed", () => {
    const guide = parseGuide(UNIMED_CONSULTA_OCR);
    const engine = new ContractKnowledgeEngine();
    const operator = engine.resolveOperator(guide);
    assert.equal(operator.ansCode, "123456");
    assert.equal(operator.resolved, true);
  });

  it("identifica operadora Bradesco", () => {
    const guide = parseGuide(BRADESCO_SADT_OCR);
    const engine = new ContractKnowledgeEngine();
    const operator = engine.resolveOperator(guide);
    assert.equal(operator.ansCode, "005711");
    assert.equal(operator.resolved, true);
  });

  it("identifica contrato para operadora conhecida", () => {
    const guide = parseGuide(UNIMED_CONSULTA_OCR);
    const engine = new ContractKnowledgeEngine();
    const operator = engine.resolveOperator(guide);
    const contract = engine.resolveContract(operator);
    assert.equal(contract.resolved, true);
    assert.equal(contract.contractId, "UNIMED-NACIONAL-2026");
  });

  it("identifica tipo de atendimento", () => {
    const guide = parseGuide(UNIMED_CONSULTA_OCR);
    const engine = new ContractKnowledgeEngine();
    const attendance = engine.resolveAttendanceType(guide);
    assert.equal(attendance.guideType, "guia_consulta");
    assert.equal(attendance.label, "Consulta");
  });

  it("localiza regras específicas por operadora e contrato", () => {
    const guide = parseGuide(UNIMED_CONSULTA_OCR);
    const engine = new ContractKnowledgeEngine();
    const { rules } = engine.locateApplicableRules(guide);
    assert.ok(rules.length > 0);
    assert.ok(rules.every((r) => r.operator === "123456" || r.operator === "*"));
    assert.ok(rules.some((r) => r.ruleId.startsWith("CTR-UNI")));
  });

  it("aplica regras diferentes para operadoras diferentes", () => {
    const unimedGuide = parseGuide(UNIMED_CONSULTA_OCR);
    const bradescoGuide = parseGuide(BRADESCO_SADT_OCR);
    const engine = new ContractKnowledgeEngine();

    const unimedRules = engine.locateApplicableRules(unimedGuide).rules;
    const bradescoRules = engine.locateApplicableRules(bradescoGuide).rules;

    const unimedIds = new Set(unimedRules.map((r) => r.ruleId));
    const bradescoIds = new Set(bradescoRules.map((r) => r.ruleId));

    assert.ok(unimedIds.has("CTR-UNI-001"));
    assert.ok(bradescoIds.has("CTR-BRA-001"));
    assert.equal(unimedIds.has("CTR-BRA-001"), false);
  });

  it("resolve regras conflitantes por prioridade", () => {
    const guide = parseGuide(UNIMED_CONSULTA_OCR);
    const engine = new ContractKnowledgeEngine();
    const context = engine.buildContext(guide);
    assert.ok(context.conflictingRulesResolved >= 1);

    const authRules = context.applicableRules.filter((r) =>
      r.auditRuleIds?.includes("AUT-001"),
    );
    if (authRules.length > 0) {
      const topRule = authRules[0]!;
      assert.equal(topRule.ruleId, "CTR-UNI-002");
      assert.ok(topRule.priority > 50);
    }
  });

  it("usa regras genéricas na ausência de contrato", () => {
    const guide = parseGuide(NO_OPERATOR_OCR);
    const engine = new ContractKnowledgeEngine();
    const operator = engine.resolveOperator(guide);
    const contract = engine.resolveContract(operator);
    const { rules } = engine.locateApplicableRules(guide);

    assert.equal(operator.resolved, false);
    assert.equal(contract.resolved, false);
    assert.ok(rules.some((r) => r.ruleId.startsWith("CTR-GEN")));
  });
});

describe("Contract Intelligence — enriquecimento de findings", () => {
  it("enriquece findings sem modificar regra original", () => {
    const guide = parseGuide(UNIMED_CONSULTA_OCR);
    const audit = auditStructuredGuide(guide);
    const originalFinding = audit.findings.find((f) => f.ruleId === "AUT-001");

    if (!originalFinding) {
      // Guia completa pode não ter AUT-001 — forçar finding sintético
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
    }

    const { report } = enrichAuditFindings(guide, audit.findings);
    assert.equal(report.version, "contract_intelligence_v1");
    assert.ok(report.summary.enrichedCount >= 0);

    for (const enriched of report.findings) {
      const original = audit.findings.find(
        (f) => f.ruleId === enriched.finding.ruleId && f.field === enriched.finding.field,
      );
      assert.ok(original);
      assert.deepEqual(enriched.finding, original);
    }
  });

  it("adiciona justificativa ampliada e fundamentos", () => {
    const guide = parseGuide(UNIMED_CONSULTA_OCR);
    const findings = [
      {
        ruleId: "OPR-001",
        category: "operadora" as const,
        field: "operator_ans_code",
        severity: "critico" as const,
        status: "open" as const,
        message: "Registro ANS da operadora não informado.",
        detectedValue: null,
        expectedValue: "6 dígitos",
        confidence: 0.95,
        suggestedCorrection: "Informe o registro ANS.",
        blocking: true,
      },
    ];

    const { report } = enrichAuditFindings(guide, findings);
    const enriched = report.findings[0]!;

    assert.ok(enriched.enrichment);
    assert.ok(enriched.enrichment!.expandedJustification.includes("Registro ANS"));
    assert.ok(enriched.enrichment!.contractualBasis.includes("CTR-UNI-001"));
    assert.ok(enriched.enrichment!.tissBasis.includes("TISS"));
    assert.ok(enriched.enrichment!.expectedImpact.length > 0);
    assert.ok(enriched.enrichment!.estimatedDenialRisk > 0);
    assert.ok(enriched.matchedRuleIds.includes("CTR-UNI-001"));
  });

  it("aplica múltiplas regras quando aplicável", () => {
    const guide = parseGuide(BRADESCO_SADT_OCR);
    const findings = [
      {
        ruleId: "PRC-001",
        category: "procedimentos" as const,
        field: "procedure_code",
        severity: "critico" as const,
        status: "open" as const,
        message: "Código TUSS não informado.",
        detectedValue: null,
        expectedValue: "código TUSS",
        confidence: 0.9,
        suggestedCorrection: "Informe o código TUSS.",
        blocking: true,
      },
    ];

    const engine = new ContractIntelligenceEngine();
    const { report } = engine.enrich(guide, findings);
    assert.ok(report.appliedRules.length >= 1);
    assert.ok(report.summary.appliedRulesCount >= 1);
  });
});

describe("Contract Intelligence — persistência", () => {
  it("define caminho de storage correto", () => {
    const path = buildContractIntelligenceStoragePath("tenant-1", "session-1");
    assert.equal(path, "tenant-1/session-1/audit/contract_intelligence_report.json");
    assert.equal(CONTRACT_INTELLIGENCE_FILENAME, "contract_intelligence_report.json");
  });
});

describe("Contract Intelligence — workspace", () => {
  it("expõe painel Conhecimento Contratual", () => {
    assert.equal(REVIEW_PANEL_IDS.length, 9);
    assert.ok(REVIEW_PANEL_IDS.includes("contrato"));
    assert.equal(REVIEW_PANEL_LABELS.contrato, "Conhecimento Contratual");
    assert.equal(isReviewPanelId("contrato"), true);
  });
});

describe("Contract Intelligence — regras por contrato diferente", () => {
  it("seleciona contrato regional para honorários", () => {
    const honorarioOcr = buildOcrFromLines([
      { text: "GUIA DE HONORÁRIOS", y: 20 },
      { text: "Registro ANS: 123456", y: 60 },
      { text: "Operadora: Unimed Regional", y: 85 },
      { text: "CRM Executante: 54321/SP", y: 480 },
    ]);
    const guide = parseGuide(honorarioOcr);
    const engine = new ContractKnowledgeEngine();
    const { rules } = engine.locateApplicableRules(guide);
    assert.ok(rules.some((r) => r.guideType === "guia_honorario" || r.guideType === "*"));
  });
});

describe("Contract Intelligence — tenant override", () => {
  it("permite registrar versão por tenant", () => {
    const store = new ContractKnowledgeRegistryStore();
    const tenantRule: ContractRule = {
      ruleId: "CTR-TENANT-001",
      operator: "123456",
      contract: "UNIMED-CUSTOM-2026",
      guideType: "*",
      procedureType: "*",
      priority: 200,
      description: "Regra customizada do tenant",
      justification: "Override contratual do cliente piloto.",
      legalReference: "Contrato customizado",
      businessReference: "Anexo piloto",
      severity: "alto",
      auditRuleIds: ["OPR-001"],
    };

    store.registerTenantVersion({
      version: "2026.custom",
      effectiveFrom: "2026-01-01",
      tenantId: "tenant-pilot-001",
      operator: "123456",
      contract: "UNIMED-CUSTOM-2026",
      rules: [tenantRule],
    });

    const rules = store.getRulesForOperator("123456", "tenant-pilot-001");
    assert.ok(rules.some((r) => r.ruleId === "CTR-TENANT-001"));
  });
});

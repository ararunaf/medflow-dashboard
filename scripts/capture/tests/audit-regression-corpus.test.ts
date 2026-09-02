#!/usr/bin/env node
/**
 * Corpus de regressão — auditoria + inteligência contratual (item P0-05).
 *
 * Objetivo: medir, com um lote fixo de guias sintéticas (não são dados reais
 * de paciente — TISS-02-DATA ainda não tem uma fonte de guias reais
 * anonimizadas da cooperativa), a taxa de falso-aprovado do motor quando um
 * código TUSS/CID não está no catálogo carregado, e confirmar que nenhuma
 * guia com campo obrigatório ausente é aprovada.
 *
 * Cobre os 4 operadores com regra contratual hoje (Unimed, Bradesco, Amil,
 * SulAmérica) + 1 operadora fora do catálogo de contratos.
 *
 * Quando houver um lote real de guias anonimizadas da cooperativa, ele deve
 * ser adicionado como um corpus adicional (mesmo runCorpus()/buildReport())
 * — este arquivo não substitui essa validação, só cobre o que dá para testar
 * sem dado de paciente real.
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRawOcrResult } from "../../../src/lib/capture/ocr/providers/shared.ts";
import type {
  OcrLine,
  OcrPage,
  RawOcrResult,
} from "../../../src/lib/capture/ocr/types/raw-ocr-result.ts";
import { parseOcrToStructuredGuide } from "../../../src/lib/capture/parser/index.ts";
import { auditStructuredGuide } from "../../../src/lib/capture/audit/index.ts";
import {
  ContractKnowledgeEngine,
  enrichAuditFindings,
} from "../../../src/lib/capture/contract/index.ts";
import {
  applyRealCid10Codes,
  resetSharedEnterpriseTISSCatalogStoreForTests,
} from "../../../src/lib/enterprise/tiss-catalog/store/index.ts";

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

/** Amostra de CID-10 usada só para este corpus — mesmos códigos de sample-data/cid10-sample.csv. */
const SAMPLE_CID10_CODES = [
  { code: "J06.9", description: "Infecção aguda das vias aéreas superiores não especificada" },
  { code: "I10", description: "Hipertensão essencial (primária)" },
  { code: "K80.2", description: "Cálculo da vesícula biliar sem colecistite" },
];

type ConsultaScenario = {
  ansCode: string;
  operatorName: string;
  tussCode: string;
  cidCode: string;
};

function buildConsultaOcr(s: ConsultaScenario): RawOcrResult {
  return buildOcrFromLines([
    { text: "GUIA DE CONSULTA", y: 20 },
    { text: `Registro ANS: ${s.ansCode}`, y: 60 },
    { text: `Operadora: ${s.operatorName}`, y: 85 },
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
    { text: `Código TUSS: ${s.tussCode}`, y: 580 },
    { text: `CID-10: ${s.cidCode}`, y: 610 },
    { text: "Valor Total: R$ 250,00", y: 680 },
  ]);
}

type CorpusCase = {
  id: string;
  label: string;
  ocr: RawOcrResult;
  /** O que esperamos hoje — documenta o comportamento real, não um ideal. */
  expectApproved: boolean;
  expectBlocking: boolean;
  expectRuleHit?: string;
};

const CASES: CorpusCase[] = [
  {
    id: "unimed-valida",
    label: "Unimed (123456) — TUSS e CID no catálogo",
    ocr: buildConsultaOcr({
      ansCode: "123456",
      operatorName: "Unimed Nacional",
      tussCode: "10101012",
      cidCode: "J06.9",
    }),
    expectApproved: true,
    expectBlocking: false,
  },
  {
    id: "bradesco-valida",
    label: "Bradesco (005711) — TUSS e CID no catálogo",
    ocr: buildConsultaOcr({
      ansCode: "005711",
      operatorName: "Bradesco Saúde",
      tussCode: "40301010",
      cidCode: "K80.2",
    }),
    expectApproved: true,
    expectBlocking: false,
  },
  {
    id: "amil-valida",
    label: "Amil (326305) — TUSS e CID no catálogo",
    ocr: buildConsultaOcr({
      ansCode: "326305",
      operatorName: "Amil One",
      tussCode: "20101015",
      cidCode: "I10",
    }),
    expectApproved: true,
    expectBlocking: false,
  },
  {
    id: "sulamerica-valida",
    label: "SulAmérica (006246) — TUSS e CID no catálogo",
    ocr: buildConsultaOcr({
      ansCode: "006246",
      operatorName: "SulAmérica Saúde",
      tussCode: "31001016",
      cidCode: "J06.9",
    }),
    expectApproved: true,
    expectBlocking: false,
  },
  {
    id: "operadora-fora-do-contrato",
    label: "Operadora sem regra contratual cadastrada (999999)",
    ocr: buildConsultaOcr({
      ansCode: "999999",
      operatorName: "Operadora Sem Contrato Cadastrado",
      tussCode: "10101012",
      cidCode: "J06.9",
    }),
    expectApproved: true,
    expectBlocking: false,
  },
  {
    id: "tuss-fora-do-catalogo",
    label: "TUSS fora do catálogo — risco de falso-aprovado",
    ocr: buildConsultaOcr({
      ansCode: "123456",
      operatorName: "Unimed Nacional",
      tussCode: "99999999",
      cidCode: "J06.9",
    }),
    expectApproved: true, // ⚠ ver "Preventive Audit — risco de falso-aprovado" abaixo
    expectBlocking: false,
    expectRuleHit: "PRC-003",
  },
  {
    id: "cid-fora-do-catalogo",
    label: "CID fora do catálogo — risco de falso-aprovado",
    ocr: buildConsultaOcr({
      ansCode: "123456",
      operatorName: "Unimed Nacional",
      tussCode: "10101012",
      cidCode: "Z99.9",
    }),
    expectApproved: true, // ⚠ idem — DIA-003 é non-blocking hoje (rollout em sombra)
    expectBlocking: false,
    expectRuleHit: "DIA-003",
  },
];

type CaseResult = {
  id: string;
  label: string;
  approved: boolean;
  blocking: boolean;
  score: number;
  findingRuleIds: string[];
  operatorResolved: boolean;
  contractResolved: boolean;
};

async function runCase(c: CorpusCase): Promise<CaseResult> {
  const guide = parseOcrToStructuredGuide(c.ocr);
  const { report, findings } = await auditStructuredGuide(guide);
  const engine = new ContractKnowledgeEngine();
  const operator = engine.resolveOperator(guide);
  const contract = engine.resolveContract(operator);
  enrichAuditFindings(guide, findings); // só para confirmar que não lança/não altera aprovação

  return {
    id: c.id,
    label: c.label,
    approved: report.score.approved,
    blocking: report.score.blocking,
    score: report.score.overall,
    findingRuleIds: findings.map((f) => f.ruleId),
    operatorResolved: operator.resolved,
    contractResolved: contract.resolved,
  };
}

async function runCorpus(): Promise<CaseResult[]> {
  const results: CaseResult[] = [];
  for (const c of CASES) results.push(await runCase(c));
  return results;
}

function printReport(results: CaseResult[]): void {
  const falseApprovalRisk = results.filter(
    (r) => r.approved && r.findingRuleIds.some((id) => id === "PRC-003" || id === "DIA-003"),
  );
  console.log("\n=== Corpus de regressão — auditoria de guias TISS ===");
  for (const r of results) {
    console.log(
      `${r.approved ? "APROVADA" : "REPROVADA"}  score=${r.score}  ${r.id}  findings=[${r.findingRuleIds.join(",")}]  operador_resolvido=${r.operatorResolved}  contrato_resolvido=${r.contractResolved}`,
    );
  }
  console.log(
    `\nRisco de falso-aprovado (código fora do catálogo mas guia aprovada): ${falseApprovalRisk.length}/${results.length}`,
  );
  if (falseApprovalRisk.length > 0) {
    console.log(
      "  -> " +
        falseApprovalRisk.map((r) => r.id).join(", ") +
        " — aprovadas com PRC-003/DIA-003 não-bloqueante. Ver plano de rollout em modo sombra.",
    );
  }
  console.log("=======================================================\n");
}

before(() => {
  resetSharedEnterpriseTISSCatalogStoreForTests();
  applyRealCid10Codes(SAMPLE_CID10_CODES);
});

after(() => {
  resetSharedEnterpriseTISSCatalogStoreForTests();
});

describe("Corpus de regressão — 4 operadores + fora do catálogo", () => {
  it("nenhuma guia do corpus derruba o motor (todas produzem um relatório válido)", async () => {
    const results = await runCorpus();
    assert.equal(results.length, CASES.length);
    for (const r of results) {
      assert.ok(Number.isFinite(r.score));
    }
    printReport(results);
  });

  for (const c of CASES) {
    it(`${c.id}: comportamento bate com o esperado hoje (${c.label})`, async () => {
      const result = await runCase(c);
      assert.equal(result.approved, c.expectApproved, `approved mismatch em ${c.id}`);
      assert.equal(result.blocking, c.expectBlocking, `blocking mismatch em ${c.id}`);
      if (c.expectRuleHit) {
        assert.ok(
          result.findingRuleIds.includes(c.expectRuleHit),
          `esperava ${c.expectRuleHit} em ${c.id}, veio [${result.findingRuleIds.join(",")}]`,
        );
      }
    });
  }

  it("operadora sem regra contratual cadastrada cai para regras genéricas, sem crash", async () => {
    // operatorResolved só significa "achou um código ANS bem formado no campo" —
    // não que a operadora é conhecida. Quem reflete isso é contractResolved.
    const result = await runCase(CASES.find((c) => c.id === "operadora-fora-do-contrato")!);
    assert.equal(result.operatorResolved, true);
    assert.equal(result.contractResolved, false);
  });

  it("guia com campo obrigatório ausente NUNCA é aprovada (guarda de regressão zero-tolerância)", async () => {
    const guide = parseOcrToStructuredGuide(
      buildConsultaOcr({
        ansCode: "123456",
        operatorName: "Unimed Nacional",
        tussCode: "10101012",
        cidCode: "J06.9",
      }),
    );
    guide.fields.beneficiary_name = {
      ...guide.fields.beneficiary_name!,
      value: null,
      rawValue: null,
      status: "missing",
    };
    const { report } = await auditStructuredGuide(guide);
    assert.equal(report.score.approved, false);
  });

  it("achado — regras contratuais hoje só anotam findings existentes, não bloqueiam por conta própria", async () => {
    // CTR-BRA-002 exige autorização para SP/SADT > R$500, mas não há evaluate()
    // próprio: o bloqueio depende só do audit rule genérico (AUT-001) já ter
    // disparado. Guia Bradesco com Senha presente passa mesmo citando a regra.
    const result = await runCase(CASES.find((c) => c.id === "bradesco-valida")!);
    assert.equal(result.contractResolved, true);
    assert.equal(result.blocking, false);
  });
});

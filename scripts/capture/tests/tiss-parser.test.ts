#!/usr/bin/env node
/**
 * Testes — MEDICFLOW-TISS-PARSER-01
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRawOcrResult } from "../../../src/lib/capture/ocr/providers/shared.ts";
import type { OcrLine, OcrPage, RawOcrResult } from "../../../src/lib/capture/ocr/types/raw-ocr-result.ts";
import {
  TissParser,
  detectGuideType,
  parseOcrToStructuredGuide,
  buildStructuredGuideStoragePath,
  STRUCTURED_GUIDE_FILENAME,
  applyNormalizer,
  normalizeCpf,
  normalizeCrm,
  normalizeDate,
  normalizeTuss,
  normalizeCid,
  normalizeCns,
  normalizePhone,
  normalizeGuideNumber,
  TEMPLATE_CONSULTA_V1,
  TEMPLATE_SADT_V1,
  TEMPLATE_HONORARIO_V1,
} from "../../../src/lib/capture/parser/index.ts";

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
      coordinates: {
        boundingBox: { x: 10 + i * 40, y, width: 35, height: 18 },
      },
    })),
  };
}

function buildOcrFromLines(
  headerAndLines: Array<{ text: string; y: number; confidence?: number }>,
  overrides: Partial<RawOcrResult> = {},
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
    ...overrides,
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
  { text: "Observações: Paciente encaminhado", y: 750 },
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
  { text: "Nome do Executante: Dr Pedro Alves", y: 450 },
  { text: "Data de Execução: 20/04/2026", y: 520 },
  { text: "Indicação Clínica: Dor abdominal", y: 550 },
  { text: "CID: K80.2", y: 580 },
  { text: "Código TUSS: 40101010", y: 650 },
  { text: "40101010 20/04/2026 R$ 1.500,00", y: 680 },
  { text: "Valor Total: R$ 1.500,00", y: 720 },
]);

const HONORARIO_OCR = buildOcrFromLines([
  { text: "GUIA DE HONORÁRIO INDIVIDUAL", y: 18 },
  { text: "Registro ANS: 111222", y: 50 },
  { text: "CNPJ: 11.222.333/0001-44", y: 90 },
  { text: "Nome do Beneficiário: Fernanda Rocha", y: 170 },
  { text: "Guia de Origem: 555888", y: 200 },
  { text: "Grau de Participação: Anestesista", y: 380 },
  { text: "CRM: 67890/RS", y: 420 },
  { text: "Nome do Profissional: Dr Ricardo Menezes", y: 450 },
  { text: "Data do Atendimento: 10/05/2026", y: 520 },
  { text: "Código TUSS: 31001016", y: 600 },
  { text: "31001016 R$ 800,00", y: 630 },
  { text: "Valor Total: R$ 800,00", y: 700 },
]);

describe("TISS Parser — Normalizadores", () => {
  it("normaliza CPF removendo máscara", () => {
    assert.equal(normalizeCpf("123.456.789-01"), "12345678901");
  });

  it("normaliza CNS com 15 dígitos", () => {
    assert.equal(normalizeCns("123 4567 8901 2345"), "123456789012345");
  });

  it("normaliza CRM formato UF-NUMERO", () => {
    assert.equal(normalizeCrm("12345/SP"), "SP-012345");
    assert.equal(normalizeCrm("SP-12345"), "SP-012345");
  });

  it("normaliza datas BR para ISO", () => {
    assert.equal(normalizeDate("15/03/2026"), "2026-03-15");
  });

  it("normaliza TUSS com zero-pad", () => {
    assert.equal(normalizeTuss("101012"), "00101012");
    assert.equal(normalizeTuss("10101012"), "10101012");
  });

  it("normaliza CID", () => {
    assert.equal(normalizeCid("J069"), "J06.9");
    assert.equal(normalizeCid("K80.2"), "K80.2");
  });

  it("normaliza telefone", () => {
    assert.equal(normalizePhone("(11) 98765-4321"), "11987654321");
  });

  it("normaliza número de guia", () => {
    assert.equal(normalizeGuideNumber("Guia #987654"), "987654");
  });
});

describe("TISS Parser — Detecção de tipo", () => {
  it("identifica Guia de Consulta", () => {
    const detection = detectGuideType(CONSULTA_OCR);
    assert.equal(detection.guideType, "guia_consulta");
    assert.ok(detection.confidence >= 0.3);
    assert.equal(detection.method, "header_regex");
  });

  it("identifica Guia SP/SADT", () => {
    const detection = detectGuideType(SADT_OCR);
    assert.equal(detection.guideType, "guia_sadt");
    assert.ok(detection.confidence >= 0.3);
  });

  it("identifica Honorário Individual", () => {
    const detection = detectGuideType(HONORARIO_OCR);
    assert.equal(detection.guideType, "guia_honorario");
    assert.ok(detection.confidence >= 0.3);
  });

  it("retorna unknown para template desconhecido", () => {
    const unknownOcr = buildOcrFromLines([
      { text: "DOCUMENTO GENÉRICO SEM TISS", y: 20 },
      { text: "Conteúdo aleatório", y: 100 },
    ]);
    const detection = detectGuideType(unknownOcr);
    assert.equal(detection.guideType, "unknown");
  });
});

describe("TISS Parser — Guia Consulta", () => {
  const parser = new TissParser();
  const guide = parser.parse(CONSULTA_OCR);

  it("produz StructuredGuide v1", () => {
    assert.equal(guide.version, "structured_guide_v1");
    assert.equal(guide.guideType, "guia_consulta");
  });

  it("extrai campos do paciente normalizados", () => {
    assert.equal(guide.fields.beneficiary_name?.value, "Maria Silva Santos");
    assert.equal(guide.fields.beneficiary_cpf?.value, "12345678901");
    assert.equal(guide.fields.beneficiary_cns?.value, "123456789012345");
    assert.equal(guide.fields.beneficiary_card_number?.value, "ABC-123456");
  });

  it("extrai operadora e prestador", () => {
    assert.equal(guide.fields.operator_ans_code?.value, "123456");
    assert.equal(guide.fields.provider_cnpj?.value, "12345678000190");
  });

  it("extrai CRM, TUSS, CID e valor", () => {
    assert.equal(guide.fields.executing_crm?.value, "SP-012345");
    assert.equal(guide.fields.procedure_code?.value, "10101012");
    assert.equal(guide.fields.cid_code?.value, "J06.9");
    assert.equal(guide.fields.total_value?.value, "250.00");
  });

  it("extrai data normalizada", () => {
    assert.equal(guide.fields.attendance_date?.value, "2026-03-15");
  });

  it("atribui confidence e status found aos campos principais", () => {
    assert.equal(guide.fields.beneficiary_name?.status, "found");
    assert.ok(guide.fields.beneficiary_name!.confidence > 0.5);
    assert.ok(guide.fields.beneficiary_name!.position != null);
    assert.ok(guide.fields.beneficiary_name!.ocrOrigin != null);
  });

  it("organiza campos por grupos", () => {
    assert.ok(guide.groups.paciente.length > 0);
    assert.ok(guide.groups.operadora.length > 0);
    assert.ok(guide.groups.executante.length > 0);
  });
});

describe("TISS Parser — Guia SADT", () => {
  const guide = parseOcrToStructuredGuide(SADT_OCR);

  it("identifica tipo SADT", () => {
    assert.equal(guide.guideType, "guia_sadt");
  });

  it("extrai solicitante e executante", () => {
    assert.equal(guide.fields.requesting_crm?.value, "RJ-054321");
    assert.equal(guide.fields.requesting_name?.value, "Dra Ana Costa");
    assert.equal(guide.fields.executing_crm?.value, "MG-098765");
  });

  it("extrai indicação clínica e CID", () => {
    assert.ok(guide.fields.clinical_indication?.value?.includes("Dor"));
    assert.equal(guide.fields.cid_code?.value, "K80.2");
  });

  it("extrai linhas de procedimento", () => {
    assert.ok(guide.procedures.length >= 1);
    const proc = guide.procedures[0]!;
    assert.equal(proc.fields.procedure_code?.value, "40101010");
  });
});

describe("TISS Parser — Honorário Individual", () => {
  const guide = parseOcrToStructuredGuide(HONORARIO_OCR);

  it("identifica tipo honorário", () => {
    assert.equal(guide.guideType, "guia_honorario");
  });

  it("extrai guia origem e grau participação", () => {
    assert.equal(guide.fields.parent_guide_number?.value, "555888");
    assert.ok(guide.fields.participation_degree?.value?.includes("Anestesista"));
  });

  it("extrai CRM e procedimento", () => {
    assert.equal(guide.fields.executing_crm?.value, "RS-067890");
    assert.equal(guide.fields.procedure_code?.value, "31001016");
  });
});

describe("TISS Parser — Documento parcialmente ilegível", () => {
  it("marca campos com baixa confidence como partial", () => {
    const partialOcr = buildOcrFromLines([
      { text: "GUIA DE CONSULTA", y: 20 },
      { text: "Nome do Beneficiário: M@r!@", y: 200, confidence: 0.35 },
      { text: "CPF: 12", y: 260, confidence: 0.28 },
    ]);
    const guide = parseOcrToStructuredGuide(partialOcr);
    assert.equal(guide.fields.beneficiary_name?.status, "partial");
    assert.equal(guide.fields.beneficiary_cpf?.status, "partial");
    assert.ok(guide.metadata.fieldsPartial >= 1);
  });
});

describe("TISS Parser — Campos ausentes", () => {
  it("identifica campos missing quando label não existe", () => {
    const sparseOcr = buildOcrFromLines([
      { text: "GUIA DE CONSULTA", y: 20 },
      { text: "Registro ANS: 123456", y: 60 },
    ]);
    const guide = parseOcrToStructuredGuide(sparseOcr);
    assert.equal(guide.fields.beneficiary_name?.status, "missing");
    assert.equal(guide.fields.beneficiary_name?.value, null);
    assert.ok(guide.metadata.fieldsMissing > 0);
  });
});

describe("TISS Parser — Campos duplicados", () => {
  it("marca campo como duplicate quando múltiplas ocorrências", () => {
    const dupOcr = buildOcrFromLines([
      { text: "GUIA DE CONSULTA", y: 20 },
      { text: "CPF: 111.222.333-44", y: 200 },
      { text: "CPF do Beneficiário: 555.666.777-88", y: 400 },
      { text: "Nome do Beneficiário: Test User", y: 250 },
    ]);
    const guide = parseOcrToStructuredGuide(dupOcr);
    assert.equal(guide.fields.beneficiary_cpf?.status, "duplicate");
    assert.ok(guide.metadata.fieldsDuplicate >= 1);
  });
});

describe("TISS Parser — Campos fora de posição", () => {
  it("marca campo out_of_position quando Y fora da região esperada", () => {
    const misplacedOcr = buildOcrFromLines([
      { text: "GUIA DE CONSULTA", y: 20 },
      { text: "Nome do Beneficiário: João Teste", y: 920 },
      { text: "Registro ANS: 123456", y: 60 },
    ]);
    const guide = parseOcrToStructuredGuide(misplacedOcr);
    assert.equal(guide.fields.beneficiary_name?.status, "out_of_position");
    assert.ok(guide.fields.beneficiary_name?.value != null);
    assert.ok(guide.metadata.fieldsOutOfPosition >= 1);
  });
});

describe("TISS Parser — Templates", () => {
  it("template consulta define campos obrigatórios MVP", () => {
    assert.ok(TEMPLATE_CONSULTA_V1.fields.some((f) => f.code === "beneficiary_name"));
    assert.ok(TEMPLATE_CONSULTA_V1.fields.some((f) => f.code === "procedure_code"));
    assert.ok(TEMPLATE_CONSULTA_V1.fields.some((f) => f.code === "executing_crm"));
  });

  it("template SADT inclui solicitante", () => {
    assert.ok(TEMPLATE_SADT_V1.fields.some((f) => f.code === "requesting_crm"));
    assert.ok(TEMPLATE_SADT_V1.fields.some((f) => f.code === "clinical_indication"));
  });

  it("template honorário inclui parent_guide_number", () => {
    assert.ok(TEMPLATE_HONORARIO_V1.fields.some((f) => f.code === "parent_guide_number"));
    assert.ok(TEMPLATE_HONORARIO_V1.fields.some((f) => f.code === "participation_degree"));
  });
});

describe("TISS Parser — Persistência (estrutura)", () => {
  it("structured_guide.json path segue convenção audit/", () => {
    const path = buildStructuredGuideStoragePath("tenant-1", "session-abc");
    assert.equal(path, "tenant-1/session-abc/audit/structured_guide.json");
    assert.equal(STRUCTURED_GUIDE_FILENAME, "structured_guide.json");
  });

  it("StructuredGuide preserva origem OCR (sem duplicar texto bruto — SEC-PII-01)", () => {
    const guide = parseOcrToStructuredGuide(CONSULTA_OCR);
    const field = guide.fields.operator_ans_code!;
    assert.equal(field.ocrOrigin?.provider, "test_provider");
    assert.ok(typeof field.ocrOrigin?.lineConfidence === "number");
    assert.ok(!("lineText" in (field.ocrOrigin ?? {})));
    assert.ok(!("wordTexts" in (field.ocrOrigin ?? {})));
    assert.ok(field.position?.boundingBox != null);
  });

  it("não executa validação de regras — apenas estruturação", () => {
    const guide = parseOcrToStructuredGuide(CONSULTA_OCR);
    for (const field of Object.values(guide.fields)) {
      assert.ok(!("validationStatus" in field));
      assert.ok(!("validationMessages" in field));
    }
  });
});

describe("TISS Parser — Módulo (estrutura de arquivos)", () => {
  it("TissParser existe e é instanciável", () => {
    const parser = new TissParser();
    assert.ok(typeof parser.parse === "function");
    assert.ok(typeof parser.detectGuideType === "function");
  });

  it("applyNormalizer retorna normalized flag", () => {
    const result = applyNormalizer("cpf", "123.456.789-01");
    assert.equal(result.value, "12345678901");
    assert.equal(result.normalized, true);
  });
});

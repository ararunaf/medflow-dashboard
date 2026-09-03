/**
 * F3-S1 follow-up — resolução de códigos de classificação operacional,
 * parsing de CRM e mapeamento de guia real para o input do serializador
 * TISS oficial. Lógica pura (sem Supabase) — a consulta ao banco fica em
 * xml-export-service.ts.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolveTissClassificationCodes,
  TissClassificationUnresolvedError,
} from "../../../src/lib/services/tiss/xml/tiss-classification-resolver.ts";
import { parseCrmForTiss } from "../../../src/lib/services/tiss/xml/tiss-professional-mapper.ts";
import {
  buildTissGuideExportInput,
  TissGuideExportValidationError,
  type TissExportContext,
  type TissGuideExportRow,
} from "../../../src/lib/services/tiss/xml/tiss-guide-export-mapper.ts";

describe("resolveTissClassificationCodes — F3-S1 follow-up", () => {
  const tenantDefaults = { defaultRegimeAtendimento: null, defaultCaraterAtendimento: null };

  it("usa o valor explícito da guia quando presente", () => {
    const resolved = resolveTissClassificationCodes(
      "g1",
      { guideType: "consulta", regimeAtendimento: "01", caraterAtendimento: null, tipoAtendimento: null, tipoConsulta: "1" },
      tenantDefaults,
    );
    assert.equal(resolved.regimeAtendimento, "01");
    assert.equal(resolved.tipoConsulta, "1");
  });

  it("cai para o default do tenant quando a guia não tem regimeAtendimento", () => {
    const resolved = resolveTissClassificationCodes(
      "g1",
      { guideType: "consulta", regimeAtendimento: null, caraterAtendimento: null, tipoAtendimento: null, tipoConsulta: "1" },
      { defaultRegimeAtendimento: "01", defaultCaraterAtendimento: null },
    );
    assert.equal(resolved.regimeAtendimento, "01");
  });

  it("valor explícito da guia tem prioridade sobre o default do tenant", () => {
    const resolved = resolveTissClassificationCodes(
      "g1",
      { guideType: "consulta", regimeAtendimento: "02", caraterAtendimento: null, tipoAtendimento: null, tipoConsulta: "1" },
      { defaultRegimeAtendimento: "01", defaultCaraterAtendimento: null },
    );
    assert.equal(resolved.regimeAtendimento, "02");
  });

  it("lança TissClassificationUnresolvedError listando exatamente o que falta", () => {
    try {
      resolveTissClassificationCodes(
        "g1",
        { guideType: "sadt", regimeAtendimento: null, caraterAtendimento: null, tipoAtendimento: null, tipoConsulta: null },
        tenantDefaults,
      );
      assert.fail("deveria ter lançado");
    } catch (err) {
      assert.ok(err instanceof TissClassificationUnresolvedError);
      assert.deepEqual(
        (err as TissClassificationUnresolvedError).missingFields.sort(),
        ["caraterAtendimento", "regimeAtendimento", "tipoAtendimento"].sort(),
      );
    }
  });

  it("guia de consulta não exige caraterAtendimento/tipoAtendimento (exclusivos de SADT)", () => {
    const resolved = resolveTissClassificationCodes(
      "g1",
      { guideType: "consulta", regimeAtendimento: "01", caraterAtendimento: null, tipoAtendimento: null, tipoConsulta: "1" },
      tenantDefaults,
    );
    assert.equal(resolved.caraterAtendimento, undefined);
    assert.equal(resolved.tipoAtendimento, undefined);
  });

  it("guia de honorário individual não exige nenhum código além de regimeAtendimento", () => {
    const resolved = resolveTissClassificationCodes(
      "g1",
      { guideType: "honorario_individual", regimeAtendimento: "01", caraterAtendimento: null, tipoAtendimento: null, tipoConsulta: null },
      tenantDefaults,
    );
    assert.equal(resolved.regimeAtendimento, "01");
  });

  it("guia sadt sem caraterAtendimento cai para o default do tenant", () => {
    const resolved = resolveTissClassificationCodes(
      "g1",
      { guideType: "sadt", regimeAtendimento: "01", caraterAtendimento: null, tipoAtendimento: "04", tipoConsulta: null },
      { defaultRegimeAtendimento: null, defaultCaraterAtendimento: "1" },
    );
    assert.equal(resolved.caraterAtendimento, "1");
  });
});

describe("parseCrmForTiss — F3-S1 follow-up", () => {
  it("reconhece formato UF-numero", () => {
    assert.deepEqual(parseCrmForTiss("SP-012345"), { uf: "SP", numero: "012345" });
  });

  it("reconhece formato numero/UF", () => {
    assert.deepEqual(parseCrmForTiss("12345/SP"), { uf: "SP", numero: "12345" });
  });

  it("reconhece formato numero UF sem separador explícito de barra", () => {
    assert.deepEqual(parseCrmForTiss("12345 SP"), { uf: "SP", numero: "12345" });
  });

  it("é case-insensitive", () => {
    assert.deepEqual(parseCrmForTiss("sp-012345"), { uf: "SP", numero: "012345" });
  });

  it("lança erro claro para formato não reconhecido", () => {
    assert.throws(() => parseCrmForTiss("crm invalido texto livre"), /não pôde ser interpretado/);
  });
});

function baseRow(overrides: Partial<TissGuideExportRow> = {}): TissGuideExportRow {
  return {
    id: "guide-1",
    guideNumber: 42,
    guideType: "consulta",
    attendanceDate: "2026-08-15",
    beneficiaryCardNumber: "0001234567",
    beneficiaryIsNewborn: false,
    regimeAtendimento: "01",
    caraterAtendimento: null,
    tipoAtendimento: null,
    tipoConsulta: "1",
    insuranceProviderAnsCode: "123456",
    professionalCrm: "SP-012345",
    professionalCboCode: "225125",
    professionalName: "Dra. Ana Souza",
    hospitalCnes: "1234567",
    hospitalName: "Hospital São José",
    items: [
      {
        procedureCode: "10101012",
        procedureDescription: "Consulta em consultório",
        quantity: 1,
        unitValue: 150,
        totalValue: 150,
        executionDate: "2026-08-15",
      },
    ],
    ...overrides,
  };
}

const FULL_CTX: TissExportContext = {
  tenantCnpj: "12345678000199",
  defaultRegimeAtendimento: null,
  defaultCaraterAtendimento: null,
};

describe("buildTissGuideExportInput — F3-S1 follow-up (mapeamento completo)", () => {
  it("mapeia guia de consulta completa sem lançar erro", () => {
    const result = buildTissGuideExportInput(baseRow(), FULL_CTX);
    assert.equal(result.kind, "consulta");
    if (result.kind === "consulta") {
      assert.equal(result.input.beneficiario.numeroCarteira, "0001234567");
      assert.equal(result.input.profissionalExecutante.ufConselho, "SP");
      assert.equal(result.input.profissionalExecutante.numeroConselhoProfissional, "012345");
      assert.equal(result.input.dadosAtendimento.tipoConsulta, "1");
      assert.equal(result.input.numeroGuiaPrestador, "42");
    }
  });

  it("mapeia guia SADT completa somando o valorTotalGeral dos itens", () => {
    const row = baseRow({
      guideType: "sadt",
      caraterAtendimento: "1",
      tipoAtendimento: "04",
      tipoConsulta: null,
      items: [
        { procedureCode: "A", procedureDescription: "a", quantity: 1, unitValue: 100, totalValue: 100, executionDate: "2026-08-15" },
        { procedureCode: "B", procedureDescription: "b", quantity: 2, unitValue: 50, totalValue: 100, executionDate: "2026-08-15" },
      ],
    });
    const result = buildTissGuideExportInput(row, FULL_CTX);
    assert.equal(result.kind, "sadt");
    if (result.kind === "sadt") {
      assert.equal(result.input.valorTotalGeral, 200);
      assert.equal(result.input.procedimentosExecutados.length, 2);
      assert.equal(result.input.procedimentosExecutados[1]!.sequencialItem, 2);
    }
  });

  it("mapeia guia de honorário individual com grauParticipacao Clínico", () => {
    const row = baseRow({ guideType: "honorario_individual", tipoConsulta: null });
    const result = buildTissGuideExportInput(row, FULL_CTX);
    assert.equal(result.kind, "honorario_individual");
    if (result.kind === "honorario_individual") {
      assert.equal(result.input.procedimentosRealizados[0]!.profissionais[0]!.grauParticipacao, "12");
      assert.equal(result.input.procedimentosRealizados[0]!.profissionais[0]!.nomeProfissional, "Dra. Ana Souza");
    }
  });

  it("agrega TODOS os campos obrigatórios ausentes numa única TissGuideExportValidationError", () => {
    const row = baseRow({
      beneficiaryCardNumber: null,
      hospitalCnes: null,
      professionalCboCode: null,
      insuranceProviderAnsCode: null,
    });
    try {
      buildTissGuideExportInput(row, FULL_CTX);
      assert.fail("deveria ter lançado");
    } catch (err) {
      assert.ok(err instanceof TissGuideExportValidationError);
      const e = err as TissGuideExportValidationError;
      assert.equal(e.guideId, "guide-1");
      assert.ok(e.missingFields.length >= 4, `esperado >=4 campos faltando, teve ${e.missingFields.length}`);
      assert.ok(e.missingFields.some((m) => m.includes("carteirinha")));
      assert.ok(e.missingFields.some((m) => m.includes("CNES")));
      assert.ok(e.missingFields.some((m) => m.includes("CBO")));
      assert.ok(e.missingFields.some((m) => m.includes("ANS")));
    }
  });

  it("lança erro quando o CNPJ da cooperativa não está configurado", () => {
    assert.throws(
      () => buildTissGuideExportInput(baseRow(), { ...FULL_CTX, tenantCnpj: null }),
      (err: unknown) =>
        err instanceof TissGuideExportValidationError &&
        err.missingFields.some((m) => m.includes("CNPJ")),
    );
  });

  it("lança erro quando não há nenhum item/procedimento na guia", () => {
    assert.throws(
      () => buildTissGuideExportInput(baseRow({ items: [] }), FULL_CTX),
      (err: unknown) =>
        err instanceof TissGuideExportValidationError &&
        err.missingFields.some((m) => m.includes("procedimento")),
    );
  });

  it("lança erro quando o CRM do profissional não pôde ser interpretado", () => {
    assert.throws(
      () => buildTissGuideExportInput(baseRow({ professionalCrm: "texto sem formato" }), FULL_CTX),
      (err: unknown) =>
        err instanceof TissGuideExportValidationError &&
        err.missingFields.some((m) => m.includes("não pôde ser interpretado")),
    );
  });

  it("usa o default institucional de regime/caráter quando a guia não define", () => {
    const row = baseRow({ guideType: "sadt", regimeAtendimento: null, caraterAtendimento: null, tipoAtendimento: "04", tipoConsulta: null });
    const ctxWithDefaults: TissExportContext = {
      ...FULL_CTX,
      defaultRegimeAtendimento: "01",
      defaultCaraterAtendimento: "1",
    };
    const result = buildTissGuideExportInput(row, ctxWithDefaults);
    assert.equal(result.kind, "sadt");
    if (result.kind === "sadt") {
      assert.equal(result.input.dadosAtendimento.regimeAtendimento, "01");
      assert.equal(result.input.caraterAtendimento, "1");
    }
  });
});

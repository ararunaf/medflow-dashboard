/**
 * F3-S1 — serializador XML TISS oficial (ANS 4.01.00).
 *
 * Confere estrutura contra o XSD oficial real (verificado em
 * tissV4_01_00.xsd/tissComplexTypesV4_01_00.xsd/tissGuiasV4_01_00.xsd,
 * mirror de github.com/renatofagalde/app-tiss-schemas) — não é validação
 * de schema (isso é F3-S2), é prova de que a ordem/nome/aninhamento dos
 * elementos bate campo a campo com o padrão real, não um schema inventado.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildMensagemTissXml } from "../../../src/lib/services/tiss/xml/tiss-xml-serializer.ts";
import {
  resolveTissUfCode,
  formatTissDate,
  formatTissDecimal2,
  formatTissRegistroAns,
} from "../../../src/lib/services/tiss/xml/tiss-xml-simple-types.ts";
import type {
  TissEnvelopeInput,
  TissGuiaConsultaInput,
  TissGuiaHonorarioInput,
  TissGuiaSadtInput,
} from "../../../src/lib/services/tiss/xml/tiss-xml-types.ts";

const PROFISSIONAL = {
  nomeProfissional: "Dra. Ana Souza",
  conselhoProfissional: "06",
  numeroConselhoProfissional: "123456",
  ufConselho: "SP",
  cbos: "225125",
};

function baseConsulta(): TissGuiaConsultaInput {
  return {
    registroANS: "123456",
    numeroGuiaPrestador: "GP-0001",
    beneficiario: { numeroCarteira: "0001234567", atendimentoRN: false },
    contratadoExecutante: { kind: "codigoNaOperadora", codigo: "COOP001", cnes: "1234567" },
    profissionalExecutante: PROFISSIONAL,
    indicacaoAcidente: "9",
    dadosAtendimento: {
      regimeAtendimento: "01",
      dataAtendimento: "2026-08-15",
      tipoConsulta: "1",
      procedimento: { codigoTabela: "22", codigoProcedimento: "10101012", valorProcedimento: 150 },
    },
  };
}

function baseSadt(): TissGuiaSadtInput {
  return {
    registroANS: "123456",
    numeroGuiaPrestador: "GP-0002",
    beneficiario: { numeroCarteira: "0001234567", atendimentoRN: false },
    contratadoSolicitante: { kind: "codigoNaOperadora", codigo: "COOP001" },
    nomeContratadoSolicitante: "Cooperativa Med Brasil",
    profissionalSolicitante: PROFISSIONAL,
    caraterAtendimento: "1",
    contratadoExecutante: { kind: "codigoNaOperadora", codigo: "COOP001", cnes: "1234567" },
    dadosAtendimento: { tipoAtendimento: "02", indicacaoAcidente: "9", regimeAtendimento: "01" },
    procedimentosExecutados: [
      {
        sequencialItem: 1,
        dataExecucao: "2026-08-15",
        procedimento: { codigoTabela: "22", codigoProcedimento: "40101010", descricaoProcedimento: "Ecocardiograma" },
        quantidadeExecutada: 1,
        reducaoAcrescimo: 0,
        valorUnitario: 200,
        valorTotal: 200,
      },
    ],
    valorTotalGeral: 200,
  };
}

function baseHonorario(): TissGuiaHonorarioInput {
  return {
    registroANS: "123456",
    numeroGuiaPrestador: "GP-0003",
    guiaSolicInternacao: "GS-0001",
    beneficiario: { numeroCarteira: "0001234567", atendimentoRN: false },
    localContratado: { kind: "codigoNaOperadora", codigo: "COOP001", nomeContratado: "Hospital São José", cnes: "1234567" },
    dadosContratadoExecutante: { codigoNaOperadora: "COOP001", cnesContratadoExecutante: "1234567" },
    dadosInternacao: { dataInicioFaturamento: "2026-08-15", dataFimFaturamento: "2026-08-16" },
    procedimentosRealizados: [
      {
        sequencialItem: 1,
        dataExecucao: "2026-08-15",
        procedimento: { codigoTabela: "22", codigoProcedimento: "30918090", descricaoProcedimento: "Ablação" },
        quantidadeExecutada: 1,
        reducaoAcrescimo: 0,
        valorUnitario: 800,
        valorTotal: 800,
        profissionais: [
          {
            grauParticipacao: "12",
            codProfissional: { kind: "codigoNaOperadora", codigo: "PROF001" },
            nomeProfissional: "Dra. Ana Souza",
            conselhoProfissional: "06",
            numeroConselhoProfissional: "123456",
            ufConselho: "SP",
            cbo: "225125",
          },
        ],
      },
    ],
    valorTotalHonorarios: 800,
    dataEmissaoGuia: "2026-08-16",
  };
}

function baseEnvelope(overrides: Partial<TissEnvelopeInput> = {}): TissEnvelopeInput {
  return {
    sequencialTransacao: "000000000001",
    dataRegistroTransacao: "2026-08-16",
    horaRegistroTransacao: "2026-08-16T14:30:00Z",
    origemPrestador: { kind: "codigoNaOperadora", codigo: "COOP001" },
    destinoRegistroANS: "123456",
    numeroLote: "LOTE-0001",
    guiasConsulta: [baseConsulta()],
    ...overrides,
  };
}

describe("tiss-xml-simple-types — F3-S1 (tabelas oficiais reais)", () => {
  it("resolveTissUfCode usa o código IBGE, não a sigla (dm_UF do XSD oficial)", () => {
    assert.equal(resolveTissUfCode("SP"), "35");
    assert.equal(resolveTissUfCode("RJ"), "33");
    assert.equal(resolveTissUfCode("df"), "53");
  });

  it("resolveTissUfCode lança erro claro para UF desconhecida", () => {
    assert.throws(() => resolveTissUfCode("ZZ"), /não reconhecida/);
  });

  it("formatTissDate produz YYYY-MM-DD (xsd:date)", () => {
    assert.equal(formatTissDate("2026-08-15"), "2026-08-15");
  });

  it("formatTissDecimal2 sempre com 2 casas", () => {
    assert.equal(formatTissDecimal2(150), "150.00");
    assert.equal(formatTissDecimal2(99.9), "99.90");
  });

  it("formatTissRegistroAns preenche com zero à esquerda até 6 dígitos", () => {
    assert.equal(formatTissRegistroAns("42"), "000042");
    assert.equal(formatTissRegistroAns("123456"), "123456");
  });

  it("formatTissRegistroAns rejeita mais de 6 dígitos", () => {
    assert.throws(() => formatTissRegistroAns("1234567"));
  });
});

describe("buildMensagemTissXml — F3-S1 (estrutura oficial, campo a campo)", () => {
  it("declara o namespace oficial ANS como default no elemento raiz", () => {
    const xml = buildMensagemTissXml(baseEnvelope());
    assert.match(xml, /<mensagemTISS xmlns="http:\/\/www\.ans\.gov\.br\/padroes\/tiss\/schemas">/);
  });

  it("cabecalho segue a ordem exata do XSD: identificacaoTransacao, origem, destino, Padrao", () => {
    const xml = buildMensagemTissXml(baseEnvelope());
    const cabecalho = xml.match(/<cabecalho>([\s\S]*?)<\/cabecalho>/)![1]!;
    const order = ["identificacaoTransacao", "origem", "destino", "Padrao"];
    let lastIndex = -1;
    for (const tag of order) {
      const idx = cabecalho.indexOf(`<${tag}`);
      assert.ok(idx > lastIndex, `${tag} fora de ordem no cabecalho`);
      lastIndex = idx;
    }
  });

  it("identificacaoTransacao usa ENVIO_LOTE_GUIAS e formata data/hora TISS", () => {
    const xml = buildMensagemTissXml(baseEnvelope());
    assert.match(xml, /<tipoTransacao>ENVIO_LOTE_GUIAS<\/tipoTransacao>/);
    assert.match(xml, /<dataRegistroTransacao>2026-08-16<\/dataRegistroTransacao>/);
    assert.match(xml, /<horaRegistroTransacao>14:30:00<\/horaRegistroTransacao>/);
  });

  it("origem envolve a identificação em <identificacaoPrestador> (achado real da validação F3-S2 — origem não aceita CNPJ/CPF/código soltos como filho direto)", () => {
    const xmlCodigo = buildMensagemTissXml(baseEnvelope({ origemPrestador: { kind: "codigoNaOperadora", codigo: "X1" } }));
    assert.match(
      xmlCodigo,
      /<origem>\s*<identificacaoPrestador>\s*<codigoPrestadorNaOperadora>X1<\/codigoPrestadorNaOperadora>\s*<\/identificacaoPrestador>\s*<\/origem>/,
    );

    const xmlCnpj = buildMensagemTissXml(baseEnvelope({ origemPrestador: { kind: "cnpj", cnpj: "12345678000199" } }));
    assert.match(
      xmlCnpj,
      /<origem>\s*<identificacaoPrestador>\s*<CNPJ>12345678000199<\/CNPJ>\s*<\/identificacaoPrestador>\s*<\/origem>/,
    );
  });

  it("registroANS de destino é normalizado para 6 dígitos", () => {
    const xml = buildMensagemTissXml(baseEnvelope({ destinoRegistroANS: "42" }));
    assert.match(xml, /<destino>\s*<registroANS>000042<\/registroANS>\s*<\/destino>/);
  });

  it("prestadorParaOperadora > loteGuias > numeroLote > guiasTISS, na ordem certa", () => {
    const xml = buildMensagemTissXml(baseEnvelope());
    const lote = xml.match(/<loteGuias>([\s\S]*?)<\/loteGuias>/)![1]!;
    const numeroLoteIdx = lote.indexOf("<numeroLote>");
    const guiasTissIdx = lote.indexOf("<guiasTISS>");
    assert.ok(numeroLoteIdx >= 0 && guiasTissIdx > numeroLoteIdx);
  });

  it("epilogo com hash (placeholder — checksum real é F3-S2)", () => {
    const xml = buildMensagemTissXml(baseEnvelope());
    assert.match(xml, /<epilogo>\s*<hash>PENDENTE<\/hash>\s*<\/epilogo>/);
  });

  it("lança erro claro quando o lote não tem nenhuma guia", () => {
    assert.throws(
      () => buildMensagemTissXml(baseEnvelope({ guiasConsulta: undefined })),
      /sem nenhuma guia/,
    );
  });

  describe("guiaConsulta — ctm_consultaGuia", () => {
    it("segue a ordem oficial: cabecalhoConsulta, dadosBeneficiario, contratadoExecutante, profissionalExecutante, indicacaoAcidente, dadosAtendimento", () => {
      const xml = buildMensagemTissXml(baseEnvelope());
      const guia = xml.match(/<guiaConsulta>([\s\S]*?)<\/guiaConsulta>/)![1]!;
      const order = [
        "cabecalhoConsulta",
        "dadosBeneficiario",
        "contratadoExecutante",
        "profissionalExecutante",
        "indicacaoAcidente",
        "dadosAtendimento",
      ];
      let lastIndex = -1;
      for (const tag of order) {
        const idx = guia.indexOf(`<${tag}`);
        assert.ok(idx > lastIndex, `${tag} fora de ordem em guiaConsulta`);
        lastIndex = idx;
      }
    });

    it("profissionalExecutante usa o código IBGE da UF e CBOS, não a sigla", () => {
      const xml = buildMensagemTissXml(baseEnvelope());
      assert.match(xml, /<profissionalExecutante>[\s\S]*?<UF>35<\/UF>[\s\S]*?<CBOS>225125<\/CBOS>[\s\S]*?<\/profissionalExecutante>/);
    });

    it("valor do procedimento sempre com 2 casas decimais", () => {
      const xml = buildMensagemTissXml(baseEnvelope());
      assert.match(xml, /<valorProcedimento>150\.00<\/valorProcedimento>/);
    });
  });

  describe("guiaSP-SADT — ctm_sp-sadtGuia", () => {
    it('usa o nome de elemento oficial "guiaSP-SADT" (com hífen, confirmado no XSD)', () => {
      const xml = buildMensagemTissXml(baseEnvelope({ guiasConsulta: undefined, guiasSadt: [baseSadt()] }));
      assert.match(xml, /<guiaSP-SADT>[\s\S]*<\/guiaSP-SADT>/);
    });

    it("segue a ordem oficial: cabecalhoGuia, dadosBeneficiario, dadosSolicitante, dadosSolicitacao, dadosExecutante, dadosAtendimento, procedimentosExecutados, valorTotal", () => {
      const xml = buildMensagemTissXml(baseEnvelope({ guiasConsulta: undefined, guiasSadt: [baseSadt()] }));
      const guia = xml.match(/<guiaSP-SADT>([\s\S]*?)<\/guiaSP-SADT>/)![1]!;
      const order = [
        "cabecalhoGuia",
        "dadosBeneficiario",
        "dadosSolicitante",
        "dadosSolicitacao",
        "dadosExecutante",
        "dadosAtendimento",
        "procedimentosExecutados",
        "valorTotal",
      ];
      let lastIndex = -1;
      for (const tag of order) {
        const idx = guia.indexOf(`<${tag}`);
        assert.ok(idx > lastIndex, `${tag} fora de ordem em guiaSP-SADT`);
        lastIndex = idx;
      }
    });

    it("procedimentoExecutado inclui sequencialItem, dataExecucao, procedimento, quantidade, redução, valores", () => {
      const xml = buildMensagemTissXml(baseEnvelope({ guiasConsulta: undefined, guiasSadt: [baseSadt()] }));
      assert.match(xml, /<sequencialItem>1<\/sequencialItem>/);
      assert.match(xml, /<dataExecucao>2026-08-15<\/dataExecucao>/);
      assert.match(xml, /<codigoTabela>22<\/codigoTabela>/);
      assert.match(xml, /<valorTotal>200\.00<\/valorTotal>/);
    });
  });

  describe("guiaHonorarios — ctm_honorarioIndividualGuia", () => {
    it("segue a ordem oficial: cabecalhoGuia, guiaSolicInternacao, beneficiario, localContratado, dadosContratadoExecutante, dadosInternacao, procedimentosRealizados", () => {
      const xml = buildMensagemTissXml(baseEnvelope({ guiasConsulta: undefined, guiasHonorario: [baseHonorario()] }));
      const guia = xml.match(/<guiaHonorarios>([\s\S]*?)<\/guiaHonorarios>/)![1]!;
      const order = [
        "cabecalhoGuia",
        "guiaSolicInternacao",
        "beneficiario",
        "localContratado",
        "dadosContratadoExecutante",
        "dadosInternacao",
        "procedimentosRealizados",
      ];
      let lastIndex = -1;
      for (const tag of order) {
        const idx = guia.indexOf(`<${tag}`);
        assert.ok(idx > lastIndex, `${tag} fora de ordem em guiaHonorarios`);
        lastIndex = idx;
      }
    });

    it("cada profissional do procedimento traz grauParticipacao, codProfissional, conselho, UF e CBO", () => {
      const xml = buildMensagemTissXml(baseEnvelope({ guiasConsulta: undefined, guiasHonorario: [baseHonorario()] }));
      assert.match(xml, /<grauParticipacao>12<\/grauParticipacao>/);
      assert.match(xml, /<codProfissional>\s*<codigoPrestadorNaOperadora>PROF001<\/codigoPrestadorNaOperadora>\s*<\/codProfissional>/);
      assert.match(xml, /<UF>35<\/UF>/);
      assert.match(xml, /<CBO>225125<\/CBO>/);
    });
  });

  it("gera um lote com múltiplos tipos de guia no mesmo guiasTISS", () => {
    const xml = buildMensagemTissXml(
      baseEnvelope({ guiasConsulta: [baseConsulta()], guiasSadt: [baseSadt()], guiasHonorario: [baseHonorario()] }),
    );
    assert.match(xml, /<guiaConsulta>/);
    assert.match(xml, /<guiaSP-SADT>/);
    assert.match(xml, /<guiaHonorarios>/);
  });
});

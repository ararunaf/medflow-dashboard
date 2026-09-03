/**
 * F3-S2 — validação real contra o XSD oficial ANS (padrão TISS 4.01.00).
 *
 * Usa libxml2-wasm de verdade compilando os 6 arquivos XSD reais (não um
 * validador estrutural aproximado) — prova que buildMensagemTissXml (F3-S1)
 * produz XML que PASSA na validação de schema real, e que XML quebrado é
 * rejeitado com erro real do compilador de schema, não silenciosamente
 * aceito.
 */
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { TissXsdValidator } from "../../../src/lib/services/tiss/xml/tiss-xsd-validator.ts";
import { loadTissXsdFilesFromDisk } from "../../../src/lib/services/tiss/xml/schemas/load-xsd-files.node.ts";
import { buildMensagemTissXml } from "../../../src/lib/services/tiss/xml/tiss-xml-serializer.ts";
import type { TissEnvelopeInput, TissGuiaConsultaInput } from "../../../src/lib/services/tiss/xml/tiss-xml-types.ts";

let validator: TissXsdValidator;

before(() => {
  validator = TissXsdValidator.fromFiles(loadTissXsdFilesFromDisk());
});

const PROFISSIONAL = {
  nomeProfissional: "Dra. Ana Souza",
  conselhoProfissional: "06",
  numeroConselhoProfissional: "123456",
  ufConselho: "SP",
  cbos: "225125",
};

function validEnvelope(): TissEnvelopeInput {
  const guiaConsulta: TissGuiaConsultaInput = {
    registroANS: "123456",
    numeroGuiaPrestador: "42",
    beneficiario: { numeroCarteira: "0001234567", atendimentoRN: false },
    contratadoExecutante: { kind: "cnpj", cnpj: "12345678000199", cnes: "1234567" },
    profissionalExecutante: PROFISSIONAL,
    indicacaoAcidente: "9",
    dadosAtendimento: {
      regimeAtendimento: "01",
      dataAtendimento: "2026-08-15",
      tipoConsulta: "1",
      procedimento: { codigoTabela: "22", codigoProcedimento: "10101012", valorProcedimento: 150 },
    },
  };
  return {
    sequencialTransacao: "000000000001",
    dataRegistroTransacao: "2026-08-16",
    horaRegistroTransacao: "2026-08-16T14:30:00Z",
    origemPrestador: { kind: "cnpj", cnpj: "12345678000199" },
    destinoRegistroANS: "123456",
    numeroLote: "LOTE-0001",
    guiasConsulta: [guiaConsulta],
  };
}

describe("TissXsdValidator — F3-S2 (validação real contra XSD oficial ANS)", () => {
  it("aceita um mensagemTISS válido gerado pelo serializador F3-S1", () => {
    const xml = buildMensagemTissXml(validEnvelope());
    const result = validator.validate(xml);
    assert.deepEqual(result, { valid: true });
  });

  it("aceita guia SP-SADT válida", () => {
    const envelope = validEnvelope();
    envelope.guiasConsulta = undefined;
    envelope.guiasSadt = [
      {
        registroANS: "123456",
        numeroGuiaPrestador: "43",
        beneficiario: { numeroCarteira: "0001234567", atendimentoRN: false },
        contratadoSolicitante: { kind: "cnpj", cnpj: "12345678000199" },
        nomeContratadoSolicitante: "Cooperativa Med Brasil",
        profissionalSolicitante: PROFISSIONAL,
        caraterAtendimento: "1",
        contratadoExecutante: { kind: "cnpj", cnpj: "12345678000199", cnes: "1234567" },
        dadosAtendimento: { tipoAtendimento: "04", indicacaoAcidente: "9", regimeAtendimento: "01" },
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
      },
    ];
    const xml = buildMensagemTissXml(envelope);
    assert.deepEqual(validator.validate(xml), { valid: true });
  });

  it("aceita guia de honorário individual válida", () => {
    const envelope = validEnvelope();
    envelope.guiasConsulta = undefined;
    envelope.guiasHonorario = [
      {
        registroANS: "123456",
        numeroGuiaPrestador: "44",
        guiaSolicInternacao: "44",
        beneficiario: { numeroCarteira: "0001234567", atendimentoRN: false },
        localContratado: { kind: "cnpjLocalExecutante", cnpj: "12345678000199", nomeContratado: "Hospital São José", cnes: "1234567" },
        dadosContratadoExecutante: { codigoNaOperadora: "12345678000199", cnesContratadoExecutante: "1234567" },
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
                codProfissional: { kind: "codigoNaOperadora", codigo: "12345678000199" },
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
      },
    ];
    const xml = buildMensagemTissXml(envelope);
    const result = validator.validate(xml);
    assert.deepEqual(result, { valid: true });
  });

  it("rejeita XML que não é sequer mensagemTISS", () => {
    const result = validator.validate('<?xml version="1.0"?><algumaCoisa/>');
    assert.equal(result.valid, false);
    if (!result.valid) assert.ok(result.errors.length > 0);
  });

  it("rejeita quando um campo obrigatório está ausente (numeroGuiaPrestador removido)", () => {
    const xml = buildMensagemTissXml(validEnvelope()).replace(
      /<numeroGuiaPrestador>42<\/numeroGuiaPrestador>/,
      "",
    );
    const result = validator.validate(xml);
    assert.equal(result.valid, false);
  });

  it("rejeita quando um enum recebe valor fora da tabela oficial (UF inválida via ataque direto ao XML)", () => {
    const xml = buildMensagemTissXml(validEnvelope()).replace("<UF>35</UF>", "<UF>99</UF>");
    const result = validator.validate(xml);
    assert.equal(result.valid, false);
  });

  it("rejeita quando os elementos estão fora de ordem", () => {
    const xml = buildMensagemTissXml(validEnvelope());
    // troca a ordem de dadosBeneficiario e contratadoExecutante dentro da guia de consulta
    const swapped = xml.replace(
      /(<dadosBeneficiario>[\s\S]*?<\/dadosBeneficiario>)\n(<contratadoExecutante>[\s\S]*?<\/contratadoExecutante>)/,
      "$2\n$1",
    );
    assert.notEqual(swapped, xml, "o replace precisa ter encontrado o trecho a trocar");
    const result = validator.validate(swapped);
    assert.equal(result.valid, false);
  });

  it("erros retornados citam arquivo/linha reais do compilador de schema", () => {
    const xml = buildMensagemTissXml(validEnvelope()).replace("<UF>35</UF>", "<UF>99</UF>");
    const result = validator.validate(xml);
    assert.equal(result.valid, false);
    if (!result.valid) {
      assert.match(result.errors[0]!, /:\d+:/); // "arquivo:linha: mensagem"
    }
  });
});

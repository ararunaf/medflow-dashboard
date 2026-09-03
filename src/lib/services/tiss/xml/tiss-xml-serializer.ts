/**
 * Serializador XML TISS oficial (ANS, padrão 4.01.00) — F3-S1.
 *
 * Gera mensagemTISS > cabecalho + prestadorParaOperadora.loteGuias +
 * epilogo, campo a campo, na ordem exata do XSD oficial (verificado em
 * tissV4_01_00.xsd / tissComplexTypesV4_01_00.xsd / tissGuiasV4_01_00.xsd
 * — ver tiss-xml-types.ts para a proveniência). Substitui o schema próprio
 * <medflowTissExport> usado até aqui (src/lib/services/tiss/xml-export-service.ts).
 *
 * Escopo: guiaConsulta, guiaSP-SADT (execução) e guiaHonorarios — os 3
 * tipos que o parser do MedFlow já distingue. Sem assinatura digital
 * (ds:Signature é minOccurs="0" no XSD — opcional; XMLDSig real fica para
 * quando houver certificado digital configurado, fora de escopo aqui).
 * Validação contra o XSD oficial (bloquear exportação inválida) é F3-S2,
 * não esta sprint — aqui a garantia é estrutural (campo certo, ordem certa,
 * tipo certo), não uma passada de validador de schema.
 */
import {
  escapeTissXml,
  formatTissDate,
  formatTissDecimal2,
  formatTissRegistroAns,
  formatTissTime,
  resolveTissUfCode,
  TISS_PADRAO_VERSAO,
  TISS_TIPO_TRANSACAO_ENVIO_LOTE_GUIAS,
} from "./tiss-xml-simple-types";
import type {
  TissBeneficiarioInput,
  TissContratadoDadosInput,
  TissEnvelopeInput,
  TissGuiaConsultaInput,
  TissGuiaHonorarioInput,
  TissGuiaSadtInput,
  TissPrestadorIdentificacaoInput,
  TissProcedimentoDadosInput,
  TissProfissionalInput,
} from "./tiss-xml-types";

function el(name: string, value: string): string {
  return `<${name}>${escapeTissXml(value)}</${name}>`;
}

function serializeContratadoDados(input: TissContratadoDadosInput): string {
  switch (input.kind) {
    case "codigoNaOperadora":
      return el("codigoPrestadorNaOperadora", input.codigo);
    case "cpf":
      return el("cpfContratado", input.cpf);
    case "cnpj":
      return el("cnpjContratado", input.cnpj);
  }
}

function serializePrestadorIdentificacao(input: TissPrestadorIdentificacaoInput): string {
  switch (input.kind) {
    case "codigoNaOperadora":
      return el("codigoPrestadorNaOperadora", input.codigo);
    case "cpf":
      return el("CPF", input.cpf);
    case "cnpj":
      return el("CNPJ", input.cnpj);
  }
}

function serializeBeneficiario(b: TissBeneficiarioInput): string[] {
  return [el("numeroCarteira", b.numeroCarteira), el("atendimentoRN", b.atendimentoRN ? "S" : "N")];
}

function serializeProfissional(tag: string, p: TissProfissionalInput): string[] {
  const lines: string[] = [`<${tag}>`];
  if (p.nomeProfissional) lines.push(el("nomeProfissional", p.nomeProfissional));
  lines.push(
    el("conselhoProfissional", p.conselhoProfissional),
    el("numeroConselhoProfissional", p.numeroConselhoProfissional),
    el("UF", resolveTissUfCode(p.ufConselho)),
    el("CBOS", p.cbos),
  );
  lines.push(`</${tag}>`);
  return lines;
}

function serializeProcedimentoDados(tag: string, p: TissProcedimentoDadosInput): string[] {
  const lines: string[] = [`<${tag}>`, el("codigoTabela", p.codigoTabela), el("codigoProcedimento", p.codigoProcedimento)];
  if (p.descricaoProcedimento) lines.push(el("descricaoProcedimento", p.descricaoProcedimento));
  lines.push(`</${tag}>`);
  return lines;
}

/** ctm_consultaGuia */
function serializeGuiaConsulta(g: TissGuiaConsultaInput): string[] {
  const lines: string[] = ["<guiaConsulta>"];
  lines.push(
    "<cabecalhoConsulta>",
    el("registroANS", formatTissRegistroAns(g.registroANS)),
    el("numeroGuiaPrestador", g.numeroGuiaPrestador),
    "</cabecalhoConsulta>",
  );
  if (g.numeroGuiaOperadora) lines.push(el("numeroGuiaOperadora", g.numeroGuiaOperadora));
  lines.push("<dadosBeneficiario>", ...serializeBeneficiario(g.beneficiario), "</dadosBeneficiario>");
  lines.push(
    "<contratadoExecutante>",
    serializeContratadoDados(g.contratadoExecutante),
    el("CNES", g.contratadoExecutante.cnes),
    "</contratadoExecutante>",
  );
  lines.push(...serializeProfissional("profissionalExecutante", g.profissionalExecutante));
  lines.push(el("indicacaoAcidente", g.indicacaoAcidente));
  lines.push(
    "<dadosAtendimento>",
    el("regimeAtendimento", g.dadosAtendimento.regimeAtendimento),
    el("dataAtendimento", formatTissDate(g.dadosAtendimento.dataAtendimento)),
    el("tipoConsulta", g.dadosAtendimento.tipoConsulta),
    "<procedimento>",
    el("codigoTabela", g.dadosAtendimento.procedimento.codigoTabela),
    el("codigoProcedimento", g.dadosAtendimento.procedimento.codigoProcedimento),
    el("valorProcedimento", formatTissDecimal2(g.dadosAtendimento.procedimento.valorProcedimento)),
    "</procedimento>",
    "</dadosAtendimento>",
  );
  if (g.observacao) lines.push(el("observacao", g.observacao));
  lines.push("</guiaConsulta>");
  return lines;
}

/** ctm_sp-sadtGuia (execução) */
function serializeGuiaSadt(g: TissGuiaSadtInput): string[] {
  const lines: string[] = ['<guiaSP-SADT>'];
  lines.push(
    "<cabecalhoGuia>",
    el("registroANS", formatTissRegistroAns(g.registroANS)),
    el("numeroGuiaPrestador", g.numeroGuiaPrestador),
    "</cabecalhoGuia>",
  );
  if (g.numeroGuiaOperadora) lines.push(el("numeroGuiaOperadora", g.numeroGuiaOperadora));
  lines.push("<dadosBeneficiario>", ...serializeBeneficiario(g.beneficiario), "</dadosBeneficiario>");
  lines.push(
    "<dadosSolicitante>",
    "<contratadoSolicitante>",
    serializeContratadoDados(g.contratadoSolicitante),
    "</contratadoSolicitante>",
    el("nomeContratadoSolicitante", g.nomeContratadoSolicitante),
    ...serializeProfissional("profissionalSolicitante", g.profissionalSolicitante),
    "</dadosSolicitante>",
  );
  lines.push(
    "<dadosSolicitacao>",
    el("caraterAtendimento", g.caraterAtendimento),
    ...(g.indicacaoClinica ? [el("indicacaoClinica", g.indicacaoClinica)] : []),
    "</dadosSolicitacao>",
  );
  lines.push(
    "<dadosExecutante>",
    "<contratadoExecutante>",
    serializeContratadoDados(g.contratadoExecutante),
    "</contratadoExecutante>",
    el("CNES", g.contratadoExecutante.cnes),
    "</dadosExecutante>",
  );
  lines.push(
    "<dadosAtendimento>",
    el("tipoAtendimento", g.dadosAtendimento.tipoAtendimento),
    el("indicacaoAcidente", g.dadosAtendimento.indicacaoAcidente),
    el("regimeAtendimento", g.dadosAtendimento.regimeAtendimento),
    "</dadosAtendimento>",
  );
  if (g.procedimentosExecutados.length > 0) {
    lines.push("<procedimentosExecutados>");
    for (const p of g.procedimentosExecutados) {
      lines.push(
        "<procedimentoExecutado>",
        el("sequencialItem", String(p.sequencialItem)),
        el("dataExecucao", formatTissDate(p.dataExecucao)),
        ...serializeProcedimentoDados("procedimento", p.procedimento),
        el("quantidadeExecutada", String(p.quantidadeExecutada)),
        el("reducaoAcrescimo", formatTissDecimal2(p.reducaoAcrescimo)),
        el("valorUnitario", formatTissDecimal2(p.valorUnitario)),
        el("valorTotal", formatTissDecimal2(p.valorTotal)),
        "</procedimentoExecutado>",
      );
    }
    lines.push("</procedimentosExecutados>");
  }
  if (g.observacao) lines.push(el("observacao", g.observacao));
  lines.push("<valorTotal>", el("valorTotalGeral", formatTissDecimal2(g.valorTotalGeral)), "</valorTotal>");
  lines.push("</guiaSP-SADT>");
  return lines;
}

/** ctm_honorarioIndividualGuia */
function serializeGuiaHonorario(g: TissGuiaHonorarioInput): string[] {
  const lines: string[] = ["<guiaHonorarios>"];
  lines.push(
    "<cabecalhoGuia>",
    el("registroANS", formatTissRegistroAns(g.registroANS)),
    el("numeroGuiaPrestador", g.numeroGuiaPrestador),
    "</cabecalhoGuia>",
  );
  lines.push(el("guiaSolicInternacao", g.guiaSolicInternacao));
  if (g.senha) lines.push(el("senha", g.senha));
  if (g.numeroGuiaOperadora) lines.push(el("numeroGuiaOperadora", g.numeroGuiaOperadora));
  lines.push("<beneficiario>", ...serializeBeneficiario(g.beneficiario), "</beneficiario>");
  lines.push(
    "<localContratado>",
    "<codigoContratado>",
    serializeContratadoDados(g.localContratado),
    "</codigoContratado>",
    el("nomeContratado", g.localContratado.nomeContratado),
    el("cnes", g.localContratado.cnes),
    "</localContratado>",
  );
  lines.push(
    "<dadosContratadoExecutante>",
    el("codigonaOperadora", g.dadosContratadoExecutante.codigoNaOperadora),
    el("cnesContratadoExecutante", g.dadosContratadoExecutante.cnesContratadoExecutante),
    "</dadosContratadoExecutante>",
  );
  lines.push(
    "<dadosInternacao>",
    el("dataInicioFaturamento", formatTissDate(g.dadosInternacao.dataInicioFaturamento)),
    el("dataFimFaturamento", formatTissDate(g.dadosInternacao.dataFimFaturamento)),
    "</dadosInternacao>",
  );
  lines.push("<procedimentosRealizados>");
  for (const p of g.procedimentosRealizados) {
    lines.push(
      "<procedimentoRealizado>",
      el("sequencialItem", String(p.sequencialItem)),
      el("dataExecucao", formatTissDate(p.dataExecucao)),
      ...serializeProcedimentoDados("procedimento", p.procedimento),
      el("quantidadeExecutada", String(p.quantidadeExecutada)),
      el("reducaoAcrescimo", formatTissDecimal2(p.reducaoAcrescimo)),
      el("valorUnitario", formatTissDecimal2(p.valorUnitario)),
      el("valorTotal", formatTissDecimal2(p.valorTotal)),
      "<profissionais>",
    );
    for (const prof of p.profissionais) {
      lines.push(
        el("grauParticipacao", prof.grauParticipacao),
        "<codProfissional>",
        serializeContratadoDados(prof.codProfissional),
        "</codProfissional>",
        el("nomeProfissional", prof.nomeProfissional),
        el("conselhoProfissional", prof.conselhoProfissional),
        el("numeroConselhoProfissional", prof.numeroConselhoProfissional),
        el("UF", resolveTissUfCode(prof.ufConselho)),
        el("CBO", prof.cbo),
      );
    }
    lines.push("</profissionais>", "</procedimentoRealizado>");
  }
  lines.push("</procedimentosRealizados>");
  if (g.observacao) lines.push(el("observacao", g.observacao));
  lines.push(el("valorTotalHonorarios", formatTissDecimal2(g.valorTotalHonorarios)));
  lines.push(el("dataEmissaoGuia", formatTissDate(g.dataEmissaoGuia)));
  lines.push("</guiaHonorarios>");
  return lines;
}

/** mensagemTISS > cabecalho + prestadorParaOperadora.loteGuias + epilogo */
export function buildMensagemTissXml(input: TissEnvelopeInput): string {
  const guiaCount =
    (input.guiasConsulta?.length ?? 0) + (input.guiasSadt?.length ?? 0) + (input.guiasHonorario?.length ?? 0);
  if (guiaCount === 0) {
    throw new Error("Lote sem nenhuma guia — mensagemTISS exige ao menos uma guia em loteGuias.guiasTISS.");
  }

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  // Namespace TISS declarado como default (sem prefixo) no elemento raiz —
  // elementFormDefault="qualified" no XSD exige que todo elemento pertença
  // ao namespace, não que cada tag carregue um prefixo explícito.
  lines.push('<mensagemTISS xmlns="http://www.ans.gov.br/padroes/tiss/schemas">');

  lines.push("<cabecalho>");
  lines.push(
    "<identificacaoTransacao>",
    el("tipoTransacao", TISS_TIPO_TRANSACAO_ENVIO_LOTE_GUIAS),
    el("sequencialTransacao", input.sequencialTransacao),
    el("dataRegistroTransacao", formatTissDate(input.dataRegistroTransacao)),
    el("horaRegistroTransacao", formatTissTime(input.horaRegistroTransacao)),
    "</identificacaoTransacao>",
  );
  lines.push("<origem>", serializePrestadorIdentificacao(input.origemPrestador), "</origem>");
  lines.push("<destino>", el("registroANS", formatTissRegistroAns(input.destinoRegistroANS)), "</destino>");
  lines.push(el("Padrao", TISS_PADRAO_VERSAO));
  lines.push("</cabecalho>");

  lines.push("<prestadorParaOperadora>");
  lines.push("<loteGuias>");
  lines.push(el("numeroLote", input.numeroLote));
  lines.push("<guiasTISS>");
  for (const g of input.guiasConsulta ?? []) lines.push(...serializeGuiaConsulta(g));
  for (const g of input.guiasSadt ?? []) lines.push(...serializeGuiaSadt(g));
  for (const g of input.guiasHonorario ?? []) lines.push(...serializeGuiaHonorario(g));
  lines.push("</guiasTISS>");
  lines.push("</loteGuias>");
  lines.push("</prestadorParaOperadora>");

  lines.push("<epilogo>", el("hash", "PENDENTE"), "</epilogo>");
  lines.push("</mensagemTISS>");

  return lines.join("\n");
}

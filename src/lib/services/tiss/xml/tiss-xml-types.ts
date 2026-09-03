/**
 * Tipos de entrada do serializador XML TISS — F3-S1.
 *
 * Espelham exatamente os complexType do XSD oficial ANS (padrão 4.01.00)
 * verificados em tissV4_01_00.xsd / tissComplexTypesV4_01_00.xsd /
 * tissGuiasV4_01_00.xsd. Cobrem só o que o MedFlow hoje suporta: envio de
 * lote de guias (prestadorParaOperadora.loteGuias) nos 3 tipos de guia do
 * parser (guiaConsulta, guiaSP-SADT, guiaHonorarios) — sem odontologia,
 * internação, anexos clínicos (OPME/quimio/radio) nem os demais tipos de
 * transação (elegibilidade, recurso de glosa etc.), fora de escopo desta
 * sprint.
 *
 * Deliberadamente sem valor default para nenhum código de classificação
 * operacional (tipoAtendimento, caráter, regime, tipo de consulta) — o
 * XSD real tem ambiguidades que este código não vai resolver adivinhando
 * (ex.: "05 Exames" aparece documentado em comentário do dm_tipoAtendimento
 * mas NÃO está entre os enumeration values realmente válidos na v4.01.00).
 * Quem monta o input decide o código certo; o serializador só valida que
 * está dentro do conjunto de valores conhecidos.
 */

/** ct_contratadoDados — escolha entre código na operadora, CPF ou CNPJ do contratado. */
export type TissContratadoDadosInput =
  | { kind: "codigoNaOperadora"; codigo: string }
  | { kind: "cpf"; cpf: string }
  | { kind: "cnpj"; cnpj: string };

/** ct_prestadorIdentificacao — mesma escolha lógica, elementos com nome diferente (uso só no cabeçalho da mensagem). */
export type TissPrestadorIdentificacaoInput =
  | { kind: "codigoNaOperadora"; codigo: string }
  | { kind: "cpf"; cpf: string }
  | { kind: "cnpj"; cnpj: string };

/**
 * localContratado.codigoContratado (guiaHonorarios) — escolha DIFERENTE de
 * ct_contratadoDados: só codigoNaOperadora ou cnpjLocalExecutante (achado
 * real de F3-S2 — validação contra o XSD real rejeitou o reaproveitamento
 * de TissContratadoDadosInput aqui, elementos têm nomes distintos).
 */
export type TissLocalContratadoCodigoInput =
  | { kind: "codigoNaOperadora"; codigo: string }
  | { kind: "cnpjLocalExecutante"; cnpj: string };

/**
 * codProfissional (guiaHonorarios.profissionais[]) — escolha DIFERENTE de
 * ct_contratadoDados: só codigoPrestadorNaOperadora ou cpfContratado, sem
 * opção de CNPJ (é a identificação de uma PESSOA, não de um contratado —
 * outro achado real de F3-S2).
 */
export type TissCodProfissionalInput =
  | { kind: "codigoNaOperadora"; codigo: string }
  | { kind: "cpf"; cpf: string };

/** ct_beneficiarioDados */
export type TissBeneficiarioInput = {
  numeroCarteira: string;
  atendimentoRN: boolean;
};

/** ct_contratadoProfissionalDados */
export type TissProfissionalInput = {
  nomeProfissional?: string;
  /** dm_conselhoProfissional — use TISS_CONSELHO_CRM na prática (cooperativa médica). */
  conselhoProfissional: string;
  numeroConselhoProfissional: string;
  /** Sigla (SP, RJ...) — convertida para o código IBGE do dm_UF na serialização. */
  ufConselho: string;
  /** dm_CBOS — classificação de ocupação; não há mapeamento automático confiável a partir da especialidade. */
  cbos: string;
};

export type TissProcedimentoDadosInput = {
  /** dm_tabela — "22" (TUSS) na prática, é a única tabela que o MedFlow importa. */
  codigoTabela: string;
  codigoProcedimento: string;
  descricaoProcedimento?: string;
};

/* ---------------------------------------------------------------------- */
/* Guia de Consulta — ctm_consultaGuia                                    */
/* ---------------------------------------------------------------------- */

export type TissGuiaConsultaInput = {
  registroANS: string;
  numeroGuiaPrestador: string;
  numeroGuiaOperadora?: string;
  beneficiario: TissBeneficiarioInput;
  contratadoExecutante: TissContratadoDadosInput & { cnes: string };
  profissionalExecutante: TissProfissionalInput;
  /** dm_indicadorAcidente */
  indicacaoAcidente: string;
  dadosAtendimento: {
    /** dm_regimeAtendimento */
    regimeAtendimento: string;
    dataAtendimento: string;
    /** dm_tipoConsulta */
    tipoConsulta: string;
    procedimento: TissProcedimentoDadosInput & { valorProcedimento: number };
  };
  observacao?: string;
};

/* ---------------------------------------------------------------------- */
/* Guia de SP/SADT (execução) — ctm_sp-sadtGuia                           */
/* ---------------------------------------------------------------------- */

export type TissProcedimentoExecutadoSadtInput = {
  sequencialItem: number;
  dataExecucao: string;
  procedimento: TissProcedimentoDadosInput;
  quantidadeExecutada: number;
  reducaoAcrescimo: number;
  valorUnitario: number;
  valorTotal: number;
};

export type TissGuiaSadtInput = {
  registroANS: string;
  numeroGuiaPrestador: string;
  numeroGuiaOperadora?: string;
  beneficiario: TissBeneficiarioInput;
  contratadoSolicitante: TissContratadoDadosInput;
  nomeContratadoSolicitante: string;
  profissionalSolicitante: TissProfissionalInput;
  /** dm_caraterAtendimento */
  caraterAtendimento: string;
  indicacaoClinica?: string;
  contratadoExecutante: TissContratadoDadosInput & { cnes: string };
  dadosAtendimento: {
    /** dm_tipoAtendimento */
    tipoAtendimento: string;
    /** dm_indicadorAcidente */
    indicacaoAcidente: string;
    /** dm_regimeAtendimento */
    regimeAtendimento: string;
  };
  procedimentosExecutados: TissProcedimentoExecutadoSadtInput[];
  valorTotalGeral: number;
  observacao?: string;
};

/* ---------------------------------------------------------------------- */
/* Guia de Honorário Individual — ctm_honorarioIndividualGuia             */
/* ---------------------------------------------------------------------- */

export type TissProcedimentoExecutadoHonorarioInput = {
  sequencialItem: number;
  dataExecucao: string;
  procedimento: TissProcedimentoDadosInput;
  quantidadeExecutada: number;
  reducaoAcrescimo: number;
  valorUnitario: number;
  valorTotal: number;
  profissionais: Array<{
    /** dm_grauPart — participação do profissional no procedimento (ex.: "1" clínico, ver dm_grauPart no XSD). */
    grauParticipacao: string;
    codProfissional: TissCodProfissionalInput;
    nomeProfissional: string;
    conselhoProfissional: string;
    numeroConselhoProfissional: string;
    ufConselho: string;
    cbo: string;
  }>;
};

export type TissGuiaHonorarioInput = {
  registroANS: string;
  numeroGuiaPrestador: string;
  guiaSolicInternacao: string;
  senha?: string;
  numeroGuiaOperadora?: string;
  beneficiario: TissBeneficiarioInput;
  localContratado: TissLocalContratadoCodigoInput & { nomeContratado: string; cnes: string };
  dadosContratadoExecutante: { codigoNaOperadora: string; cnesContratadoExecutante: string };
  dadosInternacao: { dataInicioFaturamento: string; dataFimFaturamento: string };
  procedimentosRealizados: TissProcedimentoExecutadoHonorarioInput[];
  valorTotalHonorarios: number;
  dataEmissaoGuia: string;
  observacao?: string;
};

/* ---------------------------------------------------------------------- */
/* Envelope da mensagem — mensagemTISS                                    */
/* ---------------------------------------------------------------------- */

export type TissEnvelopeInput = {
  sequencialTransacao: string;
  dataRegistroTransacao: string;
  horaRegistroTransacao: string;
  origemPrestador: TissPrestadorIdentificacaoInput;
  destinoRegistroANS: string;
  numeroLote: string;
  guiasConsulta?: TissGuiaConsultaInput[];
  guiasSadt?: TissGuiaSadtInput[];
  guiasHonorario?: TissGuiaHonorarioInput[];
};

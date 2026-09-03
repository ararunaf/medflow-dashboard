/**
 * Constantes e formatadores dos tipos simples do XSD oficial ANS —
 * padrão TISS 4.01.00 (tissSimpleTypesV4_01_00.xsd). F3-S1.
 *
 * Toda tabela de código aqui foi conferida contra o XSD oficial baixado de
 * github.com/renatofagalde/app-tiss-schemas (mirror dos arquivos publicados
 * pela ANS em gov.br/ans) — nenhum valor foi inventado de memória. Onde o
 * XSD é ambíguo ou o dado não existe no schema do MedFlow hoje, o código
 * exige o valor explicitamente em vez de adivinhar (ver tiss-xml-types.ts).
 */

/** dm_versao — versão do padrão TISS usada nesta exportação. */
export const TISS_PADRAO_VERSAO = "4.01.00";

/** dm_tipoTransacao — só o caso de uso que o MedFlow implementa (lote de guias). */
export const TISS_TIPO_TRANSACAO_ENVIO_LOTE_GUIAS = "ENVIO_LOTE_GUIAS";

/** dm_tabela — "22" é a Terminologia TUSS (Tabela 22), única tabela que o MedFlow importa (F1-S2). */
export const TISS_TABELA_TUSS = "22";

/** dm_conselhoProfissional — "06" = Conselho Regional de Medicina (CRM). MedFlow é cooperativa médica: todo profissional cadastrado é médico. */
export const TISS_CONSELHO_CRM = "06";

/**
 * dm_UF — atenção: o padrão TISS usa o código numérico IBGE de 2 dígitos,
 * NÃO a sigla de 2 letras (SP, RJ...). Mapeamento conferido contra os
 * comentários do XSD oficial.
 */
export const TISS_UF_IBGE_CODE: Record<string, string> = {
  RO: "11",
  AC: "12",
  AM: "13",
  RR: "14",
  PA: "15",
  AP: "16",
  TO: "17",
  MA: "21",
  PI: "22",
  CE: "23",
  RN: "24",
  PB: "25",
  PE: "26",
  AL: "27",
  SE: "28",
  BA: "29",
  MG: "31",
  ES: "32",
  RJ: "33",
  SP: "35",
  PR: "41",
  SC: "42",
  RS: "43",
  MS: "50",
  MT: "51",
  GO: "52",
  DF: "53",
  EX: "98",
};

export function resolveTissUfCode(ufSigla: string): string {
  const code = TISS_UF_IBGE_CODE[ufSigla.trim().toUpperCase()];
  if (!code) {
    throw new Error(`UF "${ufSigla}" não reconhecida no padrão TISS (dm_UF).`);
  }
  return code;
}

/** dm_indicadorAcidente — 0 Trabalho, 1 Trânsito, 2 Outros Acidentes, 9 Não Acidente. */
export const TISS_INDICADOR_ACIDENTE_NAO_ACIDENTE = "9";

/** dm_regimeAtendimento — "01" = Ambulatorial (regime padrão de consulta/SADT em cooperativa). */
export const TISS_REGIME_AMBULATORIAL = "01";

/** dm_caraterAtendimento — "1" Eletiva, "2" Urgência/Emergência. */
export const TISS_CARATER_ELETIVA = "1";
export const TISS_CARATER_URGENCIA = "2";

/** dm_tipoConsulta — "1" Primeira, "2" Seguimento, "3" Pré-Natal, "4" (ver XSD). */
export const TISS_TIPO_CONSULTA_PRIMEIRA = "1";
export const TISS_TIPO_CONSULTA_SEGUIMENTO = "2";

/**
 * dm_grauPart — "12" = Clínico. MedFlow associa um único profissional por
 * guia (tiss_guides.professional_id), então toda guia de honorário
 * individual usa este grau de participação — não há hoje modelagem de
 * equipe cirúrgica com papéis distintos por procedimento.
 */
export const TISS_GRAU_PART_CLINICO = "12";

/** st_data (xsd:date) — YYYY-MM-DD. */
export function formatTissDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) throw new Error(`Data inválida para formatação TISS: ${iso}`);
  return d.toISOString().slice(0, 10);
}

/** st_hora (xsd:time) — HH:MM:SS. */
export function formatTissTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) throw new Error(`Hora inválida para formatação TISS: ${iso}`);
  return d.toISOString().slice(11, 19);
}

/** st_decimalN-2 e afins — sempre 2 casas decimais, ponto como separador. */
export function formatTissDecimal2(value: number): string {
  return value.toFixed(2);
}

/** st_registroANS — 6 dígitos, zero à esquerda. */
export function formatTissRegistroAns(ansCode: string): string {
  const digits = ansCode.replace(/\D/g, "");
  if (digits.length === 0 || digits.length > 6) {
    throw new Error(`registroANS inválido: "${ansCode}" (esperado até 6 dígitos numéricos).`);
  }
  return digits.padStart(6, "0");
}

export function escapeTissXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Definições de campos por template TISS.
 * MEDICFLOW-TISS-PARSER-01
 */
import type { StructuredFieldGroup } from "../types/structured-guide";
import type { NormalizerType } from "../normalizers";
import type { TissGuideType } from "../types/tiss-guide-type";

export type TemplateFieldDef = {
  code: string;
  label: string;
  group: StructuredFieldGroup;
  labelPatterns: RegExp[];
  valuePattern?: RegExp;
  normalizer: NormalizerType;
  /** Região Y normalizada esperada (0–1) — usada para detectar out_of_position */
  expectedRegion?: { yMin: number; yMax: number };
};

export type TissTemplate = {
  id: string;
  guideType: TissGuideType;
  version: string;
  headerPatterns: RegExp[];
  fields: TemplateFieldDef[];
};

const COMMON_PACIENTE: TemplateFieldDef[] = [
  {
    code: "beneficiary_name",
    label: "Nome do Beneficiário",
    group: "paciente",
    labelPatterns: [/nome\s*(do\s*)?benefici[aá]rio/i, /nome\s*do\s*usu[aá]rio/i],
    normalizer: "name",
    expectedRegion: { yMin: 0.1, yMax: 0.45 },
  },
  {
    code: "beneficiary_card_number",
    label: "Número da Carteirinha",
    group: "paciente",
    labelPatterns: [
      /n[uú]mero\s*(da\s*)?carteirinha/i,
      /carteirinha\s*:/i,
      /cart[eã]o\s*nacional\s*de\s*sa[uú]de/i,
    ],
    normalizer: "card_number",
    expectedRegion: { yMin: 0.1, yMax: 0.45 },
  },
  {
    code: "beneficiary_cpf",
    label: "CPF",
    group: "paciente",
    labelPatterns: [/^cpf\s*:/i, /cpf\s*(do\s*)?benefici[aá]rio/i],
    valuePattern: /\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d{2}/,
    normalizer: "cpf",
    expectedRegion: { yMin: 0.1, yMax: 0.45 },
  },
  {
    code: "beneficiary_cns",
    label: "CNS",
    group: "paciente",
    labelPatterns: [/^cns\s*:/i, /cart[aã]o\s*nacional\s*de\s*sa[uú]de/i],
    valuePattern: /\d{15}/,
    normalizer: "cns",
    expectedRegion: { yMin: 0.1, yMax: 0.45 },
  },
];

const COMMON_OPERADORA: TemplateFieldDef[] = [
  {
    code: "operator_ans_code",
    label: "Registro ANS",
    group: "operadora",
    labelPatterns: [/registro\s*ans/i, /c[oó]digo\s*ans/i, /ans/i],
    valuePattern: /\d{6}/,
    normalizer: "ans_code",
    expectedRegion: { yMin: 0, yMax: 0.25 },
  },
  {
    code: "operator_name",
    label: "Nome da Operadora",
    group: "operadora",
    labelPatterns: [/operadora/i, /nome\s*(da\s*)?operadora/i],
    normalizer: "name",
    expectedRegion: { yMin: 0, yMax: 0.25 },
  },
];

const COMMON_PRESTADOR: TemplateFieldDef[] = [
  {
    code: "provider_cnpj",
    label: "CNPJ Contratado",
    group: "prestador",
    labelPatterns: [/cnpj/i, /cnpj\s*(do\s*)?contratado/i, /cnpj\s*(do\s*)?prestador/i],
    valuePattern: /\d{2}[.\s]?\d{3}[.\s]?\d{3}[/\\]?\d{4}[-.\s]?\d{2}/,
    normalizer: "cnpj",
    expectedRegion: { yMin: 0.05, yMax: 0.35 },
  },
  {
    code: "provider_name",
    label: "Nome do Contratado",
    group: "prestador",
    labelPatterns: [/nome\s*(do\s*)?contratado/i, /prestador/i, /contratado/i],
    normalizer: "name",
    expectedRegion: { yMin: 0.05, yMax: 0.35 },
  },
];

const COMMON_DATAS: TemplateFieldDef[] = [
  {
    code: "attendance_date",
    label: "Data do Atendimento",
    group: "datas",
    labelPatterns: [/data\s*(do\s*)?atendimento/i, /data\s*atend/i],
    valuePattern: /\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}/,
    normalizer: "date",
    expectedRegion: { yMin: 0.2, yMax: 0.7 },
  },
  {
    code: "execution_date",
    label: "Data de Execução",
    group: "datas",
    labelPatterns: [/data\s*(de\s*)?execu[cç][aã]o/i, /data\s*realiza[cç][aã]o/i],
    valuePattern: /\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}/,
    normalizer: "date",
    expectedRegion: { yMin: 0.2, yMax: 0.7 },
  },
];

const COMMON_AUTORIZACOES: TemplateFieldDef[] = [
  {
    code: "authorization_password",
    label: "Senha de Autorização",
    group: "autorizacoes",
    labelPatterns: [
      /senha/i,
      /senha\s*(de\s*)?autoriza[cç][aã]o/i,
      /n[uú]mero\s*(da\s*)?guia\s*operadora/i,
    ],
    normalizer: "guide_number",
    expectedRegion: { yMin: 0.15, yMax: 0.55 },
  },
  {
    code: "guide_number",
    label: "Número da Guia",
    group: "autorizacoes",
    labelPatterns: [/n[uú]mero\s*(da\s*)?guia/i, /guia\s*n[o°]/i, /n[°o]\s*guia/i],
    normalizer: "guide_number",
    expectedRegion: { yMin: 0.05, yMax: 0.35 },
  },
];

export const TEMPLATE_CONSULTA_V1: TissTemplate = {
  id: "template_consulta_v1",
  guideType: "guia_consulta",
  version: "1.0",
  headerPatterns: [/guia\s*de\s*consulta/i, /consulta\s*m[eé]dica/i, /guia\s*consulta/i],
  fields: [
    ...COMMON_OPERADORA,
    ...COMMON_PRESTADOR,
    ...COMMON_PACIENTE,
    ...COMMON_DATAS,
    ...COMMON_AUTORIZACOES,
    {
      code: "executing_crm",
      label: "CRM Executante",
      group: "executante",
      labelPatterns: [/crm\s*(do\s*)?executante/i, /crm/i, /conselho\s*profissional/i],
      normalizer: "crm",
      expectedRegion: { yMin: 0.3, yMax: 0.75 },
    },
    {
      code: "executing_name",
      label: "Nome do Executante",
      group: "executante",
      labelPatterns: [/nome\s*(do\s*)?profissional/i, /profissional\s*executante/i, /executante/i],
      normalizer: "name",
      expectedRegion: { yMin: 0.3, yMax: 0.75 },
    },
    {
      code: "procedure_code",
      label: "Código TUSS",
      group: "procedimentos",
      labelPatterns: [/c[oó]digo\s*tuss/i, /c[oó]digo\s*procedimento/i, /tuss/i],
      valuePattern: /\d{6,8}/,
      normalizer: "tuss",
      expectedRegion: { yMin: 0.35, yMax: 0.8 },
    },
    {
      code: "total_value",
      label: "Valor Total",
      group: "procedimentos",
      labelPatterns: [/valor\s*total/i, /total\s*geral/i, /valor\s*procedimento/i],
      valuePattern: /R?\$?\s*[\d.,]+/,
      normalizer: "currency",
      expectedRegion: { yMin: 0.5, yMax: 0.95 },
    },
    {
      code: "cid_code",
      label: "CID-10",
      group: "diagnostico",
      labelPatterns: [/cid/i, /cid-?10/i, /diagn[oó]stico/i],
      valuePattern: /[A-Z]\d{2}(\.\d)?/i,
      normalizer: "cid",
      expectedRegion: { yMin: 0.35, yMax: 0.8 },
    },
    {
      code: "observations",
      label: "Observações",
      group: "observacoes",
      labelPatterns: [/observa[cç][oõ]es/i, /obs/i],
      normalizer: "text",
      expectedRegion: { yMin: 0.6, yMax: 1 },
    },
  ],
};

export const TEMPLATE_SADT_V1: TissTemplate = {
  id: "template_sadt_v1",
  guideType: "guia_sadt",
  version: "1.0",
  headerPatterns: [
    /sp\s*[/\\]\s*sadt/i,
    /solicita[cç][aã]o\s*(de\s*)?procedimento/i,
    /guia\s*sp/i,
    /sadt/i,
  ],
  fields: [
    ...COMMON_OPERADORA,
    ...COMMON_PRESTADOR,
    ...COMMON_PACIENTE,
    ...COMMON_DATAS,
    ...COMMON_AUTORIZACOES,
    {
      code: "requesting_crm",
      label: "CRM Solicitante",
      group: "solicitante",
      labelPatterns: [/crm\s*(do\s*)?solicitante/i, /solicitante.*crm/i],
      normalizer: "crm",
      expectedRegion: { yMin: 0.25, yMax: 0.55 },
    },
    {
      code: "requesting_name",
      label: "Nome do Solicitante",
      group: "solicitante",
      labelPatterns: [/nome\s*(do\s*)?solicitante/i, /m[eé]dico\s*solicitante/i],
      normalizer: "name",
      expectedRegion: { yMin: 0.25, yMax: 0.55 },
    },
    {
      code: "executing_crm",
      label: "CRM Executante",
      group: "executante",
      labelPatterns: [/crm\s*(do\s*)?executante/i, /executante.*crm/i],
      normalizer: "crm",
      expectedRegion: { yMin: 0.4, yMax: 0.75 },
    },
    {
      code: "executing_name",
      label: "Nome do Executante",
      group: "executante",
      labelPatterns: [/nome\s*(do\s*)?executante/i, /profissional\s*executante/i],
      normalizer: "name",
      expectedRegion: { yMin: 0.4, yMax: 0.75 },
    },
    {
      code: "clinical_indication",
      label: "Indicação Clínica",
      group: "diagnostico",
      labelPatterns: [/indica[cç][aã]o\s*cl[ií]nica/i, /justificativa/i],
      normalizer: "text",
      expectedRegion: { yMin: 0.35, yMax: 0.7 },
    },
    {
      code: "cid_code",
      label: "CID-10",
      group: "diagnostico",
      labelPatterns: [/cid/i, /cid-?10/i],
      valuePattern: /[A-Z]\d{2}(\.\d)?/i,
      normalizer: "cid",
      expectedRegion: { yMin: 0.35, yMax: 0.7 },
    },
    {
      code: "procedure_code",
      label: "Código TUSS",
      group: "procedimentos",
      labelPatterns: [/c[oó]digo\s*tuss/i, /c[oó]digo\s*procedimento/i, /tuss/i],
      valuePattern: /\d{6,8}/,
      normalizer: "tuss",
      expectedRegion: { yMin: 0.45, yMax: 0.85 },
    },
    {
      code: "total_value",
      label: "Valor Total",
      group: "procedimentos",
      labelPatterns: [/valor\s*total/i, /total\s*geral/i],
      valuePattern: /R?\$?\s*[\d.,]+/,
      normalizer: "currency",
      expectedRegion: { yMin: 0.55, yMax: 0.95 },
    },
    {
      code: "observations",
      label: "Observações",
      group: "observacoes",
      labelPatterns: [/observa[cç][oõ]es/i],
      normalizer: "text",
      expectedRegion: { yMin: 0.65, yMax: 1 },
    },
  ],
};

export const TEMPLATE_HONORARIO_V1: TissTemplate = {
  id: "template_honorario_v1",
  guideType: "guia_honorario",
  version: "1.0",
  headerPatterns: [/honor[aá]rio\s*individual/i, /guia\s*de\s*honor/i, /honor[aá]rios/i],
  fields: [
    ...COMMON_OPERADORA,
    ...COMMON_PRESTADOR,
    ...COMMON_PACIENTE,
    ...COMMON_DATAS,
    ...COMMON_AUTORIZACOES,
    {
      code: "parent_guide_number",
      label: "Guia de Origem",
      group: "autorizacoes",
      labelPatterns: [/guia\s*(de\s*)?origem/i, /guia\s*principal/i, /n[uú]mero\s*guia\s*origem/i],
      normalizer: "guide_number",
      expectedRegion: { yMin: 0.1, yMax: 0.4 },
    },
    {
      code: "participation_degree",
      label: "Grau de Participação",
      group: "executante",
      labelPatterns: [/grau\s*(de\s*)?participa[cç][aã]o/i, /participa[cç][aã]o/i],
      normalizer: "text",
      expectedRegion: { yMin: 0.35, yMax: 0.65 },
    },
    {
      code: "executing_crm",
      label: "CRM Profissional",
      group: "executante",
      labelPatterns: [/crm/i, /conselho\s*profissional/i],
      normalizer: "crm",
      expectedRegion: { yMin: 0.35, yMax: 0.7 },
    },
    {
      code: "executing_name",
      label: "Nome do Profissional",
      group: "executante",
      labelPatterns: [/nome\s*(do\s*)?profissional/i, /profissional/i],
      normalizer: "name",
      expectedRegion: { yMin: 0.35, yMax: 0.7 },
    },
    {
      code: "procedure_code",
      label: "Código TUSS",
      group: "procedimentos",
      labelPatterns: [/c[oó]digo\s*tuss/i, /tuss/i],
      valuePattern: /\d{6,8}/,
      normalizer: "tuss",
      expectedRegion: { yMin: 0.45, yMax: 0.85 },
    },
    {
      code: "total_value",
      label: "Valor Total",
      group: "procedimentos",
      labelPatterns: [/valor\s*total/i, /total/i],
      valuePattern: /R?\$?\s*[\d.,]+/,
      normalizer: "currency",
      expectedRegion: { yMin: 0.55, yMax: 0.95 },
    },
    {
      code: "observations",
      label: "Observações",
      group: "observacoes",
      labelPatterns: [/observa[cç][oõ]es/i],
      normalizer: "text",
      expectedRegion: { yMin: 0.65, yMax: 1 },
    },
  ],
};

export const ALL_TEMPLATES: TissTemplate[] = [
  TEMPLATE_CONSULTA_V1,
  TEMPLATE_SADT_V1,
  TEMPLATE_HONORARIO_V1,
];

export function getTemplateForGuideType(guideType: TissGuideType): TissTemplate | null {
  return ALL_TEMPLATES.find((t) => t.guideType === guideType) ?? null;
}

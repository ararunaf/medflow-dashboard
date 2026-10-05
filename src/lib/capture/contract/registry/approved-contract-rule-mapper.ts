/**
 * Mapeia contract_rule_versions (F2-S3 — regra aprovada por humano) para o
 * shape ContractRule/ContractRegistryVersion que o motor de auditoria já
 * consome. Lógica pura — sem Supabase — para poder ser testada diretamente;
 * a leitura real fica em src/lib/server/contract-rules-backend.ts (server-only).
 */
import type { ContractRegistryVersion, ContractRule } from "../types/contract-rule";

/** Mesma normalização usada em ContractKnowledgeRegistryStore.getRulesForOperator(). */
export function normalizeOperatorCode(operator: string): string {
  return operator.replace(/\D/g, "").padStart(6, "0").slice(-6);
}

export type ApprovedContractRuleVersionRow = {
  rule_id: string;
  tenant_id: string;
  operator_code: string;
  contract_label: string;
  category: string;
  description: string;
  justification: string;
  citation_heading: string | null;
  citation_excerpt: string;
  guide_type: string;
  procedure_type: string;
  severity: string;
  approved_at: string;
};

/**
 * Regras aprovadas via revisão humana entram no MESMO registro vivo que as
 * regras curadas manualmente em tiss_contract_rules — só que com prioridade
 * mais baixa e sem legalReference inventada: a extração via LLM não
 * identifica RN/Lei da ANS, só a cláusula literal do contrato
 * (businessReference).
 */
export const AI_APPROVED_RULE_PRIORITY = 50;

/** Minúsculas e sem acento — o texto vem do PDF/LLM com acentuação variável. */
function normalizeText(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Campos fixos por categoria — a cláusula dessas categorias sempre recai sobre o mesmo campo. */
const FIXED_FIELDS_BY_CATEGORY: Record<string, string[]> = {
  pre_autorizacao: ["authorization_password"],
  prazo: ["attendance_date"],
  preco: ["procedure_code", "total_value"],
  cobertura: ["procedure_code"],
};

/**
 * Campos de guia citados num trecho de "campo obrigatório". Avalia por
 * segmento (separado por vírgula/ponto e vírgula/dois-pontos) para que
 * "nome e CRM do profissional solicitante" vire requesting_name +
 * requesting_crm, sem confundir com o executante citado em outro segmento.
 */
function fieldsMentionedIn(text: string): string[] {
  const fields = new Set<string>();
  for (const segment of normalizeText(text).split(/[,;:]/)) {
    const has = (re: RegExp) => re.test(segment);
    if (has(/assinatura/)) {
      if (has(/benefici|responsavel/)) fields.add("beneficiary_signature");
      if (has(/profissional|executante|medico/)) fields.add("professional_signature");
      continue;
    }
    if (has(/solicitante/)) {
      if (has(/\bnome\b/)) fields.add("requesting_name");
      if (has(/\bcrm\b/)) fields.add("requesting_crm");
    }
    if (has(/executante/)) {
      if (has(/\bnome\b/)) fields.add("executing_name");
      if (has(/\bcrm\b/)) fields.add("executing_crm");
    }
    if (has(/carteir/)) fields.add("beneficiary_card_number");
    if (has(/nome do benefici/)) fields.add("beneficiary_name");
    if (has(/\bcpf\b/)) fields.add("beneficiary_cpf");
    if (has(/\bcid\b/)) fields.add("cid_code");
    if (has(/indicacao clinica/)) fields.add("clinical_indication");
    if (has(/codigo tuss|codigo do procedimento/)) fields.add("procedure_code");
    if (has(/data do atendimento/)) fields.add("attendance_date");
    if (has(/data de execucao/)) fields.add("execution_date");
    if (has(/\bsenha\b/)) fields.add("authorization_password");
    if (has(/numero da guia/)) fields.add("guide_number");
    if (has(/\bcnpj\b/)) fields.add("provider_cnpj");
    if (has(/registro ans/)) fields.add("operator_ans_code");
  }
  return [...fields];
}

/**
 * Campos de auditoria (AuditFinding.field) sobre os quais a regra aprovada
 * incide — associação campo a campo, nunca por categoria inteira. Lê a
 * citação literal e a descrição aprovada. Regra sem campo identificável
 * fica sem auditFields: aparece em appliedRules, mas não enriquece finding.
 */
export function resolveApprovedRuleAuditFields(
  category: string,
  description: string,
  citationExcerpt: string,
): string[] {
  const fixed = FIXED_FIELDS_BY_CATEGORY[category];
  if (fixed) return [...fixed];
  if (category !== "campo_obrigatorio") return [];
  return fieldsMentionedIn(`${citationExcerpt} , ${description}`);
}

export function rowToApprovedRule(row: ApprovedContractRuleVersionRow): ContractRule {
  const auditFields = resolveApprovedRuleAuditFields(row.category, row.description, row.citation_excerpt);
  return {
    origin: "ai_approved",
    citationExcerpt: row.citation_excerpt,
    ...(auditFields.length ? { auditFields } : {}),
    ruleId: row.rule_id,
    operator: normalizeOperatorCode(row.operator_code),
    contract: row.contract_label,
    guideType: row.guide_type as ContractRule["guideType"],
    procedureType: row.procedure_type,
    priority: AI_APPROVED_RULE_PRIORITY,
    description: row.description,
    justification: row.justification,
    legalReference: "Extração automática do contrato — sem referência legal (RN/Lei ANS) identificada.",
    businessReference: row.citation_heading
      ? `${row.contract_label} — ${row.citation_heading}`
      : row.contract_label,
    severity: row.severity as ContractRule["severity"],
  };
}

export function groupApprovedIntoVersions(
  rows: readonly ApprovedContractRuleVersionRow[],
): ContractRegistryVersion[] {
  const groups = new Map<string, { meta: ApprovedContractRuleVersionRow; rules: ContractRule[] }>();
  for (const row of rows) {
    const key = `${row.tenant_id}::${row.operator_code}::${row.contract_label}`;
    const group = groups.get(key);
    if (group) {
      group.rules.push(rowToApprovedRule(row));
    } else {
      groups.set(key, { meta: row, rules: [rowToApprovedRule(row)] });
    }
  }
  return Array.from(groups.values()).map(({ meta, rules }) => ({
    version: `ai-approved-${meta.contract_label}`,
    effectiveFrom: meta.approved_at.slice(0, 10),
    tenantId: meta.tenant_id,
    operator: normalizeOperatorCode(meta.operator_code),
    contract: meta.contract_label,
    rules,
  }));
}

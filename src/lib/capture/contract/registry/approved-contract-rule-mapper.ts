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

/**
 * Categoria da proposta (contract_rule_versions.category) → categorias de
 * finding da auditoria preventiva (AUDIT_RULE_CATEGORIES). Sem isso a regra
 * aprovada nunca casa com nenhum finding (finding-enricher só casa por
 * auditRuleIds/auditFields/auditCategories) e não chega ao Field Audit Agent.
 */
export const APPROVED_CATEGORY_TO_AUDIT_CATEGORIES: Record<string, string[]> = {
  cobertura: ["procedimentos"],
  preco: ["procedimentos"],
  pre_autorizacao: ["autorizacoes"],
  prazo: ["datas"],
  campo_obrigatorio: ["paciente", "operadora", "solicitante", "executante", "diagnostico"],
};

export function rowToApprovedRule(row: ApprovedContractRuleVersionRow): ContractRule {
  const auditCategories = APPROVED_CATEGORY_TO_AUDIT_CATEGORIES[row.category];
  return {
    origin: "ai_approved",
    ...(auditCategories ? { auditCategories } : {}),
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

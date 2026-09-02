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

export function rowToApprovedRule(row: ApprovedContractRuleVersionRow): ContractRule {
  return {
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

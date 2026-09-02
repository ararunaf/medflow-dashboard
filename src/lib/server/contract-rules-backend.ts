/**
 * Server-only binder — hidrata o registro de regras contratuais por operadora
 * com dados reais do Supabase (MEDICFLOW-CONTRACT-INTELLIGENCE-01-DATA).
 *
 * Usa service role. Não é Port. Não altera o motor de auditoria/contrato.
 * Arquivo sob `src/lib/server/` — bloqueado no client via importProtection.
 *
 * Sem isto (ou sem Supabase configurado), o registro segue com o seed
 * hardcoded em default-contract-rules.ts — mesmo comportamento de hoje.
 *
 * F2-S4: além de tiss_contract_rules (curadoria manual), também hidrata a
 * partir de contract_rule_versions — regras propostas pelo Contract
 * Knowledge Agent (F2-S2) e aprovadas por humano no portão de revisão
 * (F2-S3). É assim que uma regra aprovada passa a valer de verdade na
 * auditoria de guias reais — fecha o loop PDF → chunks → proposta → revisão
 * → regra viva. Mesma limitação da hidratação existente: só recarrega no
 * boot do servidor, não em tempo real após uma aprovação.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminSupabase } from "@/lib/server/supabase-admin";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { getDefaultContractRegistry } from "@/lib/capture/contract/registry/contract-knowledge-registry";
import {
  groupApprovedIntoVersions,
  type ApprovedContractRuleVersionRow,
} from "@/lib/capture/contract/registry/approved-contract-rule-mapper";
import type {
  ContractRegistryVersion,
  ContractRule,
} from "@/lib/capture/contract/types/contract-rule";

type ContractRuleRow = {
  rule_id: string;
  registry_version: string;
  effective_from: string;
  effective_to: string | null;
  tenant_id: string | null;
  operator: string;
  contract: string;
  guide_type: string;
  procedure_type: string;
  priority: number;
  description: string;
  justification: string;
  legal_reference: string;
  business_reference: string;
  severity: string;
  audit_rule_ids: string[] | null;
  audit_fields: string[] | null;
  audit_categories: string[] | null;
  estimated_financial_impact_cents: number | null;
  base_denial_risk: number | null;
};

function rowToRule(row: ContractRuleRow): ContractRule {
  return {
    ruleId: row.rule_id,
    operator: row.operator,
    contract: row.contract,
    guideType: row.guide_type as ContractRule["guideType"],
    procedureType: row.procedure_type,
    priority: row.priority,
    description: row.description,
    justification: row.justification,
    legalReference: row.legal_reference,
    businessReference: row.business_reference,
    severity: row.severity as ContractRule["severity"],
    auditRuleIds: row.audit_rule_ids ?? undefined,
    auditFields: row.audit_fields ?? undefined,
    auditCategories: row.audit_categories ?? undefined,
    estimatedFinancialImpactCents: row.estimated_financial_impact_cents ?? undefined,
    baseDenialRisk: row.base_denial_risk ?? undefined,
  };
}

function groupIntoVersions(rows: readonly ContractRuleRow[]): ContractRegistryVersion[] {
  const groups = new Map<string, { meta: ContractRuleRow; rules: ContractRule[] }>();
  for (const row of rows) {
    const key = `${row.operator}::${row.contract}::${row.registry_version}::${row.tenant_id ?? ""}`;
    const group = groups.get(key);
    if (group) {
      group.rules.push(rowToRule(row));
    } else {
      groups.set(key, { meta: row, rules: [rowToRule(row)] });
    }
  }
  return Array.from(groups.values()).map(({ meta, rules }) => ({
    version: meta.registry_version,
    effectiveFrom: meta.effective_from,
    effectiveTo: meta.effective_to ?? undefined,
    tenantId: meta.tenant_id ?? undefined,
    operator: meta.operator,
    contract: meta.contract,
    rules,
  }));
}

let hydratePromise: Promise<{ versionsLoaded: number; rulesLoaded: number } | null> | null = null;

/**
 * Hidrata o registro compartilhado a partir do Supabase. Idempotente.
 * Retorna `null` (sem lançar) se o Supabase não estiver configurado.
 */
export function bindServerContractRulesStore(): Promise<{
  versionsLoaded: number;
  rulesLoaded: number;
} | null> {
  if (!hydratePromise) {
    hydratePromise = (async () => {
      const cfg = getSupabasePublicConfig();
      const admin = getAdminSupabase() as SupabaseClient | null;
      if (!cfg || !admin) return null;

      const { data, error } = await admin
        .from("tiss_contract_rules")
        .select(
          "rule_id, registry_version, effective_from, effective_to, tenant_id, operator, contract, guide_type, procedure_type, priority, description, justification, legal_reference, business_reference, severity, audit_rule_ids, audit_fields, audit_categories, estimated_financial_impact_cents, base_denial_risk",
        )
        .eq("status", "active");
      if (error) {
        throw new Error(`CONTRACT-DATA: falha ao ler tiss_contract_rules (${error.message}).`);
      }

      const rows = (data ?? []) as ContractRuleRow[];

      const approved = await admin
        .from("contract_rule_versions")
        .select("rule_id, tenant_id, operator_code, contract_label, description, justification, citation_heading, guide_type, procedure_type, severity, approved_at");
      if (approved.error) {
        throw new Error(`CONTRACT-DATA: falha ao ler contract_rule_versions (${approved.error.message}).`);
      }
      const approvedRows = (approved.data ?? []) as ApprovedContractRuleVersionRow[];

      if (rows.length === 0 && approvedRows.length === 0) {
        return { versionsLoaded: 0, rulesLoaded: 0 };
      }

      const versions = [...groupIntoVersions(rows), ...groupApprovedIntoVersions(approvedRows)];
      getDefaultContractRegistry().loadVersions(versions);

      return { versionsLoaded: versions.length, rulesLoaded: rows.length + approvedRows.length };
    })().catch((error) => {
      hydratePromise = null;
      throw error;
    });
  }
  return hydratePromise;
}

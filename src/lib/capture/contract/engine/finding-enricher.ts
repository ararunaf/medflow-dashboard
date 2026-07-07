/**
 * FindingEnricher — enriquece AuditFindings com conhecimento contratual.
 * MEDICFLOW-CONTRACT-INTELLIGENCE-01
 *
 * Adiciona justificativa ampliada, fundamentos e risco sem modificar a regra original.
 */
import type { AuditFinding } from "../../audit/types/audit-finding";
import type { ContractResolutionContext } from "../types/contract-context";
import type { ContractRule } from "../types/contract-rule";
import type { EnrichedAuditFinding, FindingEnrichment } from "../types/enriched-finding";

function ruleMatchesFinding(rule: ContractRule, finding: AuditFinding): boolean {
  if (rule.auditRuleIds?.includes(finding.ruleId)) return true;
  if (rule.auditFields?.includes(finding.field)) return true;
  if (rule.auditCategories?.includes(finding.category)) return true;
  return false;
}

function findMatchingRules(
  finding: AuditFinding,
  rules: ContractRule[],
): ContractRule[] {
  return rules
    .filter((rule) => ruleMatchesFinding(rule, finding))
    .sort((a, b) => b.priority - a.priority);
}

function buildTissBasis(finding: AuditFinding): string {
  const tissFields: Record<string, string> = {
    operator_ans_code: "TISS 4.01.00 — Grupo 2: Dados da Operadora (registro ANS)",
    beneficiary_name: "TISS 4.01.00 — Grupo 3: Dados do Beneficiário",
    beneficiary_card_number: "TISS 4.01.00 — Grupo 3: Número da carteirinha",
    procedure_code: "TISS 4.01.00 — Grupo 6: Procedimentos (código TUSS)",
    cid_code: "TISS 4.01.00 — Grupo 5: Dados do Atendimento (CID-10)",
    authorization_password: "TISS 4.01.00 — Grupo 7: Dados da Autorização",
    authorization_number: "TISS 4.01.00 — Grupo 7: Número da guia/senha",
    attendance_date: "TISS 4.01.00 — Grupo 5: Data do atendimento",
    executor_crm: "TISS 4.01.00 — Grupo 4: Dados do Executante",
    executor_name: "TISS 4.01.00 — Grupo 4: Nome do profissional executante",
  };
  return tissFields[finding.field] ?? `TISS 4.01.00 — Campo ${finding.field}`;
}

function buildTussBasis(finding: AuditFinding): string {
  if (finding.field === "procedure_code" || finding.category === "procedimentos") {
    const code = finding.detectedValue ?? "não informado";
    return `TUSS — Código ${code} deve constar na tabela vigente e ser compatível com o tipo de atendimento`;
  }
  return "N/A — finding não relacionado a procedimento TUSS";
}

function buildExpectedImpact(finding: AuditFinding, rules: ContractRule[]): string {
  const severityImpact: Record<string, string> = {
    critico: "Glosa integral do procedimento ou rejeição do lote",
    alto: "Glosa parcial ou devolução para correção",
    medio: "Pendência de documentação complementar",
    baixo: "Observação registrada — baixo impacto financeiro",
  };

  const base = severityImpact[finding.severity] ?? "Impacto a avaliar";
  if (rules.length > 0) {
    const totalCents = rules.reduce((sum, r) => sum + (r.estimatedFinancialImpactCents ?? 0), 0);
    if (totalCents > 0) {
      const formatted = (totalCents / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
      return `${base}. Impacto financeiro estimado: ${formatted}`;
    }
  }
  return base;
}

function buildEnrichment(
  finding: AuditFinding,
  rules: ContractRule[],
  context: ContractResolutionContext,
): FindingEnrichment {
  const primary = rules[0];
  const denialRisks = rules.map((r) => r.baseDenialRisk ?? 50);
  const avgRisk = Math.round(denialRisks.reduce((a, b) => a + b, 0) / denialRisks.length);

  const contractualParts = rules.map(
    (r) => `[${r.ruleId}] ${r.justification} (Ref: ${r.businessReference})`,
  );

  const observations: string[] = [];
  if (rules.length > 1) {
    observations.push(`${rules.length} regras contratuais aplicáveis identificadas.`);
  }
  if (!context.contract.resolved) {
    observations.push(
      "Contrato específico não identificado — fundamentação baseada em regras genéricas ANS/TISS.",
    );
  }
  if (context.conflictingRulesResolved > 0) {
    observations.push(
      `${context.conflictingRulesResolved} conflito(s) de regras resolvido(s) por prioridade.`,
    );
  }

  const totalFinancial = rules.reduce(
    (sum, r) => sum + (r.estimatedFinancialImpactCents ?? 0),
    0,
  );

  return {
    expandedJustification: primary
      ? `${finding.message} — ${primary.justification}`
      : finding.message,
    contractualBasis: contractualParts.join(" | "),
    tissBasis: buildTissBasis(finding),
    tussBasis: buildTussBasis(finding),
    expectedImpact: buildExpectedImpact(finding, rules),
    estimatedDenialRisk: avgRisk,
    observations: observations.join(" "),
    estimatedFinancialImpactCents: totalFinancial > 0 ? totalFinancial : undefined,
  };
}

export function enrichFinding(
  finding: AuditFinding,
  context: ContractResolutionContext,
): EnrichedAuditFinding {
  const matchedRules = findMatchingRules(finding, context.applicableRules);

  return {
    finding,
    enrichment:
      matchedRules.length > 0 ? buildEnrichment(finding, matchedRules, context) : null,
    matchedRuleIds: matchedRules.map((r) => r.ruleId),
  };
}

export function enrichFindings(
  findings: AuditFinding[],
  context: ContractResolutionContext,
): EnrichedAuditFinding[] {
  return findings.map((finding) => enrichFinding(finding, context));
}

export function countEnriched(findings: EnrichedAuditFinding[]): number {
  return findings.filter((f) => f.enrichment != null).length;
}

export function computeAverageDenialRisk(findings: EnrichedAuditFinding[]): number {
  const enriched = findings.filter((f) => f.enrichment != null);
  if (enriched.length === 0) return 0;
  const total = enriched.reduce((sum, f) => sum + (f.enrichment?.estimatedDenialRisk ?? 0), 0);
  return Math.round(total / enriched.length);
}

export function computeTotalFinancialImpact(findings: EnrichedAuditFinding[]): number {
  return findings.reduce(
    (sum, f) => sum + (f.enrichment?.estimatedFinancialImpactCents ?? 0),
    0,
  );
}

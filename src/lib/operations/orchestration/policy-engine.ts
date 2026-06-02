/**
 * Motor de políticas da orquestração: limites, validação de plano, regras de aprovação e safety.
 */
import { mapPostgresError, ValidationError } from "@/lib/domain/operations/errors";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { assertAcyclic, edgesFromDependsOn, topologicalOrdering } from "./dependency-graph";
import type { OrchestrationPolicyBundle, PlannedOrchestrationStep } from "./types";

export const DEFAULT_ORCHESTRATION_POLICY: OrchestrationPolicyBundle = {
  maxChainItems: 10,
  maxExpandedSteps: 30,
  maxConcurrentActive: 5,
  requireApprovedProposalForSimulation: true,
  requireSafeSimulationForExecution: true,
  forbidDuplicateProposalsInPlan: true,
};

export function mergePolicy(
  overrides?: Partial<OrchestrationPolicyBundle>,
): OrchestrationPolicyBundle {
  return { ...DEFAULT_ORCHESTRATION_POLICY, ...overrides };
}

export function validateExpandedPlanAgainstPolicy(
  steps: readonly PlannedOrchestrationStep[],
  policy: OrchestrationPolicyBundle,
): void {
  if (steps.length === 0) {
    throw new ValidationError("Plano de orquestração vazio.");
  }
  if (steps.length > policy.maxExpandedSteps) {
    throw new ValidationError(
      `Plano excede o limite de passos expandidos (${policy.maxExpandedSteps}) — reduza a cadeia ou ajuste a política.`,
    );
  }
  const ordinals = new Set<number>();
  for (const s of steps) {
    if (ordinals.has(s.ordinal)) {
      throw new ValidationError("Ordinais duplicados no plano.");
    }
    ordinals.add(s.ordinal);
  }
  if (policy.forbidDuplicateProposalsInPlan) {
    const seen = new Set<string>();
    for (const s of steps) {
      if (seen.has(s.proposalId)) {
        throw new ValidationError(
          "Política: a mesma proposta não pode aparecer duas vezes na orquestração.",
        );
      }
      seen.add(s.proposalId);
    }
  }
  const dependsMap = new Map<number, number[]>();
  for (const s of steps) {
    dependsMap.set(s.ordinal, [...s.dependsOnOrdinals]);
  }
  const n = steps.length;
  if (steps.some((s) => s.ordinal < 0 || s.ordinal >= n)) {
    throw new ValidationError("Ordinais inválidos — esperado 0..n-1.");
  }
  for (let i = 0; i < n; i++) {
    if (!ordinals.has(i)) {
      throw new ValidationError(`Ordinais devem ser contíguos 0..n-1 (faltando ${i}).`);
    }
  }
  const edges = edgesFromDependsOn(n, dependsMap);
  assertAcyclic(n, edges);
  topologicalOrdering(n, edges);
}

export type PolicyRef = {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

export function policyRefsForPlanValidation(policy: OrchestrationPolicyBundle): PolicyRef[] {
  return [
    {
      id: "orch.max_expanded_steps",
      label: "Limite de passos expandidos",
      status: "pass",
      detail: String(policy.maxExpandedSteps),
    },
    {
      id: "orch.max_chain_items",
      label: "Limite de itens na cadeia",
      status: "pass",
      detail: String(policy.maxChainItems),
    },
    {
      id: "orch.dag_acyclic",
      label: "Grafo acíclico (sem loops)",
      status: "pass",
      detail: "Validado no planejamento.",
    },
    {
      id: "orch.no_duplicate_proposals",
      label: "Sem proposta duplicada no plano",
      status: policy.forbidDuplicateProposalsInPlan ? "pass" : "warn",
      detail: policy.forbidDuplicateProposalsInPlan ? "Obrigatório." : "Desativado.",
    },
  ];
}

export async function assertConcurrentOrchestrationPolicy(
  ctx: ServiceCtx,
  policy: OrchestrationPolicyBundle,
  excludeOrchestrationId?: string,
): Promise<void> {
  const { data, error } = await ctx.client
    .from("operational_orchestrations")
    .select("id")
    .eq("tenant_id", ctx.tenantId)
    .in("state", ["orchestrating", "partially_executed"])
    .limit(policy.maxConcurrentActive + 2);
  if (error) throw mapPostgresError(error);
  const rows = (data ?? []) as { id: string }[];
  const active = excludeOrchestrationId
    ? rows.filter((r) => r.id !== excludeOrchestrationId)
    : rows;
  if (active.length >= policy.maxConcurrentActive) {
    throw new ValidationError(
      `Política: no máximo ${policy.maxConcurrentActive} orquestração(ões) ativa(s) por tenant — conclua, bloqueie ou faça rollback antes de aprovar outra.`,
    );
  }
}

export function approvalRequiredForOrchestrationStart(): boolean {
  return true;
}

import { isOperationalManager } from "@/lib/auth/rbac";
import { mapPostgresError, PermissionError } from "@/lib/domain/operations/errors";
import type { OperationalOrchestrationState } from "@/lib/operations/orchestration/types";
import type { OperationalAgentExplainabilityRef } from "@/lib/operations/agents/contracts";
import type { ServiceCtx } from "@/lib/services/operations/types";

export type OrchestrationAgentAdapterContext = {
  orchestrationSummaries: { id: string; title: string; state: OperationalOrchestrationState }[];
  refs: OperationalAgentExplainabilityRef[];
};

/**
 * Adaptador leve: referências de orquestração / simulação / propostas para explainability dos agentes.
 * Uma consulta de orquestrações + uma de passos — sem reexecutar planner nem loops.
 */
export async function loadOrchestrationAgentAdapterContext(
  ctx: ServiceCtx,
): Promise<OrchestrationAgentAdapterContext> {
  if (!isOperationalManager(ctx.role)) {
    throw new PermissionError(
      "Contexto de orquestração para agentes restrito a coordenação / administradores.",
    );
  }

  const orchRes = await ctx.client
    .from("operational_orchestrations")
    .select("id,title,state")
    .eq("tenant_id", ctx.tenantId)
    .order("updated_at", { ascending: false })
    .limit(12);

  if (orchRes.error) throw mapPostgresError(orchRes.error);

  const orchestrationSummaries = (
    (orchRes.data ?? []) as {
      id: string;
      title: string;
      state: OperationalOrchestrationState;
    }[]
  ).map((r) => ({
    id: r.id,
    title: (r.title ?? "").trim() || "Orquestração",
    state: r.state,
  }));

  const refs: OperationalAgentExplainabilityRef[] = [];
  for (const o of orchestrationSummaries) {
    refs.push({ kind: "orchestration", orchestrationId: o.id, title: o.title, state: o.state });
  }

  const ids = orchestrationSummaries.map((o) => o.id);
  if (ids.length === 0) {
    return { orchestrationSummaries, refs };
  }

  const stepsRes = await ctx.client
    .from("operational_orchestration_steps")
    .select("orchestration_id,ordinal,step_kind,proposal_id,sandbox_run_id,step_state")
    .in("orchestration_id", ids)
    .order("ordinal", { ascending: true })
    .limit(48);

  if (stepsRes.error) throw mapPostgresError(stepsRes.error);

  const rows = (stepsRes.data ?? []) as {
    orchestration_id: string;
    ordinal: number;
    step_kind: string;
    proposal_id: string;
    sandbox_run_id: string | null;
    step_state: string;
  }[];

  for (const s of rows) {
    refs.push({
      kind: "proposal",
      proposalId: s.proposal_id,
      orchestrationId: s.orchestration_id,
      stepOrdinal: s.ordinal,
    });
    if (s.step_kind === "sandbox_simulation" && s.sandbox_run_id) {
      refs.push({
        kind: "simulation",
        sandboxRunId: s.sandbox_run_id,
        proposalId: s.proposal_id,
        orchestrationId: s.orchestration_id,
        stepOrdinal: s.ordinal,
        stepState: s.step_state,
      });
    }
  }

  return { orchestrationSummaries, refs };
}

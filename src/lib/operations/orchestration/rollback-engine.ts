/**
 * Plano de rollback em cadeia: ordem reversa à execução, consciente de dependências.
 */
import type { OperationalOrchestrationStepDto } from "./types";
import type { OrchestrationRollbackPlanItem } from "./types";

/** Monta plano de rollback apenas para passos de execução concluídos com mutation id. */
export function buildOrchestrationRollbackPlan(
  steps: readonly OperationalOrchestrationStepDto[],
): OrchestrationRollbackPlanItem[] {
  const execSteps = steps.filter(
    (s) =>
      s.stepKind === "supervised_execution" && s.stepState === "completed" && s.mutationExecutionId,
  ) as Array<OperationalOrchestrationStepDto & { mutationExecutionId: string }>;

  const items: OrchestrationRollbackPlanItem[] = execSteps.map((s, idx) => ({
    stepOrdinal: s.ordinal,
    proposalId: s.proposalId,
    mutationExecutionId: s.mutationExecutionId,
    rollbackPriority: s.ordinal * 1000 + idx,
  }));
  // Rollback mais recente (maior ordinal) primeiro
  items.sort((a, b) => b.stepOrdinal - a.stepOrdinal);
  return items.map((it, i) => ({ ...it, rollbackPriority: i }));
}

export function reconcileRollbackAfterStep(
  items: readonly OrchestrationRollbackPlanItem[],
  rolledBackExecutionId: string,
): OrchestrationRollbackPlanItem[] {
  return items.filter((x) => x.mutationExecutionId !== rolledBackExecutionId);
}

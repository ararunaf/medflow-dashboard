import { ValidationError } from "@/lib/domain/operations/errors";
import type { OperationalStrategicPlanningLifecycleState } from "@/lib/database.types";

/**
 * Transições humanas explícitas no ciclo persistido (sem saltos diretos para validado).
 */
export function assertStrategicPlanningHumanLifecycleTransition(
  from: OperationalStrategicPlanningLifecycleState,
  to: OperationalStrategicPlanningLifecycleState,
): void {
  if (from === to) return;
  const ok =
    (from === "planned" && to === "supervised_review") ||
    (from === "supervised_review" && to === "validated");
  if (!ok) {
    throw new ValidationError(
      "Transição de ciclo de planejamento estratégico inválida. Use planned→supervised_review ou supervised_review→validated.",
      { from, to },
    );
  }
}

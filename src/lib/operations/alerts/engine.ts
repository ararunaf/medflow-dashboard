import type { OperationalCommandCenterCore } from "@/lib/operations/types/command-center-core";
import { operationalContextFromSnapshot } from "@/lib/operations/alerts/adapters/command-center-snapshot";
import { compareSeverity } from "@/lib/operations/alerts/severity";
import { evaluateOperationalRuleSteps } from "@/lib/operations/alerts/rules-evaluators";
import type { OperationalAlert } from "@/lib/operations/alerts/types";

/**
 * Motor leve de alertas operacionais: regras explícitas, determinísticas,
 * derivadas do snapshot agregado do command center (sem polling extra).
 */
export function evaluateOperationalAlerts(
  snapshot: OperationalCommandCenterCore,
): OperationalAlert[] {
  const ctx = operationalContextFromSnapshot(snapshot);
  const alerts = evaluateOperationalRuleSteps(ctx);
  return alerts.sort((a, b) => {
    const bySev = compareSeverity(a.severity, b.severity);
    if (bySev !== 0) return bySev;
    return a.title.localeCompare(b.title, "pt-BR");
  });
}

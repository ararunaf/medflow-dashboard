import type { OperationalCommandCenterCore } from "@/lib/operations/types/command-center-core";
import type { OperationalRuleContext } from "@/lib/operations/alerts/types";

/**
 * Adapta o snapshot agregado do command center para o contexto do motor de regras.
 * Mantém o engine desacoplado da forma exata do transporte (query / futuro cache).
 */
export function operationalContextFromSnapshot(
  s: OperationalCommandCenterCore,
): OperationalRuleContext {
  const criticalSwapsInHorizon = s.coordination.swapsCritical.filter((x) => x.critical).length;
  const totalProfessionalsProxy =
    s.widgets.availableProfessionals + s.indicators.unavailableProfessionals;

  return {
    asOfISO: s.asOf,
    coveragePercent: s.indicators.coveragePercent,
    openShifts: s.widgets.openShifts,
    availableProfessionals: s.widgets.availableProfessionals,
    pendingSwaps: s.indicators.swapsAwaitingApproval,
    pendingAssignments: s.indicators.pendingAssignments,
    operationalConflicts: s.widgets.operationalConflicts,
    operationalPressure: s.widgets.operationalPressure,
    urgency: s.coordination.urgency,
    unavailableProfessionals: s.indicators.unavailableProfessionals,
    totalProfessionalsProxy,
    overdueOpenShifts: s.indicators.overdueOpenShifts,
    unconfirmedStartingWithin24h: s.indicators.unconfirmedStartingWithin24h,
    shiftsWithMultiplePending: s.indicators.shiftsWithMultiplePending,
    criticalSwapsInHorizon,
    cappedWindowSample: s.meta.cappedWindowSample,
  };
}

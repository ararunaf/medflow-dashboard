/**
 * Adapta o snapshot do command center para métricas de scoring instantâneo.
 */
import type { OperationalCommandCenterCore } from "@/lib/operations/types/command-center-core";
import type { CommandCenterScoringMetrics } from "@/lib/operations/scoring/score-calculators";

export function commandCenterSnapshotToScoringMetrics(
  snap: OperationalCommandCenterCore,
): CommandCenterScoringMetrics {
  const totalProfessionals =
    snap.widgets.availableProfessionals + snap.indicators.unavailableProfessionals;

  return {
    coveragePercent: snap.indicators.coveragePercent,
    shiftsWithoutAssignment: snap.indicators.shiftsWithoutAssignment,
    pendingAssignments: snap.indicators.pendingAssignments,
    swapsAwaitingApproval: snap.indicators.swapsAwaitingApproval,
    operationalConflicts: snap.widgets.operationalConflicts,
    openShifts: snap.widgets.openShifts,
    confirmationRatePercent: snap.indicators.confirmationRatePercent,
    unavailableProfessionals: snap.indicators.unavailableProfessionals,
    totalProfessionals,
    unconfirmedStartingWithin24h: snap.indicators.unconfirmedStartingWithin24h,
    overdueOpenShifts: snap.indicators.overdueOpenShifts,
  };
}

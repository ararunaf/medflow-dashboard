import type {
  OperationalPressure,
  OperationalUrgency,
} from "@/lib/operations/metrics/status-helpers";

export type OperationalSwapQuickItem = {
  swapId: string;
  shiftStartsAt: string;
  departmentName: string;
  requesterName: string | null;
  targetName: string | null;
  critical: boolean;
};

/**
 * Snapshot agregado do command center sem a camada de scoring (evita ciclos de import).
 */
export type OperationalCommandCenterCore = {
  asOf: string;
  window: { fromISO: string; toISO: string };
  widgets: {
    openShifts: number;
    confirmedShiftsInWindow: number;
    pendingSwaps: number;
    operationalCoveragePercent: number;
    availableProfessionals: number;
    operationalConflicts: number;
    operationalPressure: OperationalPressure;
  };
  indicators: {
    coveragePercent: number;
    shiftsWithoutAssignment: number;
    pendingAssignments: number;
    swapsAwaitingApproval: number;
    unavailableProfessionals: number;
    confirmationRatePercent: number;
    overdueOpenShifts: number;
    shiftsWithMultiplePending: number;
    unconfirmedStartingWithin24h: number;
  };
  coordination: {
    urgency: OperationalUrgency;
    conflictsOverview: string;
    coverageOverview: string;
    swapsCritical: OperationalSwapQuickItem[];
  };
  meta: {
    cappedWindowSample: boolean;
  };
};

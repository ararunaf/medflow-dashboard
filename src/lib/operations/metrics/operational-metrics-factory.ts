/**
 * Fábrica de métricas operacionais a partir de uma amostra de plantões
 * na janela (evita N+1 no cliente — tudo calculado no servidor).
 */
import type { AssignmentStatus, ShiftStatus } from "@/lib/database.types";
import {
  conflictsOverviewText,
  coverageOverviewText,
  deriveOperationalPressure,
  deriveOperationalUrgency,
  type OperationalPressure,
  type OperationalUrgency,
} from "@/lib/operations/metrics/status-helpers";

export type ShiftAssignmentSample = { assignment_status: AssignmentStatus };

export type ShiftWindowSample = {
  id: string;
  status: ShiftStatus;
  starts_at: string;
  assignments: ShiftAssignmentSample[] | null;
};

export type ShiftWindowAggregate = {
  shiftsTotalInWindow: number;
  shiftsConfirmedInWindow: number;
  shiftsWithoutConfirmedAssignment: number;
  shiftsOpenUnassigned: number;
  overdueOpenShifts: number;
  shiftsWithMultiplePending: number;
  /** Sem confirmação e início nas próximas 24h (janela operacional). */
  unconfirmedStartingWithin24h: number;
  /** Plantões com qualquer sinal de conflito (contagem única por plantão). */
  operationalConflictShifts: number;
  assignmentBuckets: { confirmed: number; pending: number; rejected: number };
  cappedSample: boolean;
};

export function aggregateShiftWindow(
  rows: ShiftWindowSample[],
  nowMs: number,
  hitRowCap: boolean,
  /** Instantâneo usado para “atrasado” / próximas 24h (ex.: fim do dia em séries históricas). */
  evaluationTimeMs?: number,
): ShiftWindowAggregate {
  const evalMs = evaluationTimeMs ?? nowMs;
  const horizon24hMs = 24 * 60 * 60 * 1000;
  let shiftsTotalInWindow = 0;
  let shiftsConfirmedInWindow = 0;
  let shiftsWithoutConfirmedAssignment = 0;
  let shiftsOpenUnassigned = 0;
  let overdueOpenShifts = 0;
  let shiftsWithMultiplePending = 0;
  let unconfirmedStartingWithin24h = 0;
  let operationalConflictShifts = 0;
  let confirmed = 0;
  let pending = 0;
  let rejected = 0;

  for (const row of rows) {
    if (row.status === "cancelled") continue;
    shiftsTotalInWindow += 1;
    const assigns = row.assignments ?? [];
    let pendingOnShift = 0;
    let hasConfirmed = false;
    for (const a of assigns) {
      if (a.assignment_status === "confirmed") {
        hasConfirmed = true;
        confirmed += 1;
      } else if (a.assignment_status === "pending") {
        pendingOnShift += 1;
        pending += 1;
      } else if (a.assignment_status === "rejected") {
        rejected += 1;
      }
    }
    if (hasConfirmed) shiftsConfirmedInWindow += 1;
    if (!hasConfirmed) shiftsWithoutConfirmedAssignment += 1;

    const startMs = new Date(row.starts_at).getTime();
    if (
      !hasConfirmed &&
      !Number.isNaN(startMs) &&
      startMs > evalMs &&
      startMs <= evalMs + horizon24hMs
    ) {
      unconfirmedStartingWithin24h += 1;
    }
    const overdueOpen = row.status === "open" && !Number.isNaN(startMs) && startMs < evalMs;

    if (row.status === "open") {
      shiftsOpenUnassigned += 1;
      if (overdueOpen) overdueOpenShifts += 1;
    }
    if (pendingOnShift > 1) shiftsWithMultiplePending += 1;

    const conflictHere = pendingOnShift > 1 || overdueOpen;
    if (conflictHere) operationalConflictShifts += 1;
  }

  return {
    shiftsTotalInWindow,
    shiftsConfirmedInWindow,
    shiftsWithoutConfirmedAssignment,
    shiftsOpenUnassigned,
    overdueOpenShifts,
    shiftsWithMultiplePending,
    unconfirmedStartingWithin24h,
    operationalConflictShifts,
    assignmentBuckets: { confirmed: confirmed, pending, rejected },
    cappedSample: hitRowCap,
  };
}

export function buildOperationalCommandCenterView(input: {
  now: Date;
  window: { fromISO: string; toISO: string };
  openShifts: number;
  pendingSwaps: number;
  pendingAssignments: number;
  totalProfessionals: number;
  professionalsWithAvailability: number;
  shiftAggregate: ShiftWindowAggregate;
}): {
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
    conflicts: number;
  };
  cappedWindowSample: boolean;
} {
  const { shiftAggregate: agg } = input;
  const coveragePercent =
    agg.shiftsTotalInWindow === 0
      ? 100
      : Math.round((agg.shiftsConfirmedInWindow / agg.shiftsTotalInWindow) * 100);

  const b = agg.assignmentBuckets;
  const decisions = b.confirmed + b.pending + b.rejected;
  const confirmationRatePercent =
    decisions === 0 ? 100 : Math.round((b.confirmed / decisions) * 100);

  const conflicts = agg.operationalConflictShifts;
  const unavailableProfessionals = Math.max(
    0,
    input.totalProfessionals - input.professionalsWithAvailability,
  );

  const urgency = deriveOperationalUrgency({
    coveragePercent,
    conflicts,
    overdueOpenShifts: agg.overdueOpenShifts,
  });

  const pressure = deriveOperationalPressure({
    openShifts: input.openShifts,
    pendingSwaps: input.pendingSwaps,
    pendingAssignments: input.pendingAssignments,
    coverageGapPercent: 100 - coveragePercent,
    conflicts,
  });

  return {
    widgets: {
      openShifts: input.openShifts,
      confirmedShiftsInWindow: agg.shiftsConfirmedInWindow,
      pendingSwaps: input.pendingSwaps,
      operationalCoveragePercent: coveragePercent,
      availableProfessionals: input.professionalsWithAvailability,
      operationalConflicts: conflicts,
      operationalPressure: pressure,
    },
    indicators: {
      coveragePercent,
      shiftsWithoutAssignment: agg.shiftsWithoutConfirmedAssignment,
      pendingAssignments: input.pendingAssignments,
      swapsAwaitingApproval: input.pendingSwaps,
      unavailableProfessionals,
      confirmationRatePercent,
      overdueOpenShifts: agg.overdueOpenShifts,
      shiftsWithMultiplePending: agg.shiftsWithMultiplePending,
      unconfirmedStartingWithin24h: agg.unconfirmedStartingWithin24h,
    },
    coordination: {
      urgency,
      conflictsOverview: conflictsOverviewText(
        agg.shiftsWithMultiplePending,
        agg.overdueOpenShifts,
      ),
      coverageOverview: coverageOverviewText(coveragePercent, agg.shiftsTotalInWindow),
      conflicts,
    },
    cappedWindowSample: agg.cappedSample,
  };
}

export type OperationalAlertSeverity = "info" | "warning" | "critical";

export const OPERATIONAL_ALERT_RULE_IDS = {
  coverageLow: "coverage_low",
  coverageWatch: "coverage_watch",
  overdueOpenShifts: "overdue_open_shifts",
  unconfirmedStartingSoon: "unconfirmed_starting_soon",
  openShiftsNearWindow: "open_shifts_near_window",
  swapsQueuePressure: "swaps_queue_pressure",
  swapsCriticalHorizon: "swaps_critical_horizon",
  assignmentsPending: "assignments_pending",
  operationalConflicts: "operational_conflicts",
  coordinationPressure: "coordination_pressure",
  availabilityRisk: "availability_risk",
  windowSampleCapped: "window_sample_capped",
} as const;

export type OperationalAlertRuleId =
  (typeof OPERATIONAL_ALERT_RULE_IDS)[keyof typeof OPERATIONAL_ALERT_RULE_IDS];

export type OperationalAlert = {
  id: OperationalAlertRuleId;
  severity: OperationalAlertSeverity;
  title: string;
  detail: string;
};

export type OperationalRuleContext = {
  asOfISO: string;
  coveragePercent: number;
  openShifts: number;
  availableProfessionals: number;
  pendingSwaps: number;
  pendingAssignments: number;
  operationalConflicts: number;
  operationalPressure: "baixa" | "moderada" | "alta";
  urgency: "normal" | "elevada" | "critica";
  unavailableProfessionals: number;
  totalProfessionalsProxy: number;
  overdueOpenShifts: number;
  unconfirmedStartingWithin24h: number;
  shiftsWithMultiplePending: number;
  criticalSwapsInHorizon: number;
  cappedWindowSample: boolean;
};

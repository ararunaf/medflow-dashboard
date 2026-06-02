/**
 * Limiares explícitos do motor de regras operacionais.
 * Centralizados para ajuste fino sem espalhar números mágicos.
 */
export const OPERATIONAL_ALERT_THRESHOLDS = {
  coverageCriticalMax: 70,
  coverageWarningMax: 85,

  pendingAssignmentsWarning: 5,
  pendingAssignmentsCritical: 12,

  pendingSwapsWarning: 5,
  pendingSwapsCritical: 10,

  conflictsWarningMin: 1,
  conflictsElevatedMin: 3,
  conflictsCriticalMin: 5,

  openShiftsElevated: 6,
  unconfirmedSoonWarning: 2,
  unconfirmedSoonCritical: 5,

  criticalSwapsInHorizonWarning: 2,
  criticalSwapsInHorizonCritical: 4,

  unavailableRatioWarning: 0.45,
  unavailableRatioCritical: 0.7,
  minProfessionalsForRatio: 4,
} as const;

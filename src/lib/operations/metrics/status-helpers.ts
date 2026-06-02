/**
 * Helpers puros de status operacional (urgência, pressão, cópias curtas).
 * Sem I/O — facilita testes e reutilização no command center.
 */

export type OperationalUrgency = "normal" | "elevada" | "critica";
export type OperationalPressure = "baixa" | "moderada" | "alta";

export function deriveOperationalUrgency(input: {
  coveragePercent: number;
  conflicts: number;
  overdueOpenShifts: number;
}): OperationalUrgency {
  if (input.overdueOpenShifts > 0 || input.conflicts >= 5) return "critica";
  if (input.conflicts > 0 || input.coveragePercent < 55) return "elevada";
  if (input.coveragePercent < 72) return "elevada";
  return "normal";
}

/** Mesma fórmula de `deriveOperationalPressure`, exposta para médias em analytics. */
export function operationalPressureNumeric(input: {
  openShifts: number;
  pendingSwaps: number;
  pendingAssignments: number;
  coverageGapPercent: number;
  conflicts: number;
}): number {
  return (
    input.openShifts * 1.4 +
    input.pendingSwaps * 2.2 +
    input.pendingAssignments * 1.1 +
    input.coverageGapPercent * 0.35 +
    input.conflicts * 3.5
  );
}

export function deriveOperationalPressure(input: {
  openShifts: number;
  pendingSwaps: number;
  pendingAssignments: number;
  coverageGapPercent: number;
  conflicts: number;
}): OperationalPressure {
  const score = operationalPressureNumeric(input);
  if (score >= 42) return "alta";
  if (score >= 18) return "moderada";
  return "baixa";
}

export function coverageOverviewText(coveragePercent: number, shiftsTotal: number): string {
  if (shiftsTotal === 0) return "Nenhum plantão ativo na janela operacional.";
  if (coveragePercent >= 90) return "Cobertura sólida na janela — poucos buracos.";
  if (coveragePercent >= 70) return "Cobertura aceitável — monitore plantões sem confirmação.";
  return "Cobertura pressionada — priorize alocação e confirmações.";
}

export function conflictsOverviewText(
  multiPendingShifts: number,
  overdueOpenShifts: number,
): string {
  const total = multiPendingShifts + overdueOpenShifts;
  if (total === 0) return "Sem sinais de conflito na amostra analisada.";
  const parts: string[] = [];
  if (multiPendingShifts > 0) {
    parts.push(
      `${multiPendingShifts} plantão${multiPendingShifts === 1 ? "" : "ões"} com múltiplas candidaturas pendentes`,
    );
  }
  if (overdueOpenShifts > 0) {
    parts.push(
      `${overdueOpenShifts} plantão${overdueOpenShifts === 1 ? "" : "ões"} aberto${overdueOpenShifts === 1 ? "" : "s"} com início já passado`,
    );
  }
  return parts.join(" · ");
}

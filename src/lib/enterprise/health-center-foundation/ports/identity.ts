/**
 * Helpers de identidade — INF-05 Health Center Foundation.
 *
 * Sem OCR, IA, parsers, banco, monitoramento, health checks ou conhecimento clínico / TISS.
 */

let executionHealthCenterIdSeq = 0;
let healthComponentIdSeq = 0;

function next(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

export function createExecutionHealthCenterId(): string {
  executionHealthCenterIdSeq += 1;
  return next("execution-health-center", executionHealthCenterIdSeq);
}

export function createHealthComponentId(): string {
  healthComponentIdSeq += 1;
  return next("health-component", healthComponentIdSeq);
}

export function resetExecutionHealthCenterIdSequence(): void {
  executionHealthCenterIdSeq = 0;
}

export function resetHealthComponentIdSequence(): void {
  healthComponentIdSeq = 0;
}

export function resetAllHealthCenterFoundationIdSequences(): void {
  resetExecutionHealthCenterIdSequence();
  resetHealthComponentIdSequence();
}

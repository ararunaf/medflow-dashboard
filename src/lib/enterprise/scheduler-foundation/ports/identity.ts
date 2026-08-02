/**
 * Helpers de identidade — INF-03 Scheduler Foundation.
 *
 * Sem OCR, IA, parsers, banco, cron, timers ou conhecimento clínico / TISS.
 */

let executionSchedulerIdSeq = 0;

function next(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

export function createExecutionSchedulerId(): string {
  executionSchedulerIdSeq += 1;
  return next("execution-scheduler", executionSchedulerIdSeq);
}

export function resetExecutionSchedulerIdSequence(): void {
  executionSchedulerIdSeq = 0;
}

export function resetAllSchedulerFoundationIdSequences(): void {
  resetExecutionSchedulerIdSequence();
}

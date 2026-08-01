/**
 * Helpers de identidade — INF-02 Worker Foundation.
 *
 * Sem OCR, IA, parsers, banco, threads ou conhecimento clínico / TISS.
 */

let executionWorkerIdSeq = 0;

function next(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

export function createExecutionWorkerId(): string {
  executionWorkerIdSeq += 1;
  return next("execution-worker", executionWorkerIdSeq);
}

export function resetExecutionWorkerIdSequence(): void {
  executionWorkerIdSeq = 0;
}

export function resetAllWorkerFoundationIdSequences(): void {
  resetExecutionWorkerIdSequence();
}

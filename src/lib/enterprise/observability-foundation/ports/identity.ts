/**
 * Helpers de identidade — INF-04 Observability Foundation.
 *
 * Sem OCR, IA, parsers, banco, logs, métricas, tracing ou conhecimento clínico / TISS.
 */

let executionObservabilityIdSeq = 0;

function next(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

export function createExecutionObservabilityId(): string {
  executionObservabilityIdSeq += 1;
  return next("execution-observability", executionObservabilityIdSeq);
}

export function resetExecutionObservabilityIdSequence(): void {
  executionObservabilityIdSeq = 0;
}

export function resetAllObservabilityFoundationIdSequences(): void {
  resetExecutionObservabilityIdSequence();
}

/**
 * Identidade de registros do Canonical Execution Orchestrator — EPC-24.
 *
 * Sequência in-process para testes determinísticos.
 * Sem UUID de rede, sem I/O.
 */

let executionSequence = 0;
let stepSequence = 0;
let resultSequence = 0;
let traceSequence = 0;
let correlationSequence = 0;

/** Gera um ExecutionId estável e determinístico no processo. */
export function createExecutionId(): string {
  executionSequence += 1;
  return `canonical-exec-${executionSequence}`;
}

/** Reset da sequência de ExecutionId — exclusivo para testes. */
export function resetExecutionIdSequence(): void {
  executionSequence = 0;
}

/** Gera um StepId estável e determinístico no processo. */
export function createStepId(): string {
  stepSequence += 1;
  return `canonical-step-${stepSequence}`;
}

/** Reset da sequência de StepId — exclusivo para testes. */
export function resetStepIdSequence(): void {
  stepSequence = 0;
}

/** Gera um ResultId estável e determinístico no processo. */
export function createResultId(): string {
  resultSequence += 1;
  return `canonical-result-${resultSequence}`;
}

/** Reset da sequência de ResultId — exclusivo para testes. */
export function resetResultIdSequence(): void {
  resultSequence = 0;
}

/** Gera um TraceId estável e determinístico no processo. */
export function createTraceId(): string {
  traceSequence += 1;
  return `canonical-trace-${traceSequence}`;
}

/** Reset da sequência de TraceId — exclusivo para testes. */
export function resetTraceIdSequence(): void {
  traceSequence = 0;
}

/** Gera um CorrelationId estável e determinístico no processo. */
export function createCorrelationId(): string {
  correlationSequence += 1;
  return `canonical-corr-${correlationSequence}`;
}

/** Reset da sequência de CorrelationId — exclusivo para testes. */
export function resetCorrelationIdSequence(): void {
  correlationSequence = 0;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllCanonicalExecutionIdSequences(): void {
  resetExecutionIdSequence();
  resetStepIdSequence();
  resetResultIdSequence();
  resetTraceIdSequence();
  resetCorrelationIdSequence();
}

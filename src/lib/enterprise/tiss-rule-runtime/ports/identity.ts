/**
 * Identidade de registros do TISS Rule Runtime — EPC-23.
 *
 * Sequência in-process para testes determinísticos.
 * Sem UUID de rede, sem I/O.
 */

let executionSequence = 0;
let pipelineSequence = 0;
let stageSequence = 0;
let resultSequence = 0;
let traceSequence = 0;
let metadataSequence = 0;
let correlationSequence = 0;

/** Gera um ExecutionId estável e determinístico no processo. */
export function createExecutionId(): string {
  executionSequence += 1;
  return `tiss-runtime-exec-${executionSequence}`;
}

/** Reset da sequência de ExecutionId — exclusivo para testes. */
export function resetExecutionIdSequence(): void {
  executionSequence = 0;
}

/** Gera um PipelineId estável e determinístico no processo. */
export function createPipelineId(): string {
  pipelineSequence += 1;
  return `tiss-runtime-pipeline-${pipelineSequence}`;
}

/** Reset da sequência de PipelineId — exclusivo para testes. */
export function resetPipelineIdSequence(): void {
  pipelineSequence = 0;
}

/** Gera um StageId estável e determinístico no processo. */
export function createStageId(): string {
  stageSequence += 1;
  return `tiss-runtime-stage-${stageSequence}`;
}

/** Reset da sequência de StageId — exclusivo para testes. */
export function resetStageIdSequence(): void {
  stageSequence = 0;
}

/** Gera um ResultId estável e determinístico no processo. */
export function createResultId(): string {
  resultSequence += 1;
  return `tiss-runtime-result-${resultSequence}`;
}

/** Reset da sequência de ResultId — exclusivo para testes. */
export function resetResultIdSequence(): void {
  resultSequence = 0;
}

/** Gera um TraceId estável e determinístico no processo. */
export function createTraceId(): string {
  traceSequence += 1;
  return `tiss-runtime-trace-${traceSequence}`;
}

/** Reset da sequência de TraceId — exclusivo para testes. */
export function resetTraceIdSequence(): void {
  traceSequence = 0;
}

/** Gera um MetadataId estável e determinístico no processo. */
export function createRuntimeMetadataId(): string {
  metadataSequence += 1;
  return `tiss-runtime-meta-${metadataSequence}`;
}

/** Reset da sequência de MetadataId — exclusivo para testes. */
export function resetRuntimeMetadataIdSequence(): void {
  metadataSequence = 0;
}

/** Gera um CorrelationId estável e determinístico no processo. */
export function createCorrelationId(): string {
  correlationSequence += 1;
  return `tiss-runtime-corr-${correlationSequence}`;
}

/** Reset da sequência de CorrelationId — exclusivo para testes. */
export function resetCorrelationIdSequence(): void {
  correlationSequence = 0;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllTISSRuleRuntimeIdSequences(): void {
  resetExecutionIdSequence();
  resetPipelineIdSequence();
  resetStageIdSequence();
  resetResultIdSequence();
  resetTraceIdSequence();
  resetRuntimeMetadataIdSequence();
  resetCorrelationIdSequence();
}

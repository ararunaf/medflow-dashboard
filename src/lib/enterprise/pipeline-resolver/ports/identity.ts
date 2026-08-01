/**
 * Helpers de identidade — EPC-24 Sprint 02 (Pipeline Resolver).
 *
 * Sem OCR, IA, parsers ou conhecimento clínico / TISS.
 */

let pipelineIdSeq = 0;
let stageIdSeq = 0;
let nodeIdSeq = 0;
let dependencyIdSeq = 0;
let resolutionIdSeq = 0;
let resolutionResultIdSeq = 0;

function next(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

export function createPipelineId(): string {
  pipelineIdSeq += 1;
  return next("pipeline", pipelineIdSeq);
}

export function createStageId(): string {
  stageIdSeq += 1;
  return next("pipeline-stage", stageIdSeq);
}

export function createNodeId(): string {
  nodeIdSeq += 1;
  return next("pipeline-node", nodeIdSeq);
}

export function createDependencyId(): string {
  dependencyIdSeq += 1;
  return next("pipeline-dep", dependencyIdSeq);
}

export function createResolutionId(): string {
  resolutionIdSeq += 1;
  return next("pipeline-resolution", resolutionIdSeq);
}

export function createResolutionResultId(): string {
  resolutionResultIdSeq += 1;
  return next("pipeline-resolution-result", resolutionResultIdSeq);
}

export function resetPipelineIdSequence(): void {
  pipelineIdSeq = 0;
}

export function resetStageIdSequence(): void {
  stageIdSeq = 0;
}

export function resetNodeIdSequence(): void {
  nodeIdSeq = 0;
}

export function resetDependencyIdSequence(): void {
  dependencyIdSeq = 0;
}

export function resetResolutionIdSequence(): void {
  resolutionIdSeq = 0;
}

export function resetResolutionResultIdSequence(): void {
  resolutionResultIdSeq = 0;
}

export function resetAllPipelineResolverIdSequences(): void {
  resetPipelineIdSequence();
  resetStageIdSequence();
  resetNodeIdSequence();
  resetDependencyIdSequence();
  resetResolutionIdSequence();
  resetResolutionResultIdSequence();
}

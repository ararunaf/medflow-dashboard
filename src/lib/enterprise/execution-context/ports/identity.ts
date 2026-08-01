/**
 * Helpers de identidade — EPC-24 Sprint 03 (Execution Context).
 *
 * Sem OCR, IA, parsers ou conhecimento clínico / TISS.
 */

let contextIdSeq = 0;
let referenceIdSeq = 0;
let historyIdSeq = 0;
let stageIdSeq = 0;
let snapshotIdSeq = 0;
let traceIdSeq = 0;

function next(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

export function createContextId(): string {
  contextIdSeq += 1;
  return next("execution-context", contextIdSeq);
}

export function createReferenceId(): string {
  referenceIdSeq += 1;
  return next("execution-context-ref", referenceIdSeq);
}

export function createHistoryId(): string {
  historyIdSeq += 1;
  return next("execution-context-history", historyIdSeq);
}

export function createStageId(): string {
  stageIdSeq += 1;
  return next("execution-context-stage", stageIdSeq);
}

export function createSnapshotId(): string {
  snapshotIdSeq += 1;
  return next("execution-context-snapshot", snapshotIdSeq);
}

export function createTraceId(): string {
  traceIdSeq += 1;
  return next("execution-context-trace", traceIdSeq);
}

export function resetContextIdSequence(): void {
  contextIdSeq = 0;
}

export function resetReferenceIdSequence(): void {
  referenceIdSeq = 0;
}

export function resetHistoryIdSequence(): void {
  historyIdSeq = 0;
}

export function resetStageIdSequence(): void {
  stageIdSeq = 0;
}

export function resetSnapshotIdSequence(): void {
  snapshotIdSeq = 0;
}

export function resetTraceIdSequence(): void {
  traceIdSeq = 0;
}

export function resetAllExecutionContextIdSequences(): void {
  resetContextIdSequence();
  resetReferenceIdSequence();
  resetHistoryIdSequence();
  resetStageIdSequence();
  resetSnapshotIdSequence();
  resetTraceIdSequence();
}

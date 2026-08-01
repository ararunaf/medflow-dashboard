/**
 * Helpers de identidade — EPC-24 Sprint 07 (Execution Trace).
 *
 * Sem OCR, IA, parsers, banco, logs, telemetria ou conhecimento clínico / TISS.
 */

let executionTraceIdSeq = 0;
let entryIdSeq = 0;
let stepIdSeq = 0;
let nodeIdSeq = 0;
let snapshotIdSeq = 0;
let timelineIdSeq = 0;

function next(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

export function createExecutionTraceId(): string {
  executionTraceIdSeq += 1;
  return next("execution-trace", executionTraceIdSeq);
}

export function createTraceEntryId(): string {
  entryIdSeq += 1;
  return next("execution-trace-entry", entryIdSeq);
}

export function createTraceStepId(): string {
  stepIdSeq += 1;
  return next("execution-trace-step", stepIdSeq);
}

export function createTraceNodeId(): string {
  nodeIdSeq += 1;
  return next("execution-trace-node", nodeIdSeq);
}

export function createTraceSnapshotId(): string {
  snapshotIdSeq += 1;
  return next("execution-trace-snapshot", snapshotIdSeq);
}

export function createTraceTimelineId(): string {
  timelineIdSeq += 1;
  return next("execution-trace-timeline", timelineIdSeq);
}

export function resetExecutionTraceIdSequence(): void {
  executionTraceIdSeq = 0;
}

export function resetTraceEntryIdSequence(): void {
  entryIdSeq = 0;
}

export function resetTraceStepIdSequence(): void {
  stepIdSeq = 0;
}

export function resetTraceNodeIdSequence(): void {
  nodeIdSeq = 0;
}

export function resetTraceSnapshotIdSequence(): void {
  snapshotIdSeq = 0;
}

export function resetTraceTimelineIdSequence(): void {
  timelineIdSeq = 0;
}

export function resetAllExecutionTraceIdSequences(): void {
  resetExecutionTraceIdSequence();
  resetTraceEntryIdSequence();
  resetTraceStepIdSequence();
  resetTraceNodeIdSequence();
  resetTraceSnapshotIdSequence();
  resetTraceTimelineIdSequence();
}

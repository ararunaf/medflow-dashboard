/**
 * Helpers de identidade — EPC-24 Sprint 06 (Execution Registry).
 *
 * Sem OCR, IA, parsers, banco ou conhecimento clínico / TISS.
 */

let executionRegistryIdSeq = 0;
let recordIdSeq = 0;
let snapshotIdSeq = 0;
let indexIdSeq = 0;

function next(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

export function createExecutionRegistryId(): string {
  executionRegistryIdSeq += 1;
  return next("execution-registry", executionRegistryIdSeq);
}

export function createRegistryRecordId(): string {
  recordIdSeq += 1;
  return next("execution-registry-record", recordIdSeq);
}

export function createRegistrySnapshotId(): string {
  snapshotIdSeq += 1;
  return next("execution-registry-snapshot", snapshotIdSeq);
}

export function createRegistryIndexId(): string {
  indexIdSeq += 1;
  return next("execution-registry-index", indexIdSeq);
}

export function resetExecutionRegistryIdSequence(): void {
  executionRegistryIdSeq = 0;
}

export function resetRegistryRecordIdSequence(): void {
  recordIdSeq = 0;
}

export function resetRegistrySnapshotIdSequence(): void {
  snapshotIdSeq = 0;
}

export function resetRegistryIndexIdSequence(): void {
  indexIdSeq = 0;
}

export function resetAllExecutionRegistryIdSequences(): void {
  resetExecutionRegistryIdSequence();
  resetRegistryRecordIdSequence();
  resetRegistrySnapshotIdSequence();
  resetRegistryIndexIdSequence();
}

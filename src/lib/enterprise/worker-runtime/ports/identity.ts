/**
 * Helpers de identidade — INF-06 Enterprise Worker Runtime.
 */

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createWorkerRuntimeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

let resultSeq = 0;
let workerSeq = 0;
let taskSeq = 0;
let executionSeq = 0;

/** Gera id estrutural para resultados de Worker Runtime canônico. */
export function createWorkerResultId(prefix = "worker-result"): string {
  resultSeq += 1;
  return `${prefix}-${resultSeq.toString(36)}`;
}

/** Gera id estrutural para Workers canônicos. */
export function createWorkerId(prefix = "worker"): string {
  workerSeq += 1;
  return `${prefix}-${workerSeq.toString(36)}`;
}

/** Gera id estrutural para tasks canônicas. */
export function createWorkerTaskId(prefix = "worker-task"): string {
  taskSeq += 1;
  return `${prefix}-${taskSeq.toString(36)}`;
}

/** Gera id estrutural para execuções canônicas. */
export function createWorkerExecutionId(prefix = "worker-exec"): string {
  executionSeq += 1;
  return `${prefix}-${executionSeq.toString(36)}`;
}

export function resetWorkerRuntimeIdSequences(): void {
  resultSeq = 0;
  workerSeq = 0;
  taskSeq = 0;
  executionSeq = 0;
}

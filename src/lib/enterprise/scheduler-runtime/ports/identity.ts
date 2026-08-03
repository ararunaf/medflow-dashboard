/**
 * Helpers de identidade — INF-07 Enterprise Scheduler Runtime.
 */

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createSchedulerRuntimeRequestId(): string {
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
let scheduleSeq = 0;
let jobSeq = 0;
let dispatchSeq = 0;

/** Gera id estrutural para resultados de Scheduler Runtime canônico. */
export function createSchedulerResultId(prefix = "scheduler-result"): string {
  resultSeq += 1;
  return `${prefix}-${resultSeq.toString(36)}`;
}

/** Gera id estrutural para Schedules canônicos. */
export function createScheduleId(prefix = "schedule"): string {
  scheduleSeq += 1;
  return `${prefix}-${scheduleSeq.toString(36)}`;
}

/** Gera id estrutural para Jobs canônicos. */
export function createSchedulerJobId(prefix = "scheduler-job"): string {
  jobSeq += 1;
  return `${prefix}-${jobSeq.toString(36)}`;
}

/** Gera id estrutural para Dispatches canônicos. */
export function createSchedulerDispatchId(prefix = "scheduler-dispatch"): string {
  dispatchSeq += 1;
  return `${prefix}-${dispatchSeq.toString(36)}`;
}

export function resetSchedulerRuntimeIdSequences(): void {
  resultSeq = 0;
  scheduleSeq = 0;
  jobSeq = 0;
  dispatchSeq = 0;
}

/**
 * ExecutionSchedulerStore — contrato interno do store (INF-03).
 *
 * Armazenamento in-memory estrutural apenas.
 * Sem banco. Sem HTTP. Sem execução. Sem persistência real. Sem cache distribuído.
 * Sem cron. Sem timers. Sem jobs. Sem concorrência.
 */
import type { CanonicalSchedule } from "../ports/models";

export type StoredCanonicalSchedule = {
  schedule: CanonicalSchedule;
};

export interface ExecutionSchedulerStore {
  readonly storeId: string;
  getSchedule(executionSchedulerId: string): StoredCanonicalSchedule | undefined;
  getScheduleByExecution(executionId: string): StoredCanonicalSchedule | undefined;
  setSchedule(stored: StoredCanonicalSchedule): void;
  removeSchedule(executionSchedulerId: string): StoredCanonicalSchedule | undefined;
  listSchedules(): readonly StoredCanonicalSchedule[];
  scheduleCount(): number;
  referenceCount(): number;
  health(): { ok: boolean; message?: string };
}

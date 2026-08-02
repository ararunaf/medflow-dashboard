/**
 * InMemoryExecutionSchedulerStore — store in-process padrão (INF-03).
 *
 * Armazenamento estrutural in-memory apenas.
 * Sem banco. Sem HTTP. Sem execução. Sem persistência real. Sem cache distribuído.
 * Sem cron. Sem timers. Sem jobs. Sem concorrência.
 */
import type { ExecutionSchedulerStore, StoredCanonicalSchedule } from "./execution-scheduler-store";

export const IN_MEMORY_EXECUTION_SCHEDULER_STORE_ID = "in-memory-execution-scheduler";

export type InMemoryExecutionSchedulerStoreOptions = {
  schedules?: readonly StoredCanonicalSchedule[];
};

export class InMemoryExecutionSchedulerStore implements ExecutionSchedulerStore {
  readonly storeId = IN_MEMORY_EXECUTION_SCHEDULER_STORE_ID;
  private readonly schedules = new Map<string, StoredCanonicalSchedule>();
  private readonly byExecution = new Map<string, string>();

  constructor(options: InMemoryExecutionSchedulerStoreOptions = {}) {
    for (const stored of options.schedules ?? []) {
      this.setSchedule(stored);
    }
  }

  getSchedule(executionSchedulerId: string): StoredCanonicalSchedule | undefined {
    return this.schedules.get(executionSchedulerId);
  }

  getScheduleByExecution(executionId: string): StoredCanonicalSchedule | undefined {
    const schedulerId = this.byExecution.get(executionId);
    if (!schedulerId) return undefined;
    return this.schedules.get(schedulerId);
  }

  setSchedule(stored: StoredCanonicalSchedule): void {
    this.schedules.set(stored.schedule.executionSchedulerId, stored);
    if (stored.schedule.executionId) {
      this.byExecution.set(stored.schedule.executionId, stored.schedule.executionSchedulerId);
    }
  }

  removeSchedule(executionSchedulerId: string): StoredCanonicalSchedule | undefined {
    const existing = this.schedules.get(executionSchedulerId);
    if (!existing) return undefined;
    this.schedules.delete(executionSchedulerId);
    if (existing.schedule.executionId) {
      this.byExecution.delete(existing.schedule.executionId);
    }
    return existing;
  }

  listSchedules(): readonly StoredCanonicalSchedule[] {
    return [...this.schedules.values()];
  }

  scheduleCount(): number {
    return this.schedules.size;
  }

  referenceCount(): number {
    let total = 0;
    for (const stored of this.schedules.values()) {
      total += stored.schedule.references.length;
    }
    return total;
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `InMemoryExecutionSchedulerStore ready (${this.schedules.size} schedules).`,
    };
  }
}

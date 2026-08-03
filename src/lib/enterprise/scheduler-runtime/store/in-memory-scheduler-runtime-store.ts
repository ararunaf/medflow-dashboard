/**
 * InMemorySchedulerRuntimeStore — store in-process (INF-07).
 *
 * Implementação oficial do Scheduler Runtime Store.
 * Sem banco. Sem Redis. Sem Cron. Sem Timer. Sem Scheduler real.
 */
import type { CanonicalSchedulerStatistics } from "../ports/canonical";
import type {
  SchedulerRuntimeStore,
  StoredCanonicalSchedule,
  StoredCanonicalSchedulerDispatch,
  StoredCanonicalSchedulerJob,
} from "./scheduler-runtime-store";

export const IN_MEMORY_SCHEDULER_RUNTIME_STORE_ID = "in-memory-scheduler-runtime";

export type InMemorySchedulerRuntimeStoreOptions = {
  schedules?: readonly StoredCanonicalSchedule[];
  jobs?: readonly StoredCanonicalSchedulerJob[];
  dispatches?: readonly StoredCanonicalSchedulerDispatch[];
};

/**
 * Store de Schedules/Jobs/Dispatches canônicos in-memory — exclusivo do Adapter (INF-07).
 */
export class InMemorySchedulerRuntimeStore implements SchedulerRuntimeStore {
  readonly storeId = IN_MEMORY_SCHEDULER_RUNTIME_STORE_ID;

  private readonly schedules = new Map<string, StoredCanonicalSchedule>();
  private readonly byName = new Map<string, string>();
  private readonly jobs = new Map<string, StoredCanonicalSchedulerJob>();
  private readonly dispatches = new Map<string, StoredCanonicalSchedulerDispatch>();

  constructor(options: InMemorySchedulerRuntimeStoreOptions = {}) {
    for (const schedule of options.schedules ?? []) {
      this.setSchedule(schedule);
    }
    for (const job of options.jobs ?? []) {
      this.setJob(job);
    }
    for (const dispatch of options.dispatches ?? []) {
      this.setDispatch(dispatch);
    }
  }

  getSchedule(scheduleId: string): StoredCanonicalSchedule | undefined {
    const schedule = this.schedules.get(scheduleId);
    return schedule ? { ...schedule } : undefined;
  }

  getScheduleByName(scheduleName: string): StoredCanonicalSchedule | undefined {
    const scheduleId = this.byName.get(scheduleName);
    if (!scheduleId) return undefined;
    return this.getSchedule(scheduleId);
  }

  setSchedule(schedule: StoredCanonicalSchedule): void {
    this.schedules.set(schedule.scheduleId, { ...schedule });
    this.byName.set(schedule.scheduleName, schedule.scheduleId);
  }

  removeSchedule(scheduleId: string): void {
    const existing = this.schedules.get(scheduleId);
    if (existing) {
      this.byName.delete(existing.scheduleName);
      this.schedules.delete(scheduleId);
    }
  }

  listSchedules(): readonly StoredCanonicalSchedule[] {
    return Array.from(this.schedules.values()).map((schedule) => ({ ...schedule }));
  }

  getJob(jobId: string): StoredCanonicalSchedulerJob | undefined {
    const job = this.jobs.get(jobId);
    return job ? { ...job } : undefined;
  }

  setJob(job: StoredCanonicalSchedulerJob): void {
    this.jobs.set(job.jobId, { ...job });
  }

  listJobs(scheduleId?: string): readonly StoredCanonicalSchedulerJob[] {
    const all = Array.from(this.jobs.values()).map((job) => ({ ...job }));
    if (!scheduleId) return all;
    return all.filter((job) => job.scheduleId === scheduleId);
  }

  getDispatch(dispatchId: string): StoredCanonicalSchedulerDispatch | undefined {
    const dispatch = this.dispatches.get(dispatchId);
    return dispatch ? { ...dispatch } : undefined;
  }

  setDispatch(dispatch: StoredCanonicalSchedulerDispatch): void {
    this.dispatches.set(dispatch.dispatchId, { ...dispatch });
  }

  listDispatches(scheduleId?: string): readonly StoredCanonicalSchedulerDispatch[] {
    const all = Array.from(this.dispatches.values()).map((dispatch) => ({ ...dispatch }));
    if (!scheduleId) return all;
    return all.filter((dispatch) => dispatch.scheduleId === scheduleId);
  }

  scheduleCount(): number {
    return this.schedules.size;
  }

  jobCount(): number {
    return this.jobs.size;
  }

  dispatchCount(): number {
    return this.dispatches.size;
  }

  statistics(): CanonicalSchedulerStatistics {
    const all = this.listSchedules();
    let registered = 0;
    let active = 0;
    let cancelled = 0;
    for (const schedule of all) {
      if (schedule.status === "registered" || schedule.status === "idle") registered += 1;
      if (schedule.active || schedule.status === "scheduled") active += 1;
      if (schedule.status === "cancelled") cancelled += 1;
    }
    return {
      kind: "canonical-scheduler-statistics",
      totalSchedules: all.length,
      registeredSchedules: registered,
      activeSchedules: active,
      cancelledSchedules: cancelled,
      totalJobs: this.jobCount(),
      totalDispatches: this.dispatchCount(),
      realSchedulerCount: 0,
      cronImplementedCount: 0,
      timerImplementedCount: 0,
      retrySchedulingImplementedCount: 0,
      delayJobsImplementedCount: 0,
      jobDispatcherImplementedCount: 0,
      timeWindowsImplementedCount: 0,
      workersOrchestratedCount: 0,
      queueConsumedCount: 0,
      parallelProcessingCount: 0,
      persistenceImplementedCount: 0,
    };
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `Scheduler Runtime store ready (${this.scheduleCount()} schedules, ${this.jobCount()} jobs, ${this.dispatchCount()} dispatches).`,
    };
  }
}

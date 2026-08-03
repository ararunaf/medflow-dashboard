/**
 * SchedulerRuntimeStore — contrato interno do store (INF-07).
 *
 * Camada entre Adapter e persistência in-process.
 * NÃO é banco; NÃO cria timers; NÃO agenda Cron; NÃO despacha Jobs.
 * Acesso exclusivo via Adapter — nunca diretamente pelo produto.
 */
import type {
  CanonicalSchedule,
  CanonicalSchedulerDispatch,
  CanonicalSchedulerJob,
  CanonicalSchedulerStatistics,
} from "../ports/canonical";

export type StoredCanonicalSchedule = CanonicalSchedule;
export type StoredCanonicalSchedulerJob = CanonicalSchedulerJob;
export type StoredCanonicalSchedulerDispatch = CanonicalSchedulerDispatch;

export interface SchedulerRuntimeStore {
  readonly storeId: string;

  getSchedule(scheduleId: string): StoredCanonicalSchedule | undefined;
  getScheduleByName(scheduleName: string): StoredCanonicalSchedule | undefined;
  setSchedule(schedule: StoredCanonicalSchedule): void;
  removeSchedule(scheduleId: string): void;
  listSchedules(): readonly StoredCanonicalSchedule[];

  getJob(jobId: string): StoredCanonicalSchedulerJob | undefined;
  setJob(job: StoredCanonicalSchedulerJob): void;
  listJobs(scheduleId?: string): readonly StoredCanonicalSchedulerJob[];

  getDispatch(dispatchId: string): StoredCanonicalSchedulerDispatch | undefined;
  setDispatch(dispatch: StoredCanonicalSchedulerDispatch): void;
  listDispatches(scheduleId?: string): readonly StoredCanonicalSchedulerDispatch[];

  scheduleCount(): number;
  jobCount(): number;
  dispatchCount(): number;
  statistics(): CanonicalSchedulerStatistics;
  health(): { ok: boolean; message?: string };
}

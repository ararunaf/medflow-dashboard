/**
 * DefaultSchedulerRuntimeAdapter — INF-07 / OPER-INF-S.
 *
 * Adapter oficial do Enterprise Scheduler Runtime.
 * OPER-INF-S: agendamento operacional exclusivo via WorkerRuntimePort
 * (polling temporal, schedule, cancel, heartbeat, graceful shutdown,
 * controle de concorrência, recuperação pós-restart).
 * Sem Cron. Sem acesso a QueueRuntimePort. Sem regras de negócio.
 * Sem acesso direto a banco — persistência de fila permanece no QueueRuntimePort (OPER-INF-Q).
 */
import {
  DEFAULT_MOCK_SCHEDULER_RUNTIME_CAPABILITIES,
  DEFAULT_SCHEDULER_RUNTIME_CAPABILITIES,
  toCanonicalSchedulerCapabilities,
} from "../ports/capabilities";
import {
  createScheduleId,
  createSchedulerDispatchId,
  createSchedulerJobId,
  createSchedulerResultId,
  createSchedulerRuntimeRequestId,
} from "../ports/identity";
import type { SchedulerRuntimePort } from "../ports/scheduler-runtime-port";
import type {
  CanonicalSchedule,
  CanonicalSchedulerDispatch,
  CanonicalSchedulerJob,
  CanonicalSchedulerResult,
} from "../ports/canonical";
import type {
  CancelScheduleInput,
  CancelScheduleResult,
  ListSchedulesInput,
  ListSchedulesResult,
  RegisterScheduleInput,
  RegisterScheduleResult,
  ScheduleJobInput,
  ScheduleJobResult,
  SchedulerRuntimeEnterpriseDeps,
  SchedulerRuntimeHealth,
  SchedulerRuntimeInfo,
  SchedulerRuntimeOperationEnvelope,
  SchedulerRuntimeOperationalControls,
  SchedulerRuntimePortCapabilities,
  SchedulerRuntimeProviderId,
  SchedulerRuntimeProviderMetadata,
  SchedulerRuntimeStructuredLog,
  SchedulerStatsInput,
  SchedulerStatsResult,
  UnregisterScheduleInput,
  UnregisterScheduleResult,
} from "../ports/types";
import {
  DEFAULT_SCHEDULER_MAX_CONCURRENT,
  DEFAULT_SCHEDULER_POLL_INTERVAL_MS,
  SchedulerWorkerDispatcher,
  type SchedulerDispatchedEvent,
} from "../operational";
import { InMemorySchedulerRuntimeStore, type SchedulerRuntimeStore } from "../store";

export const DEFAULT_SCHEDULER_RUNTIME_ADAPTER_ID = "default-enterprise-scheduler";
export const DEFAULT_SCHEDULER_RUNTIME_VERSION = "1.0.0";
export const DEFAULT_SCHEDULER_WORKER_QUEUE_NAME = "enterprise-worker-queue";

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRY_COUNT = 1;
const DEFAULT_RETRY_BACKOFF_MS = 50;

export type DefaultSchedulerRuntimeAdapterOptions = {
  provider?: Extract<SchedulerRuntimeProviderId, "enterprise" | "default">;
  healthy?: boolean;
  message?: string;
  store?: SchedulerRuntimeStore;
  enterpriseDeps?: SchedulerRuntimeEnterpriseDeps;
  /**
   * OPER-INF-S — quando true (default), ativa dispatcher via WorkerRuntimePort.
   * Mock força false.
   */
  operational?: boolean;
  pollIntervalMs?: number;
  maxConcurrent?: number;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  /** Força falha transitória nas N primeiras tentativas (testes de retry estrutural). */
  failAttempts?: number;
};

function readSignal(input: SchedulerRuntimeOperationalControls): AbortSignal | undefined {
  if (input.signal instanceof AbortSignal) return input.signal;
  const attr = input.attributes?.signal;
  return attr instanceof AbortSignal ? attr : undefined;
}

function readPositiveInt(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return Math.floor(parsed);
  }
  return fallback;
}

function readStringAttr(
  input: SchedulerRuntimeOperationalControls & {
    metadata?: { customAttributes?: Readonly<Record<string, string | number | boolean | null>> };
  },
  key: string,
): string | undefined {
  const fromAttributes = input.attributes?.[key];
  if (typeof fromAttributes === "string" && fromAttributes.trim() !== "") {
    return fromAttributes.trim();
  }
  const fromMeta = input.metadata?.customAttributes?.[key];
  if (typeof fromMeta === "string" && fromMeta.trim() !== "") {
    return fromMeta.trim();
  }
  return undefined;
}

function readBoolAttr(input: SchedulerRuntimeOperationalControls, key: string): boolean {
  const value = input.attributes?.[key];
  return value === true || value === "true";
}

async function defaultSleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Adapter oficial INF-07 / OPER-INF-S — Scheduler Runtime default / enterprise.
 */
export class DefaultSchedulerRuntimeAdapter implements SchedulerRuntimePort {
  readonly providerId: Extract<SchedulerRuntimeProviderId, "enterprise" | "default">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly metadata: SchedulerRuntimeProviderMetadata;
  private readonly store: SchedulerRuntimeStore;
  private readonly enterpriseDeps?: SchedulerRuntimeEnterpriseDeps;
  private readonly operational: boolean;
  private readonly defaultPollIntervalMs: number;
  private readonly defaultMaxConcurrent: number;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryBackoffMs: number;
  private readonly now: () => string;
  private readonly sleep: (ms: number) => Promise<void>;
  private failAttemptsRemaining: number;
  private dispatcher: SchedulerWorkerDispatcher | null = null;
  private workersOrchestratedCount = 0;
  private jobDispatcherCount = 0;

  constructor(options: DefaultSchedulerRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "enterprise";
    this.operational = options.operational ?? true;
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      (this.operational
        ? `${this.providerId} Scheduler Runtime ready (OPER-INF-S — WorkerRuntimePort dispatcher active).`
        : `${this.providerId} Scheduler Runtime ready (structural only — no worker orchestration).`);
    this.metadata = {
      name:
        this.providerId === "default"
          ? "Default Scheduler Runtime"
          : "Enterprise Scheduler Runtime",
      version: DEFAULT_SCHEDULER_RUNTIME_VERSION,
      vendor: "medicflow-enterprise",
      description:
        "Official INF-07 Enterprise Scheduler Runtime — OPER-INF-S operational dispatcher via WorkerRuntimePort.",
    };
    this.store = options.store ?? new InMemorySchedulerRuntimeStore();
    this.enterpriseDeps = options.enterpriseDeps;
    this.defaultPollIntervalMs = options.pollIntervalMs ?? DEFAULT_SCHEDULER_POLL_INTERVAL_MS;
    this.defaultMaxConcurrent = options.maxConcurrent ?? DEFAULT_SCHEDULER_MAX_CONCURRENT;
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultRetryCount = options.defaultRetryCount ?? DEFAULT_RETRY_COUNT;
    this.defaultRetryBackoffMs = options.defaultRetryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS;
    this.now = options.now ?? (() => new Date().toISOString());
    this.sleep = options.sleep ?? defaultSleep;
    this.failAttemptsRemaining = options.failAttempts ?? 0;

    if (this.enterpriseDeps) {
      if (typeof this.enterpriseDeps.getQueueRuntimePort !== "function") {
        throw new Error(
          "DefaultSchedulerRuntimeAdapter exige enterpriseDeps.getQueueRuntimePort (INF-07) quando deps são fornecidas.",
        );
      }
      if (typeof this.enterpriseDeps.getWorkerRuntimePort !== "function") {
        throw new Error(
          "DefaultSchedulerRuntimeAdapter exige enterpriseDeps.getWorkerRuntimePort (INF-07) quando deps são fornecidas.",
        );
      }
    }

    if (this.operational && this.enterpriseDeps) {
      this.dispatcher = new SchedulerWorkerDispatcher({
        getWorkerRuntimePort: () => this.enterpriseDeps!.getWorkerRuntimePort(),
        pollIntervalMs: this.defaultPollIntervalMs,
        maxConcurrent: this.defaultMaxConcurrent,
        sleep: this.sleep,
        now: this.now,
        onDispatched: (event) => this.onDispatched(event),
      });
      // Recuperação pós-restart: reativa schedules ativos presentes no store.
      this.recoverActiveSchedules();
    }
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): SchedulerRuntimeStore {
    return this.store;
  }

  /** Dispatcher operacional ativo (OPER-INF-S) — null em modo estrutural. */
  getDispatcher(): SchedulerWorkerDispatcher | null {
    return this.dispatcher;
  }

  capabilities(): SchedulerRuntimePortCapabilities {
    const engine = this.operational
      ? DEFAULT_SCHEDULER_RUNTIME_CAPABILITIES
      : DEFAULT_MOCK_SCHEDULER_RUNTIME_CAPABILITIES;
    return {
      provider: this.providerId,
      adapterId: DEFAULT_SCHEDULER_RUNTIME_ADAPTER_ID,
      engine: { ...engine },
      canonical: toCanonicalSchedulerCapabilities(engine),
      supportsCanonicalSchedule: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesQueueRuntimePort: true,
      usesWorkerRuntimePort: true,
      usesPersistentQueueRuntimePort: true,
      usesObservabilityRuntimePort: true,
      usesScalabilityRuntimePort: true,
      runtimeReady: true,
      realScheduler: this.operational,
      cronImplemented: false,
      timerImplemented: this.operational,
      retrySchedulingImplemented: false,
      delayJobsImplemented: false,
      jobDispatcherImplemented: this.operational,
      timeWindowsImplemented: false,
      workersOrchestrated: this.operational,
      queueConsumed: false,
      parallelProcessing: false,
      persistenceImplemented: false,
      implementsCron: false,
      implementsQuartz: false,
      implementsHangfire: false,
      implementsCelery: false,
      implementsBullMq: false,
      implementsAzureScheduler: false,
      implementsAzureFunctionsTimer: false,
      implementsTaskScheduler: false,
      implementsRealScheduler: this.operational,
      implementsTimer: this.operational,
      implementsClock: false,
      implementsBackgroundService: this.operational,
      implementsRetryReal: false,
      implementsDelayQueue: false,
      implementsThreadPool: false,
      implementsWorkers: false,
      implementsParallelProcessing: false,
      implementsRabbitMq: false,
      implementsKafka: false,
      implementsAzureServiceBus: false,
      implementsRedis: false,
      implementsHttp: false,
      implementsWebsocket: false,
      knowsOperatorOrCooperative: false,
      knowsContract: false,
      knowsTenant: false,
      knowsTissPattern: false,
    };
  }

  providerInfo(): SchedulerRuntimeInfo {
    const caps = this.operational
      ? DEFAULT_SCHEDULER_RUNTIME_CAPABILITIES
      : DEFAULT_MOCK_SCHEDULER_RUNTIME_CAPABILITIES;
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "SCHEDULER_RUNTIME",
      capabilities: { ...caps },
    };
  }

  async health(): Promise<SchedulerRuntimeHealth> {
    const storeHealth = this.store.health();
    let queueRuntimeOk = true;
    let workerRuntimeOk = true;
    let persistentQueueRuntimeOk = true;
    let observabilityRuntimeOk = true;
    let scalabilityRuntimeOk = true;
    if (this.enterpriseDeps) {
      // Queue: valida Port shape sem chamar health() (evita ciclos).
      const queuePort = this.enterpriseDeps.getQueueRuntimePort();
      queueRuntimeOk =
        !!queuePort &&
        typeof queuePort.health === "function" &&
        typeof queuePort.capabilities === "function";
      // Worker: health leve quando operacional; shape check caso contrário.
      if (this.operational) {
        try {
          const workerHealth = await this.enterpriseDeps.getWorkerRuntimePort().health();
          workerRuntimeOk = workerHealth.ok;
        } catch {
          workerRuntimeOk = false;
        }
      } else {
        const workerPort = this.enterpriseDeps.getWorkerRuntimePort();
        workerRuntimeOk =
          !!workerPort &&
          typeof workerPort.health === "function" &&
          typeof workerPort.capabilities === "function";
      }
      if (typeof this.enterpriseDeps.getPersistentQueueRuntimePort === "function") {
        const persistentQueuePort = this.enterpriseDeps.getPersistentQueueRuntimePort();
        persistentQueueRuntimeOk =
          !!persistentQueuePort &&
          typeof persistentQueuePort.health === "function" &&
          typeof persistentQueuePort.capabilities === "function";
      }
      if (typeof this.enterpriseDeps.getObservabilityRuntimePort === "function") {
        const observabilityPort = this.enterpriseDeps.getObservabilityRuntimePort();
        observabilityRuntimeOk =
          !!observabilityPort &&
          typeof observabilityPort.health === "function" &&
          typeof observabilityPort.capabilities === "function";
      }
      if (typeof this.enterpriseDeps.getScalabilityRuntimePort === "function") {
        const scalabilityPort = this.enterpriseDeps.getScalabilityRuntimePort();
        scalabilityRuntimeOk =
          !!scalabilityPort &&
          typeof scalabilityPort.health === "function" &&
          typeof scalabilityPort.capabilities === "function";
      }
    }
    const ok =
      this.healthy &&
      storeHealth.ok &&
      queueRuntimeOk &&
      workerRuntimeOk &&
      persistentQueueRuntimeOk &&
      observabilityRuntimeOk &&
      scalabilityRuntimeOk;
    return {
      kind: "canonical-scheduler-health",
      ok,
      provider: this.providerId,
      latencyMs: 0,
      status: ok ? "ready" : "unhealthy",
      storedScheduleCount: this.store.scheduleCount(),
      storedJobCount: this.store.jobCount(),
      storedDispatchCount: this.store.dispatchCount(),
      queueRuntimeOk,
      workerRuntimeOk,
      persistentQueueRuntimeOk,
      observabilityRuntimeOk,
      scalabilityRuntimeOk,
      runtimeReady: true,
      realScheduler: this.operational,
      cronImplemented: false,
      timerImplemented: this.operational,
      retrySchedulingImplemented: false,
      delayJobsImplemented: false,
      jobDispatcherImplemented: this.operational,
      timeWindowsImplemented: false,
      workersOrchestrated: this.operational,
      queueConsumed: false,
      parallelProcessing: false,
      persistenceImplemented: false,
      message: this.healthy
        ? (storeHealth.message ?? this.message)
        : "Scheduler Runtime unhealthy.",
    };
  }

  async register(input: RegisterScheduleInput): Promise<RegisterScheduleResult> {
    return this.runOperation("register", input, async () => {
      const stamp = this.now();
      const scheduleName = input.scheduleName ?? "canonical-foundation-schedule";
      const existing = input.scheduleId
        ? this.store.getSchedule(input.scheduleId)
        : this.store.getScheduleByName(scheduleName);
      if (existing) {
        return {
          ok: false,
          code: "SCHEDULER_RUNTIME_ALREADY_REGISTERED",
          message: "Canonical schedule already registered.",
          schedule: existing,
        };
      }
      const scheduleId = input.scheduleId ?? createScheduleId();
      const schedule: CanonicalSchedule = {
        kind: "canonical-schedule",
        scheduleId,
        scheduleName,
        identity: {
          kind: "canonical-scheduler-identity",
          scheduleId,
          scheduleName,
          correlationId: input.correlationId,
        },
        metadata: input.metadata,
        status: "registered",
        active: false,
        createdAt: stamp,
        updatedAt: stamp,
        ...this.operationalFlags(),
      };
      this.store.setSchedule(schedule);
      const result = this.buildResult({
        operation: "register",
        status: "registered",
        schedule,
        stamp,
        code: this.operational ? "SCHEDULER_RUNTIME_OK" : "SCHEDULER_RUNTIME_STRUCTURAL_OK",
        messageText: this.operational
          ? "Canonical Scheduler Runtime operational register (OPER-INF-S)."
          : "Canonical Scheduler Runtime structural register (INF-07 foundation — no real scheduler).",
      });
      return {
        ok: true,
        result,
        schedule,
        code: "SCHEDULER_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async unregister(input: UnregisterScheduleInput): Promise<UnregisterScheduleResult> {
    return this.runOperation("unregister", input, async () => {
      const existing = this.store.getSchedule(input.scheduleId);
      if (!existing) {
        return {
          ok: false,
          code: "SCHEDULER_RUNTIME_SCHEDULE_NOT_FOUND",
          message: "Canonical schedule not found.",
        };
      }
      await this.dispatcher?.stop(input.scheduleId);
      const stamp = this.now();
      const schedule: CanonicalSchedule = {
        ...existing,
        status: "unregistered",
        active: false,
        updatedAt: stamp,
      };
      this.store.removeSchedule(input.scheduleId);
      const result = this.buildResult({
        operation: "unregister",
        status: "unregistered",
        schedule,
        stamp,
        code: this.operational ? "SCHEDULER_RUNTIME_OK" : "SCHEDULER_RUNTIME_STRUCTURAL_OK",
        messageText: this.operational
          ? "Canonical Scheduler Runtime operational unregister (OPER-INF-S — graceful shutdown)."
          : "Canonical Scheduler Runtime structural unregister (INF-07 foundation — no real teardown).",
      });
      return {
        ok: true,
        result,
        schedule,
        code: "SCHEDULER_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async schedule(input: ScheduleJobInput): Promise<ScheduleJobResult> {
    return this.runOperation("schedule", input, async () => {
      const stamp = this.now();
      let schedule = this.resolveSchedule(input.scheduleId, input.scheduleName);
      if (!schedule) {
        const scheduleName = input.scheduleName ?? "canonical-foundation-schedule";
        const scheduleId = input.scheduleId ?? createScheduleId();
        schedule = {
          kind: "canonical-schedule",
          scheduleId,
          scheduleName,
          identity: {
            kind: "canonical-scheduler-identity",
            scheduleId,
            scheduleName,
          },
          metadata: input.metadata,
          status: "registered",
          active: false,
          createdAt: stamp,
          updatedAt: stamp,
          ...this.operationalFlags(),
        };
        this.store.setSchedule(schedule);
      }
      const jobId = input.jobId ?? createSchedulerJobId();
      const job: CanonicalSchedulerJob = {
        kind: "canonical-scheduler-job",
        jobId,
        scheduleId: schedule.scheduleId,
        identity: {
          kind: "canonical-scheduler-identity",
          scheduleId: schedule.scheduleId,
          scheduleName: schedule.scheduleName,
          jobId,
        },
        metadata: input.metadata,
        status: "scheduled",
        registeredAt: stamp,
        updatedAt: stamp,
        realScheduler: this.operational,
        cronImplemented: false,
        timerImplemented: this.operational,
        workersOrchestrated: this.operational,
        persistenceImplemented: false,
      };
      this.store.setJob(job);
      const dispatch: CanonicalSchedulerDispatch = {
        kind: "canonical-scheduler-dispatch",
        dispatchId: createSchedulerDispatchId(),
        scheduleId: schedule.scheduleId,
        jobId,
        identity: {
          kind: "canonical-scheduler-identity",
          scheduleId: schedule.scheduleId,
          jobId,
        },
        metadata: input.metadata,
        status: "scheduled",
        createdAt: stamp,
        updatedAt: stamp,
        realScheduler: this.operational,
        cronImplemented: false,
        jobDispatcherImplemented: this.operational,
        workersOrchestrated: this.operational,
        persistenceImplemented: false,
      };
      this.store.setDispatch(dispatch);
      const updated: CanonicalSchedule = {
        ...schedule,
        status: "scheduled",
        active: true,
        updatedAt: stamp,
        ...this.operationalFlags(),
      };
      this.store.setSchedule(updated);

      if (this.dispatcher) {
        const pollIntervalMs = readPositiveInt(
          input.attributes?.pollIntervalMs,
          this.defaultPollIntervalMs,
        );
        const delayMs = readPositiveInt(input.attributes?.delayMs, 0);
        const runAt = readStringAttr(input, "runAt");
        const workerName = readStringAttr(input, "workerName");
        const workerId = readStringAttr(input, "workerId");
        const queueName = readStringAttr(input, "queueName") ?? DEFAULT_SCHEDULER_WORKER_QUEUE_NAME;
        this.dispatcher.start({
          scheduleId: updated.scheduleId,
          jobId,
          pollIntervalMs,
          delayMs,
          runAt,
          workerName,
          workerId,
          queueName,
          repeat: readBoolAttr(input, "repeat"),
        });
      }

      const result = this.buildResult({
        operation: "schedule",
        status: "scheduled",
        schedule: updated,
        job,
        dispatch,
        stamp,
        code: this.operational ? "SCHEDULER_RUNTIME_OK" : "SCHEDULER_RUNTIME_STRUCTURAL_OK",
        messageText: this.operational
          ? "Canonical Scheduler Runtime operational schedule (OPER-INF-S — temporal poll started)."
          : "Canonical Scheduler Runtime structural schedule (INF-07 foundation — no cron / no timer).",
      });
      return {
        ok: true,
        result,
        schedule: updated,
        job,
        dispatch,
        code: "SCHEDULER_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async cancel(input: CancelScheduleInput): Promise<CancelScheduleResult> {
    return this.runOperation("cancel", input, async () => {
      const existing = this.store.getSchedule(input.scheduleId);
      if (!existing) {
        return {
          ok: false,
          code: "SCHEDULER_RUNTIME_SCHEDULE_NOT_FOUND",
          message: "Canonical schedule not found.",
        };
      }
      await this.dispatcher?.stop(input.scheduleId);
      const stamp = this.now();
      const schedule: CanonicalSchedule = {
        ...existing,
        status: "cancelled",
        active: false,
        updatedAt: stamp,
      };
      this.store.setSchedule(schedule);
      let job: CanonicalSchedulerJob | undefined;
      if (input.jobId) {
        const existingJob = this.store.getJob(input.jobId);
        if (existingJob) {
          job = { ...existingJob, status: "cancelled", updatedAt: stamp };
          this.store.setJob(job);
        }
      }
      const result = this.buildResult({
        operation: "cancel",
        status: "cancelled",
        schedule,
        job,
        stamp,
        code: this.operational ? "SCHEDULER_RUNTIME_OK" : "SCHEDULER_RUNTIME_STRUCTURAL_OK",
        messageText: this.operational
          ? "Canonical Scheduler Runtime operational cancel (OPER-INF-S — graceful shutdown)."
          : "Canonical Scheduler Runtime structural cancel (INF-07 foundation — no real cancel).",
      });
      return {
        ok: true,
        result,
        schedule,
        job,
        code: "SCHEDULER_RUNTIME_OK",
        message: result.messageText,
      };
    });
  }

  async list(input: ListSchedulesInput = {}): Promise<ListSchedulesResult> {
    return this.runOperation("list", input, async () => {
      let schedules = this.store.listSchedules();
      if (input.scheduleId) {
        schedules = schedules.filter((s) => s.scheduleId === input.scheduleId);
      }
      if (input.activeOnly) {
        schedules = schedules.filter((s) => s.active);
      }
      const jobs = input.scheduleId ? this.store.listJobs(input.scheduleId) : this.store.listJobs();
      const stamp = this.now();
      const result = this.buildResult({
        operation: "list",
        status: "listed",
        stamp,
        code: this.operational ? "SCHEDULER_RUNTIME_OK" : "SCHEDULER_RUNTIME_STRUCTURAL_OK",
        messageText: this.operational
          ? "Canonical Scheduler Runtime operational list (OPER-INF-S)."
          : "Canonical Scheduler Runtime structural list.",
      });
      return {
        ok: true,
        schedules,
        jobs,
        result,
        code: "SCHEDULER_RUNTIME_OK",
        message: `Scheduler Runtime list: ${schedules.length} schedules, ${jobs.length} jobs.`,
      };
    });
  }

  async stats(input: SchedulerStatsInput = {}): Promise<SchedulerStatsResult> {
    return this.runOperation("stats", input, async () => {
      const base = this.store.statistics();
      const statistics = this.operational
        ? {
            ...base,
            realSchedulerCount: base.activeSchedules > 0 || base.totalSchedules > 0 ? 1 : 0,
            timerImplementedCount: base.activeSchedules > 0 || base.totalSchedules > 0 ? 1 : 0,
            jobDispatcherImplementedCount: this.jobDispatcherCount,
            workersOrchestratedCount: this.workersOrchestratedCount,
          }
        : base;
      const stamp = this.now();
      const result = this.buildResult({
        operation: "stats",
        status: "pending",
        stamp,
        code: this.operational ? "SCHEDULER_RUNTIME_OK" : "SCHEDULER_RUNTIME_STRUCTURAL_OK",
        messageText: this.operational
          ? "Canonical Scheduler Runtime operational statistics (OPER-INF-S)."
          : "Canonical Scheduler Runtime structural statistics.",
      });
      return {
        ok: true,
        statistics,
        result,
        code: "SCHEDULER_RUNTIME_OK",
        message: `Scheduler Runtime stats: ${statistics.totalSchedules} schedules, ${statistics.totalJobs} jobs.`,
      };
    });
  }

  private recoverActiveSchedules(): void {
    if (!this.dispatcher) return;
    const active = this.store.listSchedules().filter((s) => s.active && s.status === "scheduled");
    if (active.length === 0) return;
    this.dispatcher.recover(
      active.map((schedule) => {
        const jobs = this.store.listJobs(schedule.scheduleId);
        const latestJob = jobs[jobs.length - 1];
        return {
          scheduleId: schedule.scheduleId,
          jobId: latestJob?.jobId,
          pollIntervalMs: this.defaultPollIntervalMs,
          delayMs: 0,
          workerName: `scheduler-recover-${schedule.scheduleId}`,
          queueName: DEFAULT_SCHEDULER_WORKER_QUEUE_NAME,
          repeat: false,
        };
      }),
    );
  }

  private operationalFlags(): Pick<
    CanonicalSchedule,
    | "realScheduler"
    | "cronImplemented"
    | "timerImplemented"
    | "retrySchedulingImplemented"
    | "delayJobsImplemented"
    | "jobDispatcherImplemented"
    | "timeWindowsImplemented"
    | "workersOrchestrated"
    | "queueConsumed"
    | "parallelProcessing"
    | "persistenceImplemented"
  > {
    return {
      realScheduler: this.operational,
      cronImplemented: false,
      timerImplemented: this.operational,
      retrySchedulingImplemented: false,
      delayJobsImplemented: false,
      jobDispatcherImplemented: this.operational,
      timeWindowsImplemented: false,
      workersOrchestrated: this.operational,
      queueConsumed: false,
      parallelProcessing: false,
      persistenceImplemented: false,
    };
  }

  private onDispatched(event: SchedulerDispatchedEvent): void {
    if (event.outcome === "triggered") {
      this.jobDispatcherCount += 1;
      this.workersOrchestratedCount += 1;
    }
  }

  private resolveSchedule(
    scheduleId: string | undefined,
    scheduleName: string | undefined,
  ): CanonicalSchedule | undefined {
    if (scheduleId) {
      const byId = this.store.getSchedule(scheduleId);
      if (byId) return byId;
    }
    if (scheduleName) return this.store.getScheduleByName(scheduleName);
    const all = this.store.listSchedules();
    return all[0];
  }

  private buildResult(args: {
    operation: CanonicalSchedulerResult["operation"];
    status: CanonicalSchedulerResult["status"];
    stamp: string;
    code: string;
    messageText: string;
    schedule?: CanonicalSchedule;
    job?: CanonicalSchedulerJob;
    dispatch?: CanonicalSchedulerDispatch;
  }): CanonicalSchedulerResult {
    return {
      kind: "canonical-scheduler-result",
      ok: true,
      resultId: createSchedulerResultId(),
      operation: args.operation,
      schedule: args.schedule,
      job: args.job,
      dispatch: args.dispatch,
      provider: {
        kind: "canonical-scheduler-provider",
        providerId: this.providerId,
        adapterId: DEFAULT_SCHEDULER_RUNTIME_ADAPTER_ID,
        vendor: this.metadata.vendor,
        version: this.metadata.version,
        label: this.metadata.name,
      },
      ...this.operationalFlags(),
      runtimeReady: true,
      status: args.status,
      messageText: args.messageText,
      code: args.code,
      createdAt: args.stamp,
      updatedAt: args.stamp,
    };
  }

  private async runOperation<T extends Record<string, unknown>>(
    operation: string,
    input: SchedulerRuntimeOperationalControls,
    fn: () => Promise<T & { ok: boolean; code?: string; message?: string }>,
  ): Promise<T & SchedulerRuntimeOperationEnvelope> {
    const requestId = input.requestId ?? createSchedulerRuntimeRequestId();
    const signal = readSignal(input);
    const timeoutMs = readPositiveInt(input.timeoutMs, this.defaultTimeoutMs);
    const retryCount = readPositiveInt(input.retryCount, this.defaultRetryCount);
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const logs: SchedulerRuntimeStructuredLog[] = [];
    let attempts = 0;
    let lastError: unknown;

    try {
      for (let attempt = 0; attempt <= retryCount; attempt += 1) {
        attempts = attempt + 1;
        if (signal?.aborted) {
          const end = typeof performance !== "undefined" ? performance.now() : Date.now();
          return {
            ok: false,
            requestId,
            provider: this.providerId,
            code: "SCHEDULER_RUNTIME_CANCELLED",
            message: "Operation cancelled via AbortSignal.",
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: true,
              operation,
            },
            logs,
          } as unknown as T & SchedulerRuntimeOperationEnvelope;
        }

        try {
          if (this.failAttemptsRemaining > 0) {
            this.failAttemptsRemaining -= 1;
            throw new Error("Forced transient failure (test).");
          }

          const body = await this.withTimeout(fn(), timeoutMs, signal);
          const end = typeof performance !== "undefined" ? performance.now() : Date.now();
          logs.push({
            level: "info",
            code: body.code ?? "SCHEDULER_RUNTIME_OK",
            message: body.message ?? `${operation} completed`,
            requestId,
            providerId: this.providerId,
            attempt: attempts,
            operation,
          });
          return {
            ...body,
            requestId,
            provider: this.providerId,
            telemetry: {
              latencyMs: Math.max(0, Math.round(end - started)),
              attempts,
              cancelled: false,
              operation,
            },
            logs,
          };
        } catch (err) {
          lastError = err;
          logs.push({
            level: "warn",
            code: "SCHEDULER_RUNTIME_RETRY",
            message: err instanceof Error ? err.message : String(err),
            requestId,
            providerId: this.providerId,
            attempt: attempts,
            operation,
          });
          if (attempt < retryCount) {
            await this.sleep(this.defaultRetryBackoffMs * (attempt + 1));
          }
        }
      }

      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const message =
        lastError instanceof Error ? lastError.message : String(lastError ?? "unknown error");
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: "SCHEDULER_RUNTIME_FAILED",
        message,
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled: false,
          operation,
        },
        logs,
      } as unknown as T & SchedulerRuntimeOperationEnvelope;
    } catch (err) {
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      const isTimeout =
        err instanceof Error && (err.name === "TimeoutError" || /timeout/i.test(err.message));
      const cancelled = signal?.aborted === true;
      return {
        ok: false,
        requestId,
        provider: this.providerId,
        code: cancelled
          ? "SCHEDULER_RUNTIME_CANCELLED"
          : isTimeout
            ? "SCHEDULER_RUNTIME_TIMEOUT"
            : "SCHEDULER_RUNTIME_FAILED",
        message: err instanceof Error ? err.message : String(err),
        telemetry: {
          latencyMs: Math.max(0, Math.round(end - started)),
          attempts,
          cancelled,
          operation,
        },
        logs,
      } as unknown as T & SchedulerRuntimeOperationEnvelope;
    }
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    signal?: AbortSignal,
  ): Promise<T> {
    if (timeoutMs <= 0 && !signal) return promise;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let onAbort: (() => void) | undefined;

    try {
      return await Promise.race([
        promise,
        new Promise<T>((_resolve, reject) => {
          if (timeoutMs > 0) {
            timer = setTimeout(() => {
              const err = new Error(`Scheduler Runtime operation timed out after ${timeoutMs}ms`);
              err.name = "TimeoutError";
              reject(err);
            }, timeoutMs);
          }
          if (signal) {
            onAbort = () => {
              const err = new Error("Scheduler Runtime operation aborted");
              err.name = "AbortError";
              reject(err);
            };
            if (signal.aborted) onAbort();
            else signal.addEventListener("abort", onAbort, { once: true });
          }
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
      if (signal && onAbort) signal.removeEventListener("abort", onAbort);
    }
  }
}

/** Alias oficial do adapter enterprise (INF-07 / OPER-INF-S). */
export const EnterpriseSchedulerRuntimeAdapter = DefaultSchedulerRuntimeAdapter;

/**
 * MockExecutionSchedulerAdapter — INF-03 Scheduler Foundation.
 *
 * Voltado para testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência externa.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem execução. Sem cron. Sem timers. Sem persistência real.
 * Sem node-cron / BullMQ Scheduler / Quartz / Hangfire / Azure Scheduler /
 * Cloudflare Cron / Kubernetes CronJobs.
 *
 * Integração com Workers: exclusivamente via ExecutionWorkerPort (INF-02).
 */
import type { ExecutionWorkerPort } from "../../worker-foundation/ports/execution-worker-port";
import { createExecutionWorkerPort } from "../../worker-foundation/providers/execution-worker-provider";
import { createExecutionSchedulerId } from "../ports/identity";
import type { ExecutionSchedulerPort } from "../ports/execution-scheduler-port";
import type {
  DisableScheduleInput,
  DisableScheduleResult,
  EnableScheduleInput,
  EnableScheduleResult,
  ExecutionSchedulerPortCapabilities,
  ExecutionSchedulerPortHealth,
  GetScheduleInput,
  GetScheduleResult,
  ListSchedulesInput,
  ListSchedulesResult,
  PauseScheduleInput,
  PauseScheduleResult,
  RegisterScheduleInput,
  RegisterScheduleResult,
  ResumeScheduleInput,
  ResumeScheduleResult,
  ScheduleStatisticsResult,
  SchedulerFoundationProviderId,
  StructuralScheduleLifecycleStatus,
  UnregisterScheduleInput,
  UnregisterScheduleResult,
} from "../ports/types";
import { InMemoryExecutionSchedulerStore, type ExecutionSchedulerStore } from "../store";
import {
  STRUCTURAL_SCHEDULER_NEGATION_FLAGS,
  buildStatistics,
  buildStructuralHealth,
  ensureSchedule,
  foundationCapabilitiesBase,
  updateScheduleStatus,
} from "./scheduler-helpers";

export const MOCK_EXECUTION_SCHEDULER_ADAPTER_ID = "mock-in-memory";
export const MOCK_EXECUTION_SCHEDULER_VERSION = "1.0.0";

export type MockExecutionSchedulerAdapterOptions = {
  provider?: Extract<SchedulerFoundationProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: ExecutionSchedulerStore;
  executionWorker?: ExecutionWorkerPort;
  createExecutionSchedulerId?: () => string;
  now?: () => string;
};

export class MockExecutionSchedulerAdapter implements ExecutionSchedulerPort {
  readonly providerId: Extract<SchedulerFoundationProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: ExecutionSchedulerStore;
  private readonly executionWorkerPort: ExecutionWorkerPort;
  private readonly createSchedulerIdFn: () => string;
  private readonly now?: () => string;

  constructor(options: MockExecutionSchedulerAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} scheduler-foundation ready.`;
    this.store = options.store ?? new InMemoryExecutionSchedulerStore();
    this.executionWorkerPort =
      options.executionWorker ?? createExecutionWorkerPort({ provider: "mock" });
    this.createSchedulerIdFn = options.createExecutionSchedulerId ?? createExecutionSchedulerId;
    this.now = options.now;
  }

  getStore(): ExecutionSchedulerStore {
    return this.store;
  }

  /** Acesso estrutural ao ExecutionWorkerPort (INF-02) — sem start/execução. */
  getExecutionWorkerPort(): ExecutionWorkerPort {
    return this.executionWorkerPort;
  }

  capabilities(): ExecutionSchedulerPortCapabilities {
    return {
      provider: this.providerId,
      ...foundationCapabilitiesBase(`${this.providerId}-in-memory`),
    };
  }

  async health(): Promise<ExecutionSchedulerPortHealth> {
    const stamp = this.stamp();
    return {
      ok: this.healthy,
      provider: this.providerId,
      message: this.message,
      storedScheduleCount: this.store.scheduleCount(),
      storedReferenceCount: this.store.referenceCount(),
      structuralHealth: buildStructuralHealth(this.store, stamp, this.message),
    };
  }

  async statistics(): Promise<ScheduleStatisticsResult> {
    if (!this.healthy) {
      return {
        ok: false,
        code: "unhealthy",
        message: this.message,
      };
    }
    return {
      ok: true,
      statistics: buildStatistics(this.store, this.stamp()),
      code: "computed",
      message: "structural statistics computed — in-memory only",
    };
  }

  private stamp(): string {
    return this.now?.() ?? new Date().toISOString();
  }

  private async resolveWorkerId(input: GetScheduleInput): Promise<string | undefined> {
    if (input.executionWorkerId) return input.executionWorkerId;
    if (!input.executionId) return undefined;

    const resolved = await this.executionWorkerPort.getWorker({
      executionId: input.executionId,
      createIfMissing: false,
    });
    return resolved.worker?.executionWorkerId;
  }

  async getSchedule(input: GetScheduleInput = {}): Promise<GetScheduleResult> {
    if (!this.healthy) {
      return {
        ok: false,
        code: "unhealthy",
        message: this.message,
        ...STRUCTURAL_SCHEDULER_NEGATION_FLAGS,
      };
    }

    const stamp = this.stamp();
    const createIfMissing = input.createIfMissing ?? true;

    if (input.executionSchedulerId) {
      const existing = this.store.getSchedule(input.executionSchedulerId);
      if (existing) {
        return {
          ok: true,
          schedule: existing.schedule,
          code: "found",
          message: "schedule retrieved structurally",
          ...STRUCTURAL_SCHEDULER_NEGATION_FLAGS,
        };
      }
      if (!createIfMissing) {
        return {
          ok: false,
          code: "not_found",
          message: "schedule not found",
          ...STRUCTURAL_SCHEDULER_NEGATION_FLAGS,
        };
      }
    }

    if (input.executionId) {
      const byExec = this.store.getScheduleByExecution(input.executionId);
      if (byExec) {
        return {
          ok: true,
          schedule: byExec.schedule,
          code: "found",
          message: "schedule retrieved structurally by execution",
          ...STRUCTURAL_SCHEDULER_NEGATION_FLAGS,
        };
      }
    }

    if (!createIfMissing) {
      return {
        ok: false,
        code: "not_found",
        message: "schedule not found and createIfMissing=false",
        ...STRUCTURAL_SCHEDULER_NEGATION_FLAGS,
      };
    }

    const executionWorkerId = await this.resolveWorkerId(input);
    const schedule = ensureSchedule(this.store, { ...input, executionWorkerId }, stamp, {
      createSchedulerId: this.createSchedulerIdFn,
    });
    return {
      ok: true,
      schedule,
      code: "created",
      message:
        "schedule created structurally — no execution, no cron, no timers, no jobs, no engines invoked",
      ...STRUCTURAL_SCHEDULER_NEGATION_FLAGS,
    };
  }

  async registerSchedule(input: RegisterScheduleInput = {}): Promise<RegisterScheduleResult> {
    const result = await this.getSchedule({ ...input, createIfMissing: true });
    if (!result.ok || !result.schedule) return result;
    return {
      ...result,
      code: result.code === "found" ? "already_registered" : "registered-structural",
      message:
        "schedule registered structurally — NOT enabled, NO cron, NO timers, NO jobs dispatched",
    };
  }

  async unregisterSchedule(input: UnregisterScheduleInput): Promise<UnregisterScheduleResult> {
    if (!this.healthy) {
      return {
        ok: false,
        code: "unhealthy",
        message: this.message,
        ...STRUCTURAL_SCHEDULER_NEGATION_FLAGS,
      };
    }
    if (!input.executionSchedulerId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionSchedulerId required",
        ...STRUCTURAL_SCHEDULER_NEGATION_FLAGS,
      };
    }

    const stamp = this.stamp();
    const existing = this.store.getSchedule(input.executionSchedulerId);
    if (!existing) {
      return {
        ok: false,
        code: "not_found",
        message: "schedule not found",
        ...STRUCTURAL_SCHEDULER_NEGATION_FLAGS,
      };
    }

    const schedule = updateScheduleStatus(
      this.store,
      input.executionSchedulerId,
      "unregistered-structural",
      stamp,
      "Schedule unregistered structurally — no teardown, no cron stopped, no timers cleared",
    );
    this.store.removeSchedule(input.executionSchedulerId);

    return {
      ok: true,
      schedule,
      code: "unregistered-structural",
      message: "schedule unregistered structurally — NO execution teardown performed",
      ...STRUCTURAL_SCHEDULER_NEGATION_FLAGS,
    };
  }

  async enableSchedule(input: EnableScheduleInput): Promise<EnableScheduleResult> {
    return this.transitionLifecycle(input.executionSchedulerId, "enabled-structural");
  }

  async disableSchedule(input: DisableScheduleInput): Promise<DisableScheduleResult> {
    return this.transitionLifecycle(input.executionSchedulerId, "disabled-structural");
  }

  async pauseSchedule(input: PauseScheduleInput): Promise<PauseScheduleResult> {
    return this.transitionLifecycle(input.executionSchedulerId, "paused-structural");
  }

  async resumeSchedule(input: ResumeScheduleInput): Promise<ResumeScheduleResult> {
    return this.transitionLifecycle(input.executionSchedulerId, "resumed-structural");
  }

  async listSchedules(input: ListSchedulesInput = {}): Promise<ListSchedulesResult> {
    if (!this.healthy) {
      return {
        ok: false,
        schedules: [],
        code: "unhealthy",
        message: this.message,
        ...STRUCTURAL_SCHEDULER_NEGATION_FLAGS,
      };
    }

    let schedules = this.store.listSchedules().map((s) => s.schedule);
    if (input.executionId) {
      schedules = schedules.filter((s) => s.executionId === input.executionId);
    }
    if (typeof input.limit === "number" && input.limit >= 0) {
      schedules = schedules.slice(0, input.limit);
    }
    return {
      ok: true,
      schedules,
      code: "listed",
      message: "schedules listed structurally — no cron, no timers, no execution",
      ...STRUCTURAL_SCHEDULER_NEGATION_FLAGS,
    };
  }

  private async transitionLifecycle(
    executionSchedulerId: string,
    status: StructuralScheduleLifecycleStatus,
  ): Promise<EnableScheduleResult> {
    if (!this.healthy) {
      return {
        ok: false,
        code: "unhealthy",
        message: this.message,
        ...STRUCTURAL_SCHEDULER_NEGATION_FLAGS,
      };
    }
    if (!executionSchedulerId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionSchedulerId required",
        ...STRUCTURAL_SCHEDULER_NEGATION_FLAGS,
      };
    }

    const stamp = this.stamp();
    const existing = this.store.getSchedule(executionSchedulerId);
    if (!existing) {
      return {
        ok: false,
        code: "not_found",
        message: "schedule not found",
        ...STRUCTURAL_SCHEDULER_NEGATION_FLAGS,
      };
    }

    const schedule = updateScheduleStatus(
      this.store,
      executionSchedulerId,
      status,
      stamp,
      `Schedule transitioned structurally to ${status} — NO execution, NO cron, NO timers, NO jobs`,
    );

    return {
      ok: true,
      schedule,
      code: status,
      message: `schedule transitioned structurally to ${status} — NO execution, NO cron, NO timers, NO job dispatch`,
      ...STRUCTURAL_SCHEDULER_NEGATION_FLAGS,
    };
  }
}

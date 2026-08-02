/**
 * DefaultExecutionSchedulerAdapter — adapter default in-memory (INF-03).
 *
 * Implementação totalmente in-memory.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem execução. Sem cron. Sem timers. Sem persistência real.
 * Sem node-cron / BullMQ Scheduler / Quartz / Hangfire / Azure Scheduler /
 * Cloudflare Cron / Kubernetes CronJobs.
 *
 * Representa estruturalmente a infraestrutura de Schedulers.
 * Nenhum Schedule é executado. Nenhum job é disparado. Nenhuma Engine é invocada.
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

export const DEFAULT_EXECUTION_SCHEDULER_ADAPTER_ID = "default-in-process";
export const DEFAULT_EXECUTION_SCHEDULER_VERSION = "1.0.0";

/**
 * Runtime injetável — permite testes sem acoplar a Engines ou produto.
 */
export type DefaultExecutionSchedulerRuntime = {
  store?: ExecutionSchedulerStore;
  /** Port exclusivo do Worker Foundation (INF-02) — sem acesso a adapters/stores. */
  executionWorker?: ExecutionWorkerPort;
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createExecutionSchedulerId?: () => string;
  now?: () => string;
};

function defaultRuntime(): DefaultExecutionSchedulerRuntime {
  return {
    store: new InMemoryExecutionSchedulerStore(),
    executionWorker: createExecutionWorkerPort(),
  };
}

function nowIso(runtime: DefaultExecutionSchedulerRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

export class DefaultExecutionSchedulerAdapter implements ExecutionSchedulerPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultExecutionSchedulerRuntime;
  private readonly store: ExecutionSchedulerStore;
  private readonly executionWorkerPort: ExecutionWorkerPort;

  constructor(runtime: DefaultExecutionSchedulerRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new InMemoryExecutionSchedulerStore();
    this.executionWorkerPort = runtime.executionWorker ?? createExecutionWorkerPort();
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
      provider: "default",
      ...foundationCapabilitiesBase(DEFAULT_EXECUTION_SCHEDULER_ADAPTER_ID),
    };
  }

  async health(): Promise<ExecutionSchedulerPortHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    const stamp = nowIso(this.runtime);

    if (this.runtime.ping) {
      const probe = await this.runtime.ping();
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: probe.ok,
        provider: "default",
        latencyMs: Math.max(0, Math.round(end - start)),
        message:
          probe.message ??
          (probe.ok
            ? "Default scheduler-foundation probe ok."
            : "Default scheduler-foundation probe falhou."),
        storedScheduleCount: this.store.scheduleCount(),
        storedReferenceCount: this.store.referenceCount(),
        structuralHealth: buildStructuralHealth(this.store, stamp, probe.message),
      };
    }

    const storeHealth = this.store.health();
    const workerHealth = await this.executionWorkerPort.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: storeHealth.ok && workerHealth.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      message:
        storeHealth.message ??
        "InMemoryExecutionSchedulerStore pronto (sem I/O externo — INF-03; worker via ExecutionWorkerPort only).",
      storedScheduleCount: this.store.scheduleCount(),
      storedReferenceCount: this.store.referenceCount(),
      structuralHealth: buildStructuralHealth(this.store, stamp, storeHealth.message),
    };
  }

  async statistics(): Promise<ScheduleStatisticsResult> {
    const stamp = nowIso(this.runtime);
    return {
      ok: true,
      statistics: buildStatistics(this.store, stamp),
      code: "computed",
      message: "structural statistics computed — in-memory only",
    };
  }

  private factories() {
    return {
      createSchedulerId: this.runtime.createExecutionSchedulerId ?? createExecutionSchedulerId,
    };
  }

  /**
   * Resolve estruturalmente executionWorkerId via ExecutionWorkerPort.getWorker.
   * NÃO inicia Workers. NÃO dispara jobs. NÃO processa.
   */
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
    const stamp = nowIso(this.runtime);
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
    const schedule = ensureSchedule(
      this.store,
      { ...input, executionWorkerId },
      stamp,
      this.factories(),
    );
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
    if (!input.executionSchedulerId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionSchedulerId required",
        ...STRUCTURAL_SCHEDULER_NEGATION_FLAGS,
      };
    }

    const stamp = nowIso(this.runtime);
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
    if (!executionSchedulerId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionSchedulerId required",
        ...STRUCTURAL_SCHEDULER_NEGATION_FLAGS,
      };
    }

    const stamp = nowIso(this.runtime);
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

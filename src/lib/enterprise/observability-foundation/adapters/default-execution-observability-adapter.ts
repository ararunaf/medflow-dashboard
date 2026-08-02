/**
 * DefaultExecutionObservabilityAdapter — adapter default in-memory (INF-04).
 *
 * Implementação totalmente in-memory.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem logs reais. Sem métricas. Sem tracing. Sem persistência real.
 * Sem OpenTelemetry / Prometheus / Grafana / Azure Monitor / CloudWatch /
 * Datadog / Elastic APM. Sem transmissão de eventos.
 *
 * Representa estruturalmente a infraestrutura de Observabilidade.
 * Nenhum log é persistido. Nenhuma métrica é coletada. Nenhum evento é transmitido.
 *
 * Integração com Schedulers: exclusivamente via ExecutionSchedulerPort (INF-03).
 */
import type { ExecutionSchedulerPort } from "../../scheduler-foundation/ports/execution-scheduler-port";
import { createExecutionSchedulerPort } from "../../scheduler-foundation/providers/execution-scheduler-provider";
import { createExecutionObservabilityId } from "../ports/identity";
import type { ExecutionObservabilityPort } from "../ports/execution-observability-port";
import type {
  ExecutionObservabilityPortCapabilities,
  ExecutionObservabilityPortHealth,
  GetObservationInput,
  GetObservationResult,
  ListObservationsInput,
  ListObservationsResult,
  ObservationStatisticsResult,
  RegisterObservationInput,
  RegisterObservationResult,
  UnregisterObservationInput,
  UnregisterObservationResult,
} from "../ports/types";
import { InMemoryExecutionObservabilityStore, type ExecutionObservabilityStore } from "../store";
import {
  STRUCTURAL_OBSERVABILITY_NEGATION_FLAGS,
  buildStatistics,
  buildStructuralHealth,
  ensureObservation,
  foundationCapabilitiesBase,
  updateObservationMetadata,
} from "./observability-helpers";

export const DEFAULT_EXECUTION_OBSERVABILITY_ADAPTER_ID = "default-in-process";
export const DEFAULT_EXECUTION_OBSERVABILITY_VERSION = "1.0.0";

/**
 * Runtime injetável — permite testes sem acoplar a Engines ou produto.
 */
export type DefaultExecutionObservabilityRuntime = {
  store?: ExecutionObservabilityStore;
  /** Port exclusivo do Scheduler Foundation (INF-03) — sem acesso a adapters/stores. */
  executionScheduler?: ExecutionSchedulerPort;
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createExecutionObservabilityId?: () => string;
  now?: () => string;
};

function defaultRuntime(): DefaultExecutionObservabilityRuntime {
  return {
    store: new InMemoryExecutionObservabilityStore(),
    executionScheduler: createExecutionSchedulerPort(),
  };
}

function nowIso(runtime: DefaultExecutionObservabilityRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

export class DefaultExecutionObservabilityAdapter implements ExecutionObservabilityPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultExecutionObservabilityRuntime;
  private readonly store: ExecutionObservabilityStore;
  private readonly executionSchedulerPort: ExecutionSchedulerPort;

  constructor(runtime: DefaultExecutionObservabilityRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new InMemoryExecutionObservabilityStore();
    this.executionSchedulerPort = runtime.executionScheduler ?? createExecutionSchedulerPort();
  }

  getStore(): ExecutionObservabilityStore {
    return this.store;
  }

  /** Acesso estrutural ao ExecutionSchedulerPort (INF-03) — sem start/execução. */
  getExecutionSchedulerPort(): ExecutionSchedulerPort {
    return this.executionSchedulerPort;
  }

  capabilities(): ExecutionObservabilityPortCapabilities {
    return {
      provider: "default",
      ...foundationCapabilitiesBase(DEFAULT_EXECUTION_OBSERVABILITY_ADAPTER_ID),
    };
  }

  async health(): Promise<ExecutionObservabilityPortHealth> {
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
            ? "Default observability-foundation probe ok."
            : "Default observability-foundation probe falhou."),
        storedObservationCount: this.store.observationCount(),
        storedReferenceCount: this.store.referenceCount(),
        structuralHealth: buildStructuralHealth(this.store, stamp, probe.message),
      };
    }

    const storeHealth = this.store.health();
    const schedulerHealth = await this.executionSchedulerPort.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: storeHealth.ok && schedulerHealth.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      message:
        storeHealth.message ??
        "InMemoryExecutionObservabilityStore pronto (sem I/O externo — INF-04; scheduler via ExecutionSchedulerPort only).",
      storedObservationCount: this.store.observationCount(),
      storedReferenceCount: this.store.referenceCount(),
      structuralHealth: buildStructuralHealth(this.store, stamp, storeHealth.message),
    };
  }

  async statistics(): Promise<ObservationStatisticsResult> {
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
      createObservabilityId:
        this.runtime.createExecutionObservabilityId ?? createExecutionObservabilityId,
    };
  }

  /**
   * Resolve estruturalmente executionSchedulerId via ExecutionSchedulerPort.getSchedule.
   * NÃO inicia Schedulers. NÃO cria cron. NÃO dispara jobs.
   */
  private async resolveSchedulerId(input: GetObservationInput): Promise<string | undefined> {
    if (input.executionSchedulerId) return input.executionSchedulerId;
    if (!input.executionId) return undefined;

    const resolved = await this.executionSchedulerPort.getSchedule({
      executionId: input.executionId,
      createIfMissing: false,
    });
    return resolved.schedule?.executionSchedulerId;
  }

  async getObservation(input: GetObservationInput = {}): Promise<GetObservationResult> {
    const stamp = nowIso(this.runtime);
    const createIfMissing = input.createIfMissing ?? true;

    if (input.executionObservabilityId) {
      const existing = this.store.getObservation(input.executionObservabilityId);
      if (existing) {
        return {
          ok: true,
          observation: existing.observation,
          code: "found",
          message: "observation retrieved structurally",
          ...STRUCTURAL_OBSERVABILITY_NEGATION_FLAGS,
        };
      }
      if (!createIfMissing) {
        return {
          ok: false,
          code: "not_found",
          message: "observation not found",
          ...STRUCTURAL_OBSERVABILITY_NEGATION_FLAGS,
        };
      }
    }

    if (input.executionId) {
      const byExec = this.store.getObservationByExecution(input.executionId);
      if (byExec) {
        return {
          ok: true,
          observation: byExec.observation,
          code: "found",
          message: "observation retrieved structurally by execution",
          ...STRUCTURAL_OBSERVABILITY_NEGATION_FLAGS,
        };
      }
    }

    if (!createIfMissing) {
      return {
        ok: false,
        code: "not_found",
        message: "observation not found and createIfMissing=false",
        ...STRUCTURAL_OBSERVABILITY_NEGATION_FLAGS,
      };
    }

    const executionSchedulerId = await this.resolveSchedulerId(input);
    const observation = ensureObservation(
      this.store,
      { ...input, executionSchedulerId },
      stamp,
      this.factories(),
    );
    return {
      ok: true,
      observation,
      code: "created",
      message:
        "observation created structurally — no logs, no metrics, no tracing, no transmission, no engines invoked",
      ...STRUCTURAL_OBSERVABILITY_NEGATION_FLAGS,
    };
  }

  async registerObservation(
    input: RegisterObservationInput = {},
  ): Promise<RegisterObservationResult> {
    const result = await this.getObservation({ ...input, createIfMissing: true });
    if (!result.ok || !result.observation) return result;
    return {
      ...result,
      code: result.code === "found" ? "already_registered" : "registered-structural",
      message:
        "observation registered structurally — NO logs, NO metrics, NO tracing, NO events transmitted",
    };
  }

  async unregisterObservation(
    input: UnregisterObservationInput,
  ): Promise<UnregisterObservationResult> {
    if (!input.executionObservabilityId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionObservabilityId required",
        ...STRUCTURAL_OBSERVABILITY_NEGATION_FLAGS,
      };
    }

    const stamp = nowIso(this.runtime);
    const existing = this.store.getObservation(input.executionObservabilityId);
    if (!existing) {
      return {
        ok: false,
        code: "not_found",
        message: "observation not found",
        ...STRUCTURAL_OBSERVABILITY_NEGATION_FLAGS,
      };
    }

    const observation = updateObservationMetadata(
      this.store,
      input.executionObservabilityId,
      "unregistered-structural",
      stamp,
      "Observation unregistered structurally — no teardown, no logs flushed, no metrics closed",
    );
    this.store.removeObservation(input.executionObservabilityId);

    return {
      ok: true,
      observation,
      code: "unregistered-structural",
      message: "observation unregistered structurally — NO observability teardown performed",
      ...STRUCTURAL_OBSERVABILITY_NEGATION_FLAGS,
    };
  }

  async listObservations(input: ListObservationsInput = {}): Promise<ListObservationsResult> {
    let observations = this.store.listObservations().map((s) => s.observation);
    if (input.executionId) {
      observations = observations.filter((o) => o.executionId === input.executionId);
    }
    if (typeof input.limit === "number" && input.limit >= 0) {
      observations = observations.slice(0, input.limit);
    }
    return {
      ok: true,
      observations,
      code: "listed",
      message: "observations listed structurally — no logs, no metrics, no tracing",
      ...STRUCTURAL_OBSERVABILITY_NEGATION_FLAGS,
    };
  }
}

/**
 * MockExecutionObservabilityAdapter — INF-04 Observability Foundation.
 *
 * Voltado para testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência externa.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem logs reais. Sem métricas. Sem tracing. Sem persistência real.
 * Sem OpenTelemetry / Prometheus / Grafana / Azure Monitor / CloudWatch /
 * Datadog / Elastic APM. Sem transmissão de eventos.
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
  ObservabilityFoundationProviderId,
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

export const MOCK_EXECUTION_OBSERVABILITY_ADAPTER_ID = "mock-in-memory";
export const MOCK_EXECUTION_OBSERVABILITY_VERSION = "1.0.0";

export type MockExecutionObservabilityAdapterOptions = {
  provider?: Extract<ObservabilityFoundationProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: ExecutionObservabilityStore;
  executionScheduler?: ExecutionSchedulerPort;
  createExecutionObservabilityId?: () => string;
  now?: () => string;
};

export class MockExecutionObservabilityAdapter implements ExecutionObservabilityPort {
  readonly providerId: Extract<ObservabilityFoundationProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: ExecutionObservabilityStore;
  private readonly executionSchedulerPort: ExecutionSchedulerPort;
  private readonly createObservabilityIdFn: () => string;
  private readonly now?: () => string;

  constructor(options: MockExecutionObservabilityAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} observability-foundation ready.`;
    this.store = options.store ?? new InMemoryExecutionObservabilityStore();
    this.executionSchedulerPort =
      options.executionScheduler ?? createExecutionSchedulerPort({ provider: "mock" });
    this.createObservabilityIdFn =
      options.createExecutionObservabilityId ?? createExecutionObservabilityId;
    this.now = options.now;
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
      provider: this.providerId,
      ...foundationCapabilitiesBase(`${this.providerId}-in-memory`),
    };
  }

  async health(): Promise<ExecutionObservabilityPortHealth> {
    const stamp = this.stamp();
    return {
      ok: this.healthy,
      provider: this.providerId,
      message: this.message,
      storedObservationCount: this.store.observationCount(),
      storedReferenceCount: this.store.referenceCount(),
      structuralHealth: buildStructuralHealth(this.store, stamp, this.message),
    };
  }

  async statistics(): Promise<ObservationStatisticsResult> {
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
    if (!this.healthy) {
      return {
        ok: false,
        code: "unhealthy",
        message: this.message,
        ...STRUCTURAL_OBSERVABILITY_NEGATION_FLAGS,
      };
    }

    const stamp = this.stamp();
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
    const observation = ensureObservation(this.store, { ...input, executionSchedulerId }, stamp, {
      createObservabilityId: this.createObservabilityIdFn,
    });
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
    if (!this.healthy) {
      return {
        ok: false,
        code: "unhealthy",
        message: this.message,
        ...STRUCTURAL_OBSERVABILITY_NEGATION_FLAGS,
      };
    }
    if (!input.executionObservabilityId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionObservabilityId required",
        ...STRUCTURAL_OBSERVABILITY_NEGATION_FLAGS,
      };
    }

    const stamp = this.stamp();
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
    if (!this.healthy) {
      return {
        ok: false,
        observations: [],
        code: "unhealthy",
        message: this.message,
        ...STRUCTURAL_OBSERVABILITY_NEGATION_FLAGS,
      };
    }

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

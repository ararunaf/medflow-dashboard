/**
 * DefaultExecutionHealthCenterAdapter — adapter default in-memory (INF-05).
 *
 * Implementação totalmente in-memory.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem monitoramento real. Sem health checks reais.
 * Sem polling. Sem dashboards. Sem diagnósticos. Sem persistência real.
 * Sem consultas a Observability observations. Sem consultas externas.
 *
 * Representa estruturalmente a infraestrutura de Health Center.
 * Nenhum componente é monitorado. Nenhum health check real é executado.
 *
 * Integração com Observability: exclusivamente via ExecutionObservabilityPort (INF-04).
 */
import type { ExecutionObservabilityPort } from "../../observability-foundation/ports/execution-observability-port";
import { createExecutionObservabilityPort } from "../../observability-foundation/providers/execution-observability-provider";
import { createExecutionHealthCenterId, createHealthComponentId } from "../ports/identity";
import type { ExecutionHealthCenterPort } from "../ports/execution-health-center-port";
import type {
  ComponentStatisticsResult,
  ExecutionHealthCenterPortCapabilities,
  ExecutionHealthCenterPortHealth,
  GetComponentInput,
  GetComponentResult,
  ListComponentsInput,
  ListComponentsResult,
  RegisterComponentInput,
  RegisterComponentResult,
  UnregisterComponentInput,
  UnregisterComponentResult,
} from "../ports/types";
import { InMemoryExecutionHealthCenterStore, type ExecutionHealthCenterStore } from "../store";
import {
  STRUCTURAL_HEALTH_CENTER_NEGATION_FLAGS,
  buildStatistics,
  buildStructuralHealth,
  ensureComponent,
  foundationCapabilitiesBase,
  updateComponentStatus,
} from "./health-center-helpers";

export const DEFAULT_EXECUTION_HEALTH_CENTER_ADAPTER_ID = "default-in-process";
export const DEFAULT_EXECUTION_HEALTH_CENTER_VERSION = "1.0.0";

/**
 * Runtime injetável — permite testes sem acoplar a Engines ou produto.
 */
export type DefaultExecutionHealthCenterRuntime = {
  store?: ExecutionHealthCenterStore;
  /** Port exclusivo do Observability Foundation (INF-04) — sem acesso a adapters/stores. */
  executionObservability?: ExecutionObservabilityPort;
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createExecutionHealthCenterId?: () => string;
  createHealthComponentId?: () => string;
  now?: () => string;
};

function defaultRuntime(): DefaultExecutionHealthCenterRuntime {
  return {
    store: new InMemoryExecutionHealthCenterStore(),
    executionObservability: createExecutionObservabilityPort(),
  };
}

function nowIso(runtime: DefaultExecutionHealthCenterRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

export class DefaultExecutionHealthCenterAdapter implements ExecutionHealthCenterPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultExecutionHealthCenterRuntime;
  private readonly store: ExecutionHealthCenterStore;
  private readonly executionObservabilityPort: ExecutionObservabilityPort;

  constructor(runtime: DefaultExecutionHealthCenterRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new InMemoryExecutionHealthCenterStore();
    this.executionObservabilityPort =
      runtime.executionObservability ?? createExecutionObservabilityPort();
  }

  getStore(): ExecutionHealthCenterStore {
    return this.store;
  }

  /**
   * Acesso estrutural ao ExecutionObservabilityPort (INF-04).
   * Nenhuma observation é consultada. Nenhum log/métrica/trace é gerado.
   */
  getExecutionObservabilityPort(): ExecutionObservabilityPort {
    return this.executionObservabilityPort;
  }

  capabilities(): ExecutionHealthCenterPortCapabilities {
    return {
      provider: "default",
      ...foundationCapabilitiesBase(DEFAULT_EXECUTION_HEALTH_CENTER_ADAPTER_ID),
    };
  }

  async health(): Promise<ExecutionHealthCenterPortHealth> {
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
            ? "Default health-center-foundation probe ok."
            : "Default health-center-foundation probe falhou."),
        storedComponentCount: this.store.componentCount(),
        storedReferenceCount: this.store.referenceCount(),
        storedHealthCenterCount: this.store.healthCenterCount(),
        structuralHealth: buildStructuralHealth(this.store, stamp, probe.message),
      };
    }

    const storeHealth = this.store.health();
    // Prontidão estrutural do Port anterior — NÃO consulta observations.
    const observabilityHealth = await this.executionObservabilityPort.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: storeHealth.ok && observabilityHealth.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      message:
        storeHealth.message ??
        "InMemoryExecutionHealthCenterStore pronto (sem I/O externo — INF-05; observability via ExecutionObservabilityPort only — observations NOT consulted).",
      storedComponentCount: this.store.componentCount(),
      storedReferenceCount: this.store.referenceCount(),
      storedHealthCenterCount: this.store.healthCenterCount(),
      structuralHealth: buildStructuralHealth(this.store, stamp, storeHealth.message),
    };
  }

  async statistics(): Promise<ComponentStatisticsResult> {
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
      createHealthCenterId:
        this.runtime.createExecutionHealthCenterId ?? createExecutionHealthCenterId,
      createHealthComponentId: this.runtime.createHealthComponentId ?? createHealthComponentId,
    };
  }

  async getComponent(input: GetComponentInput = {}): Promise<GetComponentResult> {
    const stamp = nowIso(this.runtime);
    const createIfMissing = input.createIfMissing ?? true;

    if (input.healthComponentId) {
      const existing = this.store.getComponent(input.healthComponentId);
      if (existing) {
        return {
          ok: true,
          component: existing.component,
          code: "found",
          message: "component retrieved structurally",
          ...STRUCTURAL_HEALTH_CENTER_NEGATION_FLAGS,
        };
      }
      if (!createIfMissing) {
        return {
          ok: false,
          code: "not_found",
          message: "component not found",
          ...STRUCTURAL_HEALTH_CENTER_NEGATION_FLAGS,
        };
      }
    }

    if (input.executionHealthCenterId && input.key) {
      const byKey = this.store.getComponentByHealthCenterAndKey(
        input.executionHealthCenterId,
        input.key,
      );
      if (byKey) {
        return {
          ok: true,
          component: byKey.component,
          code: "found",
          message: "component retrieved structurally by health center and key",
          ...STRUCTURAL_HEALTH_CENTER_NEGATION_FLAGS,
        };
      }
    }

    if (!createIfMissing) {
      return {
        ok: false,
        code: "not_found",
        message: "component not found and createIfMissing=false",
        ...STRUCTURAL_HEALTH_CENTER_NEGATION_FLAGS,
      };
    }

    // executionObservabilityId é opaco — NUNCA consulta Observation via Port.
    const component = ensureComponent(this.store, input, stamp, this.factories());
    return {
      ok: true,
      component,
      code: "created",
      message:
        "component created structurally — no monitoring, no health checks, no queries, no engines invoked",
      ...STRUCTURAL_HEALTH_CENTER_NEGATION_FLAGS,
    };
  }

  async registerComponent(input: RegisterComponentInput = {}): Promise<RegisterComponentResult> {
    const result = await this.getComponent({ ...input, createIfMissing: true });
    if (!result.ok || !result.component) return result;
    return {
      ...result,
      code: result.code === "found" ? "already_registered" : "registered-structural",
      message:
        "component registered structurally — NO monitoring, NO health checks, NO external queries",
    };
  }

  async unregisterComponent(input: UnregisterComponentInput): Promise<UnregisterComponentResult> {
    if (!input.healthComponentId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "healthComponentId required",
        ...STRUCTURAL_HEALTH_CENTER_NEGATION_FLAGS,
      };
    }

    const stamp = nowIso(this.runtime);
    const existing = this.store.getComponent(input.healthComponentId);
    if (!existing) {
      return {
        ok: false,
        code: "not_found",
        message: "component not found",
        ...STRUCTURAL_HEALTH_CENTER_NEGATION_FLAGS,
      };
    }

    const component = updateComponentStatus(
      this.store,
      input.healthComponentId,
      "unregistered-structural",
      stamp,
      "Component unregistered structurally — no teardown, no monitoring closed, no health checks",
    );
    this.store.removeComponent(input.healthComponentId);

    return {
      ok: true,
      component,
      code: "unregistered-structural",
      message: "component unregistered structurally — NO health center teardown performed",
      ...STRUCTURAL_HEALTH_CENTER_NEGATION_FLAGS,
    };
  }

  async listComponents(input: ListComponentsInput = {}): Promise<ListComponentsResult> {
    let components = this.store.listComponents().map((s) => s.component);
    if (input.executionHealthCenterId) {
      components = components.filter(
        (c) => c.executionHealthCenterId === input.executionHealthCenterId,
      );
    }
    if (input.executionId) {
      components = components.filter((c) => c.executionId === input.executionId);
    }
    if (typeof input.limit === "number" && input.limit >= 0) {
      components = components.slice(0, input.limit);
    }
    return {
      ok: true,
      components,
      code: "listed",
      message: "components listed structurally — no monitoring, no health checks, no queries",
      ...STRUCTURAL_HEALTH_CENTER_NEGATION_FLAGS,
    };
  }
}

/**
 * MockExecutionHealthCenterAdapter — INF-05 Health Center Foundation.
 *
 * Voltado para testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência externa.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem monitoramento real. Sem health checks reais.
 * Sem polling. Sem dashboards. Sem diagnósticos. Sem persistência real.
 * Sem consultas a Observability observations. Sem consultas externas.
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
  HealthCenterFoundationProviderId,
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

export const MOCK_EXECUTION_HEALTH_CENTER_ADAPTER_ID = "mock-in-memory";
export const MOCK_EXECUTION_HEALTH_CENTER_VERSION = "1.0.0";

export type MockExecutionHealthCenterAdapterOptions = {
  provider?: Extract<HealthCenterFoundationProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: ExecutionHealthCenterStore;
  executionObservability?: ExecutionObservabilityPort;
  createExecutionHealthCenterId?: () => string;
  createHealthComponentId?: () => string;
  now?: () => string;
};

export class MockExecutionHealthCenterAdapter implements ExecutionHealthCenterPort {
  readonly providerId: Extract<HealthCenterFoundationProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: ExecutionHealthCenterStore;
  private readonly executionObservabilityPort: ExecutionObservabilityPort;
  private readonly createHealthCenterIdFn: () => string;
  private readonly createHealthComponentIdFn: () => string;
  private readonly now?: () => string;

  constructor(options: MockExecutionHealthCenterAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} health-center-foundation ready.`;
    this.store = options.store ?? new InMemoryExecutionHealthCenterStore();
    this.executionObservabilityPort =
      options.executionObservability ?? createExecutionObservabilityPort({ provider: "mock" });
    this.createHealthCenterIdFn =
      options.createExecutionHealthCenterId ?? createExecutionHealthCenterId;
    this.createHealthComponentIdFn = options.createHealthComponentId ?? createHealthComponentId;
    this.now = options.now;
  }

  getStore(): ExecutionHealthCenterStore {
    return this.store;
  }

  /**
   * Acesso estrutural ao ExecutionObservabilityPort (INF-04).
   * Nenhuma observation é consultada.
   */
  getExecutionObservabilityPort(): ExecutionObservabilityPort {
    return this.executionObservabilityPort;
  }

  capabilities(): ExecutionHealthCenterPortCapabilities {
    return {
      provider: this.providerId,
      ...foundationCapabilitiesBase(`${this.providerId}-in-memory`),
    };
  }

  async health(): Promise<ExecutionHealthCenterPortHealth> {
    const stamp = this.stamp();
    return {
      ok: this.healthy,
      provider: this.providerId,
      message: this.message,
      storedComponentCount: this.store.componentCount(),
      storedReferenceCount: this.store.referenceCount(),
      storedHealthCenterCount: this.store.healthCenterCount(),
      structuralHealth: buildStructuralHealth(this.store, stamp, this.message),
    };
  }

  async statistics(): Promise<ComponentStatisticsResult> {
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

  private factories() {
    return {
      createHealthCenterId: this.createHealthCenterIdFn,
      createHealthComponentId: this.createHealthComponentIdFn,
    };
  }

  async getComponent(input: GetComponentInput = {}): Promise<GetComponentResult> {
    if (!this.healthy) {
      return {
        ok: false,
        code: "unhealthy",
        message: this.message,
        ...STRUCTURAL_HEALTH_CENTER_NEGATION_FLAGS,
      };
    }

    const stamp = this.stamp();
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
    if (!this.healthy) {
      return {
        ok: false,
        code: "unhealthy",
        message: this.message,
        ...STRUCTURAL_HEALTH_CENTER_NEGATION_FLAGS,
      };
    }
    if (!input.healthComponentId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "healthComponentId required",
        ...STRUCTURAL_HEALTH_CENTER_NEGATION_FLAGS,
      };
    }

    const stamp = this.stamp();
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
    if (!this.healthy) {
      return {
        ok: false,
        components: [],
        code: "unhealthy",
        message: this.message,
        ...STRUCTURAL_HEALTH_CENTER_NEGATION_FLAGS,
      };
    }

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

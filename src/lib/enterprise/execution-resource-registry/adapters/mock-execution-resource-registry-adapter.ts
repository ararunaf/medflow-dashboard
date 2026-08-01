/**
 * MockExecutionResourceRegistryAdapter — EPC-24 Sprint 13.
 *
 * Voltado para testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência externa.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real.
 * Sem validação de recursos. Sem alocação de recursos. Sem balanceamento de carga.
 */
import {
  createExecutionResourceId,
  createExecutionResourceRegistryId,
  createResourceCategoryId,
  createResourceDefinitionId,
  createResourceScopeId,
} from "../ports/identity";
import type { ExecutionResourceRegistryPort } from "../ports/execution-resource-registry-port";
import type {
  ExecutionResourceRegistryPortCapabilities,
  ExecutionResourceRegistryPortHealth,
  ExecutionResourceRegistryProviderId,
  ExecutionResourceStatisticsResult,
  FindResourcesInput,
  FindResourcesResult,
  GetResourceInput,
  GetResourceResult,
  ListResourcesInput,
  ListResourcesResult,
  RegisterResourceInput,
  RegisterResourceResult,
} from "../ports/types";
import {
  DefaultExecutionResourceRegistryStore,
  type ExecutionResourceRegistryStore,
} from "../store";
import {
  appendResourceToRegistry,
  buildResource,
  buildStatistics,
  buildStructuralHealth,
  ensureResourceRegistry,
  foundationCapabilitiesBase,
  matchesFilter,
  persistResource,
} from "./resource-helpers";

export const MOCK_EXECUTION_RESOURCE_REGISTRY_ADAPTER_ID = "mock-in-memory";
export const MOCK_EXECUTION_RESOURCE_REGISTRY_VERSION = "1.0.0";

export type MockExecutionResourceRegistryAdapterOptions = {
  provider?: Extract<ExecutionResourceRegistryProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: ExecutionResourceRegistryStore;
  createExecutionResourceRegistryId?: () => string;
  createExecutionResourceId?: () => string;
  createDefinitionId?: () => string;
  createScopeId?: () => string;
  createCategoryId?: () => string;
  now?: () => string;
};

export class MockExecutionResourceRegistryAdapter implements ExecutionResourceRegistryPort {
  readonly providerId: Extract<ExecutionResourceRegistryProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: ExecutionResourceRegistryStore;
  private readonly createRegistryIdFn: () => string;
  private readonly createResourceIdFn: () => string;
  private readonly createDefinitionIdFn: () => string;
  private readonly createScopeIdFn: () => string;
  private readonly createCategoryIdFn: () => string;
  private readonly now?: () => string;

  constructor(options: MockExecutionResourceRegistryAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} execution-resource-registry ready.`;
    this.store = options.store ?? new DefaultExecutionResourceRegistryStore();
    this.createRegistryIdFn =
      options.createExecutionResourceRegistryId ?? createExecutionResourceRegistryId;
    this.createResourceIdFn = options.createExecutionResourceId ?? createExecutionResourceId;
    this.createDefinitionIdFn = options.createDefinitionId ?? createResourceDefinitionId;
    this.createScopeIdFn = options.createScopeId ?? createResourceScopeId;
    this.createCategoryIdFn = options.createCategoryId ?? createResourceCategoryId;
    this.now = options.now;
  }

  getStore(): ExecutionResourceRegistryStore {
    return this.store;
  }

  capabilities(): ExecutionResourceRegistryPortCapabilities {
    return {
      provider: this.providerId,
      ...foundationCapabilitiesBase(`${this.providerId}-in-memory`),
    };
  }

  async health(): Promise<ExecutionResourceRegistryPortHealth> {
    const stamp = this.stamp();
    return {
      ok: this.healthy,
      provider: this.providerId,
      message: this.message,
      storedRegistryCount: this.store.registryCount(),
      storedResourceCount: this.store.resourceCount(),
      storedReferenceCount: this.store.referenceCount(),
      storedCategoryCount: this.store.categoryCount(),
      storedScopeCount: this.store.scopeCount(),
      structuralHealth: buildStructuralHealth(this.store, stamp, this.message),
    };
  }

  private stamp(): string {
    return this.now?.() ?? new Date().toISOString();
  }

  private factories() {
    return {
      createResourceId: this.createResourceIdFn,
      createDefinitionId: this.createDefinitionIdFn,
      createScopeId: this.createScopeIdFn,
      createCategoryId: this.createCategoryIdFn,
      createRegistryId: this.createRegistryIdFn,
    };
  }

  private unhealthyResult<T extends { ok: boolean; code?: string; message?: string }>(
    extra: Omit<T, "ok" | "code" | "message"> = {} as Omit<T, "ok" | "code" | "message">,
  ): T {
    return {
      ...extra,
      ok: false,
      code: "unhealthy",
      message: this.message,
    } as T;
  }

  async statistics(): Promise<ExecutionResourceStatisticsResult> {
    if (!this.healthy) return this.unhealthyResult<ExecutionResourceStatisticsResult>();
    const stamp = this.stamp();
    return {
      ok: true,
      statistics: buildStatistics(this.store, stamp),
      code: "computed",
      message: "structural statistics computed — in-memory only",
    };
  }

  async registerResource(input: RegisterResourceInput): Promise<RegisterResourceResult> {
    if (!this.healthy) {
      return this.unhealthyResult<RegisterResourceResult>({
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        resourceAllocationImplemented: false,
        resourceReservationImplemented: false,
        resourcesAllocated: false,
      });
    }

    if (!input.key || !input.name) {
      return {
        ok: false,
        code: "invalid_input",
        message: "key and name required",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        resourceAllocationImplemented: false,
        resourceReservationImplemented: false,
        resourcesAllocated: false,
      };
    }

    const stamp = this.stamp();
    const factories = this.factories();
    const registry = ensureResourceRegistry(this.store, input, stamp, factories);

    const existingByKey = this.store.getResourceByKey(
      registry.executionResourceRegistryId,
      input.key,
    );
    if (existingByKey) {
      return {
        ok: false,
        code: "already_exists",
        message: "resource already registered for key in this registry",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        resourceAllocationImplemented: false,
        resourceReservationImplemented: false,
        resourcesAllocated: false,
      };
    }

    if (input.executionResourceId && this.store.getResource(input.executionResourceId)) {
      return {
        ok: false,
        code: "already_exists",
        message: "resource already exists",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        resourceAllocationImplemented: false,
        resourceReservationImplemented: false,
        resourcesAllocated: false,
      };
    }

    const resource = buildResource(input, registry, stamp, factories);
    persistResource(this.store, resource);
    const updatedRegistry = appendResourceToRegistry(this.store, registry, resource, stamp);

    return {
      ok: true,
      resource,
      registry: updatedRegistry,
      code: "registered",
      message:
        "resource registered structurally — no validation, no resource allocation engine, no engines invoked",
      persistenceImplemented: false,
      databaseUsed: false,
      enginesInvoked: false,
      resourceAllocationImplemented: false,
      resourceReservationImplemented: false,
      resourcesAllocated: false,
    };
  }

  async getResource(input: GetResourceInput): Promise<GetResourceResult> {
    if (!this.healthy) return this.unhealthyResult<GetResourceResult>();

    if (!input.executionResourceId && !input.key) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionResourceId or key required",
      };
    }

    let stored = input.executionResourceId
      ? this.store.getResource(input.executionResourceId)
      : undefined;

    if (!stored && input.key) {
      const registryId = input.executionResourceRegistryId;
      if (registryId) {
        stored = this.store.getResourceByKey(registryId, input.key);
      } else {
        stored = this.store.listResources().find((s) => s.resource.key === input.key);
      }
    }

    if (!stored) {
      return {
        ok: false,
        code: "not_found",
        message: "resource not found",
      };
    }

    const registry = this.store.getRegistry(stored.registryId)?.registry;

    return {
      ok: true,
      resource: stored.resource,
      registry,
      code: "found",
      message: "resource retrieved structurally",
    };
  }

  async listResources(input: ListResourcesInput = {}): Promise<ListResourcesResult> {
    if (!this.healthy) return this.unhealthyResult<ListResourcesResult>();

    const stamp = this.stamp();
    let resources = this.store
      .listResources(input.filter?.executionResourceRegistryId)
      .map((s) => s.resource);

    if (input.filter) {
      resources = resources.filter((p) => matchesFilter(p, input.filter));
    }

    const limit = input.limit ?? input.filter?.limit;
    if (typeof limit === "number" && limit >= 0) {
      resources = resources.slice(0, limit);
    }

    const registryId =
      input.filter?.executionResourceRegistryId ?? resources[0]?.executionResourceRegistryId;
    const registry = registryId ? this.store.getRegistry(registryId)?.registry : undefined;

    return {
      ok: true,
      resources,
      registry,
      total: resources.length,
      code: "listed",
      message: `structural resources listed — in-memory only (${stamp})`,
    };
  }

  async findResources(input: FindResourcesInput): Promise<FindResourcesResult> {
    if (!this.healthy) {
      return {
        kind: "execution-resource-result",
        ok: false,
        code: "unhealthy",
        message: this.message,
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        resourceAllocationImplemented: false,
        resourceReservationImplemented: false,
        resourcesAllocated: false,
      };
    }

    if (!input.filter) {
      return {
        kind: "execution-resource-result",
        ok: false,
        code: "invalid_input",
        message: "filter required",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        resourceAllocationImplemented: false,
        resourceReservationImplemented: false,
        resourcesAllocated: false,
      };
    }

    const matches = this.store
      .listResources(input.filter.executionResourceRegistryId)
      .map((s) => s.resource)
      .filter((p) => matchesFilter(p, input.filter));

    if (matches.length === 0) {
      return {
        kind: "execution-resource-result",
        ok: false,
        code: "not_found",
        message: "no resource matched structural filter",
        resources: [],
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        resourceAllocationImplemented: false,
        resourceReservationImplemented: false,
        resourcesAllocated: false,
      };
    }

    const first = matches[0]!;
    const registry = this.store.getRegistry(first.executionResourceRegistryId)?.registry;

    return {
      kind: "execution-resource-result",
      ok: true,
      executionResourceRegistryId: first.executionResourceRegistryId,
      executionResourceId: first.executionResourceId,
      executionId: first.executionId,
      resource: first,
      registry,
      resources: matches,
      code: "found",
      message: "resource(ies) found structurally",
      persistenceImplemented: false,
      databaseUsed: false,
      enginesInvoked: false,
      resourceAllocationImplemented: false,
      resourceReservationImplemented: false,
      resourcesAllocated: false,
    };
  }
}

/**
 * DefaultExecutionResourceRegistryAdapter — adapter default in-memory (EPC-24 Sprint 13).
 *
 * Implementação totalmente in-memory.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real.
 * Sem validação de recursos. Sem alocação de recursos. Sem balanceamento de carga.
 *
 * Representa estruturalmente os recursos disponíveis.
 * Nenhuma Engine é invocada. Nenhum recurso é alocado.
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

export const DEFAULT_EXECUTION_RESOURCE_REGISTRY_ADAPTER_ID = "default-in-process";
export const DEFAULT_EXECUTION_RESOURCE_REGISTRY_VERSION = "1.0.0";

/**
 * Runtime injetável — permite testes sem acoplar a Engines ou produto.
 */
export type DefaultExecutionResourceRegistryRuntime = {
  store?: ExecutionResourceRegistryStore;
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createExecutionResourceRegistryId?: () => string;
  createExecutionResourceId?: () => string;
  createDefinitionId?: () => string;
  createScopeId?: () => string;
  createCategoryId?: () => string;
  now?: () => string;
};

function defaultRuntime(): DefaultExecutionResourceRegistryRuntime {
  return {
    store: new DefaultExecutionResourceRegistryStore(),
  };
}

function nowIso(runtime: DefaultExecutionResourceRegistryRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

export class DefaultExecutionResourceRegistryAdapter implements ExecutionResourceRegistryPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultExecutionResourceRegistryRuntime;
  private readonly store: ExecutionResourceRegistryStore;

  constructor(runtime: DefaultExecutionResourceRegistryRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultExecutionResourceRegistryStore();
  }

  getStore(): ExecutionResourceRegistryStore {
    return this.store;
  }

  capabilities(): ExecutionResourceRegistryPortCapabilities {
    return {
      provider: "default",
      ...foundationCapabilitiesBase(DEFAULT_EXECUTION_RESOURCE_REGISTRY_ADAPTER_ID),
    };
  }

  async health(): Promise<ExecutionResourceRegistryPortHealth> {
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
            ? "Default execution-resource-registry probe ok."
            : "Default execution-resource-registry probe falhou."),
        storedRegistryCount: this.store.registryCount(),
        storedResourceCount: this.store.resourceCount(),
        storedReferenceCount: this.store.referenceCount(),
        storedCategoryCount: this.store.categoryCount(),
        storedScopeCount: this.store.scopeCount(),
        structuralHealth: buildStructuralHealth(this.store, stamp, probe.message),
      };
    }

    const storeHealth = this.store.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: storeHealth.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      message:
        storeHealth.message ??
        "DefaultExecutionResourceRegistryStore pronto (sem I/O externo — EPC-24 Sprint 13).",
      storedRegistryCount: this.store.registryCount(),
      storedResourceCount: this.store.resourceCount(),
      storedReferenceCount: this.store.referenceCount(),
      storedCategoryCount: this.store.categoryCount(),
      storedScopeCount: this.store.scopeCount(),
      structuralHealth: buildStructuralHealth(this.store, stamp, storeHealth.message),
    };
  }

  async statistics(): Promise<ExecutionResourceStatisticsResult> {
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
      createResourceId: this.runtime.createExecutionResourceId ?? createExecutionResourceId,
      createDefinitionId: this.runtime.createDefinitionId ?? createResourceDefinitionId,
      createScopeId: this.runtime.createScopeId ?? createResourceScopeId,
      createCategoryId: this.runtime.createCategoryId ?? createResourceCategoryId,
      createRegistryId:
        this.runtime.createExecutionResourceRegistryId ?? createExecutionResourceRegistryId,
    };
  }

  async registerResource(input: RegisterResourceInput): Promise<RegisterResourceResult> {
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

    const stamp = nowIso(this.runtime);
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
    const stamp = nowIso(this.runtime);
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

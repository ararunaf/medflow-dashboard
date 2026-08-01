/**
 * DefaultExecutionDependencyRegistryAdapter — adapter default in-memory (EPC-24 Sprint 09).
 *
 * Implementação totalmente in-memory.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real.
 * Sem resolução de dependências. Sem ordenação. Sem DAG solver.
 *
 * Representa estruturalmente as dependências entre capacidades e componentes.
 * Nenhuma Engine é invocada. Nenhuma dependência é resolvida.
 */
import {
  createDependencyDefinitionId,
  createDependencyEdgeId,
  createDependencyGraphId,
  createDependencyNodeId,
  createExecutionDependencyId,
  createExecutionDependencyRegistryId,
} from "../ports/identity";
import type { ExecutionDependencyRegistryPort } from "../ports/execution-dependency-registry-port";
import type {
  ExecutionDependencyRegistryPortCapabilities,
  ExecutionDependencyRegistryPortHealth,
  ExecutionDependencyStatisticsResult,
  FindDependenciesInput,
  FindDependenciesResult,
  GetDependencyInput,
  GetDependencyResult,
  ListDependenciesInput,
  ListDependenciesResult,
  RegisterDependencyInput,
  RegisterDependencyResult,
} from "../ports/types";
import {
  DefaultExecutionDependencyRegistryStore,
  type ExecutionDependencyRegistryStore,
} from "../store";
import {
  appendDependencyToRegistry,
  buildDependency,
  buildStatistics,
  buildStructuralHealth,
  ensureDependencyRegistry,
  foundationCapabilitiesBase,
  matchesFilter,
  persistDependency,
} from "./dependency-helpers";

export const DEFAULT_EXECUTION_DEPENDENCY_REGISTRY_ADAPTER_ID = "default-in-process";
export const DEFAULT_EXECUTION_DEPENDENCY_REGISTRY_VERSION = "1.0.0";

/**
 * Runtime injetável — permite testes sem acoplar a Engines ou produto.
 */
export type DefaultExecutionDependencyRegistryRuntime = {
  store?: ExecutionDependencyRegistryStore;
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createExecutionDependencyRegistryId?: () => string;
  createExecutionDependencyId?: () => string;
  createDefinitionId?: () => string;
  createGraphId?: () => string;
  createNodeId?: () => string;
  createEdgeId?: () => string;
  now?: () => string;
};

function defaultRuntime(): DefaultExecutionDependencyRegistryRuntime {
  return {
    store: new DefaultExecutionDependencyRegistryStore(),
  };
}

function nowIso(runtime: DefaultExecutionDependencyRegistryRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

export class DefaultExecutionDependencyRegistryAdapter implements ExecutionDependencyRegistryPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultExecutionDependencyRegistryRuntime;
  private readonly store: ExecutionDependencyRegistryStore;

  constructor(runtime: DefaultExecutionDependencyRegistryRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultExecutionDependencyRegistryStore();
  }

  getStore(): ExecutionDependencyRegistryStore {
    return this.store;
  }

  capabilities(): ExecutionDependencyRegistryPortCapabilities {
    return {
      provider: "default",
      ...foundationCapabilitiesBase(DEFAULT_EXECUTION_DEPENDENCY_REGISTRY_ADAPTER_ID),
    };
  }

  async health(): Promise<ExecutionDependencyRegistryPortHealth> {
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
            ? "Default execution-dependency-registry probe ok."
            : "Default execution-dependency-registry probe falhou."),
        storedRegistryCount: this.store.registryCount(),
        storedDependencyCount: this.store.dependencyCount(),
        storedReferenceCount: this.store.referenceCount(),
        storedNodeCount: this.store.nodeCount(),
        storedEdgeCount: this.store.edgeCount(),
        storedGraphCount: this.store.graphCount(),
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
        "DefaultExecutionDependencyRegistryStore pronto (sem I/O externo — EPC-24 Sprint 09).",
      storedRegistryCount: this.store.registryCount(),
      storedDependencyCount: this.store.dependencyCount(),
      storedReferenceCount: this.store.referenceCount(),
      storedNodeCount: this.store.nodeCount(),
      storedEdgeCount: this.store.edgeCount(),
      storedGraphCount: this.store.graphCount(),
      structuralHealth: buildStructuralHealth(this.store, stamp, storeHealth.message),
    };
  }

  async statistics(): Promise<ExecutionDependencyStatisticsResult> {
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
      createDependencyId: this.runtime.createExecutionDependencyId ?? createExecutionDependencyId,
      createDefinitionId: this.runtime.createDefinitionId ?? createDependencyDefinitionId,
      createGraphId: this.runtime.createGraphId ?? createDependencyGraphId,
      createNodeId: this.runtime.createNodeId ?? createDependencyNodeId,
      createEdgeId: this.runtime.createEdgeId ?? createDependencyEdgeId,
      createRegistryId:
        this.runtime.createExecutionDependencyRegistryId ?? createExecutionDependencyRegistryId,
    };
  }

  async registerDependency(input: RegisterDependencyInput): Promise<RegisterDependencyResult> {
    if (!input.key || !input.name) {
      return {
        ok: false,
        code: "invalid_input",
        message: "key and name required",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        dependencyResolutionImplemented: false,
        topologicalSortImplemented: false,
        dagSolverImplemented: false,
      };
    }

    const stamp = nowIso(this.runtime);
    const factories = this.factories();
    const registry = ensureDependencyRegistry(this.store, input, stamp, factories);

    const existingByKey = this.store.getDependencyByKey(
      registry.executionDependencyRegistryId,
      input.key,
    );
    if (existingByKey) {
      return {
        ok: false,
        code: "already_exists",
        message: "dependency already registered for key in this registry",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        dependencyResolutionImplemented: false,
        topologicalSortImplemented: false,
        dagSolverImplemented: false,
      };
    }

    if (input.executionDependencyId && this.store.getDependency(input.executionDependencyId)) {
      return {
        ok: false,
        code: "already_exists",
        message: "dependency already exists",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        dependencyResolutionImplemented: false,
        topologicalSortImplemented: false,
        dagSolverImplemented: false,
      };
    }

    const dependency = buildDependency(input, registry, stamp, factories);
    persistDependency(this.store, dependency);
    const updatedRegistry = appendDependencyToRegistry(this.store, registry, dependency, stamp);

    return {
      ok: true,
      dependency,
      registry: updatedRegistry,
      code: "registered",
      message:
        "dependency registered structurally — no resolution, no ordering, no engines invoked",
      persistenceImplemented: false,
      databaseUsed: false,
      enginesInvoked: false,
      dependencyResolutionImplemented: false,
      topologicalSortImplemented: false,
      dagSolverImplemented: false,
    };
  }

  async getDependency(input: GetDependencyInput): Promise<GetDependencyResult> {
    if (!input.executionDependencyId && !input.key) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionDependencyId or key required",
      };
    }

    let stored = input.executionDependencyId
      ? this.store.getDependency(input.executionDependencyId)
      : undefined;

    if (!stored && input.key) {
      const registryId = input.executionDependencyRegistryId;
      if (registryId) {
        stored = this.store.getDependencyByKey(registryId, input.key);
      } else {
        stored = this.store.listDependencies().find((s) => s.dependency.key === input.key);
      }
    }

    if (!stored) {
      return {
        ok: false,
        code: "not_found",
        message: "dependency not found",
      };
    }

    const registry = this.store.getRegistry(stored.registryId)?.registry;

    return {
      ok: true,
      dependency: stored.dependency,
      registry,
      code: "found",
      message: "dependency retrieved structurally",
    };
  }

  async listDependencies(input: ListDependenciesInput = {}): Promise<ListDependenciesResult> {
    const stamp = nowIso(this.runtime);
    let dependencies = this.store
      .listDependencies(input.filter?.executionDependencyRegistryId)
      .map((s) => s.dependency);

    if (input.filter) {
      dependencies = dependencies.filter((d) => matchesFilter(d, input.filter));
    }

    const limit = input.limit ?? input.filter?.limit;
    if (typeof limit === "number" && limit >= 0) {
      dependencies = dependencies.slice(0, limit);
    }

    const registryId =
      input.filter?.executionDependencyRegistryId ?? dependencies[0]?.executionDependencyRegistryId;
    const registry = registryId ? this.store.getRegistry(registryId)?.registry : undefined;

    return {
      ok: true,
      dependencies,
      registry,
      total: dependencies.length,
      code: "listed",
      message: `structural dependencies listed — in-memory only (${stamp})`,
    };
  }

  async findDependencies(input: FindDependenciesInput): Promise<FindDependenciesResult> {
    if (!input.filter) {
      return {
        kind: "execution-dependency-result",
        ok: false,
        code: "invalid_input",
        message: "filter required",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        dependencyResolutionImplemented: false,
        topologicalSortImplemented: false,
        dagSolverImplemented: false,
      };
    }

    const matches = this.store
      .listDependencies(input.filter.executionDependencyRegistryId)
      .map((s) => s.dependency)
      .filter((d) => matchesFilter(d, input.filter));

    if (matches.length === 0) {
      return {
        kind: "execution-dependency-result",
        ok: false,
        code: "not_found",
        message: "no dependency matched structural filter",
        dependencies: [],
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        dependencyResolutionImplemented: false,
        topologicalSortImplemented: false,
        dagSolverImplemented: false,
      };
    }

    const first = matches[0]!;
    const registry = this.store.getRegistry(first.executionDependencyRegistryId)?.registry;

    return {
      kind: "execution-dependency-result",
      ok: true,
      executionDependencyRegistryId: first.executionDependencyRegistryId,
      executionDependencyId: first.executionDependencyId,
      executionId: first.executionId,
      dependency: first,
      registry,
      dependencies: matches,
      code: "found",
      message: "dependency(ies) found structurally",
      persistenceImplemented: false,
      databaseUsed: false,
      enginesInvoked: false,
      dependencyResolutionImplemented: false,
      topologicalSortImplemented: false,
      dagSolverImplemented: false,
    };
  }
}

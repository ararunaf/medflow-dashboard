/**
 * MockExecutionDependencyRegistryAdapter — EPC-24 Sprint 09.
 *
 * Voltado para testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência externa.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real.
 * Sem resolução de dependências. Sem ordenação. Sem DAG solver.
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
  ExecutionDependencyRegistryProviderId,
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

export const MOCK_EXECUTION_DEPENDENCY_REGISTRY_ADAPTER_ID = "mock-in-memory";
export const MOCK_EXECUTION_DEPENDENCY_REGISTRY_VERSION = "1.0.0";

export type MockExecutionDependencyRegistryAdapterOptions = {
  provider?: Extract<ExecutionDependencyRegistryProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: ExecutionDependencyRegistryStore;
  createExecutionDependencyRegistryId?: () => string;
  createExecutionDependencyId?: () => string;
  createDefinitionId?: () => string;
  createGraphId?: () => string;
  createNodeId?: () => string;
  createEdgeId?: () => string;
  now?: () => string;
};

export class MockExecutionDependencyRegistryAdapter implements ExecutionDependencyRegistryPort {
  readonly providerId: Extract<ExecutionDependencyRegistryProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: ExecutionDependencyRegistryStore;
  private readonly createRegistryIdFn: () => string;
  private readonly createDependencyIdFn: () => string;
  private readonly createDefinitionIdFn: () => string;
  private readonly createGraphIdFn: () => string;
  private readonly createNodeIdFn: () => string;
  private readonly createEdgeIdFn: () => string;
  private readonly now?: () => string;

  constructor(options: MockExecutionDependencyRegistryAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} execution-dependency-registry ready.`;
    this.store = options.store ?? new DefaultExecutionDependencyRegistryStore();
    this.createRegistryIdFn =
      options.createExecutionDependencyRegistryId ?? createExecutionDependencyRegistryId;
    this.createDependencyIdFn = options.createExecutionDependencyId ?? createExecutionDependencyId;
    this.createDefinitionIdFn = options.createDefinitionId ?? createDependencyDefinitionId;
    this.createGraphIdFn = options.createGraphId ?? createDependencyGraphId;
    this.createNodeIdFn = options.createNodeId ?? createDependencyNodeId;
    this.createEdgeIdFn = options.createEdgeId ?? createDependencyEdgeId;
    this.now = options.now;
  }

  getStore(): ExecutionDependencyRegistryStore {
    return this.store;
  }

  capabilities(): ExecutionDependencyRegistryPortCapabilities {
    return {
      provider: this.providerId,
      ...foundationCapabilitiesBase(`${this.providerId}-in-memory`),
    };
  }

  async health(): Promise<ExecutionDependencyRegistryPortHealth> {
    const stamp = this.stamp();
    return {
      ok: this.healthy,
      provider: this.providerId,
      message: this.message,
      storedRegistryCount: this.store.registryCount(),
      storedDependencyCount: this.store.dependencyCount(),
      storedReferenceCount: this.store.referenceCount(),
      storedNodeCount: this.store.nodeCount(),
      storedEdgeCount: this.store.edgeCount(),
      storedGraphCount: this.store.graphCount(),
      structuralHealth: buildStructuralHealth(this.store, stamp, this.message),
    };
  }

  private stamp(): string {
    return this.now?.() ?? new Date().toISOString();
  }

  private factories() {
    return {
      createDependencyId: this.createDependencyIdFn,
      createDefinitionId: this.createDefinitionIdFn,
      createGraphId: this.createGraphIdFn,
      createNodeId: this.createNodeIdFn,
      createEdgeId: this.createEdgeIdFn,
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

  async statistics(): Promise<ExecutionDependencyStatisticsResult> {
    if (!this.healthy) return this.unhealthyResult<ExecutionDependencyStatisticsResult>();
    const stamp = this.stamp();
    return {
      ok: true,
      statistics: buildStatistics(this.store, stamp),
      code: "computed",
      message: "structural statistics computed — in-memory only",
    };
  }

  async registerDependency(input: RegisterDependencyInput): Promise<RegisterDependencyResult> {
    if (!this.healthy) {
      return this.unhealthyResult<RegisterDependencyResult>({
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        dependencyResolutionImplemented: false,
        topologicalSortImplemented: false,
        dagSolverImplemented: false,
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
        dependencyResolutionImplemented: false,
        topologicalSortImplemented: false,
        dagSolverImplemented: false,
      };
    }

    const stamp = this.stamp();
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
    if (!this.healthy) return this.unhealthyResult<GetDependencyResult>();

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
    if (!this.healthy) return this.unhealthyResult<ListDependenciesResult>();

    const stamp = this.stamp();
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
    if (!this.healthy) {
      return {
        kind: "execution-dependency-result",
        ok: false,
        code: "unhealthy",
        message: this.message,
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        dependencyResolutionImplemented: false,
        topologicalSortImplemented: false,
        dagSolverImplemented: false,
      };
    }

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

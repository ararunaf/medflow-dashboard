/**
 * MockExecutionEnvironmentRegistryAdapter — EPC-24 Sprint 14.
 *
 * Voltado para testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência externa.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real.
 * Sem seleção de ambientes. Sem seleção de ambientes. Sem ativação de ambientes.
 */
import {
  createExecutionEnvironmentId,
  createExecutionEnvironmentRegistryId,
  createEnvironmentCategoryId,
  createEnvironmentDefinitionId,
  createEnvironmentScopeId,
} from "../ports/identity";
import type { ExecutionEnvironmentRegistryPort } from "../ports/execution-environment-registry-port";
import type {
  ExecutionEnvironmentRegistryPortCapabilities,
  ExecutionEnvironmentRegistryPortHealth,
  ExecutionEnvironmentRegistryProviderId,
  ExecutionEnvironmentStatisticsResult,
  FindEnvironmentsInput,
  FindEnvironmentsResult,
  GetEnvironmentInput,
  GetEnvironmentResult,
  ListEnvironmentsInput,
  ListEnvironmentsResult,
  RegisterEnvironmentInput,
  RegisterEnvironmentResult,
} from "../ports/types";
import {
  DefaultExecutionEnvironmentRegistryStore,
  type ExecutionEnvironmentRegistryStore,
} from "../store";
import {
  appendEnvironmentToRegistry,
  buildEnvironment,
  buildStatistics,
  buildStructuralHealth,
  ensureEnvironmentRegistry,
  foundationCapabilitiesBase,
  matchesFilter,
  persistEnvironment,
} from "./environment-helpers";

export const MOCK_EXECUTION_ENVIRONMENT_REGISTRY_ADAPTER_ID = "mock-in-memory";
export const MOCK_EXECUTION_ENVIRONMENT_REGISTRY_VERSION = "1.0.0";

export type MockExecutionEnvironmentRegistryAdapterOptions = {
  provider?: Extract<ExecutionEnvironmentRegistryProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: ExecutionEnvironmentRegistryStore;
  createExecutionEnvironmentRegistryId?: () => string;
  createExecutionEnvironmentId?: () => string;
  createDefinitionId?: () => string;
  createScopeId?: () => string;
  createCategoryId?: () => string;
  now?: () => string;
};

export class MockExecutionEnvironmentRegistryAdapter implements ExecutionEnvironmentRegistryPort {
  readonly providerId: Extract<ExecutionEnvironmentRegistryProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: ExecutionEnvironmentRegistryStore;
  private readonly createRegistryIdFn: () => string;
  private readonly createEnvironmentIdFn: () => string;
  private readonly createDefinitionIdFn: () => string;
  private readonly createScopeIdFn: () => string;
  private readonly createCategoryIdFn: () => string;
  private readonly now?: () => string;

  constructor(options: MockExecutionEnvironmentRegistryAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} execution-environment-registry ready.`;
    this.store = options.store ?? new DefaultExecutionEnvironmentRegistryStore();
    this.createRegistryIdFn =
      options.createExecutionEnvironmentRegistryId ?? createExecutionEnvironmentRegistryId;
    this.createEnvironmentIdFn =
      options.createExecutionEnvironmentId ?? createExecutionEnvironmentId;
    this.createDefinitionIdFn = options.createDefinitionId ?? createEnvironmentDefinitionId;
    this.createScopeIdFn = options.createScopeId ?? createEnvironmentScopeId;
    this.createCategoryIdFn = options.createCategoryId ?? createEnvironmentCategoryId;
    this.now = options.now;
  }

  getStore(): ExecutionEnvironmentRegistryStore {
    return this.store;
  }

  capabilities(): ExecutionEnvironmentRegistryPortCapabilities {
    return {
      provider: this.providerId,
      ...foundationCapabilitiesBase(`${this.providerId}-in-memory`),
    };
  }

  async health(): Promise<ExecutionEnvironmentRegistryPortHealth> {
    const stamp = this.stamp();
    return {
      ok: this.healthy,
      provider: this.providerId,
      message: this.message,
      storedRegistryCount: this.store.registryCount(),
      storedEnvironmentCount: this.store.environmentCount(),
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
      createEnvironmentId: this.createEnvironmentIdFn,
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

  async statistics(): Promise<ExecutionEnvironmentStatisticsResult> {
    if (!this.healthy) return this.unhealthyResult<ExecutionEnvironmentStatisticsResult>();
    const stamp = this.stamp();
    return {
      ok: true,
      statistics: buildStatistics(this.store, stamp),
      code: "computed",
      message: "structural statistics computed — in-memory only",
    };
  }

  async registerEnvironment(input: RegisterEnvironmentInput): Promise<RegisterEnvironmentResult> {
    if (!this.healthy) {
      return this.unhealthyResult<RegisterEnvironmentResult>({
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        environmentSelectionImplemented: false,
        environmentProvisioningImplemented: false,
        environmentsActivated: false,
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
        environmentSelectionImplemented: false,
        environmentProvisioningImplemented: false,
        environmentsActivated: false,
      };
    }

    const stamp = this.stamp();
    const factories = this.factories();
    const registry = ensureEnvironmentRegistry(this.store, input, stamp, factories);

    const existingByKey = this.store.getEnvironmentByKey(
      registry.executionEnvironmentRegistryId,
      input.key,
    );
    if (existingByKey) {
      return {
        ok: false,
        code: "already_exists",
        message: "environment already registered for key in this registry",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        environmentSelectionImplemented: false,
        environmentProvisioningImplemented: false,
        environmentsActivated: false,
      };
    }

    if (input.executionEnvironmentId && this.store.getEnvironment(input.executionEnvironmentId)) {
      return {
        ok: false,
        code: "already_exists",
        message: "environment already exists",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        environmentSelectionImplemented: false,
        environmentProvisioningImplemented: false,
        environmentsActivated: false,
      };
    }

    const environment = buildEnvironment(input, registry, stamp, factories);
    persistEnvironment(this.store, environment);
    const updatedRegistry = appendEnvironmentToRegistry(this.store, registry, environment, stamp);

    return {
      ok: true,
      environment,
      registry: updatedRegistry,
      code: "registered",
      message:
        "environment registered structurally — no validation, no environment selection engine, no engines invoked",
      persistenceImplemented: false,
      databaseUsed: false,
      enginesInvoked: false,
      environmentSelectionImplemented: false,
      environmentProvisioningImplemented: false,
      environmentsActivated: false,
    };
  }

  async getEnvironment(input: GetEnvironmentInput): Promise<GetEnvironmentResult> {
    if (!this.healthy) return this.unhealthyResult<GetEnvironmentResult>();

    if (!input.executionEnvironmentId && !input.key) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionEnvironmentId or key required",
      };
    }

    let stored = input.executionEnvironmentId
      ? this.store.getEnvironment(input.executionEnvironmentId)
      : undefined;

    if (!stored && input.key) {
      const registryId = input.executionEnvironmentRegistryId;
      if (registryId) {
        stored = this.store.getEnvironmentByKey(registryId, input.key);
      } else {
        stored = this.store.listEnvironments().find((s) => s.environment.key === input.key);
      }
    }

    if (!stored) {
      return {
        ok: false,
        code: "not_found",
        message: "environment not found",
      };
    }

    const registry = this.store.getRegistry(stored.registryId)?.registry;

    return {
      ok: true,
      environment: stored.environment,
      registry,
      code: "found",
      message: "environment retrieved structurally",
    };
  }

  async listEnvironments(input: ListEnvironmentsInput = {}): Promise<ListEnvironmentsResult> {
    if (!this.healthy) return this.unhealthyResult<ListEnvironmentsResult>();

    const stamp = this.stamp();
    let environments = this.store
      .listEnvironments(input.filter?.executionEnvironmentRegistryId)
      .map((s) => s.environment);

    if (input.filter) {
      environments = environments.filter((p) => matchesFilter(p, input.filter));
    }

    const limit = input.limit ?? input.filter?.limit;
    if (typeof limit === "number" && limit >= 0) {
      environments = environments.slice(0, limit);
    }

    const registryId =
      input.filter?.executionEnvironmentRegistryId ??
      environments[0]?.executionEnvironmentRegistryId;
    const registry = registryId ? this.store.getRegistry(registryId)?.registry : undefined;

    return {
      ok: true,
      environments,
      registry,
      total: environments.length,
      code: "listed",
      message: `structural environments listed — in-memory only (${stamp})`,
    };
  }

  async findEnvironments(input: FindEnvironmentsInput): Promise<FindEnvironmentsResult> {
    if (!this.healthy) {
      return {
        kind: "execution-environment-result",
        ok: false,
        code: "unhealthy",
        message: this.message,
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        environmentSelectionImplemented: false,
        environmentProvisioningImplemented: false,
        environmentsActivated: false,
      };
    }

    if (!input.filter) {
      return {
        kind: "execution-environment-result",
        ok: false,
        code: "invalid_input",
        message: "filter required",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        environmentSelectionImplemented: false,
        environmentProvisioningImplemented: false,
        environmentsActivated: false,
      };
    }

    const matches = this.store
      .listEnvironments(input.filter.executionEnvironmentRegistryId)
      .map((s) => s.environment)
      .filter((p) => matchesFilter(p, input.filter));

    if (matches.length === 0) {
      return {
        kind: "execution-environment-result",
        ok: false,
        code: "not_found",
        message: "no environment matched structural filter",
        environments: [],
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        environmentSelectionImplemented: false,
        environmentProvisioningImplemented: false,
        environmentsActivated: false,
      };
    }

    const first = matches[0]!;
    const registry = this.store.getRegistry(first.executionEnvironmentRegistryId)?.registry;

    return {
      kind: "execution-environment-result",
      ok: true,
      executionEnvironmentRegistryId: first.executionEnvironmentRegistryId,
      executionEnvironmentId: first.executionEnvironmentId,
      executionId: first.executionId,
      environment: first,
      registry,
      environments: matches,
      code: "found",
      message: "environment(ies) found structurally",
      persistenceImplemented: false,
      databaseUsed: false,
      enginesInvoked: false,
      environmentSelectionImplemented: false,
      environmentProvisioningImplemented: false,
      environmentsActivated: false,
    };
  }
}

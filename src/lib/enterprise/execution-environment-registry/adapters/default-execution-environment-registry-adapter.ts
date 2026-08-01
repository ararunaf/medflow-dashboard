/**
 * DefaultExecutionEnvironmentRegistryAdapter — adapter default in-memory (EPC-24 Sprint 14).
 *
 * Implementação totalmente in-memory.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real.
 * Sem seleção de ambientes. Sem seleção de ambientes. Sem ativação de ambientes.
 *
 * Representa estruturalmente os ambientes disponíveis.
 * Nenhuma Engine é invocada. Nenhum ambiente é selecionado / ativado.
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

export const DEFAULT_EXECUTION_ENVIRONMENT_REGISTRY_ADAPTER_ID = "default-in-process";
export const DEFAULT_EXECUTION_ENVIRONMENT_REGISTRY_VERSION = "1.0.0";

/**
 * Runtime injetável — permite testes sem acoplar a Engines ou produto.
 */
export type DefaultExecutionEnvironmentRegistryRuntime = {
  store?: ExecutionEnvironmentRegistryStore;
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createExecutionEnvironmentRegistryId?: () => string;
  createExecutionEnvironmentId?: () => string;
  createDefinitionId?: () => string;
  createScopeId?: () => string;
  createCategoryId?: () => string;
  now?: () => string;
};

function defaultRuntime(): DefaultExecutionEnvironmentRegistryRuntime {
  return {
    store: new DefaultExecutionEnvironmentRegistryStore(),
  };
}

function nowIso(runtime: DefaultExecutionEnvironmentRegistryRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

export class DefaultExecutionEnvironmentRegistryAdapter implements ExecutionEnvironmentRegistryPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultExecutionEnvironmentRegistryRuntime;
  private readonly store: ExecutionEnvironmentRegistryStore;

  constructor(runtime: DefaultExecutionEnvironmentRegistryRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultExecutionEnvironmentRegistryStore();
  }

  getStore(): ExecutionEnvironmentRegistryStore {
    return this.store;
  }

  capabilities(): ExecutionEnvironmentRegistryPortCapabilities {
    return {
      provider: "default",
      ...foundationCapabilitiesBase(DEFAULT_EXECUTION_ENVIRONMENT_REGISTRY_ADAPTER_ID),
    };
  }

  async health(): Promise<ExecutionEnvironmentRegistryPortHealth> {
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
            ? "Default execution-environment-registry probe ok."
            : "Default execution-environment-registry probe falhou."),
        storedRegistryCount: this.store.registryCount(),
        storedEnvironmentCount: this.store.environmentCount(),
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
        "DefaultExecutionEnvironmentRegistryStore pronto (sem I/O externo — EPC-24 Sprint 14).",
      storedRegistryCount: this.store.registryCount(),
      storedEnvironmentCount: this.store.environmentCount(),
      storedReferenceCount: this.store.referenceCount(),
      storedCategoryCount: this.store.categoryCount(),
      storedScopeCount: this.store.scopeCount(),
      structuralHealth: buildStructuralHealth(this.store, stamp, storeHealth.message),
    };
  }

  async statistics(): Promise<ExecutionEnvironmentStatisticsResult> {
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
      createEnvironmentId:
        this.runtime.createExecutionEnvironmentId ?? createExecutionEnvironmentId,
      createDefinitionId: this.runtime.createDefinitionId ?? createEnvironmentDefinitionId,
      createScopeId: this.runtime.createScopeId ?? createEnvironmentScopeId,
      createCategoryId: this.runtime.createCategoryId ?? createEnvironmentCategoryId,
      createRegistryId:
        this.runtime.createExecutionEnvironmentRegistryId ?? createExecutionEnvironmentRegistryId,
    };
  }

  async registerEnvironment(input: RegisterEnvironmentInput): Promise<RegisterEnvironmentResult> {
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

    const stamp = nowIso(this.runtime);
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
    const stamp = nowIso(this.runtime);
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

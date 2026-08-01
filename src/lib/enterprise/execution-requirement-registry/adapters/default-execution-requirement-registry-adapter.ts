/**
 * DefaultExecutionRequirementRegistryAdapter — adapter default in-memory (EPC-24 Sprint 12).
 *
 * Implementação totalmente in-memory.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real.
 * Sem validação de requisitos. Sem Rule Engine. Sem Decision Engine.
 *
 * Representa estruturalmente as requisitos disponíveis.
 * Nenhuma Engine é invocada. Nenhuma requisito é validada.
 */
import {
  createExecutionRequirementId,
  createExecutionRequirementRegistryId,
  createRequirementCategoryId,
  createRequirementDefinitionId,
  createRequirementScopeId,
} from "../ports/identity";
import type { ExecutionRequirementRegistryPort } from "../ports/execution-requirement-registry-port";
import type {
  ExecutionRequirementRegistryPortCapabilities,
  ExecutionRequirementRegistryPortHealth,
  ExecutionRequirementStatisticsResult,
  FindRequirementsInput,
  FindRequirementsResult,
  GetRequirementInput,
  GetRequirementResult,
  ListRequirementsInput,
  ListRequirementsResult,
  RegisterRequirementInput,
  RegisterRequirementResult,
} from "../ports/types";
import {
  DefaultExecutionRequirementRegistryStore,
  type ExecutionRequirementRegistryStore,
} from "../store";
import {
  appendRequirementToRegistry,
  buildRequirement,
  buildStatistics,
  buildStructuralHealth,
  ensureRequirementRegistry,
  foundationCapabilitiesBase,
  matchesFilter,
  persistRequirement,
} from "./requirement-helpers";

export const DEFAULT_EXECUTION_REQUIREMENT_REGISTRY_ADAPTER_ID = "default-in-process";
export const DEFAULT_EXECUTION_REQUIREMENT_REGISTRY_VERSION = "1.0.0";

/**
 * Runtime injetável — permite testes sem acoplar a Engines ou produto.
 */
export type DefaultExecutionRequirementRegistryRuntime = {
  store?: ExecutionRequirementRegistryStore;
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createExecutionRequirementRegistryId?: () => string;
  createExecutionRequirementId?: () => string;
  createDefinitionId?: () => string;
  createScopeId?: () => string;
  createCategoryId?: () => string;
  now?: () => string;
};

function defaultRuntime(): DefaultExecutionRequirementRegistryRuntime {
  return {
    store: new DefaultExecutionRequirementRegistryStore(),
  };
}

function nowIso(runtime: DefaultExecutionRequirementRegistryRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

export class DefaultExecutionRequirementRegistryAdapter implements ExecutionRequirementRegistryPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultExecutionRequirementRegistryRuntime;
  private readonly store: ExecutionRequirementRegistryStore;

  constructor(runtime: DefaultExecutionRequirementRegistryRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultExecutionRequirementRegistryStore();
  }

  getStore(): ExecutionRequirementRegistryStore {
    return this.store;
  }

  capabilities(): ExecutionRequirementRegistryPortCapabilities {
    return {
      provider: "default",
      ...foundationCapabilitiesBase(DEFAULT_EXECUTION_REQUIREMENT_REGISTRY_ADAPTER_ID),
    };
  }

  async health(): Promise<ExecutionRequirementRegistryPortHealth> {
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
            ? "Default execution-requirement-registry probe ok."
            : "Default execution-requirement-registry probe falhou."),
        storedRegistryCount: this.store.registryCount(),
        storedRequirementCount: this.store.requirementCount(),
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
        "DefaultExecutionRequirementRegistryStore pronto (sem I/O externo — EPC-24 Sprint 12).",
      storedRegistryCount: this.store.registryCount(),
      storedRequirementCount: this.store.requirementCount(),
      storedReferenceCount: this.store.referenceCount(),
      storedCategoryCount: this.store.categoryCount(),
      storedScopeCount: this.store.scopeCount(),
      structuralHealth: buildStructuralHealth(this.store, stamp, storeHealth.message),
    };
  }

  async statistics(): Promise<ExecutionRequirementStatisticsResult> {
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
      createRequirementId:
        this.runtime.createExecutionRequirementId ?? createExecutionRequirementId,
      createDefinitionId: this.runtime.createDefinitionId ?? createRequirementDefinitionId,
      createScopeId: this.runtime.createScopeId ?? createRequirementScopeId,
      createCategoryId: this.runtime.createCategoryId ?? createRequirementCategoryId,
      createRegistryId:
        this.runtime.createExecutionRequirementRegistryId ?? createExecutionRequirementRegistryId,
    };
  }

  async registerRequirement(input: RegisterRequirementInput): Promise<RegisterRequirementResult> {
    if (!input.key || !input.name) {
      return {
        ok: false,
        code: "invalid_input",
        message: "key and name required",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        requirementValidationImplemented: false,
        ruleEngineInvoked: false,
        requirementsValidated: false,
      };
    }

    const stamp = nowIso(this.runtime);
    const factories = this.factories();
    const registry = ensureRequirementRegistry(this.store, input, stamp, factories);

    const existingByKey = this.store.getRequirementByKey(
      registry.executionRequirementRegistryId,
      input.key,
    );
    if (existingByKey) {
      return {
        ok: false,
        code: "already_exists",
        message: "requirement already registered for key in this registry",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        requirementValidationImplemented: false,
        ruleEngineInvoked: false,
        requirementsValidated: false,
      };
    }

    if (input.executionRequirementId && this.store.getRequirement(input.executionRequirementId)) {
      return {
        ok: false,
        code: "already_exists",
        message: "requirement already exists",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        requirementValidationImplemented: false,
        ruleEngineInvoked: false,
        requirementsValidated: false,
      };
    }

    const requirement = buildRequirement(input, registry, stamp, factories);
    persistRequirement(this.store, requirement);
    const updatedRegistry = appendRequirementToRegistry(this.store, registry, requirement, stamp);

    return {
      ok: true,
      requirement,
      registry: updatedRegistry,
      code: "registered",
      message:
        "requirement registered structurally — no validation, no rule engine, no engines invoked",
      persistenceImplemented: false,
      databaseUsed: false,
      enginesInvoked: false,
      requirementValidationImplemented: false,
      ruleEngineInvoked: false,
      requirementsValidated: false,
    };
  }

  async getRequirement(input: GetRequirementInput): Promise<GetRequirementResult> {
    if (!input.executionRequirementId && !input.key) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionRequirementId or key required",
      };
    }

    let stored = input.executionRequirementId
      ? this.store.getRequirement(input.executionRequirementId)
      : undefined;

    if (!stored && input.key) {
      const registryId = input.executionRequirementRegistryId;
      if (registryId) {
        stored = this.store.getRequirementByKey(registryId, input.key);
      } else {
        stored = this.store.listRequirements().find((s) => s.requirement.key === input.key);
      }
    }

    if (!stored) {
      return {
        ok: false,
        code: "not_found",
        message: "requirement not found",
      };
    }

    const registry = this.store.getRegistry(stored.registryId)?.registry;

    return {
      ok: true,
      requirement: stored.requirement,
      registry,
      code: "found",
      message: "requirement retrieved structurally",
    };
  }

  async listRequirements(input: ListRequirementsInput = {}): Promise<ListRequirementsResult> {
    const stamp = nowIso(this.runtime);
    let requirements = this.store
      .listRequirements(input.filter?.executionRequirementRegistryId)
      .map((s) => s.requirement);

    if (input.filter) {
      requirements = requirements.filter((p) => matchesFilter(p, input.filter));
    }

    const limit = input.limit ?? input.filter?.limit;
    if (typeof limit === "number" && limit >= 0) {
      requirements = requirements.slice(0, limit);
    }

    const registryId =
      input.filter?.executionRequirementRegistryId ??
      requirements[0]?.executionRequirementRegistryId;
    const registry = registryId ? this.store.getRegistry(registryId)?.registry : undefined;

    return {
      ok: true,
      requirements,
      registry,
      total: requirements.length,
      code: "listed",
      message: `structural requirements listed — in-memory only (${stamp})`,
    };
  }

  async findRequirements(input: FindRequirementsInput): Promise<FindRequirementsResult> {
    if (!input.filter) {
      return {
        kind: "execution-requirement-result",
        ok: false,
        code: "invalid_input",
        message: "filter required",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        requirementValidationImplemented: false,
        ruleEngineInvoked: false,
        requirementsValidated: false,
      };
    }

    const matches = this.store
      .listRequirements(input.filter.executionRequirementRegistryId)
      .map((s) => s.requirement)
      .filter((p) => matchesFilter(p, input.filter));

    if (matches.length === 0) {
      return {
        kind: "execution-requirement-result",
        ok: false,
        code: "not_found",
        message: "no requirement matched structural filter",
        requirements: [],
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        requirementValidationImplemented: false,
        ruleEngineInvoked: false,
        requirementsValidated: false,
      };
    }

    const first = matches[0]!;
    const registry = this.store.getRegistry(first.executionRequirementRegistryId)?.registry;

    return {
      kind: "execution-requirement-result",
      ok: true,
      executionRequirementRegistryId: first.executionRequirementRegistryId,
      executionRequirementId: first.executionRequirementId,
      executionId: first.executionId,
      requirement: first,
      registry,
      requirements: matches,
      code: "found",
      message: "requirement(ies) found structurally",
      persistenceImplemented: false,
      databaseUsed: false,
      enginesInvoked: false,
      requirementValidationImplemented: false,
      ruleEngineInvoked: false,
      requirementsValidated: false,
    };
  }
}

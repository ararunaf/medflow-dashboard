/**
 * MockExecutionRequirementRegistryAdapter — EPC-24 Sprint 12.
 *
 * Voltado para testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência externa.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real.
 * Sem validação de requisitos. Sem Rule Engine. Sem Decision Engine.
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
  ExecutionRequirementRegistryProviderId,
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

export const MOCK_EXECUTION_REQUIREMENT_REGISTRY_ADAPTER_ID = "mock-in-memory";
export const MOCK_EXECUTION_REQUIREMENT_REGISTRY_VERSION = "1.0.0";

export type MockExecutionRequirementRegistryAdapterOptions = {
  provider?: Extract<ExecutionRequirementRegistryProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: ExecutionRequirementRegistryStore;
  createExecutionRequirementRegistryId?: () => string;
  createExecutionRequirementId?: () => string;
  createDefinitionId?: () => string;
  createScopeId?: () => string;
  createCategoryId?: () => string;
  now?: () => string;
};

export class MockExecutionRequirementRegistryAdapter implements ExecutionRequirementRegistryPort {
  readonly providerId: Extract<ExecutionRequirementRegistryProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: ExecutionRequirementRegistryStore;
  private readonly createRegistryIdFn: () => string;
  private readonly createRequirementIdFn: () => string;
  private readonly createDefinitionIdFn: () => string;
  private readonly createScopeIdFn: () => string;
  private readonly createCategoryIdFn: () => string;
  private readonly now?: () => string;

  constructor(options: MockExecutionRequirementRegistryAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} execution-requirement-registry ready.`;
    this.store = options.store ?? new DefaultExecutionRequirementRegistryStore();
    this.createRegistryIdFn =
      options.createExecutionRequirementRegistryId ?? createExecutionRequirementRegistryId;
    this.createRequirementIdFn =
      options.createExecutionRequirementId ?? createExecutionRequirementId;
    this.createDefinitionIdFn = options.createDefinitionId ?? createRequirementDefinitionId;
    this.createScopeIdFn = options.createScopeId ?? createRequirementScopeId;
    this.createCategoryIdFn = options.createCategoryId ?? createRequirementCategoryId;
    this.now = options.now;
  }

  getStore(): ExecutionRequirementRegistryStore {
    return this.store;
  }

  capabilities(): ExecutionRequirementRegistryPortCapabilities {
    return {
      provider: this.providerId,
      ...foundationCapabilitiesBase(`${this.providerId}-in-memory`),
    };
  }

  async health(): Promise<ExecutionRequirementRegistryPortHealth> {
    const stamp = this.stamp();
    return {
      ok: this.healthy,
      provider: this.providerId,
      message: this.message,
      storedRegistryCount: this.store.registryCount(),
      storedRequirementCount: this.store.requirementCount(),
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
      createRequirementId: this.createRequirementIdFn,
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

  async statistics(): Promise<ExecutionRequirementStatisticsResult> {
    if (!this.healthy) return this.unhealthyResult<ExecutionRequirementStatisticsResult>();
    const stamp = this.stamp();
    return {
      ok: true,
      statistics: buildStatistics(this.store, stamp),
      code: "computed",
      message: "structural statistics computed — in-memory only",
    };
  }

  async registerRequirement(input: RegisterRequirementInput): Promise<RegisterRequirementResult> {
    if (!this.healthy) {
      return this.unhealthyResult<RegisterRequirementResult>({
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        requirementValidationImplemented: false,
        ruleEngineInvoked: false,
        requirementsValidated: false,
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
        requirementValidationImplemented: false,
        ruleEngineInvoked: false,
        requirementsValidated: false,
      };
    }

    const stamp = this.stamp();
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
    if (!this.healthy) return this.unhealthyResult<GetRequirementResult>();

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
    if (!this.healthy) return this.unhealthyResult<ListRequirementsResult>();

    const stamp = this.stamp();
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
    if (!this.healthy) {
      return {
        kind: "execution-requirement-result",
        ok: false,
        code: "unhealthy",
        message: this.message,
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        requirementValidationImplemented: false,
        ruleEngineInvoked: false,
        requirementsValidated: false,
      };
    }

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

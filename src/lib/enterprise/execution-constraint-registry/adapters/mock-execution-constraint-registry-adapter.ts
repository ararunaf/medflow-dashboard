/**
 * MockExecutionConstraintRegistryAdapter — EPC-24 Sprint 11.
 *
 * Voltado para testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência externa.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real.
 * Sem interpretação de restrições. Sem Rule Engine. Sem Decision Engine.
 */
import {
  createExecutionConstraintId,
  createExecutionConstraintRegistryId,
  createConstraintCategoryId,
  createConstraintDefinitionId,
  createConstraintScopeId,
} from "../ports/identity";
import type { ExecutionConstraintRegistryPort } from "../ports/execution-constraint-registry-port";
import type {
  ExecutionConstraintRegistryPortCapabilities,
  ExecutionConstraintRegistryPortHealth,
  ExecutionConstraintRegistryProviderId,
  ExecutionConstraintStatisticsResult,
  FindConstraintsInput,
  FindConstraintsResult,
  GetConstraintInput,
  GetConstraintResult,
  ListConstraintsInput,
  ListConstraintsResult,
  RegisterConstraintInput,
  RegisterConstraintResult,
} from "../ports/types";
import {
  DefaultExecutionConstraintRegistryStore,
  type ExecutionConstraintRegistryStore,
} from "../store";
import {
  appendConstraintToRegistry,
  buildConstraint,
  buildStatistics,
  buildStructuralHealth,
  ensureConstraintRegistry,
  foundationCapabilitiesBase,
  matchesFilter,
  persistConstraint,
} from "./constraint-helpers";

export const MOCK_EXECUTION_CONSTRAINT_REGISTRY_ADAPTER_ID = "mock-in-memory";
export const MOCK_EXECUTION_CONSTRAINT_REGISTRY_VERSION = "1.0.0";

export type MockExecutionConstraintRegistryAdapterOptions = {
  provider?: Extract<ExecutionConstraintRegistryProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: ExecutionConstraintRegistryStore;
  createExecutionConstraintRegistryId?: () => string;
  createExecutionConstraintId?: () => string;
  createDefinitionId?: () => string;
  createScopeId?: () => string;
  createCategoryId?: () => string;
  now?: () => string;
};

export class MockExecutionConstraintRegistryAdapter implements ExecutionConstraintRegistryPort {
  readonly providerId: Extract<ExecutionConstraintRegistryProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: ExecutionConstraintRegistryStore;
  private readonly createRegistryIdFn: () => string;
  private readonly createConstraintIdFn: () => string;
  private readonly createDefinitionIdFn: () => string;
  private readonly createScopeIdFn: () => string;
  private readonly createCategoryIdFn: () => string;
  private readonly now?: () => string;

  constructor(options: MockExecutionConstraintRegistryAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} execution-constraint-registry ready.`;
    this.store = options.store ?? new DefaultExecutionConstraintRegistryStore();
    this.createRegistryIdFn =
      options.createExecutionConstraintRegistryId ?? createExecutionConstraintRegistryId;
    this.createConstraintIdFn = options.createExecutionConstraintId ?? createExecutionConstraintId;
    this.createDefinitionIdFn = options.createDefinitionId ?? createConstraintDefinitionId;
    this.createScopeIdFn = options.createScopeId ?? createConstraintScopeId;
    this.createCategoryIdFn = options.createCategoryId ?? createConstraintCategoryId;
    this.now = options.now;
  }

  getStore(): ExecutionConstraintRegistryStore {
    return this.store;
  }

  capabilities(): ExecutionConstraintRegistryPortCapabilities {
    return {
      provider: this.providerId,
      ...foundationCapabilitiesBase(`${this.providerId}-in-memory`),
    };
  }

  async health(): Promise<ExecutionConstraintRegistryPortHealth> {
    const stamp = this.stamp();
    return {
      ok: this.healthy,
      provider: this.providerId,
      message: this.message,
      storedRegistryCount: this.store.registryCount(),
      storedConstraintCount: this.store.constraintCount(),
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
      createConstraintId: this.createConstraintIdFn,
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

  async statistics(): Promise<ExecutionConstraintStatisticsResult> {
    if (!this.healthy) return this.unhealthyResult<ExecutionConstraintStatisticsResult>();
    const stamp = this.stamp();
    return {
      ok: true,
      statistics: buildStatistics(this.store, stamp),
      code: "computed",
      message: "structural statistics computed — in-memory only",
    };
  }

  async registerConstraint(input: RegisterConstraintInput): Promise<RegisterConstraintResult> {
    if (!this.healthy) {
      return this.unhealthyResult<RegisterConstraintResult>({
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        constraintValidationImplemented: false,
        ruleEngineInvoked: false,
        constraintsValidated: false,
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
        constraintValidationImplemented: false,
        ruleEngineInvoked: false,
        constraintsValidated: false,
      };
    }

    const stamp = this.stamp();
    const factories = this.factories();
    const registry = ensureConstraintRegistry(this.store, input, stamp, factories);

    const existingByKey = this.store.getConstraintByKey(
      registry.executionConstraintRegistryId,
      input.key,
    );
    if (existingByKey) {
      return {
        ok: false,
        code: "already_exists",
        message: "constraint already registered for key in this registry",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        constraintValidationImplemented: false,
        ruleEngineInvoked: false,
        constraintsValidated: false,
      };
    }

    if (input.executionConstraintId && this.store.getConstraint(input.executionConstraintId)) {
      return {
        ok: false,
        code: "already_exists",
        message: "constraint already exists",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        constraintValidationImplemented: false,
        ruleEngineInvoked: false,
        constraintsValidated: false,
      };
    }

    const constraint = buildConstraint(input, registry, stamp, factories);
    persistConstraint(this.store, constraint);
    const updatedRegistry = appendConstraintToRegistry(this.store, registry, constraint, stamp);

    return {
      ok: true,
      constraint,
      registry: updatedRegistry,
      code: "registered",
      message:
        "constraint registered structurally — no evaluation, no rule engine, no engines invoked",
      persistenceImplemented: false,
      databaseUsed: false,
      enginesInvoked: false,
      constraintValidationImplemented: false,
      ruleEngineInvoked: false,
      constraintsValidated: false,
    };
  }

  async getConstraint(input: GetConstraintInput): Promise<GetConstraintResult> {
    if (!this.healthy) return this.unhealthyResult<GetConstraintResult>();

    if (!input.executionConstraintId && !input.key) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionConstraintId or key required",
      };
    }

    let stored = input.executionConstraintId
      ? this.store.getConstraint(input.executionConstraintId)
      : undefined;

    if (!stored && input.key) {
      const registryId = input.executionConstraintRegistryId;
      if (registryId) {
        stored = this.store.getConstraintByKey(registryId, input.key);
      } else {
        stored = this.store.listConstraints().find((s) => s.constraint.key === input.key);
      }
    }

    if (!stored) {
      return {
        ok: false,
        code: "not_found",
        message: "constraint not found",
      };
    }

    const registry = this.store.getRegistry(stored.registryId)?.registry;

    return {
      ok: true,
      constraint: stored.constraint,
      registry,
      code: "found",
      message: "constraint retrieved structurally",
    };
  }

  async listConstraints(input: ListConstraintsInput = {}): Promise<ListConstraintsResult> {
    if (!this.healthy) return this.unhealthyResult<ListConstraintsResult>();

    const stamp = this.stamp();
    let constraints = this.store
      .listConstraints(input.filter?.executionConstraintRegistryId)
      .map((s) => s.constraint);

    if (input.filter) {
      constraints = constraints.filter((p) => matchesFilter(p, input.filter));
    }

    const limit = input.limit ?? input.filter?.limit;
    if (typeof limit === "number" && limit >= 0) {
      constraints = constraints.slice(0, limit);
    }

    const registryId =
      input.filter?.executionConstraintRegistryId ?? constraints[0]?.executionConstraintRegistryId;
    const registry = registryId ? this.store.getRegistry(registryId)?.registry : undefined;

    return {
      ok: true,
      constraints,
      registry,
      total: constraints.length,
      code: "listed",
      message: `structural constraints listed — in-memory only (${stamp})`,
    };
  }

  async findConstraints(input: FindConstraintsInput): Promise<FindConstraintsResult> {
    if (!this.healthy) {
      return {
        kind: "execution-constraint-result",
        ok: false,
        code: "unhealthy",
        message: this.message,
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        constraintValidationImplemented: false,
        ruleEngineInvoked: false,
        constraintsValidated: false,
      };
    }

    if (!input.filter) {
      return {
        kind: "execution-constraint-result",
        ok: false,
        code: "invalid_input",
        message: "filter required",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        constraintValidationImplemented: false,
        ruleEngineInvoked: false,
        constraintsValidated: false,
      };
    }

    const matches = this.store
      .listConstraints(input.filter.executionConstraintRegistryId)
      .map((s) => s.constraint)
      .filter((p) => matchesFilter(p, input.filter));

    if (matches.length === 0) {
      return {
        kind: "execution-constraint-result",
        ok: false,
        code: "not_found",
        message: "no constraint matched structural filter",
        constraints: [],
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        constraintValidationImplemented: false,
        ruleEngineInvoked: false,
        constraintsValidated: false,
      };
    }

    const first = matches[0]!;
    const registry = this.store.getRegistry(first.executionConstraintRegistryId)?.registry;

    return {
      kind: "execution-constraint-result",
      ok: true,
      executionConstraintRegistryId: first.executionConstraintRegistryId,
      executionConstraintId: first.executionConstraintId,
      executionId: first.executionId,
      constraint: first,
      registry,
      constraints: matches,
      code: "found",
      message: "constraint(ies) found structurally",
      persistenceImplemented: false,
      databaseUsed: false,
      enginesInvoked: false,
      constraintValidationImplemented: false,
      ruleEngineInvoked: false,
      constraintsValidated: false,
    };
  }
}

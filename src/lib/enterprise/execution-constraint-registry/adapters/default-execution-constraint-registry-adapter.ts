/**
 * DefaultExecutionConstraintRegistryAdapter — adapter default in-memory (EPC-24 Sprint 11).
 *
 * Implementação totalmente in-memory.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real.
 * Sem interpretação de restrições. Sem Rule Engine. Sem Decision Engine.
 *
 * Representa estruturalmente as restrições disponíveis.
 * Nenhuma Engine é invocada. Nenhuma restrição é avaliada.
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

export const DEFAULT_EXECUTION_CONSTRAINT_REGISTRY_ADAPTER_ID = "default-in-process";
export const DEFAULT_EXECUTION_CONSTRAINT_REGISTRY_VERSION = "1.0.0";

/**
 * Runtime injetável — permite testes sem acoplar a Engines ou produto.
 */
export type DefaultExecutionConstraintRegistryRuntime = {
  store?: ExecutionConstraintRegistryStore;
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createExecutionConstraintRegistryId?: () => string;
  createExecutionConstraintId?: () => string;
  createDefinitionId?: () => string;
  createScopeId?: () => string;
  createCategoryId?: () => string;
  now?: () => string;
};

function defaultRuntime(): DefaultExecutionConstraintRegistryRuntime {
  return {
    store: new DefaultExecutionConstraintRegistryStore(),
  };
}

function nowIso(runtime: DefaultExecutionConstraintRegistryRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

export class DefaultExecutionConstraintRegistryAdapter implements ExecutionConstraintRegistryPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultExecutionConstraintRegistryRuntime;
  private readonly store: ExecutionConstraintRegistryStore;

  constructor(runtime: DefaultExecutionConstraintRegistryRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultExecutionConstraintRegistryStore();
  }

  getStore(): ExecutionConstraintRegistryStore {
    return this.store;
  }

  capabilities(): ExecutionConstraintRegistryPortCapabilities {
    return {
      provider: "default",
      ...foundationCapabilitiesBase(DEFAULT_EXECUTION_CONSTRAINT_REGISTRY_ADAPTER_ID),
    };
  }

  async health(): Promise<ExecutionConstraintRegistryPortHealth> {
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
            ? "Default execution-constraint-registry probe ok."
            : "Default execution-constraint-registry probe falhou."),
        storedRegistryCount: this.store.registryCount(),
        storedConstraintCount: this.store.constraintCount(),
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
        "DefaultExecutionConstraintRegistryStore pronto (sem I/O externo — EPC-24 Sprint 11).",
      storedRegistryCount: this.store.registryCount(),
      storedConstraintCount: this.store.constraintCount(),
      storedReferenceCount: this.store.referenceCount(),
      storedCategoryCount: this.store.categoryCount(),
      storedScopeCount: this.store.scopeCount(),
      structuralHealth: buildStructuralHealth(this.store, stamp, storeHealth.message),
    };
  }

  async statistics(): Promise<ExecutionConstraintStatisticsResult> {
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
      createConstraintId: this.runtime.createExecutionConstraintId ?? createExecutionConstraintId,
      createDefinitionId: this.runtime.createDefinitionId ?? createConstraintDefinitionId,
      createScopeId: this.runtime.createScopeId ?? createConstraintScopeId,
      createCategoryId: this.runtime.createCategoryId ?? createConstraintCategoryId,
      createRegistryId:
        this.runtime.createExecutionConstraintRegistryId ?? createExecutionConstraintRegistryId,
    };
  }

  async registerConstraint(input: RegisterConstraintInput): Promise<RegisterConstraintResult> {
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

    const stamp = nowIso(this.runtime);
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
    const stamp = nowIso(this.runtime);
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

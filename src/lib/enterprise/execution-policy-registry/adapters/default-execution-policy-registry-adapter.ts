/**
 * DefaultExecutionPolicyRegistryAdapter — adapter default in-memory (EPC-24 Sprint 10).
 *
 * Implementação totalmente in-memory.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real.
 * Sem interpretação de políticas. Sem Rule Engine. Sem Decision Engine.
 *
 * Representa estruturalmente as políticas disponíveis.
 * Nenhuma Engine é invocada. Nenhuma política é avaliada.
 */
import {
  createExecutionPolicyId,
  createExecutionPolicyRegistryId,
  createPolicyCategoryId,
  createPolicyDefinitionId,
  createPolicyScopeId,
} from "../ports/identity";
import type { ExecutionPolicyRegistryPort } from "../ports/execution-policy-registry-port";
import type {
  ExecutionPolicyRegistryPortCapabilities,
  ExecutionPolicyRegistryPortHealth,
  ExecutionPolicyStatisticsResult,
  FindPoliciesInput,
  FindPoliciesResult,
  GetPolicyInput,
  GetPolicyResult,
  ListPoliciesInput,
  ListPoliciesResult,
  RegisterPolicyInput,
  RegisterPolicyResult,
} from "../ports/types";
import { DefaultExecutionPolicyRegistryStore, type ExecutionPolicyRegistryStore } from "../store";
import {
  appendPolicyToRegistry,
  buildPolicy,
  buildStatistics,
  buildStructuralHealth,
  ensurePolicyRegistry,
  foundationCapabilitiesBase,
  matchesFilter,
  persistPolicy,
} from "./policy-helpers";

export const DEFAULT_EXECUTION_POLICY_REGISTRY_ADAPTER_ID = "default-in-process";
export const DEFAULT_EXECUTION_POLICY_REGISTRY_VERSION = "1.0.0";

/**
 * Runtime injetável — permite testes sem acoplar a Engines ou produto.
 */
export type DefaultExecutionPolicyRegistryRuntime = {
  store?: ExecutionPolicyRegistryStore;
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createExecutionPolicyRegistryId?: () => string;
  createExecutionPolicyId?: () => string;
  createDefinitionId?: () => string;
  createScopeId?: () => string;
  createCategoryId?: () => string;
  now?: () => string;
};

function defaultRuntime(): DefaultExecutionPolicyRegistryRuntime {
  return {
    store: new DefaultExecutionPolicyRegistryStore(),
  };
}

function nowIso(runtime: DefaultExecutionPolicyRegistryRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

export class DefaultExecutionPolicyRegistryAdapter implements ExecutionPolicyRegistryPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultExecutionPolicyRegistryRuntime;
  private readonly store: ExecutionPolicyRegistryStore;

  constructor(runtime: DefaultExecutionPolicyRegistryRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultExecutionPolicyRegistryStore();
  }

  getStore(): ExecutionPolicyRegistryStore {
    return this.store;
  }

  capabilities(): ExecutionPolicyRegistryPortCapabilities {
    return {
      provider: "default",
      ...foundationCapabilitiesBase(DEFAULT_EXECUTION_POLICY_REGISTRY_ADAPTER_ID),
    };
  }

  async health(): Promise<ExecutionPolicyRegistryPortHealth> {
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
            ? "Default execution-policy-registry probe ok."
            : "Default execution-policy-registry probe falhou."),
        storedRegistryCount: this.store.registryCount(),
        storedPolicyCount: this.store.policyCount(),
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
        "DefaultExecutionPolicyRegistryStore pronto (sem I/O externo — EPC-24 Sprint 10).",
      storedRegistryCount: this.store.registryCount(),
      storedPolicyCount: this.store.policyCount(),
      storedReferenceCount: this.store.referenceCount(),
      storedCategoryCount: this.store.categoryCount(),
      storedScopeCount: this.store.scopeCount(),
      structuralHealth: buildStructuralHealth(this.store, stamp, storeHealth.message),
    };
  }

  async statistics(): Promise<ExecutionPolicyStatisticsResult> {
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
      createPolicyId: this.runtime.createExecutionPolicyId ?? createExecutionPolicyId,
      createDefinitionId: this.runtime.createDefinitionId ?? createPolicyDefinitionId,
      createScopeId: this.runtime.createScopeId ?? createPolicyScopeId,
      createCategoryId: this.runtime.createCategoryId ?? createPolicyCategoryId,
      createRegistryId:
        this.runtime.createExecutionPolicyRegistryId ?? createExecutionPolicyRegistryId,
    };
  }

  async registerPolicy(input: RegisterPolicyInput): Promise<RegisterPolicyResult> {
    if (!input.key || !input.name) {
      return {
        ok: false,
        code: "invalid_input",
        message: "key and name required",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        policyInterpretationImplemented: false,
        ruleEngineInvoked: false,
        policiesEvaluated: false,
      };
    }

    const stamp = nowIso(this.runtime);
    const factories = this.factories();
    const registry = ensurePolicyRegistry(this.store, input, stamp, factories);

    const existingByKey = this.store.getPolicyByKey(registry.executionPolicyRegistryId, input.key);
    if (existingByKey) {
      return {
        ok: false,
        code: "already_exists",
        message: "policy already registered for key in this registry",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        policyInterpretationImplemented: false,
        ruleEngineInvoked: false,
        policiesEvaluated: false,
      };
    }

    if (input.executionPolicyId && this.store.getPolicy(input.executionPolicyId)) {
      return {
        ok: false,
        code: "already_exists",
        message: "policy already exists",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        policyInterpretationImplemented: false,
        ruleEngineInvoked: false,
        policiesEvaluated: false,
      };
    }

    const policy = buildPolicy(input, registry, stamp, factories);
    persistPolicy(this.store, policy);
    const updatedRegistry = appendPolicyToRegistry(this.store, registry, policy, stamp);

    return {
      ok: true,
      policy,
      registry: updatedRegistry,
      code: "registered",
      message: "policy registered structurally — no evaluation, no rule engine, no engines invoked",
      persistenceImplemented: false,
      databaseUsed: false,
      enginesInvoked: false,
      policyInterpretationImplemented: false,
      ruleEngineInvoked: false,
      policiesEvaluated: false,
    };
  }

  async getPolicy(input: GetPolicyInput): Promise<GetPolicyResult> {
    if (!input.executionPolicyId && !input.key) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionPolicyId or key required",
      };
    }

    let stored = input.executionPolicyId
      ? this.store.getPolicy(input.executionPolicyId)
      : undefined;

    if (!stored && input.key) {
      const registryId = input.executionPolicyRegistryId;
      if (registryId) {
        stored = this.store.getPolicyByKey(registryId, input.key);
      } else {
        stored = this.store.listPolicies().find((s) => s.policy.key === input.key);
      }
    }

    if (!stored) {
      return {
        ok: false,
        code: "not_found",
        message: "policy not found",
      };
    }

    const registry = this.store.getRegistry(stored.registryId)?.registry;

    return {
      ok: true,
      policy: stored.policy,
      registry,
      code: "found",
      message: "policy retrieved structurally",
    };
  }

  async listPolicies(input: ListPoliciesInput = {}): Promise<ListPoliciesResult> {
    const stamp = nowIso(this.runtime);
    let policies = this.store
      .listPolicies(input.filter?.executionPolicyRegistryId)
      .map((s) => s.policy);

    if (input.filter) {
      policies = policies.filter((p) => matchesFilter(p, input.filter));
    }

    const limit = input.limit ?? input.filter?.limit;
    if (typeof limit === "number" && limit >= 0) {
      policies = policies.slice(0, limit);
    }

    const registryId =
      input.filter?.executionPolicyRegistryId ?? policies[0]?.executionPolicyRegistryId;
    const registry = registryId ? this.store.getRegistry(registryId)?.registry : undefined;

    return {
      ok: true,
      policies,
      registry,
      total: policies.length,
      code: "listed",
      message: `structural policies listed — in-memory only (${stamp})`,
    };
  }

  async findPolicies(input: FindPoliciesInput): Promise<FindPoliciesResult> {
    if (!input.filter) {
      return {
        kind: "execution-policy-result",
        ok: false,
        code: "invalid_input",
        message: "filter required",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        policyInterpretationImplemented: false,
        ruleEngineInvoked: false,
        policiesEvaluated: false,
      };
    }

    const matches = this.store
      .listPolicies(input.filter.executionPolicyRegistryId)
      .map((s) => s.policy)
      .filter((p) => matchesFilter(p, input.filter));

    if (matches.length === 0) {
      return {
        kind: "execution-policy-result",
        ok: false,
        code: "not_found",
        message: "no policy matched structural filter",
        policies: [],
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        policyInterpretationImplemented: false,
        ruleEngineInvoked: false,
        policiesEvaluated: false,
      };
    }

    const first = matches[0]!;
    const registry = this.store.getRegistry(first.executionPolicyRegistryId)?.registry;

    return {
      kind: "execution-policy-result",
      ok: true,
      executionPolicyRegistryId: first.executionPolicyRegistryId,
      executionPolicyId: first.executionPolicyId,
      executionId: first.executionId,
      policy: first,
      registry,
      policies: matches,
      code: "found",
      message: "policy(ies) found structurally",
      persistenceImplemented: false,
      databaseUsed: false,
      enginesInvoked: false,
      policyInterpretationImplemented: false,
      ruleEngineInvoked: false,
      policiesEvaluated: false,
    };
  }
}

/**
 * MockExecutionPolicyRegistryAdapter — EPC-24 Sprint 10.
 *
 * Voltado para testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência externa.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real.
 * Sem interpretação de políticas. Sem Rule Engine. Sem Decision Engine.
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
  ExecutionPolicyRegistryProviderId,
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

export const MOCK_EXECUTION_POLICY_REGISTRY_ADAPTER_ID = "mock-in-memory";
export const MOCK_EXECUTION_POLICY_REGISTRY_VERSION = "1.0.0";

export type MockExecutionPolicyRegistryAdapterOptions = {
  provider?: Extract<ExecutionPolicyRegistryProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: ExecutionPolicyRegistryStore;
  createExecutionPolicyRegistryId?: () => string;
  createExecutionPolicyId?: () => string;
  createDefinitionId?: () => string;
  createScopeId?: () => string;
  createCategoryId?: () => string;
  now?: () => string;
};

export class MockExecutionPolicyRegistryAdapter implements ExecutionPolicyRegistryPort {
  readonly providerId: Extract<ExecutionPolicyRegistryProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: ExecutionPolicyRegistryStore;
  private readonly createRegistryIdFn: () => string;
  private readonly createPolicyIdFn: () => string;
  private readonly createDefinitionIdFn: () => string;
  private readonly createScopeIdFn: () => string;
  private readonly createCategoryIdFn: () => string;
  private readonly now?: () => string;

  constructor(options: MockExecutionPolicyRegistryAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} execution-policy-registry ready.`;
    this.store = options.store ?? new DefaultExecutionPolicyRegistryStore();
    this.createRegistryIdFn =
      options.createExecutionPolicyRegistryId ?? createExecutionPolicyRegistryId;
    this.createPolicyIdFn = options.createExecutionPolicyId ?? createExecutionPolicyId;
    this.createDefinitionIdFn = options.createDefinitionId ?? createPolicyDefinitionId;
    this.createScopeIdFn = options.createScopeId ?? createPolicyScopeId;
    this.createCategoryIdFn = options.createCategoryId ?? createPolicyCategoryId;
    this.now = options.now;
  }

  getStore(): ExecutionPolicyRegistryStore {
    return this.store;
  }

  capabilities(): ExecutionPolicyRegistryPortCapabilities {
    return {
      provider: this.providerId,
      ...foundationCapabilitiesBase(`${this.providerId}-in-memory`),
    };
  }

  async health(): Promise<ExecutionPolicyRegistryPortHealth> {
    const stamp = this.stamp();
    return {
      ok: this.healthy,
      provider: this.providerId,
      message: this.message,
      storedRegistryCount: this.store.registryCount(),
      storedPolicyCount: this.store.policyCount(),
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
      createPolicyId: this.createPolicyIdFn,
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

  async statistics(): Promise<ExecutionPolicyStatisticsResult> {
    if (!this.healthy) return this.unhealthyResult<ExecutionPolicyStatisticsResult>();
    const stamp = this.stamp();
    return {
      ok: true,
      statistics: buildStatistics(this.store, stamp),
      code: "computed",
      message: "structural statistics computed — in-memory only",
    };
  }

  async registerPolicy(input: RegisterPolicyInput): Promise<RegisterPolicyResult> {
    if (!this.healthy) {
      return this.unhealthyResult<RegisterPolicyResult>({
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        policyInterpretationImplemented: false,
        ruleEngineInvoked: false,
        policiesEvaluated: false,
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
        policyInterpretationImplemented: false,
        ruleEngineInvoked: false,
        policiesEvaluated: false,
      };
    }

    const stamp = this.stamp();
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
    if (!this.healthy) return this.unhealthyResult<GetPolicyResult>();

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
    if (!this.healthy) return this.unhealthyResult<ListPoliciesResult>();

    const stamp = this.stamp();
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
    if (!this.healthy) {
      return {
        kind: "execution-policy-result",
        ok: false,
        code: "unhealthy",
        message: this.message,
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
        policyInterpretationImplemented: false,
        ruleEngineInvoked: false,
        policiesEvaluated: false,
      };
    }

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

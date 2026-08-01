/**
 * DefaultExecutionPolicyRegistryStore — store in-process padrão (EPC-24 Sprint 10).
 *
 * Armazenamento estrutural in-memory apenas.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real. Sem cache distribuído.
 */
import type {
  ExecutionPolicyRegistryStore,
  StoredExecutionPolicy,
  StoredExecutionPolicyRegistry,
} from "./execution-policy-registry-store";

export const DEFAULT_EXECUTION_POLICY_REGISTRY_STORE_ID = "default-in-process";

export type DefaultExecutionPolicyRegistryStoreOptions = {
  registries?: readonly StoredExecutionPolicyRegistry[];
  policies?: readonly StoredExecutionPolicy[];
};

export class DefaultExecutionPolicyRegistryStore implements ExecutionPolicyRegistryStore {
  readonly storeId = DEFAULT_EXECUTION_POLICY_REGISTRY_STORE_ID;
  private readonly registries = new Map<string, StoredExecutionPolicyRegistry>();
  private readonly byExecution = new Map<string, string>();
  private readonly policies = new Map<string, StoredExecutionPolicy>();
  private readonly byRegistryKey = new Map<string, string>();

  constructor(options: DefaultExecutionPolicyRegistryStoreOptions = {}) {
    for (const stored of options.registries ?? []) {
      this.setRegistry(stored);
    }
    for (const stored of options.policies ?? []) {
      this.setPolicy(stored);
    }
  }

  getRegistry(executionPolicyRegistryId: string): StoredExecutionPolicyRegistry | undefined {
    return this.registries.get(executionPolicyRegistryId);
  }

  getRegistryByExecution(executionId: string): StoredExecutionPolicyRegistry | undefined {
    const registryId = this.byExecution.get(executionId);
    if (!registryId) return undefined;
    return this.registries.get(registryId);
  }

  setRegistry(stored: StoredExecutionPolicyRegistry): void {
    this.registries.set(stored.registry.executionPolicyRegistryId, stored);
    if (stored.registry.executionId) {
      this.byExecution.set(stored.registry.executionId, stored.registry.executionPolicyRegistryId);
    }
  }

  listRegistries(): readonly StoredExecutionPolicyRegistry[] {
    return [...this.registries.values()];
  }

  getPolicy(executionPolicyId: string): StoredExecutionPolicy | undefined {
    return this.policies.get(executionPolicyId);
  }

  getPolicyByKey(
    executionPolicyRegistryId: string,
    key: string,
  ): StoredExecutionPolicy | undefined {
    const policyId = this.byRegistryKey.get(`${executionPolicyRegistryId}::${key}`);
    if (!policyId) return undefined;
    return this.policies.get(policyId);
  }

  setPolicy(stored: StoredExecutionPolicy): void {
    this.policies.set(stored.policy.executionPolicyId, stored);
    this.byRegistryKey.set(
      `${stored.registryId}::${stored.policy.key}`,
      stored.policy.executionPolicyId,
    );
  }

  listPolicies(executionPolicyRegistryId?: string): readonly StoredExecutionPolicy[] {
    const all = [...this.policies.values()];
    if (!executionPolicyRegistryId) return all;
    return all.filter((s) => s.registryId === executionPolicyRegistryId);
  }

  removePolicy(executionPolicyId: string): boolean {
    const existing = this.policies.get(executionPolicyId);
    if (!existing) return false;
    this.byRegistryKey.delete(`${existing.registryId}::${existing.policy.key}`);
    return this.policies.delete(executionPolicyId);
  }

  registryCount(): number {
    return this.registries.size;
  }

  policyCount(): number {
    return this.policies.size;
  }

  referenceCount(): number {
    let total = 0;
    for (const stored of this.registries.values()) {
      total += stored.registry.references.length;
    }
    for (const stored of this.policies.values()) {
      total += stored.policy.references.length;
    }
    return total;
  }

  categoryCount(): number {
    const categories = new Set<string>();
    for (const stored of this.policies.values()) {
      categories.add(stored.policy.category.category);
    }
    return categories.size;
  }

  scopeCount(): number {
    const scopes = new Set<string>();
    for (const stored of this.policies.values()) {
      scopes.add(stored.policy.scope.scope);
    }
    return scopes.size;
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultExecutionPolicyRegistryStore ready (${this.registries.size} registries, ${this.policies.size} policies).`,
    };
  }
}

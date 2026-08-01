/**
 * DefaultExecutionEnvironmentRegistryStore — store in-process padrão (EPC-24 Sprint 14).
 *
 * Armazenamento estrutural in-memory apenas.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real. Sem cache distribuído.
 */
import type {
  ExecutionEnvironmentRegistryStore,
  StoredExecutionEnvironment,
  StoredExecutionEnvironmentRegistry,
} from "./execution-environment-registry-store";

export const DEFAULT_EXECUTION_ENVIRONMENT_REGISTRY_STORE_ID = "default-in-process";

export type DefaultExecutionEnvironmentRegistryStoreOptions = {
  registries?: readonly StoredExecutionEnvironmentRegistry[];
  environments?: readonly StoredExecutionEnvironment[];
};

export class DefaultExecutionEnvironmentRegistryStore implements ExecutionEnvironmentRegistryStore {
  readonly storeId = DEFAULT_EXECUTION_ENVIRONMENT_REGISTRY_STORE_ID;
  private readonly registries = new Map<string, StoredExecutionEnvironmentRegistry>();
  private readonly byExecution = new Map<string, string>();
  private readonly environments = new Map<string, StoredExecutionEnvironment>();
  private readonly byRegistryKey = new Map<string, string>();

  constructor(options: DefaultExecutionEnvironmentRegistryStoreOptions = {}) {
    for (const stored of options.registries ?? []) {
      this.setRegistry(stored);
    }
    for (const stored of options.environments ?? []) {
      this.setEnvironment(stored);
    }
  }

  getRegistry(
    executionEnvironmentRegistryId: string,
  ): StoredExecutionEnvironmentRegistry | undefined {
    return this.registries.get(executionEnvironmentRegistryId);
  }

  getRegistryByExecution(executionId: string): StoredExecutionEnvironmentRegistry | undefined {
    const registryId = this.byExecution.get(executionId);
    if (!registryId) return undefined;
    return this.registries.get(registryId);
  }

  setRegistry(stored: StoredExecutionEnvironmentRegistry): void {
    this.registries.set(stored.registry.executionEnvironmentRegistryId, stored);
    if (stored.registry.executionId) {
      this.byExecution.set(
        stored.registry.executionId,
        stored.registry.executionEnvironmentRegistryId,
      );
    }
  }

  listRegistries(): readonly StoredExecutionEnvironmentRegistry[] {
    return [...this.registries.values()];
  }

  getEnvironment(executionEnvironmentId: string): StoredExecutionEnvironment | undefined {
    return this.environments.get(executionEnvironmentId);
  }

  getEnvironmentByKey(
    executionEnvironmentRegistryId: string,
    key: string,
  ): StoredExecutionEnvironment | undefined {
    const environmentId = this.byRegistryKey.get(`${executionEnvironmentRegistryId}::${key}`);
    if (!environmentId) return undefined;
    return this.environments.get(environmentId);
  }

  setEnvironment(stored: StoredExecutionEnvironment): void {
    this.environments.set(stored.environment.executionEnvironmentId, stored);
    this.byRegistryKey.set(
      `${stored.registryId}::${stored.environment.key}`,
      stored.environment.executionEnvironmentId,
    );
  }

  listEnvironments(executionEnvironmentRegistryId?: string): readonly StoredExecutionEnvironment[] {
    const all = [...this.environments.values()];
    if (!executionEnvironmentRegistryId) return all;
    return all.filter((s) => s.registryId === executionEnvironmentRegistryId);
  }

  removeEnvironment(executionEnvironmentId: string): boolean {
    const existing = this.environments.get(executionEnvironmentId);
    if (!existing) return false;
    this.byRegistryKey.delete(`${existing.registryId}::${existing.environment.key}`);
    return this.environments.delete(executionEnvironmentId);
  }

  registryCount(): number {
    return this.registries.size;
  }

  environmentCount(): number {
    return this.environments.size;
  }

  referenceCount(): number {
    let total = 0;
    for (const stored of this.registries.values()) {
      total += stored.registry.references.length;
    }
    for (const stored of this.environments.values()) {
      total += stored.environment.references.length;
    }
    return total;
  }

  categoryCount(): number {
    const categories = new Set<string>();
    for (const stored of this.environments.values()) {
      categories.add(stored.environment.category.category);
    }
    return categories.size;
  }

  scopeCount(): number {
    const scopes = new Set<string>();
    for (const stored of this.environments.values()) {
      scopes.add(stored.environment.scope.scope);
    }
    return scopes.size;
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultExecutionEnvironmentRegistryStore ready (${this.registries.size} registries, ${this.environments.size} environments).`,
    };
  }
}

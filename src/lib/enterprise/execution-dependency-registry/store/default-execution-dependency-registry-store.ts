/**
 * DefaultExecutionDependencyRegistryStore — store in-process padrão (EPC-24 Sprint 09).
 *
 * Armazenamento estrutural in-memory apenas.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real. Sem cache distribuído.
 */
import type {
  ExecutionDependencyRegistryStore,
  StoredExecutionDependency,
  StoredExecutionDependencyRegistry,
} from "./execution-dependency-registry-store";

export const DEFAULT_EXECUTION_DEPENDENCY_REGISTRY_STORE_ID = "default-in-process";

export type DefaultExecutionDependencyRegistryStoreOptions = {
  registries?: readonly StoredExecutionDependencyRegistry[];
  dependencies?: readonly StoredExecutionDependency[];
};

export class DefaultExecutionDependencyRegistryStore implements ExecutionDependencyRegistryStore {
  readonly storeId = DEFAULT_EXECUTION_DEPENDENCY_REGISTRY_STORE_ID;
  private readonly registries = new Map<string, StoredExecutionDependencyRegistry>();
  private readonly byExecution = new Map<string, string>();
  private readonly dependencies = new Map<string, StoredExecutionDependency>();
  private readonly byRegistryKey = new Map<string, string>();

  constructor(options: DefaultExecutionDependencyRegistryStoreOptions = {}) {
    for (const stored of options.registries ?? []) {
      this.setRegistry(stored);
    }
    for (const stored of options.dependencies ?? []) {
      this.setDependency(stored);
    }
  }

  getRegistry(
    executionDependencyRegistryId: string,
  ): StoredExecutionDependencyRegistry | undefined {
    return this.registries.get(executionDependencyRegistryId);
  }

  getRegistryByExecution(executionId: string): StoredExecutionDependencyRegistry | undefined {
    const registryId = this.byExecution.get(executionId);
    if (!registryId) return undefined;
    return this.registries.get(registryId);
  }

  setRegistry(stored: StoredExecutionDependencyRegistry): void {
    this.registries.set(stored.registry.executionDependencyRegistryId, stored);
    if (stored.registry.executionId) {
      this.byExecution.set(
        stored.registry.executionId,
        stored.registry.executionDependencyRegistryId,
      );
    }
  }

  listRegistries(): readonly StoredExecutionDependencyRegistry[] {
    return [...this.registries.values()];
  }

  getDependency(executionDependencyId: string): StoredExecutionDependency | undefined {
    return this.dependencies.get(executionDependencyId);
  }

  getDependencyByKey(
    executionDependencyRegistryId: string,
    key: string,
  ): StoredExecutionDependency | undefined {
    const dependencyId = this.byRegistryKey.get(`${executionDependencyRegistryId}::${key}`);
    if (!dependencyId) return undefined;
    return this.dependencies.get(dependencyId);
  }

  setDependency(stored: StoredExecutionDependency): void {
    this.dependencies.set(stored.dependency.executionDependencyId, stored);
    this.byRegistryKey.set(
      `${stored.registryId}::${stored.dependency.key}`,
      stored.dependency.executionDependencyId,
    );
  }

  listDependencies(executionDependencyRegistryId?: string): readonly StoredExecutionDependency[] {
    const all = [...this.dependencies.values()];
    if (!executionDependencyRegistryId) return all;
    return all.filter((s) => s.registryId === executionDependencyRegistryId);
  }

  removeDependency(executionDependencyId: string): boolean {
    const existing = this.dependencies.get(executionDependencyId);
    if (!existing) return false;
    this.byRegistryKey.delete(`${existing.registryId}::${existing.dependency.key}`);
    return this.dependencies.delete(executionDependencyId);
  }

  registryCount(): number {
    return this.registries.size;
  }

  dependencyCount(): number {
    return this.dependencies.size;
  }

  referenceCount(): number {
    let total = 0;
    for (const stored of this.registries.values()) {
      total += stored.registry.references.length;
    }
    for (const stored of this.dependencies.values()) {
      total += stored.dependency.references.length;
    }
    return total;
  }

  nodeCount(): number {
    let total = 0;
    for (const stored of this.dependencies.values()) {
      total += stored.dependency.graph.nodeCount;
    }
    return total;
  }

  edgeCount(): number {
    let total = 0;
    for (const stored of this.dependencies.values()) {
      total += stored.dependency.graph.edgeCount;
    }
    return total;
  }

  graphCount(): number {
    const graphs = new Set<string>();
    for (const stored of this.dependencies.values()) {
      graphs.add(stored.dependency.graph.id);
    }
    return graphs.size;
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultExecutionDependencyRegistryStore ready (${this.registries.size} registries, ${this.dependencies.size} dependencies).`,
    };
  }
}

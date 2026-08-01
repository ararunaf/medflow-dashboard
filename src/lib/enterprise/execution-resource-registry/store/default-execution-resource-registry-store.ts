/**
 * DefaultExecutionResourceRegistryStore — store in-process padrão (EPC-24 Sprint 13).
 *
 * Armazenamento estrutural in-memory apenas.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real. Sem cache distribuído.
 */
import type {
  ExecutionResourceRegistryStore,
  StoredExecutionResource,
  StoredExecutionResourceRegistry,
} from "./execution-resource-registry-store";

export const DEFAULT_EXECUTION_RESOURCE_REGISTRY_STORE_ID = "default-in-process";

export type DefaultExecutionResourceRegistryStoreOptions = {
  registries?: readonly StoredExecutionResourceRegistry[];
  resources?: readonly StoredExecutionResource[];
};

export class DefaultExecutionResourceRegistryStore implements ExecutionResourceRegistryStore {
  readonly storeId = DEFAULT_EXECUTION_RESOURCE_REGISTRY_STORE_ID;
  private readonly registries = new Map<string, StoredExecutionResourceRegistry>();
  private readonly byExecution = new Map<string, string>();
  private readonly resources = new Map<string, StoredExecutionResource>();
  private readonly byRegistryKey = new Map<string, string>();

  constructor(options: DefaultExecutionResourceRegistryStoreOptions = {}) {
    for (const stored of options.registries ?? []) {
      this.setRegistry(stored);
    }
    for (const stored of options.resources ?? []) {
      this.setResource(stored);
    }
  }

  getRegistry(executionResourceRegistryId: string): StoredExecutionResourceRegistry | undefined {
    return this.registries.get(executionResourceRegistryId);
  }

  getRegistryByExecution(executionId: string): StoredExecutionResourceRegistry | undefined {
    const registryId = this.byExecution.get(executionId);
    if (!registryId) return undefined;
    return this.registries.get(registryId);
  }

  setRegistry(stored: StoredExecutionResourceRegistry): void {
    this.registries.set(stored.registry.executionResourceRegistryId, stored);
    if (stored.registry.executionId) {
      this.byExecution.set(
        stored.registry.executionId,
        stored.registry.executionResourceRegistryId,
      );
    }
  }

  listRegistries(): readonly StoredExecutionResourceRegistry[] {
    return [...this.registries.values()];
  }

  getResource(executionResourceId: string): StoredExecutionResource | undefined {
    return this.resources.get(executionResourceId);
  }

  getResourceByKey(
    executionResourceRegistryId: string,
    key: string,
  ): StoredExecutionResource | undefined {
    const resourceId = this.byRegistryKey.get(`${executionResourceRegistryId}::${key}`);
    if (!resourceId) return undefined;
    return this.resources.get(resourceId);
  }

  setResource(stored: StoredExecutionResource): void {
    this.resources.set(stored.resource.executionResourceId, stored);
    this.byRegistryKey.set(
      `${stored.registryId}::${stored.resource.key}`,
      stored.resource.executionResourceId,
    );
  }

  listResources(executionResourceRegistryId?: string): readonly StoredExecutionResource[] {
    const all = [...this.resources.values()];
    if (!executionResourceRegistryId) return all;
    return all.filter((s) => s.registryId === executionResourceRegistryId);
  }

  removeResource(executionResourceId: string): boolean {
    const existing = this.resources.get(executionResourceId);
    if (!existing) return false;
    this.byRegistryKey.delete(`${existing.registryId}::${existing.resource.key}`);
    return this.resources.delete(executionResourceId);
  }

  registryCount(): number {
    return this.registries.size;
  }

  resourceCount(): number {
    return this.resources.size;
  }

  referenceCount(): number {
    let total = 0;
    for (const stored of this.registries.values()) {
      total += stored.registry.references.length;
    }
    for (const stored of this.resources.values()) {
      total += stored.resource.references.length;
    }
    return total;
  }

  categoryCount(): number {
    const categories = new Set<string>();
    for (const stored of this.resources.values()) {
      categories.add(stored.resource.category.category);
    }
    return categories.size;
  }

  scopeCount(): number {
    const scopes = new Set<string>();
    for (const stored of this.resources.values()) {
      scopes.add(stored.resource.scope.scope);
    }
    return scopes.size;
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultExecutionResourceRegistryStore ready (${this.registries.size} registries, ${this.resources.size} resources).`,
    };
  }
}

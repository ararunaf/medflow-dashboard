/**
 * DefaultExecutionCapabilityRegistryStore — store in-process padrão (EPC-24 Sprint 08).
 *
 * Armazenamento estrutural in-memory apenas.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real. Sem cache distribuído.
 */
import type {
  ExecutionCapabilityRegistryStore,
  StoredExecutionCapability,
  StoredExecutionCapabilityRegistry,
} from "./execution-capability-registry-store";

export const DEFAULT_EXECUTION_CAPABILITY_REGISTRY_STORE_ID = "default-in-process";

export type DefaultExecutionCapabilityRegistryStoreOptions = {
  registries?: readonly StoredExecutionCapabilityRegistry[];
  capabilities?: readonly StoredExecutionCapability[];
};

export class DefaultExecutionCapabilityRegistryStore implements ExecutionCapabilityRegistryStore {
  readonly storeId = DEFAULT_EXECUTION_CAPABILITY_REGISTRY_STORE_ID;
  private readonly registries = new Map<string, StoredExecutionCapabilityRegistry>();
  private readonly byExecution = new Map<string, string>();
  private readonly capabilities = new Map<string, StoredExecutionCapability>();
  private readonly byRegistryKey = new Map<string, string>();

  constructor(options: DefaultExecutionCapabilityRegistryStoreOptions = {}) {
    for (const stored of options.registries ?? []) {
      this.setRegistry(stored);
    }
    for (const stored of options.capabilities ?? []) {
      this.setCapability(stored);
    }
  }

  getRegistry(
    executionCapabilityRegistryId: string,
  ): StoredExecutionCapabilityRegistry | undefined {
    return this.registries.get(executionCapabilityRegistryId);
  }

  getRegistryByExecution(executionId: string): StoredExecutionCapabilityRegistry | undefined {
    const registryId = this.byExecution.get(executionId);
    if (!registryId) return undefined;
    return this.registries.get(registryId);
  }

  setRegistry(stored: StoredExecutionCapabilityRegistry): void {
    this.registries.set(stored.registry.executionCapabilityRegistryId, stored);
    if (stored.registry.executionId) {
      this.byExecution.set(
        stored.registry.executionId,
        stored.registry.executionCapabilityRegistryId,
      );
    }
  }

  listRegistries(): readonly StoredExecutionCapabilityRegistry[] {
    return [...this.registries.values()];
  }

  getCapability(executionCapabilityId: string): StoredExecutionCapability | undefined {
    return this.capabilities.get(executionCapabilityId);
  }

  getCapabilityByKey(
    executionCapabilityRegistryId: string,
    key: string,
  ): StoredExecutionCapability | undefined {
    const capabilityId = this.byRegistryKey.get(`${executionCapabilityRegistryId}::${key}`);
    if (!capabilityId) return undefined;
    return this.capabilities.get(capabilityId);
  }

  setCapability(stored: StoredExecutionCapability): void {
    this.capabilities.set(stored.capability.executionCapabilityId, stored);
    this.byRegistryKey.set(
      `${stored.registryId}::${stored.capability.key}`,
      stored.capability.executionCapabilityId,
    );
  }

  listCapabilities(executionCapabilityRegistryId?: string): readonly StoredExecutionCapability[] {
    const all = [...this.capabilities.values()];
    if (!executionCapabilityRegistryId) return all;
    return all.filter((s) => s.registryId === executionCapabilityRegistryId);
  }

  removeCapability(executionCapabilityId: string): boolean {
    const existing = this.capabilities.get(executionCapabilityId);
    if (!existing) return false;
    this.byRegistryKey.delete(`${existing.registryId}::${existing.capability.key}`);
    return this.capabilities.delete(executionCapabilityId);
  }

  registryCount(): number {
    return this.registries.size;
  }

  capabilityCount(): number {
    return this.capabilities.size;
  }

  referenceCount(): number {
    let total = 0;
    for (const stored of this.registries.values()) {
      total += stored.registry.references.length;
    }
    for (const stored of this.capabilities.values()) {
      total += stored.capability.references.length;
    }
    return total;
  }

  categoryCount(): number {
    const categories = new Set<string>();
    for (const stored of this.capabilities.values()) {
      categories.add(stored.capability.category.category);
    }
    return categories.size;
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultExecutionCapabilityRegistryStore ready (${this.registries.size} registries, ${this.capabilities.size} capabilities).`,
    };
  }
}

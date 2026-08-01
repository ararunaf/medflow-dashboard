/**
 * DefaultExecutionRequirementRegistryStore — store in-process padrão (EPC-24 Sprint 12).
 *
 * Armazenamento estrutural in-memory apenas.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real. Sem cache distribuído.
 */
import type {
  ExecutionRequirementRegistryStore,
  StoredExecutionRequirement,
  StoredExecutionRequirementRegistry,
} from "./execution-requirement-registry-store";

export const DEFAULT_EXECUTION_REQUIREMENT_REGISTRY_STORE_ID = "default-in-process";

export type DefaultExecutionRequirementRegistryStoreOptions = {
  registries?: readonly StoredExecutionRequirementRegistry[];
  requirements?: readonly StoredExecutionRequirement[];
};

export class DefaultExecutionRequirementRegistryStore implements ExecutionRequirementRegistryStore {
  readonly storeId = DEFAULT_EXECUTION_REQUIREMENT_REGISTRY_STORE_ID;
  private readonly registries = new Map<string, StoredExecutionRequirementRegistry>();
  private readonly byExecution = new Map<string, string>();
  private readonly requirements = new Map<string, StoredExecutionRequirement>();
  private readonly byRegistryKey = new Map<string, string>();

  constructor(options: DefaultExecutionRequirementRegistryStoreOptions = {}) {
    for (const stored of options.registries ?? []) {
      this.setRegistry(stored);
    }
    for (const stored of options.requirements ?? []) {
      this.setRequirement(stored);
    }
  }

  getRegistry(
    executionRequirementRegistryId: string,
  ): StoredExecutionRequirementRegistry | undefined {
    return this.registries.get(executionRequirementRegistryId);
  }

  getRegistryByExecution(executionId: string): StoredExecutionRequirementRegistry | undefined {
    const registryId = this.byExecution.get(executionId);
    if (!registryId) return undefined;
    return this.registries.get(registryId);
  }

  setRegistry(stored: StoredExecutionRequirementRegistry): void {
    this.registries.set(stored.registry.executionRequirementRegistryId, stored);
    if (stored.registry.executionId) {
      this.byExecution.set(
        stored.registry.executionId,
        stored.registry.executionRequirementRegistryId,
      );
    }
  }

  listRegistries(): readonly StoredExecutionRequirementRegistry[] {
    return [...this.registries.values()];
  }

  getRequirement(executionRequirementId: string): StoredExecutionRequirement | undefined {
    return this.requirements.get(executionRequirementId);
  }

  getRequirementByKey(
    executionRequirementRegistryId: string,
    key: string,
  ): StoredExecutionRequirement | undefined {
    const requirementId = this.byRegistryKey.get(`${executionRequirementRegistryId}::${key}`);
    if (!requirementId) return undefined;
    return this.requirements.get(requirementId);
  }

  setRequirement(stored: StoredExecutionRequirement): void {
    this.requirements.set(stored.requirement.executionRequirementId, stored);
    this.byRegistryKey.set(
      `${stored.registryId}::${stored.requirement.key}`,
      stored.requirement.executionRequirementId,
    );
  }

  listRequirements(executionRequirementRegistryId?: string): readonly StoredExecutionRequirement[] {
    const all = [...this.requirements.values()];
    if (!executionRequirementRegistryId) return all;
    return all.filter((s) => s.registryId === executionRequirementRegistryId);
  }

  removeRequirement(executionRequirementId: string): boolean {
    const existing = this.requirements.get(executionRequirementId);
    if (!existing) return false;
    this.byRegistryKey.delete(`${existing.registryId}::${existing.requirement.key}`);
    return this.requirements.delete(executionRequirementId);
  }

  registryCount(): number {
    return this.registries.size;
  }

  requirementCount(): number {
    return this.requirements.size;
  }

  referenceCount(): number {
    let total = 0;
    for (const stored of this.registries.values()) {
      total += stored.registry.references.length;
    }
    for (const stored of this.requirements.values()) {
      total += stored.requirement.references.length;
    }
    return total;
  }

  categoryCount(): number {
    const categories = new Set<string>();
    for (const stored of this.requirements.values()) {
      categories.add(stored.requirement.category.category);
    }
    return categories.size;
  }

  scopeCount(): number {
    const scopes = new Set<string>();
    for (const stored of this.requirements.values()) {
      scopes.add(stored.requirement.scope.scope);
    }
    return scopes.size;
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultExecutionRequirementRegistryStore ready (${this.registries.size} registries, ${this.requirements.size} requirements).`,
    };
  }
}

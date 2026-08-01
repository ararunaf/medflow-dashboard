/**
 * DefaultExecutionConstraintRegistryStore — store in-process padrão (EPC-24 Sprint 11).
 *
 * Armazenamento estrutural in-memory apenas.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real. Sem cache distribuído.
 */
import type {
  ExecutionConstraintRegistryStore,
  StoredExecutionConstraint,
  StoredExecutionConstraintRegistry,
} from "./execution-constraint-registry-store";

export const DEFAULT_EXECUTION_CONSTRAINT_REGISTRY_STORE_ID = "default-in-process";

export type DefaultExecutionConstraintRegistryStoreOptions = {
  registries?: readonly StoredExecutionConstraintRegistry[];
  constraints?: readonly StoredExecutionConstraint[];
};

export class DefaultExecutionConstraintRegistryStore implements ExecutionConstraintRegistryStore {
  readonly storeId = DEFAULT_EXECUTION_CONSTRAINT_REGISTRY_STORE_ID;
  private readonly registries = new Map<string, StoredExecutionConstraintRegistry>();
  private readonly byExecution = new Map<string, string>();
  private readonly constraints = new Map<string, StoredExecutionConstraint>();
  private readonly byRegistryKey = new Map<string, string>();

  constructor(options: DefaultExecutionConstraintRegistryStoreOptions = {}) {
    for (const stored of options.registries ?? []) {
      this.setRegistry(stored);
    }
    for (const stored of options.constraints ?? []) {
      this.setConstraint(stored);
    }
  }

  getRegistry(
    executionConstraintRegistryId: string,
  ): StoredExecutionConstraintRegistry | undefined {
    return this.registries.get(executionConstraintRegistryId);
  }

  getRegistryByExecution(executionId: string): StoredExecutionConstraintRegistry | undefined {
    const registryId = this.byExecution.get(executionId);
    if (!registryId) return undefined;
    return this.registries.get(registryId);
  }

  setRegistry(stored: StoredExecutionConstraintRegistry): void {
    this.registries.set(stored.registry.executionConstraintRegistryId, stored);
    if (stored.registry.executionId) {
      this.byExecution.set(
        stored.registry.executionId,
        stored.registry.executionConstraintRegistryId,
      );
    }
  }

  listRegistries(): readonly StoredExecutionConstraintRegistry[] {
    return [...this.registries.values()];
  }

  getConstraint(executionConstraintId: string): StoredExecutionConstraint | undefined {
    return this.constraints.get(executionConstraintId);
  }

  getConstraintByKey(
    executionConstraintRegistryId: string,
    key: string,
  ): StoredExecutionConstraint | undefined {
    const constraintId = this.byRegistryKey.get(`${executionConstraintRegistryId}::${key}`);
    if (!constraintId) return undefined;
    return this.constraints.get(constraintId);
  }

  setConstraint(stored: StoredExecutionConstraint): void {
    this.constraints.set(stored.constraint.executionConstraintId, stored);
    this.byRegistryKey.set(
      `${stored.registryId}::${stored.constraint.key}`,
      stored.constraint.executionConstraintId,
    );
  }

  listConstraints(executionConstraintRegistryId?: string): readonly StoredExecutionConstraint[] {
    const all = [...this.constraints.values()];
    if (!executionConstraintRegistryId) return all;
    return all.filter((s) => s.registryId === executionConstraintRegistryId);
  }

  removeConstraint(executionConstraintId: string): boolean {
    const existing = this.constraints.get(executionConstraintId);
    if (!existing) return false;
    this.byRegistryKey.delete(`${existing.registryId}::${existing.constraint.key}`);
    return this.constraints.delete(executionConstraintId);
  }

  registryCount(): number {
    return this.registries.size;
  }

  constraintCount(): number {
    return this.constraints.size;
  }

  referenceCount(): number {
    let total = 0;
    for (const stored of this.registries.values()) {
      total += stored.registry.references.length;
    }
    for (const stored of this.constraints.values()) {
      total += stored.constraint.references.length;
    }
    return total;
  }

  categoryCount(): number {
    const categories = new Set<string>();
    for (const stored of this.constraints.values()) {
      categories.add(stored.constraint.category.category);
    }
    return categories.size;
  }

  scopeCount(): number {
    const scopes = new Set<string>();
    for (const stored of this.constraints.values()) {
      scopes.add(stored.constraint.scope.scope);
    }
    return scopes.size;
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultExecutionConstraintRegistryStore ready (${this.registries.size} registries, ${this.constraints.size} constraints).`,
    };
  }
}

/**
 * InMemoryExecutionHealthCenterStore — store in-process padrão (INF-05).
 *
 * Armazenamento estrutural in-memory apenas — cadastro de componentes monitoráveis.
 * Sem banco. Sem HTTP. Sem monitoramento. Sem health checks. Sem persistência real.
 * Sem cache distribuído. Sem consultas externas.
 */
import type {
  ExecutionHealthCenterStore,
  StoredCanonicalHealthComponent,
} from "./execution-health-center-store";

export const IN_MEMORY_EXECUTION_HEALTH_CENTER_STORE_ID = "in-memory-execution-health-center";

export type InMemoryExecutionHealthCenterStoreOptions = {
  components?: readonly StoredCanonicalHealthComponent[];
};

export class InMemoryExecutionHealthCenterStore implements ExecutionHealthCenterStore {
  readonly storeId = IN_MEMORY_EXECUTION_HEALTH_CENTER_STORE_ID;
  private readonly components = new Map<string, StoredCanonicalHealthComponent>();
  private readonly byHealthCenterKey = new Map<string, string>();
  private readonly byHealthCenter = new Map<string, Set<string>>();
  private readonly byExecution = new Map<string, Set<string>>();

  constructor(options: InMemoryExecutionHealthCenterStoreOptions = {}) {
    for (const stored of options.components ?? []) {
      this.setComponent(stored);
    }
  }

  private healthCenterKey(executionHealthCenterId: string, key: string): string {
    return `${executionHealthCenterId}::${key}`;
  }

  getComponent(healthComponentId: string): StoredCanonicalHealthComponent | undefined {
    return this.components.get(healthComponentId);
  }

  getComponentByHealthCenterAndKey(
    executionHealthCenterId: string,
    key: string,
  ): StoredCanonicalHealthComponent | undefined {
    const componentId = this.byHealthCenterKey.get(
      this.healthCenterKey(executionHealthCenterId, key),
    );
    if (!componentId) return undefined;
    return this.components.get(componentId);
  }

  getComponentsByHealthCenter(
    executionHealthCenterId: string,
  ): readonly StoredCanonicalHealthComponent[] {
    const ids = this.byHealthCenter.get(executionHealthCenterId);
    if (!ids) return [];
    return [...ids]
      .map((id) => this.components.get(id))
      .filter((stored): stored is StoredCanonicalHealthComponent => stored !== undefined);
  }

  getComponentsByExecution(executionId: string): readonly StoredCanonicalHealthComponent[] {
    const ids = this.byExecution.get(executionId);
    if (!ids) return [];
    return [...ids]
      .map((id) => this.components.get(id))
      .filter((stored): stored is StoredCanonicalHealthComponent => stored !== undefined);
  }

  setComponent(stored: StoredCanonicalHealthComponent): void {
    const { component } = stored;
    this.components.set(component.healthComponentId, stored);
    this.byHealthCenterKey.set(
      this.healthCenterKey(component.executionHealthCenterId, component.identity.key),
      component.healthComponentId,
    );

    let centerSet = this.byHealthCenter.get(component.executionHealthCenterId);
    if (!centerSet) {
      centerSet = new Set();
      this.byHealthCenter.set(component.executionHealthCenterId, centerSet);
    }
    centerSet.add(component.healthComponentId);

    if (component.executionId) {
      let execSet = this.byExecution.get(component.executionId);
      if (!execSet) {
        execSet = new Set();
        this.byExecution.set(component.executionId, execSet);
      }
      execSet.add(component.healthComponentId);
    }
  }

  removeComponent(healthComponentId: string): StoredCanonicalHealthComponent | undefined {
    const existing = this.components.get(healthComponentId);
    if (!existing) return undefined;

    this.components.delete(healthComponentId);
    this.byHealthCenterKey.delete(
      this.healthCenterKey(
        existing.component.executionHealthCenterId,
        existing.component.identity.key,
      ),
    );

    const centerSet = this.byHealthCenter.get(existing.component.executionHealthCenterId);
    if (centerSet) {
      centerSet.delete(healthComponentId);
      if (centerSet.size === 0) {
        this.byHealthCenter.delete(existing.component.executionHealthCenterId);
      }
    }

    if (existing.component.executionId) {
      const execSet = this.byExecution.get(existing.component.executionId);
      if (execSet) {
        execSet.delete(healthComponentId);
        if (execSet.size === 0) {
          this.byExecution.delete(existing.component.executionId);
        }
      }
    }

    return existing;
  }

  listComponents(): readonly StoredCanonicalHealthComponent[] {
    return [...this.components.values()];
  }

  componentCount(): number {
    return this.components.size;
  }

  referenceCount(): number {
    let total = 0;
    for (const stored of this.components.values()) {
      total += stored.component.references.length;
    }
    return total;
  }

  healthCenterCount(): number {
    return this.byHealthCenter.size;
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `InMemoryExecutionHealthCenterStore ready (${this.components.size} components, ${this.byHealthCenter.size} health centers).`,
    };
  }
}

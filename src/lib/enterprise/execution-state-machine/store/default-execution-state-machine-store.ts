/**
 * DefaultExecutionStateMachineStore — store in-process padrão (EPC-24 Sprint 04).
 *
 * Persistência estrutural in-memory apenas.
 * Sem banco. Sem HTTP. Sem Workers. Sem filas.
 */
import type {
  ExecutionStateMachineStore,
  StoredExecutionLifecycle,
} from "./execution-state-machine-store";

export const DEFAULT_EXECUTION_STATE_MACHINE_STORE_ID = "default-in-process";

export type DefaultExecutionStateMachineStoreOptions = {
  lifecycles?: readonly StoredExecutionLifecycle[];
};

export class DefaultExecutionStateMachineStore implements ExecutionStateMachineStore {
  readonly storeId = DEFAULT_EXECUTION_STATE_MACHINE_STORE_ID;
  private readonly lifecycles = new Map<string, StoredExecutionLifecycle>();
  private readonly byExecution = new Map<string, string>();

  constructor(options: DefaultExecutionStateMachineStoreOptions = {}) {
    for (const entry of options.lifecycles ?? []) {
      this.setLifecycle(entry);
    }
  }

  getLifecycle(stateMachineId: string): StoredExecutionLifecycle | undefined {
    return this.lifecycles.get(stateMachineId);
  }

  getLifecycleByExecution(executionId: string): StoredExecutionLifecycle | undefined {
    const stateMachineId = this.byExecution.get(executionId);
    if (!stateMachineId) return undefined;
    return this.lifecycles.get(stateMachineId);
  }

  setLifecycle(entry: StoredExecutionLifecycle): void {
    this.lifecycles.set(entry.lifecycle.stateMachineId, entry);
    this.byExecution.set(entry.lifecycle.executionId, entry.lifecycle.stateMachineId);
  }

  listLifecycles(): readonly StoredExecutionLifecycle[] {
    return [...this.lifecycles.values()];
  }

  removeLifecycle(stateMachineId: string): boolean {
    const existing = this.lifecycles.get(stateMachineId);
    if (!existing) return false;
    this.byExecution.delete(existing.lifecycle.executionId);
    return this.lifecycles.delete(stateMachineId);
  }

  lifecycleCount(): number {
    return this.lifecycles.size;
  }

  transitionCount(): number {
    let total = 0;
    for (const entry of this.lifecycles.values()) {
      total += entry.lifecycle.history.transitions.length;
    }
    return total;
  }

  historyCount(): number {
    return this.lifecycles.size;
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultExecutionStateMachineStore ready (${this.lifecycles.size} lifecycles).`,
    };
  }
}

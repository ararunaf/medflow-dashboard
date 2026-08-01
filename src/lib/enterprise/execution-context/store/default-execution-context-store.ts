/**
 * DefaultExecutionContextStore — store in-process padrão (EPC-24 Sprint 03).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations).
 */
import type { ExecutionContextStore, StoredExecutionContext } from "./execution-context-store";

export const DEFAULT_EXECUTION_CONTEXT_STORE_ID = "default-in-process";

export type DefaultExecutionContextStoreOptions = {
  contexts?: readonly StoredExecutionContext[];
};

export class DefaultExecutionContextStore implements ExecutionContextStore {
  readonly storeId = DEFAULT_EXECUTION_CONTEXT_STORE_ID;

  private readonly contexts = new Map<string, StoredExecutionContext>();

  constructor(options: DefaultExecutionContextStoreOptions = {}) {
    for (const entry of options.contexts ?? []) {
      this.contexts.set(entry.context.id, entry);
    }
  }

  getContext(contextId: string): StoredExecutionContext | undefined {
    return this.contexts.get(contextId);
  }

  setContext(entry: StoredExecutionContext): void {
    this.contexts.set(entry.context.id, entry);
  }

  listContexts(): readonly StoredExecutionContext[] {
    return [...this.contexts.values()];
  }

  removeContext(contextId: string): boolean {
    return this.contexts.delete(contextId);
  }

  contextCount(): number {
    return this.contexts.size;
  }

  snapshotCount(): number {
    let total = 0;
    for (const entry of this.contexts.values()) {
      total += entry.context.snapshots.length;
    }
    return total;
  }

  historyCount(): number {
    let total = 0;
    for (const entry of this.contexts.values()) {
      total += entry.context.history.length;
    }
    return total;
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultExecutionContextStore ready (${this.contexts.size} contexts).`,
    };
  }
}

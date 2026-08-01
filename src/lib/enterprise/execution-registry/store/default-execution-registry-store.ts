/**
 * DefaultExecutionRegistryStore — store in-process padrão (EPC-24 Sprint 06).
 *
 * Armazenamento estrutural in-memory apenas.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real. Sem cache distribuído.
 */
import type {
  ExecutionRegistryStore,
  StoredExecutionRegistryEntry,
} from "./execution-registry-store";

export const DEFAULT_EXECUTION_REGISTRY_STORE_ID = "default-in-process";

export type DefaultExecutionRegistryStoreOptions = {
  entries?: readonly StoredExecutionRegistryEntry[];
};

export class DefaultExecutionRegistryStore implements ExecutionRegistryStore {
  readonly storeId = DEFAULT_EXECUTION_REGISTRY_STORE_ID;
  private readonly entries = new Map<string, StoredExecutionRegistryEntry>();
  private readonly byExecution = new Map<string, string>();

  constructor(options: DefaultExecutionRegistryStoreOptions = {}) {
    for (const stored of options.entries ?? []) {
      this.setEntry(stored);
    }
  }

  getEntry(executionRegistryId: string): StoredExecutionRegistryEntry | undefined {
    return this.entries.get(executionRegistryId);
  }

  getEntryByExecution(executionId: string): StoredExecutionRegistryEntry | undefined {
    const executionRegistryId = this.byExecution.get(executionId);
    if (!executionRegistryId) return undefined;
    return this.entries.get(executionRegistryId);
  }

  setEntry(stored: StoredExecutionRegistryEntry): void {
    this.entries.set(stored.entry.executionRegistryId, stored);
    this.byExecution.set(stored.entry.executionId, stored.entry.executionRegistryId);
  }

  listEntries(): readonly StoredExecutionRegistryEntry[] {
    return [...this.entries.values()];
  }

  removeEntry(executionRegistryId: string): boolean {
    const existing = this.entries.get(executionRegistryId);
    if (!existing) return false;
    this.byExecution.delete(existing.entry.executionId);
    return this.entries.delete(executionRegistryId);
  }

  removeEntryByExecution(executionId: string): boolean {
    const executionRegistryId = this.byExecution.get(executionId);
    if (!executionRegistryId) return false;
    return this.removeEntry(executionRegistryId);
  }

  entryCount(): number {
    return this.entries.size;
  }

  recordCount(): number {
    return this.entries.size;
  }

  referenceCount(): number {
    let total = 0;
    for (const stored of this.entries.values()) {
      total += stored.entry.references.length;
    }
    return total;
  }

  snapshotCount(): number {
    let total = 0;
    for (const stored of this.entries.values()) {
      if (stored.entry.snapshot) total += 1;
    }
    return total;
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultExecutionRegistryStore ready (${this.entries.size} entries).`,
    };
  }
}

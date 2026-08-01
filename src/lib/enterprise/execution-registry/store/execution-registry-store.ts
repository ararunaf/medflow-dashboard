/**
 * ExecutionRegistryStore — contrato interno do store (EPC-24 Sprint 06).
 *
 * Armazenamento in-memory estrutural apenas.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real. Sem cache distribuído.
 */
import type { ExecutionRegistryEntry, ExecutionRegistryRecord } from "../ports/models";

export type StoredExecutionRegistryEntry = {
  entry: ExecutionRegistryEntry;
  record: ExecutionRegistryRecord;
};

export interface ExecutionRegistryStore {
  readonly storeId: string;
  getEntry(executionRegistryId: string): StoredExecutionRegistryEntry | undefined;
  getEntryByExecution(executionId: string): StoredExecutionRegistryEntry | undefined;
  setEntry(stored: StoredExecutionRegistryEntry): void;
  listEntries(): readonly StoredExecutionRegistryEntry[];
  removeEntry(executionRegistryId: string): boolean;
  removeEntryByExecution(executionId: string): boolean;
  entryCount(): number;
  recordCount(): number;
  referenceCount(): number;
  snapshotCount(): number;
  health(): { ok: boolean; message?: string };
}

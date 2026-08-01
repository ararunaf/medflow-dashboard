/**
 * DefaultExecutionRegistryAdapter — adapter default in-memory (EPC-24 Sprint 06).
 *
 * Implementação totalmente in-memory.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real.
 *
 * Representa estruturalmente o catálogo de execuções.
 * Nenhuma Engine é invocada.
 */
import {
  createExecutionRegistryId,
  createRegistryIndexId,
  createRegistryRecordId,
  createRegistrySnapshotId,
} from "../ports/identity";
import type { ExecutionRegistryPort } from "../ports/execution-registry-port";
import type {
  ExecutionRegistryPortCapabilities,
  ExecutionRegistryPortHealth,
  ExecutionRegistryStatisticsResult,
  FindRegistryExecutionInput,
  FindRegistryExecutionResult,
  GetRegistryExecutionInput,
  GetRegistryExecutionResult,
  ListRegistryExecutionsInput,
  ListRegistryExecutionsResult,
  RegisterExecutionInput,
  RegisterExecutionResult,
  RemoveRegistryExecutionInput,
  RemoveRegistryExecutionResult,
} from "../ports/types";
import { DefaultExecutionRegistryStore, type ExecutionRegistryStore } from "../store";
import {
  buildIndex,
  buildRegistryEntry,
  buildStatistics,
  buildStructuralHealth,
  foundationCapabilitiesBase,
  matchesFilter,
  matchesQuery,
  persistEntry,
} from "./registry-helpers";

export const DEFAULT_EXECUTION_REGISTRY_ADAPTER_ID = "default-in-process";
export const DEFAULT_EXECUTION_REGISTRY_VERSION = "1.0.0";

/**
 * Runtime injetável — permite testes sem acoplar a Engines ou produto.
 */
export type DefaultExecutionRegistryRuntime = {
  store?: ExecutionRegistryStore;
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createExecutionRegistryId?: () => string;
  createRecordId?: () => string;
  createSnapshotId?: () => string;
  createIndexId?: () => string;
  now?: () => string;
};

function defaultRuntime(): DefaultExecutionRegistryRuntime {
  return {
    store: new DefaultExecutionRegistryStore(),
  };
}

function nowIso(runtime: DefaultExecutionRegistryRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

export class DefaultExecutionRegistryAdapter implements ExecutionRegistryPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultExecutionRegistryRuntime;
  private readonly store: ExecutionRegistryStore;

  constructor(runtime: DefaultExecutionRegistryRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultExecutionRegistryStore();
  }

  getStore(): ExecutionRegistryStore {
    return this.store;
  }

  capabilities(): ExecutionRegistryPortCapabilities {
    return {
      provider: "default",
      ...foundationCapabilitiesBase(DEFAULT_EXECUTION_REGISTRY_ADAPTER_ID),
    };
  }

  async health(): Promise<ExecutionRegistryPortHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    const stamp = nowIso(this.runtime);

    if (this.runtime.ping) {
      const probe = await this.runtime.ping();
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: probe.ok,
        provider: "default",
        latencyMs: Math.max(0, Math.round(end - start)),
        message:
          probe.message ??
          (probe.ok
            ? "Default execution-registry probe ok."
            : "Default execution-registry probe falhou."),
        storedEntryCount: this.store.entryCount(),
        storedRecordCount: this.store.recordCount(),
        storedReferenceCount: this.store.referenceCount(),
        storedSnapshotCount: this.store.snapshotCount(),
        structuralHealth: buildStructuralHealth(this.store, stamp, probe.message),
      };
    }

    const storeHealth = this.store.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: storeHealth.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      message:
        storeHealth.message ??
        "DefaultExecutionRegistryStore pronto (sem I/O externo — EPC-24 Sprint 06).",
      storedEntryCount: this.store.entryCount(),
      storedRecordCount: this.store.recordCount(),
      storedReferenceCount: this.store.referenceCount(),
      storedSnapshotCount: this.store.snapshotCount(),
      structuralHealth: buildStructuralHealth(this.store, stamp, storeHealth.message),
    };
  }

  async statistics(): Promise<ExecutionRegistryStatisticsResult> {
    const stamp = nowIso(this.runtime);
    return {
      ok: true,
      statistics: buildStatistics(this.store, stamp),
      code: "computed",
      message: "structural statistics computed — in-memory only",
    };
  }

  async registerExecution(input: RegisterExecutionInput): Promise<RegisterExecutionResult> {
    if (!input.executionId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionId required",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
      };
    }

    const existingByExecution = this.store.getEntryByExecution(input.executionId);
    if (existingByExecution) {
      return {
        ok: false,
        code: "already_exists",
        message: "execution already registered for executionId",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
      };
    }

    const stamp = nowIso(this.runtime);
    const executionRegistryId =
      input.executionRegistryId ??
      this.runtime.createExecutionRegistryId?.() ??
      createExecutionRegistryId();

    if (this.store.getEntry(executionRegistryId)) {
      return {
        ok: false,
        code: "already_exists",
        message: "execution registry entry already exists",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
      };
    }

    const { entry, record } = buildRegistryEntry(input, executionRegistryId, stamp, {
      createSnapshotId: this.runtime.createSnapshotId ?? createRegistrySnapshotId,
      createRecordId: this.runtime.createRecordId ?? createRegistryRecordId,
    });

    persistEntry(this.store, entry, record);

    return {
      ok: true,
      entry,
      record,
      code: "registered",
      message: "execution registered structurally — no persistence, no engines invoked",
      persistenceImplemented: false,
      databaseUsed: false,
      enginesInvoked: false,
    };
  }

  async getExecution(input: GetRegistryExecutionInput): Promise<GetRegistryExecutionResult> {
    if (!input.executionRegistryId && !input.executionId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionRegistryId or executionId required",
      };
    }

    const stored = input.executionRegistryId
      ? this.store.getEntry(input.executionRegistryId)
      : this.store.getEntryByExecution(input.executionId!);

    if (!stored) {
      return {
        ok: false,
        code: "not_found",
        message: "execution registry entry not found",
      };
    }

    return {
      ok: true,
      entry: stored.entry,
      record: stored.record,
      code: "found",
      message: "execution registry entry retrieved structurally",
    };
  }

  async listExecutions(
    input: ListRegistryExecutionsInput = {},
  ): Promise<ListRegistryExecutionsResult> {
    const stamp = nowIso(this.runtime);
    let entries = this.store.listEntries().map((s) => s.entry);

    if (input.filter) {
      entries = entries.filter((e) => matchesFilter(e, input.filter));
    }

    const limit = input.limit ?? input.filter?.limit;
    if (typeof limit === "number" && limit >= 0) {
      entries = entries.slice(0, limit);
    }

    const records = this.store
      .listEntries()
      .filter((s) => entries.some((e) => e.executionRegistryId === s.entry.executionRegistryId))
      .map((s) => s.record);

    return {
      ok: true,
      entries,
      records,
      total: entries.length,
      index: buildIndex(entries, stamp, this.runtime.createIndexId ?? createRegistryIndexId),
      code: "listed",
      message: "structural registry entries listed — in-memory only",
    };
  }

  async findExecution(input: FindRegistryExecutionInput): Promise<FindRegistryExecutionResult> {
    if (!input.query) {
      return {
        kind: "execution-registry-result",
        ok: false,
        code: "invalid_input",
        message: "query required",
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
      };
    }

    const matches = this.store
      .listEntries()
      .map((s) => s.entry)
      .filter((e) => matchesQuery(e, input.query));

    if (matches.length === 0) {
      return {
        kind: "execution-registry-result",
        ok: false,
        code: "not_found",
        message: "no execution matched structural query",
        entries: [],
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
      };
    }

    const first = matches[0]!;
    const stored = this.store.getEntry(first.executionRegistryId);

    return {
      kind: "execution-registry-result",
      ok: true,
      executionRegistryId: first.executionRegistryId,
      executionId: first.executionId,
      entry: first,
      record: stored?.record,
      entries: matches,
      code: "found",
      message: "execution(s) found structurally",
      persistenceImplemented: false,
      databaseUsed: false,
      enginesInvoked: false,
    };
  }

  async removeExecution(
    input: RemoveRegistryExecutionInput,
  ): Promise<RemoveRegistryExecutionResult> {
    if (!input.executionRegistryId && !input.executionId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionRegistryId or executionId required",
        persistenceImplemented: false,
        databaseUsed: false,
      };
    }

    const stored = input.executionRegistryId
      ? this.store.getEntry(input.executionRegistryId)
      : this.store.getEntryByExecution(input.executionId!);

    if (!stored) {
      return {
        ok: false,
        code: "not_found",
        message: "execution registry entry not found",
        persistenceImplemented: false,
        databaseUsed: false,
      };
    }

    const removed = input.executionRegistryId
      ? this.store.removeEntry(input.executionRegistryId)
      : this.store.removeEntryByExecution(input.executionId!);

    if (!removed) {
      return {
        ok: false,
        code: "remove_failed",
        message: "failed to remove execution registry entry",
        persistenceImplemented: false,
        databaseUsed: false,
      };
    }

    return {
      ok: true,
      entry: stored.entry,
      code: "removed",
      message:
        "execution removed structurally from in-memory catalog — no persistence side effects",
      persistenceImplemented: false,
      databaseUsed: false,
    };
  }
}

/**
 * MockExecutionRegistryAdapter — EPC-24 Sprint 06.
 *
 * Voltado para testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência externa.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real.
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
  ExecutionRegistryProviderId,
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

export const MOCK_EXECUTION_REGISTRY_ADAPTER_ID = "mock-in-memory";
export const MOCK_EXECUTION_REGISTRY_VERSION = "1.0.0";

export type MockExecutionRegistryAdapterOptions = {
  provider?: Extract<ExecutionRegistryProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: ExecutionRegistryStore;
  createExecutionRegistryId?: () => string;
  createRecordId?: () => string;
  createSnapshotId?: () => string;
  createIndexId?: () => string;
  now?: () => string;
};

export class MockExecutionRegistryAdapter implements ExecutionRegistryPort {
  readonly providerId: Extract<ExecutionRegistryProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: ExecutionRegistryStore;
  private readonly createExecutionRegistryIdFn: () => string;
  private readonly createRecordIdFn: () => string;
  private readonly createSnapshotIdFn: () => string;
  private readonly createIndexIdFn: () => string;
  private readonly now?: () => string;

  constructor(options: MockExecutionRegistryAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} execution-registry ready.`;
    this.store = options.store ?? new DefaultExecutionRegistryStore();
    this.createExecutionRegistryIdFn =
      options.createExecutionRegistryId ?? createExecutionRegistryId;
    this.createRecordIdFn = options.createRecordId ?? createRegistryRecordId;
    this.createSnapshotIdFn = options.createSnapshotId ?? createRegistrySnapshotId;
    this.createIndexIdFn = options.createIndexId ?? createRegistryIndexId;
    this.now = options.now;
  }

  getStore(): ExecutionRegistryStore {
    return this.store;
  }

  capabilities(): ExecutionRegistryPortCapabilities {
    return {
      provider: this.providerId,
      ...foundationCapabilitiesBase(`${this.providerId}-in-memory`),
    };
  }

  async health(): Promise<ExecutionRegistryPortHealth> {
    const stamp = this.stamp();
    return {
      ok: this.healthy,
      provider: this.providerId,
      message: this.message,
      storedEntryCount: this.store.entryCount(),
      storedRecordCount: this.store.recordCount(),
      storedReferenceCount: this.store.referenceCount(),
      storedSnapshotCount: this.store.snapshotCount(),
      structuralHealth: buildStructuralHealth(this.store, stamp, this.message),
    };
  }

  private stamp(): string {
    return this.now?.() ?? new Date().toISOString();
  }

  private unhealthyResult<T extends { ok: boolean; code?: string; message?: string }>(
    extra: Omit<T, "ok" | "code" | "message"> = {} as Omit<T, "ok" | "code" | "message">,
  ): T {
    return {
      ...extra,
      ok: false,
      code: "unhealthy",
      message: this.message,
    } as T;
  }

  async statistics(): Promise<ExecutionRegistryStatisticsResult> {
    if (!this.healthy) return this.unhealthyResult<ExecutionRegistryStatisticsResult>();
    const stamp = this.stamp();
    return {
      ok: true,
      statistics: buildStatistics(this.store, stamp),
      code: "computed",
      message: "structural statistics computed — in-memory only",
    };
  }

  async registerExecution(input: RegisterExecutionInput): Promise<RegisterExecutionResult> {
    if (!this.healthy) {
      return this.unhealthyResult<RegisterExecutionResult>({
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
      });
    }

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

    const stamp = this.stamp();
    const executionRegistryId = input.executionRegistryId ?? this.createExecutionRegistryIdFn();

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
      createSnapshotId: this.createSnapshotIdFn,
      createRecordId: this.createRecordIdFn,
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
    if (!this.healthy) return this.unhealthyResult<GetRegistryExecutionResult>();

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
    if (!this.healthy) return this.unhealthyResult<ListRegistryExecutionsResult>();

    const stamp = this.stamp();
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
      index: buildIndex(entries, stamp, this.createIndexIdFn),
      code: "listed",
      message: "structural registry entries listed — in-memory only",
    };
  }

  async findExecution(input: FindRegistryExecutionInput): Promise<FindRegistryExecutionResult> {
    if (!this.healthy) {
      return {
        kind: "execution-registry-result",
        ok: false,
        code: "unhealthy",
        message: this.message,
        persistenceImplemented: false,
        databaseUsed: false,
        enginesInvoked: false,
      };
    }

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
    if (!this.healthy) {
      return this.unhealthyResult<RemoveRegistryExecutionResult>({
        persistenceImplemented: false,
        databaseUsed: false,
      });
    }

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

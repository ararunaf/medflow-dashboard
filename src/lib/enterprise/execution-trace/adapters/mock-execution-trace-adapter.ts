/**
 * MockExecutionTraceAdapter — EPC-24 Sprint 07.
 *
 * Voltado para testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência externa.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real.
 * Sem logs reais. Sem telemetria. Sem observabilidade externa.
 */
import {
  createExecutionTraceId,
  createTraceEntryId,
  createTraceNodeId,
  createTraceSnapshotId,
  createTraceStepId,
  createTraceTimelineId,
} from "../ports/identity";
import type { ExecutionTracePort } from "../ports/execution-trace-port";
import type {
  AppendTraceInput,
  AppendTraceResult,
  CreateTraceInput,
  CreateTraceResult,
  ExecutionTracePortCapabilities,
  ExecutionTracePortHealth,
  ExecutionTraceProviderId,
  ExecutionTraceStatisticsResult,
  GetTraceInput,
  GetTraceResult,
  ListTraceEntriesInput,
  ListTraceEntriesResult,
} from "../ports/types";
import { DefaultExecutionTraceStore, type ExecutionTraceStore } from "../store";
import {
  appendEntryToTrace,
  buildStatistics,
  buildStructuralHealth,
  buildTrace,
  foundationCapabilitiesBase,
  persistTrace,
} from "./trace-helpers";

export const MOCK_EXECUTION_TRACE_ADAPTER_ID = "mock-in-memory";
export const MOCK_EXECUTION_TRACE_VERSION = "1.0.0";

export type MockExecutionTraceAdapterOptions = {
  provider?: Extract<ExecutionTraceProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: ExecutionTraceStore;
  createExecutionTraceId?: () => string;
  createEntryId?: () => string;
  createStepId?: () => string;
  createNodeId?: () => string;
  createSnapshotId?: () => string;
  createTimelineId?: () => string;
  now?: () => string;
};

export class MockExecutionTraceAdapter implements ExecutionTracePort {
  readonly providerId: Extract<ExecutionTraceProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: ExecutionTraceStore;
  private readonly createExecutionTraceIdFn: () => string;
  private readonly createEntryIdFn: () => string;
  private readonly createStepIdFn: () => string;
  private readonly createNodeIdFn: () => string;
  private readonly createSnapshotIdFn: () => string;
  private readonly createTimelineIdFn: () => string;
  private readonly now?: () => string;

  constructor(options: MockExecutionTraceAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} execution-trace ready.`;
    this.store = options.store ?? new DefaultExecutionTraceStore();
    this.createExecutionTraceIdFn = options.createExecutionTraceId ?? createExecutionTraceId;
    this.createEntryIdFn = options.createEntryId ?? createTraceEntryId;
    this.createStepIdFn = options.createStepId ?? createTraceStepId;
    this.createNodeIdFn = options.createNodeId ?? createTraceNodeId;
    this.createSnapshotIdFn = options.createSnapshotId ?? createTraceSnapshotId;
    this.createTimelineIdFn = options.createTimelineId ?? createTraceTimelineId;
    this.now = options.now;
  }

  getStore(): ExecutionTraceStore {
    return this.store;
  }

  capabilities(): ExecutionTracePortCapabilities {
    return {
      provider: this.providerId,
      ...foundationCapabilitiesBase(`${this.providerId}-in-memory`),
    };
  }

  async health(): Promise<ExecutionTracePortHealth> {
    const stamp = this.stamp();
    return {
      ok: this.healthy,
      provider: this.providerId,
      message: this.message,
      storedTraceCount: this.store.traceCount(),
      storedEntryCount: this.store.entryCount(),
      storedStepCount: this.store.stepCount(),
      storedNodeCount: this.store.nodeCount(),
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

  async statistics(): Promise<ExecutionTraceStatisticsResult> {
    if (!this.healthy) return this.unhealthyResult<ExecutionTraceStatisticsResult>();
    const stamp = this.stamp();
    return {
      ok: true,
      statistics: buildStatistics(this.store, stamp),
      code: "computed",
      message: "structural statistics computed — in-memory only, no telemetry",
    };
  }

  async createTrace(input: CreateTraceInput): Promise<CreateTraceResult> {
    if (!this.healthy) {
      return this.unhealthyResult<CreateTraceResult>({
        persistenceImplemented: false,
        databaseUsed: false,
        logsImplemented: false,
        telemetryImplemented: false,
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
        logsImplemented: false,
        telemetryImplemented: false,
        enginesInvoked: false,
      };
    }

    const existingByExecution = this.store.getTraceByExecution(input.executionId);
    if (existingByExecution) {
      return {
        ok: false,
        code: "already_exists",
        message: "execution trace already exists for executionId",
        persistenceImplemented: false,
        databaseUsed: false,
        logsImplemented: false,
        telemetryImplemented: false,
        enginesInvoked: false,
      };
    }

    const stamp = this.stamp();
    const executionTraceId = input.executionTraceId ?? this.createExecutionTraceIdFn();

    if (this.store.getTrace(executionTraceId)) {
      return {
        ok: false,
        code: "already_exists",
        message: "execution trace already exists",
        persistenceImplemented: false,
        databaseUsed: false,
        logsImplemented: false,
        telemetryImplemented: false,
        enginesInvoked: false,
      };
    }

    const trace = buildTrace(input, executionTraceId, stamp, {
      createSnapshotId: this.createSnapshotIdFn,
      createTimelineId: this.createTimelineIdFn,
      createStepId: this.createStepIdFn,
      createNodeId: this.createNodeIdFn,
    });

    persistTrace(this.store, trace);

    return {
      ok: true,
      trace,
      code: "created",
      message:
        "execution trace created structurally — no persistence, no logs, no telemetry, no engines",
      persistenceImplemented: false,
      databaseUsed: false,
      logsImplemented: false,
      telemetryImplemented: false,
      enginesInvoked: false,
    };
  }

  async appendTrace(input: AppendTraceInput): Promise<AppendTraceResult> {
    if (!this.healthy) {
      return this.unhealthyResult<AppendTraceResult>({
        persistenceImplemented: false,
        databaseUsed: false,
        logsImplemented: false,
        telemetryImplemented: false,
        enginesInvoked: false,
      });
    }

    if (!input.executionTraceId && !input.executionId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionTraceId or executionId required",
        persistenceImplemented: false,
        databaseUsed: false,
        logsImplemented: false,
        telemetryImplemented: false,
        enginesInvoked: false,
      };
    }

    if (!input.name) {
      return {
        ok: false,
        code: "invalid_input",
        message: "name required",
        persistenceImplemented: false,
        databaseUsed: false,
        logsImplemented: false,
        telemetryImplemented: false,
        enginesInvoked: false,
      };
    }

    const stored = input.executionTraceId
      ? this.store.getTrace(input.executionTraceId)
      : this.store.getTraceByExecution(input.executionId!);

    if (!stored) {
      return {
        ok: false,
        code: "not_found",
        message: "execution trace not found",
        persistenceImplemented: false,
        databaseUsed: false,
        logsImplemented: false,
        telemetryImplemented: false,
        enginesInvoked: false,
      };
    }

    const stamp = this.stamp();
    const { trace, entry } = appendEntryToTrace(stored.trace, input, stamp, {
      createEntryId: this.createEntryIdFn,
      createSnapshotId: this.createSnapshotIdFn,
    });

    persistTrace(this.store, trace);

    return {
      ok: true,
      trace,
      entry,
      code: "appended",
      message: "trace entry appended structurally — no logs written, no telemetry sent",
      persistenceImplemented: false,
      databaseUsed: false,
      logsImplemented: false,
      telemetryImplemented: false,
      enginesInvoked: false,
    };
  }

  async getTrace(input: GetTraceInput): Promise<GetTraceResult> {
    if (!this.healthy) return this.unhealthyResult<GetTraceResult>();

    if (!input.executionTraceId && !input.executionId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionTraceId or executionId required",
      };
    }

    const stored = input.executionTraceId
      ? this.store.getTrace(input.executionTraceId)
      : this.store.getTraceByExecution(input.executionId!);

    if (!stored) {
      return {
        ok: false,
        code: "not_found",
        message: "execution trace not found",
      };
    }

    return {
      ok: true,
      trace: stored.trace,
      code: "found",
      message: "execution trace retrieved structurally",
    };
  }

  async listTraceEntries(input: ListTraceEntriesInput = {}): Promise<ListTraceEntriesResult> {
    if (!this.healthy) return this.unhealthyResult<ListTraceEntriesResult>();

    if (!input.executionTraceId && !input.executionId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionTraceId or executionId required",
      };
    }

    const stored = input.executionTraceId
      ? this.store.getTrace(input.executionTraceId)
      : this.store.getTraceByExecution(input.executionId!);

    if (!stored) {
      return {
        ok: false,
        code: "not_found",
        message: "execution trace not found",
      };
    }

    let entries = [...stored.trace.entries];
    if (typeof input.limit === "number" && input.limit >= 0) {
      entries = entries.slice(0, input.limit);
    }

    return {
      ok: true,
      executionTraceId: stored.trace.executionTraceId,
      executionId: stored.trace.executionId,
      entries,
      total: entries.length,
      code: "listed",
      message: "structural trace entries listed — in-memory only, no logs",
    };
  }
}

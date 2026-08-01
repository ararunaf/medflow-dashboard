/**
 * DefaultExecutionTraceAdapter — adapter default in-memory (EPC-24 Sprint 07).
 *
 * Implementação totalmente in-memory.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem Workers. Sem persistência real.
 * Sem logs reais. Sem telemetria. Sem observabilidade externa.
 *
 * Representa estruturalmente o rastreamento de uma execução.
 * Nenhuma Engine é invocada.
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

export const DEFAULT_EXECUTION_TRACE_ADAPTER_ID = "default-in-process";
export const DEFAULT_EXECUTION_TRACE_VERSION = "1.0.0";

/**
 * Runtime injetável — permite testes sem acoplar a Engines ou produto.
 */
export type DefaultExecutionTraceRuntime = {
  store?: ExecutionTraceStore;
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createExecutionTraceId?: () => string;
  createEntryId?: () => string;
  createStepId?: () => string;
  createNodeId?: () => string;
  createSnapshotId?: () => string;
  createTimelineId?: () => string;
  now?: () => string;
};

function defaultRuntime(): DefaultExecutionTraceRuntime {
  return {
    store: new DefaultExecutionTraceStore(),
  };
}

function nowIso(runtime: DefaultExecutionTraceRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

export class DefaultExecutionTraceAdapter implements ExecutionTracePort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultExecutionTraceRuntime;
  private readonly store: ExecutionTraceStore;

  constructor(runtime: DefaultExecutionTraceRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultExecutionTraceStore();
  }

  getStore(): ExecutionTraceStore {
    return this.store;
  }

  capabilities(): ExecutionTracePortCapabilities {
    return {
      provider: "default",
      ...foundationCapabilitiesBase(DEFAULT_EXECUTION_TRACE_ADAPTER_ID),
    };
  }

  async health(): Promise<ExecutionTracePortHealth> {
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
            ? "Default execution-trace probe ok."
            : "Default execution-trace probe falhou."),
        storedTraceCount: this.store.traceCount(),
        storedEntryCount: this.store.entryCount(),
        storedStepCount: this.store.stepCount(),
        storedNodeCount: this.store.nodeCount(),
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
        "DefaultExecutionTraceStore pronto (sem I/O externo — EPC-24 Sprint 07).",
      storedTraceCount: this.store.traceCount(),
      storedEntryCount: this.store.entryCount(),
      storedStepCount: this.store.stepCount(),
      storedNodeCount: this.store.nodeCount(),
      storedReferenceCount: this.store.referenceCount(),
      storedSnapshotCount: this.store.snapshotCount(),
      structuralHealth: buildStructuralHealth(this.store, stamp, storeHealth.message),
    };
  }

  async statistics(): Promise<ExecutionTraceStatisticsResult> {
    const stamp = nowIso(this.runtime);
    return {
      ok: true,
      statistics: buildStatistics(this.store, stamp),
      code: "computed",
      message: "structural statistics computed — in-memory only, no telemetry",
    };
  }

  async createTrace(input: CreateTraceInput): Promise<CreateTraceResult> {
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

    const stamp = nowIso(this.runtime);
    const executionTraceId =
      input.executionTraceId ?? this.runtime.createExecutionTraceId?.() ?? createExecutionTraceId();

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
      createSnapshotId: this.runtime.createSnapshotId ?? createTraceSnapshotId,
      createTimelineId: this.runtime.createTimelineId ?? createTraceTimelineId,
      createStepId: this.runtime.createStepId ?? createTraceStepId,
      createNodeId: this.runtime.createNodeId ?? createTraceNodeId,
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

    const stamp = nowIso(this.runtime);
    const { trace, entry } = appendEntryToTrace(stored.trace, input, stamp, {
      createEntryId: this.runtime.createEntryId ?? createTraceEntryId,
      createSnapshotId: this.runtime.createSnapshotId ?? createTraceSnapshotId,
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

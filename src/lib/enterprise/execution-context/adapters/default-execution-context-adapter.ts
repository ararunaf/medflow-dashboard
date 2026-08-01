/**
 * DefaultExecutionContextAdapter — adapter default in-memory (EPC-24 Sprint 03).
 *
 * Implementação totalmente in-memory.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem Workers. Sem filas.
 *
 * Cria, propaga e enriquece estruturalmente o Execution Context.
 * Nenhum processamento é executado.
 */
import {
  createContextId,
  createHistoryId,
  createReferenceId,
  createSnapshotId,
  createTraceId,
} from "../ports/identity";
import type { ExecutionContextPort } from "../ports/execution-context-port";
import type {
  CreateContextInput,
  CreateContextResult,
  ExecutionContextCapabilities,
  ExecutionContextHealth,
  GetContextInput,
  GetContextResult,
  ListContextsInput,
  ListContextsResult,
  UpdateContextInput,
  UpdateContextResult,
} from "../ports/types";
import { DefaultExecutionContextStore, type ExecutionContextStore } from "../store";
import {
  applyUpdate,
  buildContext,
  filterContexts,
  foundationCapabilitiesBase,
  persistContext,
} from "./context-helpers";

export const DEFAULT_EXECUTION_CONTEXT_ADAPTER_ID = "default-in-process";
export const DEFAULT_EXECUTION_CONTEXT_VERSION = "1.0.0";

/**
 * Runtime injetável — permite testes sem acoplar a Engines ou produto.
 */
export type DefaultExecutionContextRuntime = {
  store?: ExecutionContextStore;
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createContextId?: () => string;
  createReferenceId?: () => string;
  createHistoryId?: () => string;
  createSnapshotId?: () => string;
  createTraceId?: () => string;
  now?: () => string;
};

function defaultRuntime(): DefaultExecutionContextRuntime {
  return {
    store: new DefaultExecutionContextStore(),
  };
}

function nowIso(runtime: DefaultExecutionContextRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

export class DefaultExecutionContextAdapter implements ExecutionContextPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultExecutionContextRuntime;
  private readonly store: ExecutionContextStore;

  constructor(runtime: DefaultExecutionContextRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultExecutionContextStore();
  }

  getStore(): ExecutionContextStore {
    return this.store;
  }

  capabilities(): ExecutionContextCapabilities {
    return {
      provider: "default",
      ...foundationCapabilitiesBase(DEFAULT_EXECUTION_CONTEXT_ADAPTER_ID),
    };
  }

  async health(): Promise<ExecutionContextHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

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
            ? "Default execution-context probe ok."
            : "Default execution-context probe falhou."),
        storedContextCount: this.store.contextCount(),
        storedSnapshotCount: this.store.snapshotCount(),
        storedHistoryCount: this.store.historyCount(),
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
        "DefaultExecutionContextStore pronto (sem I/O externo — EPC-24 Sprint 03).",
      storedContextCount: this.store.contextCount(),
      storedSnapshotCount: this.store.snapshotCount(),
      storedHistoryCount: this.store.historyCount(),
    };
  }

  async createContext(input: CreateContextInput = {}): Promise<CreateContextResult> {
    const stamp = nowIso(this.runtime);
    const contextId = input.contextId ?? this.runtime.createContextId?.() ?? createContextId();

    if (this.store.getContext(contextId)) {
      return {
        ok: false,
        code: "already_exists",
        message: "execution context already exists",
      };
    }

    const context = buildContext(input, contextId, stamp, {
      createReferenceId: this.runtime.createReferenceId ?? createReferenceId,
      createHistoryId: this.runtime.createHistoryId ?? createHistoryId,
      createSnapshotId: this.runtime.createSnapshotId ?? createSnapshotId,
      createTraceId: this.runtime.createTraceId ?? createTraceId,
    });

    persistContext(this.store, context);

    return {
      ok: true,
      context,
      code: "created",
      message: "execution context created structurally — no processing performed",
    };
  }

  async updateContext(input: UpdateContextInput): Promise<UpdateContextResult> {
    if (!input.contextId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "contextId required",
      };
    }

    const stored = this.store.getContext(input.contextId);
    if (!stored) {
      return {
        ok: false,
        code: "not_found",
        message: "execution context not found",
      };
    }

    const stamp = nowIso(this.runtime);
    const context = applyUpdate(stored.context, input, stamp, {
      createReferenceId: this.runtime.createReferenceId ?? createReferenceId,
      createHistoryId: this.runtime.createHistoryId ?? createHistoryId,
      createSnapshotId: this.runtime.createSnapshotId ?? createSnapshotId,
    });

    persistContext(this.store, context);

    return {
      ok: true,
      context,
      code: "updated",
      message: "execution context updated structurally — no processing performed",
    };
  }

  async getContext(input: GetContextInput): Promise<GetContextResult> {
    if (!input.contextId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "contextId required",
      };
    }

    const stored = this.store.getContext(input.contextId);
    if (!stored) {
      return {
        ok: false,
        code: "not_found",
        message: "execution context not found",
      };
    }

    return {
      ok: true,
      context: stored.context,
      code: "found",
      message: "execution context retrieved",
    };
  }

  async listContexts(input: ListContextsInput = {}): Promise<ListContextsResult> {
    const all = this.store.listContexts().map((entry) => entry.context);
    const contexts = filterContexts(all, input);
    return {
      ok: true,
      contexts,
      total: contexts.length,
      code: "listed",
      message: "execution contexts listed",
    };
  }
}

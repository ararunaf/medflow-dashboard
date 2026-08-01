/**
 * MockExecutionContextAdapter — EPC-24 Sprint 03.
 *
 * Voltado para testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência externa.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem Workers. Sem filas.
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
  ExecutionContextProviderId,
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

export const MOCK_EXECUTION_CONTEXT_ADAPTER_ID = "mock-in-memory";
export const MOCK_EXECUTION_CONTEXT_VERSION = "1.0.0";

export type MockExecutionContextAdapterOptions = {
  provider?: Extract<ExecutionContextProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: ExecutionContextStore;
  createContextId?: () => string;
  createReferenceId?: () => string;
  createHistoryId?: () => string;
  createSnapshotId?: () => string;
  createTraceId?: () => string;
  now?: () => string;
};

export class MockExecutionContextAdapter implements ExecutionContextPort {
  readonly providerId: Extract<ExecutionContextProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: ExecutionContextStore;
  private readonly createContextIdFn: () => string;
  private readonly createReferenceIdFn: () => string;
  private readonly createHistoryIdFn: () => string;
  private readonly createSnapshotIdFn: () => string;
  private readonly createTraceIdFn: () => string;
  private readonly now?: () => string;

  constructor(options: MockExecutionContextAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} execution-context ready.`;
    this.store = options.store ?? new DefaultExecutionContextStore();
    this.createContextIdFn = options.createContextId ?? createContextId;
    this.createReferenceIdFn = options.createReferenceId ?? createReferenceId;
    this.createHistoryIdFn = options.createHistoryId ?? createHistoryId;
    this.createSnapshotIdFn = options.createSnapshotId ?? createSnapshotId;
    this.createTraceIdFn = options.createTraceId ?? createTraceId;
    this.now = options.now;
  }

  getStore(): ExecutionContextStore {
    return this.store;
  }

  capabilities(): ExecutionContextCapabilities {
    return {
      provider: this.providerId,
      ...foundationCapabilitiesBase(`${this.providerId}-in-memory`),
    };
  }

  async health(): Promise<ExecutionContextHealth> {
    return {
      ok: this.healthy,
      provider: this.providerId,
      message: this.message,
      storedContextCount: this.store.contextCount(),
      storedSnapshotCount: this.store.snapshotCount(),
      storedHistoryCount: this.store.historyCount(),
    };
  }

  private stamp(): string {
    return this.now?.() ?? new Date().toISOString();
  }

  private unhealthy<T extends { ok: boolean; code?: string; message?: string }>(
    extra: Omit<T, "ok" | "code" | "message"> = {} as Omit<T, "ok" | "code" | "message">,
  ): T {
    return {
      ...extra,
      ok: false,
      code: "unhealthy",
      message: this.message,
    } as T;
  }

  async createContext(input: CreateContextInput = {}): Promise<CreateContextResult> {
    if (!this.healthy) return this.unhealthy<CreateContextResult>();

    const stamp = this.stamp();
    const contextId = input.contextId ?? this.createContextIdFn();

    if (this.store.getContext(contextId)) {
      return {
        ok: false,
        code: "already_exists",
        message: "execution context already exists",
      };
    }

    const context = buildContext(input, contextId, stamp, {
      createReferenceId: this.createReferenceIdFn,
      createHistoryId: this.createHistoryIdFn,
      createSnapshotId: this.createSnapshotIdFn,
      createTraceId: this.createTraceIdFn,
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
    if (!this.healthy) return this.unhealthy<UpdateContextResult>();

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

    const stamp = this.stamp();
    const context = applyUpdate(stored.context, input, stamp, {
      createReferenceId: this.createReferenceIdFn,
      createHistoryId: this.createHistoryIdFn,
      createSnapshotId: this.createSnapshotIdFn,
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
    if (!this.healthy) return this.unhealthy<GetContextResult>();

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
    if (!this.healthy) {
      return this.unhealthy<ListContextsResult>({ contexts: [], total: 0 });
    }

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

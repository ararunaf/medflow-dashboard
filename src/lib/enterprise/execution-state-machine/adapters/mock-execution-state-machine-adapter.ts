/**
 * MockExecutionStateMachineAdapter — EPC-24 Sprint 04.
 *
 * Voltado para testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência externa.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem Workers. Sem filas.
 */
import {
  createHistoryId,
  createStateId,
  createStateMachineId,
  createTransitionId,
  createTransitionRuleId,
} from "../ports/identity";
import type { ExecutionStateMachinePort } from "../ports/execution-state-machine-port";
import type {
  CreateStateMachineInput,
  CreateStateMachineResult,
  ExecutionStateMachineHealth,
  ExecutionStateMachinePortCapabilities,
  ExecutionStateMachineProviderId,
  GetCurrentStateInput,
  GetCurrentStateResult,
  GetHistoryInput,
  GetHistoryResult,
  TransitionInput,
  TransitionResult,
} from "../ports/types";
import { DefaultExecutionStateMachineStore, type ExecutionStateMachineStore } from "../store";
import {
  applyTransition,
  buildLifecycle,
  foundationCapabilitiesBase,
  persistLifecycle,
} from "./state-machine-helpers";

export const MOCK_EXECUTION_STATE_MACHINE_ADAPTER_ID = "mock-in-memory";
export const MOCK_EXECUTION_STATE_MACHINE_VERSION = "1.0.0";

export type MockExecutionStateMachineAdapterOptions = {
  provider?: Extract<ExecutionStateMachineProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: ExecutionStateMachineStore;
  createStateMachineId?: () => string;
  createStateId?: () => string;
  createTransitionId?: () => string;
  createHistoryId?: () => string;
  createTransitionRuleId?: () => string;
  now?: () => string;
};

export class MockExecutionStateMachineAdapter implements ExecutionStateMachinePort {
  readonly providerId: Extract<ExecutionStateMachineProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: ExecutionStateMachineStore;
  private readonly createStateMachineIdFn: () => string;
  private readonly createStateIdFn: () => string;
  private readonly createTransitionIdFn: () => string;
  private readonly createHistoryIdFn: () => string;
  private readonly createTransitionRuleIdFn: () => string;
  private readonly now?: () => string;

  constructor(options: MockExecutionStateMachineAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} execution-state-machine ready.`;
    this.store = options.store ?? new DefaultExecutionStateMachineStore();
    this.createStateMachineIdFn = options.createStateMachineId ?? createStateMachineId;
    this.createStateIdFn = options.createStateId ?? createStateId;
    this.createTransitionIdFn = options.createTransitionId ?? createTransitionId;
    this.createHistoryIdFn = options.createHistoryId ?? createHistoryId;
    this.createTransitionRuleIdFn = options.createTransitionRuleId ?? createTransitionRuleId;
    this.now = options.now;
  }

  getStore(): ExecutionStateMachineStore {
    return this.store;
  }

  capabilities(): ExecutionStateMachinePortCapabilities {
    return {
      provider: this.providerId,
      ...foundationCapabilitiesBase(`${this.providerId}-in-memory`),
    };
  }

  async health(): Promise<ExecutionStateMachineHealth> {
    return {
      ok: this.healthy,
      provider: this.providerId,
      message: this.message,
      storedLifecycleCount: this.store.lifecycleCount(),
      storedTransitionCount: this.store.transitionCount(),
      storedHistoryCount: this.store.historyCount(),
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

  async createStateMachine(input: CreateStateMachineInput): Promise<CreateStateMachineResult> {
    if (!this.healthy) return this.unhealthyResult<CreateStateMachineResult>();

    if (!input.executionId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "executionId required",
      };
    }

    const existingByExecution = this.store.getLifecycleByExecution(input.executionId);
    if (existingByExecution) {
      return {
        ok: false,
        code: "already_exists",
        message: "execution state machine already exists for executionId",
      };
    }

    const stamp = this.stamp();
    const stateMachineId = input.stateMachineId ?? this.createStateMachineIdFn();

    if (this.store.getLifecycle(stateMachineId)) {
      return {
        ok: false,
        code: "already_exists",
        message: "execution state machine already exists",
      };
    }

    const lifecycle = buildLifecycle(input, stateMachineId, stamp, {
      createStateId: this.createStateIdFn,
      createHistoryId: this.createHistoryIdFn,
      createTransitionRuleId: this.createTransitionRuleIdFn,
    });

    persistLifecycle(this.store, lifecycle);

    return {
      ok: true,
      lifecycle,
      code: "created",
      message: "execution state machine created structurally — no processing performed",
    };
  }

  async transition(input: TransitionInput): Promise<TransitionResult> {
    if (!this.healthy) {
      return {
        kind: "execution-transition-result",
        ok: false,
        stateMachineId: input.stateMachineId ?? "",
        executionId: "",
        code: "unhealthy",
        message: this.message,
      };
    }

    if (!input.stateMachineId) {
      return {
        kind: "execution-transition-result",
        ok: false,
        stateMachineId: "",
        executionId: "",
        code: "invalid_input",
        message: "stateMachineId required",
      };
    }

    const stored = this.store.getLifecycle(input.stateMachineId);
    if (!stored) {
      return {
        kind: "execution-transition-result",
        ok: false,
        stateMachineId: input.stateMachineId,
        executionId: "",
        code: "not_found",
        message: "execution state machine not found",
      };
    }

    const stamp = this.stamp();
    const applied = applyTransition(stored.lifecycle, input, stamp, {
      createStateId: this.createStateIdFn,
      createTransitionId: this.createTransitionIdFn,
    });

    if (!applied.ok) {
      return {
        kind: "execution-transition-result",
        ok: false,
        stateMachineId: stored.lifecycle.stateMachineId,
        executionId: stored.lifecycle.executionId,
        from: applied.from,
        to: applied.to,
        code: applied.code,
        message: applied.message,
      };
    }

    persistLifecycle(this.store, applied.lifecycle);

    return {
      kind: "execution-transition-result",
      ok: true,
      stateMachineId: applied.lifecycle.stateMachineId,
      executionId: applied.lifecycle.executionId,
      from: applied.transition.from,
      to: applied.transition.to,
      transition: applied.transition,
      lifecycle: applied.lifecycle,
      code: "transitioned",
      message: "structural state transition applied — no engines invoked",
    };
  }

  async getCurrentState(input: GetCurrentStateInput): Promise<GetCurrentStateResult> {
    if (!this.healthy) return this.unhealthyResult<GetCurrentStateResult>();

    if (!input.stateMachineId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "stateMachineId required",
      };
    }

    const stored = this.store.getLifecycle(input.stateMachineId);
    if (!stored) {
      return {
        ok: false,
        code: "not_found",
        message: "execution state machine not found",
      };
    }

    return {
      ok: true,
      state: stored.lifecycle.currentState,
      lifecycle: stored.lifecycle,
      code: "found",
      message: "current structural state retrieved",
    };
  }

  async getHistory(input: GetHistoryInput): Promise<GetHistoryResult> {
    if (!this.healthy) return this.unhealthyResult<GetHistoryResult>();

    if (!input.stateMachineId) {
      return {
        ok: false,
        code: "invalid_input",
        message: "stateMachineId required",
      };
    }

    const stored = this.store.getLifecycle(input.stateMachineId);
    if (!stored) {
      return {
        ok: false,
        code: "not_found",
        message: "execution state machine not found",
      };
    }

    return {
      ok: true,
      history: stored.lifecycle.history,
      transitions: stored.lifecycle.history.transitions,
      code: "found",
      message: "structural state history retrieved",
    };
  }
}

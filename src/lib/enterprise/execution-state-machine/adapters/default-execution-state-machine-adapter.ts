/**
 * DefaultExecutionStateMachineAdapter — adapter default in-memory (EPC-24 Sprint 04).
 *
 * Implementação totalmente in-memory.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações.
 * Sem banco. Sem HTTP. Sem Workers. Sem filas.
 *
 * Controla exclusivamente o ciclo de vida estrutural.
 * Nenhum processamento é executado.
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

export const DEFAULT_EXECUTION_STATE_MACHINE_ADAPTER_ID = "default-in-process";
export const DEFAULT_EXECUTION_STATE_MACHINE_VERSION = "1.0.0";

/**
 * Runtime injetável — permite testes sem acoplar a Engines ou produto.
 */
export type DefaultExecutionStateMachineRuntime = {
  store?: ExecutionStateMachineStore;
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createStateMachineId?: () => string;
  createStateId?: () => string;
  createTransitionId?: () => string;
  createHistoryId?: () => string;
  createTransitionRuleId?: () => string;
  now?: () => string;
};

function defaultRuntime(): DefaultExecutionStateMachineRuntime {
  return {
    store: new DefaultExecutionStateMachineStore(),
  };
}

function nowIso(runtime: DefaultExecutionStateMachineRuntime): string {
  return runtime.now?.() ?? new Date().toISOString();
}

export class DefaultExecutionStateMachineAdapter implements ExecutionStateMachinePort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultExecutionStateMachineRuntime;
  private readonly store: ExecutionStateMachineStore;

  constructor(runtime: DefaultExecutionStateMachineRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultExecutionStateMachineStore();
  }

  getStore(): ExecutionStateMachineStore {
    return this.store;
  }

  capabilities(): ExecutionStateMachinePortCapabilities {
    return {
      provider: "default",
      ...foundationCapabilitiesBase(DEFAULT_EXECUTION_STATE_MACHINE_ADAPTER_ID),
    };
  }

  async health(): Promise<ExecutionStateMachineHealth> {
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
            ? "Default execution-state-machine probe ok."
            : "Default execution-state-machine probe falhou."),
        storedLifecycleCount: this.store.lifecycleCount(),
        storedTransitionCount: this.store.transitionCount(),
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
        "DefaultExecutionStateMachineStore pronto (sem I/O externo — EPC-24 Sprint 04).",
      storedLifecycleCount: this.store.lifecycleCount(),
      storedTransitionCount: this.store.transitionCount(),
      storedHistoryCount: this.store.historyCount(),
    };
  }

  async createStateMachine(input: CreateStateMachineInput): Promise<CreateStateMachineResult> {
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

    const stamp = nowIso(this.runtime);
    const stateMachineId =
      input.stateMachineId ?? this.runtime.createStateMachineId?.() ?? createStateMachineId();

    if (this.store.getLifecycle(stateMachineId)) {
      return {
        ok: false,
        code: "already_exists",
        message: "execution state machine already exists",
      };
    }

    const lifecycle = buildLifecycle(input, stateMachineId, stamp, {
      createStateId: this.runtime.createStateId ?? createStateId,
      createHistoryId: this.runtime.createHistoryId ?? createHistoryId,
      createTransitionRuleId: this.runtime.createTransitionRuleId ?? createTransitionRuleId,
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

    const stamp = nowIso(this.runtime);
    const applied = applyTransition(stored.lifecycle, input, stamp, {
      createStateId: this.runtime.createStateId ?? createStateId,
      createTransitionId: this.runtime.createTransitionId ?? createTransitionId,
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

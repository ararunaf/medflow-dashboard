/**
 * Tipos vendor-agnósticos da Execution State Machine — EPC-24 Sprint 04.
 *
 * Controla exclusivamente o ciclo de vida estrutural de uma execução.
 * NÃO executa OCR, IA, Mapping, regras, validações ou parsers.
 *
 * Arquitetura obrigatória (ECS-01):
 *   Application → ExecutionStateMachinePort → Adapter → Store → Factory → Provider
 */
import type {
  ExecutionLifecycle,
  ExecutionState,
  ExecutionStateHistory,
  ExecutionStateTransition,
  ExecutionStatus,
  ExecutionTransitionResult,
} from "./models";

export type {
  ExecutionLifecycle,
  ExecutionState,
  ExecutionStateCapabilities,
  ExecutionStateDefinition,
  ExecutionStateHistory,
  ExecutionStateMetadata,
  ExecutionStateRecordKind,
  ExecutionStateTransition,
  ExecutionStatus,
  ExecutionTransitionResult,
  ExecutionTransitionRule,
  TerminalExecutionStatus,
} from "./models";

/* ─────────────────────────────────────────────────────────────────────────
 * Mecanismo do Port (adapter id)
 * ───────────────────────────────────────────────────────────────────────── */

/** Provedores / mecanismos da Execution State Machine (extensível). */
export type ExecutionStateMachineProviderId = "default" | "mock" | "test";

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — createStateMachine
 * ───────────────────────────────────────────────────────────────────────── */

/** Entrada estrutural de criação da máquina de estados. */
export type CreateStateMachineInput = {
  stateMachineId?: string;
  executionId: string;
  correlationId?: string;
  /** Estado inicial. Default: Created. */
  initialStatus?: ExecutionStatus;
  tags?: readonly string[];
  version?: string;
  structuralNotes?: string;
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/** Resultado estrutural de createStateMachine. */
export type CreateStateMachineResult = {
  ok: boolean;
  lifecycle?: ExecutionLifecycle;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — transition
 * ───────────────────────────────────────────────────────────────────────── */

/** Pedido estrutural de transição de estado. */
export type TransitionInput = {
  stateMachineId: string;
  to: ExecutionStatus;
  reason?: string;
  notes?: string;
  attributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/** Resultado estrutural de transition (= ExecutionTransitionResult enriquecido). */
export type TransitionResult = ExecutionTransitionResult;

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — getCurrentState
 * ───────────────────────────────────────────────────────────────────────── */

export type GetCurrentStateInput = {
  stateMachineId: string;
};

export type GetCurrentStateResult = {
  ok: boolean;
  state?: ExecutionState;
  lifecycle?: ExecutionLifecycle;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — getHistory
 * ───────────────────────────────────────────────────────────────────────── */

export type GetHistoryInput = {
  stateMachineId: string;
};

export type GetHistoryResult = {
  ok: boolean;
  history?: ExecutionStateHistory;
  transitions?: readonly ExecutionStateTransition[];
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Health / Capabilities / Provider options
 * ───────────────────────────────────────────────────────────────────────── */

export type ExecutionStateMachineHealth = {
  ok: boolean;
  provider: ExecutionStateMachineProviderId;
  latencyMs?: number;
  message?: string;
  storedLifecycleCount?: number;
  storedTransitionCount?: number;
  storedHistoryCount?: number;
};

/**
 * Capacidades do ExecutionStateMachinePort.
 * Declara explicitamente o que a fundação NÃO faz.
 */
export type ExecutionStateMachinePortCapabilities = {
  provider: ExecutionStateMachineProviderId;
  adapterId: string;
  supportsCreateStateMachine: true;
  supportsTransition: true;
  supportsGetCurrentState: true;
  supportsGetHistory: true;
  supportsHealth: true;
  supportsCapabilities: true;
  /** Ciclo de vida estrutural exclusivamente — sem processamento. */
  structuralLifecycleOnly: true;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  implementsOcr: false;
  implementsAi: false;
  implementsXmlParser: false;
  implementsTissRules: false;
  implementsMapping: false;
  implementsValidation: false;
  implementsPersistence: false;
  implementsUi: false;
  implementsHttpWorkersQueues: false;
  noDirectEngineCoupling: true;
  /** Desacoplada de Engines (OCR / IA / Rule / Mapping). */
  decoupledFromEngines: true;
};

/** Opções de resolução do ExecutionStateMachinePort (provider factory). */
export type ExecutionStateMachineProviderOptions = {
  /**
   * Mecanismo desejado. Default de produção da fundação: `default`
   * (DefaultExecutionStateMachineAdapter).
   */
  provider?: ExecutionStateMachineProviderId;
};

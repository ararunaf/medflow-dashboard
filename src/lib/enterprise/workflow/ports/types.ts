/**
 * Tipos vendor-agnósticos da camada de workflow — EPC-05.
 *
 * Nenhum tipo clínico, financeiro, TISS, OCR, IA, Authorization, Auditoria,
 * Contract Intelligence ou Persistence de produto deve aparecer aqui.
 * O Workflow Engine é genérico e reutilizável em qualquer plataforma IAeasy.
 *
 * Conceitos nativos únicos:
 * Workflow | Stage | Transition | State | Action | Condition | Event |
 * Trigger | Result | Status | Timeout | History | Checkpoint
 */

/** Provedores / mecanismos de workflow (extensível). */
export type WorkflowProviderId =
  | "default"
  | "mock"
  | "test"
  | "database"
  | "remote"
  | "persistence";

/** Resultado de health check do mecanismo de workflow. */
export type WorkflowHealth = {
  ok: boolean;
  provider: WorkflowProviderId;
  latencyMs?: number;
  message?: string;
};

/**
 * Capacidades declaradas pelo adapter.
 * Usado por Application/Domain para decisões sem conhecer o store.
 */
export type WorkflowCapabilities = {
  provider: WorkflowProviderId;
  /** Identificador legível do adapter (ex.: default-in-process). */
  adapterId: string;
  supportsRegisterWorkflow: boolean;
  supportsGetWorkflow: boolean;
  supportsListWorkflows: boolean;
  supportsStart: boolean;
  supportsAdvance: boolean;
  supportsRollback: boolean;
  supportsCancel: boolean;
  supportsGetState: boolean;
  /** Descritores de condição (sem Rule Engine). */
  supportsConditions: boolean;
  /** History / Checkpoint estruturais. */
  supportsHistory: boolean;
  /** Timeout estrutural (sem scheduler externo nesta sprint). */
  supportsTimeout: boolean;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Conceitos nativos
 * ───────────────────────────────────────────────────────────────────────── */

/** Identificador estável de um artefato de workflow. */
export type WorkflowId = string;

/** Nome lógico. */
export type WorkflowName = string;

/** Namespace lógico — isolamento estrutural. */
export type WorkflowNamespace = string;

/** Tag genérica. */
export type WorkflowTag = string;

/** Identificador de instância de execução (State). */
export type WorkflowInstanceId = string;

/** Identificador de Stage. */
export type WorkflowStageId = string;

/** Identificador de Transition. */
export type WorkflowTransitionId = string;

/** Identificador de Checkpoint. */
export type WorkflowCheckpointId = string;

/**
 * Status nativo do Workflow Engine (definição ou instância).
 * Sem semântica de negócio clínico/financeiro.
 */
export type WorkflowStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "cancelled"
  | "failed"
  | "timed_out"
  | "rolled_back";

/** Status conhecidos (infraestrutura). */
export const WORKFLOW_STATUSES: readonly WorkflowStatus[] = [
  "draft",
  "active",
  "paused",
  "completed",
  "cancelled",
  "failed",
  "timed_out",
  "rolled_back",
] as const;

/**
 * Referência genérica a metadata (FASE 9 prep).
 * O Workflow NÃO conhece entidades; apenas aponta para descrições externas.
 */
export type WorkflowMetadataRef = {
  /** Id de Schema/Entity/Template no Metadata Engine (opaco). */
  metadataId?: string;
  /** Namespace opaco no Metadata Engine. */
  metadataNamespace?: string;
  /** Nome lógico opaco. */
  metadataName?: string;
  /** Versão opaca. */
  metadataVersion?: string;
  /** Kind estrutural livre (ex.: "schema", "entity") — sem interpretação. */
  metadataKind?: string;
};

/**
 * Kinds de Condition (FASE 5/6) — infraestrutura apenas.
 * NÃO há Rule Engine; avaliação é estrutural/trivial no adapter.
 */
export type WorkflowConditionKind =
  | "always"
  | "never"
  | "expression"
  | "event"
  | "metadata"
  | "external";

export const WORKFLOW_CONDITION_KINDS: readonly WorkflowConditionKind[] = [
  "always",
  "never",
  "expression",
  "event",
  "metadata",
  "external",
] as const;

/**
 * Condition nativa — descriptor estrutural.
 * Interpretação de negócio fica no Rule Engine futuro.
 */
export type WorkflowCondition = {
  id?: string;
  name?: WorkflowName;
  kind: WorkflowConditionKind;
  /** Expressão / chave opaca — sem evaluator de domínio. */
  expression?: string;
  /** Evento esperado (quando kind = event). */
  eventName?: string;
  /** Ref opaca a metadata (quando kind = metadata). */
  metadataRef?: WorkflowMetadataRef;
  /** Parâmetros estruturais livres. */
  params?: Readonly<Record<string, unknown>>;
  description?: string;
  tags?: readonly WorkflowTag[];
};

/**
 * Kinds de Action — infraestrutura.
 * NÃO executa OCR/IA/regras; apenas registra intenção estrutural.
 */
export type WorkflowActionKind =
  | "noop"
  | "emit_event"
  | "set_status"
  | "checkpoint"
  | "external"
  | "metadata";

export const WORKFLOW_ACTION_KINDS: readonly WorkflowActionKind[] = [
  "noop",
  "emit_event",
  "set_status",
  "checkpoint",
  "external",
  "metadata",
] as const;

/** Action nativa — descriptor estrutural sem side-effects de negócio. */
export type WorkflowAction = {
  id?: string;
  name?: WorkflowName;
  kind: WorkflowActionKind;
  /** Payload estrutural opaco. */
  payload?: Readonly<Record<string, unknown>>;
  /** Evento a emitir (quando kind = emit_event). */
  eventName?: string;
  /** Status alvo (quando kind = set_status). */
  targetStatus?: WorkflowStatus;
  metadataRef?: WorkflowMetadataRef;
  description?: string;
  tags?: readonly WorkflowTag[];
};

/** Trigger nativo — o que inicia / avança estruturalmente. */
export type WorkflowTriggerKind = "manual" | "event" | "timeout" | "external" | "start";

export type WorkflowTrigger = {
  id?: string;
  name?: WorkflowName;
  kind: WorkflowTriggerKind;
  eventName?: string;
  /** Timeout estrutural associado (ms) — sem scheduler externo. */
  timeoutMs?: number;
  description?: string;
  tags?: readonly WorkflowTag[];
};

/** Event nativo — sinal estrutural no fluxo. */
export type WorkflowEvent = {
  id?: string;
  name: WorkflowName;
  description?: string;
  payload?: Readonly<Record<string, unknown>>;
  tags?: readonly WorkflowTag[];
  occurredAt?: string;
};

/** Timeout nativo — descriptor estrutural. */
export type WorkflowTimeout = {
  id?: string;
  name?: WorkflowName;
  /** Duração em ms (estrutura; sem timer de processo nesta sprint). */
  durationMs: number;
  /** Stage / Transition alvo opcional. */
  targetStageId?: WorkflowStageId;
  targetTransitionId?: WorkflowTransitionId;
  /** Ação estrutural ao expirar. */
  onTimeoutActions?: readonly WorkflowAction[];
  description?: string;
};

/** Stage nativo — ponto no grafo do Workflow. */
export type WorkflowStage = {
  id: WorkflowStageId;
  name: WorkflowName;
  description?: string;
  /** Stage inicial do Workflow. */
  initial?: boolean;
  /** Stage terminal (completed estrutural). */
  terminal?: boolean;
  /** Actions estruturais ao entrar / sair. */
  onEnter?: readonly WorkflowAction[];
  onExit?: readonly WorkflowAction[];
  timeout?: WorkflowTimeout;
  metadataRef?: WorkflowMetadataRef;
  tags?: readonly WorkflowTag[];
};

/** Transition nativa — aresta entre Stages. */
export type WorkflowTransition = {
  id: WorkflowTransitionId;
  name: WorkflowName;
  fromStageId: WorkflowStageId;
  toStageId: WorkflowStageId;
  /** Conditions estruturais (todas must-pass no adapter trivial). */
  conditions?: readonly WorkflowCondition[];
  /** Actions estruturais ao atravessar. */
  actions?: readonly WorkflowAction[];
  trigger?: WorkflowTrigger;
  description?: string;
  tags?: readonly WorkflowTag[];
  metadataRef?: WorkflowMetadataRef;
};

/**
 * Workflow nativo — definição composta de Stages / Transitions / …
 * Sem lógica de negócio.
 */
export type WorkflowDefinition = {
  id: WorkflowId;
  name: WorkflowName;
  namespace?: WorkflowNamespace;
  description?: string;
  status?: WorkflowStatus;
  stages: readonly WorkflowStage[];
  transitions: readonly WorkflowTransition[];
  /** Events declarados na definição. */
  events?: readonly WorkflowEvent[];
  /** Triggers de início. */
  triggers?: readonly WorkflowTrigger[];
  /** Ref opaca a Metadata Engine (FASE 9). */
  metadataRef?: WorkflowMetadataRef;
  tags?: readonly WorkflowTag[];
  createdAt?: string;
  updatedAt?: string;
};

/** Result nativo — resultado estrutural de uma operação. */
export type WorkflowResult = {
  ok: boolean;
  message?: string;
  /** Código estrutural livre (ex.: "not_found", "invalid_transition"). */
  code?: string;
  /** Dados estruturais opcionais. */
  data?: Readonly<Record<string, unknown>>;
};

/** History entry — registro estrutural de avanço / rollback / cancel. */
export type WorkflowHistoryEntry = {
  id: string;
  at: string;
  /** Tipo estrutural do evento de histórico. */
  kind: "start" | "advance" | "rollback" | "cancel" | "checkpoint" | "timeout" | "action" | "event";
  fromStageId?: WorkflowStageId;
  toStageId?: WorkflowStageId;
  transitionId?: WorkflowTransitionId;
  checkpointId?: WorkflowCheckpointId;
  status?: WorkflowStatus;
  eventName?: string;
  actionName?: string;
  message?: string;
  payload?: Readonly<Record<string, unknown>>;
};

/** Checkpoint nativo — snapshot estrutural para rollback. */
export type WorkflowCheckpoint = {
  id: WorkflowCheckpointId;
  at: string;
  stageId: WorkflowStageId;
  status: WorkflowStatus;
  label?: string;
  payload?: Readonly<Record<string, unknown>>;
};

/**
 * State nativo — instância de execução de um Workflow.
 * Controla apenas estágio atual, status, history e checkpoints.
 */
export type WorkflowState = {
  instanceId: WorkflowInstanceId;
  workflowId: WorkflowId;
  currentStageId: WorkflowStageId;
  status: WorkflowStatus;
  startedAt: string;
  updatedAt: string;
  history: readonly WorkflowHistoryEntry[];
  checkpoints: readonly WorkflowCheckpoint[];
  /** Context estrutural opaco (sem semântica de domínio). */
  context?: Readonly<Record<string, unknown>>;
  metadataRef?: WorkflowMetadataRef;
  tags?: readonly WorkflowTag[];
};

/* ─────────────────────────────────────────────────────────────────────────
 * Inputs / Results do Port
 * ───────────────────────────────────────────────────────────────────────── */

export type RegisterWorkflowInput = {
  workflow: WorkflowDefinition;
};

export type RegisterWorkflowResult = WorkflowResult & {
  id: WorkflowId;
};

export type GetWorkflowInput = {
  id?: WorkflowId;
  name?: WorkflowName;
  namespace?: WorkflowNamespace;
};

export type GetWorkflowResult = WorkflowResult & {
  workflow?: WorkflowDefinition;
};

export type ListWorkflowsInput = {
  namespace?: WorkflowNamespace;
  status?: WorkflowStatus;
  tag?: WorkflowTag;
  namePrefix?: string;
};

export type ListWorkflowsResult = WorkflowResult & {
  workflows: readonly WorkflowDefinition[];
};

export type StartWorkflowInput = {
  workflowId: WorkflowId;
  /** Instance id opcional; gerado se ausente. */
  instanceId?: WorkflowInstanceId;
  context?: Readonly<Record<string, unknown>>;
  metadataRef?: WorkflowMetadataRef;
  tags?: readonly WorkflowTag[];
};

export type StartWorkflowResult = WorkflowResult & {
  state?: WorkflowState;
};

export type AdvanceWorkflowInput = {
  instanceId: WorkflowInstanceId;
  /** Transition explícita (preferencial). */
  transitionId?: WorkflowTransitionId;
  /** Alternativa: stage destino (resolve 1ª transition válida). */
  toStageId?: WorkflowStageId;
  /** Evento estrutural que dispara a transition (quando condition kind=event). */
  eventName?: string;
  /** Context merge estrutural. */
  context?: Readonly<Record<string, unknown>>;
  /** Criar checkpoint antes do advance. */
  checkpoint?: boolean;
  checkpointLabel?: string;
};

export type AdvanceWorkflowResult = WorkflowResult & {
  state?: WorkflowState;
};

export type RollbackWorkflowInput = {
  instanceId: WorkflowInstanceId;
  /** Checkpoint alvo; default = último. */
  checkpointId?: WorkflowCheckpointId;
};

export type RollbackWorkflowResult = WorkflowResult & {
  state?: WorkflowState;
};

export type CancelWorkflowInput = {
  instanceId: WorkflowInstanceId;
  message?: string;
};

export type CancelWorkflowResult = WorkflowResult & {
  state?: WorkflowState;
};

export type GetStateInput = {
  instanceId: WorkflowInstanceId;
};

export type GetStateResult = WorkflowResult & {
  state?: WorkflowState;
};

/** Opções de resolução do WorkflowPort (provider factory). */
export type WorkflowProviderOptions = {
  /**
   * Provedor desejado. Default de produção: `default`.
   * Em testes: `mock` | `test`.
   */
  provider?: WorkflowProviderId;
};

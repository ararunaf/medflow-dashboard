/**
 * Modelos canônicos da Execution State Machine — EPC-24 Sprint 04.
 *
 * Representação estrutural do ciclo de vida de uma execução.
 * Sem regras de negócio. Sem OCR. Sem IA. Sem Mapping. Sem parsers.
 * Sem validações TISS. Sem contratos. Sem operadoras.
 */

/* ─────────────────────────────────────────────────────────────────────────
 * Status / kinds
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Status estrutural do ciclo de vida da execução.
 * Apenas enumeração — nenhuma ação associada.
 */
export type ExecutionStatus =
  | "Created"
  | "Pending"
  | "Resolving"
  | "Ready"
  | "Running"
  | "Waiting"
  | "Paused"
  | "Completed"
  | "Cancelled"
  | "Failed";

/** Status terminais (sem transições de saída estruturais). */
export type TerminalExecutionStatus = "Completed" | "Cancelled" | "Failed";

/** Kinds de registros canônicos da State Machine. */
export type ExecutionStateRecordKind =
  | "execution-state"
  | "execution-state-transition"
  | "execution-lifecycle"
  | "execution-status"
  | "execution-state-history"
  | "execution-state-metadata"
  | "execution-state-capabilities"
  | "execution-state-definition"
  | "execution-transition-rule"
  | "execution-transition-result";

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionStateDefinition
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Definição estrutural de um estado possível.
 * Sem comportamento associado. Sem regras de negócio.
 */
export type ExecutionStateDefinition = {
  kind: "execution-state-definition";
  status: ExecutionStatus;
  /** Indica se o estado é terminal (estrutural). */
  terminal: boolean;
  /** Ordem estrutural sugerida no ciclo de vida (0-based). */
  order: number;
  notes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionTransitionRule
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Regra estrutural de transição permitida (grafo de estados).
 * NÃO é regra de negócio TISS / clínica / contratual.
 * Apenas declara arestas válidas do grafo estrutural.
 */
export type ExecutionTransitionRule = {
  kind: "execution-transition-rule";
  id: string;
  from: ExecutionStatus;
  to: ExecutionStatus;
  notes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionStateMetadata
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Metadados estruturais da máquina de estados.
 * Sem interpretação de negócio.
 */
export type ExecutionStateMetadata = {
  kind: "execution-state-metadata";
  tags?: readonly string[];
  version?: string;
  createdAt?: string;
  updatedAt?: string;
  startedAt?: string;
  finishedAt?: string;
  structuralNotes?: string;
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionState
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Estado corrente estrutural de uma máquina de execução.
 * Sem ações. Sem invocação de Engines.
 */
export type ExecutionState = {
  kind: "execution-state";
  id: string;
  /** Id da máquina de estados. */
  stateMachineId: string;
  /** Id da execução associada (opaco — tipicamente = contextId). */
  executionId: string;
  status: ExecutionStatus;
  /** Definição estrutural do estado corrente. */
  definition: ExecutionStateDefinition;
  metadata: ExecutionStateMetadata;
  occurredAt: string;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionStateTransition
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Transição estrutural registrada (aresta percorrida).
 * Nenhuma ação de negócio ocorre durante a transição.
 */
export type ExecutionStateTransition = {
  kind: "execution-state-transition";
  id: string;
  stateMachineId: string;
  executionId: string;
  from: ExecutionStatus;
  to: ExecutionStatus;
  occurredAt: string;
  /** Motivo estrutural opaco (sem interpretação). */
  reason?: string;
  notes?: string;
  attributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionStateHistory
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Histórico estrutural de transições de uma máquina.
 */
export type ExecutionStateHistory = {
  kind: "execution-state-history";
  id: string;
  stateMachineId: string;
  executionId: string;
  transitions: readonly ExecutionStateTransition[];
  entryCount: number;
  createdAt: string;
  updatedAt: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionStateCapabilities (modelo canônico embutido)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Capacidades estruturais declaradas pela máquina.
 * Explicitamente sem Engines / OCR / IA / regras.
 */
export type ExecutionStateCapabilities = {
  kind: "execution-state-capabilities";
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
  decoupledFromEngines: true;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionLifecycle
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Agregado canônico da máquina de estados de uma execução.
 * Controla exclusivamente o ciclo de vida estrutural.
 */
export type ExecutionLifecycle = {
  kind: "execution-lifecycle";
  id: string;
  /** Alias (= id da máquina). */
  stateMachineId: string;
  executionId: string;
  correlationId?: string;
  currentState: ExecutionState;
  history: ExecutionStateHistory;
  metadata: ExecutionStateMetadata;
  capability: ExecutionStateCapabilities;
  /** Definições estruturais de todos os estados conhecidos. */
  definitions: readonly ExecutionStateDefinition[];
  /** Regras estruturais de transição (grafo). */
  transitionRules: readonly ExecutionTransitionRule[];
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionTransitionResult
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Resultado estrutural de uma tentativa de transição.
 * Sem efeitos colaterais de negócio.
 */
export type ExecutionTransitionResult = {
  kind: "execution-transition-result";
  ok: boolean;
  stateMachineId: string;
  executionId: string;
  from?: ExecutionStatus;
  to?: ExecutionStatus;
  transition?: ExecutionStateTransition;
  lifecycle?: ExecutionLifecycle;
  code?: string;
  message?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Catálogo estrutural de estados
 * ───────────────────────────────────────────────────────────────────────── */

/** Catálogo canônico dos estados estruturais (ordem de ciclo de vida). */
export const EXECUTION_STATE_DEFINITIONS: readonly ExecutionStateDefinition[] = [
  {
    kind: "execution-state-definition",
    status: "Created",
    terminal: false,
    order: 0,
    notes: "Máquina criada — estado inicial estrutural",
  },
  {
    kind: "execution-state-definition",
    status: "Pending",
    terminal: false,
    order: 1,
    notes: "Aguardando composição / preparação estrutural",
  },
  {
    kind: "execution-state-definition",
    status: "Resolving",
    terminal: false,
    order: 2,
    notes: "Resolução estrutural do pipeline em andamento",
  },
  {
    kind: "execution-state-definition",
    status: "Ready",
    terminal: false,
    order: 3,
    notes: "Pipeline anexado — pronto para percurso estrutural",
  },
  {
    kind: "execution-state-definition",
    status: "Running",
    terminal: false,
    order: 4,
    notes: "Percurso estrutural em andamento — sem Engines",
  },
  {
    kind: "execution-state-definition",
    status: "Waiting",
    terminal: false,
    order: 5,
    notes: "Aguardando estruturalmente — sem processamento",
  },
  {
    kind: "execution-state-definition",
    status: "Paused",
    terminal: false,
    order: 6,
    notes: "Pausado estruturalmente — sem processamento",
  },
  {
    kind: "execution-state-definition",
    status: "Completed",
    terminal: true,
    order: 7,
    notes: "Ciclo de vida estrutural concluído",
  },
  {
    kind: "execution-state-definition",
    status: "Cancelled",
    terminal: true,
    order: 8,
    notes: "Ciclo de vida estrutural cancelado",
  },
  {
    kind: "execution-state-definition",
    status: "Failed",
    terminal: true,
    order: 9,
    notes: "Ciclo de vida estrutural falhou",
  },
] as const;

/** Lookup rápido de definição por status. */
export function getExecutionStateDefinition(status: ExecutionStatus): ExecutionStateDefinition {
  const found = EXECUTION_STATE_DEFINITIONS.find((d) => d.status === status);
  if (!found) {
    throw new Error(`Unknown execution status: ${status}`);
  }
  return found;
}

export function isTerminalExecutionStatus(status: ExecutionStatus): boolean {
  return status === "Completed" || status === "Cancelled" || status === "Failed";
}

/**
 * Grafo estrutural de transições permitidas.
 * Dados canônicos — não são regras de negócio.
 */
export const STRUCTURAL_TRANSITION_EDGES: readonly Readonly<{
  from: ExecutionStatus;
  to: ExecutionStatus;
}>[] = [
  { from: "Created", to: "Pending" },
  { from: "Created", to: "Cancelled" },
  { from: "Created", to: "Failed" },
  { from: "Pending", to: "Resolving" },
  { from: "Pending", to: "Cancelled" },
  { from: "Pending", to: "Failed" },
  { from: "Resolving", to: "Ready" },
  { from: "Resolving", to: "Cancelled" },
  { from: "Resolving", to: "Failed" },
  { from: "Ready", to: "Running" },
  { from: "Ready", to: "Paused" },
  { from: "Ready", to: "Cancelled" },
  { from: "Ready", to: "Failed" },
  { from: "Running", to: "Waiting" },
  { from: "Running", to: "Paused" },
  { from: "Running", to: "Completed" },
  { from: "Running", to: "Cancelled" },
  { from: "Running", to: "Failed" },
  { from: "Waiting", to: "Running" },
  { from: "Waiting", to: "Paused" },
  { from: "Waiting", to: "Cancelled" },
  { from: "Waiting", to: "Failed" },
  { from: "Paused", to: "Running" },
  { from: "Paused", to: "Ready" },
  { from: "Paused", to: "Cancelled" },
  { from: "Paused", to: "Failed" },
] as const;

export function buildStructuralTransitionRules(
  createRuleId: () => string,
): ExecutionTransitionRule[] {
  return STRUCTURAL_TRANSITION_EDGES.map((edge) => ({
    kind: "execution-transition-rule" as const,
    id: createRuleId(),
    from: edge.from,
    to: edge.to,
    notes: `Structural edge ${edge.from} → ${edge.to}`,
  }));
}

export function isStructuralTransitionAllowed(from: ExecutionStatus, to: ExecutionStatus): boolean {
  return STRUCTURAL_TRANSITION_EDGES.some((edge) => edge.from === from && edge.to === to);
}

/** Capacidades canônicas embutidas em toda Lifecycle. */
export const STRUCTURAL_STATE_CAPABILITY: ExecutionStateCapabilities = {
  kind: "execution-state-capabilities",
  structuralLifecycleOnly: true,
  enginesInvoked: false,
  stagesExecuted: false,
  processingPerformed: false,
  implementsOcr: false,
  implementsAi: false,
  implementsXmlParser: false,
  implementsTissRules: false,
  implementsMapping: false,
  implementsValidation: false,
  implementsPersistence: false,
  implementsUi: false,
  implementsHttpWorkersQueues: false,
  noDirectEngineCoupling: true,
  decoupledFromEngines: true,
};

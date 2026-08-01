/**
 * Modelos canônicos do Execution Context — EPC-24 Sprint 03.
 *
 * Representação estrutural do estado completo de uma execução.
 * Transporte canônico apenas — sem regras de negócio.
 * Sem OCR. Sem IA. Sem Mapping. Sem regras. Sem validações. Sem parsers.
 */

/* ─────────────────────────────────────────────────────────────────────────
 * Status / kinds
 * ───────────────────────────────────────────────────────────────────────── */

/** Status estrutural do contexto de execução. */
export type ExecutionContextStatus =
  | "pending"
  | "composing"
  | "ready"
  | "completed"
  | "failed"
  | "cancelled";

/** Fase estrutural do ciclo de vida do contexto. */
export type ExecutionContextPhase =
  | "created"
  | "pipeline-attached"
  | "structurally-enriched"
  | "finalized";

/** Kinds de registros canônicos do Execution Context. */
export type ExecutionContextRecordKind =
  | "execution-context"
  | "execution-context-identity"
  | "execution-context-metadata"
  | "execution-context-state"
  | "execution-context-reference"
  | "execution-context-history"
  | "execution-context-stage"
  | "execution-context-capability"
  | "execution-context-snapshot"
  | "execution-context-trace";

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionContextIdentity
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Identidade estrutural do contexto.
 * Sem resolução de tenant / usuário / domínio clínico.
 */
export type ExecutionContextIdentity = {
  kind: "execution-context-identity";
  /** Id estável do contexto (= contextId). */
  contextId: string;
  /** Alias de execução (mesmo valor do contextId nesta fundação). */
  executionId: string;
  correlationId?: string;
  /** Tenant opaco (referência — sem resolução). */
  tenantRef?: string;
  /** Canal / origem estrutural. */
  channel?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionContextMetadata
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Metadados estruturais do contexto.
 * Sem interpretação de negócio.
 */
export type ExecutionContextMetadata = {
  kind: "execution-context-metadata";
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
 * ExecutionContextState
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Estado estrutural do contexto.
 * Sem máquina de estados de negócio — apenas representação.
 */
export type ExecutionContextState = {
  kind: "execution-context-state";
  status: ExecutionContextStatus;
  phase: ExecutionContextPhase;
  /** Nome estrutural do estágio corrente (opaco). */
  currentStageName?: string;
  /** Índice estrutural do estágio corrente (0-based). */
  currentStageOrder?: number;
  /** Quantidade de estágios anexados. */
  stageCount: number;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionContextReference
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Referências opacas acumuladas ao longo da execução.
 * Sem interpretação. Sem invocação de Ports / Engines.
 */
export type ExecutionContextReference = {
  kind: "execution-context-reference";
  id: string;
  name: string;
  /** Valor opaco da referência. */
  value: string;
  /** Estágio associado (opcional). */
  stageName?: string;
  /** Notas estruturais. */
  notes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionContextHistory
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Entrada de histórico estrutural (append-only in-process).
 * Sem decisões. Sem regras.
 */
export type ExecutionContextHistoryEntry = {
  kind: "execution-context-history";
  id: string;
  contextId: string;
  event: string;
  phase?: ExecutionContextPhase;
  status?: ExecutionContextStatus;
  occurredAt: string;
  notes?: string;
  attributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionContextStage
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Estágio estrutural anexado ao contexto a partir da composição do pipeline.
 * Referencia Port oficial — sem invocação.
 */
export type ExecutionContextStage = {
  kind: "execution-context-stage";
  id: string;
  name: string;
  order: number;
  portRef: string;
  portContract: string;
  status: ExecutionContextStatus;
  artifactRef?: string;
  attachedAt?: string;
  notes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionContextCapability
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Declaração estrutural do que o contexto NÃO executa.
 * Modelo de transporte — sem enforcement de regra.
 */
export type ExecutionContextCapability = {
  kind: "execution-context-capability";
  structuralTransportOnly: true;
  enginesInvoked: false;
  stagesExecuted: false;
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
 * ExecutionContextSnapshot
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Snapshot estrutural pontual do contexto.
 * Sem persistência externa. Sem banco.
 */
export type ExecutionContextSnapshot = {
  kind: "execution-context-snapshot";
  id: string;
  contextId: string;
  status: ExecutionContextStatus;
  phase: ExecutionContextPhase;
  stageCount: number;
  referenceCount: number;
  historyCount: number;
  capturedAt: string;
  notes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionContextTrace
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Rastreamento estrutural do contexto.
 * In-process apenas. Sem banco. Sem I/O externo.
 */
export type ExecutionContextTrace = {
  kind: "execution-context-trace";
  id: string;
  contextId: string;
  correlationId?: string;
  stages: readonly ExecutionContextStage[];
  history: readonly ExecutionContextHistoryEntry[];
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  status: ExecutionContextStatus;
  errors: readonly string[];
  warnings: readonly string[];
  /** Declara explicitamente transporte estrutural apenas. */
  structuralOnly: true;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Pipeline composition attachment (opaque structural payload)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Composição de pipeline anexada estruturalmente ao contexto.
 * O Resolver permanece independente do conteúdo do Context —
 * o Orchestrator anexa o resultado canônico após a resolução.
 */
export type ExecutionContextPipelineAttachment = {
  pipelineId?: string;
  pipelineName?: string;
  pipelineVersion?: string;
  resolutionId?: string;
  resolutionResultId?: string;
  stageCount: number;
  nodeCount: number;
  officialPortRefs: readonly string[];
  officialPortContracts: readonly string[];
  enginesInvoked: false;
  stagesExecuted: false;
  attachedAt?: string;
  structuralNotes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionContext (aggregate)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Contexto canônico de execução — único objeto compartilhado
 * ao longo do pipeline (transporte estrutural).
 *
 * Nesta sprint: criado, propagado e enriquecido estruturalmente.
 * Nenhuma etapa é executada. Nenhum Engine é invocado.
 */
export type ExecutionContext = {
  kind: "execution-context";
  id: string;
  identity: ExecutionContextIdentity;
  metadata: ExecutionContextMetadata;
  state: ExecutionContextState;
  references: readonly ExecutionContextReference[];
  history: readonly ExecutionContextHistoryEntry[];
  stages: readonly ExecutionContextStage[];
  capability: ExecutionContextCapability;
  snapshots: readonly ExecutionContextSnapshot[];
  trace?: ExecutionContextTrace;
  /** Pedido estrutural de origem (opaco). */
  requestCorrelationId?: string;
  /** Composição de pipeline anexada (pós-Resolver). */
  pipeline?: ExecutionContextPipelineAttachment;
  /** Resultado / trace ids opacos do Orchestrator (sem interpretação). */
  resultId?: string;
  orchestratorTraceId?: string;
};

/** União tipada de registros canônicos. */
export type ExecutionContextRecord =
  | ExecutionContext
  | ExecutionContextIdentity
  | ExecutionContextMetadata
  | ExecutionContextState
  | ExecutionContextReference
  | ExecutionContextHistoryEntry
  | ExecutionContextStage
  | ExecutionContextCapability
  | ExecutionContextSnapshot
  | ExecutionContextTrace;

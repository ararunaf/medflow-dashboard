/**
 * Modelos canônicos do Execution Trace — EPC-24 Sprint 07.
 *
 * Representação estrutural do rastreamento de uma execução.
 * Sem regras de negócio. Sem OCR. Sem IA. Sem Mapping. Sem parsers.
 * Sem banco. Sem persistência real. Sem logs reais. Sem telemetria.
 * Sem Engines. Sem acesso externo. Sem observabilidade externa.
 */

/* ─────────────────────────────────────────────────────────────────────────
 * Types / kinds
 * ───────────────────────────────────────────────────────────────────────── */

/** Kinds de registros canônicos do Execution Trace. */
export type ExecutionTraceRecordKind =
  | "execution-trace"
  | "execution-trace-entry"
  | "execution-trace-step"
  | "execution-trace-node"
  | "execution-trace-reference"
  | "execution-trace-metadata"
  | "execution-trace-snapshot"
  | "execution-trace-timeline"
  | "execution-trace-capabilities"
  | "execution-trace-statistics"
  | "execution-trace-health"
  | "execution-trace-result";

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionTraceMetadata
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Metadados estruturais do rastreador de execução.
 * Sem interpretação de negócio.
 */
export type ExecutionTraceMetadata = {
  kind: "execution-trace-metadata";
  tags?: readonly string[];
  version?: string;
  createdAt?: string;
  updatedAt?: string;
  structuralNotes?: string;
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionTraceReference
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Referência estrutural opaca anexada a um Trace.
 * Sem conteúdo de negócio.
 */
export type ExecutionTraceReference = {
  kind: "execution-trace-reference";
  name: string;
  value: string;
  notes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionTraceNode
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Nó estrutural do Trace (posição opaca na cadeia).
 * Sem regra de negócio. Sem execução.
 */
export type ExecutionTraceNode = {
  kind: "execution-trace-node";
  id: string;
  name: string;
  order: number;
  portRef?: string;
  notes?: string;
  enginesInvoked: false;
  processingPerformed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionTraceStep
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Step estrutural do Trace.
 * Representa uma etapa do rastreamento — sem execução real.
 */
export type ExecutionTraceStep = {
  kind: "execution-trace-step";
  id: string;
  name: string;
  order: number;
  status: "pending" | "recorded" | "skipped";
  occurredAt?: string;
  nodeId?: string;
  notes?: string;
  enginesInvoked: false;
  logsWritten: false;
  telemetrySent: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionTraceEntry
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Entrada estrutural anexável ao Trace.
 * NÃO é um log real. NÃO é telemetria. NÃO é auditoria funcional.
 */
export type ExecutionTraceEntry = {
  kind: "execution-trace-entry";
  id: string;
  executionTraceId: string;
  executionId: string;
  sequence: number;
  name: string;
  occurredAt: string;
  stepId?: string;
  nodeId?: string;
  references: readonly ExecutionTraceReference[];
  metadata: ExecutionTraceMetadata;
  notes?: string;
  /** Explicitamente sem log real. */
  logsWritten: false;
  /** Explicitamente sem telemetria. */
  telemetrySent: false;
  enginesInvoked: false;
  processingPerformed: false;
  persistenceImplemented: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionTraceSnapshot
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Snapshot estrutural do Trace em um momento.
 * Sem histórico funcional / sem auditoria.
 */
export type ExecutionTraceSnapshot = {
  kind: "execution-trace-snapshot";
  id: string;
  executionTraceId: string;
  executionId: string;
  capturedAt: string;
  entryCount: number;
  stepCount: number;
  nodeCount: number;
  referenceCount: number;
  notes?: string;
  enginesInvoked: false;
  logsWritten: false;
  telemetrySent: false;
  processingPerformed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionTraceTimeline
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Timeline estrutural do Trace (projeção ordenada das entradas).
 * Sem entrega. Sem observabilidade externa.
 */
export type ExecutionTraceTimeline = {
  kind: "execution-trace-timeline";
  id: string;
  executionTraceId: string;
  executionId: string;
  entryIds: readonly string[];
  stepIds: readonly string[];
  entryCount: number;
  updatedAt: string;
  notes?: string;
  logsWritten: false;
  telemetrySent: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionTraceCapabilities (modelo canônico embutido)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Capacidades estruturais declaradas pelo Trace.
 * Explicitamente sem logs / telemetria / persistência / Engines.
 */
export type ExecutionTraceCapabilities = {
  kind: "execution-trace-capabilities";
  structuralTraceOnly: true;
  persistenceImplemented: false;
  databaseUsed: false;
  logsImplemented: false;
  telemetryImplemented: false;
  observabilityExternal: false;
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
 * ExecutionTrace
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Trace canônico de uma execução.
 * Representa estruturalmente o ciclo de rastreabilidade — sem logs reais.
 */
export type ExecutionTrace = {
  kind: "execution-trace";
  id: string;
  /** Alias (= id do Trace). */
  executionTraceId: string;
  executionId: string;
  correlationId?: string;
  contextId?: string;
  stateMachineId?: string;
  eventBusId?: string;
  executionRegistryId?: string;
  pipelineId?: string;
  entries: readonly ExecutionTraceEntry[];
  steps: readonly ExecutionTraceStep[];
  nodes: readonly ExecutionTraceNode[];
  references: readonly ExecutionTraceReference[];
  metadata: ExecutionTraceMetadata;
  snapshot?: ExecutionTraceSnapshot;
  timeline: ExecutionTraceTimeline;
  capability: ExecutionTraceCapabilities;
  createdAt: string;
  updatedAt: string;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  persistenceImplemented: false;
  databaseUsed: false;
  logsImplemented: false;
  telemetryImplemented: false;
  observabilityExternal: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionTraceStatistics
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Estatísticas estruturais do Trace in-memory.
 * Sem métricas de negócio / sem analytics / sem telemetria.
 */
export type ExecutionTraceStatistics = {
  kind: "execution-trace-statistics";
  totalTraces: number;
  totalEntries: number;
  totalSteps: number;
  totalNodes: number;
  totalReferences: number;
  totalSnapshots: number;
  computedAt: string;
  persistenceImplemented: false;
  databaseUsed: false;
  logsImplemented: false;
  telemetryImplemented: false;
  enginesInvoked: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionTraceHealth (modelo canônico)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Saúde estrutural do Trace (modelo canônico).
 * Distinto do health do Port (types) — aqui é representação estrutural.
 */
export type ExecutionTraceHealth = {
  kind: "execution-trace-health";
  ok: boolean;
  message?: string;
  traceCount: number;
  entryCount: number;
  timelineReady: true;
  persistenceImplemented: false;
  databaseUsed: false;
  logsImplemented: false;
  telemetryImplemented: false;
  enginesInvoked: false;
  checkedAt: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionTraceResult
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Resultado estrutural de uma operação do Trace.
 * Sem efeitos colaterais de persistência / logs / telemetria.
 */
export type ExecutionTraceResult = {
  kind: "execution-trace-result";
  ok: boolean;
  executionTraceId?: string;
  executionId?: string;
  trace?: ExecutionTrace;
  entry?: ExecutionTraceEntry;
  entries?: readonly ExecutionTraceEntry[];
  statistics?: ExecutionTraceStatistics;
  health?: ExecutionTraceHealth;
  code?: string;
  message?: string;
  persistenceImplemented: false;
  databaseUsed: false;
  logsImplemented: false;
  telemetryImplemented: false;
  enginesInvoked: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Catálogo estrutural
 * ───────────────────────────────────────────────────────────────────────── */

/** Capacidades canônicas embutidas em todo Trace. */
export const STRUCTURAL_TRACE_CAPABILITY: ExecutionTraceCapabilities = {
  kind: "execution-trace-capabilities",
  structuralTraceOnly: true,
  persistenceImplemented: false,
  databaseUsed: false,
  logsImplemented: false,
  telemetryImplemented: false,
  observabilityExternal: false,
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

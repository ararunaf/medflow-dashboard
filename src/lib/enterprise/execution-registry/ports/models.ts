/**
 * Modelos canônicos do Execution Registry — EPC-24 Sprint 06.
 *
 * Representação estrutural do catálogo de execuções.
 * Sem regras de negócio. Sem OCR. Sem IA. Sem Mapping. Sem parsers.
 * Sem banco. Sem persistência real. Sem histórico funcional.
 * Sem Engines. Sem acesso externo.
 */

/* ─────────────────────────────────────────────────────────────────────────
 * Types / kinds
 * ───────────────────────────────────────────────────────────────────────── */

/** Kinds de registros canônicos do Execution Registry. */
export type ExecutionRegistryRecordKind =
  | "execution-registry-entry"
  | "execution-registry-record"
  | "execution-registry-metadata"
  | "execution-registry-reference"
  | "execution-registry-index"
  | "execution-registry-snapshot"
  | "execution-registry-capabilities"
  | "execution-registry-query"
  | "execution-registry-filter"
  | "execution-registry-result"
  | "execution-registry-statistics"
  | "execution-registry-health";

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionRegistryMetadata
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Metadados estruturais do registro de execução.
 * Sem interpretação de negócio.
 */
export type ExecutionRegistryMetadata = {
  kind: "execution-registry-metadata";
  tags?: readonly string[];
  version?: string;
  createdAt?: string;
  updatedAt?: string;
  structuralNotes?: string;
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionRegistryReference
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Referência estrutural opaca anexada a uma entrada do Registry.
 * Sem conteúdo de negócio.
 */
export type ExecutionRegistryReference = {
  kind: "execution-registry-reference";
  name: string;
  value: string;
  notes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionRegistrySnapshot
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Snapshot estrutural de uma entrada no momento do registro.
 * Sem histórico funcional / sem timeline de negócio.
 */
export type ExecutionRegistrySnapshot = {
  kind: "execution-registry-snapshot";
  id: string;
  executionRegistryId: string;
  executionId: string;
  capturedAt: string;
  referenceCount: number;
  notes?: string;
  enginesInvoked: false;
  processingPerformed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionRegistryCapabilities (modelo canônico embutido)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Capacidades estruturais declaradas pelo Registry.
 * Explicitamente sem persistência / banco / Engines / processamento.
 */
export type ExecutionRegistryCapabilities = {
  kind: "execution-registry-capabilities";
  structuralRegistryOnly: true;
  persistenceImplemented: false;
  databaseUsed: false;
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
 * ExecutionRegistryFilter / ExecutionRegistryQuery
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Filtro estrutural para listagem / busca.
 * Sem regras de negócio.
 */
export type ExecutionRegistryFilter = {
  kind: "execution-registry-filter";
  executionId?: string;
  correlationId?: string;
  contextId?: string;
  stateMachineId?: string;
  eventBusId?: string;
  pipelineId?: string;
  tags?: readonly string[];
  limit?: number;
};

/**
 * Query estrutural para findExecution.
 * Descritor opaco — sem interpretação de negócio.
 */
export type ExecutionRegistryQuery = {
  kind: "execution-registry-query";
  executionRegistryId?: string;
  executionId?: string;
  correlationId?: string;
  filter?: ExecutionRegistryFilter;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionRegistryEntry
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Entrada canônica do catálogo de execuções.
 * Representa estruturalmente uma execução registrada — sem persistência real.
 */
export type ExecutionRegistryEntry = {
  kind: "execution-registry-entry";
  id: string;
  /** Alias (= id da entrada). */
  executionRegistryId: string;
  executionId: string;
  correlationId?: string;
  contextId?: string;
  stateMachineId?: string;
  eventBusId?: string;
  pipelineId?: string;
  references: readonly ExecutionRegistryReference[];
  metadata: ExecutionRegistryMetadata;
  snapshot?: ExecutionRegistrySnapshot;
  capability: ExecutionRegistryCapabilities;
  registeredAt: string;
  updatedAt: string;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionRegistryRecord
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Record estrutural que envolve uma entrada do Registry.
 * Camada de projeção — sem regra de negócio.
 */
export type ExecutionRegistryRecord = {
  kind: "execution-registry-record";
  id: string;
  executionRegistryId: string;
  executionId: string;
  entry: ExecutionRegistryEntry;
  recordedAt: string;
  notes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionRegistryIndex
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Índice estrutural in-memory do catálogo.
 * Sem banco. Sem cache distribuído.
 */
export type ExecutionRegistryIndex = {
  kind: "execution-registry-index";
  id: string;
  entryCount: number;
  executionIds: readonly string[];
  executionRegistryIds: readonly string[];
  updatedAt: string;
  notes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionRegistryStatistics
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Estatísticas estruturais do catálogo in-memory.
 * Sem métricas de negócio / sem analytics.
 */
export type ExecutionRegistryStatistics = {
  kind: "execution-registry-statistics";
  totalEntries: number;
  totalRecords: number;
  totalReferences: number;
  totalSnapshots: number;
  computedAt: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionRegistryHealth (modelo canônico)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Saúde estrutural do Registry (modelo canônico).
 * Distinto do health do Port (types) — aqui é representação estrutural.
 */
export type ExecutionRegistryHealth = {
  kind: "execution-registry-health";
  ok: boolean;
  message?: string;
  entryCount: number;
  recordCount: number;
  indexReady: true;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  checkedAt: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionRegistryResult
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Resultado estrutural de uma operação do Registry.
 * Sem efeitos colaterais de persistência / negócio.
 */
export type ExecutionRegistryResult = {
  kind: "execution-registry-result";
  ok: boolean;
  executionRegistryId?: string;
  executionId?: string;
  entry?: ExecutionRegistryEntry;
  record?: ExecutionRegistryRecord;
  entries?: readonly ExecutionRegistryEntry[];
  index?: ExecutionRegistryIndex;
  statistics?: ExecutionRegistryStatistics;
  health?: ExecutionRegistryHealth;
  code?: string;
  message?: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Catálogo estrutural
 * ───────────────────────────────────────────────────────────────────────── */

/** Capacidades canônicas embutidas em toda entrada do Registry. */
export const STRUCTURAL_REGISTRY_CAPABILITY: ExecutionRegistryCapabilities = {
  kind: "execution-registry-capabilities",
  structuralRegistryOnly: true,
  persistenceImplemented: false,
  databaseUsed: false,
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

/**
 * Tipos vendor-agnósticos do Execution Registry — EPC-24 Sprint 06.
 *
 * Representa estruturalmente o catálogo de execuções.
 * NÃO persiste em banco. NÃO usa Supabase. NÃO executa Engines.
 * NÃO implementa histórico funcional.
 *
 * Arquitetura obrigatória (ECS-01):
 *   Application → ExecutionRegistryPort → Adapter → Store → Factory → Provider
 */
import type {
  ExecutionRegistryEntry,
  ExecutionRegistryFilter,
  ExecutionRegistryHealth,
  ExecutionRegistryIndex,
  ExecutionRegistryQuery,
  ExecutionRegistryRecord,
  ExecutionRegistryResult,
  ExecutionRegistryStatistics,
} from "./models";

export type {
  ExecutionRegistryCapabilities,
  ExecutionRegistryEntry,
  ExecutionRegistryFilter,
  ExecutionRegistryHealth,
  ExecutionRegistryIndex,
  ExecutionRegistryMetadata,
  ExecutionRegistryQuery,
  ExecutionRegistryRecord,
  ExecutionRegistryRecordKind,
  ExecutionRegistryReference,
  ExecutionRegistryResult,
  ExecutionRegistrySnapshot,
  ExecutionRegistryStatistics,
} from "./models";

/* ─────────────────────────────────────────────────────────────────────────
 * Mecanismo do Port (adapter id)
 * ───────────────────────────────────────────────────────────────────────── */

/** Provedores / mecanismos do Execution Registry (extensível). */
export type ExecutionRegistryProviderId = "default" | "mock" | "test";

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — registerExecution
 * ───────────────────────────────────────────────────────────────────────── */

/** Entrada estrutural de registro de execução. */
export type RegisterExecutionInput = {
  executionRegistryId?: string;
  executionId: string;
  correlationId?: string;
  contextId?: string;
  stateMachineId?: string;
  eventBusId?: string;
  pipelineId?: string;
  tags?: readonly string[];
  version?: string;
  structuralNotes?: string;
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
  references?: readonly {
    name: string;
    value: string;
    notes?: string;
  }[];
};

/** Resultado estrutural de registerExecution. */
export type RegisterExecutionResult = {
  ok: boolean;
  entry?: ExecutionRegistryEntry;
  record?: ExecutionRegistryRecord;
  message?: string;
  code?: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — getExecution
 * ───────────────────────────────────────────────────────────────────────── */

export type GetRegistryExecutionInput = {
  executionRegistryId?: string;
  executionId?: string;
};

export type GetRegistryExecutionResult = {
  ok: boolean;
  entry?: ExecutionRegistryEntry;
  record?: ExecutionRegistryRecord;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — listExecutions
 * ───────────────────────────────────────────────────────────────────────── */

export type ListRegistryExecutionsInput = {
  filter?: ExecutionRegistryFilter;
  limit?: number;
};

export type ListRegistryExecutionsResult = {
  ok: boolean;
  entries?: readonly ExecutionRegistryEntry[];
  records?: readonly ExecutionRegistryRecord[];
  total?: number;
  index?: ExecutionRegistryIndex;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — findExecution
 * ───────────────────────────────────────────────────────────────────────── */

export type FindRegistryExecutionInput = {
  query: ExecutionRegistryQuery;
};

export type FindRegistryExecutionResult = ExecutionRegistryResult;

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — removeExecution
 * ───────────────────────────────────────────────────────────────────────── */

export type RemoveRegistryExecutionInput = {
  executionRegistryId?: string;
  executionId?: string;
};

export type RemoveRegistryExecutionResult = {
  ok: boolean;
  entry?: ExecutionRegistryEntry;
  message?: string;
  code?: string;
  persistenceImplemented: false;
  databaseUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Health / Capabilities / Statistics / Provider options
 * ───────────────────────────────────────────────────────────────────────── */

export type ExecutionRegistryPortHealth = {
  ok: boolean;
  provider: ExecutionRegistryProviderId;
  latencyMs?: number;
  message?: string;
  storedEntryCount?: number;
  storedRecordCount?: number;
  storedReferenceCount?: number;
  storedSnapshotCount?: number;
  structuralHealth?: ExecutionRegistryHealth;
};

/**
 * Capacidades do ExecutionRegistryPort.
 * Declara explicitamente o que a fundação NÃO faz.
 */
export type ExecutionRegistryPortCapabilities = {
  provider: ExecutionRegistryProviderId;
  adapterId: string;
  supportsRegisterExecution: true;
  supportsGetExecution: true;
  supportsListExecutions: true;
  supportsFindExecution: true;
  supportsRemoveExecution: true;
  supportsHealth: true;
  supportsCapabilities: true;
  supportsStatistics: true;
  /** Registry estrutural exclusivamente — sem persistência real. */
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
  /** Desacoplado de Engines (OCR / IA / Rule / Mapping). */
  decoupledFromEngines: true;
};

export type ExecutionRegistryStatisticsResult = {
  ok: boolean;
  statistics?: ExecutionRegistryStatistics;
  message?: string;
  code?: string;
};

/** Opções de resolução do ExecutionRegistryPort (provider factory). */
export type ExecutionRegistryProviderOptions = {
  /**
   * Mecanismo desejado. Default de produção da fundação: `default`
   * (DefaultExecutionRegistryAdapter).
   */
  provider?: ExecutionRegistryProviderId;
};

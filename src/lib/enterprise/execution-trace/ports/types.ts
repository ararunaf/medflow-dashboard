/**
 * Tipos vendor-agnósticos do Execution Trace — EPC-24 Sprint 07.
 *
 * Representa estruturalmente o rastreamento de uma execução.
 * NÃO escreve logs reais. NÃO envia telemetria. NÃO usa observabilidade externa.
 * NÃO persiste em banco. NÃO executa Engines.
 *
 * Arquitetura obrigatória (ECS-01):
 *   Application → ExecutionTracePort → Adapter → Store → Factory → Provider
 */
import type {
  ExecutionTrace,
  ExecutionTraceEntry,
  ExecutionTraceHealth,
  ExecutionTraceResult,
  ExecutionTraceStatistics,
} from "./models";

export type {
  ExecutionTrace,
  ExecutionTraceCapabilities,
  ExecutionTraceEntry,
  ExecutionTraceHealth,
  ExecutionTraceMetadata,
  ExecutionTraceNode,
  ExecutionTraceRecordKind,
  ExecutionTraceReference,
  ExecutionTraceResult,
  ExecutionTraceSnapshot,
  ExecutionTraceStatistics,
  ExecutionTraceStep,
  ExecutionTraceTimeline,
} from "./models";

/* ─────────────────────────────────────────────────────────────────────────
 * Mecanismo do Port (adapter id)
 * ───────────────────────────────────────────────────────────────────────── */

/** Provedores / mecanismos do Execution Trace (extensível). */
export type ExecutionTraceProviderId = "default" | "mock" | "test";

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — createTrace
 * ───────────────────────────────────────────────────────────────────────── */

/** Entrada estrutural de criação de Trace. */
export type CreateTraceInput = {
  executionTraceId?: string;
  executionId: string;
  correlationId?: string;
  contextId?: string;
  stateMachineId?: string;
  eventBusId?: string;
  executionRegistryId?: string;
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
  nodes?: readonly {
    id?: string;
    name: string;
    order: number;
    portRef?: string;
    notes?: string;
  }[];
  steps?: readonly {
    id?: string;
    name: string;
    order: number;
    status?: "pending" | "recorded" | "skipped";
    nodeId?: string;
    notes?: string;
  }[];
};

/** Resultado estrutural de createTrace. */
export type CreateTraceResult = {
  ok: boolean;
  trace?: ExecutionTrace;
  message?: string;
  code?: string;
  persistenceImplemented: false;
  databaseUsed: false;
  logsImplemented: false;
  telemetryImplemented: false;
  enginesInvoked: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — appendTrace
 * ───────────────────────────────────────────────────────────────────────── */

/** Entrada estrutural de append de entrada no Trace. */
export type AppendTraceInput = {
  executionTraceId?: string;
  executionId?: string;
  entryId?: string;
  name: string;
  stepId?: string;
  nodeId?: string;
  notes?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
  references?: readonly {
    name: string;
    value: string;
    notes?: string;
  }[];
};

/** Resultado estrutural de appendTrace. */
export type AppendTraceResult = {
  ok: boolean;
  trace?: ExecutionTrace;
  entry?: ExecutionTraceEntry;
  message?: string;
  code?: string;
  persistenceImplemented: false;
  databaseUsed: false;
  logsImplemented: false;
  telemetryImplemented: false;
  enginesInvoked: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — getTrace
 * ───────────────────────────────────────────────────────────────────────── */

export type GetTraceInput = {
  executionTraceId?: string;
  executionId?: string;
};

export type GetTraceResult = {
  ok: boolean;
  trace?: ExecutionTrace;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — listTraceEntries
 * ───────────────────────────────────────────────────────────────────────── */

export type ListTraceEntriesInput = {
  executionTraceId?: string;
  executionId?: string;
  limit?: number;
};

export type ListTraceEntriesResult = {
  ok: boolean;
  executionTraceId?: string;
  executionId?: string;
  entries?: readonly ExecutionTraceEntry[];
  total?: number;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Health / Capabilities / Statistics / Provider options
 * ───────────────────────────────────────────────────────────────────────── */

export type ExecutionTracePortHealth = {
  ok: boolean;
  provider: ExecutionTraceProviderId;
  latencyMs?: number;
  message?: string;
  storedTraceCount?: number;
  storedEntryCount?: number;
  storedStepCount?: number;
  storedNodeCount?: number;
  storedReferenceCount?: number;
  storedSnapshotCount?: number;
  structuralHealth?: ExecutionTraceHealth;
};

/**
 * Capacidades do ExecutionTracePort.
 * Declara explicitamente o que a fundação NÃO faz.
 */
export type ExecutionTracePortCapabilities = {
  provider: ExecutionTraceProviderId;
  adapterId: string;
  supportsCreateTrace: true;
  supportsAppendTrace: true;
  supportsGetTrace: true;
  supportsListTraceEntries: true;
  supportsHealth: true;
  supportsCapabilities: true;
  supportsStatistics: true;
  /** Trace estrutural exclusivamente — sem logs / telemetria / persistência. */
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
  /** Desacoplado de Engines (OCR / IA / Rule / Mapping). */
  decoupledFromEngines: true;
};

export type ExecutionTraceStatisticsResult = {
  ok: boolean;
  statistics?: ExecutionTraceStatistics;
  message?: string;
  code?: string;
};

/** Opções de resolução do ExecutionTracePort (provider factory). */
export type ExecutionTraceProviderOptions = {
  /**
   * Mecanismo desejado. Default de produção da fundação: `default`
   * (DefaultExecutionTraceAdapter).
   */
  provider?: ExecutionTraceProviderId;
};

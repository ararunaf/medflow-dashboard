/**
 * Tipos vendor-agnósticos do Execution Context — EPC-24 Sprint 03.
 *
 * O Context apenas transporta estado estrutural da execução.
 * NÃO executa OCR, IA, Mapping, regras, validações ou parsers.
 *
 * Arquitetura obrigatória (ECS-01):
 *   Application → ExecutionContextPort → Adapter → Store → Factory → Provider
 */
import type {
  ExecutionContext,
  ExecutionContextHistoryEntry,
  ExecutionContextMetadata,
  ExecutionContextPhase,
  ExecutionContextPipelineAttachment,
  ExecutionContextReference,
  ExecutionContextSnapshot,
  ExecutionContextStage,
  ExecutionContextStatus,
  ExecutionContextTrace,
} from "./models";

export type {
  ExecutionContext,
  ExecutionContextCapability,
  ExecutionContextHistoryEntry,
  ExecutionContextIdentity,
  ExecutionContextMetadata,
  ExecutionContextPhase,
  ExecutionContextPipelineAttachment,
  ExecutionContextRecord,
  ExecutionContextRecordKind,
  ExecutionContextReference,
  ExecutionContextSnapshot,
  ExecutionContextStage,
  ExecutionContextState,
  ExecutionContextStatus,
  ExecutionContextTrace,
} from "./models";

/* ─────────────────────────────────────────────────────────────────────────
 * Mecanismo do Port (adapter id)
 * ───────────────────────────────────────────────────────────────────────── */

/** Provedores / mecanismos do Execution Context (extensível). */
export type ExecutionContextProviderId = "default" | "mock" | "test";

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — createContext
 * ───────────────────────────────────────────────────────────────────────── */

/** Entrada estrutural de criação de contexto. */
export type CreateContextInput = {
  contextId?: string;
  correlationId?: string;
  tenantRef?: string;
  channel?: string;
  tags?: readonly string[];
  version?: string;
  structuralNotes?: string;
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
  /** Refs opacas iniciais. */
  references?: readonly Omit<ExecutionContextReference, "kind" | "id">[];
};

/** Resultado estrutural de createContext. */
export type CreateContextResult = {
  ok: boolean;
  context?: ExecutionContext;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — updateContext
 * ───────────────────────────────────────────────────────────────────────── */

/** Patch estrutural do contexto — sem regras de negócio. */
export type UpdateContextInput = {
  contextId: string;
  status?: ExecutionContextStatus;
  phase?: ExecutionContextPhase;
  currentStageName?: string;
  currentStageOrder?: number;
  metadata?: Partial<ExecutionContextMetadata>;
  /** Substitui / anexa composição de pipeline. */
  pipeline?: ExecutionContextPipelineAttachment;
  /** Anexa estágios (substituição completa se fornecido). */
  stages?: readonly ExecutionContextStage[];
  /** Anexa referências. */
  appendReferences?: readonly Omit<ExecutionContextReference, "kind" | "id">[];
  /** Anexa entradas de histórico. */
  appendHistory?: readonly Omit<ExecutionContextHistoryEntry, "kind" | "id" | "contextId">[];
  /** Anexa snapshot. */
  appendSnapshot?: Omit<ExecutionContextSnapshot, "kind" | "id" | "contextId">;
  /** Define / atualiza trace. */
  trace?: ExecutionContextTrace;
  resultId?: string;
  orchestratorTraceId?: string;
  structuralNotes?: string;
};

/** Resultado estrutural de updateContext. */
export type UpdateContextResult = {
  ok: boolean;
  context?: ExecutionContext;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — getContext
 * ───────────────────────────────────────────────────────────────────────── */

export type GetContextInput = {
  contextId: string;
};

export type GetContextResult = {
  ok: boolean;
  context?: ExecutionContext;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — listContexts
 * ───────────────────────────────────────────────────────────────────────── */

export type ListContextsInput = {
  status?: ExecutionContextStatus;
  phase?: ExecutionContextPhase;
  limit?: number;
};

export type ListContextsResult = {
  ok: boolean;
  contexts: readonly ExecutionContext[];
  total: number;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Health / Capabilities / Provider options
 * ───────────────────────────────────────────────────────────────────────── */

export type ExecutionContextHealth = {
  ok: boolean;
  provider: ExecutionContextProviderId;
  latencyMs?: number;
  message?: string;
  storedContextCount?: number;
  storedSnapshotCount?: number;
  storedHistoryCount?: number;
};

/**
 * Capacidades do ExecutionContextPort.
 * Declara explicitamente o que a fundação NÃO faz.
 */
export type ExecutionContextCapabilities = {
  provider: ExecutionContextProviderId;
  adapterId: string;
  supportsCreateContext: true;
  supportsUpdateContext: true;
  supportsGetContext: true;
  supportsListContexts: true;
  supportsHealth: true;
  supportsCapabilities: true;
  /** Transporte estrutural exclusivamente — sem processamento. */
  structuralTransportOnly: true;
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

/** Opções de resolução do ExecutionContextPort (provider factory). */
export type ExecutionContextProviderOptions = {
  /**
   * Mecanismo desejado. Default de produção da fundação: `default`
   * (DefaultExecutionContextAdapter).
   */
  provider?: ExecutionContextProviderId;
};

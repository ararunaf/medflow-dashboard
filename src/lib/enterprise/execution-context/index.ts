/**
 * Enterprise Execution Context Foundation — Ports & Adapters (EPC-24 Sprint 03).
 *
 * Fluxo oficial:
 *   Application → ExecutionContextPort → ExecutionContextAdapter
 *     → ExecutionContextStore → ExecutionContextFactory
 *     → ExecutionContextProvider
 *
 * O Context NÃO executa OCR, IA, Mapping ou regras.
 * Apenas transporta e enriquece estruturalmente o estado da execução.
 *
 * Fluxo de orquestração:
 *   Canonical Execution Request
 *     → Execution Context
 *     → Pipeline Resolver
 *     → Pipeline Definition
 *     → Canonical Execution Result
 *
 * EPC-24 Sprint 03: transporte estrutural apenas.
 * Nenhuma etapa é executada.
 */
export type {
  CreateContextInput,
  CreateContextResult,
  ExecutionContext,
  ExecutionContextCapabilities,
  ExecutionContextCapability,
  ExecutionContextHealth,
  ExecutionContextHistoryEntry,
  ExecutionContextIdentity,
  ExecutionContextMetadata,
  ExecutionContextPhase,
  ExecutionContextPipelineAttachment,
  ExecutionContextPort,
  ExecutionContextProviderId,
  ExecutionContextProviderOptions,
  ExecutionContextRecord,
  ExecutionContextRecordKind,
  ExecutionContextReference,
  ExecutionContextSnapshot,
  ExecutionContextStage,
  ExecutionContextState,
  ExecutionContextStatus,
  ExecutionContextTrace,
  GetContextInput,
  GetContextResult,
  ListContextsInput,
  ListContextsResult,
  UpdateContextInput,
  UpdateContextResult,
} from "./ports";

export {
  createContextId,
  createHistoryId,
  createReferenceId,
  createSnapshotId,
  createStageId,
  createTraceId,
  resetAllExecutionContextIdSequences,
  resetContextIdSequence,
  resetHistoryIdSequence,
  resetReferenceIdSequence,
  resetSnapshotIdSequence,
  resetStageIdSequence,
  resetTraceIdSequence,
} from "./ports";

export {
  DEFAULT_EXECUTION_CONTEXT_ADAPTER_ID,
  DEFAULT_EXECUTION_CONTEXT_VERSION,
  DefaultExecutionContextAdapter,
  MOCK_EXECUTION_CONTEXT_ADAPTER_ID,
  MOCK_EXECUTION_CONTEXT_VERSION,
  MockExecutionContextAdapter,
  type DefaultExecutionContextRuntime,
  type MockExecutionContextAdapterOptions,
} from "./adapters";

export {
  DEFAULT_EXECUTION_CONTEXT_STORE_ID,
  DefaultExecutionContextStore,
  type DefaultExecutionContextStoreOptions,
  type ExecutionContextStore,
  type StoredExecutionContext,
} from "./store";

export {
  ExecutionContextFactory,
  createExecutionContextFactory,
  type ExecutionContextFactoryOptions,
} from "./factory";

export { createExecutionContextPort } from "./providers";

export { getExecutionContextHealthSummary, type ExecutionContextHealthSummary } from "./demo";

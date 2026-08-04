/**
 * Enterprise Batch Runtime — C-06 / ECS-01.
 *
 * Fluxo estrutural oficial (C-06):
 *   Produto → Enterprise Runtime → BatchRuntimePort
 *     → DefaultBatchRuntimeAdapter / EnterpriseBatchRuntimeAdapter /
 *       MockBatchRuntimeAdapter
 *     → InMemoryBatchRuntimeStore → BatchManifest / BatchStateMachine
 *
 * C-06: infraestrutura canônica de Batch Runtime Foundation.
 * Sem processamento em lote. Sem filas. Sem workers. Sem retry funcional.
 * Sem scheduler. Sem paralelismo. Sem SOAP funcional. Sem XML funcional.
 * Sem banco. Sem persistência. Sem APIs. Sem envio para operadoras.
 *
 * Contrato oficial BatchManifest:
 *   unidade transacional corporativa + BatchStateMachine (estados apenas)
 *   + peers estruturais + envelope RULE_04
 *   (metadados estruturais apenas — sem processamento).
 *
 * Dependências AuthorizationRuntime/OperatorRuntime/SOAPRuntime/XMLRuntime/
 * XMLValidationRuntime/QualityRuntime/AuditRuntime preparadas —
 * sem consumo funcional (shape-check apenas em health()).
 *
 * STATE MACHINE FIRST (Regra Permanente nº 11): nenhum fluxo funcional sem
 * estados formalmente definidos; nesta Sprint apenas contratos de estado.
 */
export type {
  AuditResult,
  AuthorizationPolicy,
  AuthorizationStrategy,
  BatchCapabilities,
  BatchContext,
  BatchDocument,
  BatchHealth,
  BatchManifest,
  BatchMetadata,
  BatchPolicy,
  BatchPriority,
  BatchRuntimeCapabilities,
  BatchRuntimeEngineCapabilities,
  BatchRuntimeEnterpriseDeps,
  BatchRuntimeHealth,
  BatchRuntimeInfo,
  BatchRuntimeObservabilityEnvelope,
  BatchRuntimeOperationalControls,
  BatchRuntimeOperationEnvelope,
  BatchRuntimeOptions,
  BatchRuntimePort,
  BatchRuntimePortCapabilities,
  BatchRuntimeProviderId,
  BatchRuntimeProviderMetadata,
  BatchRuntimeProviderOptions,
  BatchRuntimeRegistration,
  BatchRuntimeStatus,
  BatchRuntimeStructuredLog,
  BatchRuntimeTelemetry,
  BatchState,
  BatchStateMachine,
  BatchStatistics,
  BatchStatsInput,
  BatchStatsResult,
  GetBatchInput,
  GetBatchResult,
  ListBatchesInput,
  ListBatchesResult,
  OperatorCapabilityProfile,
  PrepareBatchInput,
  PrepareBatchResult,
  QualityAssessment,
  XMLDocument,
  XMLValidationResult,
} from "./ports";

export {
  BATCH_CANONICAL_STATES,
  BATCH_RUNTIME_IDENTITY,
  DEFAULT_MOCK_BATCH_RUNTIME_CAPABILITIES,
  DEFAULT_MOCK_BATCH_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_BATCH_RUNTIME_CAPABILITIES,
  DEFAULT_BATCH_RUNTIME_ENGINE_CAPABILITIES,
  createBatchContextId,
  createBatchDocumentId,
  createBatchId,
  createBatchPolicyId,
  createBatchRuntimeRequestId,
  createEmptyBatchManifest,
  createEmptyBatchPolicy,
  createEmptyBatchStateMachine,
  defineBatchRuntimeCapabilities,
  defineBatchRuntimeEngineCapabilities,
  emptyBatchRuntimeCapabilities,
  emptyBatchRuntimeEngineCapabilities,
  resetAllBatchRuntimeIdSequences,
  resetBatchRuntimeIdSequences,
  toBatchCapabilities,
  toCanonicalBatchCapabilities,
} from "./ports";

export {
  DEFAULT_MOCK_BATCH_RUNTIME_VERSION,
  DEFAULT_BATCH_RUNTIME_ADAPTER_ID,
  DEFAULT_BATCH_RUNTIME_VERSION,
  DefaultBatchRuntimeAdapter,
  EnterpriseBatchRuntimeAdapter,
  MOCK_BATCH_RUNTIME_ADAPTER_ID,
  MockBatchRuntimeAdapter,
  type DefaultBatchRuntimeAdapterOptions,
  type MockBatchRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_BATCH_RUNTIME_STORE_ID,
  InMemoryBatchRuntimeStore,
  type InMemoryBatchRuntimeStoreOptions,
  type StoredBatchContext,
  type StoredBatchDocument,
  type StoredBatchManifest,
  type BatchRuntimeStore,
} from "./store";

export {
  BatchRuntimeFactory,
  createBatchRuntimeFactory,
  type BatchRuntimeFactoryOptions,
} from "./factory/batch-runtime-factory";

export {
  BUILTIN_BATCH_RUNTIME_PROVIDER_COUNT,
  BatchRuntimeRegistry,
  createDefaultBatchRuntimeRegistry,
  type BatchRuntimeRegistrySnapshot,
} from "./registry/batch-runtime-registry";

export {
  BatchRuntimeProvider,
  createBatchRuntimePort,
  getBatchRuntimeFactory,
  getBatchRuntimePort,
} from "./providers";

export { getBatchRuntimeHealthSummary, type BatchRuntimeHealthSummary } from "./demo";

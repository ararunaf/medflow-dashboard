/**
 * Enterprise Reconciliation Runtime — C-09 / ECS-01.
 *
 * Fluxo estrutural oficial (C-09):
 *   Produto → Enterprise Runtime → ReconciliationRuntimePort
 *     → DefaultReconciliationRuntimeAdapter / EnterpriseReconciliationRuntimeAdapter /
 *       MockReconciliationRuntimeAdapter
 *     → InMemoryReconciliationRuntimeStore → ReconciliationManifest /
 *       CanonicalReconciliationResult / ReconciliationStateMachine
 *
 * C-09: infraestrutura canônica de Reconciliation Runtime Foundation.
 * Sem reconciliação funcional. Sem matching automático. Sem resolução de conflitos.
 * Sem comparação entre documentos. Sem XML. Sem SOAP. Sem banco. Sem alteração de status.
 * Sem workflow. Sem APIs. Sem filas. Sem processamento assíncrono funcional.
 *
 * Contratos oficiais:
 *   ReconciliationContext · ReconciliationManifest · ReconciliationCorrelation ·
 *   CanonicalReconciliationResult · ReconciliationDifference · ReconciliationConflict ·
 *   ReconciliationStatistics · ReconciliationMetadata · ReconciliationHealth ·
 *   ReconciliationPolicy · ReconciliationState · ReconciliationStateMachine
 *   + envelope RULE_04 (metadados estruturais apenas).
 *
 * Dependências ReturnRuntime/ProtocolRuntime/BatchRuntime/AuthorizationRuntime/
 * OperatorRuntime/AuditRuntime/WorkflowRuntime(future) preparadas — sem consumo
 * funcional (shape-check apenas em health()).
 *
 * RECONCILIATION IS DETERMINISTIC (Regra Permanente nº 16): toda reconciliação
 * futura deverá produzir exatamente o mesmo resultado quando executada novamente
 * com o mesmo conjunto de entradas.
 */
export type {
  AuditResult,
  AuthorizationPolicy,
  AuthorizationStrategy,
  BatchManifest,
  CanonicalReconciliationResult,
  CorrelateReconciliationInput,
  CorrelateReconciliationResult,
  GetReconciliationInput,
  GetReconciliationResult,
  ListReconciliationsInput,
  ListReconciliationsResult,
  OperatorCapabilityProfile,
  PrepareReconciliationInput,
  PrepareReconciliationResult,
  ProtocolProfile,
  ReconciliationCapabilities,
  ReconciliationConflict,
  ReconciliationContext,
  ReconciliationCorrelation,
  ReconciliationDifference,
  ReconciliationHealth,
  ReconciliationManifest,
  ReconciliationMetadata,
  ReconciliationPolicy,
  ReconciliationRuntimeCapabilities,
  ReconciliationRuntimeEngineCapabilities,
  ReconciliationRuntimeEnterpriseDeps,
  ReconciliationRuntimeHealth,
  ReconciliationRuntimeInfo,
  ReconciliationRuntimeObservabilityEnvelope,
  ReconciliationRuntimeOperationalControls,
  ReconciliationRuntimeOperationEnvelope,
  ReconciliationRuntimeOptions,
  ReconciliationRuntimePort,
  ReconciliationRuntimePortCapabilities,
  ReconciliationRuntimeProviderId,
  ReconciliationRuntimeProviderMetadata,
  ReconciliationRuntimeProviderOptions,
  ReconciliationRuntimeRegistration,
  ReconciliationRuntimeStatus,
  ReconciliationRuntimeStructuredLog,
  ReconciliationRuntimeTelemetry,
  ReconciliationState,
  ReconciliationStateMachine,
  ReconciliationStatistics,
  ReconciliationStatsInput,
  ReconciliationStatsResult,
  ReturnManifest,
} from "./ports";

export {
  RECONCILIATION_CANONICAL_STATES,
  RECONCILIATION_RUNTIME_IDENTITY,
  DEFAULT_MOCK_RECONCILIATION_RUNTIME_CAPABILITIES,
  DEFAULT_MOCK_RECONCILIATION_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_RECONCILIATION_RUNTIME_CAPABILITIES,
  DEFAULT_RECONCILIATION_RUNTIME_ENGINE_CAPABILITIES,
  createEmptyCanonicalReconciliationResult,
  createEmptyReconciliationCapabilities,
  createEmptyReconciliationConflict,
  createEmptyReconciliationCorrelation,
  createEmptyReconciliationDifference,
  createEmptyReconciliationManifest,
  createEmptyReconciliationPolicy,
  createEmptyReconciliationStateMachine,
  createCanonicalReconciliationResultId,
  createReconciliationContextId,
  createReconciliationCorrelationId,
  createReconciliationManifestId,
  createReconciliationRuntimeRequestId,
  defineReconciliationRuntimeCapabilities,
  defineReconciliationRuntimeEngineCapabilities,
  emptyReconciliationRuntimeCapabilities,
  emptyReconciliationRuntimeEngineCapabilities,
  resetAllReconciliationRuntimeIdSequences,
  resetReconciliationRuntimeIdSequences,
  toCanonicalReconciliationCapabilities,
  toReconciliationCapabilities,
} from "./ports";

export {
  DEFAULT_MOCK_RECONCILIATION_RUNTIME_VERSION,
  DEFAULT_RECONCILIATION_RUNTIME_ADAPTER_ID,
  DEFAULT_RECONCILIATION_RUNTIME_VERSION,
  DefaultReconciliationRuntimeAdapter,
  EnterpriseReconciliationRuntimeAdapter,
  MOCK_RECONCILIATION_RUNTIME_ADAPTER_ID,
  MockReconciliationRuntimeAdapter,
  type DefaultReconciliationRuntimeAdapterOptions,
  type MockReconciliationRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_RECONCILIATION_RUNTIME_STORE_ID,
  InMemoryReconciliationRuntimeStore,
  type InMemoryReconciliationRuntimeStoreOptions,
  type StoredCanonicalReconciliationResult,
  type StoredReconciliationContext,
  type StoredReconciliationCorrelation,
  type StoredReconciliationManifest,
  type ReconciliationRuntimeStore,
} from "./store";

export {
  ReconciliationRuntimeFactory,
  createReconciliationRuntimeFactory,
  type ReconciliationRuntimeFactoryOptions,
} from "./factory/reconciliation-runtime-factory";

export {
  BUILTIN_RECONCILIATION_RUNTIME_PROVIDER_COUNT,
  ReconciliationRuntimeRegistry,
  createDefaultReconciliationRuntimeRegistry,
  type ReconciliationRuntimeRegistrySnapshot,
} from "./registry/reconciliation-runtime-registry";

export {
  ReconciliationRuntimeProvider,
  createReconciliationRuntimePort,
  getReconciliationRuntimeFactory,
  getReconciliationRuntimePort,
} from "./providers";

export {
  getReconciliationRuntimeHealthSummary,
  type ReconciliationRuntimeHealthSummary,
} from "./demo";

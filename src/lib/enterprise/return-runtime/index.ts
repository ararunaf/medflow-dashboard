/**
 * Enterprise Return Runtime — C-08 / ECS-01.
 *
 * Fluxo estrutural oficial (C-08):
 *   Produto → Enterprise Runtime → ReturnRuntimePort
 *     → DefaultReturnRuntimeAdapter / EnterpriseReturnRuntimeAdapter /
 *       MockReturnRuntimeAdapter
 *     → InMemoryReturnRuntimeStore → ReturnManifest / ReturnCorrelation /
 *       ReturnStateMachine
 *
 * C-08: infraestrutura canônica de Return Runtime Foundation.
 * Sem processamento de retorno. Sem correlação automática. Sem reconciliação.
 * Sem parser XML. Sem SOAP. Sem operadoras. Sem banco. Sem alteração de status.
 * Sem workflow. Sem APIs. Sem filas. Sem processamento assíncrono funcional.
 *
 * Contratos oficiais:
 *   ReturnContext · ReturnManifest · ReturnCorrelation · ReturnMetadata ·
 *   ReturnStatus · ReturnState · ReturnStateMachine · ReturnStatistics ·
 *   ReturnHealth · ReturnPolicy · ReturnOrigin · ReturnEnvelope
 *   + envelope RULE_04 (metadados estruturais apenas).
 *
 * Dependências ProtocolRuntime/BatchRuntime/AuthorizationRuntime/
 * OperatorRuntime/SOAPRuntime/XMLRuntime/XMLValidationRuntime/AuditRuntime
 * preparadas — sem consumo funcional (shape-check apenas em health()).
 *
 * CORRELATION BEFORE PROCESSING (Regra Permanente nº 14): nenhum retorno
 * poderá ser processado antes de ser correlacionado com sua transação
 * canônica. Sequência futura:
 *   Recebimento → Correlação → Validação → Atualização de Estado →
 *   Workflow → Auditoria
 */
export type {
  AuditResult,
  AuthorizationPolicy,
  AuthorizationStrategy,
  BatchManifest,
  CorrelateReturnInput,
  CorrelateReturnResult,
  GetReturnInput,
  GetReturnResult,
  ListReturnsInput,
  ListReturnsResult,
  OperatorCapabilityProfile,
  PrepareReturnInput,
  PrepareReturnResult,
  ProtocolProfile,
  ReturnCapabilities,
  ReturnContext,
  ReturnCorrelation,
  ReturnEnvelope,
  ReturnHealth,
  ReturnManifest,
  ReturnMetadata,
  ReturnOrigin,
  ReturnPolicy,
  ReturnRuntimeCapabilities,
  ReturnRuntimeEngineCapabilities,
  ReturnRuntimeEnterpriseDeps,
  ReturnRuntimeHealth,
  ReturnRuntimeInfo,
  ReturnRuntimeObservabilityEnvelope,
  ReturnRuntimeOperationalControls,
  ReturnRuntimeOperationEnvelope,
  ReturnRuntimeOptions,
  ReturnRuntimePort,
  ReturnRuntimePortCapabilities,
  ReturnRuntimeProviderId,
  ReturnRuntimeProviderMetadata,
  ReturnRuntimeProviderOptions,
  ReturnRuntimeRegistration,
  ReturnRuntimeStatus,
  ReturnRuntimeStructuredLog,
  ReturnRuntimeTelemetry,
  ReturnState,
  ReturnStateMachine,
  ReturnStatistics,
  ReturnStatus,
  ReturnStatsInput,
  ReturnStatsResult,
  XMLDocument,
  XMLValidationResult,
} from "./ports";

export {
  RETURN_CANONICAL_STATES,
  RETURN_RUNTIME_IDENTITY,
  DEFAULT_MOCK_RETURN_RUNTIME_CAPABILITIES,
  DEFAULT_MOCK_RETURN_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_RETURN_RUNTIME_CAPABILITIES,
  DEFAULT_RETURN_RUNTIME_ENGINE_CAPABILITIES,
  createEmptyReturnCapabilities,
  createEmptyReturnCorrelation,
  createEmptyReturnEnvelope,
  createEmptyReturnManifest,
  createEmptyReturnPolicy,
  createEmptyReturnStateMachine,
  createReturnContextId,
  createReturnCorrelationId,
  createReturnManifestId,
  createReturnRuntimeRequestId,
  defineReturnRuntimeCapabilities,
  defineReturnRuntimeEngineCapabilities,
  emptyReturnRuntimeCapabilities,
  emptyReturnRuntimeEngineCapabilities,
  resetAllReturnRuntimeIdSequences,
  resetReturnRuntimeIdSequences,
  toCanonicalReturnCapabilities,
  toReturnCapabilities,
} from "./ports";

export {
  DEFAULT_MOCK_RETURN_RUNTIME_VERSION,
  DEFAULT_RETURN_RUNTIME_ADAPTER_ID,
  DEFAULT_RETURN_RUNTIME_VERSION,
  DefaultReturnRuntimeAdapter,
  EnterpriseReturnRuntimeAdapter,
  MOCK_RETURN_RUNTIME_ADAPTER_ID,
  MockReturnRuntimeAdapter,
  type DefaultReturnRuntimeAdapterOptions,
  type MockReturnRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_RETURN_RUNTIME_STORE_ID,
  InMemoryReturnRuntimeStore,
  type InMemoryReturnRuntimeStoreOptions,
  type StoredReturnContext,
  type StoredReturnCorrelation,
  type StoredReturnManifest,
  type ReturnRuntimeStore,
} from "./store";

export {
  ReturnRuntimeFactory,
  createReturnRuntimeFactory,
  type ReturnRuntimeFactoryOptions,
} from "./factory/return-runtime-factory";

export {
  BUILTIN_RETURN_RUNTIME_PROVIDER_COUNT,
  ReturnRuntimeRegistry,
  createDefaultReturnRuntimeRegistry,
  type ReturnRuntimeRegistrySnapshot,
} from "./registry/return-runtime-registry";

export {
  ReturnRuntimeProvider,
  createReturnRuntimePort,
  getReturnRuntimeFactory,
  getReturnRuntimePort,
} from "./providers";

export { getReturnRuntimeHealthSummary, type ReturnRuntimeHealthSummary } from "./demo";

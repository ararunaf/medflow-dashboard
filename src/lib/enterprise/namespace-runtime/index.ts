/**
 * Enterprise Namespace Runtime — Ports & Adapters (TISS-10).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → TISS Runtime
 *     → TISSCatalogPort → RulePackEnginePort
 *     → XMLRuntimePort → XMLGenerationRuntimePort
 *     → XMLSerializerRuntimePort → XMLSchemaRuntimePort
 *     → XMLValidationRuntimePort → XSDRuntimePort → NamespaceRuntimePort
 *     → DefaultNamespaceRuntimeAdapter → InMemoryNamespaceRuntimeStore
 *     → Canonical Namespace Runtime Result
 *
 * TISS-10: infraestrutura canônica de gerenciamento estrutural de namespaces XML futuros.
 * Sem namespace oficial. Sem namespaces ANS/TISS. Sem XML TISS/ANS. Sem XSD oficial. Sem resolução/validação de namespace real.
 * Sem envelope de webservice. Sem envio a operadoras. Sem regras de negócio específicas.
 * Sem acesso direto ao Namespace Runtime Store.
 * Sem lógica específica de operadora / contrato / tenant / cooperativa / versão.
 * Sem conhecimento de padrões TISS — apenas resposta canônica estrutural.
 */
export type {
  CanonicalNamespaceCapabilities,
  CanonicalNamespaceHealth,
  CanonicalNamespaceMetadata,
  CanonicalNamespaceOperation,
  CanonicalNamespaceProfile,
  CanonicalNamespaceReference,
  CanonicalNamespaceRuntimeRequest,
  CanonicalNamespaceRuntimeResult,
  CanonicalNamespaceDefinition,
  CanonicalNamespaceStatistics,
  CanonicalNamespaceStatus,
  CanonicalNamespaceVersion,
  GetCanonicalNamespaceResultInput,
  GetCanonicalNamespaceResultResult,
  ListCanonicalNamespaceResultsInput,
  ListCanonicalNamespaceResultsResult,
  PrepareCanonicalNamespaceInput,
  PrepareCanonicalNamespaceResult,
  NamespaceRuntimeCapabilities,
  NamespaceRuntimeHealth,
  NamespaceRuntimeInfo,
  NamespaceRuntimeOperationEnvelope,
  NamespaceRuntimeOperationalControls,
  NamespaceRuntimeOptions,
  NamespaceRuntimePort,
  NamespaceRuntimePortCapabilities,
  NamespaceRuntimeProviderId,
  NamespaceRuntimeProviderMetadata,
  NamespaceRuntimeRegistration,
  NamespaceRuntimeStatus,
  NamespaceRuntimeStructuredLog,
  NamespaceRuntimeTelemetry,
} from "./ports";

export {
  DEFAULT_MOCK_NAMESPACE_RUNTIME_CAPABILITIES,
  DEFAULT_NAMESPACE_RUNTIME_CAPABILITIES,
  createNamespaceId,
  createNamespaceResultId,
  createNamespaceRuntimeRequestId,
  defineNamespaceRuntimeCapabilities,
  emptyNamespaceRuntimeCapabilities,
  resetNamespaceRuntimeIdSequences,
  toCanonicalNamespaceCapabilities,
} from "./ports";

export {
  DEFAULT_NAMESPACE_RUNTIME_ADAPTER_ID,
  DEFAULT_NAMESPACE_RUNTIME_VERSION,
  DEFAULT_MOCK_NAMESPACE_RUNTIME_VERSION,
  DefaultNamespaceRuntimeAdapter,
  EnterpriseNamespaceRuntimeAdapter,
  MOCK_NAMESPACE_RUNTIME_ADAPTER_ID,
  MockNamespaceRuntimeAdapter,
  type DefaultNamespaceRuntimeAdapterOptions,
  type MockNamespaceRuntimeAdapterOptions,
} from "./adapters";

export {
  NamespaceRuntimeFactory,
  createNamespaceRuntimeFactory,
  type NamespaceRuntimeFactoryOptions,
} from "./factory";

export {
  BUILTIN_NAMESPACE_RUNTIME_PROVIDER_COUNT,
  NamespaceRuntimeRegistry,
  createDefaultNamespaceRuntimeRegistry,
  type NamespaceRuntimeRegistrySnapshot,
} from "./registry";

export {
  IN_MEMORY_NAMESPACE_RUNTIME_STORE_ID,
  InMemoryNamespaceRuntimeStore,
  type InMemoryNamespaceRuntimeStoreOptions,
  type StoredCanonicalNamespaceRuntimeResult,
  type NamespaceRuntimeStore,
} from "./store";

export {
  NamespaceRuntimeProvider,
  createNamespaceRuntimePort,
  getNamespaceRuntimeFactory,
} from "./providers";

export { getNamespaceRuntimeHealthSummary, type NamespaceRuntimeHealthSummary } from "./demo";

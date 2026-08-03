/**
 * Enterprise XSD Runtime — Ports & Adapters (TISS-09).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → TISS Runtime
 *     → TISSCatalogPort → RulePackEnginePort
 *     → XMLRuntimePort → XMLGenerationRuntimePort
 *     → XMLSerializerRuntimePort → XMLSchemaRuntimePort
 *     → XMLValidationRuntimePort → XSDRuntimePort
 *     → DefaultXSDRuntimeAdapter → InMemoryXSDRuntimeStore
 *     → Canonical XSD Runtime Result
 *
 * TISS-09: infraestrutura canônica de gerenciamento estrutural de XSDs futuros.
 * Sem XSD oficial. Sem validação XSD real. Sem XML TISS/ANS. Sem namespaces oficiais.
 * Sem envelope de webservice. Sem envio a operadoras. Sem regras de negócio específicas.
 * Sem acesso direto ao XSD Runtime Store.
 * Sem lógica específica de operadora / contrato / tenant / cooperativa / versão.
 * Sem conhecimento de padrões TISS — apenas resposta canônica estrutural.
 */
export type {
  CanonicalXSDCapabilities,
  CanonicalXSDHealth,
  CanonicalXSDMetadata,
  CanonicalXSDOperation,
  CanonicalXSDProfile,
  CanonicalXSDReference,
  CanonicalXSDRuntimeRequest,
  CanonicalXSDRuntimeResult,
  CanonicalXSDSchema,
  CanonicalXSDStatistics,
  CanonicalXSDStatus,
  CanonicalXSDVersion,
  GetCanonicalXSDResultInput,
  GetCanonicalXSDResultResult,
  ListCanonicalXSDResultsInput,
  ListCanonicalXSDResultsResult,
  PrepareCanonicalXSDInput,
  PrepareCanonicalXSDResult,
  XSDRuntimeCapabilities,
  XSDRuntimeHealth,
  XSDRuntimeInfo,
  XSDRuntimeOperationEnvelope,
  XSDRuntimeOperationalControls,
  XSDRuntimeOptions,
  XSDRuntimePort,
  XSDRuntimePortCapabilities,
  XSDRuntimeProviderId,
  XSDRuntimeProviderMetadata,
  XSDRuntimeRegistration,
  XSDRuntimeStatus,
  XSDRuntimeStructuredLog,
  XSDRuntimeTelemetry,
} from "./ports";

export {
  DEFAULT_MOCK_XSD_RUNTIME_CAPABILITIES,
  DEFAULT_XSD_RUNTIME_CAPABILITIES,
  createXSDId,
  createXSDResultId,
  createXSDRuntimeRequestId,
  defineXSDRuntimeCapabilities,
  emptyXSDRuntimeCapabilities,
  resetXSDRuntimeIdSequences,
  toCanonicalXSDCapabilities,
} from "./ports";

export {
  DEFAULT_XSD_RUNTIME_ADAPTER_ID,
  DEFAULT_XSD_RUNTIME_VERSION,
  DEFAULT_MOCK_XSD_RUNTIME_VERSION,
  DefaultXSDRuntimeAdapter,
  EnterpriseXSDRuntimeAdapter,
  MOCK_XSD_RUNTIME_ADAPTER_ID,
  MockXSDRuntimeAdapter,
  type DefaultXSDRuntimeAdapterOptions,
  type MockXSDRuntimeAdapterOptions,
} from "./adapters";

export {
  XSDRuntimeFactory,
  createXSDRuntimeFactory,
  type XSDRuntimeFactoryOptions,
} from "./factory";

export {
  BUILTIN_XSD_RUNTIME_PROVIDER_COUNT,
  XSDRuntimeRegistry,
  createDefaultXSDRuntimeRegistry,
  type XSDRuntimeRegistrySnapshot,
} from "./registry";

export {
  IN_MEMORY_XSD_RUNTIME_STORE_ID,
  InMemoryXSDRuntimeStore,
  type InMemoryXSDRuntimeStoreOptions,
  type StoredCanonicalXSDRuntimeResult,
  type XSDRuntimeStore,
} from "./store";

export { XSDRuntimeProvider, createXSDRuntimePort, getXSDRuntimeFactory } from "./providers";

export { getXSDRuntimeHealthSummary, type XSDRuntimeHealthSummary } from "./demo";

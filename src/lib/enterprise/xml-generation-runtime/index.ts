/**
 * Enterprise XML Generation Runtime — Ports & Adapters (TISS-05).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → TISS Runtime
 *     → TISSCatalogPort → RulePackEnginePort
 *     → XMLRuntimePort → XMLGenerationRuntimePort
 *     → DefaultXMLGenerationAdapter → InMemoryXMLGenerationRuntimeStore
 *     → Canonical XML Result
 *
 * TISS-05: infraestrutura canônica de geração XML.
 * Sem XML TISS/ANS real. Sem envio a operadoras. Sem validações clínicas/ANS.
 * Sem regras de negócio específicas. Sem acesso direto ao XML Generation Store.
 * Sem lógica específica de operadora / contrato / tenant / cooperativa / versão.
 * Sem namespaces reais, schemas externos, assinatura digital, serializer ou parser XML.
 */
export type {
  CanonicalXMLGenerationProviderCapabilities,
  CanonicalXMLGenerationProviderHealth,
  CanonicalXMLGenerationStatistics,
  CanonicalXMLGenerationStatus,
  CanonicalXMLMetadata,
  CanonicalXMLNode,
  CanonicalXMLRequest,
  CanonicalXMLResult,
  CanonicalXMLStructure,
  GenerateCanonicalXMLInput,
  GenerateCanonicalXMLResult,
  GetCanonicalXMLResultInput,
  GetCanonicalXMLResultResult,
  ListCanonicalXMLResultsInput,
  ListCanonicalXMLResultsResult,
  XMLGenerationRuntimeCapabilities,
  XMLGenerationRuntimeHealth,
  XMLGenerationRuntimeInfo,
  XMLGenerationRuntimeOperationEnvelope,
  XMLGenerationRuntimeOperationalControls,
  XMLGenerationRuntimeOptions,
  XMLGenerationRuntimePort,
  XMLGenerationRuntimePortCapabilities,
  XMLGenerationRuntimeProviderId,
  XMLGenerationRuntimeProviderMetadata,
  XMLGenerationRuntimeRegistration,
  XMLGenerationRuntimeStatus,
  XMLGenerationRuntimeStructuredLog,
  XMLGenerationRuntimeTelemetry,
} from "./ports";

export {
  DEFAULT_MOCK_XML_GENERATION_RUNTIME_CAPABILITIES,
  DEFAULT_XML_GENERATION_RUNTIME_CAPABILITIES,
  createXMLGenerationResultId,
  createXMLGenerationRuntimeRequestId,
  defineXMLGenerationRuntimeCapabilities,
  emptyXMLGenerationRuntimeCapabilities,
  resetXMLGenerationRuntimeIdSequences,
  toCanonicalXMLGenerationProviderCapabilities,
} from "./ports";

export {
  DEFAULT_XML_GENERATION_ADAPTER_ID,
  DEFAULT_XML_GENERATION_RUNTIME_VERSION,
  DEFAULT_MOCK_XML_GENERATION_RUNTIME_VERSION,
  DefaultXMLGenerationAdapter,
  EnterpriseXMLGenerationAdapter,
  MOCK_XML_GENERATION_ADAPTER_ID,
  MockXMLGenerationAdapter,
  type DefaultXMLGenerationAdapterOptions,
  type MockXMLGenerationAdapterOptions,
} from "./adapters";

export {
  XMLGenerationRuntimeFactory,
  createXMLGenerationRuntimeFactory,
  type XMLGenerationRuntimeFactoryOptions,
} from "./factory";

export {
  BUILTIN_XML_GENERATION_RUNTIME_PROVIDER_COUNT,
  XMLGenerationRuntimeRegistry,
  createDefaultXMLGenerationRuntimeRegistry,
  type XMLGenerationRuntimeRegistrySnapshot,
} from "./registry";

export {
  IN_MEMORY_XML_GENERATION_RUNTIME_STORE_ID,
  InMemoryXMLGenerationRuntimeStore,
  type InMemoryXMLGenerationRuntimeStoreOptions,
  type StoredCanonicalXMLResult,
  type XMLGenerationRuntimeStore,
} from "./store";

export {
  XMLGenerationRuntimeProvider,
  createXMLGenerationRuntimePort,
  getXMLGenerationRuntimeFactory,
} from "./providers";

export {
  getXMLGenerationRuntimeHealthSummary,
  type XMLGenerationRuntimeHealthSummary,
} from "./demo";

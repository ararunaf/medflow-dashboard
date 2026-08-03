/**
 * Enterprise XML Serializer Runtime — Ports & Adapters (TISS-06).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → TISS Runtime
 *     → TISSCatalogPort → RulePackEnginePort
 *     → XMLRuntimePort → XMLGenerationRuntimePort
 *     → XMLSerializerRuntimePort
 *     → DefaultXMLSerializerAdapter → InMemoryXMLSerializerRuntimeStore
 *     → Canonical XML String
 *
 * TISS-06: infraestrutura canônica de serialização XML.
 * Sem XML TISS/ANS real. Sem namespaces ANS. Sem XSD. Sem envelope de webservice.
 * Sem envio a operadoras. Sem validações clínicas/ANS.
 * Sem regras de negócio específicas. Sem acesso direto ao XML Serializer Store.
 * Sem lógica específica de operadora / contrato / tenant / cooperativa / versão.
 * Sem conhecimento de padrões TISS — apenas XML canônico textual.
 */
export type {
  CanonicalXMLNode,
  CanonicalXMLSerializeRequest,
  CanonicalXMLSerializeResult,
  CanonicalXMLSerializationStatus,
  CanonicalXMLSerializerMetadata,
  CanonicalXMLSerializerProviderCapabilities,
  CanonicalXMLSerializerProviderHealth,
  CanonicalXMLSerializerStatistics,
  CanonicalXMLStructure,
  GetCanonicalXMLSerializeResultInput,
  GetCanonicalXMLSerializeResultResult,
  ListCanonicalXMLSerializeResultsInput,
  ListCanonicalXMLSerializeResultsResult,
  SerializeCanonicalXMLInput,
  SerializeCanonicalXMLResult,
  XMLSerializerRuntimeCapabilities,
  XMLSerializerRuntimeHealth,
  XMLSerializerRuntimeInfo,
  XMLSerializerRuntimeOperationEnvelope,
  XMLSerializerRuntimeOperationalControls,
  XMLSerializerRuntimeOptions,
  XMLSerializerRuntimePort,
  XMLSerializerRuntimePortCapabilities,
  XMLSerializerRuntimeProviderId,
  XMLSerializerRuntimeProviderMetadata,
  XMLSerializerRuntimeRegistration,
  XMLSerializerRuntimeStatus,
  XMLSerializerRuntimeStructuredLog,
  XMLSerializerRuntimeTelemetry,
} from "./ports";

export {
  DEFAULT_MOCK_XML_SERIALIZER_RUNTIME_CAPABILITIES,
  DEFAULT_XML_SERIALIZER_RUNTIME_CAPABILITIES,
  createXMLSerializerResultId,
  createXMLSerializerRuntimeRequestId,
  defineXMLSerializerRuntimeCapabilities,
  emptyXMLSerializerRuntimeCapabilities,
  resetXMLSerializerRuntimeIdSequences,
  toCanonicalXMLSerializerProviderCapabilities,
} from "./ports";

export {
  DEFAULT_XML_SERIALIZER_ADAPTER_ID,
  DEFAULT_XML_SERIALIZER_RUNTIME_VERSION,
  DEFAULT_MOCK_XML_SERIALIZER_RUNTIME_VERSION,
  DefaultXMLSerializerAdapter,
  EnterpriseXMLSerializerAdapter,
  MOCK_XML_SERIALIZER_ADAPTER_ID,
  MockXMLSerializerAdapter,
  type DefaultXMLSerializerAdapterOptions,
  type MockXMLSerializerAdapterOptions,
} from "./adapters";

export {
  XMLSerializerRuntimeFactory,
  createXMLSerializerRuntimeFactory,
  type XMLSerializerRuntimeFactoryOptions,
} from "./factory";

export {
  BUILTIN_XML_SERIALIZER_RUNTIME_PROVIDER_COUNT,
  XMLSerializerRuntimeRegistry,
  createDefaultXMLSerializerRuntimeRegistry,
  type XMLSerializerRuntimeRegistrySnapshot,
} from "./registry";

export {
  IN_MEMORY_XML_SERIALIZER_RUNTIME_STORE_ID,
  InMemoryXMLSerializerRuntimeStore,
  type InMemoryXMLSerializerRuntimeStoreOptions,
  type StoredCanonicalXMLSerializeResult,
  type XMLSerializerRuntimeStore,
} from "./store";

export {
  XMLSerializerRuntimeProvider,
  createXMLSerializerRuntimePort,
  getXMLSerializerRuntimeFactory,
} from "./providers";

export {
  getXMLSerializerRuntimeHealthSummary,
  type XMLSerializerRuntimeHealthSummary,
} from "./demo";

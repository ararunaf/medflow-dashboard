/**
 * Enterprise XML Schema Runtime — Ports & Adapters (TISS-07).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → TISS Runtime
 *     → TISSCatalogPort → RulePackEnginePort
 *     → XMLRuntimePort → XMLGenerationRuntimePort
 *     → XMLSerializerRuntimePort → XMLSchemaRuntimePort
 *     → DefaultXMLSchemaAdapter → InMemoryXMLSchemaRuntimeStore
 *     → Canonical XML Schema
 *
 * TISS-07: infraestrutura canônica de gerenciamento de XML Schemas.
 * Sem XSD oficial. Sem validação XSD. Sem XML TISS/ANS. Sem namespaces oficiais.
 * Sem envelope de webservice. Sem envio a operadoras. Sem regras de negócio específicas.
 * Sem acesso direto ao XML Schema Store.
 * Sem lógica específica de operadora / contrato / tenant / cooperativa / versão.
 * Sem conhecimento de padrões TISS — apenas schema canônico estrutural.
 */
export type {
  CanonicalXMLSchema,
  CanonicalXMLSchemaCapabilities,
  CanonicalXMLSchemaHealth,
  CanonicalXMLSchemaMetadata,
  CanonicalXMLSchemaOperation,
  CanonicalXMLSchemaProfile,
  CanonicalXMLSchemaReference,
  CanonicalXMLSchemaRequest,
  CanonicalXMLSchemaResult,
  CanonicalXMLSchemaStatistics,
  CanonicalXMLSchemaStatus,
  CanonicalXMLSchemaVersion,
  GetCanonicalXMLSchemaResultInput,
  GetCanonicalXMLSchemaResultResult,
  ListCanonicalXMLSchemaResultsInput,
  ListCanonicalXMLSchemaResultsResult,
  RegisterCanonicalXMLSchemaInput,
  RegisterCanonicalXMLSchemaResult,
  XMLSchemaRuntimeCapabilities,
  XMLSchemaRuntimeHealth,
  XMLSchemaRuntimeInfo,
  XMLSchemaRuntimeOperationEnvelope,
  XMLSchemaRuntimeOperationalControls,
  XMLSchemaRuntimeOptions,
  XMLSchemaRuntimePort,
  XMLSchemaRuntimePortCapabilities,
  XMLSchemaRuntimeProviderId,
  XMLSchemaRuntimeProviderMetadata,
  XMLSchemaRuntimeRegistration,
  XMLSchemaRuntimeStatus,
  XMLSchemaRuntimeStructuredLog,
  XMLSchemaRuntimeTelemetry,
} from "./ports";

export {
  DEFAULT_MOCK_XML_SCHEMA_RUNTIME_CAPABILITIES,
  DEFAULT_XML_SCHEMA_RUNTIME_CAPABILITIES,
  createXMLSchemaId,
  createXMLSchemaResultId,
  createXMLSchemaRuntimeRequestId,
  defineXMLSchemaRuntimeCapabilities,
  emptyXMLSchemaRuntimeCapabilities,
  resetXMLSchemaRuntimeIdSequences,
  toCanonicalXMLSchemaCapabilities,
} from "./ports";

export {
  DEFAULT_XML_SCHEMA_ADAPTER_ID,
  DEFAULT_XML_SCHEMA_RUNTIME_VERSION,
  DEFAULT_MOCK_XML_SCHEMA_RUNTIME_VERSION,
  DefaultXMLSchemaAdapter,
  EnterpriseXMLSchemaAdapter,
  MOCK_XML_SCHEMA_ADAPTER_ID,
  MockXMLSchemaAdapter,
  type DefaultXMLSchemaAdapterOptions,
  type MockXMLSchemaAdapterOptions,
} from "./adapters";

export {
  XMLSchemaRuntimeFactory,
  createXMLSchemaRuntimeFactory,
  type XMLSchemaRuntimeFactoryOptions,
} from "./factory";

export {
  BUILTIN_XML_SCHEMA_RUNTIME_PROVIDER_COUNT,
  XMLSchemaRuntimeRegistry,
  createDefaultXMLSchemaRuntimeRegistry,
  type XMLSchemaRuntimeRegistrySnapshot,
} from "./registry";

export {
  IN_MEMORY_XML_SCHEMA_RUNTIME_STORE_ID,
  InMemoryXMLSchemaRuntimeStore,
  type InMemoryXMLSchemaRuntimeStoreOptions,
  type StoredCanonicalXMLSchemaResult,
  type XMLSchemaRuntimeStore,
} from "./store";

export {
  XMLSchemaRuntimeProvider,
  createXMLSchemaRuntimePort,
  getXMLSchemaRuntimeFactory,
} from "./providers";

export { getXMLSchemaRuntimeHealthSummary, type XMLSchemaRuntimeHealthSummary } from "./demo";

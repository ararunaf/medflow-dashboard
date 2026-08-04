/**
 * Enterprise XML Validation Runtime — Ports & Adapters (TISS-08).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → TISS Runtime
 *     → TISSCatalogPort → RulePackEnginePort
 *     → XMLRuntimePort → XMLGenerationRuntimePort
 *     → XMLSerializerRuntimePort → XMLSchemaRuntimePort
 *     → XMLValidationRuntimePort
 *     → DefaultXMLValidationAdapter → InMemoryXMLValidationRuntimeStore
 *     → Canonical XML Validation Result
 *
 * TISS-08: infraestrutura canônica de validação XML estrutural.
 * Sem XSD oficial. Sem validação XSD real. Sem XML TISS/ANS. Sem namespaces oficiais.
 * Sem envelope de webservice. Sem envio a operadoras. Sem regras de negócio específicas.
 * Sem acesso direto ao XML Validation Store.
 * Sem lógica específica de operadora / contrato / tenant / cooperativa / versão.
 * Sem conhecimento de padrões TISS — apenas resposta canônica estrutural.
 */
export type {
  CanonicalXMLValidationCapabilities,
  CanonicalXMLValidationHealth,
  CanonicalXMLValidationIssue,
  CanonicalXMLValidationMetadata,
  CanonicalXMLValidationOperation,
  CanonicalXMLValidationProfile,
  CanonicalXMLValidationReference,
  CanonicalXMLValidationRequest,
  CanonicalXMLValidationResult,
  CanonicalXMLValidationStatistics,
  CanonicalXMLValidationStatus,
  CanonicalXMLValidationSummary,
  CanonicalXMLValidationVersion,
  GetCanonicalXMLValidationResultInput,
  GetCanonicalXMLValidationResultResult,
  ListCanonicalXMLValidationResultsInput,
  ListCanonicalXMLValidationResultsResult,
  ValidateCanonicalXMLInput,
  ValidateCanonicalXMLResult,
  XMLValidationRuntimeCapabilities,
  XMLValidationRuntimeHealth,
  XMLValidationRuntimeInfo,
  XMLValidationRuntimeOperationEnvelope,
  XMLValidationRuntimeOperationalControls,
  XMLValidationRuntimeOptions,
  XMLValidationRuntimePort,
  XMLValidationRuntimePortCapabilities,
  XMLValidationRuntimeProviderId,
  XMLValidationRuntimeProviderMetadata,
  XMLValidationRuntimeRegistration,
  XMLValidationRuntimeStatus,
  XMLValidationRuntimeStructuredLog,
  XMLValidationRuntimeTelemetry,
} from "./ports";

export {
  DEFAULT_MOCK_XML_VALIDATION_RUNTIME_CAPABILITIES,
  DEFAULT_XML_VALIDATION_RUNTIME_CAPABILITIES,
  createXMLValidationId,
  createXMLValidationResultId,
  createXMLValidationRuntimeRequestId,
  defineXMLValidationRuntimeCapabilities,
  emptyXMLValidationRuntimeCapabilities,
  resetXMLValidationRuntimeIdSequences,
  toCanonicalXMLValidationCapabilities,
} from "./ports";

export {
  DEFAULT_XML_VALIDATION_ADAPTER_ID,
  DEFAULT_XML_VALIDATION_RUNTIME_VERSION,
  DEFAULT_MOCK_XML_VALIDATION_RUNTIME_VERSION,
  DefaultXMLValidationAdapter,
  EnterpriseXMLValidationAdapter,
  MOCK_XML_VALIDATION_ADAPTER_ID,
  MockXMLValidationAdapter,
  type DefaultXMLValidationAdapterOptions,
  type MockXMLValidationAdapterOptions,
} from "./adapters";

export {
  XMLValidationRuntimeFactory,
  createXMLValidationRuntimeFactory,
  type XMLValidationRuntimeFactoryOptions,
} from "./factory";

export {
  BUILTIN_XML_VALIDATION_RUNTIME_PROVIDER_COUNT,
  XMLValidationRuntimeRegistry,
  createDefaultXMLValidationRuntimeRegistry,
  type XMLValidationRuntimeRegistrySnapshot,
} from "./registry";

export {
  IN_MEMORY_XML_VALIDATION_RUNTIME_STORE_ID,
  InMemoryXMLValidationRuntimeStore,
  type InMemoryXMLValidationRuntimeStoreOptions,
  type StoredCanonicalXMLValidationResult,
  type XMLValidationRuntimeStore,
} from "./store";

export {
  XMLValidationRuntimeProvider,
  createXMLValidationRuntimePort,
  getXMLValidationRuntimeFactory,
} from "./providers";

export {
  getXMLValidationRuntimeHealthSummary,
  type XMLValidationRuntimeHealthSummary,
} from "./demo";

/**
 * Enterprise XML Runtime — Ports & Adapters (TISS-04).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → TISS Runtime
 *     → TISSCatalogPort → RulePackEnginePort
 *     → XMLRuntimePort → DefaultXMLRuntimeAdapter → InMemoryXMLRuntimeStore
 *
 * TISS-04: fundação estrutural do Enterprise XML Runtime.
 * Sem geração XML real. Sem envio a operadoras. Sem validações clínicas/ANS.
 * Sem regras de negócio específicas. Sem acesso direto ao XML Store.
 * Sem lógica específica de operadora / contrato / tenant / cooperativa / versão.
 * Conhecimento TISS exclusivamente via TISSCatalogPort + RulePackEnginePort.
 */
export type {
  CancelXMLInput,
  CancelXMLResult,
  CanonicalXMLGeneration,
  CanonicalXMLGenerationStatus,
  CanonicalXMLMetadata,
  CanonicalXMLProviderCapabilities,
  CanonicalXMLProviderHealth,
  CanonicalXMLRequest,
  CanonicalXMLResult,
  CanonicalXMLRuntimeConfiguration,
  CanonicalXMLStatistics,
  GenerateXMLInput,
  GenerateXMLResult,
  GetXMLGenerationInput,
  GetXMLGenerationResult,
  ListXMLGenerationsInput,
  ListXMLGenerationsResult,
  ValidateXMLInput,
  ValidateXMLResult,
  XMLRuntimeCapabilities,
  XMLRuntimeEnterpriseDeps,
  XMLRuntimeHealth,
  XMLRuntimeInfo,
  XMLRuntimeOperationEnvelope,
  XMLRuntimeOperationalControls,
  XMLRuntimeOptions,
  XMLRuntimePort,
  XMLRuntimePortCapabilities,
  XMLRuntimeProviderId,
  XMLRuntimeProviderMetadata,
  XMLRuntimeRegistration,
  XMLRuntimeStatus,
  XMLRuntimeStructuredLog,
  XMLRuntimeTelemetry,
} from "./ports";

export {
  DEFAULT_MOCK_XML_RUNTIME_CAPABILITIES,
  DEFAULT_XML_RUNTIME_CAPABILITIES,
  createXMLGenerationId,
  createXMLRuntimeRequestId,
  defineXMLRuntimeCapabilities,
  emptyXMLRuntimeCapabilities,
  resetXMLRuntimeIdSequences,
  toCanonicalXMLProviderCapabilities,
} from "./ports";

export {
  DEFAULT_XML_RUNTIME_ADAPTER_ID,
  DEFAULT_XML_RUNTIME_VERSION,
  DEFAULT_MOCK_XML_RUNTIME_VERSION,
  DefaultXMLRuntimeAdapter,
  EnterpriseXMLRuntimeAdapter,
  MOCK_XML_RUNTIME_ADAPTER_ID,
  MockXMLRuntimeAdapter,
  type DefaultXMLRuntimeAdapterOptions,
  type MockXMLRuntimeAdapterOptions,
} from "./adapters";

export {
  XMLRuntimeFactory,
  createXMLRuntimeFactory,
  type XMLRuntimeFactoryOptions,
} from "./factory";

export {
  BUILTIN_XML_RUNTIME_PROVIDER_COUNT,
  XMLRuntimeRegistry,
  createDefaultXMLRuntimeRegistry,
  type XMLRuntimeRegistrySnapshot,
} from "./registry";

export {
  IN_MEMORY_XML_RUNTIME_STORE_ID,
  InMemoryXMLRuntimeStore,
  type InMemoryXMLRuntimeStoreOptions,
  type StoredXMLGeneration,
  type XMLRuntimeStore,
} from "./store";

export { XMLRuntimeProvider, createXMLRuntimePort, getXMLRuntimeFactory } from "./providers";

export { getXMLRuntimeHealthSummary, type XMLRuntimeHealthSummary } from "./demo";

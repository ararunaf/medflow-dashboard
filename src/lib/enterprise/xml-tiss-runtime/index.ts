/**
 * Enterprise XML TISS Runtime — C-01 / ECS-01.
 *
 * Fluxo estrutural oficial (C-01):
 *   Produto → Enterprise Runtime → XMLTISSRuntimePort
 *     → DefaultXMLTISSRuntimeAdapter / EnterpriseXMLTISSRuntimeAdapter /
 *       MockXMLTISSRuntimeAdapter
 *     → InMemoryXMLTISSRuntimeStore → XMLResult
 *
 * C-01: infraestrutura canônica de orquestração estrutural de
 * transformação futura Canonical TISS → XML TISS/ANS
 * (prepareXMLDocument/getResult/stats).
 * Sem geração de XML. Sem serialização. Sem parser. Sem XSD. Sem SOAP.
 * Sem operadoras. Sem assinatura digital. Sem banco. Sem persistência. Sem APIs.
 *
 * Contrato oficial XMLTISSContext:
 *   CanonicalGuide + CanonicalMappingResult + AutoFillResult +
 *   QualityAssessment + ValidationResult + AuditResult +
 *   AIOrchestrationContext
 *   (metadados estruturais apenas — sem processamento).
 *
 * Dependências QualityRuntime/AutoFillRuntime/TISSMappingRuntime/AuditRuntime/
 * ValidationRuntime/DocumentExtractionRuntime/DocumentClassificationRuntime/
 * OCRRuntime/AIOrchestrationRuntime/IntelligentCaptureRuntime/Scanner/
 * WatchFolder/Upload preparadas — sem consumo funcional (shape-check apenas em health()).
 */
export type {
  AIOrchestrationContext,
  AuditResult,
  AutoFillResult,
  CanonicalGuide,
  CanonicalMappingResult,
  CanonicalXMLTISSOperation,
  FutureXMLTISSGuideContract,
  GetXMLResultInput,
  GetXMLResultResult,
  PrepareXMLDocumentInput,
  PrepareXMLDocumentResult,
  QualityAssessment,
  ValidationResult,
  XMLBatch,
  XMLBody,
  XMLCapabilities,
  XMLDocument,
  XMLGuide,
  XMLGuideAnexo,
  XMLGuideCabecalho,
  XMLGuideConsulta,
  XMLGuideHonorarios,
  XMLGuideInternacao,
  XMLGuideLote,
  XMLGuideOdontologica,
  XMLGuideProtocolo,
  XMLGuideResumoInternacao,
  XMLGuideSPSADT,
  XMLHeader,
  XMLHealth,
  XMLMetadata,
  XMLResult,
  XMLStatistics,
  XMLStatsInput,
  XMLStatsResult,
  XMLStatus,
  XMLTISSContext,
  XMLTISSGuideType,
  XMLTISSNamespace,
  XMLTISSRuntimeCapabilities,
  XMLTISSRuntimeEngineCapabilities,
  XMLTISSRuntimeEnterpriseDeps,
  XMLTISSRuntimeHealth,
  XMLTISSRuntimeInfo,
  XMLTISSRuntimeOperationalControls,
  XMLTISSRuntimeOperationEnvelope,
  XMLTISSRuntimeOptions,
  XMLTISSRuntimePort,
  XMLTISSRuntimeProviderId,
  XMLTISSRuntimeProviderMetadata,
  XMLTISSRuntimeProviderOptions,
  XMLTISSRuntimeRegistration,
  XMLTISSRuntimeStatus,
  XMLTISSRuntimeStructuredLog,
  XMLTISSRuntimeTelemetry,
  XMLTISSSchemaRef,
  XMLTISSVersion,
  XMLTISSVersionId,
} from "./ports";

export {
  XML_TISS_RUNTIME_IDENTITY,
  DEFAULT_MOCK_XML_TISS_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_XML_TISS_RUNTIME_ENGINE_CAPABILITIES,
  STRUCTURAL_XML_TISS_GUIDE_TYPES,
  createDisabledXMLGuide,
  createDisabledXMLTISSVersion,
  createXMLBatchId,
  createXMLBodyId,
  createXMLDocumentId,
  createXMLGuideId,
  createXMLHeaderId,
  createXMLMetadataId,
  createXMLResultId,
  createXMLTISSRuntimeRequestId,
  defineXMLTISSRuntimeEngineCapabilities,
  emptyXMLTISSRuntimeEngineCapabilities,
  resetAllXMLTISSRuntimeIdSequences,
  toXMLCapabilities,
} from "./ports";

export {
  DEFAULT_MOCK_XML_TISS_RUNTIME_VERSION,
  DEFAULT_XML_TISS_RUNTIME_ADAPTER_ID,
  DEFAULT_XML_TISS_RUNTIME_VERSION,
  DefaultXMLTISSRuntimeAdapter,
  EnterpriseXMLTISSRuntimeAdapter,
  MOCK_XML_TISS_RUNTIME_ADAPTER_ID,
  MockXMLTISSRuntimeAdapter,
  REAL_XML_TISS_RUNTIME_ADAPTER_ID,
  REAL_XML_TISS_RUNTIME_VERSION,
  RealTissXMLTISSRuntimeAdapter,
  type DefaultXMLTISSRuntimeAdapterOptions,
  type MockXMLTISSRuntimeAdapterOptions,
  type RealTissXMLTISSRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_XML_TISS_RUNTIME_STORE_ID,
  InMemoryXMLTISSRuntimeStore,
  type InMemoryXMLTISSRuntimeStoreOptions,
  type StoredXMLTISSRuntimeDocument,
  type StoredXMLTISSRuntimeResult,
  type XMLTISSRuntimeStore,
} from "./store";

export {
  XMLTISSRuntimeFactory,
  createXMLTISSRuntimeFactory,
  type XMLTISSRuntimeFactoryOptions,
} from "./factory";

export {
  BUILTIN_XML_TISS_RUNTIME_PROVIDER_COUNT,
  XMLTISSRuntimeRegistry,
  createDefaultXMLTISSRuntimeRegistry,
  type XMLTISSRuntimeRegistrySnapshot,
} from "./registry";

export {
  XMLTISSRuntimeProvider,
  createXMLTISSRuntimePort,
  getXMLTISSRuntimeFactory,
  getXMLTISSRuntimePort,
} from "./providers";

export { getXMLTISSRuntimeHealthSummary, type XMLTISSRuntimeHealthSummary } from "./demo";

/**
 * Enterprise XML Validation Runtime — C-02 / ECS-01.
 *
 * Fluxo estrutural oficial (C-02):
 *   Produto → Enterprise Runtime → XMLValidationRuntimePort
 *     → DefaultXMLValidationRuntimeAdapter / EnterpriseXMLValidationRuntimeAdapter /
 *       MockXMLValidationRuntimeAdapter
 *     → InMemoryXMLValidationRuntimeStore → XMLValidationResult
 *
 * C-02: infraestrutura canônica de orquestração estrutural de
 * validação futura de documentos XML (estrutura / schema / namespace /
 * versão / integridade / consistência / compatibilidade / relatório).
 * Sem validação XML real. Sem XSD. Sem parser. Sem SOAP. Sem operadoras.
 * Sem correção automática. Sem banco. Sem persistência. Sem APIs. Sem IA.
 *
 * Contrato oficial XMLValidationContext:
 *   XMLDocument + CanonicalGuide + CanonicalMappingResult +
 *   QualityAssessment + ValidationResult + AuditResult + AutoFillResult
 *   (metadados estruturais apenas — sem processamento).
 *
 * Dependências XMLTISSRuntime/QualityRuntime/AutoFillRuntime/TISSMappingRuntime/
 * AuditRuntime/ValidationRuntime/DocumentExtractionRuntime/
 * DocumentClassificationRuntime/OCRRuntime/AIOrchestrationRuntime preparadas —
 * sem consumo funcional (shape-check apenas em health()).
 *
 * Compatibilidade TISS-08: aliases CanonicalXMLValidation* e
 * DefaultXMLValidationAdapter / EnterpriseXMLValidationAdapter /
 * MockXMLValidationAdapter mantidos para a cadeia TISS.
 */
export type {
  AuditResult,
  AutoFillResult,
  CanonicalGuide,
  CanonicalMappingResult,
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
  GetXMLValidationResultInput,
  GetXMLValidationResultResult,
  ListCanonicalXMLValidationResultsInput,
  ListCanonicalXMLValidationResultsResult,
  ListXMLValidationResultsInput,
  ListXMLValidationResultsResult,
  QualityAssessment,
  ValidateCanonicalXMLInput,
  ValidateCanonicalXMLResult,
  ValidateXMLInput,
  ValidateXMLResult,
  ValidationResult,
  XMLDocument,
  XMLValidationCapabilities,
  XMLValidationCompatibilityContract,
  XMLValidationConsistencyContract,
  XMLValidationContext,
  XMLValidationHealth,
  XMLValidationIntegrityContract,
  XMLValidationIssue,
  XMLValidationMetadata,
  XMLValidationNamespaceContract,
  XMLValidationOperation,
  XMLValidationProfile,
  XMLValidationReference,
  XMLValidationReportContract,
  XMLValidationRequest,
  XMLValidationResult,
  XMLValidationRuntimeCapabilities,
  XMLValidationRuntimeEngineCapabilities,
  XMLValidationRuntimeEnterpriseDeps,
  XMLValidationRuntimeHealth,
  XMLValidationRuntimeInfo,
  XMLValidationRuntimeOperationalControls,
  XMLValidationRuntimeOperationEnvelope,
  XMLValidationRuntimeOptions,
  XMLValidationRuntimePort,
  XMLValidationRuntimePortCapabilities,
  XMLValidationRuntimeProviderId,
  XMLValidationRuntimeProviderMetadata,
  XMLValidationRuntimeProviderOptions,
  XMLValidationRuntimeRegistration,
  XMLValidationRuntimeStatus,
  XMLValidationRuntimeStructuredLog,
  XMLValidationRuntimeTelemetry,
  XMLValidationSchemaContract,
  XMLValidationStatistics,
  XMLValidationStatsInput,
  XMLValidationStatsResult,
  XMLValidationStatus,
  XMLValidationStructureContract,
  XMLValidationSummary,
  XMLValidationVersion,
  XMLValidationVersionContract,
  ValidateXSDInput,
  ValidateXSDResult,
  ValidateNamespaceInput,
  ValidateNamespaceResult,
  ValidateVersionInput,
  ValidateVersionResult,
  ValidateBusinessInput,
  ValidateBusinessResult,
  ValidateOperatorInput,
  ValidateOperatorResult,
  RepairXMLInput,
  RepairXMLResult,
  CorrectXMLInput,
  CorrectXMLResult,
  GenerateXMLValidationReportInput,
  GenerateXMLValidationReportResult,
  ValidateGenericXMLInput,
  ValidateGenericXMLResult,
  CanonicalValidationIssue,
  CanonicalValidationStatistics,
  CanonicalXSDValidationResult,
  CanonicalNamespaceValidationContext,
  CanonicalNamespaceValidationResult,
  CanonicalVersionValidationContext,
  CanonicalVersionValidationResult,
  CanonicalBusinessValidationContext,
  CanonicalBusinessValidationResult,
  CanonicalOperatorValidationContext,
  CanonicalOperatorValidationResult,
  CanonicalXMLRepairContext,
  CanonicalXMLRepairResult,
  CanonicalXMLAutomaticCorrectionContext,
  CanonicalXMLAutomaticCorrectionResult,
  CanonicalXMLValidationReport,
  CanonicalXMLValidationReportContext,
  CanonicalGenericXMLValidationContext,
  CanonicalGenericXMLValidationResult,
  XMLValidationRuntimeContext,
} from "./ports";

export {
  XML_VALIDATION_RUNTIME_IDENTITY,
  DEFAULT_MOCK_XML_VALIDATION_RUNTIME_CAPABILITIES,
  DEFAULT_MOCK_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_XML_VALIDATION_RUNTIME_CAPABILITIES,
  DEFAULT_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES,
  createDisabledXMLValidationReport,
  createDisabledXMLValidationSchema,
  createDisabledXMLValidationStructure,
  createXMLValidationContextId,
  createXMLValidationId,
  createXMLValidationResultId,
  createXMLValidationRuntimeRequestId,
  defineXMLValidationRuntimeCapabilities,
  defineXMLValidationRuntimeEngineCapabilities,
  emptyXMLValidationRuntimeCapabilities,
  emptyXMLValidationRuntimeEngineCapabilities,
  resetAllXMLValidationRuntimeIdSequences,
  resetXMLValidationRuntimeIdSequences,
  toCanonicalXMLValidationCapabilities,
  toXMLValidationCapabilities,
} from "./ports";

export {
  DEFAULT_MOCK_XML_VALIDATION_RUNTIME_VERSION,
  DEFAULT_XML_VALIDATION_ADAPTER_ID,
  DEFAULT_XML_VALIDATION_RUNTIME_ADAPTER_ID,
  DEFAULT_XML_VALIDATION_RUNTIME_VERSION,
  DefaultXMLValidationAdapter,
  DefaultXMLValidationRuntimeAdapter,
  EnterpriseXMLValidationAdapter,
  EnterpriseXMLValidationRuntimeAdapter,
  MOCK_XML_VALIDATION_ADAPTER_ID,
  MOCK_XML_VALIDATION_RUNTIME_ADAPTER_ID,
  MockXMLValidationAdapter,
  MockXMLValidationRuntimeAdapter,
  type DefaultXMLValidationAdapterOptions,
  type DefaultXMLValidationRuntimeAdapterOptions,
  type MockXMLValidationAdapterOptions,
  type MockXMLValidationRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_XML_VALIDATION_RUNTIME_STORE_ID,
  InMemoryXMLValidationRuntimeStore,
  type InMemoryXMLValidationRuntimeStoreOptions,
  type StoredCanonicalXMLValidationResult,
  type StoredXMLValidationContext,
  type StoredXMLValidationRequest,
  type StoredXMLValidationResult,
  type XMLValidationRuntimeStore,
} from "./store";

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
  XMLValidationRuntimeProvider,
  createXMLValidationRuntimePort,
  getXMLValidationRuntimeFactory,
  getXMLValidationRuntimePort,
} from "./providers";

export {
  getXMLValidationRuntimeHealthSummary,
  type XMLValidationRuntimeHealthSummary,
} from "./demo";

export {
  XSDValidator,
  defaultXSDValidator,
  validateXSD,
  createEmptyXMLValidationRuntimeContext,
  type XSDValidatorOptions,
} from "./xsd-validation";

/**
 * Enterprise SOAP Runtime — C-03 / ECS-01.
 *
 * Fluxo estrutural oficial (C-03):
 *   Produto → Enterprise Runtime → SOAPRuntimePort
 *     → DefaultSOAPRuntimeAdapter / EnterpriseSOAPRuntimeAdapter /
 *       MockSOAPRuntimeAdapter
 *     → InMemorySOAPRuntimeStore → SOAPResponse
 *
 * C-03: infraestrutura canônica de encapsulamento estrutural de
 * transporte SOAP futuro.
 * Sem comunicação SOAP. Sem HTTP. Sem WSDL. Sem TLS. Sem certificado.
 * Sem autenticação. Sem MTOM. Sem XML funcional. Sem operadoras.
 * Sem banco. Sem persistência. Sem APIs. Sem filas. Sem mensageria.
 *
 * Contrato oficial SOAPContext:
 *   XMLDocument + XMLValidationResult + CanonicalGuide +
 *   QualityAssessment + ValidationResult + AuditResult
 *   + envelope de observabilidade (RULE_04)
 *   (metadados estruturais apenas — sem processamento).
 *
 * Dependências XMLRuntime/XMLValidationRuntime/QualityRuntime/AutoFillRuntime/
 * TISSMappingRuntime/AuditRuntime/ValidationRuntime preparadas —
 * sem consumo funcional (shape-check apenas em health()).
 *
 * TRANSPORT AGNOSTIC (Regra Permanente nº 5): este Runtime é exclusivamente
 * o encapsulador de transporte SOAP; demais Runtimes NÃO conhecem SOAP.
 */
export type {
  AuditResult,
  CanonicalGuide,
  GetSOAPResponseInput,
  GetSOAPResponseResult,
  ListSOAPResponsesInput,
  ListSOAPResponsesResult,
  PrepareSOAPInput,
  PrepareSOAPResult,
  QualityAssessment,
  SOAPBody,
  SOAPCapabilities,
  SOAPContext,
  SOAPEnvelope,
  SOAPFault,
  SOAPHeader,
  SOAPHealth,
  SOAPRequest,
  SOAPResponse,
  SOAPRuntimeCapabilities,
  SOAPRuntimeEngineCapabilities,
  SOAPRuntimeEnterpriseDeps,
  SOAPRuntimeHealth,
  SOAPRuntimeInfo,
  SOAPRuntimeObservabilityEnvelope,
  SOAPRuntimeOperationalControls,
  SOAPRuntimeOperationEnvelope,
  SOAPRuntimeOptions,
  SOAPRuntimePort,
  SOAPRuntimePortCapabilities,
  SOAPRuntimeProviderId,
  SOAPRuntimeProviderMetadata,
  SOAPRuntimeProviderOptions,
  SOAPRuntimeRegistration,
  SOAPRuntimeStatus,
  SOAPRuntimeStructuredLog,
  SOAPRuntimeTelemetry,
  SOAPStatistics,
  SOAPStatsInput,
  SOAPStatsResult,
  SOAPStatus,
  ValidationResult,
  XMLDocument,
  XMLValidationResult,
} from "./ports";

export {
  SOAP_RUNTIME_IDENTITY,
  DEFAULT_MOCK_SOAP_RUNTIME_CAPABILITIES,
  DEFAULT_MOCK_SOAP_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_SOAP_RUNTIME_CAPABILITIES,
  DEFAULT_SOAP_RUNTIME_ENGINE_CAPABILITIES,
  createDisabledSOAPEnvelope,
  createDisabledSOAPFault,
  createSOAPContextId,
  createSOAPRequestId,
  createSOAPResponseId,
  createSOAPRuntimeRequestId,
  defineSOAPRuntimeCapabilities,
  defineSOAPRuntimeEngineCapabilities,
  emptySOAPRuntimeCapabilities,
  emptySOAPRuntimeEngineCapabilities,
  resetAllSOAPRuntimeIdSequences,
  resetSOAPRuntimeIdSequences,
  toCanonicalSOAPCapabilities,
  toSOAPCapabilities,
} from "./ports";

export {
  DEFAULT_MOCK_SOAP_RUNTIME_VERSION,
  DEFAULT_SOAP_RUNTIME_ADAPTER_ID,
  DEFAULT_SOAP_RUNTIME_VERSION,
  DefaultSOAPRuntimeAdapter,
  EnterpriseSOAPRuntimeAdapter,
  MOCK_SOAP_RUNTIME_ADAPTER_ID,
  MockSOAPRuntimeAdapter,
  type DefaultSOAPRuntimeAdapterOptions,
  type MockSOAPRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_SOAP_RUNTIME_STORE_ID,
  InMemorySOAPRuntimeStore,
  type InMemorySOAPRuntimeStoreOptions,
  type StoredSOAPContext,
  type StoredSOAPRequest,
  type StoredSOAPResponse,
  type SOAPRuntimeStore,
} from "./store";

export {
  SOAPRuntimeFactory,
  createSOAPRuntimeFactory,
  type SOAPRuntimeFactoryOptions,
} from "./factory/soap-runtime-factory";

export {
  BUILTIN_SOAP_RUNTIME_PROVIDER_COUNT,
  SOAPRuntimeRegistry,
  createDefaultSOAPRuntimeRegistry,
  type SOAPRuntimeRegistrySnapshot,
} from "./registry/soap-runtime-registry";

export {
  SOAPRuntimeProvider,
  createSOAPRuntimePort,
  getSOAPRuntimeFactory,
  getSOAPRuntimePort,
} from "./providers";

export { getSOAPRuntimeHealthSummary, type SOAPRuntimeHealthSummary } from "./demo";

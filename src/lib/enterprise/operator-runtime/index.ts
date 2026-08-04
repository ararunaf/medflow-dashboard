/**
 * Enterprise Operator Runtime — C-04 / ECS-01.
 *
 * Fluxo estrutural oficial (C-04):
 *   Produto → Enterprise Runtime → OperatorRuntimePort
 *     → DefaultOperatorRuntimeAdapter / EnterpriseOperatorRuntimeAdapter /
 *       MockOperatorRuntimeAdapter
 *     → InMemoryOperatorRuntimeStore → OperatorCapabilityProfile
 *
 * C-04: infraestrutura canônica de Operator Capability Model.
 * Sem operadoras reais. Sem lógica condicional por operadora.
 * Sem autenticação. Sem SOAP funcional. Sem XML funcional. Sem REST.
 * Sem banco. Sem persistência. Sem APIs. Sem HTTP. Sem TLS. Sem certificados.
 *
 * Contrato oficial OperatorContext:
 *   OperatorCapabilityProfile + peers estruturais + envelope RULE_04
 *   (metadados estruturais apenas — sem processamento).
 *
 * Dependências SOAPRuntime/XMLRuntime/XMLValidationRuntime/QualityRuntime/
 * AutoFillRuntime/TISSMappingRuntime/AuditRuntime/ValidationRuntime preparadas —
 * sem consumo funcional (shape-check apenas em health()).
 *
 * OPERATOR CAPABILITY MODEL (Regra Permanente nº 7): nenhuma operadora
 * é conhecida; especialização futura ocorre apenas por Adapters + Profiles.
 */
export type {
  AuditResult,
  CanonicalGuide,
  GetOperatorProfileInput,
  GetOperatorProfileResult,
  ListOperatorProfilesInput,
  ListOperatorProfilesResult,
  OperatorCapabilities,
  OperatorCapabilityProfile,
  OperatorContext,
  OperatorFeatures,
  OperatorHealth,
  OperatorMetadata,
  OperatorRequest,
  OperatorResponse,
  OperatorRestrictions,
  OperatorRuntimeCapabilities,
  OperatorRuntimeEngineCapabilities,
  OperatorRuntimeEnterpriseDeps,
  OperatorRuntimeHealth,
  OperatorRuntimeInfo,
  OperatorRuntimeObservabilityEnvelope,
  OperatorRuntimeOperationalControls,
  OperatorRuntimeOperationEnvelope,
  OperatorRuntimeOptions,
  OperatorRuntimePort,
  OperatorRuntimePortCapabilities,
  OperatorRuntimeProviderId,
  OperatorRuntimeProviderMetadata,
  OperatorRuntimeProviderOptions,
  OperatorRuntimeRegistration,
  OperatorRuntimeStatus,
  OperatorRuntimeStructuredLog,
  OperatorRuntimeTelemetry,
  OperatorStatistics,
  OperatorStatsInput,
  OperatorStatsResult,
  OperatorStatus,
  PrepareOperatorProfileInput,
  PrepareOperatorProfileResult,
  QualityAssessment,
  ValidationResult,
  XMLDocument,
  XMLValidationResult,
} from "./ports";

export {
  OPERATOR_RUNTIME_IDENTITY,
  DEFAULT_MOCK_OPERATOR_RUNTIME_CAPABILITIES,
  DEFAULT_MOCK_OPERATOR_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_OPERATOR_RUNTIME_CAPABILITIES,
  DEFAULT_OPERATOR_RUNTIME_ENGINE_CAPABILITIES,
  createEmptyOperatorCapabilityProfile,
  createOperatorContextId,
  createOperatorProfileId,
  createOperatorRequestId,
  createOperatorResponseId,
  createOperatorRuntimeRequestId,
  defineOperatorRuntimeCapabilities,
  defineOperatorRuntimeEngineCapabilities,
  emptyOperatorRuntimeCapabilities,
  emptyOperatorRuntimeEngineCapabilities,
  resetAllOperatorRuntimeIdSequences,
  resetOperatorRuntimeIdSequences,
  toCanonicalOperatorCapabilities,
  toOperatorCapabilities,
} from "./ports";

export {
  DEFAULT_MOCK_OPERATOR_RUNTIME_VERSION,
  DEFAULT_OPERATOR_RUNTIME_ADAPTER_ID,
  DEFAULT_OPERATOR_RUNTIME_VERSION,
  DefaultOperatorRuntimeAdapter,
  EnterpriseOperatorRuntimeAdapter,
  MOCK_OPERATOR_RUNTIME_ADAPTER_ID,
  MockOperatorRuntimeAdapter,
  type DefaultOperatorRuntimeAdapterOptions,
  type MockOperatorRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_OPERATOR_RUNTIME_STORE_ID,
  InMemoryOperatorRuntimeStore,
  type InMemoryOperatorRuntimeStoreOptions,
  type StoredOperatorContext,
  type StoredOperatorProfile,
  type StoredOperatorRequest,
  type StoredOperatorResponse,
  type OperatorRuntimeStore,
} from "./store";

export {
  OperatorRuntimeFactory,
  createOperatorRuntimeFactory,
  type OperatorRuntimeFactoryOptions,
} from "./factory/operator-runtime-factory";

export {
  BUILTIN_OPERATOR_RUNTIME_PROVIDER_COUNT,
  OperatorRuntimeRegistry,
  createDefaultOperatorRuntimeRegistry,
  type OperatorRuntimeRegistrySnapshot,
} from "./registry/operator-runtime-registry";

export {
  OperatorRuntimeProvider,
  createOperatorRuntimePort,
  getOperatorRuntimeFactory,
  getOperatorRuntimePort,
} from "./providers";

export { getOperatorRuntimeHealthSummary, type OperatorRuntimeHealthSummary } from "./demo";

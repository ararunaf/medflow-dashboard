/**
 * Enterprise Authorization Runtime — C-05 / ECS-01.
 *
 * Fluxo estrutural oficial (C-05):
 *   Produto → Enterprise Runtime → AuthorizationRuntimePort
 *     → DefaultAuthorizationRuntimeAdapter / EnterpriseAuthorizationRuntimeAdapter /
 *       MockAuthorizationRuntimeAdapter
 *     → InMemoryAuthorizationRuntimeStore → AuthorizationStrategy / AuthorizationPolicy
 *
 * C-05: infraestrutura canônica de Authorization Strategy Pattern.
 * Sem autorização funcional. Sem elegibilidade. Sem integração com operadoras.
 * Sem SOAP funcional. Sem XML funcional. Sem REST. Sem autenticação.
 * Sem banco. Sem persistência. Sem APIs. Sem HTTP. Sem TLS. Sem certificados.
 *
 * Contrato oficial AuthorizationContext:
 *   AuthorizationStrategy + AuthorizationPolicy + OperatorCapabilityProfile
 *   + peers estruturais + envelope RULE_04
 *   (metadados estruturais apenas — sem processamento).
 *
 * Dependências OperatorRuntime/SOAPRuntime/XMLRuntime/XMLValidationRuntime/
 * QualityRuntime/AutoFillRuntime/AuditRuntime/ValidationRuntime preparadas —
 * sem consumo funcional (shape-check apenas em health()).
 *
 * AUTHORIZATION STRATEGY PATTERN (Regra Permanente nº 9): nenhuma autorização
 * é implementada no Runtime; especialização futura ocorre apenas por Strategies.
 * POLICY-DRIVEN AUTHORIZATION: decisões futuras via OperatorCapabilityProfile
 * + AuthorizationPolicy (sem if/switch por operadora/versão/guia).
 */
export type {
  AuditResult,
  AuthorizationCapabilities,
  AuthorizationContext,
  AuthorizationHealth,
  AuthorizationMetadata,
  AuthorizationPolicy,
  AuthorizationRequest,
  AuthorizationResponse,
  AuthorizationRuntimeCapabilities,
  AuthorizationRuntimeEngineCapabilities,
  AuthorizationRuntimeEnterpriseDeps,
  AuthorizationRuntimeHealth,
  AuthorizationRuntimeInfo,
  AuthorizationRuntimeObservabilityEnvelope,
  AuthorizationRuntimeOperationalControls,
  AuthorizationRuntimeOperationEnvelope,
  AuthorizationRuntimeOptions,
  AuthorizationRuntimePort,
  AuthorizationRuntimePortCapabilities,
  AuthorizationRuntimeProviderId,
  AuthorizationRuntimeProviderMetadata,
  AuthorizationRuntimeProviderOptions,
  AuthorizationRuntimeRegistration,
  AuthorizationRuntimeStatus,
  AuthorizationRuntimeStructuredLog,
  AuthorizationRuntimeTelemetry,
  AuthorizationStatistics,
  AuthorizationStatsInput,
  AuthorizationStatsResult,
  AuthorizationStatus,
  AuthorizationStrategy,
  AuthorizationStrategyKind,
  CanonicalGuide,
  GetAuthorizationInput,
  GetAuthorizationResult,
  ListAuthorizationsInput,
  ListAuthorizationsResult,
  OperatorCapabilityProfile,
  PrepareAuthorizationInput,
  PrepareAuthorizationResult,
  QualityAssessment,
  ValidationResult,
  XMLDocument,
  XMLValidationResult,
} from "./ports";

export {
  AUTHORIZATION_RUNTIME_IDENTITY,
  DEFAULT_MOCK_AUTHORIZATION_RUNTIME_CAPABILITIES,
  DEFAULT_MOCK_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_AUTHORIZATION_RUNTIME_CAPABILITIES,
  DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES,
  createAuthorizationContextId,
  createAuthorizationPolicyId,
  createAuthorizationRequestId,
  createAuthorizationResponseId,
  createAuthorizationRuntimeRequestId,
  createAuthorizationStrategyId,
  createEmptyAuthorizationPolicy,
  createEmptyAuthorizationStrategy,
  defineAuthorizationRuntimeCapabilities,
  defineAuthorizationRuntimeEngineCapabilities,
  emptyAuthorizationRuntimeCapabilities,
  emptyAuthorizationRuntimeEngineCapabilities,
  resetAllAuthorizationRuntimeIdSequences,
  resetAuthorizationRuntimeIdSequences,
  toAuthorizationCapabilities,
  toCanonicalAuthorizationCapabilities,
} from "./ports";

export {
  DEFAULT_MOCK_AUTHORIZATION_RUNTIME_VERSION,
  DEFAULT_AUTHORIZATION_RUNTIME_ADAPTER_ID,
  DEFAULT_AUTHORIZATION_RUNTIME_VERSION,
  DefaultAuthorizationRuntimeAdapter,
  EnterpriseAuthorizationRuntimeAdapter,
  MOCK_AUTHORIZATION_RUNTIME_ADAPTER_ID,
  MockAuthorizationRuntimeAdapter,
  type DefaultAuthorizationRuntimeAdapterOptions,
  type MockAuthorizationRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_AUTHORIZATION_RUNTIME_STORE_ID,
  InMemoryAuthorizationRuntimeStore,
  type InMemoryAuthorizationRuntimeStoreOptions,
  type StoredAuthorizationContext,
  type StoredAuthorizationPolicy,
  type StoredAuthorizationRequest,
  type StoredAuthorizationResponse,
  type StoredAuthorizationStrategy,
  type AuthorizationRuntimeStore,
} from "./store";

export {
  AuthorizationRuntimeFactory,
  createAuthorizationRuntimeFactory,
  type AuthorizationRuntimeFactoryOptions,
} from "./factory/authorization-runtime-factory";

export {
  BUILTIN_AUTHORIZATION_RUNTIME_PROVIDER_COUNT,
  AuthorizationRuntimeRegistry,
  createDefaultAuthorizationRuntimeRegistry,
  type AuthorizationRuntimeRegistrySnapshot,
} from "./registry/authorization-runtime-registry";

export {
  AuthorizationRuntimeProvider,
  createAuthorizationRuntimePort,
  getAuthorizationRuntimeFactory,
  getAuthorizationRuntimePort,
} from "./providers";

export {
  getAuthorizationRuntimeHealthSummary,
  type AuthorizationRuntimeHealthSummary,
} from "./demo";

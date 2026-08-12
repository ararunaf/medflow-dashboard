/**
 * Enterprise Protocol Runtime — C-07 / ECS-01.
 *
 * Fluxo estrutural oficial (C-07):
 *   Produto → Enterprise Runtime → ProtocolRuntimePort
 *     → DefaultProtocolRuntimeAdapter / EnterpriseProtocolRuntimeAdapter /
 *       MockProtocolRuntimeAdapter
 *     → InMemoryProtocolRuntimeStore → ProtocolProfile / ProtocolResolver
 *
 * C-07: infraestrutura canônica de Protocol Runtime Foundation.
 * Sem SOAP. Sem REST. Sem gRPC. Sem mensageria. Sem HTTP. Sem TLS.
 * Sem autenticação. Sem APIs. Sem banco. Sem envio de documentos.
 * Sem integração com operadoras. Sem resolução funcional de protocolos.
 *
 * Contratos oficiais:
 *   ProtocolContext · ProtocolProfile · ProtocolCapabilities ·
 *   ProtocolResolver · ProtocolMetadata · ProtocolState ·
 *   ProtocolHealth · ProtocolStatistics
 *   + envelope RULE_04 (metadados estruturais apenas).
 *
 * Dependências BatchRuntime/AuthorizationRuntime/OperatorRuntime/
 * SOAPRuntime/XMLRuntime/XMLValidationRuntime preparadas —
 * sem consumo funcional (shape-check apenas em health()).
 *
 * PROTOCOL ABSTRACTION (Regra Permanente nº 12): o Runtime nunca conhece
 * protocolos concretos; SOAP/REST/gRPC/mensageria serão apenas Adapters.
 * PROTOCOL RESOLUTION: contratos ProtocolResolver/ProtocolProfile/
 * ProtocolCapabilities — seleção futura via OperatorCapabilityProfile +
 * ProtocolCapabilities (sem implementação funcional).
 */
export type {
  AuthorizationPolicy,
  AuthorizationStrategy,
  BatchManifest,
  GetProtocolProfileInput,
  GetProtocolProfileResult,
  ListProtocolProfilesInput,
  ListProtocolProfilesResult,
  OperatorCapabilityProfile,
  PrepareProtocolProfileInput,
  PrepareProtocolProfileResult,
  ProtocolCapabilities,
  ProtocolContext,
  ProtocolHealth,
  ProtocolMetadata,
  ProtocolProfile,
  ProtocolResolver,
  ProtocolRuntimeCapabilities,
  ProtocolRuntimeEngineCapabilities,
  ProtocolRuntimeEnterpriseDeps,
  ProtocolRuntimeHealth,
  ProtocolRuntimeInfo,
  ProtocolRuntimeObservabilityEnvelope,
  ProtocolRuntimeOperationalControls,
  ProtocolRuntimeOperationEnvelope,
  ProtocolRuntimeOptions,
  ProtocolRuntimePort,
  ProtocolRuntimePortCapabilities,
  ProtocolRuntimeProviderId,
  ProtocolRuntimeProviderMetadata,
  ProtocolRuntimeProviderOptions,
  ProtocolRuntimeRegistration,
  ProtocolRuntimeStatus,
  ProtocolRuntimeStructuredLog,
  ProtocolRuntimeTelemetry,
  ProtocolState,
  ProtocolStatistics,
  ProtocolStatsInput,
  ProtocolStatsResult,
  ResolveProtocolInput,
  ResolveProtocolResult,
  XMLDocument,
  XMLValidationResult,
} from "./ports";

export {
  PROTOCOL_CANONICAL_STATES,
  PROTOCOL_RUNTIME_IDENTITY,
  DEFAULT_MOCK_PROTOCOL_RUNTIME_CAPABILITIES,
  DEFAULT_MOCK_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_PROTOCOL_RUNTIME_CAPABILITIES,
  DEFAULT_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES,
  createEmptyProtocolCapabilities,
  createEmptyProtocolProfile,
  createEmptyProtocolResolver,
  createProtocolContextId,
  createProtocolProfileId,
  createProtocolResolverId,
  createProtocolRuntimeRequestId,
  defineProtocolRuntimeCapabilities,
  defineProtocolRuntimeEngineCapabilities,
  emptyProtocolRuntimeCapabilities,
  emptyProtocolRuntimeEngineCapabilities,
  resetAllProtocolRuntimeIdSequences,
  resetProtocolRuntimeIdSequences,
  toCanonicalProtocolCapabilities,
  toProtocolCapabilities,
} from "./ports";

export {
  DEFAULT_MOCK_PROTOCOL_RUNTIME_VERSION,
  DEFAULT_PROTOCOL_RUNTIME_ADAPTER_ID,
  DEFAULT_PROTOCOL_RUNTIME_VERSION,
  DefaultProtocolRuntimeAdapter,
  EnterpriseProtocolRuntimeAdapter,
  MOCK_PROTOCOL_RUNTIME_ADAPTER_ID,
  MockProtocolRuntimeAdapter,
  REAL_TISS_PROTOCOL_RUNTIME_ADAPTER_ID,
  REAL_TISS_PROTOCOL_RUNTIME_VERSION,
  RealTissProtocolRuntimeAdapter,
  type DefaultProtocolRuntimeAdapterOptions,
  type MockProtocolRuntimeAdapterOptions,
  type RealTissProtocolRuntimeAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_PROTOCOL_RUNTIME_STORE_ID,
  InMemoryProtocolRuntimeStore,
  type InMemoryProtocolRuntimeStoreOptions,
  type StoredProtocolContext,
  type StoredProtocolProfile,
  type StoredProtocolResolver,
  type ProtocolRuntimeStore,
} from "./store";

export {
  ProtocolRuntimeFactory,
  createProtocolRuntimeFactory,
  type ProtocolRuntimeFactoryOptions,
} from "./factory/protocol-runtime-factory";

export {
  BUILTIN_PROTOCOL_RUNTIME_PROVIDER_COUNT,
  ProtocolRuntimeRegistry,
  createDefaultProtocolRuntimeRegistry,
  type ProtocolRuntimeRegistrySnapshot,
} from "./registry/protocol-runtime-registry";

export {
  ProtocolRuntimeProvider,
  createProtocolRuntimePort,
  getProtocolRuntimeFactory,
  getProtocolRuntimePort,
} from "./providers";

export { getProtocolRuntimeHealthSummary, type ProtocolRuntimeHealthSummary } from "./demo";

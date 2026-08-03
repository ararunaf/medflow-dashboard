/**
 * Enterprise Scalability Runtime — Ports & Adapters (INF-10).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → ScalabilityRuntimePort
 *     → DefaultScalabilityRuntimeAdapter / EnterpriseScalabilityRuntimeAdapter / MockScalabilityRuntimeAdapter
 *     → InMemoryScalabilityRuntimeStore
 *     → Canonical Scalability Result
 *
 * INF-10: infraestrutura canônica de gerenciamento estrutural de escalabilidade futura.
 * Sem Kubernetes. Sem Docker Swarm. Sem Azure Scale Set.
 * Sem Horizontal Pod Autoscaler. Sem Auto Scaling. Sem Cluster. Sem Load Balancer. Sem Failover.
 * Sem Sharding. Sem Partitioning. Sem Horizontal/Vertical Scaling reais.
 * Sem High Availability real. Sem Elastic Scaling real. Sem Capacity Planning real.
 * Sem Workers reais. Sem Scheduler real. Sem processamento assíncrono.
 * Sem HTTP. Sem operadoras/ANS/XML/OCR/Capture/IA.
 * Dependências Queue + Worker + Scheduler + Persistent Queue + Observability + TISS Runtime preparadas — sem consumo/execução.
 * Toda comunicação exclusivamente via ScalabilityRuntimePort.
 */
export type {
  ReleaseSignalInput,
  ReleaseSignalResult,
  CanonicalScalabilityScope,
  CanonicalScalabilityCapabilities,
  CanonicalScalabilityEnvelope,
  CanonicalScalabilityHealth,
  CanonicalScalabilityIdentity,
  CanonicalScalabilitySignal,
  CanonicalScalabilityMetadata,
  CanonicalScalabilityOperation,
  CanonicalScalabilityProvider,
  CanonicalScalabilityResult,
  CanonicalScalabilityStatistics,
  CanonicalScalabilityStatus,
  ListScalabilityScopesInput,
  ListScalabilityScopesResult,
  RegisterScalabilityScopeInput,
  RegisterScalabilityScopeResult,
  ObserveSignalInput,
  ObserveSignalResult,
  ScalabilityRuntimeCapabilities,
  ScalabilityRuntimeEnterpriseDeps,
  ScalabilityRuntimeHealth,
  ScalabilityRuntimeInfo,
  ScalabilityRuntimeOperationEnvelope,
  ScalabilityRuntimeOperationalControls,
  ScalabilityRuntimeOptions,
  ScalabilityRuntimePort,
  ScalabilityRuntimePortCapabilities,
  ScalabilityRuntimeProviderId,
  ScalabilityRuntimeProviderMetadata,
  ScalabilityRuntimeRegistration,
  ScalabilityRuntimeStatus,
  ScalabilityRuntimeStructuredLog,
  ScalabilityRuntimeTelemetry,
  ScalabilityStatsInput,
  ScalabilityStatsResult,
  UnregisterScalabilityScopeInput,
  UnregisterScalabilityScopeResult,
} from "./ports";

export {
  DEFAULT_MOCK_SCALABILITY_RUNTIME_CAPABILITIES,
  DEFAULT_SCALABILITY_RUNTIME_CAPABILITIES,
  createScalabilityScopeId,
  createScalabilityEnvelopeId,
  createScalabilitySignalId,
  createScalabilityResultId,
  createScalabilityRuntimeRequestId,
  defineScalabilityRuntimeCapabilities,
  emptyScalabilityRuntimeCapabilities,
  resetScalabilityRuntimeIdSequences,
  toCanonicalScalabilityCapabilities,
} from "./ports";

export {
  DEFAULT_SCALABILITY_RUNTIME_ADAPTER_ID,
  DEFAULT_SCALABILITY_RUNTIME_VERSION,
  DEFAULT_MOCK_SCALABILITY_RUNTIME_VERSION,
  DefaultScalabilityRuntimeAdapter,
  EnterpriseScalabilityRuntimeAdapter,
  MOCK_SCALABILITY_RUNTIME_ADAPTER_ID,
  MockScalabilityRuntimeAdapter,
  type DefaultScalabilityRuntimeAdapterOptions,
  type MockScalabilityRuntimeAdapterOptions,
} from "./adapters";

export {
  ScalabilityRuntimeFactory,
  createScalabilityRuntimeFactory,
  type ScalabilityRuntimeFactoryOptions,
} from "./factory";

export {
  BUILTIN_SCALABILITY_RUNTIME_PROVIDER_COUNT,
  ScalabilityRuntimeRegistry,
  createDefaultScalabilityRuntimeRegistry,
  type ScalabilityRuntimeRegistrySnapshot,
} from "./registry";

export {
  IN_MEMORY_SCALABILITY_RUNTIME_STORE_ID,
  InMemoryScalabilityRuntimeStore,
  type InMemoryScalabilityRuntimeStoreOptions,
  type StoredCanonicalScalabilityScope,
  type StoredCanonicalScalabilityEnvelope,
  type StoredCanonicalScalabilitySignal,
  type ScalabilityRuntimeStore,
} from "./store";

export {
  ScalabilityRuntimeProvider,
  createScalabilityRuntimePort,
  getScalabilityRuntimeFactory,
} from "./providers";

export { getScalabilityRuntimeHealthSummary, type ScalabilityRuntimeHealthSummary } from "./demo";

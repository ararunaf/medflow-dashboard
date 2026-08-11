/**
 * Enterprise Observability Runtime — Ports & Adapters (INF-09 / OPER-INF-O).
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → ObservabilityRuntimePort
 *     → DefaultObservabilityRuntimeAdapter / EnterpriseObservabilityRuntimeAdapter / MockObservabilityRuntimeAdapter
 *     → InMemoryObservabilityRuntimeStore
 *     → Canonical Observability Result
 *     → (OPER-INF-O) RuntimeObservabilityCollector — somente leitura via Ports
 *
 * OPER-INF-O: coleta métricas/health/status/contadores/timers/throughput/filas/
 * workers/scheduler/dead-letter/diagnostics reutilizando exclusivamente Ports existentes.
 * Sem OpenTelemetry. Sem Application Insights. Sem Azure Monitor.
 * Sem Prometheus. Sem Grafana. Sem Elastic. Sem Datadog. Sem New Relic.
 * Sem Loki. Sem Jaeger. Sem logs/métricas/tracing reais.
 * Sem alertas reais. Sem dashboards reais. Sem telemetria HTTP.
 * Sem novos Ports / Gateways / Runtimes. Sem alteração do pipeline oficial.
 * Toda comunicação exclusivamente via ObservabilityRuntimePort.
 */
export type {
  ReleaseSignalInput,
  ReleaseSignalResult,
  CanonicalObservabilityScope,
  CanonicalObservabilityCapabilities,
  CanonicalObservabilityEnvelope,
  CanonicalObservabilityHealth,
  CanonicalObservabilityIdentity,
  CanonicalObservabilitySignal,
  CanonicalObservabilityMetadata,
  CanonicalObservabilityOperation,
  CanonicalObservabilityProvider,
  CanonicalObservabilityResult,
  CanonicalObservabilityStatistics,
  CanonicalObservabilityStatus,
  ListObservabilityScopesInput,
  ListObservabilityScopesResult,
  RegisterObservabilityScopeInput,
  RegisterObservabilityScopeResult,
  ObserveSignalInput,
  ObserveSignalResult,
  ObservabilityRuntimeCapabilities,
  ObservabilityRuntimeEnterpriseDeps,
  ObservabilityRuntimeHealth,
  ObservabilityRuntimeInfo,
  ObservabilityRuntimeOperationEnvelope,
  ObservabilityRuntimeOperationalControls,
  ObservabilityRuntimeOptions,
  ObservabilityRuntimePort,
  ObservabilityRuntimePortCapabilities,
  ObservabilityRuntimeProviderId,
  ObservabilityRuntimeProviderMetadata,
  ObservabilityRuntimeRegistration,
  ObservabilityRuntimeStatus,
  ObservabilityRuntimeStructuredLog,
  ObservabilityRuntimeTelemetry,
  ObservabilityStatsInput,
  ObservabilityStatsResult,
  UnregisterObservabilityScopeInput,
  UnregisterObservabilityScopeResult,
} from "./ports";

export {
  DEFAULT_MOCK_OBSERVABILITY_RUNTIME_CAPABILITIES,
  DEFAULT_OBSERVABILITY_RUNTIME_CAPABILITIES,
  createObservabilityScopeId,
  createObservabilityEnvelopeId,
  createObservabilitySignalId,
  createObservabilityResultId,
  createObservabilityRuntimeRequestId,
  defineObservabilityRuntimeCapabilities,
  emptyObservabilityRuntimeCapabilities,
  resetObservabilityRuntimeIdSequences,
  toCanonicalObservabilityCapabilities,
} from "./ports";

export {
  DEFAULT_OBSERVABILITY_RUNTIME_ADAPTER_ID,
  DEFAULT_OBSERVABILITY_RUNTIME_VERSION,
  DEFAULT_MOCK_OBSERVABILITY_RUNTIME_VERSION,
  DefaultObservabilityRuntimeAdapter,
  EnterpriseObservabilityRuntimeAdapter,
  MOCK_OBSERVABILITY_RUNTIME_ADAPTER_ID,
  MockObservabilityRuntimeAdapter,
  type DefaultObservabilityRuntimeAdapterOptions,
  type MockObservabilityRuntimeAdapterOptions,
} from "./adapters";

export {
  ObservabilityRuntimeFactory,
  createObservabilityRuntimeFactory,
  type ObservabilityRuntimeFactoryOptions,
} from "./factory";

export {
  BUILTIN_OBSERVABILITY_RUNTIME_PROVIDER_COUNT,
  ObservabilityRuntimeRegistry,
  createDefaultObservabilityRuntimeRegistry,
  type ObservabilityRuntimeRegistrySnapshot,
} from "./registry";

export {
  IN_MEMORY_OBSERVABILITY_RUNTIME_STORE_ID,
  InMemoryObservabilityRuntimeStore,
  type InMemoryObservabilityRuntimeStoreOptions,
  type StoredCanonicalObservabilityScope,
  type StoredCanonicalObservabilityEnvelope,
  type StoredCanonicalObservabilitySignal,
  type ObservabilityRuntimeStore,
} from "./store";

export {
  ObservabilityRuntimeProvider,
  createObservabilityRuntimePort,
  getObservabilityRuntimeFactory,
} from "./providers";

export {
  getObservabilityRuntimeHealthSummary,
  type ObservabilityRuntimeHealthSummary,
} from "./demo";

export {
  RuntimeObservabilityCollector,
  type OperationalActiveWorkers,
  type OperationalCounters,
  type OperationalDeadLetterStats,
  type OperationalHealthChecks,
  type OperationalPendingQueues,
  type OperationalRuntimeDiagnostics,
  type OperationalRuntimeStatus,
  type OperationalSchedulerStatus,
  type OperationalThroughput,
  type OperationalTimers,
  type RuntimeObservabilityCollectorOptions,
} from "./operational";

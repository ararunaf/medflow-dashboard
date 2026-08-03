/**
 * Modelos canônicos do Enterprise Observability Runtime — INF-09.
 *
 * Infraestrutura canônica estrutural de observabilidade futura.
 * Sem OpenTelemetry. Sem Application Insights. Sem Azure Monitor.
 * Sem Prometheus. Sem Grafana. Sem Elastic. Sem Datadog. Sem New Relic.
 * Sem Loki. Sem Jaeger. Sem logs/métricas/tracing reais.
 * Sem alertas reais. Sem dashboards reais. Sem telemetria HTTP.
 * Sem integrações externas. Sem Workers reais. Sem Scheduler real.
 * Sem HTTP. Sem operadoras/ANS/XML/OCR/Capture/IA.
 */

/** Status estrutural de ObservabilityScope / Signal / operação de Observability Runtime. */
export type CanonicalObservabilityStatus =
  | "pending"
  | "registered"
  | "unregistered"
  | "observed"
  | "released"
  | "listed"
  | "idle"
  | "failed"
  | "unknown"
  | (string & {});

/** Identidade canônica estrutural (opaca). */
export type CanonicalObservabilityIdentity = {
  kind: "canonical-observability-identity";
  scopeId?: string;
  scopeName?: string;
  signalId?: string;
  envelopeId?: string;
  correlationId?: string | null;
  sessionId?: string;
};

/** Provedor canônico declarado (estrutural). */
export type CanonicalObservabilityProvider = {
  kind: "canonical-observability-provider";
  providerId: string;
  adapterId?: string;
  vendor?: string;
  version?: string;
  label?: string;
};

/**
 * Metadata canônica de ObservabilityScope / Signal / Envelope.
 * Estrutural — sem semântica de operadora/contrato/tenant.
 */
export type CanonicalObservabilityMetadata = {
  kind: "canonical-observability-metadata";
  sessionId?: string;
  correlationId?: string | null;
  channel?: string;
  source?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/** Operação canônica do Observability Runtime. */
export type CanonicalObservabilityOperation =
  | "register"
  | "unregister"
  | "observe"
  | "release"
  | "list"
  | "stats"
  | "health"
  | "capabilities"
  | (string & {});

/**
 * ObservabilityScope canônico estrutural.
 * Representa a infraestrutura de ObservabilityScope — sem backend de observabilidade real.
 */
export type CanonicalObservabilityScope = {
  kind: "canonical-observability-scope";
  scopeId: string;
  scopeName: string;
  identity?: CanonicalObservabilityIdentity;
  metadata?: CanonicalObservabilityMetadata;
  status: CanonicalObservabilityStatus;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  /** Sempre false — nenhum backend de observabilidade real nesta fundação. */
  realObservabilityBackend: false;
  openTelemetryImplemented: false;
  applicationInsightsImplemented: false;
  azureMonitorImplemented: false;
  prometheusImplemented: false;
  grafanaImplemented: false;
  elasticImplemented: false;
  datadogImplemented: false;
  newRelicImplemented: false;
  lokiImplemented: false;
  jaegerImplemented: false;
  realLogsImplemented: false;
  realMetricsImplemented: false;
  realTracingImplemented: false;
  distributedTracingImplemented: false;
  realAlertsImplemented: false;
  realDashboardsImplemented: false;
  realTelemetryImplemented: false;
  realHealthMonitoringImplemented: false;
  realPerformanceMonitoringImplemented: false;
};

/**
 * Signal canônico estrutural (referência apenas — nunca emitido/telemetrado de fato).
 */
export type CanonicalObservabilitySignal = {
  kind: "canonical-observability-signal";
  signalId: string;
  scopeId?: string;
  identity?: CanonicalObservabilityIdentity;
  metadata?: CanonicalObservabilityMetadata;
  status: CanonicalObservabilityStatus;
  registeredAt: string;
  updatedAt: string;
  realObservabilityBackend: false;
  openTelemetryImplemented: false;
  applicationInsightsImplemented: false;
  realLogsImplemented: false;
  realMetricsImplemented: false;
  realTracingImplemented: false;
  realTelemetryImplemented: false;
};

/**
 * Envelope canônico estrutural (registro apenas — nunca despachado).
 */
export type CanonicalObservabilityEnvelope = {
  kind: "canonical-observability-envelope";
  envelopeId: string;
  scopeId: string;
  signalId?: string;
  identity?: CanonicalObservabilityIdentity;
  metadata?: CanonicalObservabilityMetadata;
  status: CanonicalObservabilityStatus;
  createdAt: string;
  updatedAt: string;
  realObservabilityBackend: false;
  openTelemetryImplemented: false;
  prometheusImplemented: false;
  realLogsImplemented: false;
  realTelemetryImplemented: false;
};

/**
 * Resultado canônico de operação de Observability Runtime (INF-09).
 * Contém apenas referência/estrutura canônica — nunca telemetria/logs/métricas reais.
 */
export type CanonicalObservabilityResult = {
  kind: "canonical-observability-result";
  ok: boolean;
  resultId: string;
  operation: CanonicalObservabilityOperation;
  scope?: CanonicalObservabilityScope;
  signal?: CanonicalObservabilitySignal;
  envelope?: CanonicalObservabilityEnvelope;
  identity?: CanonicalObservabilityIdentity;
  metadata?: CanonicalObservabilityMetadata;
  provider?: CanonicalObservabilityProvider;
  /** Sempre false — nenhum backend de observabilidade real. */
  realObservabilityBackend: false;
  openTelemetryImplemented: false;
  applicationInsightsImplemented: false;
  azureMonitorImplemented: false;
  prometheusImplemented: false;
  grafanaImplemented: false;
  elasticImplemented: false;
  datadogImplemented: false;
  newRelicImplemented: false;
  lokiImplemented: false;
  jaegerImplemented: false;
  realLogsImplemented: false;
  realMetricsImplemented: false;
  realTracingImplemented: false;
  distributedTracingImplemented: false;
  realAlertsImplemented: false;
  realDashboardsImplemented: false;
  realTelemetryImplemented: false;
  realHealthMonitoringImplemented: false;
  realPerformanceMonitoringImplemented: false;
  /** Sempre true — runtime estrutural pronto (sem backend de observabilidade real). */
  runtimeReady: true;
  status: CanonicalObservabilityStatus;
  messageText?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Estatísticas estruturais do Observability Runtime (in-process).
 */
export type CanonicalObservabilityStatistics = {
  kind: "canonical-observability-statistics";
  totalScopes: number;
  registeredScopes: number;
  activeScopes: number;
  releasedScopes: number;
  totalSignals: number;
  totalEnvelopes: number;
  realObservabilityBackendCount: 0;
  openTelemetryImplementedCount: 0;
  applicationInsightsImplementedCount: 0;
  azureMonitorImplementedCount: 0;
  prometheusImplementedCount: 0;
  grafanaImplementedCount: 0;
  elasticImplementedCount: 0;
  datadogImplementedCount: 0;
  newRelicImplementedCount: 0;
  lokiImplementedCount: 0;
  jaegerImplementedCount: 0;
  realLogsImplementedCount: 0;
  realMetricsImplementedCount: 0;
  realTracingImplementedCount: 0;
  distributedTracingImplementedCount: 0;
  realAlertsImplementedCount: 0;
  realDashboardsImplementedCount: 0;
  realTelemetryImplementedCount: 0;
  realHealthMonitoringImplementedCount: 0;
  realPerformanceMonitoringImplementedCount: 0;
};

/**
 * Saúde canônica do provedor Observability Runtime.
 */
export type CanonicalObservabilityHealth = {
  kind: "canonical-observability-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedScopeCount?: number;
  storedSignalCount?: number;
  storedEnvelopeCount?: number;
  queueRuntimeOk?: boolean;
  workerRuntimeOk?: boolean;
  schedulerRuntimeOk?: boolean;
  persistentQueueRuntimeOk?: boolean;
  tissRuntimeOk?: boolean;
  runtimeReady: true;
  realObservabilityBackend: false;
  openTelemetryImplemented: false;
  applicationInsightsImplemented: false;
  azureMonitorImplemented: false;
  prometheusImplemented: false;
  grafanaImplemented: false;
  elasticImplemented: false;
  datadogImplemented: false;
  newRelicImplemented: false;
  lokiImplemented: false;
  jaegerImplemented: false;
  realLogsImplemented: false;
  realMetricsImplemented: false;
  realTracingImplemented: false;
  distributedTracingImplemented: false;
  realAlertsImplemented: false;
  realDashboardsImplemented: false;
  realTelemetryImplemented: false;
  realHealthMonitoringImplemented: false;
  realPerformanceMonitoringImplemented: false;
};

/**
 * Capacidades canônicas declaradas do provedor Observability Runtime.
 */
export type CanonicalObservabilityCapabilities = {
  kind: "canonical-observability-capabilities";
  supportsRegister: boolean;
  supportsUnregister: boolean;
  supportsObserve: boolean;
  supportsRelease: boolean;
  supportsList: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalObservability: boolean;
  runtimeReady: true;
  realObservabilityBackend: false;
  openTelemetryImplemented: false;
  applicationInsightsImplemented: false;
  azureMonitorImplemented: false;
  prometheusImplemented: false;
  grafanaImplemented: false;
  elasticImplemented: false;
  datadogImplemented: false;
  newRelicImplemented: false;
  lokiImplemented: false;
  jaegerImplemented: false;
  realLogsImplemented: false;
  realMetricsImplemented: false;
  realTracingImplemented: false;
  distributedTracingImplemented: false;
  realAlertsImplemented: false;
  realDashboardsImplemented: false;
  realTelemetryImplemented: false;
  realHealthMonitoringImplemented: false;
  realPerformanceMonitoringImplemented: false;
  implementsOpenTelemetry: false;
  implementsApplicationInsights: false;
  implementsAzureMonitor: false;
  implementsPrometheus: false;
  implementsGrafana: false;
  implementsElastic: false;
  implementsDatadog: false;
  implementsNewRelic: false;
  implementsLoki: false;
  implementsJaeger: false;
  implementsRealLogs: false;
  implementsRealMetrics: false;
  implementsRealTracing: false;
  implementsDistributedTracing: false;
  implementsRealAlerts: false;
  implementsRealDashboards: false;
  implementsRealTelemetry: false;
  implementsRealHealthMonitoring: false;
  implementsRealPerformanceMonitoring: false;
  implementsRealObservabilityBackend: false;
  implementsHttp: false;
  implementsWebsocket: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsTissPattern: false;
};

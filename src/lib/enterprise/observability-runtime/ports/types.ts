/**
 * Tipos vendor-agnósticos do Enterprise Observability Runtime — INF-09 / OPER-INF-O.
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → ObservabilityRuntimePort
 *     → Adapter → Observability Runtime Store → Canonical Observability Result
 *     → (OPER-INF-O) coleta somente leitura via Ports existentes
 *
 * Sem backends de observabilidade reais. Sem OpenTelemetry/App Insights/Prometheus/Grafana.
 * Sem logs/métricas/tracing/alertas/dashboards reais.
 */
import type { QueueRuntimePort } from "../../queue-runtime/ports/queue-runtime-port";
import type { WorkerRuntimePort } from "../../worker-runtime/ports/worker-runtime-port";
import type { SchedulerRuntimePort } from "../../scheduler-runtime/ports/scheduler-runtime-port";
import type { PersistentQueueRuntimePort } from "../../persistent-queue-runtime/ports/persistent-queue-runtime-port";
import type { TISSRuntimePort } from "../../tiss-runtime/ports/tiss-runtime-port";
import type { ScalabilityRuntimePort } from "../../scalability-runtime/ports/scalability-runtime-port";
import type { OperationalRuntimeDiagnostics } from "../operational/types";
import type {
  CanonicalObservabilityScope,
  CanonicalObservabilityCapabilities,
  CanonicalObservabilityEnvelope,
  CanonicalObservabilityHealth,
  CanonicalObservabilitySignal,
  CanonicalObservabilityMetadata,
  CanonicalObservabilityResult,
  CanonicalObservabilityStatistics,
} from "./canonical";
import type { ObservabilityRuntimeCapabilities } from "./capabilities";

export type {
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
} from "./canonical";
export type { ObservabilityRuntimeCapabilities };

/** Provedores / mecanismos do Observability Runtime. */
export type ObservabilityRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry. */
export type ObservabilityRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado (NÃO é telemetria real). */
export type ObservabilityRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido (NÃO é logging real). */
export type ObservabilityRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: ObservabilityRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/** Resultado de health check. */
export type ObservabilityRuntimeHealth = CanonicalObservabilityHealth & {
  provider: ObservabilityRuntimeProviderId;
  status?: ObservabilityRuntimeStatus;
  /** OPER-INF-O — diagnóstico operacional Port-only (somente leitura). */
  operational?: OperationalRuntimeDiagnostics;
};

/** Capacidades do adapter no nível do Port. */
export type ObservabilityRuntimePortCapabilities = {
  provider: ObservabilityRuntimeProviderId;
  adapterId: string;
  engine: ObservabilityRuntimeCapabilities;
  canonical: CanonicalObservabilityCapabilities;
  supportsCanonicalObservability: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  usesQueueRuntimePort: boolean;
  usesWorkerRuntimePort: boolean;
  usesSchedulerRuntimePort: boolean;
  usesPersistentQueueRuntimePort: boolean;
  usesTISSRuntimePort: boolean;
  usesScalabilityRuntimePort: boolean;
  /** OPER-INF-O — coleta operacional somente leitura via Ports. */
  operationalPortCollection: boolean;
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

/** Metadados estáveis do provedor. */
export type ObservabilityRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
};

/** Info agregada retornada por providerInfo(). */
export type ObservabilityRuntimeInfo = {
  providerId: ObservabilityRuntimeProviderId;
  metadata: ObservabilityRuntimeProviderMetadata;
  status: ObservabilityRuntimeStatus;
  providerType: "OBSERVABILITY_RUNTIME";
  capabilities: ObservabilityRuntimeCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel). */
export type ObservabilityRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional. */
export type ObservabilityRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: ObservabilityRuntimeProviderId;
  telemetry: ObservabilityRuntimeTelemetry;
  logs?: readonly ObservabilityRuntimeStructuredLog[];
  simulated?: boolean;
};

export type RegisterObservabilityScopeInput = ObservabilityRuntimeOperationalControls & {
  scopeName?: string;
  scopeId?: string;
  correlationId?: string | null;
  metadata?: CanonicalObservabilityMetadata;
};

export type RegisterObservabilityScopeResult = ObservabilityRuntimeOperationEnvelope & {
  result?: CanonicalObservabilityResult;
  scope?: CanonicalObservabilityScope;
};

export type UnregisterObservabilityScopeInput = ObservabilityRuntimeOperationalControls & {
  scopeId: string;
};

export type UnregisterObservabilityScopeResult = ObservabilityRuntimeOperationEnvelope & {
  result?: CanonicalObservabilityResult;
  scope?: CanonicalObservabilityScope;
};

export type ObserveSignalInput = ObservabilityRuntimeOperationalControls & {
  scopeId?: string;
  scopeName?: string;
  signalId?: string;
  metadata?: CanonicalObservabilityMetadata;
};

export type ObserveSignalResult = ObservabilityRuntimeOperationEnvelope & {
  result?: CanonicalObservabilityResult;
  scope?: CanonicalObservabilityScope;
  /** Nome distinto de OperationEnvelope.message (texto). */
  observabilitySignal?: CanonicalObservabilitySignal;
  envelope?: CanonicalObservabilityEnvelope;
};

export type ReleaseSignalInput = ObservabilityRuntimeOperationalControls & {
  scopeId: string;
  signalId?: string;
};

export type ReleaseSignalResult = ObservabilityRuntimeOperationEnvelope & {
  result?: CanonicalObservabilityResult;
  scope?: CanonicalObservabilityScope;
  /** Nome distinto de OperationEnvelope.message (texto). */
  observabilitySignal?: CanonicalObservabilitySignal;
};

export type ListObservabilityScopesInput = ObservabilityRuntimeOperationalControls & {
  scopeId?: string;
  activeOnly?: boolean;
};

export type ListObservabilityScopesResult = ObservabilityRuntimeOperationEnvelope & {
  scopes?: readonly CanonicalObservabilityScope[];
  signals?: readonly CanonicalObservabilitySignal[];
  result?: CanonicalObservabilityResult;
};

export type ObservabilityStatsInput = ObservabilityRuntimeOperationalControls & {
  scopeId?: string;
};

export type ObservabilityStatsResult = ObservabilityRuntimeOperationEnvelope & {
  statistics?: CanonicalObservabilityStatistics;
  result?: CanonicalObservabilityResult;
  /** OPER-INF-O — métricas/diagnóstico operacional (somente leitura via Ports). */
  operational?: OperationalRuntimeDiagnostics;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * OPER-INF-O: Queue + Worker + Scheduler + Persistent Queue + TISS são consumidos
 * exclusivamente em modo SOMENTE LEITURA (stats / shape health) — sem mutação / sem regras.
 */
export type ObservabilityRuntimeEnterpriseDeps = {
  getQueueRuntimePort(): QueueRuntimePort;
  getWorkerRuntimePort(): WorkerRuntimePort;
  getSchedulerRuntimePort(): SchedulerRuntimePort;
  getPersistentQueueRuntimePort(): PersistentQueueRuntimePort;
  getTISSRuntimePort(): TISSRuntimePort;
  /** INF-10 — Scalability Runtime preparado (shape-check; sem consumo mutável). */
  getScalabilityRuntimePort?: () => ScalabilityRuntimePort;
};

/** Opções de resolução do ObservabilityRuntimePort. */
export type ObservabilityRuntimeOptions = {
  /**
   * Provedor desejado. Default da fundação: `enterprise` (INF-09).
   */
  provider?: ObservabilityRuntimeProviderId;
  enterpriseDeps?: ObservabilityRuntimeEnterpriseDeps;
};

/** Entrada de registro no ObservabilityRuntimeRegistry. */
export type ObservabilityRuntimeRegistration = {
  providerId: ObservabilityRuntimeProviderId;
  name: string;
  version: string;
  status: ObservabilityRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: ObservabilityRuntimeCapabilities;
  description?: string;
};

/**
 * ObservabilityRuntimeCapabilities — capacidades declarativas (INF-09).
 *
 * Apenas declaração estrutural. Sem backends de observabilidade reais.
 * Sem OpenTelemetry / Application Insights / Azure Monitor / Prometheus / Grafana.
 * Sem Elastic / Datadog / New Relic / Loki / Jaeger.
 * Sem logs / métricas / tracing / alertas / dashboards / telemetria reais.
 */

import type { CanonicalObservabilityCapabilities } from "./canonical";

export type ObservabilityRuntimeCapabilities = {
  supportsRegister?: boolean;
  supportsUnregister?: boolean;
  supportsObserve?: boolean;
  supportsRelease?: boolean;
  supportsList?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalObservability?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  usesQueueRuntimePort?: boolean;
  usesWorkerRuntimePort?: boolean;
  usesSchedulerRuntimePort?: boolean;
  usesPersistentQueueRuntimePort?: boolean;
  usesTISSRuntimePort?: boolean;
  usesScalabilityRuntimePort?: boolean;
  runtimeReady?: true;
  realObservabilityBackend?: false;
  openTelemetryImplemented?: false;
  applicationInsightsImplemented?: false;
  azureMonitorImplemented?: false;
  prometheusImplemented?: false;
  grafanaImplemented?: false;
  elasticImplemented?: false;
  datadogImplemented?: false;
  newRelicImplemented?: false;
  lokiImplemented?: false;
  jaegerImplemented?: false;
  realLogsImplemented?: false;
  realMetricsImplemented?: false;
  realTracingImplemented?: false;
  distributedTracingImplemented?: false;
  realAlertsImplemented?: false;
  realDashboardsImplemented?: false;
  realTelemetryImplemented?: false;
  realHealthMonitoringImplemented?: false;
  realPerformanceMonitoringImplemented?: false;
  implementsOpenTelemetry?: false;
  implementsApplicationInsights?: false;
  implementsAzureMonitor?: false;
  implementsPrometheus?: false;
  implementsGrafana?: false;
  implementsElastic?: false;
  implementsDatadog?: false;
  implementsNewRelic?: false;
  implementsLoki?: false;
  implementsJaeger?: false;
  implementsRealLogs?: false;
  implementsRealMetrics?: false;
  implementsRealTracing?: false;
  implementsDistributedTracing?: false;
  implementsRealAlerts?: false;
  implementsRealDashboards?: false;
  implementsRealTelemetry?: false;
  implementsRealHealthMonitoring?: false;
  implementsRealPerformanceMonitoring?: false;
  implementsRealObservabilityBackend?: false;
  implementsHttp?: false;
  implementsWebsocket?: false;
  knowsOperatorOrCooperative?: false;
  knowsContract?: false;
  knowsTenant?: false;
  knowsTissPattern?: false;
};

export function emptyObservabilityRuntimeCapabilities(): ObservabilityRuntimeCapabilities {
  return {};
}

export function defineObservabilityRuntimeCapabilities(
  capabilities: ObservabilityRuntimeCapabilities = {},
): ObservabilityRuntimeCapabilities {
  return { ...capabilities };
}

export const DEFAULT_OBSERVABILITY_RUNTIME_CAPABILITIES: ObservabilityRuntimeCapabilities = {
  supportsRegister: true,
  supportsUnregister: true,
  supportsObserve: true,
  supportsRelease: true,
  supportsList: true,
  supportsStats: true,
  supportsHealth: true,
  supportsCanonicalObservability: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  usesQueueRuntimePort: true,
  usesWorkerRuntimePort: true,
  usesSchedulerRuntimePort: true,
  usesPersistentQueueRuntimePort: true,
  usesTISSRuntimePort: true,
  usesScalabilityRuntimePort: true,
  runtimeReady: true,
  realObservabilityBackend: false,
  openTelemetryImplemented: false,
  applicationInsightsImplemented: false,
  azureMonitorImplemented: false,
  prometheusImplemented: false,
  grafanaImplemented: false,
  elasticImplemented: false,
  datadogImplemented: false,
  newRelicImplemented: false,
  lokiImplemented: false,
  jaegerImplemented: false,
  realLogsImplemented: false,
  realMetricsImplemented: false,
  realTracingImplemented: false,
  distributedTracingImplemented: false,
  realAlertsImplemented: false,
  realDashboardsImplemented: false,
  realTelemetryImplemented: false,
  realHealthMonitoringImplemented: false,
  realPerformanceMonitoringImplemented: false,
  implementsOpenTelemetry: false,
  implementsApplicationInsights: false,
  implementsAzureMonitor: false,
  implementsPrometheus: false,
  implementsGrafana: false,
  implementsElastic: false,
  implementsDatadog: false,
  implementsNewRelic: false,
  implementsLoki: false,
  implementsJaeger: false,
  implementsRealLogs: false,
  implementsRealMetrics: false,
  implementsRealTracing: false,
  implementsDistributedTracing: false,
  implementsRealAlerts: false,
  implementsRealDashboards: false,
  implementsRealTelemetry: false,
  implementsRealHealthMonitoring: false,
  implementsRealPerformanceMonitoring: false,
  implementsRealObservabilityBackend: false,
  implementsHttp: false,
  implementsWebsocket: false,
  knowsOperatorOrCooperative: false,
  knowsContract: false,
  knowsTenant: false,
  knowsTissPattern: false,
};

export const DEFAULT_MOCK_OBSERVABILITY_RUNTIME_CAPABILITIES: ObservabilityRuntimeCapabilities = {
  ...DEFAULT_OBSERVABILITY_RUNTIME_CAPABILITIES,
};

export function toCanonicalObservabilityCapabilities(
  capabilities: ObservabilityRuntimeCapabilities = DEFAULT_OBSERVABILITY_RUNTIME_CAPABILITIES,
): CanonicalObservabilityCapabilities {
  return {
    kind: "canonical-observability-capabilities",
    supportsRegister: capabilities.supportsRegister === true,
    supportsUnregister: capabilities.supportsUnregister === true,
    supportsObserve: capabilities.supportsObserve === true,
    supportsRelease: capabilities.supportsRelease === true,
    supportsList: capabilities.supportsList === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalObservability: capabilities.supportsCanonicalObservability === true,
    runtimeReady: true,
    realObservabilityBackend: false,
    openTelemetryImplemented: false,
    applicationInsightsImplemented: false,
    azureMonitorImplemented: false,
    prometheusImplemented: false,
    grafanaImplemented: false,
    elasticImplemented: false,
    datadogImplemented: false,
    newRelicImplemented: false,
    lokiImplemented: false,
    jaegerImplemented: false,
    realLogsImplemented: false,
    realMetricsImplemented: false,
    realTracingImplemented: false,
    distributedTracingImplemented: false,
    realAlertsImplemented: false,
    realDashboardsImplemented: false,
    realTelemetryImplemented: false,
    realHealthMonitoringImplemented: false,
    realPerformanceMonitoringImplemented: false,
    implementsOpenTelemetry: false,
    implementsApplicationInsights: false,
    implementsAzureMonitor: false,
    implementsPrometheus: false,
    implementsGrafana: false,
    implementsElastic: false,
    implementsDatadog: false,
    implementsNewRelic: false,
    implementsLoki: false,
    implementsJaeger: false,
    implementsRealLogs: false,
    implementsRealMetrics: false,
    implementsRealTracing: false,
    implementsDistributedTracing: false,
    implementsRealAlerts: false,
    implementsRealDashboards: false,
    implementsRealTelemetry: false,
    implementsRealHealthMonitoring: false,
    implementsRealPerformanceMonitoring: false,
    implementsRealObservabilityBackend: false,
    implementsHttp: false,
    implementsWebsocket: false,
    knowsOperatorOrCooperative: false,
    knowsContract: false,
    knowsTenant: false,
    knowsTissPattern: false,
  };
}

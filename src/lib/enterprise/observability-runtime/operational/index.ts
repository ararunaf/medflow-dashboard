/**
 * OPER-INF-O — motor operacional interno do Observability Runtime.
 *
 * Somente leitura via Ports existentes.
 * Sem dashboards / Grafana / Prometheus / OpenTelemetry / alertas / tracing.
 * Sem novos Ports / Gateways / Runtimes.
 */
export type {
  OperationalActiveWorkers,
  OperationalCounters,
  OperationalDeadLetterStats,
  OperationalHealthChecks,
  OperationalPendingQueues,
  OperationalRuntimeDiagnostics,
  OperationalRuntimeStatus,
  OperationalSchedulerStatus,
  OperationalThroughput,
  OperationalTimers,
} from "./types";

export {
  RuntimeObservabilityCollector,
  type RuntimeObservabilityCollectorOptions,
} from "./runtime-observability-collector";

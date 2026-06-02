export type {
  MonitorChannel,
  MonitorEnvironment,
  MonitorLevel,
  MonitorLogOptions,
  MonitorPayload,
  MonitorSink,
  NormalizedMonitorError,
} from "./types";

export { normalizeMonitorError, messageFromError } from "./normalize";
export { emitMonitor, registerMonitorSink } from "./emit";
export { bootstrapDefaultMonitorSinks } from "./sinks";
export { consoleMonitorSink } from "./sinks/console";

export { logRuntime } from "./channels/runtime";
export { logSsr, logSsrAndAudit, type SsrMonitorEvent } from "./channels/ssr";
export { logClient } from "./channels/client";
export { logAuth, logAuthAndAudit } from "./channels/auth";

export { initClientErrorMonitoring } from "./client-bootstrap";
export { initServerErrorMonitoring } from "./server-bootstrap";

export {
  MONITORING_REGISTRY,
  MONITORING_PILLAR_KEYS,
  type MonitorPillar,
  type MonitorTouchpoint,
  type MonitoringPillarKey,
} from "./registry";

export { createErrorTrackerSink, isErrorTrackingConfigured } from "./sinks/error-tracker";

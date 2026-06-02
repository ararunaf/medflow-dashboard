import { emitMonitor } from "../emit";
import { messageFromError, normalizeMonitorError } from "../normalize";
import type { MonitorLogOptions } from "../types";

export function logClient(event: string, options: MonitorLogOptions = {}): void {
  const { level = "error", err, message, metadata } = options;
  emitMonitor({
    channel: "client",
    level,
    event,
    message: message ?? messageFromError(err, event),
    error: normalizeMonitorError(err),
    metadata,
  });
}

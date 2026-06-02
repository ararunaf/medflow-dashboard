import { emitMonitor } from "../emit";
import { messageFromError, normalizeMonitorError } from "../normalize";
import type { MonitorLogOptions } from "../types";

export function logRuntime(event: string, options: MonitorLogOptions = {}): void {
  const { level = "error", err, message, metadata } = options;
  emitMonitor({
    channel: "runtime",
    level,
    event,
    message: message ?? messageFromError(err, event),
    error: normalizeMonitorError(err),
    metadata,
  });
}

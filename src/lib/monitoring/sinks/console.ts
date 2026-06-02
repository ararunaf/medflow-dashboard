import type { MonitorPayload, MonitorSink } from "../types";

const LOG_PREFIX = "[medflow_monitor]";

function levelMethod(level: MonitorPayload["level"]): "error" | "warn" | "info" | "debug" {
  switch (level) {
    case "error":
      return "error";
    case "warn":
      return "warn";
    case "info":
      return "info";
    default:
      return "debug";
  }
}

export const consoleMonitorSink: MonitorSink = (payload) => {
  const line = JSON.stringify({
    channel: payload.channel,
    level: payload.level,
    event: payload.event,
    message: payload.message,
    environment: payload.environment,
    timestamp: payload.timestamp,
    error: payload.error,
    metadata: payload.metadata,
  });

  const method = levelMethod(payload.level);
  console[method](LOG_PREFIX, line);
};

import type { MonitorPayload, MonitorSink } from "../types";

const LOG_PREFIX = "[medflow_error_tracking]";

function resolveErrorTrackingDsn(): string | undefined {
  const fromVite =
    typeof import.meta !== "undefined"
      ? (import.meta.env?.VITE_MEDFLOW_ERROR_TRACKING_DSN as string | undefined)
      : undefined;
  if (fromVite?.trim()) return fromVite.trim();

  const fromProcess =
    typeof process !== "undefined"
      ? process.env?.MEDFLOW_ERROR_TRACKING_DSN?.trim()
      : undefined;
  if (fromProcess) return fromProcess;

  return undefined;
}

/**
 * Sink opcional para error tracking externo (Sentry, Datadog, etc.).
 * Ativo apenas quando MEDFLOW_ERROR_TRACKING_DSN ou VITE_MEDFLOW_ERROR_TRACKING_DSN está definido.
 *
 * Hoje encaminha para console com prefixo dedicado; substitua o corpo por SDK do vendor.
 */
export function createErrorTrackerSink(): MonitorSink | null {
  const dsn = resolveErrorTrackingDsn();
  if (!dsn) return null;

  return (payload: MonitorPayload) => {
    if (payload.level !== "error" && payload.level !== "warn") return;

    const line = JSON.stringify({
      dsn_configured: true,
      channel: payload.channel,
      level: payload.level,
      event: payload.event,
      message: payload.message,
      environment: payload.environment,
      timestamp: payload.timestamp,
      error: payload.error,
      metadata: payload.metadata,
    });

    console.warn(LOG_PREFIX, line);
  };
}

export function isErrorTrackingConfigured(): boolean {
  return resolveErrorTrackingDsn() != null;
}

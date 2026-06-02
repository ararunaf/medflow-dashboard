/** Canais de monitoramento de erros e logs operacionais. */
export type MonitorChannel = "runtime" | "ssr" | "client" | "auth";

export type MonitorLevel = "debug" | "info" | "warn" | "error";

export type MonitorEnvironment = "server" | "client";

export type NormalizedMonitorError = {
  name: string;
  message: string;
  stack?: string;
};

export type MonitorPayload = {
  channel: MonitorChannel;
  level: MonitorLevel;
  /** Identificador estável do evento (ex.: ssr_catastrophic, query_mutation_error). */
  event: string;
  message: string;
  timestamp: string;
  environment: MonitorEnvironment;
  error?: NormalizedMonitorError;
  metadata?: Record<string, unknown>;
};

export type MonitorSink = (payload: MonitorPayload) => void;

export type MonitorLogOptions = {
  level?: MonitorLevel;
  err?: unknown;
  message?: string;
  metadata?: Record<string, unknown>;
};

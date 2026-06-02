import type { MonitorChannel } from "./types";

/** Ponto de instrumentação no código (arquivo relativo a src/). */
export type MonitorTouchpoint = {
  id: string;
  file: string;
  /** Símbolo ou trecho esperado no arquivo (validação estática). */
  marker: string;
  description: string;
};

export type MonitorPillar = {
  channel: MonitorChannel;
  /** API principal do canal. */
  logFn: string;
  /** Bootstrap ou entrada do runtime. */
  bootstrap?: string;
  events: readonly string[];
  touchpoints: readonly MonitorTouchpoint[];
};

/**
 * Manifesto canônico dos quatro pilares de monitoramento.
 * Usado por scripts/monitoring-validate.mjs e docs/MONITORING.md.
 */
export const MONITORING_REGISTRY = {
  runtime: {
    channel: "runtime",
    logFn: "logRuntime",
    bootstrap: "initServerErrorMonitoring",
    events: ["uncaught_exception"] as const,
    touchpoints: [
      {
        id: "error-capture",
        file: "lib/error-capture.ts",
        marker: "logRuntime",
        description: "Captura uncaught no worker/global e emparelha com SSR catastrófico",
      },
      {
        id: "error-capture-init",
        file: "lib/error-capture.ts",
        marker: "initServerErrorMonitoring",
        description: "Bootstrap de sinks no carregamento do worker",
      },
      {
        id: "server-import-capture",
        file: "server.ts",
        marker: "lib/error-capture",
        description: "Worker importa error-capture antes do handler",
      },
    ],
  },
  ssr: {
    channel: "ssr",
    logFn: "logSsrAndAudit",
    bootstrap: "initServerErrorMonitoring",
    events: ["ssr_catastrophic", "ssr_middleware_error", "ssr_worker_uncaught"] as const,
    touchpoints: [
      {
        id: "start-middleware",
        file: "start.ts",
        marker: "ssr_middleware_error",
        description: "Middleware TanStack Start — erros não-HTTP",
      },
      {
        id: "server-catastrophic",
        file: "server.ts",
        marker: "ssr_catastrophic",
        description: "Normalização de 500 h3 (HTTPError unhandled)",
      },
      {
        id: "server-uncaught",
        file: "server.ts",
        marker: "ssr_worker_uncaught",
        description: "Try/catch do fetch handler do worker",
      },
      {
        id: "ssr-channel",
        file: "lib/monitoring/channels/ssr.ts",
        marker: "writeSecurityAudit",
        description: "Bridge para security_audit_logs (server-only)",
      },
    ],
  },
  auth: {
    channel: "auth",
    logFn: "logAuthAndAudit",
    events: [] as const,
    touchpoints: [
      {
        id: "get-auth-context",
        file: "lib/auth/get-auth-context.ts",
        marker: "get_user_failed",
        description: "Falha supabase.auth.getUser no SSR",
      },
      {
        id: "server-login-rate-limit",
        file: "server.ts",
        marker: "login_page_rate_limited",
        description: "Rate limit da página /login",
      },
      {
        id: "query-client-auth",
        file: "lib/errors/create-query-client.ts",
        marker: "logAuth",
        description: "Erros de query/mutation classificados como auth",
      },
      {
        id: "auth-channel",
        file: "lib/monitoring/channels/auth.ts",
        marker: "writeSecurityAudit",
        description: "Persistência em security_audit_logs",
      },
    ],
  },
  errorTracking: {
    channel: "client" as MonitorChannel,
    logFn: "emitMonitor",
    bootstrap: "bootstrapDefaultMonitorSinks",
    events: [
      "window_error",
      "unhandled_rejection",
      "react_error_boundary",
      "route_error_component",
    ] as const,
    touchpoints: [
      {
        id: "client-bootstrap",
        file: "lib/monitoring/client-bootstrap.ts",
        marker: "unhandledrejection",
        description: "Listeners globais no browser",
      },
      {
        id: "root-init",
        file: "routes/__root.tsx",
        marker: "initClientErrorMonitoring",
        description: "Inicialização única no root",
      },
      {
        id: "error-boundary",
        file: "components/global-error-boundary.tsx",
        marker: "react_error_boundary",
        description: "React error boundary",
      },
      {
        id: "console-sink",
        file: "lib/monitoring/sinks/console.ts",
        marker: "[medflow_monitor]",
        description: "Sink padrão — JSON estruturado no console",
      },
      {
        id: "error-tracker-sink",
        file: "lib/monitoring/sinks/error-tracker.ts",
        marker: "createErrorTrackerSink",
        description: "Sink opcional para vendor (Sentry etc.) via DSN",
      },
    ],
  },
} as const satisfies Record<string, MonitorPillar>;

export type MonitoringPillarKey = keyof typeof MONITORING_REGISTRY;

export const MONITORING_PILLAR_KEYS = Object.keys(MONITORING_REGISTRY) as MonitoringPillarKey[];

/**
 * Server functions — observabilidade, heartbeat e export operacional.
 */
import { createServerFn } from "@tanstack/react-start";
import { ValidationError } from "@/lib/domain/operations/errors";
import {
  runMutation,
  runQuery,
  type MutationResult,
  type QueryResult,
} from "@/lib/server/fn-helpers";
import { requireObject, optionalString } from "@/lib/server/fn-helpers";
import { validatePublicEnv } from "@/lib/env/public-env-validation";
import { buildOperationalBackupBundle } from "@/lib/services/operational-backup/operational-backup-export-service";
import {
  insertOperationalError,
  insertOperationalLog,
} from "@/lib/services/operational-error/operational-error-service";
import type { OperationalErrorSource } from "@/lib/services/operational-error/operational-error-service";
import {
  listRecentHealthMetrics,
  listRecentOperationalErrors,
  listRecentOperationalLogs,
} from "@/lib/services/operational-monitoring/operational-monitoring-service";
import {
  measureSupabaseRoundTripMs,
  recordOperationalHealthMetric,
  runOperationalHealthChecks,
} from "@/lib/services/operational-health/operational-health-service";

export type OperationalMonitoringBundle = {
  health: Awaited<ReturnType<typeof runOperationalHealthChecks>>;
  errors: Awaited<ReturnType<typeof listRecentOperationalErrors>>;
  logs: Awaited<ReturnType<typeof listRecentOperationalLogs>>;
  metrics: Awaited<ReturnType<typeof listRecentHealthMetrics>>;
  publicEnv: ReturnType<typeof validatePublicEnv>;
};

export const getOperationalMonitoringBundleFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<QueryResult<OperationalMonitoringBundle>> => {
    return runQuery(async (ctx) => {
      const health = await runOperationalHealthChecks(ctx);
      const [errors, logs, metrics] = await Promise.all([
        listRecentOperationalErrors(ctx, 40),
        listRecentOperationalLogs(ctx, 25),
        listRecentHealthMetrics(ctx, 20),
      ]);
      return {
        health,
        errors,
        logs,
        metrics,
        publicEnv: validatePublicEnv(),
      };
    });
  },
);

export const recordOperationalHeartbeatFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    if (raw == null) return {};
    if (typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, never>;
    return {};
  })
  .handler(async (): Promise<MutationResult<{ recorded: true }>> => {
    return runMutation(async (ctx) => {
      const ms = await measureSupabaseRoundTripMs(ctx);
      await recordOperationalHealthMetric(ctx, {
        metricName: "heartbeat",
        metricValue: ms,
        details: { path: "operational_heartbeat" },
      });
      await insertOperationalLog(ctx, {
        level: "info",
        category: "heartbeat",
        message: "Heartbeat operacional registrado.",
        metadata: { supabase_round_trip_ms: ms },
      });
      return { recorded: true as const };
    });
  });

const ERROR_SOURCES = new Set<string>([
  "export",
  "reconciliation",
  "closing",
  "session",
  "upload",
  "client",
  "server",
  "supabase",
  "unknown",
]);

export const reportOperationalIncidentFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw);
    const kind = o.kind;
    if (kind !== "error" && kind !== "log") {
      throw new ValidationError("kind deve ser error ou log.", { field: "kind" });
    }
    if (kind === "error") {
      const source = (optionalString(o.source, "source") ?? "unknown") as OperationalErrorSource;
      if (!ERROR_SOURCES.has(source)) {
        throw new ValidationError("source inválida.", { field: "source" });
      }
      const sev = optionalString(o.severity, "severity") ?? "operational";
      if (sev !== "operational" && sev !== "critical") {
        throw new ValidationError("severity inválida.", { field: "severity" });
      }
      return {
        kind: "error" as const,
        severity: sev as "operational" | "critical",
        source,
        errorCode: optionalString(o.errorCode, "errorCode"),
        message: optionalString(o.message, "message") ?? "Erro operacional",
        detail: optionalString(o.detail, "detail"),
        stackSnippet: optionalString(o.stackSnippet, "stackSnippet"),
      };
    }
    const level = optionalString(o.level, "level") ?? "info";
    if (level !== "info" && level !== "warning" && level !== "error") {
      throw new ValidationError("level inválido.", { field: "level" });
    }
    return {
      kind: "log" as const,
      level: level as "info" | "warning" | "error",
      category: optionalString(o.category, "category") ?? "client",
      message: optionalString(o.message, "message") ?? "Evento operacional",
    };
  })
  .handler(async ({ data }): Promise<MutationResult<{ id: string | null }>> => {
    return runMutation(async (ctx) => {
      if (data.kind === "error") {
        const r = await insertOperationalError(ctx, {
          severity: data.severity,
          source: data.source,
          errorCode: data.errorCode ?? null,
          message: data.message,
          detail: data.detail ?? null,
          stackSnippet: data.stackSnippet ?? null,
        });
        return { id: r?.id ?? null };
      }
      const r = await insertOperationalLog(ctx, {
        level: data.level,
        category: data.category,
        message: data.message,
      });
      return { id: r?.id ?? null };
    });
  });

export const exportOperationalBackupBundleFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<QueryResult<Awaited<ReturnType<typeof buildOperationalBackupBundle>>>> => {
    return runQuery((ctx) => buildOperationalBackupBundle(ctx));
  },
);

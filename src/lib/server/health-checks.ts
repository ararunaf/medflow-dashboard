/**
 * Health checks HTTP — Supabase connectivity, Auth (GoTrue) e Postgres (PostgREST).
 * Server-only — usado pelo worker em src/server.ts.
 */
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { validatePublicEnv } from "@/lib/env/public-env-validation";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { getAdminSupabase } from "./supabase-admin";

export type HealthStatus = "ok" | "degraded" | "error";

export type HealthCheckDetail = {
  status: HealthStatus;
  ok: boolean;
  label: string;
  detail: string;
  latencyMs?: number;
};

export type HealthPayload = {
  status: HealthStatus;
  timestamp: string;
  service: "medicflow-ai";
  checks: Record<string, HealthCheckDetail>;
};

const HEALTH_PATHS = new Set(["/health", "/health/db", "/health/auth"]);

export function isHealthPath(pathname: string): boolean {
  return HEALTH_PATHS.has(pathname);
}

function nowIso(): string {
  return new Date().toISOString();
}

function aggregateStatus(checks: HealthCheckDetail[]): HealthStatus {
  if (checks.some((c) => c.status === "error")) return "error";
  if (checks.some((c) => c.status === "degraded")) return "degraded";
  return "ok";
}

function httpStatusFromHealth(status: HealthStatus): number {
  return status === "ok" ? 200 : 503;
}

async function timed<T>(fn: () => Promise<T>): Promise<{ ms: number; value: T }> {
  const start = typeof performance !== "undefined" ? performance.now() : Date.now();
  const value = await fn();
  const end = typeof performance !== "undefined" ? performance.now() : Date.now();
  return { ms: Math.max(0, Math.round(end - start)), value };
}

function checkSupabaseConfig(): HealthCheckDetail {
  const env = validatePublicEnv();
  if (!env.supabaseConfigured) {
    return {
      status: "degraded",
      ok: false,
      label: "Supabase (configuração)",
      detail: "VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY ausentes.",
    };
  }
  return {
    status: "ok",
    ok: true,
    label: "Supabase (configuração)",
    detail: "URL e anon key presentes no ambiente.",
  };
}

/** GoTrue — GET /auth/v1/health */
export async function checkAuthService(): Promise<HealthCheckDetail> {
  const cfg = getSupabasePublicConfig();
  if (!cfg) {
    return {
      status: "degraded",
      ok: false,
      label: "Auth (GoTrue)",
      detail: "Supabase não configurado — impossível validar o serviço de auth.",
    };
  }

  const { ms, value } = await timed(async () => {
    try {
      const healthUrl = new URL("/auth/v1/health", cfg.url).toString();
      const res = await fetch(healthUrl, {
        method: "GET",
        headers: {
          apikey: cfg.anonKey,
          Authorization: `Bearer ${cfg.anonKey}`,
        },
        signal: AbortSignal.timeout(8_000),
      });
      if (!res.ok) {
        return {
          ok: false as const,
          detail: `GoTrue respondeu HTTP ${res.status}.`,
        };
      }
      let body: unknown;
      try {
        body = await res.json();
      } catch {
        return { ok: true as const, detail: "GoTrue acessível (resposta não-JSON)." };
      }
      const name =
        body && typeof body === "object" && "name" in body
          ? String((body as { name?: unknown }).name)
          : "GoTrue";
      return { ok: true as const, detail: `Serviço de auth ativo (${name}).` };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false as const, detail: `GoTrue inacessível: ${msg}.` };
    }
  });

  if (!value.ok) {
    return {
      status: "error",
      ok: false,
      label: "Auth (GoTrue)",
      detail: value.detail,
      latencyMs: ms,
    };
  }
  return {
    status: "ok",
    ok: true,
    label: "Auth (GoTrue)",
    detail: value.detail,
    latencyMs: ms,
  };
}

/** Postgres via PostgREST — leitura leve com service role ou anon. */
export async function checkDatabase(): Promise<HealthCheckDetail> {
  const cfg = getSupabasePublicConfig();
  if (!cfg) {
    return {
      status: "degraded",
      ok: false,
      label: "Database (Postgres)",
      detail: "Supabase não configurado — impossível validar o banco.",
    };
  }

  const { ms, value } = await timed(async () => {
    const admin = getAdminSupabase();
    if (admin) {
      const { error } = await admin.from("profiles").select("id", { head: true, count: "exact" });
      if (error) {
        return { ok: false as const, detail: `Consulta admin falhou: ${error.message}` };
      }
      return { ok: true as const, detail: "Postgres respondeu (consulta admin em profiles)." };
    }

    const anon = createClient<Database>(cfg.url, cfg.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await anon
      .from("tenant_settings")
      .select("tenant_id", { head: true, count: "exact" });
    if (error) {
      return {
        ok: false as const,
        detail: `Consulta anon falhou: ${error.message}. Defina SUPABASE_SERVICE_ROLE_KEY para probe com service role.`,
      };
    }
    return { ok: true as const, detail: "Postgres respondeu (consulta anon em tenant_settings)." };
  });

  if (!value.ok) {
    return {
      status: "error",
      ok: false,
      label: "Database (Postgres)",
      detail: value.detail,
      latencyMs: ms,
    };
  }
  return {
    status: "ok",
    ok: true,
    label: "Database (Postgres)",
    detail: value.detail,
    latencyMs: ms,
  };
}

async function buildFullHealth(): Promise<HealthPayload> {
  const config = checkSupabaseConfig();
  const [database, auth] = await Promise.all([checkDatabase(), checkAuthService()]);
  const checks = { config, database, auth };
  const list = Object.values(checks);
  return {
    status: aggregateStatus(list),
    timestamp: nowIso(),
    service: "medicflow-ai",
    checks,
  };
}

async function buildScopedHealth(scope: "db" | "auth"): Promise<HealthPayload> {
  const config = checkSupabaseConfig();
  const database = scope === "db" ? await checkDatabase() : undefined;
  const auth = scope === "auth" ? await checkAuthService() : undefined;
  const checks: Record<string, HealthCheckDetail> = { config };
  if (database) checks.database = database;
  if (auth) checks.auth = auth;
  const status = aggregateStatus([
    config,
    ...(database ? [database] : []),
    ...(auth ? [auth] : []),
  ]);
  return {
    status,
    timestamp: nowIso(),
    service: "medicflow-ai",
    checks,
  };
}

export async function resolveHealthResponse(pathname: string): Promise<Response> {
  let payload: HealthPayload;
  if (pathname === "/health/db") {
    payload = await buildScopedHealth("db");
  } else if (pathname === "/health/auth") {
    payload = await buildScopedHealth("auth");
  } else {
    payload = await buildFullHealth();
  }

  return new Response(JSON.stringify(payload, null, 2), {
    status: httpStatusFromHealth(payload.status),
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, no-cache, must-revalidate",
    },
  });
}

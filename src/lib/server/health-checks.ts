/**
 * Health checks HTTP — Supabase connectivity, Auth (GoTrue) e Postgres (PostgREST).
 * Server-only — usado pelo worker em src/server.ts.
 *
 * `/health` (raso, público) só confirma presença de configuração + um
 * round-trip básico de DB/Auth — não teria pego nenhum dos incidentes
 * reais desta sprint (chave de criptografia inválida, bucket rejeitando
 * o MIME type real, endpoint_url do cron desatualizado, anon key
 * rotacionada). `/health/deep` (protegido por CAPTURE_PIPELINE_WORKER_SECRET,
 * o mesmo segredo que já autentica o pg_cron) testa essas coisas de
 * verdade — valor funciona, não só "está presente".
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { validatePublicEnv } from "@/lib/env/public-env-validation";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { resolveAzureDocumentIntelligenceConfig } from "@/lib/enterprise/ocr-provider/adapters/azure-document-intelligence-adapter";
import {
  decryptStorageBytes,
  encryptStorageBytes,
  isStorageEncryptionConfigured,
} from "@/lib/security/storage-encryption";
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

const HEALTH_PATHS = new Set(["/health", "/health/db", "/health/auth", "/health/deep"]);

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

/** Bucket precisa existir E aceitar os MIME types que o pipeline realmente
 * envia — "existe" não bastou: o bucket rejeitou application/json e
 * application/octet-stream silenciosamente por semanas (achado real). */
async function checkStorageBucket(): Promise<HealthCheckDetail> {
  const admin = getAdminSupabase();
  if (!admin) {
    return {
      status: "error",
      ok: false,
      label: "Storage (bucket clinical-documents)",
      detail: "SUPABASE_SERVICE_ROLE_KEY ausente — impossível verificar o bucket.",
    };
  }

  const { ms, value } = await timed(async () => {
    const { data, error } = await admin.storage.getBucket("clinical-documents");
    if (error || !data) {
      return {
        ok: false as const,
        detail: `Bucket clinical-documents inacessível: ${error?.message ?? "não encontrado"}.`,
      };
    }
    const allowed = data.allowed_mime_types ?? [];
    const required = ["application/octet-stream", "application/pdf"];
    const missing = required.filter((mime) => !allowed.includes(mime));
    if (missing.length > 0) {
      return {
        ok: false as const,
        detail: `Bucket não aceita: ${missing.join(", ")} — artefatos cifrados/documentos originais vão falhar ao gravar. Allowlist atual: ${allowed.join(", ") || "(vazia)"}.`,
      };
    }
    return {
      ok: true as const,
      detail: `Bucket aceita os MIME types necessários (${allowed.join(", ")}).`,
    };
  });

  return {
    status: value.ok ? "ok" : "error",
    ok: value.ok,
    label: "Storage (bucket clinical-documents)",
    detail: value.detail,
    latencyMs: ms,
  };
}

/** Chave configurada não basta — precisa decodificar E fazer um round-trip
 * de verdade (achado real: chave "configurada" que não decodificava para
 * 32 bytes, 3 vezes seguidas, por espaço/quebra de linha colados). */
async function checkStorageEncryption(): Promise<HealthCheckDetail> {
  if (!isStorageEncryptionConfigured()) {
    return {
      status: "error",
      ok: false,
      label: "Criptografia de storage (SEC-PII-02)",
      detail:
        "MEDFLOW_STORAGE_ENCRYPTION_KEY não configurada — uploads de artefatos sensíveis vão falhar (fail-closed).",
    };
  }

  const { ms, value } = await timed(async () => {
    try {
      const plaintext = new TextEncoder().encode(`health-check-${Date.now()}`);
      const encrypted = await encryptStorageBytes(plaintext);
      const decrypted = await decryptStorageBytes(encrypted);
      const roundTripOk =
        decrypted.length === plaintext.length && decrypted.every((b, i) => b === plaintext[i]);
      return roundTripOk
        ? { ok: true as const, detail: "Chave válida — round-trip de criptografia confirmado." }
        : { ok: false as const, detail: "Round-trip falhou (decriptado não bate com o original)." };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false as const, detail: `Chave inválida: ${msg}` };
    }
  });

  return {
    status: value.ok ? "ok" : "error",
    ok: value.ok,
    label: "Criptografia de storage (SEC-PII-02)",
    detail: value.detail,
    latencyMs: ms,
  };
}

/** "Configurado" não basta — endpoint_url é mantido manualmente e já
 * ficou desatualizado silenciosamente (achado real: pg_cron disparando
 * certinho todo minuto, sempre contra um domínio que não existia mais). */
async function checkCapturePipelineCron(currentHost: string | null): Promise<HealthCheckDetail> {
  const admin = getAdminSupabase();
  if (!admin) {
    return {
      status: "degraded",
      ok: false,
      label: "pg_cron do pipeline de captura",
      detail: "SUPABASE_SERVICE_ROLE_KEY ausente — impossível verificar a config do cron.",
    };
  }

  const { ms, value } = await timed(async () => {
    const raw = admin as unknown as SupabaseClient;
    const { data, error } = await raw
      .from("capture_pipeline_worker_config")
      .select("enabled, endpoint_url")
      .eq("id", true)
      .maybeSingle<{ enabled: boolean; endpoint_url: string | null }>();

    if (error) {
      return { ok: false as const, detail: `Consulta falhou: ${error.message}` };
    }
    if (!data || !data.enabled) {
      return {
        ok: false as const,
        detail:
          "Cron desativado (enabled=false) — jobs da fila de captura não são processados automaticamente.",
      };
    }
    if (!data.endpoint_url) {
      return { ok: false as const, detail: "enabled=true mas endpoint_url não configurado." };
    }
    if (currentHost) {
      let endpointHost: string | null = null;
      try {
        endpointHost = new URL(data.endpoint_url).host;
      } catch {
        return {
          ok: false as const,
          detail: `endpoint_url não é uma URL válida: ${data.endpoint_url}`,
        };
      }
      if (endpointHost !== currentHost) {
        return {
          ok: false as const,
          detail: `endpoint_url aponta para "${endpointHost}", mas este deploy responde em "${currentHost}" — cron está chamando o domínio errado (silenciosamente, sem erro visível em nenhum outro lugar).`,
        };
      }
    }
    return {
      ok: true as const,
      detail: `Cron ativo, endpoint_url consistente com este deploy (${data.endpoint_url}).`,
    };
  });

  return {
    status: value.ok ? "ok" : "error",
    ok: value.ok,
    label: "pg_cron do pipeline de captura",
    detail: value.detail,
    latencyMs: ms,
  };
}

function checkAzureOcr(): HealthCheckDetail {
  const cfg = resolveAzureDocumentIntelligenceConfig();
  if (!cfg) {
    return {
      status: "degraded",
      ok: false,
      label: "Azure Document Intelligence",
      detail: "Endpoint/chave ausentes — OCR real não vai funcionar (fallback nunca implementado).",
    };
  }
  return {
    status: "ok",
    ok: true,
    label: "Azure Document Intelligence",
    detail: "Endpoint e chave presentes.",
  };
}

/** Só presença — validar o valor exigiria uma chamada real e paga a cada
 * hit deste endpoint, custo desproporcional para um health-check. */
function checkRequiredSecretsPresence(): HealthCheckDetail {
  const required = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "MEDFLOW_AUDIT_HASH_SALT",
    "CAPTURE_PIPELINE_WORKER_SECRET",
    "MEDFLOW_OPENAI_API_KEY",
  ];
  const missing = required.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) {
    return {
      status: missing.includes("SUPABASE_SERVICE_ROLE_KEY") ? "error" : "degraded",
      ok: false,
      label: "Segredos obrigatórios (presença)",
      detail: `Ausentes: ${missing.join(", ")}.`,
    };
  }
  return {
    status: "ok",
    ok: true,
    label: "Segredos obrigatórios (presença)",
    detail: "Todos presentes (valor não verificado aqui — ver checks específicos).",
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

async function buildDeepHealth(currentHost: string | null): Promise<HealthPayload> {
  const config = checkSupabaseConfig();
  const secrets = checkRequiredSecretsPresence();
  const [database, auth, storageBucket, storageEncryption, cron] = await Promise.all([
    checkDatabase(),
    checkAuthService(),
    checkStorageBucket(),
    checkStorageEncryption(),
    checkCapturePipelineCron(currentHost),
  ]);
  const azureOcr = checkAzureOcr();
  const checks = {
    config,
    secrets,
    database,
    auth,
    storageBucket,
    storageEncryption,
    cron,
    azureOcr,
  };
  return {
    status: aggregateStatus(Object.values(checks)),
    timestamp: nowIso(),
    service: "medicflow-ai",
    checks,
  };
}

/**
 * `/health/deep` exige o mesmo segredo que já autentica o pg_cron
 * (`x-capture-worker-secret`) — não é público como os demais, porque
 * revela detalhes de configuração (quais segredos faltam, allowlist do
 * bucket, host esperado pelo cron) que não devem ficar expostos a
 * qualquer um que bata na URL.
 */
export async function resolveHealthResponse(
  pathname: string,
  request?: Request,
): Promise<Response> {
  let payload: HealthPayload;
  if (pathname === "/health/deep") {
    const provided = request?.headers.get("x-capture-worker-secret");
    const expected = process.env.CAPTURE_PIPELINE_WORKER_SECRET;
    if (!expected || !provided || provided !== expected) {
      return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }
    const currentHost = request ? new URL(request.url).host : null;
    payload = await buildDeepHealth(currentHost);
  } else if (pathname === "/health/db") {
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

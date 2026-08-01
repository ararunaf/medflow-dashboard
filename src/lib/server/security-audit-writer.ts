/**
 * Persistencia de eventos de seguranca (auth, login, sessao, SSR, tenant).
 * Server-only — requer SUPABASE_SERVICE_ROLE_KEY para gravar no Postgres.
 */
import type { Json } from "@/lib/database.types";
import { clampMessage } from "@/lib/services/resilience/resilience-service";
import { hashAuditEmail, hashAuditIp } from "@/lib/security/security-audit-hash";
import type { SecurityAuditInput } from "@/lib/security/security-audit-types";
import { getAdminSupabase } from "./supabase-admin";

const METADATA_MAX_KEYS = 24;

function clampMetadata(meta: Record<string, unknown>): Json {
  const entries = Object.entries(meta).slice(0, METADATA_MAX_KEYS);
  const out: Record<string, Json | undefined> = {};
  for (const [k, v] of entries) {
    if (k.length > 64) continue;
    if (typeof v === "string" && v.length > 256) {
      out[k] = `${v.slice(0, 255)}…`;
    } else if (typeof v === "number" || typeof v === "boolean" || v === null) {
      out[k] = v;
    } else if (typeof v === "string") {
      out[k] = v;
    }
  }
  return out as Json;
}

function consoleAuditLine(payload: Record<string, unknown>): void {
  console.info("[security_audit]", JSON.stringify(payload));
}

/** Grava evento de auditoria (best-effort; nunca lanca para o caller). */
export async function writeSecurityAudit(input: SecurityAuditInput): Promise<void> {
  const [emailHash, ipHash] = await Promise.all([
    hashAuditEmail(input.email),
    hashAuditIp(input.ip),
  ]);

  const row = {
    event_category: input.category,
    event_type: input.eventType,
    outcome: input.outcome,
    tenant_id: input.tenantId ?? null,
    profile_id: input.profileId ?? null,
    email_hash: emailHash,
    ip_hash: ipHash,
    message: input.message ? clampMessage(input.message, 512) : null,
    metadata: clampMetadata(input.metadata ?? {}),
  };

  const consolePayload = {
    category: row.event_category,
    type: row.event_type,
    outcome: row.outcome,
    tenant_id: row.tenant_id,
    profile_id: row.profile_id,
    message: row.message,
    metadata: row.metadata,
  };

  const admin = getAdminSupabase();
  if (!admin) {
    consoleAuditLine({ ...consolePayload, persisted: false });
    return;
  }

  const { error } = await admin.from("security_audit_logs").insert(row);
  if (error) {
    console.warn("[security_audit] insert failed:", error.message);
    consoleAuditLine({ ...consolePayload, persisted: false });
    return;
  }

  const isDev = typeof import.meta !== "undefined" && import.meta.env?.DEV === true;
  if (isDev || import.meta.env?.VITE_MEDFLOW_DEBUG === "1") {
    consoleAuditLine({ ...consolePayload, persisted: true });
  }
}

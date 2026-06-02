import { getSupabasePublicConfig } from "@/lib/supabase/config";

function resolveAuditPepper(): string {
  const fromEnv =
    (typeof process !== "undefined" && process.env?.MEDFLOW_AUDIT_HASH_SALT) ||
    (typeof process !== "undefined" && process.env?.SUPABASE_SERVICE_ROLE_KEY);
  if (typeof fromEnv === "string" && fromEnv.length > 0) {
    return fromEnv;
  }
  return getSupabasePublicConfig()?.url ?? "medflow-audit";
}

async function digestHex(value: string): Promise<string> {
  const pepper = resolveAuditPepper();
  const data = new TextEncoder().encode(`${pepper}:${value}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashAuditEmail(email: string | null | undefined): Promise<string | null> {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return null;
  return digestHex(`email:${normalized}`);
}

export async function hashAuditIp(ip: string | null | undefined): Promise<string | null> {
  const trimmed = ip?.trim();
  if (!trimmed || trimmed === "unknown") return null;
  return digestHex(`ip:${trimmed}`);
}

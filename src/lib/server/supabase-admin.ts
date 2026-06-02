/**
 * Cliente Supabase com service role — somente servidor (insercao em security_audit_logs).
 * Server-only — protegido pelo importProtection em vite.config.ts.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

let adminClient: SupabaseClient<Database> | null | undefined;

function resolveServiceRoleKey(): string | null {
  const key =
    (typeof process !== "undefined" && process.env?.SUPABASE_SERVICE_ROLE_KEY) || null;
  return typeof key === "string" && key.length > 0 ? key : null;
}

/** Retorna cliente admin ou null se SUPABASE_SERVICE_ROLE_KEY nao estiver configurada. */
export function getAdminSupabase(): SupabaseClient<Database> | null {
  if (adminClient !== undefined) {
    return adminClient;
  }
  const cfg = getSupabasePublicConfig();
  const serviceKey = resolveServiceRoleKey();
  if (!cfg || !serviceKey) {
    adminClient = null;
    return null;
  }
  adminClient = createClient<Database>(cfg.url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

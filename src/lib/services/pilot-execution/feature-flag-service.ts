import { assertCan } from "@/lib/auth/rbac";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { DEFAULT_PILOT_FEATURE_FLAGS } from "./pilot-execution-types";

export async function listPilotFeatureFlags(ctx: ServiceCtx) {
  const { data, error } = await ctx.client
    .from("pilot_feature_flags")
    .select("id, flag_key, enabled, description, updated_at")
    .eq("tenant_id", ctx.tenantId)
    .order("flag_key", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Garante flags padrão do piloto — idempotente, só admins escrevem novas linhas. */
export async function ensureDefaultPilotFeatureFlags(ctx: ServiceCtx) {
  assertCan(ctx.role, "tenant_settings:write");
  const existing = await listPilotFeatureFlags(ctx);
  const keys = new Set(existing.map((f) => f.flag_key));
  const toInsert = DEFAULT_PILOT_FEATURE_FLAGS.filter((d) => !keys.has(d.flag_key)).map((d) => ({
    tenant_id: ctx.tenantId,
    flag_key: d.flag_key,
    enabled: d.enabled,
    description: d.description,
    updated_by_profile_id: ctx.actorProfileId,
  }));
  if (toInsert.length === 0) return existing;
  const { error } = await ctx.client.from("pilot_feature_flags").insert(toInsert);
  if (error) throw error;
  return listPilotFeatureFlags(ctx);
}

export async function setPilotFeatureFlag(
  ctx: ServiceCtx,
  flagKey: string,
  enabled: boolean,
): Promise<{ flag_key: string; enabled: boolean }> {
  assertCan(ctx.role, "tenant_settings:write");
  const key = flagKey.slice(0, 128);
  const { data, error } = await ctx.client
    .from("pilot_feature_flags")
    .upsert(
      {
        tenant_id: ctx.tenantId,
        flag_key: key,
        enabled,
        updated_by_profile_id: ctx.actorProfileId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id,flag_key" },
    )
    .select("flag_key, enabled")
    .single();
  if (error) throw error;
  return data;
}

export function isPilotFlagEnabled(
  flags: { flag_key: string; enabled: boolean }[],
  key: string,
  fallback = true,
): boolean {
  const row = flags.find((f) => f.flag_key === key);
  return row ? row.enabled : fallback;
}

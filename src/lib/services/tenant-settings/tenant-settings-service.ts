import { assertCan } from "@/lib/auth/rbac";
import { mapPostgresError, ValidationError } from "@/lib/domain/operations/errors";
import type { Database } from "@/lib/database.types";
import type { ServiceCtx } from "@/lib/services/operations/types";

export type TenantSettingsRow = Database["public"]["Tables"]["tenant_settings"]["Row"];
export type TenantSettingsUpdate = Database["public"]["Tables"]["tenant_settings"]["Update"];

const HEX = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

export function normalizeHexColor(raw: string | undefined | null, fallback: string): string {
  const s = (raw ?? "").trim();
  if (!HEX.test(s)) return fallback;
  if (s.length === 4) {
    const r = s[1]!,
      g = s[2]!,
      b = s[3]!;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return s.toLowerCase();
}

export async function getTenantSettings(ctx: ServiceCtx): Promise<TenantSettingsRow | null> {
  assertCan(ctx.role, "tenant_settings:read");
  const { data, error } = await ctx.client
    .from("tenant_settings")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  if (error) throw mapPostgresError(error);
  return (data ?? null) as TenantSettingsRow | null;
}

export async function upsertTenantSettings(
  ctx: ServiceCtx,
  patch: Omit<TenantSettingsUpdate, "tenant_id" | "created_at">,
): Promise<TenantSettingsRow> {
  assertCan(ctx.role, "tenant_settings:write");
  const current = await getTenantSettings(ctx);
  const primary = normalizeHexColor(
    patch.primary_color !== undefined
      ? (patch.primary_color ?? undefined)
      : (current?.primary_color ?? undefined),
    "#1e3a5f",
  );
  const secondary = normalizeHexColor(
    patch.secondary_color !== undefined
      ? (patch.secondary_color ?? undefined)
      : (current?.secondary_color ?? undefined),
    "#0d9488",
  );

  const merged = {
    institution_name:
      patch.institution_name !== undefined
        ? String(patch.institution_name).trim()
        : current?.institution_name?.trim() || "Instituição",
    primary_color: primary,
    secondary_color: secondary,
    logo_url: patch.logo_url !== undefined ? patch.logo_url : (current?.logo_url ?? null),
    favicon_url:
      patch.favicon_url !== undefined ? patch.favicon_url : (current?.favicon_url ?? null),
    banner_url: patch.banner_url !== undefined ? patch.banner_url : (current?.banner_url ?? null),
    contact_email:
      patch.contact_email !== undefined
        ? String(patch.contact_email).trim()
        : (current?.contact_email ?? ""),
    support_phone:
      patch.support_phone !== undefined
        ? String(patch.support_phone).trim()
        : (current?.support_phone ?? ""),
    operational_timezone:
      patch.operational_timezone !== undefined
        ? String(patch.operational_timezone).trim()
        : (current?.operational_timezone ?? "America/Sao_Paulo"),
    currency:
      patch.currency !== undefined ? String(patch.currency).trim() : (current?.currency ?? "BRL"),
  };

  const email = merged.contact_email;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ValidationError("E-mail de contato inválido.", { field: "contact_email" });
  }

  const { data, error } = await ctx.client
    .from("tenant_settings")
    .upsert(
      {
        tenant_id: ctx.tenantId,
        ...merged,
      } as Database["public"]["Tables"]["tenant_settings"]["Insert"],
      { onConflict: "tenant_id" },
    )
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);
  return data as TenantSettingsRow;
}

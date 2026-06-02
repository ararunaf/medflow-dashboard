import { assertCan, can } from "@/lib/auth/rbac";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import type { ServiceCtx } from "@/lib/services/operations/types";

export type PilotDeploymentSnapshot = {
  profileCount: number;
  insuranceProviderCount: number;
  /**
   * Fechamentos ainda não finalizados. `null` quando o papel não lê fechamento financeiro
   * (evita erro RLS / permissão no piloto clínico).
   */
  openOrActiveClosingCount: number | null;
  distinctRoles: string[];
};

/**
 * Métricas mínimas para checklist de implantação piloto (volume baixo, head counts).
 */
export async function loadPilotDeploymentSnapshot(
  ctx: ServiceCtx,
): Promise<PilotDeploymentSnapshot> {
  assertCan(ctx.role, "tenant_settings:read");

  const canSeeClosing = can(ctx.role, "financial_closing:read");

  const [{ count: profileCount, error: pErr }, { count: insCount, error: iErr }, rolesRes] =
    await Promise.all([
      ctx.client
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", ctx.tenantId),
      ctx.client
        .from("insurance_providers")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", ctx.tenantId)
        .eq("active", true),
      ctx.client.from("profiles").select("role").eq("tenant_id", ctx.tenantId),
    ]);

  if (pErr) throw mapPostgresError(pErr);
  if (iErr) throw mapPostgresError(iErr);
  if (rolesRes.error) throw mapPostgresError(rolesRes.error);

  const closings = canSeeClosing
    ? await ctx.client.from("financial_closings").select("status").eq("tenant_id", ctx.tenantId)
    : { data: [] as { status: string }[], error: null as null };

  if (closings.error) throw mapPostgresError(closings.error);

  const openOrActiveClosingCount = canSeeClosing
    ? (closings.data ?? []).filter((r) => r.status !== "finalized").length
    : null;

  const roles = new Set<string>();
  for (const row of rolesRes.data ?? []) {
    if (row.role) roles.add(row.role);
  }

  return {
    profileCount: profileCount ?? 0,
    insuranceProviderCount: insCount ?? 0,
    openOrActiveClosingCount,
    distinctRoles: Array.from(roles).sort(),
  };
}

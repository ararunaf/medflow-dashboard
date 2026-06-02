import { assertCan } from "@/lib/auth/rbac";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import { clampJsonMetadata } from "@/lib/services/resilience/resilience-service";
import type { ServiceCtx } from "@/lib/services/operations/types";

export type OperationalHealthCheck = {
  id: "auth" | "tenant_settings" | "database" | "latency";
  ok: boolean;
  label: string;
  detail: string;
};

export async function runOperationalHealthChecks(
  ctx: ServiceCtx,
): Promise<OperationalHealthCheck[]> {
  assertCan(ctx.role, "tenant_settings:read");
  const out: OperationalHealthCheck[] = [
    {
      id: "auth",
      ok: true,
      label: "Sessão e perfil",
      detail: "Usuário autenticado com vínculo ao tenant.",
    },
  ];

  const { data, error } = await ctx.client
    .from("tenant_settings")
    .select("tenant_id")
    .maybeSingle();
  if (error) {
    const mapped = mapPostgresError(error);
    out.push({
      id: "database",
      ok: false,
      label: "Conexão Supabase",
      detail: mapped.message,
    });
    return out;
  }

  out.push({
    id: "database",
    ok: true,
    label: "Conexão Supabase",
    detail: "Consulta institucional executada com sucesso.",
  });

  out.push({
    id: "tenant_settings",
    ok: !!data,
    label: "Parametrização institucional",
    detail: data
      ? "Registro tenant_settings encontrado."
      : "Registro tenant_settings ausente — rode a migration ou peça suporte.",
  });

  const ms = await measureSupabaseRoundTripMs(ctx);
  if (ms != null) {
    out.push({
      id: "latency",
      ok: ms < 5000,
      label: "Latência Supabase (leitura)",
      detail: `${ms} ms — consulta simples tenant_settings.`,
    });
  }

  return out;
}

export async function measureSupabaseRoundTripMs(ctx: ServiceCtx): Promise<number | null> {
  assertCan(ctx.role, "tenant_settings:read");
  const started = typeof performance !== "undefined" ? performance.now() : Date.now();
  const { error } = await ctx.client.from("tenant_settings").select("tenant_id").limit(1);
  const ended = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (error) return null;
  return Math.max(0, Math.round(ended - started));
}

export async function recordOperationalHealthMetric(
  ctx: ServiceCtx,
  input: { metricName: string; metricValue?: number | null; details?: Record<string, unknown> },
): Promise<void> {
  assertCan(ctx.role, "tenant_settings:read");
  const details = clampJsonMetadata(input.details ?? {});
  const { error } = await ctx.client.from("operational_health_metrics").insert({
    tenant_id: ctx.tenantId,
    actor_profile_id: ctx.actorProfileId,
    metric_name: input.metricName.slice(0, 128),
    metric_value: input.metricValue ?? null,
    details,
  });
  if (error) {
    console.warn("[operational_health_metrics]", error.message);
  }
}

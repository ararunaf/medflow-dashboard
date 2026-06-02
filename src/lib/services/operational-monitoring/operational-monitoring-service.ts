import { assertCan } from "@/lib/auth/rbac";
import type { ServiceCtx } from "@/lib/services/operations/types";

export type OperationalErrorRow = {
  id: string;
  severity: string;
  source: string;
  error_code: string | null;
  message: string;
  created_at: string;
};

export type OperationalLogRow = {
  id: string;
  level: string;
  category: string;
  message: string;
  created_at: string;
};

export async function listRecentOperationalErrors(
  ctx: ServiceCtx,
  limit = 50,
): Promise<OperationalErrorRow[]> {
  assertCan(ctx.role, "tenant_settings:read");
  const { data, error } = await ctx.client
    .from("operational_errors")
    .select("id, severity, source, error_code, message, created_at")
    .order("created_at", { ascending: false })
    .limit(Math.min(200, Math.max(1, limit)));
  if (error) return [];
  return (data ?? []) as OperationalErrorRow[];
}

export async function listRecentOperationalLogs(
  ctx: ServiceCtx,
  limit = 40,
): Promise<OperationalLogRow[]> {
  assertCan(ctx.role, "tenant_settings:read");
  const { data, error } = await ctx.client
    .from("operational_logs")
    .select("id, level, category, message, created_at")
    .order("created_at", { ascending: false })
    .limit(Math.min(200, Math.max(1, limit)));
  if (error) return [];
  return (data ?? []) as OperationalLogRow[];
}

export type OperationalHealthMetricRow = {
  id: string;
  metric_name: string;
  metric_value: number | null;
  recorded_at: string;
};

export async function listRecentHealthMetrics(
  ctx: ServiceCtx,
  limit = 30,
): Promise<OperationalHealthMetricRow[]> {
  assertCan(ctx.role, "tenant_settings:read");
  const { data, error } = await ctx.client
    .from("operational_health_metrics")
    .select("id, metric_name, metric_value, recorded_at")
    .order("recorded_at", { ascending: false })
    .limit(Math.min(200, Math.max(1, limit)));
  if (error) return [];
  return (data ?? []) as OperationalHealthMetricRow[];
}

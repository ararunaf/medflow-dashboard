import type { JsonObject } from "@/lib/database.types";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { assertCan } from "@/lib/auth/rbac";
import {
  listRecentOperationalErrors,
  listRecentOperationalLogs,
  listRecentHealthMetrics,
} from "@/lib/services/operational-monitoring/operational-monitoring-service";

export type OperationalBackupBundle = {
  generated_at: string;
  tenant_id: string;
  tenant_settings: JsonObject | null;
  recent_errors: Awaited<ReturnType<typeof listRecentOperationalErrors>>;
  recent_logs: Awaited<ReturnType<typeof listRecentOperationalLogs>>;
  health_metrics: Awaited<ReturnType<typeof listRecentHealthMetrics>>;
};

export async function buildOperationalBackupBundle(
  ctx: ServiceCtx,
): Promise<OperationalBackupBundle> {
  assertCan(ctx.role, "tenant_settings:write");
  const { data: settings } = await ctx.client.from("tenant_settings").select("*").maybeSingle();
  const [recent_errors, recent_logs, health_metrics] = await Promise.all([
    listRecentOperationalErrors(ctx, 80),
    listRecentOperationalLogs(ctx, 60),
    listRecentHealthMetrics(ctx, 40),
  ]);
  return {
    generated_at: new Date().toISOString(),
    tenant_id: ctx.tenantId,
    tenant_settings: settings ? ({ ...settings } as JsonObject) : null,
    recent_errors,
    recent_logs,
    health_metrics,
  };
}

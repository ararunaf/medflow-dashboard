import { assertCan } from "@/lib/auth/rbac";
import type { ServiceCtx } from "@/lib/services/operations/types";
import type { ReadinessItem } from "@/lib/services/readiness-check/readiness-check-service";
import { buildOperationalBackupBundle } from "@/lib/services/operational-backup/operational-backup-export-service";

export type BackupExportKind = "tenant" | "financial" | "audit" | "operational";

export type BackupExportBundle = {
  kind: BackupExportKind;
  generated_at: string;
  tenant_id: string;
  payload: Record<string, unknown>;
};

export type BackupReadinessItem = ReadinessItem & { exportKind: BackupExportKind };

export function buildBackupReadinessChecklist(canWrite: boolean): BackupReadinessItem[] {
  return [
    {
      id: "bk_tenant",
      exportKind: "tenant",
      done: canWrite,
      title: "Export tenant (settings + metadados)",
      hint: "Requer tenant_settings:write — JSON para DR leve.",
    },
    {
      id: "bk_financial",
      exportKind: "financial",
      done: canWrite,
      title: "Export financeiro (fechamentos + conciliações)",
      hint: "Snapshot das últimas competências do tenant.",
    },
    {
      id: "bk_audit",
      exportKind: "audit",
      done: canWrite,
      title: "Export auditoria (logs de conciliação)",
      hint: "Trilha operacional recente para compliance.",
    },
    {
      id: "bk_operational",
      exportKind: "operational",
      done: canWrite,
      title: "Export operacional (erros, logs, métricas)",
      hint: "Mesmo bundle da página Operação.",
    },
  ];
}

export async function buildTenantBackupExport(ctx: ServiceCtx): Promise<BackupExportBundle> {
  assertCan(ctx.role, "tenant_settings:write");
  const { data: settings } = await ctx.client.from("tenant_settings").select("*").maybeSingle();
  const { data: tenant } = await ctx.client
    .from("tenants")
    .select("id, name, slug, created_at")
    .maybeSingle();
  return {
    kind: "tenant",
    generated_at: new Date().toISOString(),
    tenant_id: ctx.tenantId,
    payload: { tenant: tenant ?? null, tenant_settings: settings ?? null },
  };
}

export async function buildFinancialBackupExport(ctx: ServiceCtx): Promise<BackupExportBundle> {
  assertCan(ctx.role, "tenant_settings:write");
  const [closings, reconciliations] = await Promise.all([
    ctx.client
      .from("financial_closings")
      .select("id, competence_month, status, created_at, updated_at")
      .order("competence_month", { ascending: false })
      .limit(24),
    ctx.client
      .from("operational_reconciliations")
      .select("id, competence_month, status, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(24),
  ]);
  return {
    kind: "financial",
    generated_at: new Date().toISOString(),
    tenant_id: ctx.tenantId,
    payload: {
      financial_closings: closings.data ?? [],
      operational_reconciliations: reconciliations.data ?? [],
    },
  };
}

export async function buildAuditBackupExport(ctx: ServiceCtx): Promise<BackupExportBundle> {
  assertCan(ctx.role, "tenant_settings:write");
  const { data } = await ctx.client
    .from("operational_reconciliation_audit")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(120);
  return {
    kind: "audit",
    generated_at: new Date().toISOString(),
    tenant_id: ctx.tenantId,
    payload: { operational_reconciliation_audit: data ?? [] },
  };
}

export async function buildBackupExportByKind(
  ctx: ServiceCtx,
  kind: BackupExportKind,
): Promise<BackupExportBundle | Awaited<ReturnType<typeof buildOperationalBackupBundle>>> {
  switch (kind) {
    case "tenant":
      return buildTenantBackupExport(ctx);
    case "financial":
      return buildFinancialBackupExport(ctx);
    case "audit":
      return buildAuditBackupExport(ctx);
    case "operational":
      return buildOperationalBackupBundle(ctx);
    default:
      return buildTenantBackupExport(ctx);
  }
}

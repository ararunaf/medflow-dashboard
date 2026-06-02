import { assertCan } from "@/lib/auth/rbac";
import { NotFoundError, ValidationError, mapPostgresError } from "@/lib/domain/operations/errors";
import { recordOperationalEventSafe } from "@/lib/services/operations/operational-event-service";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { normalizeCompetenceMonth } from "@/lib/services/medical-payout/production-service";
import { appendReconciliationAudit } from "./reconciliation-audit-service";
import type { OperationalReconciliationRow, OperationalReconciliationStatus } from "./types";

const MONEY_EPS = 0.01;

async function getReconciliationRow(
  ctx: ServiceCtx,
  id: string,
): Promise<OperationalReconciliationRow> {
  const { data, error } = await ctx.client
    .from("operational_reconciliations")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw mapPostgresError(error);
  if (!data) throw new NotFoundError("Conciliação operacional", id);
  return data as OperationalReconciliationRow;
}

export function isReconciliationImmutable(row: OperationalReconciliationRow): boolean {
  return row.status === "finalized";
}

export async function listOperationalReconciliations(
  ctx: ServiceCtx,
  opts: { search?: string; limit?: number } = {},
): Promise<OperationalReconciliationRow[]> {
  assertCan(ctx.role, "financial_closing:read");
  const limit = opts.limit ?? 120;
  const { data, error } = await ctx.client
    .from("operational_reconciliations")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("competence_month", { ascending: false })
    .limit(limit);
  if (error) throw mapPostgresError(error);
  let rows = (data ?? []) as OperationalReconciliationRow[];
  const search = opts.search?.trim().toLowerCase();
  if (search) {
    rows = rows.filter((r) => r.competence_month.toLowerCase().includes(search));
  }
  return rows;
}

export async function getOperationalReconciliationById(
  ctx: ServiceCtx,
  id: string,
): Promise<OperationalReconciliationRow> {
  assertCan(ctx.role, "financial_closing:read");
  return getReconciliationRow(ctx, id);
}

export async function ensureDraftReconciliationForCompetence(
  ctx: ServiceCtx,
  competenceMonth: string,
): Promise<OperationalReconciliationRow> {
  assertCan(ctx.role, "financial_closing:write");
  const cm = normalizeCompetenceMonth(competenceMonth);

  const { data: existing, error: exErr } = await ctx.client
    .from("operational_reconciliations")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("competence_month", cm)
    .maybeSingle();
  if (exErr) throw mapPostgresError(exErr);
  if (existing) return existing as OperationalReconciliationRow;

  const { data, error } = await ctx.client
    .from("operational_reconciliations")
    .insert({
      tenant_id: ctx.tenantId,
      competence_month: cm,
      status: "draft",
    })
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);
  const row = data as OperationalReconciliationRow;

  await appendReconciliationAudit(ctx, {
    reconciliationId: row.id,
    action: "reconciliation_created",
    payload: { competence_month: cm },
  });
  await recordOperationalEventSafe(ctx, {
    entity_type: "operational_reconciliation",
    entity_id: row.id,
    event_type: "operational_reconciliation_created",
    severity: "info",
    description: `Conciliação operacional criada · ${cm}`,
    metadata: { competence_month: cm },
  });
  return row;
}

export async function linkReconciliationToClosing(
  ctx: ServiceCtx,
  input: { reconciliationId: string; closingId: string | null },
): Promise<OperationalReconciliationRow> {
  assertCan(ctx.role, "financial_closing:write");
  const row = await getReconciliationRow(ctx, input.reconciliationId);
  if (isReconciliationImmutable(row)) {
    throw new ValidationError("Conciliação finalizada não pode ser alterada.", {
      field: "reconciliationId",
    });
  }
  if (input.closingId) {
    const { data: closing, error: cErr } = await ctx.client
      .from("financial_closings")
      .select("id, tenant_id, competence_month")
      .eq("tenant_id", ctx.tenantId)
      .eq("id", input.closingId)
      .maybeSingle();
    if (cErr) throw mapPostgresError(cErr);
    if (!closing) throw new NotFoundError("Fechamento financeiro", input.closingId);
    if (closing.competence_month !== row.competence_month) {
      throw new ValidationError("Fechamento não é da mesma competência da conciliação.", {
        field: "closingId",
      });
    }
  }

  const { data, error } = await ctx.client
    .from("operational_reconciliations")
    .update({ financial_closing_id: input.closingId })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", input.reconciliationId)
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);
  const updated = data as OperationalReconciliationRow;
  await appendReconciliationAudit(ctx, {
    reconciliationId: input.reconciliationId,
    action: "manual_adjustment",
    payload: { financial_closing_id: input.closingId },
  });
  return updated;
}

export async function listReconciliationItems(
  ctx: ServiceCtx,
  reconciliationId: string,
  limit = 5000,
) {
  assertCan(ctx.role, "financial_closing:read");
  const { data, error } = await ctx.client
    .from("operational_reconciliation_items")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("reconciliation_id", reconciliationId)
    .order("reference_type", { ascending: true })
    .limit(limit);
  if (error) throw mapPostgresError(error);
  return data ?? [];
}

export async function listReconciliationIssues(
  ctx: ServiceCtx,
  reconciliationId: string,
  limit = 500,
) {
  assertCan(ctx.role, "financial_closing:read");
  const { data, error } = await ctx.client
    .from("operational_reconciliation_issues")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("reconciliation_id", reconciliationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw mapPostgresError(error);
  return data ?? [];
}

export async function refreshReconciliationTotalsFromItems(
  ctx: ServiceCtx,
  reconciliationId: string,
): Promise<OperationalReconciliationRow> {
  assertCan(ctx.role, "financial_closing:write");
  const row = await getReconciliationRow(ctx, reconciliationId);
  if (isReconciliationImmutable(row)) {
    return row;
  }

  const { data: items, error: iErr } = await ctx.client
    .from("operational_reconciliation_items")
    .select("expected_value, received_value, status")
    .eq("tenant_id", ctx.tenantId)
    .eq("reconciliation_id", reconciliationId);
  if (iErr) throw mapPostgresError(iErr);
  const list = items ?? [];
  let sumExpected = 0;
  let sumReceived = 0;
  for (const it of list) {
    sumExpected += Number(it.expected_value);
    sumReceived += Number(it.received_value);
  }
  const diff = Math.round((sumReceived - sumExpected) * 100) / 100;

  const { data: openIssues, error: issErr } = await ctx.client
    .from("operational_reconciliation_issues")
    .select("id, severity")
    .eq("tenant_id", ctx.tenantId)
    .eq("reconciliation_id", reconciliationId)
    .eq("resolved", false)
    .limit(500);
  if (issErr) throw mapPostgresError(issErr);
  const hasCritical = (openIssues ?? []).some((i) => i.severity === "critical");
  const hasDivergentItem = list.some((it) => it.status === "divergent");

  let nextStatus: OperationalReconciliationStatus = row.status;
  if (row.status === "processing") {
    if (hasCritical || hasDivergentItem || Math.abs(diff) >= MONEY_EPS) {
      nextStatus = "divergent";
    } else {
      nextStatus = "reconciled";
    }
  } else if (row.status === "draft" || row.status === "reconciled" || row.status === "divergent") {
    if (hasCritical || hasDivergentItem || Math.abs(diff) >= MONEY_EPS) {
      nextStatus = "divergent";
    } else if (list.length > 0) {
      nextStatus = "reconciled";
    } else {
      nextStatus = "draft";
    }
  }

  const { data, error } = await ctx.client
    .from("operational_reconciliations")
    .update({
      expected_value: Math.round(sumExpected * 100) / 100,
      received_value: Math.round(sumReceived * 100) / 100,
      difference_value: diff,
      status: nextStatus,
    })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", reconciliationId)
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);
  return data as OperationalReconciliationRow;
}

export async function setReconciliationProcessing(
  ctx: ServiceCtx,
  reconciliationId: string,
): Promise<OperationalReconciliationRow> {
  assertCan(ctx.role, "financial_closing:write");
  const row = await getReconciliationRow(ctx, reconciliationId);
  if (isReconciliationImmutable(row)) {
    throw new ValidationError("Conciliação finalizada.", { field: "reconciliationId" });
  }
  const { data, error } = await ctx.client
    .from("operational_reconciliations")
    .update({ status: "processing" })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", reconciliationId)
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);
  return data as OperationalReconciliationRow;
}

export async function finalizeOperationalReconciliation(
  ctx: ServiceCtx,
  reconciliationId: string,
): Promise<OperationalReconciliationRow> {
  assertCan(ctx.role, "financial_closing:write");
  const row = await getReconciliationRow(ctx, reconciliationId);
  if (row.status === "finalized") return row;

  const { data, error } = await ctx.client
    .from("operational_reconciliations")
    .update({ status: "finalized" })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", reconciliationId)
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);
  const updated = data as OperationalReconciliationRow;

  await appendReconciliationAudit(ctx, {
    reconciliationId,
    action: "reconciliation_status_changed",
    payload: { from: row.status, to: "finalized" },
  });
  await recordOperationalEventSafe(ctx, {
    entity_type: "operational_reconciliation",
    entity_id: reconciliationId,
    event_type: "operational_reconciliation_status_changed",
    severity: "warning",
    description: `Conciliação operacional finalizada · ${row.competence_month}`,
    metadata: { from: row.status, to: "finalized" },
  });
  return updated;
}

export async function resolveReconciliationIssue(
  ctx: ServiceCtx,
  input: { issueId: string; resolved: boolean },
): Promise<void> {
  assertCan(ctx.role, "financial_closing:write");
  const { data: issue, error: gErr } = await ctx.client
    .from("operational_reconciliation_issues")
    .select("id, reconciliation_id, tenant_id")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", input.issueId)
    .maybeSingle();
  if (gErr) throw mapPostgresError(gErr);
  if (!issue) throw new NotFoundError("Pendência de conciliação", input.issueId);

  const { error } = await ctx.client
    .from("operational_reconciliation_issues")
    .update({ resolved: input.resolved })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", input.issueId);
  if (error) throw mapPostgresError(error);

  await appendReconciliationAudit(ctx, {
    reconciliationId: issue.reconciliation_id,
    action: "issue_resolved",
    payload: { issue_id: input.issueId, resolved: input.resolved },
  });
  await refreshReconciliationTotalsFromItems(ctx, issue.reconciliation_id);
}

export async function upsertManualReconciliationItem(
  ctx: ServiceCtx,
  input: {
    reconciliationId: string;
    referenceId: string;
    expectedValue: number;
    receivedValue: number;
  },
): Promise<void> {
  assertCan(ctx.role, "financial_closing:write");
  const row = await getReconciliationRow(ctx, input.reconciliationId);
  if (isReconciliationImmutable(row)) {
    throw new ValidationError("Conciliação finalizada.", { field: "reconciliationId" });
  }

  const diff = Math.round((input.receivedValue - input.expectedValue) * 100) / 100;
  const status = deriveItemStatus(input.expectedValue, input.receivedValue, diff);

  const { data: existing } = await ctx.client
    .from("operational_reconciliation_items")
    .select("id")
    .eq("tenant_id", ctx.tenantId)
    .eq("reconciliation_id", input.reconciliationId)
    .eq("reference_type", "manual_entry")
    .eq("reference_id", input.referenceId)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await ctx.client
      .from("operational_reconciliation_items")
      .update({
        expected_value: input.expectedValue,
        received_value: input.receivedValue,
        difference_value: diff,
        status,
      })
      .eq("tenant_id", ctx.tenantId)
      .eq("id", existing.id);
    if (error) throw mapPostgresError(error);
  } else {
    const { error } = await ctx.client.from("operational_reconciliation_items").insert({
      tenant_id: ctx.tenantId,
      reconciliation_id: input.reconciliationId,
      reference_type: "manual_entry",
      reference_id: input.referenceId,
      expected_value: input.expectedValue,
      received_value: input.receivedValue,
      difference_value: diff,
      status,
    });
    if (error) throw mapPostgresError(error);
  }

  await appendReconciliationAudit(ctx, {
    reconciliationId: input.reconciliationId,
    action: "item_updated",
    payload: { kind: "manual_entry", reference_id: input.referenceId },
  });
  await refreshReconciliationTotalsFromItems(ctx, input.reconciliationId);
}

export async function runReconciliationBulkOp(
  ctx: ServiceCtx,
  input: { op: "refresh_totals"; reconciliationIds: string[] },
): Promise<{ processed: OperationalReconciliationRow[]; skipped: number }> {
  assertCan(ctx.role, "financial_closing:write");
  if (input.reconciliationIds.length > 50) {
    throw new ValidationError("No máximo 50 conciliações por operação em lote.", {
      field: "reconciliationIds",
    });
  }
  const processed: OperationalReconciliationRow[] = [];
  let skipped = 0;
  for (const id of input.reconciliationIds) {
    const row = await getReconciliationRow(ctx, id);
    if (isReconciliationImmutable(row)) {
      skipped += 1;
      continue;
    }
    const updated = await refreshReconciliationTotalsFromItems(ctx, id);
    processed.push(updated);
  }
  return { processed, skipped };
}

export function deriveItemStatus(
  expectedValue: number,
  receivedValue: number,
  differenceValue: number,
): "matched" | "partially_matched" | "divergent" | "pending" {
  if (expectedValue === 0 && receivedValue === 0) return "matched";
  if (Math.abs(differenceValue) < MONEY_EPS) return "matched";
  if (expectedValue > 0 && receivedValue > 0 && Math.abs(differenceValue) >= MONEY_EPS) {
    return "partially_matched";
  }
  if (expectedValue > 0 && receivedValue === 0) return "divergent";
  if (expectedValue === 0 && receivedValue > 0) return "pending";
  return "pending";
}

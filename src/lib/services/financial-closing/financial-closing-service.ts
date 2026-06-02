import { assertCan } from "@/lib/auth/rbac";
import { NotFoundError, ValidationError, mapPostgresError } from "@/lib/domain/operations/errors";
import { recordOperationalEventSafe } from "@/lib/services/operations/operational-event-service";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { listMedicalPayoutsForCompetence } from "@/lib/services/medical-payout";
import { normalizeCompetenceMonth } from "@/lib/services/medical-payout/production-service";
import { assertValidStatusTransition, isClosingImmutable } from "./competence-lock-service";
import { appendFinancialClosingAudit } from "./financial-audit-service";
import {
  bundleToSnapshotPayload,
  loadOperationalConsolidationBundle,
  operationalBundleFromSnapshotPayload,
  payoutDigestPayload,
} from "./operational-consolidation-service";
import {
  getLatestConsolidationSummarySnapshot,
  insertFinancialClosingSnapshot,
} from "./snapshot-service";
import type { FinancialClosingRow, FinancialClosingStatus } from "./types";

async function getClosingRow(ctx: ServiceCtx, id: string): Promise<FinancialClosingRow> {
  const { data, error } = await ctx.client
    .from("financial_closings")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw mapPostgresError(error);
  if (!data) throw new NotFoundError("Fechamento financeiro", id);
  return data as FinancialClosingRow;
}

export async function listFinancialClosings(
  ctx: ServiceCtx,
  opts: { search?: string; limit?: number } = {},
): Promise<FinancialClosingRow[]> {
  assertCan(ctx.role, "financial_closing:read");
  const limit = opts.limit ?? 120;
  const { data, error } = await ctx.client
    .from("financial_closings")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("competence_month", { ascending: false })
    .limit(limit);
  if (error) throw mapPostgresError(error);
  let rows = (data ?? []) as FinancialClosingRow[];
  const search = opts.search?.trim().toLowerCase();
  if (search) {
    rows = rows.filter((r) => r.competence_month.toLowerCase().includes(search));
  }
  return rows;
}

export async function getFinancialClosingById(
  ctx: ServiceCtx,
  id: string,
): Promise<FinancialClosingRow> {
  assertCan(ctx.role, "financial_closing:read");
  return getClosingRow(ctx, id);
}

/** Garante registro de fechamento em rascunho para a competência (idempotente). */
export async function ensureDraftClosingForCompetence(
  ctx: ServiceCtx,
  competenceMonth: string,
): Promise<FinancialClosingRow> {
  assertCan(ctx.role, "financial_closing:write");
  const cm = normalizeCompetenceMonth(competenceMonth);

  const { data: existing, error: exErr } = await ctx.client
    .from("financial_closings")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("competence_month", cm)
    .maybeSingle();
  if (exErr) throw mapPostgresError(exErr);
  if (existing) return existing as FinancialClosingRow;

  const { data, error } = await ctx.client
    .from("financial_closings")
    .insert({
      tenant_id: ctx.tenantId,
      competence_month: cm,
      status: "draft",
    })
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);
  const row = data as FinancialClosingRow;
  await appendFinancialClosingAudit(ctx, {
    closingId: row.id,
    action: "closing_created",
    payload: { competence_month: cm },
  });
  await recordOperationalEventSafe(ctx, {
    entity_type: "financial_closing",
    entity_id: row.id,
    event_type: "financial_closing_created",
    severity: "info",
    description: `Fechamento operacional criado · ${cm}`,
    metadata: { competence_month: cm },
  });
  return row;
}

/** Recalcula totais a partir da produção/repasses (não usar em locked/finalized). */
export async function refreshClosingTotalsFromOperationalData(
  ctx: ServiceCtx,
  closingId: string,
): Promise<FinancialClosingRow> {
  assertCan(ctx.role, "financial_closing:write");
  const row = await getClosingRow(ctx, closingId);
  if (isClosingImmutable(row)) {
    return row;
  }
  const bundle = await loadOperationalConsolidationBundle(ctx, row.competence_month);
  const { data, error } = await ctx.client
    .from("financial_closings")
    .update({
      total_guides: bundle.total_guides,
      total_billed: bundle.total_billed,
      total_denied: bundle.total_denied,
      total_approved: bundle.total_approved,
      total_payouts: bundle.total_payouts,
      operational_difference: bundle.operational_difference,
    })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", closingId)
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);
  const updated = data as FinancialClosingRow;
  await appendFinancialClosingAudit(ctx, {
    closingId,
    action: "consolidation_refreshed",
    payload: { totals: bundleToSnapshotPayload(bundle).totals },
  });
  await recordOperationalEventSafe(ctx, {
    entity_type: "financial_closing",
    entity_id: closingId,
    event_type: "financial_closing_consolidated",
    severity: "info",
    description: `Consolidação atualizada · ${row.competence_month}`,
    metadata: { competence_month: row.competence_month },
  });
  return updated;
}

export async function transitionFinancialClosingStatus(
  ctx: ServiceCtx,
  input: { closingId: string; toStatus: FinancialClosingStatus; note?: string },
): Promise<FinancialClosingRow> {
  assertCan(ctx.role, "financial_closing:write");
  const row = await getClosingRow(ctx, input.closingId);
  const from = row.status;
  /** Preserva o status inicial para auditoria sem estreitamento de fluxo do TypeScript. */
  const statusBeforeTransition = row["status"] as FinancialClosingStatus;
  const to = input.toStatus;
  if (from === to) return row;
  assertValidStatusTransition(from, to, ctx.role);

  let totalsPatch: Partial<
    Pick<
      FinancialClosingRow,
      | "total_guides"
      | "total_billed"
      | "total_denied"
      | "total_approved"
      | "total_payouts"
      | "operational_difference"
    >
  > = {};

  if (to === "locked") {
    const bundle = await loadOperationalConsolidationBundle(ctx, row.competence_month);
    totalsPatch = {
      total_guides: bundle.total_guides,
      total_billed: bundle.total_billed,
      total_denied: bundle.total_denied,
      total_approved: bundle.total_approved,
      total_payouts: bundle.total_payouts,
      operational_difference: bundle.operational_difference,
    };
    await insertFinancialClosingSnapshot(ctx, {
      closingId: input.closingId,
      snapshotType: "consolidation_summary",
      payload: bundleToSnapshotPayload(bundle),
    });
    await insertFinancialClosingSnapshot(ctx, {
      closingId: input.closingId,
      snapshotType: "lock_checkpoint",
      payload: { note: input.note ?? "", previous_status: from },
    });
    await insertFinancialClosingSnapshot(ctx, {
      closingId: input.closingId,
      snapshotType: "pre_reconciliation_marker",
      payload: {
        competence_month: row.competence_month,
        checksum_scope: "operational_totals_v1",
        totals: bundleToSnapshotPayload(bundle).totals,
      },
    });
  }

  if (to === "finalized") {
    const payouts = await listMedicalPayoutsForCompetence(ctx, row.competence_month);
    await insertFinancialClosingSnapshot(ctx, {
      closingId: input.closingId,
      snapshotType: "payout_crosscheck",
      payload: payoutDigestPayload(ctx, payouts),
    });
  }

  const { data, error } = await ctx.client
    .from("financial_closings")
    .update({ status: to, ...totalsPatch })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", input.closingId)
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);
  const updated = data as FinancialClosingRow;

  const auditAction = (() => {
    if (to === "locked") return "locked";
    if (to === "finalized") return "finalized";
    if (statusBeforeTransition === "finalized") return "reopened";
    if (statusBeforeTransition === "locked" && to === "validated") return "unlocked";
    return "status_changed";
  })();

  await appendFinancialClosingAudit(ctx, {
    closingId: input.closingId,
    action: auditAction,
    payload: { from, to, note: input.note ?? null },
  });

  const eventType = (() => {
    if (to === "locked") return "financial_closing_locked";
    if (to === "finalized") return "financial_closing_finalized";
    if (statusBeforeTransition === "finalized") return "financial_closing_reopened";
    if (statusBeforeTransition === "locked" && to === "validated")
      return "financial_closing_unlocked";
    return "financial_closing_status_changed";
  })();

  await recordOperationalEventSafe(ctx, {
    entity_type: "financial_closing",
    entity_id: input.closingId,
    event_type: eventType,
    severity: to === "finalized" ? "warning" : "info",
    description: `Fechamento ${row.competence_month}: ${from} → ${to}`,
    metadata: { from, to, note: input.note ?? "" },
  });

  return updated;
}

export async function loadClosingOperationalBundle(
  ctx: ServiceCtx,
  closingId: string,
): Promise<{
  closing: FinancialClosingRow;
  bundle: Awaited<ReturnType<typeof loadOperationalConsolidationBundle>> | null;
}> {
  assertCan(ctx.role, "financial_closing:read");
  const closing = await getClosingRow(ctx, closingId);
  if (isClosingImmutable(closing)) {
    const snap = await getLatestConsolidationSummarySnapshot(ctx, closingId);
    const bundle = operationalBundleFromSnapshotPayload(snap?.payload_json ?? null);
    return { closing, bundle };
  }
  const bundle = await loadOperationalConsolidationBundle(ctx, closing.competence_month);
  return { closing, bundle };
}

export type FinancialClosingBulkOp =
  | { op: "refresh_totals"; closingIds: string[] }
  | { op: "send_to_review"; closingIds: string[] };

/** Ações em lote para auditoria / fechamento (sem lock global). */
export async function runFinancialClosingBulkOp(
  ctx: ServiceCtx,
  input: FinancialClosingBulkOp,
): Promise<{ processed: FinancialClosingRow[]; skipped: number }> {
  assertCan(ctx.role, "financial_closing:write");
  const unique = [...new Set(input.closingIds)];
  if (unique.length === 0 || unique.length > 50) {
    throw new ValidationError("Informe entre 1 e 50 fechamentos por operação em lote.");
  }

  const processed: FinancialClosingRow[] = [];
  let skipped = 0;

  if (input.op === "refresh_totals") {
    for (const id of unique) {
      processed.push(await refreshClosingTotalsFromOperationalData(ctx, id));
    }
    return { processed, skipped: 0 };
  }

  if (input.op === "send_to_review") {
    for (const id of unique) {
      const row = await getClosingRow(ctx, id);
      if (row.status !== "draft") {
        skipped += 1;
        continue;
      }
      processed.push(
        await transitionFinancialClosingStatus(ctx, {
          closingId: id,
          toStatus: "under_review",
        }),
      );
    }
    return { processed, skipped };
  }

  throw new ValidationError("Operação em lote desconhecida.");
}

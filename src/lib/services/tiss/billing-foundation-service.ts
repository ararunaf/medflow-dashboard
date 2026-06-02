import { assertCan } from "@/lib/auth/rbac";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import type { TissBatchStatus, TissGuideStatus } from "@/lib/database.types";
import type { ServiceCtx } from "@/lib/services/operations/types";

export type OperationalBillingSummary = {
  guidesByStatus: Record<TissGuideStatus, number>;
  guidesTotalValue: number;
  batchesByStatus: Record<TissBatchStatus, number>;
  openBatchValue: number;
  pendingReviewCount: number;
};

export async function loadOperationalBillingSummary(
  ctx: ServiceCtx,
): Promise<OperationalBillingSummary> {
  assertCan(ctx.role, "tiss:read");
  const guidesByStatus: Record<TissGuideStatus, number> = {
    draft: 0,
    pending_review: 0,
    approved: 0,
    billed: 0,
    denied: 0,
  };
  const { data: guides, error: gErr } = await ctx.client
    .from("tiss_guides")
    .select("status, total_value")
    .eq("tenant_id", ctx.tenantId);
  if (gErr) throw mapPostgresError(gErr);
  let guidesTotalValue = 0;
  for (const row of guides ?? []) {
    guidesByStatus[row.status] += 1;
    guidesTotalValue += Number(row.total_value ?? 0);
  }

  const batchesByStatus: Record<TissBatchStatus, number> = {
    open: 0,
    closed: 0,
    exported: 0,
    processed: 0,
  };
  const { data: batches, error: bErr } = await ctx.client
    .from("tiss_batches")
    .select("status, total_value")
    .eq("tenant_id", ctx.tenantId);
  if (bErr) throw mapPostgresError(bErr);
  let openBatchValue = 0;
  for (const row of batches ?? []) {
    batchesByStatus[row.status] += 1;
    if (row.status === "open") {
      openBatchValue += Number(row.total_value ?? 0);
    }
  }

  return {
    guidesByStatus,
    guidesTotalValue,
    batchesByStatus,
    openBatchValue,
    pendingReviewCount: guidesByStatus.pending_review,
  };
}

import { assertCan } from "@/lib/auth/rbac";
import { ValidationError, mapPostgresError } from "@/lib/domain/operations/errors";
import { recordOperationalEventSafe } from "@/lib/services/operations/operational-event-service";
import type { ServiceCtx } from "@/lib/services/operations/types";
import type { TissBatchRow } from "./types";

function competenceFirstDay(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00Z");
  if (Number.isNaN(d.getTime())) {
    throw new ValidationError("Competência inválida.", { field: "competence" });
  }
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export async function listTissBatches(ctx: ServiceCtx): Promise<TissBatchRow[]> {
  assertCan(ctx.role, "tiss:read");
  const { data, error } = await ctx.client
    .from("tiss_batches")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .order("competence", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw mapPostgresError(error);
  return data ?? [];
}

export async function createTissBatch(
  ctx: ServiceCtx,
  competenceInput: string,
): Promise<TissBatchRow> {
  assertCan(ctx.role, "tiss:write");
  const competence = competenceFirstDay(competenceInput);
  const prefix = competence.slice(0, 7).replace("-", "");
  const { count, error: cErr } = await ctx.client
    .from("tiss_batches")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", ctx.tenantId)
    .eq("competence", competence);
  if (cErr) throw mapPostgresError(cErr);
  const seq = (count ?? 0) + 1;
  const batch_number = `L${prefix}-${String(seq).padStart(4, "0")}`;
  const { data, error } = await ctx.client
    .from("tiss_batches")
    .insert({
      tenant_id: ctx.tenantId,
      batch_number,
      competence,
      status: "open",
      total_guides: 0,
      total_value: 0,
    })
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);
  return data;
}

export async function recalcBatchTotals(ctx: ServiceCtx, batchId: string): Promise<TissBatchRow> {
  assertCan(ctx.role, "tiss:write");
  const { data: agg, error: aErr } = await ctx.client
    .from("tiss_guides")
    .select("total_value")
    .eq("tenant_id", ctx.tenantId)
    .eq("batch_id", batchId);
  if (aErr) throw mapPostgresError(aErr);
  const rows = agg ?? [];
  const total_guides = rows.length;
  const total_value = rows.reduce((s, r) => s + Number(r.total_value ?? 0), 0);
  const { data, error } = await ctx.client
    .from("tiss_batches")
    .update({
      total_guides,
      total_value,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", batchId)
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);
  return data;
}

export async function assignGuideToBatch(
  ctx: ServiceCtx,
  input: { guide_id: string; batch_id: string },
): Promise<void> {
  assertCan(ctx.role, "tiss:write");
  const { data: batch, error: bErr } = await ctx.client
    .from("tiss_batches")
    .select("id, status")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", input.batch_id)
    .maybeSingle();
  if (bErr) throw mapPostgresError(bErr);
  if (!batch || batch.status !== "open") {
    throw new ValidationError("Lote inexistente ou não está aberto para vínculo.", {
      field: "batch_id",
    });
  }
  const { data: guide, error: gErr } = await ctx.client
    .from("tiss_guides")
    .select("id, status, batch_id")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", input.guide_id)
    .maybeSingle();
  if (gErr) throw mapPostgresError(gErr);
  if (!guide) throw new ValidationError("Guia não encontrada.", { field: "guide_id" });
  if (guide.status !== "approved") {
    throw new ValidationError("Apenas guias aprovadas podem entrar no lote.", { field: "status" });
  }
  if (guide.batch_id && guide.batch_id !== input.batch_id) {
    throw new ValidationError("Guia já vinculada a outro lote.", { field: "batch_id" });
  }
  const { error: uErr } = await ctx.client
    .from("tiss_guides")
    .update({ batch_id: input.batch_id, updated_at: new Date().toISOString() })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", input.guide_id);
  if (uErr) throw mapPostgresError(uErr);
  await recalcBatchTotals(ctx, input.batch_id);
}

export async function removeGuideFromBatch(ctx: ServiceCtx, guideId: string): Promise<void> {
  assertCan(ctx.role, "tiss:write");
  const { data: guide, error: gErr } = await ctx.client
    .from("tiss_guides")
    .select("batch_id")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", guideId)
    .maybeSingle();
  if (gErr) throw mapPostgresError(gErr);
  const batchId = guide?.batch_id;
  if (!batchId) return;
  const { data: batch, error: bErr } = await ctx.client
    .from("tiss_batches")
    .select("status")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", batchId)
    .maybeSingle();
  if (bErr) throw mapPostgresError(bErr);
  if (batch?.status !== "open") {
    throw new ValidationError("Não é possível remover guia de lote fechado.", {
      field: "batch_id",
    });
  }
  const { error } = await ctx.client
    .from("tiss_guides")
    .update({ batch_id: null, updated_at: new Date().toISOString() })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", guideId);
  if (error) throw mapPostgresError(error);
  await recalcBatchTotals(ctx, batchId);
}

export async function closeTissBatch(ctx: ServiceCtx, batchId: string): Promise<TissBatchRow> {
  assertCan(ctx.role, "tiss:write");
  const { data: batch, error: bErr } = await ctx.client
    .from("tiss_batches")
    .select("id, status")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", batchId)
    .maybeSingle();
  if (bErr) throw mapPostgresError(bErr);
  if (!batch) throw new ValidationError("Lote não encontrado.", { field: "batch_id" });
  if (batch.status !== "open") {
    throw new ValidationError("Apenas lotes abertos podem ser fechados.", { field: "status" });
  }
  await recalcBatchTotals(ctx, batchId);
  const now = new Date().toISOString();
  const { error: gErr } = await ctx.client
    .from("tiss_guides")
    .update({ status: "billed", updated_at: now })
    .eq("tenant_id", ctx.tenantId)
    .eq("batch_id", batchId)
    .eq("status", "approved");
  if (gErr) throw mapPostgresError(gErr);
  const { data, error } = await ctx.client
    .from("tiss_batches")
    .update({
      status: "closed",
      closed_at: now,
      updated_at: now,
    })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", batchId)
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);
  await recordOperationalEventSafe(ctx, {
    entity_type: "tiss_batch",
    entity_id: batchId,
    event_type: "tiss_batch_closed",
    severity: "info",
    description: `Lote TISS fechado (${data.batch_number})`,
    metadata: { batch_id: batchId, total_guides: data.total_guides, total_value: data.total_value },
  });
  return data;
}

export async function markBatchExported(ctx: ServiceCtx, batchId: string): Promise<TissBatchRow> {
  assertCan(ctx.role, "tiss:write");
  const { data: current, error: cErr } = await ctx.client
    .from("tiss_batches")
    .select("status")
    .eq("tenant_id", ctx.tenantId)
    .eq("id", batchId)
    .maybeSingle();
  if (cErr) throw mapPostgresError(cErr);
  if (!current) throw new ValidationError("Lote não encontrado.", { field: "batch_id" });
  if (current.status !== "closed" && current.status !== "exported") {
    throw new ValidationError("Exportação exige lote fechado.", { field: "status" });
  }
  const now = new Date().toISOString();
  const { data, error } = await ctx.client
    .from("tiss_batches")
    .update({
      status: "exported",
      generated_at: now,
      updated_at: now,
    })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", batchId)
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);
  return data;
}

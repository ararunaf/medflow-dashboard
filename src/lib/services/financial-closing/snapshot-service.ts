import { assertCan } from "@/lib/auth/rbac";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import type { Json } from "@/lib/database.types";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { recordOperationalEventSafe } from "@/lib/services/operations/operational-event-service";
import type { FinancialClosingSnapshotRow, FinancialClosingSnapshotType } from "./types";

export async function insertFinancialClosingSnapshot(
  ctx: ServiceCtx,
  input: {
    closingId: string;
    snapshotType: FinancialClosingSnapshotType;
    payload: Record<string, unknown>;
  },
): Promise<FinancialClosingSnapshotRow> {
  assertCan(ctx.role, "financial_closing:write");
  const raw = JSON.stringify(input.payload);
  if (raw.length > 110_000) {
    throw new Error("Snapshot excede limite seguro; reduza o escopo do payload.");
  }
  const payload_json = input.payload as Json;
  const { data, error } = await ctx.client
    .from("financial_closing_snapshots")
    .insert({
      closing_id: input.closingId,
      snapshot_type: input.snapshotType,
      payload_json,
    })
    .select("*")
    .single();
  if (error) throw mapPostgresError(error);
  if (!data) throw new Error("financial_closing_snapshots insert sem retorno.");
  const row = data as FinancialClosingSnapshotRow;
  await recordOperationalEventSafe(ctx, {
    entity_type: "financial_closing",
    entity_id: input.closingId,
    event_type: "financial_closing_snapshot_created",
    severity: "info",
    description: `Snapshot ${input.snapshotType}`,
    metadata: { snapshot_id: row.id, snapshot_type: input.snapshotType },
  });
  return row;
}

export async function listSnapshotsForClosing(
  ctx: ServiceCtx,
  closingId: string,
  limit = 50,
): Promise<FinancialClosingSnapshotRow[]> {
  assertCan(ctx.role, "financial_closing:read");
  const { data, error } = await ctx.client
    .from("financial_closing_snapshots")
    .select("*")
    .eq("closing_id", closingId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw mapPostgresError(error);
  return (data ?? []) as FinancialClosingSnapshotRow[];
}

/** Último snapshot de consolidação (para exibir convênio/profissional sem recalcular ao vivo). */
export async function getLatestConsolidationSummarySnapshot(
  ctx: ServiceCtx,
  closingId: string,
): Promise<FinancialClosingSnapshotRow | null> {
  assertCan(ctx.role, "financial_closing:read");
  const { data, error } = await ctx.client
    .from("financial_closing_snapshots")
    .select("*")
    .eq("closing_id", closingId)
    .eq("snapshot_type", "consolidation_summary")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw mapPostgresError(error);
  return (data as FinancialClosingSnapshotRow | null) ?? null;
}

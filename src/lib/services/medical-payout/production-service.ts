import { assertCan } from "@/lib/auth/rbac";
import { ValidationError, mapPostgresError } from "@/lib/domain/operations/errors";
import { assertCompetenceEditableForBilling } from "@/lib/services/financial-closing/competence-lock-service";
import { recordOperationalEventSafe } from "@/lib/services/operations/operational-event-service";
import type { ServiceCtx } from "@/lib/services/operations/types";
import type { MedicalProductionRow } from "./types";

export function normalizeCompetenceMonth(input: string): string {
  if (!/^\d{4}-\d{2}-01$/.test(input)) {
    throw new ValidationError("competence_month deve ser ISO YYYY-MM-01.", {
      field: "competenceMonth",
    });
  }
  return input;
}

function competenceFromBatchOrAttendance(
  batchCompetence: string | null | undefined,
  attendanceDate: string,
): string {
  if (batchCompetence) {
    const d = new Date(`${batchCompetence}T12:00:00.000Z`);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
  }
  const d2 = new Date(`${attendanceDate}T12:00:00.000Z`);
  return `${d2.getUTCFullYear()}-${String(d2.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export async function listMedicalProductionForCompetence(
  ctx: ServiceCtx,
  competenceMonth: string,
): Promise<MedicalProductionRow[]> {
  assertCan(ctx.role, "payouts:read");
  const cm = normalizeCompetenceMonth(competenceMonth);
  const { data, error } = await ctx.client
    .from("medical_production")
    .select("*")
    .eq("tenant_id", ctx.tenantId)
    .eq("competence_month", cm)
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw mapPostgresError(error);
  return (data ?? []) as MedicalProductionRow[];
}

/**
 * Consolida produção médica por guia na competência (lote fecha mês do lote; sem lote usa atendimento).
 * Glosas: soma `tiss_denials` exceto `reversed`.
 */
export async function syncMedicalProductionForCompetence(
  ctx: ServiceCtx,
  competenceMonth: string,
): Promise<{ upserted: number }> {
  assertCan(ctx.role, "payouts:write");
  const cm = normalizeCompetenceMonth(competenceMonth);
  await assertCompetenceEditableForBilling(ctx, cm);

  const { data: guides, error: gErr } = await ctx.client
    .from("tiss_guides")
    .select(
      "id, tenant_id, professional_id, batch_id, total_value, attendance_date, tiss_batches(competence)",
    )
    .eq("tenant_id", ctx.tenantId)
    .limit(8000);
  if (gErr) throw mapPostgresError(gErr);

  type GRow = {
    id: string;
    tenant_id: string;
    professional_id: string;
    batch_id: string | null;
    total_value: number;
    attendance_date: string;
    tiss_batches: { competence: string } | null;
  };

  const inMonth: GRow[] = [];
  for (const raw of guides ?? []) {
    const g = raw as GRow;
    const batchComp = g.tiss_batches?.competence ?? null;
    const gcm = competenceFromBatchOrAttendance(batchComp, g.attendance_date);
    if (gcm === cm) inMonth.push(g);
  }

  const guideIds = inMonth.map((g) => g.id);
  const deniedByGuide = new Map<string, number>();
  if (guideIds.length > 0) {
    const { data: denials, error: dErr } = await ctx.client
      .from("tiss_denials")
      .select("guide_id, denied_value, status")
      .eq("tenant_id", ctx.tenantId)
      .in("guide_id", guideIds)
      .neq("status", "reversed");
    if (dErr) throw mapPostgresError(dErr);
    for (const d of denials ?? []) {
      const gid = (d as { guide_id: string }).guide_id;
      const v = Number((d as { denied_value: number }).denied_value ?? 0);
      deniedByGuide.set(gid, (deniedByGuide.get(gid) ?? 0) + v);
    }
  }

  let upserted = 0;
  for (const g of inMonth) {
    const gross = Number(g.total_value ?? 0);
    const denied = Math.min(gross, deniedByGuide.get(g.id) ?? 0);
    const approved = Math.max(0, round2(gross - denied));

    const { error: uErr } = await ctx.client.from("medical_production").upsert(
      {
        tenant_id: ctx.tenantId,
        professional_id: g.professional_id,
        guide_id: g.id,
        batch_id: g.batch_id,
        competence_month: cm,
        gross_value: round2(gross),
        denied_value: round2(denied),
        approved_value: approved,
      },
      { onConflict: "tenant_id,guide_id" },
    );
    if (uErr) throw mapPostgresError(uErr);
    upserted += 1;
  }

  const { data: existingRows, error: exErr } = await ctx.client
    .from("medical_production")
    .select("id, guide_id")
    .eq("tenant_id", ctx.tenantId)
    .eq("competence_month", cm);
  if (exErr) throw mapPostgresError(exErr);
  const keep = new Set(guideIds);
  const staleIds = (existingRows ?? [])
    .filter((r) => !keep.has((r as { guide_id: string }).guide_id))
    .map((r) => (r as { id: string }).id);
  if (staleIds.length > 0) {
    const { error: delErr } = await ctx.client
      .from("medical_production")
      .delete()
      .in("id", staleIds);
    if (delErr) throw mapPostgresError(delErr);
  }

  await recordOperationalEventSafe(ctx, {
    entity_type: "medical_production",
    entity_id: ctx.tenantId,
    event_type: "medical_production_synced",
    severity: "info",
    description: `Produção médica sincronizada (${cm}).`,
    metadata: { competence_month: cm, guides: upserted },
  });

  return { upserted };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function loadProductionRanking(
  ctx: ServiceCtx,
  competenceMonth: string,
): Promise<
  { professional_id: string; approved_total: number; gross_total: number; guides: number }[]
> {
  const rows = await listMedicalProductionForCompetence(ctx, competenceMonth);
  const m = new Map<string, { approved_total: number; gross_total: number; guides: number }>();
  for (const r of rows) {
    const cur = m.get(r.professional_id) ?? { approved_total: 0, gross_total: 0, guides: 0 };
    cur.approved_total += Number(r.approved_value);
    cur.gross_total += Number(r.gross_value);
    cur.guides += 1;
    m.set(r.professional_id, cur);
  }
  return [...m.entries()]
    .map(([professional_id, v]) => ({ professional_id, ...v }))
    .sort((a, b) => b.approved_total - a.approved_total);
}

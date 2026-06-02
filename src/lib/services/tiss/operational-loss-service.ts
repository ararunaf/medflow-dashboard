import { assertCan } from "@/lib/auth/rbac";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { loadOperationalBillingSummary } from "./billing-foundation-service";

export type OperationalLossSnapshot = {
  /** Soma dos rollups `tenant` (exposição ainda não revertida). */
  totalDeniedExposure: number;
  /** Valor total das guias (mesma base do resumo de faturamento). */
  guidesBilledValueProxy: number;
  /** `totalDeniedExposure / guidesBilledValueProxy` quando denominador > 0. */
  deniedPercentOfGuidesValue: number | null;
  topInsuranceProviders: { insurance_provider_id: string; denied_exposure: number }[];
  topProfessionals: { professional_id: string; denied_exposure: number }[];
  topBatches: { batch_id: string; denied_exposure: number }[];
  topDenialReasons: { denial_reason_code: string; denied_exposure: number }[];
  /** Mês de competência ISO `YYYY-MM-01` ou null = janela móvel de 12 meses nos rankings. */
  competenceMonth: string | null;
};

function sumRollups(rows: { denied_exposure: number }[] | null): number {
  let t = 0;
  for (const r of rows ?? []) {
    t += Number(r.denied_exposure ?? 0);
  }
  return t;
}

function startOfUtcMonth(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function monthsAgoUtcFirstDay(months: number): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - months);
  d.setUTCDate(1);
  return startOfUtcMonth(d);
}

function topMerged(
  rows: { bucket_id: string; denied_exposure: number }[] | null,
  limit: number,
): { id: string; denied_exposure: number }[] {
  const m = new Map<string, number>();
  for (const r of rows ?? []) {
    const id = r.bucket_id;
    m.set(id, (m.get(id) ?? 0) + Number(r.denied_exposure ?? 0));
  }
  return [...m.entries()]
    .map(([id, denied_exposure]) => ({ id, denied_exposure }))
    .sort((a, b) => b.denied_exposure - a.denied_exposure)
    .slice(0, limit);
}

function topReasonsMerged(
  rows: { denial_reason_code: string; denied_exposure: number }[] | null,
  limit: number,
): { denial_reason_code: string; denied_exposure: number }[] {
  const m = new Map<string, number>();
  for (const r of rows ?? []) {
    const k = r.denial_reason_code || "_sem_codigo";
    m.set(k, (m.get(k) ?? 0) + Number(r.denied_exposure ?? 0));
  }
  return [...m.entries()]
    .map(([denial_reason_code, denied_exposure]) => ({ denial_reason_code, denied_exposure }))
    .sort((a, b) => b.denied_exposure - a.denied_exposure)
    .slice(0, limit);
}

/**
 * Painel financeiro operacional a partir de rollups incrementais (sem recomputar fatias globais).
 */
export async function loadOperationalLossSnapshot(
  ctx: ServiceCtx,
  competenceMonth: string | null,
): Promise<OperationalLossSnapshot> {
  assertCan(ctx.role, "tiss:read");
  const fromMonth = competenceMonth ?? monthsAgoUtcFirstDay(12);

  const tenantQ = ctx.client
    .from("tiss_denial_financial_rollups")
    .select("denied_exposure, competence_month")
    .eq("tenant_id", ctx.tenantId)
    .eq("bucket", "tenant")
    .eq("bucket_id", ctx.tenantId);
  const tenantRes = competenceMonth
    ? await tenantQ.eq("competence_month", competenceMonth)
    : await tenantQ.gte("competence_month", fromMonth);
  if (tenantRes.error) throw mapPostgresError(tenantRes.error);

  const rollupSlice = ctx.client
    .from("tiss_denial_financial_rollups")
    .select("bucket, bucket_id, denied_exposure, competence_month")
    .eq("tenant_id", ctx.tenantId)
    .gte("competence_month", competenceMonth ?? fromMonth);
  const rollupRes = competenceMonth
    ? await rollupSlice.eq("competence_month", competenceMonth)
    : await rollupSlice.limit(4000);
  if (rollupRes.error) throw mapPostgresError(rollupRes.error);

  const reasonQ = ctx.client
    .from("tiss_denial_reason_rollups")
    .select("denial_reason_code, denied_exposure, competence_month")
    .eq("tenant_id", ctx.tenantId)
    .gte("competence_month", competenceMonth ?? fromMonth);
  const reasonRes = competenceMonth
    ? await reasonQ.eq("competence_month", competenceMonth)
    : await reasonQ.limit(4000);
  if (reasonRes.error) throw mapPostgresError(reasonRes.error);

  const totalDeniedExposure = sumRollups(tenantRes.data);
  const billing = await loadOperationalBillingSummary(ctx);
  const guidesBilledValueProxy = billing.guidesTotalValue;
  const deniedPercentOfGuidesValue =
    guidesBilledValueProxy > 0 ? totalDeniedExposure / guidesBilledValueProxy : null;

  const provRows = (rollupRes.data ?? []).filter((r) => r.bucket === "insurance_provider");
  const profRows = (rollupRes.data ?? []).filter((r) => r.bucket === "professional");
  const batchRows = (rollupRes.data ?? []).filter((r) => r.bucket === "batch");

  const topInsuranceProviders = topMerged(
    provRows.map((r) => ({ bucket_id: r.bucket_id, denied_exposure: r.denied_exposure })),
    12,
  ).map((r) => ({ insurance_provider_id: r.id, denied_exposure: r.denied_exposure }));

  const topProfessionals = topMerged(
    profRows.map((r) => ({ bucket_id: r.bucket_id, denied_exposure: r.denied_exposure })),
    12,
  ).map((r) => ({ professional_id: r.id, denied_exposure: r.denied_exposure }));

  const topBatches = topMerged(
    batchRows.map((r) => ({ bucket_id: r.bucket_id, denied_exposure: r.denied_exposure })),
    12,
  ).map((r) => ({ batch_id: r.id, denied_exposure: r.denied_exposure }));

  const topDenialReasons = topReasonsMerged(reasonRes.data ?? [], 15);

  return {
    totalDeniedExposure,
    guidesBilledValueProxy,
    deniedPercentOfGuidesValue,
    topInsuranceProviders,
    topProfessionals,
    topBatches,
    topDenialReasons,
    competenceMonth,
  };
}

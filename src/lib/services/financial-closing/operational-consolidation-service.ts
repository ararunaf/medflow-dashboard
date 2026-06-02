import { assertCan } from "@/lib/auth/rbac";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import type { ServiceCtx } from "@/lib/services/operations/types";
import {
  listMedicalPayoutsForCompetence,
  listMedicalProductionForCompetence,
} from "@/lib/services/medical-payout";
import { normalizeCompetenceMonth } from "@/lib/services/medical-payout/production-service";
import type {
  OperationalConsolidationBundle,
  ProfessionalConsolidationRow,
  ProviderConsolidationRow,
} from "./types";

function sumPayoutFinal(payouts: { final_value: number; status: string }[]): number {
  let t = 0;
  for (const p of payouts) {
    if (
      p.status === "paid" ||
      p.status === "approved" ||
      p.status === "reviewed" ||
      p.status === "calculated"
    ) {
      t += Number(p.final_value);
    }
  }
  return Math.round(t * 100) / 100;
}

/** Consolidação operacional por competência (TISS + produção + repasses). */
export async function loadOperationalConsolidationBundle(
  ctx: ServiceCtx,
  competenceMonth: string,
): Promise<OperationalConsolidationBundle> {
  assertCan(ctx.role, "financial_closing:read");
  const cm = normalizeCompetenceMonth(competenceMonth);
  const [productions, payouts] = await Promise.all([
    listMedicalProductionForCompetence(ctx, cm),
    listMedicalPayoutsForCompetence(ctx, cm),
  ]);

  const guideIds = [...new Set(productions.map((p) => p.guide_id))];
  const guideToProvider = new Map<string, { insurance_provider_id: string }>();
  if (guideIds.length > 0) {
    const { data: guides, error: gErr } = await ctx.client
      .from("tiss_guides")
      .select("id, insurance_provider_id")
      .eq("tenant_id", ctx.tenantId)
      .in("id", guideIds);
    if (gErr) throw mapPostgresError(gErr);
    for (const g of guides ?? []) {
      guideToProvider.set(g.id, { insurance_provider_id: g.insurance_provider_id as string });
    }
  }

  const providerIds = [
    ...new Set([...guideToProvider.values()].map((v) => v.insurance_provider_id)),
  ];
  const providerNames = new Map<string, string>();
  if (providerIds.length > 0) {
    const { data: ips, error: ipErr } = await ctx.client
      .from("insurance_providers")
      .select("id, name")
      .eq("tenant_id", ctx.tenantId)
      .in("id", providerIds);
    if (ipErr) throw mapPostgresError(ipErr);
    for (const ip of ips ?? []) {
      providerNames.set(ip.id, String(ip.name));
    }
  }

  const professionalIds = [...new Set(productions.map((p) => p.professional_id))];
  const professionalNames = new Map<string, string>();
  if (professionalIds.length > 0) {
    const { data: pros, error: pErr } = await ctx.client
      .from("professionals")
      .select("id, profile_id, profiles(full_name)")
      .eq("tenant_id", ctx.tenantId)
      .in("id", professionalIds);
    if (pErr) throw mapPostgresError(pErr);
    for (const row of pros ?? []) {
      const pr = row as { id: string; profiles: { full_name: string } | null };
      professionalNames.set(pr.id, pr.profiles?.full_name?.trim() || pr.id.slice(0, 8));
    }
  }

  let total_billed = 0;
  let total_denied = 0;
  let total_approved = 0;
  const byProv = new Map<
    string,
    { guide_count: number; billed: number; denied: number; approved: number }
  >();
  const byPro = new Map<
    string,
    { guide_count: number; billed: number; denied: number; approved: number }
  >();

  for (const p of productions) {
    const g = Number(p.gross_value);
    const d = Number(p.denied_value);
    const a = Number(p.approved_value);
    total_billed += g;
    total_denied += d;
    total_approved += a;

    const pid = guideToProvider.get(p.guide_id)?.insurance_provider_id;
    if (pid) {
      const cur = byProv.get(pid) ?? { guide_count: 0, billed: 0, denied: 0, approved: 0 };
      cur.guide_count += 1;
      cur.billed += g;
      cur.denied += d;
      cur.approved += a;
      byProv.set(pid, cur);
    }

    const prId = p.professional_id;
    const pc = byPro.get(prId) ?? { guide_count: 0, billed: 0, denied: 0, approved: 0 };
    pc.guide_count += 1;
    pc.billed += g;
    pc.denied += d;
    pc.approved += a;
    byPro.set(prId, pc);
  }

  const total_payouts = sumPayoutFinal(payouts);
  const total_net_billed = Math.round((total_billed - total_denied) * 100) / 100;
  const operational_difference = Math.round((total_approved - total_payouts) * 100) / 100;

  const payoutByProf = new Map<string, number>();
  for (const py of payouts) {
    if (
      py.status === "paid" ||
      py.status === "approved" ||
      py.status === "reviewed" ||
      py.status === "calculated"
    ) {
      payoutByProf.set(
        py.professional_id,
        (payoutByProf.get(py.professional_id) ?? 0) + Number(py.final_value),
      );
    }
  }

  const by_provider: ProviderConsolidationRow[] = [...byProv.entries()].map(
    ([insurance_provider_id, v]) => ({
      insurance_provider_id,
      provider_name: providerNames.get(insurance_provider_id) ?? insurance_provider_id,
      guide_count: v.guide_count,
      total_billed: Math.round(v.billed * 100) / 100,
      total_denied: Math.round(v.denied * 100) / 100,
      total_approved: Math.round(v.approved * 100) / 100,
    }),
  );
  by_provider.sort((a, b) => b.total_approved - a.total_approved);

  const by_professional: ProfessionalConsolidationRow[] = [...byPro.entries()].map(
    ([professional_id, v]) => ({
      professional_id,
      display_name: professionalNames.get(professional_id) ?? professional_id.slice(0, 8),
      guide_count: v.guide_count,
      total_billed: Math.round(v.billed * 100) / 100,
      total_denied: Math.round(v.denied * 100) / 100,
      total_approved: Math.round(v.approved * 100) / 100,
      payout_final_value: Math.round((payoutByProf.get(professional_id) ?? 0) * 100) / 100,
    }),
  );
  by_professional.sort((a, b) => b.total_approved - a.total_approved);

  return {
    competence_month: cm,
    total_guides: productions.length,
    total_billed: Math.round(total_billed * 100) / 100,
    total_denied: Math.round(total_denied * 100) / 100,
    total_approved: Math.round(total_approved * 100) / 100,
    total_net_billed,
    total_payouts,
    operational_difference,
    by_provider,
    by_professional,
  };
}

export function bundleToSnapshotPayload(
  bundle: OperationalConsolidationBundle,
): Record<string, unknown> {
  return {
    competence_month: bundle.competence_month,
    totals: {
      total_guides: bundle.total_guides,
      total_billed: bundle.total_billed,
      total_denied: bundle.total_denied,
      total_approved: bundle.total_approved,
      total_net_billed: bundle.total_net_billed,
      total_payouts: bundle.total_payouts,
      operational_difference: bundle.operational_difference,
    },
    by_provider: bundle.by_provider.slice(0, 200),
    by_professional: bundle.by_professional.slice(0, 500),
  };
}

export function payoutDigestPayload(
  ctx: ServiceCtx,
  payouts: Awaited<ReturnType<typeof listMedicalPayoutsForCompetence>>,
): Record<string, unknown> {
  return {
    actor_profile_id: ctx.actorProfileId,
    rows: payouts.map((p) => ({
      id: p.id,
      professional_id: p.professional_id,
      status: p.status,
      final_value: p.final_value,
    })),
  };
}

function readNum(n: unknown, fallback = 0): number {
  if (typeof n === "number" && Number.isFinite(n)) return n;
  if (typeof n === "string" && n.trim() !== "") {
    const x = Number(n);
    return Number.isFinite(x) ? x : fallback;
  }
  return fallback;
}

/** Reidrata consolidação a partir de `consolidation_summary` persistido (competência travada/finalizada). */
export function operationalBundleFromSnapshotPayload(
  payload: unknown,
): OperationalConsolidationBundle | null {
  if (payload == null || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const cm = typeof p.competence_month === "string" ? p.competence_month : null;
  const totalsRaw = p.totals;
  if (!cm || !totalsRaw || typeof totalsRaw !== "object") return null;
  const t = totalsRaw as Record<string, unknown>;

  const parseProv = (v: unknown): ProviderConsolidationRow[] => {
    if (!Array.isArray(v)) return [];
    return v
      .filter((x): x is Record<string, unknown> => x != null && typeof x === "object")
      .map((x) => ({
        insurance_provider_id: String(x.insurance_provider_id ?? ""),
        provider_name: String(x.provider_name ?? ""),
        guide_count: readNum(x.guide_count),
        total_billed: readNum(x.total_billed),
        total_denied: readNum(x.total_denied),
        total_approved: readNum(x.total_approved),
      }));
  };

  const parsePro = (v: unknown): ProfessionalConsolidationRow[] => {
    if (!Array.isArray(v)) return [];
    return v
      .filter((x): x is Record<string, unknown> => x != null && typeof x === "object")
      .map((x) => ({
        professional_id: String(x.professional_id ?? ""),
        display_name: String(x.display_name ?? ""),
        guide_count: readNum(x.guide_count),
        total_billed: readNum(x.total_billed),
        total_denied: readNum(x.total_denied),
        total_approved: readNum(x.total_approved),
        payout_final_value: readNum(x.payout_final_value),
      }));
  };

  return {
    competence_month: cm,
    total_guides: readNum(t.total_guides),
    total_billed: readNum(t.total_billed),
    total_denied: readNum(t.total_denied),
    total_approved: readNum(t.total_approved),
    total_net_billed: readNum(t.total_net_billed),
    total_payouts: readNum(t.total_payouts),
    operational_difference: readNum(t.operational_difference),
    by_provider: parseProv(p.by_provider),
    by_professional: parsePro(p.by_professional),
  };
}

/**
 * Relatório de produção/repasse por grupo de trabalho — F5-S1.
 *
 * Reaproveita a agregação por profissional já existente e correta
 * (`loadOperationalConsolidationBundle`, mesma usada pelo dashboard
 * executivo) em vez de recalcular guia/produção/repasse do zero — só
 * adiciona uma camada de agrupamento por `professionals.work_group_id`
 * por cima do resultado já pronto.
 */
import { assertCan } from "@/lib/auth/rbac";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import { loadOperationalConsolidationBundle } from "@/lib/services/financial-closing/operational-consolidation-service";
import type { ProfessionalConsolidationRow } from "@/lib/services/financial-closing/types";
import type { ServiceCtx } from "@/lib/services/operations/types";

export type WorkGroupProductionRow = {
  workGroupId: string | null;
  workGroupName: string;
  professionalCount: number;
  guideCount: number;
  totalApproved: number;
  payoutFinalValue: number;
};

const NO_GROUP_KEY = "__sem_grupo__";
const NO_GROUP_LABEL = "Sem grupo";

/**
 * Pura: agrupa produção já calculada por profissional (vinda de
 * `loadOperationalConsolidationBundle`, a mesma fonte usada pelo
 * dashboard executivo) por grupo de trabalho. Não recalcula guia/
 * produção/repasse — só soma o que já está pronto por profissional.
 */
export function groupProductionByWorkGroup(
  byProfessional: readonly ProfessionalConsolidationRow[],
  groupByProfessional: ReadonlyMap<string, { id: string; name: string } | null>,
): WorkGroupProductionRow[] {
  const byGroup = new Map<string, WorkGroupProductionRow>();
  for (const p of byProfessional) {
    const group = groupByProfessional.get(p.professional_id) ?? null;
    const key = group?.id ?? NO_GROUP_KEY;
    const row = byGroup.get(key) ?? {
      workGroupId: group?.id ?? null,
      workGroupName: group?.name ?? NO_GROUP_LABEL,
      professionalCount: 0,
      guideCount: 0,
      totalApproved: 0,
      payoutFinalValue: 0,
    };
    row.professionalCount += 1;
    row.guideCount += p.guide_count;
    row.totalApproved += p.total_approved;
    row.payoutFinalValue += p.payout_final_value;
    byGroup.set(key, row);
  }

  return [...byGroup.values()]
    .map((r) => ({
      ...r,
      totalApproved: Math.round(r.totalApproved * 100) / 100,
      payoutFinalValue: Math.round(r.payoutFinalValue * 100) / 100,
    }))
    .sort((a, b) => b.totalApproved - a.totalApproved);
}

export async function buildWorkGroupProductionRows(
  ctx: ServiceCtx,
  competenceMonth: string,
): Promise<WorkGroupProductionRow[]> {
  assertCan(ctx.role, "financial_closing:read");

  const bundle = await loadOperationalConsolidationBundle(ctx, competenceMonth);

  const professionalIds = [...new Set(bundle.by_professional.map((p) => p.professional_id))];
  const groupByProfessional = new Map<string, { id: string; name: string } | null>();
  if (professionalIds.length > 0) {
    const { data, error } = await ctx.client
      .from("professionals")
      .select("id, work_group:work_groups!professionals_tenant_work_group_fk ( id, name )")
      .eq("tenant_id", ctx.tenantId)
      .in("id", professionalIds);
    if (error) throw mapPostgresError(error);
    for (const row of data ?? []) {
      groupByProfessional.set(row.id, row.work_group);
    }
  }

  return groupProductionByWorkGroup(bundle.by_professional, groupByProfessional);
}

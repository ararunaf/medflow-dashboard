/**
 * Resumos textuais curtos para observabilidade analítica (não BI pesado).
 */
import type { OperationalKpiId } from "@/lib/operations/analytics/kpi-registry";

export type OperationalSummaryInput = {
  primaryDays: number;
  avgCoveragePct: number;
  avgConfirmationRatePct: number;
  swapsRequested: number;
  avgPressureScore: number;
};

export function buildOperationalSummary(i: OperationalSummaryInput): string {
  const parts: string[] = [];
  parts.push(
    `Últimos ${i.primaryDays} dias: cobertura média ${Math.round(i.avgCoveragePct)}% e confirmação ${Math.round(i.avgConfirmationRatePct)}% nas decisões registradas.`,
  );
  if (i.swapsRequested > 0) {
    parts.push(`${i.swapsRequested} solicitações de swap no período.`);
  }
  if (i.avgPressureScore >= 42) {
    parts.push("Pressão média elevada — revisar filas de pendências e conflitos.");
  } else if (i.avgPressureScore >= 18) {
    parts.push("Pressão média moderada — manter ritmo de confirmações.");
  } else {
    parts.push("Pressão média baixa — operação estável no recorte analisado.");
  }
  return parts.join(" ");
}

export type WorkforceSummaryInput = {
  avgAvailabilityWindows: number | null;
  assignmentsCreated: number;
  avgShiftsWithoutCoveragePerDay: number;
};

export function buildWorkforceSummary(i: WorkforceSummaryInput): string {
  const parts: string[] = [];
  if (i.avgAvailabilityWindows != null && Number.isFinite(i.avgAvailabilityWindows)) {
    parts.push(
      `Disponibilidade média de ~${i.avgAvailabilityWindows.toFixed(1)} janelas por atualização registrada.`,
    );
  } else {
    parts.push("Poucos eventos de disponibilidade no período — série ainda fina.");
  }
  parts.push(
    `${i.assignmentsCreated} atribuições criadas; média de ${i.avgShiftsWithoutCoveragePerDay.toFixed(1)} plantões/dia sem cobertura confirmada.`,
  );
  return parts.join(" ");
}

export function kpiHint(id: OperationalKpiId): string {
  switch (id) {
    case "avg_coverage_pct":
      return "média diária (plantões com confirmação / ativos)";
    case "avg_confirmation_rate_pct":
      return "confirmadas / (confirmadas + recusadas) via eventos";
    case "avg_confirmation_latency_hours":
      return "criação → confirmação (amostra com par completo)";
    case "avg_swap_approval_latency_hours":
      return "pedido → aprovação (amostra com par completo)";
    case "avg_shifts_without_coverage_per_day":
      return "média diária na janela analítica";
    case "avg_conflict_shifts_per_day":
      return "conflitos sinalizados por dia (regra operacional)";
    case "avg_pressure_score":
      return "mesma fórmula do command center, média diária";
    case "avg_availability_windows":
      return "média em eventos availability_updated";
    case "swaps_requested":
      return "eventos swap_requested no período";
    case "assignments_created":
      return "eventos assignment_created no período";
    case "pending_assignments_now":
      return "snapshot atual do tenant";
    default:
      return "";
  }
}

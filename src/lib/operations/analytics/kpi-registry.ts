/**
 * Registro canônico de KPIs operacionais (analytics histórico).
 * IDs estáveis para evolução futura (IA, alertas, exports).
 */
export const OPERATIONAL_KPI_IDS = [
  "avg_coverage_pct",
  "avg_confirmation_rate_pct",
  "avg_confirmation_latency_hours",
  "avg_swap_approval_latency_hours",
  "avg_shifts_without_coverage_per_day",
  "avg_conflict_shifts_per_day",
  "avg_pressure_score",
  "avg_availability_windows",
  "swaps_requested",
  "assignments_created",
  "pending_assignments_now",
] as const;

export type OperationalKpiId = (typeof OPERATIONAL_KPI_IDS)[number];

export const OPERATIONAL_KPI_LABELS: Record<OperationalKpiId, string> = {
  avg_coverage_pct: "Cobertura média",
  avg_confirmation_rate_pct: "Taxa de confirmação",
  avg_confirmation_latency_hours: "Tempo médio de confirmação",
  avg_swap_approval_latency_hours: "Tempo médio de aprovação de swap",
  avg_shifts_without_coverage_per_day: "Plantões sem cobertura (média/dia)",
  avg_conflict_shifts_per_day: "Conflitos (média/dia)",
  avg_pressure_score: "Pressão operacional (score médio)",
  avg_availability_windows: "Disponibilidade (janelas médias)",
  swaps_requested: "Swaps solicitados",
  assignments_created: "Atribuições criadas",
  pending_assignments_now: "Atribuições pendentes (agora)",
};

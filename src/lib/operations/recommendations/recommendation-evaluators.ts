import { OPERATIONAL_ALERT_RULE_IDS } from "@/lib/operations/alerts/types";
import type { OperationalAlert, OperationalAlertRuleId } from "@/lib/operations/alerts/types";
import type { KpiValueMap } from "@/lib/operations/analytics/kpi-aggregators";
import {
  createOperationalRecommendation,
  defaultGuidanceBody,
  stateFromImprovingScore,
  stateFromWorseningScore,
} from "@/lib/operations/recommendations/recommendation-factories";
import type { OperationalCommandCenterCore } from "@/lib/operations/types/command-center-core";
import type { OperationalScoringResult } from "@/lib/operations/scoring/types";
import type {
  OperationalForecastBaseline,
  OperationalRecommendation,
} from "@/lib/operations/recommendations/types";

export type LiveRecommendationEvaluationContext = {
  core: OperationalCommandCenterCore;
  scoring: OperationalScoringResult;
  alertsById: ReadonlyMap<OperationalAlertRuleId, OperationalAlert>;
  forecast: OperationalForecastBaseline;
};

export function operationalAlertsByRuleId(
  alerts: readonly OperationalAlert[],
): Map<OperationalAlertRuleId, OperationalAlert> {
  const m = new Map<OperationalAlertRuleId, OperationalAlert>();
  for (const a of alerts) m.set(a.id, a);
  return m;
}

function totalProfessionalsProxy(core: OperationalCommandCenterCore): number {
  return Math.max(
    1,
    core.widgets.availableProfessionals + core.indicators.unavailableProfessionals,
  );
}

export function collectLiveWindowRecommendations(
  ctx: LiveRecommendationEvaluationContext,
): OperationalRecommendation[] {
  const { core, scoring, alertsById, forecast } = ctx;
  const items: OperationalRecommendation[] = [];

  const has = (id: OperationalAlertRuleId) => alertsById.has(id);
  const cr = scoring.scores.coverage_risk_score.value;
  const coord = scoring.scores.coordination_stress_score.value;
  const wf = scoring.scores.workforce_stability_score.value;
  const consolidated = scoring.consolidatedRiskScore;

  const coverageLowish =
    core.indicators.coveragePercent < 72 ||
    cr >= 38 ||
    has(OPERATIONAL_ALERT_RULE_IDS.coverageLow) ||
    has(OPERATIONAL_ALERT_RULE_IDS.coverageWatch);

  if (coverageLowish) {
    const state = stateFromWorseningScore(cr, 44, 62);
    items.push(
      createOperationalRecommendation({
        basis: "live",
        trigger: "coverage_low",
        type: "staffing",
        state,
        body: defaultGuidanceBody("coverage_low"),
        because: [
          `Cobertura na janela: ${core.indicators.coveragePercent}%`,
          `coverage_risk_score=${cr.toFixed(1)} (maior = pior)`,
          core.widgets.operationalCoveragePercent < 70
            ? `Cobertura operacional agregada ${core.widgets.operationalCoveragePercent}%`
            : `Cobertura operacional agregada ${core.widgets.operationalCoveragePercent}% (referência adicional)`,
        ],
        linkedAlertIds: [
          has(OPERATIONAL_ALERT_RULE_IDS.coverageLow)
            ? OPERATIONAL_ALERT_RULE_IDS.coverageLow
            : undefined,
          has(OPERATIONAL_ALERT_RULE_IDS.coverageWatch)
            ? OPERATIONAL_ALERT_RULE_IDS.coverageWatch
            : undefined,
        ].filter(Boolean) as OperationalAlertRuleId[] | undefined,
        linkedScoreIds: ["coverage_risk_score"],
        forecastProjection: forecast.projection,
        includeMitigationPlan: true,
      }),
    );
  }

  if (forecast.projection === "deteriorating" || forecast.projection === "critical_projection") {
    const state = forecast.projection === "critical_projection" ? "urgent" : "recommended";
    items.push(
      createOperationalRecommendation({
        basis: "live",
        trigger: "predicted_deterioration",
        type: forecast.projection === "critical_projection" ? "escalation" : "mitigation",
        state,
        title:
          forecast.projection === "critical_projection"
            ? "Revisão operacional imediata (baseline de forecast)"
            : undefined,
        body:
          forecast.projection === "critical_projection"
            ? `${defaultGuidanceBody("predicted_deterioration")} Projeção baseline: crítica — priorizar revisão conjunta da escala e das pendências.`
            : `${defaultGuidanceBody("predicted_deterioration")} Projeção baseline: deterioração provável sem mitigação.`,
        because: [...forecast.rationale, `consolidated_risk_score=${consolidated.toFixed(1)}`],
        linkedScoreIds: [
          "operational_health_score",
          "coverage_risk_score",
          "coordination_stress_score",
        ],
        forecastProjection: forecast.projection,
        includeMitigationPlan: true,
      }),
    );
  }

  if (consolidated >= 42 && scoring.healthState !== "healthy") {
    items.push(
      createOperationalRecommendation({
        basis: "live",
        trigger: "rising_risk",
        type: "monitoring",
        state: stateFromWorseningScore(consolidated, 52, 66),
        body: defaultGuidanceBody("rising_risk"),
        because: [
          `consolidated_risk_score=${consolidated.toFixed(1)}`,
          `Estado consolidado: ${scoring.healthState}`,
        ],
        linkedScoreIds: ["operational_health_score"],
        forecastProjection: forecast.projection,
      }),
    );
  }

  if (
    core.widgets.operationalPressure === "alta" ||
    coord >= 48 ||
    has(OPERATIONAL_ALERT_RULE_IDS.coordinationPressure)
  ) {
    items.push(
      createOperationalRecommendation({
        basis: "live",
        trigger: "operational_pressure",
        type: "coordination",
        state: stateFromWorseningScore(coord, 52, 64),
        body: defaultGuidanceBody("operational_pressure"),
        because: [
          `Pressão operacional: ${core.widgets.operationalPressure}`,
          `coordination_stress_score=${coord.toFixed(1)}`,
        ],
        linkedAlertIds: has(OPERATIONAL_ALERT_RULE_IDS.coordinationPressure)
          ? [OPERATIONAL_ALERT_RULE_IDS.coordinationPressure]
          : undefined,
        linkedScoreIds: ["coordination_stress_score"],
        includeMitigationPlan: true,
      }),
    );
  }

  const criticalSwap =
    core.coordination.swapsCritical.some((s) => s.critical) ||
    has(OPERATIONAL_ALERT_RULE_IDS.swapsCriticalHorizon);
  if (criticalSwap || core.indicators.swapsAwaitingApproval >= 6) {
    items.push(
      createOperationalRecommendation({
        basis: "live",
        trigger: "critical_swaps",
        type: "coordination",
        state:
          criticalSwap && core.coordination.swapsCritical.some((s) => s.critical)
            ? "urgent"
            : "recommended",
        body: defaultGuidanceBody("critical_swaps"),
        because: [
          `Swaps aguardando aprovação: ${core.indicators.swapsAwaitingApproval}`,
          `Swaps críticos no horizonte (48h): ${core.coordination.swapsCritical.filter((s) => s.critical).length}`,
        ],
        linkedAlertIds: [
          has(OPERATIONAL_ALERT_RULE_IDS.swapsCriticalHorizon)
            ? OPERATIONAL_ALERT_RULE_IDS.swapsCriticalHorizon
            : undefined,
          has(OPERATIONAL_ALERT_RULE_IDS.swapsQueuePressure)
            ? OPERATIONAL_ALERT_RULE_IDS.swapsQueuePressure
            : undefined,
        ].filter(Boolean) as OperationalAlertRuleId[] | undefined,
        includeMitigationPlan: true,
      }),
    );
  }

  const totalP = totalProfessionalsProxy(core);
  const unavailRatio = core.indicators.unavailableProfessionals / totalP;
  if (unavailRatio >= 0.38 || has(OPERATIONAL_ALERT_RULE_IDS.availabilityRisk) || wf < 52) {
    items.push(
      createOperationalRecommendation({
        basis: "live",
        trigger: "rising_unavailability",
        type: "staffing",
        state: stateFromImprovingScore(wf, 58, 46),
        body: defaultGuidanceBody("rising_unavailability"),
        because: [
          `Profissionais indisponíveis (proxy): ${core.indicators.unavailableProfessionals}/${totalP}`,
          `workforce_stability_score=${wf.toFixed(1)} (maior = melhor)`,
        ],
        linkedAlertIds: has(OPERATIONAL_ALERT_RULE_IDS.availabilityRisk)
          ? [OPERATIONAL_ALERT_RULE_IDS.availabilityRisk]
          : undefined,
        linkedScoreIds: ["workforce_stability_score"],
        includeMitigationPlan: true,
      }),
    );
  }

  if (
    core.indicators.pendingAssignments >= 4 ||
    has(OPERATIONAL_ALERT_RULE_IDS.assignmentsPending)
  ) {
    items.push(
      createOperationalRecommendation({
        basis: "live",
        trigger: "pending_assignments",
        type: "coordination",
        state: stateFromWorseningScore(core.indicators.pendingAssignments, 8, 18),
        body: defaultGuidanceBody("pending_assignments"),
        because: [`Assignments pendentes: ${core.indicators.pendingAssignments}`],
        linkedAlertIds: has(OPERATIONAL_ALERT_RULE_IDS.assignmentsPending)
          ? [OPERATIONAL_ALERT_RULE_IDS.assignmentsPending]
          : undefined,
        linkedScoreIds: ["coordination_stress_score"],
        includeMitigationPlan: true,
      }),
    );
  }

  if (
    core.widgets.operationalConflicts > 0 ||
    has(OPERATIONAL_ALERT_RULE_IDS.operationalConflicts)
  ) {
    items.push(
      createOperationalRecommendation({
        basis: "live",
        trigger: "operational_conflicts",
        type: "mitigation",
        state: stateFromWorseningScore(core.widgets.operationalConflicts, 1, 3),
        body: defaultGuidanceBody("operational_conflicts"),
        because: [`Conflitos sinalizados: ${core.widgets.operationalConflicts}`],
        linkedAlertIds: has(OPERATIONAL_ALERT_RULE_IDS.operationalConflicts)
          ? [OPERATIONAL_ALERT_RULE_IDS.operationalConflicts]
          : undefined,
        linkedScoreIds: ["coverage_risk_score", "coordination_stress_score"],
        includeMitigationPlan: true,
      }),
    );
  }

  return dedupeByIdKeepWorstState(items);
}

export type PeriodRecommendationEvaluationContext = {
  asOf: string;
  kpis: KpiValueMap;
  scoring: OperationalScoringResult;
  forecast: OperationalForecastBaseline;
};

export function collectPeriodRecommendations(
  ctx: PeriodRecommendationEvaluationContext,
): OperationalRecommendation[] {
  const { kpis, scoring, forecast } = ctx;
  const items: OperationalRecommendation[] = [];
  const cr = scoring.scores.coverage_risk_score.value;
  const coord = scoring.scores.coordination_stress_score.value;
  const wf = scoring.scores.workforce_stability_score.value;
  const consolidated = scoring.consolidatedRiskScore;

  const cov = kpis.avg_coverage_pct ?? null;
  const pending = kpis.pending_assignments_now ?? 0;
  const swaps = kpis.swaps_requested ?? 0;
  const conflicts = kpis.avg_conflict_shifts_per_day ?? 0;

  if (cov != null && (cov < 72 || cr >= 38)) {
    items.push(
      createOperationalRecommendation({
        basis: "period",
        trigger: "coverage_low",
        type: "staffing",
        state: stateFromWorseningScore(cr, 44, 62),
        body: defaultGuidanceBody("coverage_low"),
        because: [
          cov != null
            ? `Cobertura média (28d): ${cov.toFixed(1)}%`
            : "Cobertura média indisponível",
          `coverage_risk_score=${cr.toFixed(1)}`,
        ],
        linkedScoreIds: ["coverage_risk_score"],
        forecastProjection: forecast.projection,
        includeMitigationPlan: true,
      }),
    );
  }

  if (forecast.projection !== "stable") {
    const state = forecast.projection === "critical_projection" ? "urgent" : "recommended";
    items.push(
      createOperationalRecommendation({
        basis: "period",
        trigger: "predicted_deterioration",
        type: forecast.projection === "critical_projection" ? "escalation" : "mitigation",
        state,
        title:
          forecast.projection === "critical_projection"
            ? "Revisão operacional imediata (baseline de forecast — período)"
            : undefined,
        body:
          forecast.projection === "critical_projection"
            ? `${defaultGuidanceBody("predicted_deterioration")} Baseline de tendência: projeção crítica.`
            : `${defaultGuidanceBody("predicted_deterioration")} Baseline de tendência: deterioração.`,

        because: [...forecast.rationale],
        forecastProjection: forecast.projection,
        includeMitigationPlan: true,
      }),
    );
  }

  if (consolidated >= 42 && scoring.healthState !== "healthy") {
    items.push(
      createOperationalRecommendation({
        basis: "period",
        trigger: "rising_risk",
        type: "monitoring",
        state: stateFromWorseningScore(consolidated, 52, 66),
        body: defaultGuidanceBody("rising_risk"),
        because: [
          `consolidated_risk_score=${consolidated.toFixed(1)}`,
          `Estado consolidado: ${scoring.healthState}`,
        ],
        linkedScoreIds: ["operational_health_score"],
        forecastProjection: forecast.projection,
      }),
    );
  }

  if ((kpis.avg_pressure_score ?? 0) >= 28 || coord >= 48 || pending >= 12) {
    items.push(
      createOperationalRecommendation({
        basis: "period",
        trigger: "operational_pressure",
        type: "coordination",
        state: stateFromWorseningScore(coord, 50, 62),
        body: defaultGuidanceBody("operational_pressure"),
        because: [
          `Pressão média (28d): ${(kpis.avg_pressure_score ?? 0).toFixed(1)}`,
          `coordination_stress_score=${coord.toFixed(1)}`,
        ],
        linkedScoreIds: ["coordination_stress_score"],
        includeMitigationPlan: true,
      }),
    );
  }

  if (swaps >= 10 || coord >= 55) {
    items.push(
      createOperationalRecommendation({
        basis: "period",
        trigger: "critical_swaps",
        type: "monitoring",
        state: swaps >= 24 ? "urgent" : "recommended",
        body: defaultGuidanceBody("critical_swaps"),
        because: [`Volume de swaps solicitados (28d): ${swaps}`],
        includeMitigationPlan: true,
      }),
    );
  }

  const avail = kpis.avg_availability_windows ?? null;
  if ((avail != null && avail < 2.2) || wf < 52) {
    items.push(
      createOperationalRecommendation({
        basis: "period",
        trigger: "rising_unavailability",
        type: "staffing",
        state: stateFromImprovingScore(wf, 58, 46),
        body: defaultGuidanceBody("rising_unavailability"),
        because: [
          avail != null
            ? `Média de janelas de disponibilidade/dia: ${avail.toFixed(2)}`
            : "Disponibilidade média indisponível",
          `workforce_stability_score=${wf.toFixed(1)}`,
        ],
        linkedScoreIds: ["workforce_stability_score"],
        includeMitigationPlan: true,
      }),
    );
  }

  if (pending >= 8) {
    items.push(
      createOperationalRecommendation({
        basis: "period",
        trigger: "pending_assignments",
        type: "coordination",
        state: stateFromWorseningScore(pending, 14, 28),
        body: defaultGuidanceBody("pending_assignments"),
        because: [`Assignments pendentes (instantâneo no fim do período): ${pending}`],
        linkedScoreIds: ["coordination_stress_score"],
        includeMitigationPlan: true,
      }),
    );
  }

  if (conflicts >= 0.35) {
    items.push(
      createOperationalRecommendation({
        basis: "period",
        trigger: "operational_conflicts",
        type: "mitigation",
        state: stateFromWorseningScore(conflicts * 20, 4, 8),
        body: defaultGuidanceBody("operational_conflicts"),
        because: [`Média de plantões com conflito/dia: ${conflicts.toFixed(2)}`],
        linkedScoreIds: ["coordination_stress_score", "coverage_risk_score"],
        includeMitigationPlan: true,
      }),
    );
  }

  return dedupeByIdKeepWorstState(items);
}

const STATE_RANK = { suggested: 0, recommended: 1, urgent: 2 } as const;

function dedupeByIdKeepWorstState(items: OperationalRecommendation[]): OperationalRecommendation[] {
  const byId = new Map<string, OperationalRecommendation>();
  for (const it of items) {
    const prev = byId.get(it.id);
    if (!prev || STATE_RANK[it.state] > STATE_RANK[prev.state]) {
      byId.set(it.id, it);
    }
  }
  return [...byId.values()];
}

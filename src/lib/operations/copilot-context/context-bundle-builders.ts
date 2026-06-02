import type { OperationalAnalyticsSnapshot } from "@/lib/operations/analytics/operational-analytics-service";
import {
  OPERATIONAL_KPI_LABELS,
  type OperationalKpiId,
} from "@/lib/operations/analytics/kpi-registry";
import type {
  ContextProvenanceRef,
  OperationalContextBundle,
  OperationalContextExplainability,
  OperationalContextSections,
  OperationalCopilotContextLiveInput,
} from "@/lib/operations/copilot-context/types";
import { OPERATIONAL_COPILOT_CONTEXT_SCHEMA_VERSION } from "@/lib/operations/copilot-context/types";
import {
  riskSummaryLines,
  sortRecommendationsForCoordinator,
  summarizeCoordinatorContext,
} from "@/lib/operations/copilot-context/context-summarizers";
import {
  fingerprintOperationalContext,
  operationalSemanticTagsFromLiveState,
  pressureLabelPt,
  urgencyLabelPt,
} from "@/lib/operations/copilot-context/semantic-operational-helpers";
import type { OperationalScoreId } from "@/lib/operations/scoring/types";
import { OPERATIONAL_SCORE_IDS } from "@/lib/operations/scoring/types";

function buildProvenance(input: {
  scoring: OperationalCopilotContextLiveInput["snapshot"]["scoring"];
  alerts: OperationalCopilotContextLiveInput["alerts"];
  recommendations: OperationalCopilotContextLiveInput["snapshot"]["recommendations"];
  analytics?: OperationalAnalyticsSnapshot | null;
  timelineEventIds?: string[];
}): ContextProvenanceRef[] {
  const refs: ContextProvenanceRef[] = [];
  for (const id of OPERATIONAL_SCORE_IDS) {
    const snap = input.scoring.scores[id as OperationalScoreId];
    if (snap) refs.push({ kind: "score", id: id as OperationalScoreId, value: snap.value });
  }
  for (const a of input.alerts) {
    refs.push({ kind: "alert", id: a.id, severity: a.severity });
  }
  refs.push({
    kind: "forecast",
    projection: input.recommendations.forecast.projection,
  });
  for (const r of input.recommendations.items.slice(0, 15)) {
    refs.push({ kind: "recommendation", id: r.id, trigger: r.trigger });
  }
  if (input.analytics) {
    const kpis: OperationalKpiId[] = [
      "avg_coverage_pct",
      "avg_pressure_score",
      "avg_confirmation_rate_pct",
      "pending_assignments_now",
    ];
    for (const id of kpis) {
      refs.push({
        kind: "kpi",
        id,
        note: "analytics_primary_window",
      });
    }
  }
  if (input.timelineEventIds?.length) {
    for (const id of input.timelineEventIds.slice(0, 12)) {
      refs.push({ kind: "timeline_event", id });
    }
  }
  return refs;
}

function buildExplainability(input: {
  scope: OperationalContextBundle["scope"];
  snapshot: OperationalCopilotContextLiveInput["snapshot"];
  alerts: OperationalCopilotContextLiveInput["alerts"];
  analytics: OperationalAnalyticsSnapshot | null | undefined;
  timelineAttached: boolean;
  provenance: ContextProvenanceRef[];
}): OperationalContextExplainability {
  const sourceSummary = [
    `snapshot.command_center.as_of=${input.snapshot.asOf}`,
    `alerts.count=${input.alerts.length}`,
    `recommendations.count=${input.snapshot.recommendations.items.length}`,
    `forecast.projection=${input.snapshot.recommendations.forecast.projection}`,
  ];
  if (input.analytics) {
    sourceSummary.push(`analytics.primary.to=${input.analytics.primary.toISO}`);
  }
  if (input.timelineAttached) sourceSummary.push("timeline.slice=attached");
  else sourceSummary.push("timeline.slice=not_attached");

  const fingerprint = fingerprintOperationalContext({
    asOf: input.snapshot.asOf,
    healthState: input.snapshot.scoring.healthState,
    consolidatedRisk: input.snapshot.scoring.consolidatedRiskScore,
    alertRuleIds: input.alerts.map((a) => a.id),
    recommendationIds: input.snapshot.recommendations.items.map((r) => r.id),
    forecastProjection: input.snapshot.recommendations.forecast.projection,
  });

  return {
    deterministic: true,
    derivedFrom: input.scope,
    sourceSummary,
    provenance: input.provenance,
    fingerprint,
  };
}

function buildKpiTrendSection(
  analytics: OperationalAnalyticsSnapshot,
): OperationalContextSections["kpiTrendDigest"] {
  const bullets: string[] = [analytics.summaries.operational, analytics.summaries.workforce];
  const p = analytics.kpis.deltaPct.avg_pressure_score;
  if (p != null && Number.isFinite(p)) {
    bullets.push(
      `${OPERATIONAL_KPI_LABELS.avg_pressure_score}: variação ${p > 0 ? "+" : ""}${Math.round(p * 10) / 10}% vs período anterior`,
    );
  }
  const lastCov = analytics.trends.miniCoverage.at(-1)?.value;
  if (lastCov != null && Number.isFinite(lastCov)) {
    bullets.push(`Último ponto mini-cobertura diária: ${Math.round(lastCov * 10) / 10}%`);
  }
  return {
    title: "KPIs e tendências (período)",
    bullets: bullets.slice(0, 8),
    semanticTags: ["layer:analytics", `scoring.basis:${analytics.scoring.basis}`],
  };
}

export function buildLiveOperationalContextBundle(
  raw: OperationalCopilotContextLiveInput,
): OperationalContextBundle {
  const { snapshot, alerts, analytics, timeline } = raw;
  const scoring = snapshot.scoring;
  const recs = snapshot.recommendations;
  const sortedRecs = sortRecommendationsForCoordinator(recs.items);
  const coordinatorSummary = summarizeCoordinatorContext({
    scoring,
    alerts,
    recommendations: recs.items,
  });

  const globalTags = operationalSemanticTagsFromLiveState({
    scoring,
    pressure: snapshot.widgets.operationalPressure,
    urgency: snapshot.coordination.urgency,
  });

  const currentOperationalState: OperationalContextSections["currentOperationalState"] = {
    title: "Estado operacional atual",
    urgencyLabel: urgencyLabelPt(snapshot.coordination.urgency),
    pressureLabel: pressureLabelPt(snapshot.widgets.operationalPressure),
    bullets: [
      `${snapshot.coordination.coverageOverview} ${snapshot.coordination.conflictsOverview}`.trim(),
      `Pressão: ${pressureLabelPt(snapshot.widgets.operationalPressure)} · urgência: ${urgencyLabelPt(snapshot.coordination.urgency)}`,
      `Cobertura operacional agregada: ${snapshot.widgets.operationalCoveragePercent}% · cobertura indicador: ${snapshot.indicators.coveragePercent}%`,
      `Confirmações na amostra: ${snapshot.indicators.confirmationRatePercent}%`,
    ],
    semanticTags: [
      ...globalTags.filter(
        (t) => t.startsWith("health:") || t.startsWith("pressure:") || t.startsWith("urgency:"),
      ),
    ],
  };

  const currentRisks: OperationalContextSections["currentRisks"] = {
    title: "Riscos atuais",
    bullets: riskSummaryLines(scoring, alerts),
    semanticTags: ["layer:risk", `alerts.total:${alerts.length}`],
  };

  const predictedDeterioration: OperationalContextSections["predictedDeterioration"] = {
    title: "Deterioração prevista (baseline)",
    forecastProjection: recs.forecast.projection,
    bullets: [
      `Projeção: ${recs.forecast.projection}`,
      ...recs.forecast.rationale,
      `Itens de recomendação considerados: ${recs.items.length}`,
    ],
    semanticTags: [`forecast:${recs.forecast.projection}`, `basis:${recs.forecast.basis}`],
  };

  const operationalPressure: OperationalContextSections["operationalPressure"] = {
    title: "Pressão operacional",
    bullets: [
      `Nível declarado: ${pressureLabelPt(snapshot.widgets.operationalPressure)}`,
      `coordination_stress_score=${scoring.scores.coordination_stress_score.value.toFixed(1)} (maior = pior)`,
      `Pendências: assignments ${snapshot.indicators.pendingAssignments} · swaps aguardando ${snapshot.indicators.swapsAwaitingApproval}`,
    ],
    semanticTags: [`pressure:${snapshot.widgets.operationalPressure}`, "layer:pressure"],
  };

  const coordinatorPriorities: OperationalContextSections["coordinatorPriorities"] = {
    title: "Prioridades do coordenador",
    orderedRecommendationIds: sortedRecs.map((r) => r.id),
    bullets: sortedRecs.slice(0, 6).map((r) => `[${r.state}] ${r.title}`),
    semanticTags: ["layer:priorities"],
  };

  const topItems = sortedRecs.slice(0, 5).map((r) => ({
    id: r.id,
    title: r.title,
    state: r.state,
    trigger: r.trigger,
  }));

  const recommendationHighlights: OperationalContextSections["recommendationHighlights"] = {
    title: "Destaques de recomendações",
    topItems,
    bullets: topItems.map((r) => `${r.title} — gatilho ${r.trigger}`),
    semanticTags: ["layer:recommendations"],
  };

  const timelineAttached = !!(timeline && timeline.lines.length > 0);
  const recentOperationalEvents: OperationalContextSections["recentOperationalEvents"] = {
    title: "Eventos operacionais recentes",
    timelineAttached,
    bullets: timelineAttached
      ? timeline!.lines.slice(0, 8)
      : [
          "Nenhuma fatia de timeline foi anexada a este bundle (evita query redundante na construção padrão).",
          "A UI pode opcionalmente anexar linhas da primeira página da timeline.",
        ],
    semanticTags: timelineAttached
      ? ["layer:timeline", `sample:${timeline?.sampleSize ?? 0}`]
      : ["layer:timeline", "status:detached"],
  };

  const learning = snapshot.recommendationFeedback.learningSignals.slice(0, 8);
  const learningSignals: OperationalContextSections["learningSignals"] = {
    title: "Sinais de aprendizado",
    bullets: learning.map((s) => `${s.headline}: ${s.detail}`),
    semanticTags: [
      "layer:learning",
      `feedback.window:${snapshot.recommendationFeedback.window.toISO}`,
    ],
  };

  const kpiTrendDigest = analytics ? buildKpiTrendSection(analytics) : null;

  const sections: OperationalContextSections = {
    currentOperationalState,
    currentRisks,
    predictedDeterioration,
    operationalPressure,
    coordinatorPriorities,
    recommendationHighlights,
    recentOperationalEvents,
    learningSignals,
    kpiTrendDigest,
  };

  const scope: OperationalContextBundle["scope"] = analytics ? "merged" : "live_command_center";

  const provenance = buildProvenance({
    scoring,
    alerts,
    recommendations: recs,
    analytics: analytics ?? null,
    timelineEventIds: timeline?.eventIds,
  });
  for (const s of learning) {
    provenance.push({ kind: "feedback_signal", id: s.id });
  }

  const explainability = buildExplainability({
    scope,
    snapshot,
    alerts,
    analytics: analytics ?? null,
    timelineAttached,
    provenance,
  });

  return {
    schemaVersion: OPERATIONAL_COPILOT_CONTEXT_SCHEMA_VERSION,
    scope,
    asOf: snapshot.asOf,
    window: snapshot.window,
    signals: {
      healthState: scoring.healthState,
      consolidatedRiskScore: scoring.consolidatedRiskScore,
      operationalHealthScore: scoring.operationalHealthScore,
    },
    coordinatorSummary,
    sections,
    explainability,
  };
}

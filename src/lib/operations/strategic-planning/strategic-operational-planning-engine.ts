/**
 * Motor de composição do planejamento operacional estratégico supervisionado.
 * Agrega forecast baseline, memória operacional (via sinais adaptativos), policy intelligence
 * e pressão da central — determinístico e com limites explícitos de tamanho.
 */
import type { AdaptivePrioritizationLayerSummary } from "@/lib/operations/adaptive-prioritization/types";
import type { OperationalMemoryLayerSummary } from "@/lib/operations/operational-memory/types";
import type { AdaptiveRecommendationBundle } from "@/lib/operations/adaptive-prioritization";
import type { OperationalScoringResult } from "@/lib/operations/scoring/types";
import type { OperationalCommandCenterCore } from "@/lib/operations/types/command-center-core";
import type { OperationalPolicyIntelligenceLayerSummary } from "@/lib/services/operations/operational-policy-intelligence-service";
import { buildMitigationRoadmapCard } from "./mitigation-roadmap-builder";
import { buildOperationalReadinessSummary } from "./operational-readiness-engine";
import {
  analyzeOrchestrationCapacity,
  buildOrchestrationPreparednessIndicator,
} from "./orchestration-capacity-analyzer";
import { buildGovernancePreparednessInsight } from "./strategic-governance-preparation-engine";
import type {
  StrategicOperationalPlanningBundle,
  StrategicPlanningExplainability,
  StrategicStressProjection,
} from "./types";

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

function levelFromScore(score: number): StrategicStressProjection["level"] {
  if (score >= 0.72) return "high";
  if (score >= 0.42) return "moderate";
  return "low";
}

function riskFromHealth(h: OperationalScoringResult["healthState"]): number {
  if (h === "critical") return 0.92;
  if (h === "warning") return 0.68;
  if (h === "attention") return 0.48;
  return 0.22;
}

function forecastStress(fp: AdaptiveRecommendationBundle["forecast"]["projection"]): number {
  if (fp === "critical_projection") return 0.9;
  if (fp === "deteriorating") return 0.62;
  return 0.25;
}

export function composeStrategicOperationalPlanningBundle(input: {
  core: OperationalCommandCenterCore;
  scoring: OperationalScoringResult;
  recommendations: AdaptiveRecommendationBundle;
  operationalMemory: OperationalMemoryLayerSummary;
  adaptivePrioritization: AdaptivePrioritizationLayerSummary;
  policyIntelligence: OperationalPolicyIntelligenceLayerSummary;
  orchestrationActiveCount: number;
}): StrategicOperationalPlanningBundle {
  const w = input.core.widgets;
  const ind = input.core.indicators;
  const coord = input.core.coordination;
  const fc = input.recommendations.forecast;
  const signals = input.adaptivePrioritization.signals;

  const totalProfessionals = w.availableProfessionals + ind.unavailableProfessionals;
  const staffingRatio =
    totalProfessionals > 0 ? 1 - w.availableProfessionals / totalProfessionals : 0.5;
  const staffingScore = clamp01(
    staffingRatio * 0.45 +
      clamp01(ind.pendingAssignments / 20) * 0.3 +
      clamp01(ind.unconfirmedStartingWithin24h / 8) * 0.25,
  );

  const escalationScore = clamp01(
    forecastStress(fc.projection) * 0.55 + riskFromHealth(input.scoring.healthState) * 0.45,
  );

  const orchCap = analyzeOrchestrationCapacity({
    orchestrationActiveCount: input.orchestrationActiveCount,
    pendingSwaps: w.pendingSwaps,
    openShifts: w.openShifts,
    coordinationUrgency: coord.urgency,
  });

  const mitCount = input.recommendations.items.filter(
    (i) => i.type === "mitigation" || i.type === "escalation",
  ).length;
  const mitigationScore = clamp01(
    clamp01(mitCount / 8) * 0.55 + forecastStress(fc.projection) * 0.45,
  );

  const coordScore = clamp01(
    (w.operationalPressure === "alta" ? 0.85 : w.operationalPressure === "moderada" ? 0.55 : 0.25) *
      0.55 +
      (coord.urgency === "critica" ? 0.9 : coord.urgency === "elevada" ? 0.55 : 0.2) * 0.45,
  );

  const deterioration = signals.deteriorationRecurrence ?? 0;
  const rollback = signals.rollbackFrequency ?? 0;
  const opStressScore = clamp01(
    riskFromHealth(input.scoring.healthState) * 0.35 +
      clamp01(input.scoring.consolidatedRiskScore / 100) * 0.35 +
      deterioration * 0.15 +
      rollback * 0.15,
  );

  const stressProjections: StrategicStressProjection[] = [
    {
      code: "staffing_demand",
      label: "Demanda de staffing",
      level: levelFromScore(staffingScore),
      score: staffingScore,
      rationale: [
        `Plantões abertos: ${w.openShifts}; assignments pendentes: ${ind.pendingAssignments}.`,
        `Profissionais com disponibilidade ativa: ${w.availableProfessionals}/${totalProfessionals || "?"}.`,
      ].slice(0, 4),
      references: [
        { kind: "widget", ref: "open_shifts" },
        { kind: "widget", ref: "pending_assignments" },
        { kind: "forecast", ref: fc.projection },
      ],
    },
    {
      code: "escalation_pressure",
      label: "Pressão de escalonamento",
      level: levelFromScore(escalationScore),
      score: escalationScore,
      rationale: [
        `Forecast baseline: ${fc.projection} (${fc.basis}).`,
        `Health operacional: ${input.scoring.healthState}.`,
        ...fc.rationale.slice(0, 2),
      ].slice(0, 4),
      references: [
        { kind: "forecast", ref: fc.projection },
        { kind: "health_state", ref: input.scoring.healthState },
      ],
    },
    {
      code: "orchestration_saturation",
      label: "Saturação de orquestração",
      level: orchCap.level,
      score: orchCap.saturationScore,
      rationale: orchCap.rationale,
      references: orchCap.references,
    },
    {
      code: "mitigation_demand",
      label: "Demanda de mitigação",
      level: levelFromScore(mitigationScore),
      score: mitigationScore,
      rationale: [
        `${mitCount} recomendações de mitigação/escalonamento no bundle atual.`,
        `Recorrência de deterioração (memória adaptativa): ${(deterioration * 100).toFixed(0)}%.`,
      ],
      references: [{ kind: "recommendation_bundle", ref: input.recommendations.computedAt }],
    },
    {
      code: "coordination_overload",
      label: "Sobrecarga de coordenação",
      level: levelFromScore(coordScore),
      score: coordScore,
      rationale: [
        `Pressão operacional: ${w.operationalPressure}; urgência: ${coord.urgency}.`,
        signals.sampleNotes[0]
          ? `Sinais adaptativos: ${signals.sampleNotes[0]}`
          : "Sinais adaptativos dentro do esperado.",
      ].slice(0, 4),
      references: [{ kind: "coordination", ref: coord.urgency }],
    },
    {
      code: "operational_stress",
      label: "Stress operacional consolidado",
      level: levelFromScore(opStressScore),
      score: opStressScore,
      rationale: [
        `Risco consolidado (scoring): ${input.scoring.consolidatedRiskScore.toFixed(1)}.`,
        `Rollback freq. ${(rollback * 100).toFixed(0)}% · deterioração ${(deterioration * 100).toFixed(0)}%.`,
      ],
      references: [{ kind: "score", ref: "consolidated_risk" }],
    },
  ];

  const govInsight = buildGovernancePreparednessInsight({ policyLayer: input.policyIntelligence });
  const readiness = buildOperationalReadinessSummary({
    stressProjections,
    orchestrationSaturationScore: orchCap.saturationScore,
    governanceReadinessScore: govInsight.readinessScore,
  });

  const horizonDays = 7;
  const mitigationRoadmap = buildMitigationRoadmapCard({
    items: input.recommendations.items,
    horizonDays,
  });

  const staffingPreparation = {
    title: "Plano de preparação de staffing",
    bullets: [
      `Priorizar confirmações nas próximas ${horizonDays}d se unconfirmed24h=${ind.unconfirmedStartingWithin24h}.`,
      `Mapear profissionais sem disponibilidade ativa (${ind.unavailableProfessionals}) vs demanda de plantões abertos.`,
      "Alinhar swaps críticos com owners de departamento antes de novas orquestrações.",
    ],
    horizonDays,
    references: [
      { kind: "indicator", ref: "unconfirmedStartingWithin24h" },
      { kind: "widget", ref: "open_shifts" },
    ],
  };

  const orchestrationReadiness = {
    title: "Plano de readiness de orquestração",
    bullets: buildOrchestrationPreparednessIndicator({
      orchestrationActiveCount: input.orchestrationActiveCount,
      pendingSwaps: w.pendingSwaps,
      openShifts: w.openShifts,
      coordinationUrgency: coord.urgency,
    }).checklist,
    horizonDays,
    references: [{ kind: "orchestration", ref: "active_count" }],
  };

  const escalationPreparedness = {
    title: "Preparação para escalonamento",
    bullets: [
      fc.projection === "critical_projection"
        ? "Activar roteiro de crise: dois gestores, revisão horária de swaps e assignments."
        : fc.projection === "deteriorating"
          ? "Calendarizar checkpoint de mitigação em 24–48h com registro em memória operacional."
          : "Manter checkpoint leve semanal com evidências de forecast vs health.",
      `Pressão operacional ${w.operationalPressure} — ${coord.conflictsOverview.slice(0, 120)}`,
    ],
    horizonDays,
    references: [{ kind: "forecast", ref: fc.projection }],
  };

  const governancePreparedness = {
    title: "Plano de preparação de governança",
    bullets: [
      ...govInsight.boundaries.slice(0, 2),
      govInsight.policyCycleRef
        ? `Amarrar decisões ao ciclo de policy intelligence ${govInsight.policyCycleRef.slice(0, 8)}…`
        : "Rodar policy intelligence supervisionada para ancorar o próximo ciclo de planejamento.",
    ],
    horizonDays,
    references: govInsight.policyCycleRef
      ? [{ kind: "policy_intelligence_cycle", ref: govInsight.policyCycleRef }]
      : [],
  };

  const explainability: StrategicPlanningExplainability = {
    planningRationale: [
      "Projeções derivadas do snapshot da central (janela curta) + sinais adaptativos já agregados.",
      "Forecast baseline reutilizado sem recalcular tendências históricas completas.",
      "Orquestração: apenas contagem de instâncias ativas + pressão de fila — O(1) no tenant.",
    ],
    forecastRefs: [
      { projection: fc.projection, basis: fc.basis, rationale: fc.rationale.slice(0, 4) },
    ],
    orchestrationRefs: orchCap.references,
    governanceRefs: govInsight.policyCycleRef
      ? [{ kind: "policy_intelligence_cycle", ref: govInsight.policyCycleRef }]
      : [],
    strategicNarrative: [],
    readinessExplainability: readiness.dimensions.map(
      (d) => `${d.label}: ${(d.score * 100).toFixed(0)}% — ${d.note}`,
    ),
  };

  const strategicNarrative = [
    `Readiness ${(readiness.overallScore * 100).toFixed(0)}% com forecast ${fc.projection} e urgência ${coord.urgency}.`,
    orchCap.level !== "low"
      ? `Saturação de orquestração ${orchCap.level} — espaço cognitivo do time deve ser preservado.`
      : "Capacidade de orquestração confortável para novos fluxos supervisionados.",
    govInsight.readinessScore < 0.55
      ? "Governança de políticas requer atenção antes de expandir iniciativas paralelas."
      : "Governança de políticas coerente com o digest atual — revisão humana de rotina.",
  ];
  explainability.strategicNarrative = strategicNarrative;

  const pipelineTrace = {
    completed: ["projected", "analyzed", "planned"] as Array<"projected" | "analyzed" | "planned">,
    computedAt: input.core.asOf,
  };

  return {
    schemaVersion: "1.0.0",
    computedAt: input.core.asOf,
    pipelineTrace,
    stressProjections,
    readiness,
    outputs: {
      staffingPreparation,
      orchestrationReadiness,
      mitigationRoadmap,
      escalationPreparedness,
      governancePreparedness,
    },
    orchestrationPreparedness: buildOrchestrationPreparednessIndicator({
      orchestrationActiveCount: input.orchestrationActiveCount,
      pendingSwaps: w.pendingSwaps,
      openShifts: w.openShifts,
      coordinationUrgency: coord.urgency,
    }),
    governanceInsight: govInsight,
    explainability,
    governance: {
      supervisionRequired: true,
      planningBoundaries: [
        "Sem auto-execução de planos; sem auto-governança; sem planejamento autônomo.",
        "Projeções limitadas à janela da central e a sinais já materializados — sem replanejamento em loop.",
      ],
    },
  };
}

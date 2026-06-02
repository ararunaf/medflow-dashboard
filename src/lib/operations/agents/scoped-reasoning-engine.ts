import type { OperationalAgentType } from "@/lib/database.types";
import type { OperationalCommandCenterSnapshot } from "@/lib/operations/api/queries/command-center";
import type {
  OperationalAgentExplainabilityRef,
  OperationalAgentReasoningSurface,
} from "@/lib/operations/agents/contracts";
import { assertTriggerInAgentDomain } from "@/lib/operations/agents/governance";
import type { OrchestrationAgentAdapterContext } from "@/lib/operations/agents/orchestration-adapter";
import {
  getOperationalAgentRegistryEntry,
  OPERATIONAL_AGENT_REGISTRY,
} from "@/lib/operations/agents/registry";
import type { OperationalRecommendation } from "@/lib/operations/recommendations/types";
import type {
  OperationalScoreSnapshot,
  OperationalScoringResult,
} from "@/lib/operations/scoring/types";

function scoreRefs(
  snapshot: OperationalCommandCenterSnapshot,
): OperationalAgentExplainabilityRef[] {
  const scores = snapshot.scoring.scores as OperationalScoringResult["scores"];
  return (Object.keys(scores) as (keyof typeof scores)[]).map((k) => {
    const s = scores[k] as OperationalScoreSnapshot;
    return {
      kind: "score" as const,
      scoreId: s.id,
      value: s.value,
      label: s.label,
    };
  });
}

function forecastRef(
  snapshot: OperationalCommandCenterSnapshot,
): OperationalAgentExplainabilityRef {
  const f = snapshot.recommendations.forecast;
  return {
    kind: "forecast",
    projection: f.projection,
    basis: f.basis,
    computedAt: f.computedAt,
  };
}

function recommendationsForAgent(
  agent: OperationalAgentType,
  items: OperationalRecommendation[],
): OperationalRecommendation[] {
  if (agent === "recommendation_agent") {
    return [...items].sort((a, b) => {
      const rank = (s: string) => (s === "urgent" ? 2 : s === "recommended" ? 1 : 0);
      return rank(b.state) - rank(a.state);
    });
  }
  return items.filter((it) => assertTriggerInAgentDomain(agent, it.trigger));
}

function recommendationRefs(
  items: OperationalRecommendation[],
): OperationalAgentExplainabilityRef[] {
  return items.slice(0, 8).map((it) => ({
    kind: "recommendation" as const,
    recommendationId: it.id,
    title: it.title,
    state: it.state,
  }));
}

function pickOrchestrationRefs(
  orchCtx: OrchestrationAgentAdapterContext,
  agent: OperationalAgentType,
): OperationalAgentExplainabilityRef[] {
  const orch = orchCtx.refs.filter((r) => r.kind === "orchestration").slice(0, 6);
  const sims = orchCtx.refs.filter((r) => r.kind === "simulation").slice(0, 4);
  const proposals = orchCtx.refs.filter((r) => r.kind === "proposal").slice(0, 6);
  if (agent === "coordination_agent") {
    return [...orch, ...proposals, ...sims];
  }
  if (agent === "risk_agent") {
    return [...orch.slice(0, 4)];
  }
  return [...orch.slice(0, 3)];
}

function coverageSurface(
  snapshot: OperationalCommandCenterSnapshot,
  orchCtx: OrchestrationAgentAdapterContext,
): OperationalAgentReasoningSurface {
  const reg = getOperationalAgentRegistryEntry("coverage_agent");
  const items = recommendationsForAgent("coverage_agent", snapshot.recommendations.items);
  const ind = snapshot.indicators;
  const headlines: string[] = [];
  if (ind.shiftsWithoutAssignment > 0) {
    headlines.push(`${ind.shiftsWithoutAssignment} plantão(ões) sem assignment na janela.`);
  }
  if (ind.unavailableProfessionals > 0) {
    headlines.push(`${ind.unavailableProfessionals} profissional(is) indisponíveis na amostra.`);
  }
  if (snapshot.widgets.operationalCoveragePercent < 82) {
    headlines.push(
      `Cobertura operacional em ${snapshot.widgets.operationalCoveragePercent}% (atenção).`,
    );
  }
  for (const it of items.slice(0, 3)) {
    headlines.push(it.title);
  }
  if (headlines.length === 0) {
    headlines.push("Cobertura estável para os sinais monitorados pelo agente de cobertura.");
  }

  const covScore = snapshot.scoring.scores.coverage_risk_score;
  const refs: OperationalAgentExplainabilityRef[] = [
    {
      kind: "score",
      scoreId: "coverage_risk_score",
      value: covScore.value,
      label: covScore.label,
    },
    forecastRef(snapshot),
    ...recommendationRefs(items),
    ...pickOrchestrationRefs(orchCtx, "coverage_agent"),
  ];

  const needsHumanReview =
    items.some((i) => i.state !== "suggested") ||
    ind.shiftsWithoutAssignment > 0 ||
    ind.overdueOpenShifts > 0 ||
    covScore.value >= 40;

  return {
    agentType: "coverage_agent",
    domainLabel: reg.domainLabel,
    capabilityLabels: reg.capabilities,
    policyIds: reg.policies,
    rationaleSummary:
      "Raciocínio escopado a cobertura, escalas e lacunas de staffing na janela atual (somente leitura).",
    headlines,
    refs,
    needsHumanReview,
  };
}

function coordinationSurface(
  snapshot: OperationalCommandCenterSnapshot,
  orchCtx: OrchestrationAgentAdapterContext,
): OperationalAgentReasoningSurface {
  const reg = getOperationalAgentRegistryEntry("coordination_agent");
  const items = recommendationsForAgent("coordination_agent", snapshot.recommendations.items);
  const headlines: string[] = [];
  if (snapshot.widgets.pendingSwaps > 0) {
    headlines.push(`${snapshot.widgets.pendingSwaps} swap(s) pendente(s) de decisão.`);
  }
  if (snapshot.widgets.operationalConflicts > 0) {
    headlines.push(
      `${snapshot.widgets.operationalConflicts} conflito(s) operacional(is) detectados.`,
    );
  }
  if (snapshot.indicators.pendingAssignments > 0) {
    headlines.push(`${snapshot.indicators.pendingAssignments} assignment(s) pendente(s).`);
  }
  for (const it of items.slice(0, 3)) {
    headlines.push(it.title);
  }
  if (headlines.length === 0) {
    headlines.push("Coordenação dentro da faixa esperada para swaps e pendências.");
  }

  const stress = snapshot.scoring.scores.coordination_stress_score;
  const refs: OperationalAgentExplainabilityRef[] = [
    {
      kind: "score",
      scoreId: "coordination_stress_score",
      value: stress.value,
      label: stress.label,
    },
    forecastRef(snapshot),
    ...recommendationRefs(items),
    ...pickOrchestrationRefs(orchCtx, "coordination_agent"),
  ];

  const needsHumanReview =
    items.some((i) => i.state !== "suggested") ||
    snapshot.widgets.pendingSwaps > 0 ||
    snapshot.widgets.operationalConflicts > 0 ||
    stress.value >= 40;

  return {
    agentType: "coordination_agent",
    domainLabel: reg.domainLabel,
    capabilityLabels: reg.capabilities,
    policyIds: reg.policies,
    rationaleSummary:
      "Raciocínio limitado a swaps, assignments e pressão de coordenação; referencia orquestração supervisionada existente.",
    headlines,
    refs,
    needsHumanReview,
  };
}

function riskSurface(
  snapshot: OperationalCommandCenterSnapshot,
  orchCtx: OrchestrationAgentAdapterContext,
): OperationalAgentReasoningSurface {
  const reg = getOperationalAgentRegistryEntry("risk_agent");
  const items = recommendationsForAgent("risk_agent", snapshot.recommendations.items);
  const headlines: string[] = [
    ...snapshot.scoring.riskNotes.slice(0, 2),
    ...snapshot.scoring.highlights.slice(0, 2),
  ];
  for (const it of items.slice(0, 2)) {
    headlines.push(it.title);
  }
  if (headlines.length === 0) {
    headlines.push("Risco operacional sintético estável na janela corrente.");
  }

  const refs: OperationalAgentExplainabilityRef[] = [
    ...scoreRefs(snapshot),
    forecastRef(snapshot),
    ...recommendationRefs(items),
    ...pickOrchestrationRefs(orchCtx, "risk_agent"),
  ];

  const needsHumanReview =
    snapshot.scoring.healthState !== "healthy" ||
    items.some((i) => i.state === "urgent" || i.state === "recommended") ||
    snapshot.scoring.consolidatedRiskScore >= 42;

  return {
    agentType: "risk_agent",
    domainLabel: reg.domainLabel,
    capabilityLabels: reg.capabilities,
    policyIds: reg.policies,
    rationaleSummary:
      "Síntese de risco baseada na camada de scoring e no forecast heurístico (sem execução nem auto-cura).",
    headlines: headlines.slice(0, 8),
    refs,
    needsHumanReview,
  };
}

function recommendationSurface(
  snapshot: OperationalCommandCenterSnapshot,
  orchCtx: OrchestrationAgentAdapterContext,
): OperationalAgentReasoningSurface {
  const reg = getOperationalAgentRegistryEntry("recommendation_agent");
  const bundle = snapshot.recommendations;
  const headlines: string[] = [bundle.summary.headline];
  const top = bundle.items.filter((i) => i.type === "mitigation").slice(0, 4);
  for (const t of top) {
    headlines.push(t.title);
  }

  const refs: OperationalAgentExplainabilityRef[] = [
    forecastRef(snapshot),
    ...recommendationRefs(bundle.items),
    ...pickOrchestrationRefs(orchCtx, "recommendation_agent"),
  ];

  const needsHumanReview =
    bundle.summary.countsByState.urgent > 0 ||
    bundle.summary.countsByState.recommended > 0 ||
    bundle.items.some((i) => (i.mitigationPlan?.length ?? 0) > 0);

  return {
    agentType: "recommendation_agent",
    domainLabel: reg.domainLabel,
    capabilityLabels: reg.capabilities,
    policyIds: reg.policies,
    rationaleSummary:
      "Priorização e planos de mitigação derivados do motor de recomendações (guidance supervisionada).",
    headlines: headlines.slice(0, 8),
    refs,
    needsHumanReview,
  };
}

const builders: Record<
  OperationalAgentType,
  (
    s: OperationalCommandCenterSnapshot,
    o: OrchestrationAgentAdapterContext,
  ) => OperationalAgentReasoningSurface
> = {
  coverage_agent: coverageSurface,
  coordination_agent: coordinationSurface,
  risk_agent: riskSurface,
  recommendation_agent: recommendationSurface,
};

export function buildOperationalAgentSurfaceFingerprint(
  snapshot: OperationalCommandCenterSnapshot,
): string {
  return [
    snapshot.asOf,
    snapshot.scoring.computedAt,
    snapshot.recommendations.computedAt,
    snapshot.recommendations.forecast.projection,
  ].join("|");
}

/** Uma passada determinística por snapshot — sem chamadas GPT nem loops entre agentes. */
export function buildOperationalAgentReasoningSurfaces(input: {
  snapshot: OperationalCommandCenterSnapshot;
  orchestrationContext: OrchestrationAgentAdapterContext;
}): OperationalAgentReasoningSurface[] {
  return OPERATIONAL_AGENT_REGISTRY.map((e) =>
    builders[e.type](input.snapshot, input.orchestrationContext),
  );
}

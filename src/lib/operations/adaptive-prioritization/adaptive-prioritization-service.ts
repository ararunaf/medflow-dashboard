/**
 * Serviço de priorização operacional adaptativa supervisionada (puro, sem IO).
 *
 * Recebe um snapshot de sinais e o weighting profile já materializado e
 * emite ajustes (`AdaptivePriorityAdjustment[]`) limitados pelas boundaries.
 *
 * Não executa ações — apenas calcula sugestões de reordenação/foco que serão
 * exibidas na UI sob revisão humana.
 */
import type { OperationalAgentType } from "@/lib/database.types";
import type { OperationalOrchestrationDto } from "@/lib/operations/orchestration/types";
import type {
  OperationalRecommendation,
  OperationalRecommendationBundle,
  OperationalRecommendationState,
} from "@/lib/operations/recommendations/types";
import {
  DEFAULT_ADAPTATION_BOUNDARIES,
  clampNudge,
  hasEnoughSample,
} from "./adaptation-boundaries";
import { buildAdjustmentRationale, describeSignalSnapshot } from "./adaptive-guidance-helpers";
import type {
  AdaptationBoundaries,
  AdaptivePriorityAdjustment,
  AdaptivePriorityReference,
  AdaptivePriorityState,
  AdaptivePrioritizationLayerSummary,
  AdaptivePrioritySubjectKind,
  AdaptiveSignalKind,
  AdaptiveSignalSnapshot,
  AdaptiveSupervisedTransition,
  AdaptiveWeightingFactor,
  AdaptiveWeightingProfile,
} from "./types";

const STATE_RANK: Record<OperationalRecommendationState, number> = {
  suggested: 0,
  recommended: 1,
  urgent: 2,
};

const STATE_FROM_RANK: Record<number, OperationalRecommendationState> = {
  0: "suggested",
  1: "recommended",
  2: "urgent",
};

/** Limiar mínimo de influência para que a camada eleve para "supervised_adjustment". */
const SUPERVISED_INFLUENCE_THRESHOLD = 0.35;

export type AdaptivePrioritizationServiceInput = {
  computedAt: string;
  signals: AdaptiveSignalSnapshot;
  weighting: AdaptiveWeightingProfile;
  recommendations: OperationalRecommendationBundle;
  orchestrations?: OperationalOrchestrationDto[];
  /** Transições humanas (validate/dismiss) recuperadas do audit log. */
  supervisedTransitions?: Map<string, AdaptiveSupervisedTransition>;
  /** Bots/agentes ativos para enriquecer foco de coordenação. */
  agentCoordinationFocus?: OperationalAgentType[];
  boundaries?: AdaptationBoundaries;
};

function adjustedState(
  baseline: OperationalRecommendationState,
  nudge: number,
): OperationalRecommendationState {
  const rank = STATE_RANK[baseline];
  if (nudge >= 0.6 && rank < 2) return STATE_FROM_RANK[rank + 1];
  if (nudge <= -0.6 && rank > 0) return STATE_FROM_RANK[rank - 1];
  return baseline;
}

function nudgeFromFactor(factor: AdaptiveWeightingFactor | undefined): number {
  if (!factor) return 0;
  // Mapeia weight ∈ [min, max] para nudge ∈ [-1, +1] com sinal preservado.
  const direction = factor.weight >= 1 ? 1 : -1;
  return clampNudge(direction * factor.influence);
}

function recommendationToAdjustment(input: {
  rec: OperationalRecommendation;
  weighting: AdaptiveWeightingProfile;
  signals: AdaptiveSignalSnapshot;
  computedAt: string;
  supervisedTransitions: Map<string, AdaptiveSupervisedTransition>;
}): AdaptivePriorityAdjustment {
  const factor = input.weighting.byTrigger[input.rec.trigger];
  const subjectFactor = input.weighting.bySubjectKind.recommendation;
  const combined = ((factor?.weight ?? 1) + (subjectFactor?.weight ?? 1)) / 2;
  const direction = combined >= 1 ? 1 : -1;
  const combinedInfluence = Math.max(factor?.influence ?? 0, subjectFactor?.influence ?? 0);
  const nudge = clampNudge(direction * combinedInfluence);
  const adjusted = adjustedState(input.rec.state, nudge);

  const dominantSignals: AdaptiveSignalKind[] = [];
  if (factor) dominantSignals.push(factor.dominantSignal);
  if (subjectFactor && !dominantSignals.includes(subjectFactor.dominantSignal)) {
    dominantSignals.push(subjectFactor.dominantSignal);
  }

  const id = `adapt:recommendation:${input.rec.id}`;
  const transition = input.supervisedTransitions.get(id);
  const baseState: AdaptivePriorityState =
    combinedInfluence >= SUPERVISED_INFLUENCE_THRESHOLD ? "supervised_adjustment" : "adaptive";
  const state: AdaptivePriorityState = transition ? transition.state : baseState;

  const refs: AdaptivePriorityReference[] = [
    { kind: "recommendation", id: input.rec.id, note: input.rec.title },
  ];
  if (input.rec.linkedScoreIds) {
    for (const s of input.rec.linkedScoreIds) refs.push({ kind: "score", id: s });
  }

  return {
    id,
    subjectKind: "recommendation",
    subjectId: input.rec.id,
    baselinePriority: input.rec.state,
    adjustedPriority: adjusted,
    nudge,
    state,
    rationale: buildAdjustmentRationale({
      trigger: input.rec.trigger,
      weightingRationale: factor?.rationale ?? "sem rationale histórica disponível",
      signalsUsed: dominantSignals,
      baselineLabel: input.rec.state,
      adjustedLabel: adjusted,
      nudge,
    }),
    references: refs,
    computedAt: input.computedAt,
    lastSupervisedTransition: transition ?? null,
  };
}

function orchestrationToAdjustment(input: {
  orch: OperationalOrchestrationDto;
  weighting: AdaptiveWeightingProfile;
  computedAt: string;
  supervisedTransitions: Map<string, AdaptiveSupervisedTransition>;
}): AdaptivePriorityAdjustment {
  const factor = input.weighting.bySubjectKind.orchestration;
  const nudge = nudgeFromFactor(factor);
  const baseline: OperationalRecommendationState = "recommended";
  const adjusted = adjustedState(baseline, nudge);
  const dominant: AdaptiveSignalKind[] = factor ? [factor.dominantSignal] : [];

  const id = `adapt:orchestration:${input.orch.id}`;
  const transition = input.supervisedTransitions.get(id);
  const baseState: AdaptivePriorityState =
    (factor?.influence ?? 0) >= SUPERVISED_INFLUENCE_THRESHOLD
      ? "supervised_adjustment"
      : "adaptive";
  const state: AdaptivePriorityState = transition ? transition.state : baseState;

  return {
    id,
    subjectKind: "orchestration",
    subjectId: input.orch.id,
    baselinePriority: baseline,
    adjustedPriority: adjusted,
    nudge,
    state,
    rationale: buildAdjustmentRationale({
      weightingRationale: factor?.rationale ?? "sem rationale histórica",
      signalsUsed: dominant,
      baselineLabel: baseline,
      adjustedLabel: adjusted,
      nudge,
    }),
    references: [{ kind: "orchestration", id: input.orch.id, note: input.orch.title }],
    computedAt: input.computedAt,
    lastSupervisedTransition: transition ?? null,
  };
}

function deriveLayerState(input: {
  signals: AdaptiveSignalSnapshot;
  adjustments: AdaptivePriorityAdjustment[];
  boundaries: AdaptationBoundaries;
}): AdaptivePriorityState {
  if (!hasEnoughSample(input.signals.sampleSize, input.boundaries)) return "static";
  const anyValidated = input.adjustments.some((a) => a.state === "validated");
  if (anyValidated) return "validated";
  const anySupervised = input.adjustments.some((a) => a.state === "supervised_adjustment");
  if (anySupervised) return "supervised_adjustment";
  if (input.adjustments.length === 0) return "static";
  return "adaptive";
}

function buildLayerNarrative(input: {
  signals: AdaptiveSignalSnapshot;
  adjustments: AdaptivePriorityAdjustment[];
  bounded: boolean;
}): string[] {
  const out: string[] = [];
  out.push(`Camada adaptativa — amostra n=${input.signals.sampleSize}.`);
  out.push(...describeSignalSnapshot(input.signals));
  const up = input.adjustments.filter((a) => a.nudge > 0.05).length;
  const down = input.adjustments.filter((a) => a.nudge < -0.05).length;
  out.push(
    `Ajustes derivados: ${input.adjustments.length} (↑ ${up} · ↓ ${down}) — sortWeight repriorizado dentro das boundaries.`,
  );
  if (input.bounded) {
    out.push(
      "Limites de adaptação aplicados — repriorização teto/piso ou cap de ajustes atingido (anti-loop).",
    );
  }
  out.push("Nenhuma ação é executada automaticamente — apenas reordenação supervisionada.");
  return out;
}

export function buildAdaptivePrioritizationLayer(
  input: AdaptivePrioritizationServiceInput,
): AdaptivePrioritizationLayerSummary {
  const boundaries = input.boundaries ?? DEFAULT_ADAPTATION_BOUNDARIES;
  const transitions = input.supervisedTransitions ?? new Map();
  const adjustments: AdaptivePriorityAdjustment[] = [];

  for (const rec of input.recommendations.items) {
    adjustments.push(
      recommendationToAdjustment({
        rec,
        weighting: input.weighting,
        signals: input.signals,
        computedAt: input.computedAt,
        supervisedTransitions: transitions,
      }),
    );
  }

  for (const orch of input.orchestrations ?? []) {
    if (orch.state === "completed" || orch.state === "rolled_back" || orch.state === "blocked") {
      continue;
    }
    adjustments.push(
      orchestrationToAdjustment({
        orch,
        weighting: input.weighting,
        computedAt: input.computedAt,
        supervisedTransitions: transitions,
      }),
    );
  }

  // Sort: ajustes não neutros primeiro, ordenados por |nudge| desc, e respeita cap.
  const ranked = adjustments
    .map((a) => ({ a, magnitude: Math.abs(a.nudge) }))
    .sort((x, y) => y.magnitude - x.magnitude)
    .map((x) => x.a);

  const bounded = ranked.length > boundaries.maxAdjustmentsPerCycle;
  const trimmed = ranked.slice(0, boundaries.maxAdjustmentsPerCycle);

  // Detecta clamp efetivo (alguma magnitude bate em max esperado).
  const maxObservable = (boundaries.maxWeight - boundaries.minWeight) / 2;
  const reachedClamp = trimmed.some((a) => Math.abs(a.nudge) >= 0.999);

  const layerState = deriveLayerState({
    signals: input.signals,
    adjustments: trimmed,
    boundaries,
  });

  return {
    computedAt: input.computedAt,
    layerState,
    signals: input.signals,
    weighting: input.weighting,
    adjustments: trimmed,
    boundaries,
    narrative: buildLayerNarrative({
      signals: input.signals,
      adjustments: trimmed,
      bounded: bounded || reachedClamp || maxObservable === 0,
    }),
    bounded: bounded || reachedClamp,
    windowFromISO: input.signals.windowFromISO,
  };
}

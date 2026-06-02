/**
 * Tipos da camada de priorização operacional adaptativa supervisionada.
 *
 * Esta camada ajusta prioridades operacionais (recomendações, orquestração,
 * mitigação, escalação e foco de coordenação) com base em sinais históricos
 * já materializados (memória operacional, feedback, outcomes de orquestração).
 *
 * Princípios:
 * - Determinística (sem RL/ML executados em runtime).
 * - Bounded (não há ajuste fora de [minWeight, maxWeight]).
 * - Explainable (todo ajuste carrega rationale e referências).
 * - Supervisionada (nenhuma execução automática — apenas reordenação).
 */
import type {
  OperationalRecommendationState,
  OperationalRecommendationTrigger,
} from "@/lib/operations/recommendations/types";

export const ADAPTIVE_PRIORITY_STATES = [
  "static",
  "adaptive",
  "supervised_adjustment",
  "validated",
] as const;
export type AdaptivePriorityState = (typeof ADAPTIVE_PRIORITY_STATES)[number];

export const ADAPTIVE_SUBJECT_KINDS = [
  "recommendation",
  "orchestration",
  "mitigation",
  "escalation",
  "coordination",
] as const;
export type AdaptivePrioritySubjectKind = (typeof ADAPTIVE_SUBJECT_KINDS)[number];

export const ADAPTIVE_SIGNAL_KINDS = [
  "recommendation_effectiveness",
  "rollback_frequency",
  "mitigation_success",
  "deterioration_recurrence",
  "coordination_effectiveness",
  "forecast_accuracy",
  "orchestration_outcomes",
] as const;
export type AdaptiveSignalKind = (typeof ADAPTIVE_SIGNAL_KINDS)[number];

/**
 * Snapshot agregado de sinais históricos consumidos pela camada adaptativa.
 * Valores em 0..1 (médias) e proporções (rollback/deterioração).
 */
export type AdaptiveSignalSnapshot = {
  computedAt: string;
  windowFromISO: string;
  recommendationEffectiveness: number | null;
  mitigationSuccess: number | null;
  coordinationEffectiveness: number | null;
  forecastAccuracy: number | null;
  orchestrationOutcomes: number | null;
  /** 0..1 — proporção de execuções recentes que terminaram em rollback. */
  rollbackFrequency: number;
  /** 0..1 — proporção de janelas recentes com projeção crítica/deteriorando. */
  deteriorationRecurrence: number;
  sampleSize: number;
  sampleNotes: string[];
};

/**
 * Fator de ponderação limitado em [minWeight, maxWeight] aplicado a um trigger
 * ou domínio de assunto. O `influence` reflete quão forte foi o desvio em
 * relação à neutralidade (1.0).
 */
export type AdaptiveWeightingFactor = {
  weight: number;
  /** 0..1 — distância normalizada do peso em relação a 1.0. */
  influence: number;
  dominantSignal: AdaptiveSignalKind;
  rationale: string;
};

export type AdaptiveWeightingProfile = {
  byTrigger: Partial<Record<OperationalRecommendationTrigger, AdaptiveWeightingFactor>>;
  bySubjectKind: Partial<Record<AdaptivePrioritySubjectKind, AdaptiveWeightingFactor>>;
};

export type AdaptivePriorityReferenceKind =
  | "recommendation"
  | "orchestration"
  | "memory_entry"
  | "score"
  | "forecast"
  | "feedback_overlay";

export type AdaptivePriorityReference = {
  kind: AdaptivePriorityReferenceKind;
  id: string;
  note?: string;
};

export type AdaptivePriorityRationale = {
  /** Resumo curto (para badge / tooltip). */
  headline: string;
  /** Lista narrativa explicando o ajuste (auditável). */
  narrative: string[];
  /** Sinais que dominaram o ajuste. */
  dominantSignals: AdaptiveSignalKind[];
};

export type AdaptivePriorityAdjustment = {
  /** Identificador estável derivado de subjectKind + subjectId. */
  id: string;
  subjectKind: AdaptivePrioritySubjectKind;
  subjectId: string;
  baselinePriority: OperationalRecommendationState;
  adjustedPriority: OperationalRecommendationState;
  /** -1..+1 — magnitude do nudge sobre o sortWeight (positivo = elevar). */
  nudge: number;
  state: AdaptivePriorityState;
  rationale: AdaptivePriorityRationale;
  references: AdaptivePriorityReference[];
  computedAt: string;
  /** Última transição supervisionada associada (se houver). */
  lastSupervisedTransition?: AdaptiveSupervisedTransition | null;
};

export type AdaptiveSupervisedTransition = {
  state: AdaptivePriorityState;
  at: string;
  actorProfileId: string;
  note?: string | null;
};

export type AdaptationBoundaries = {
  /** Limite mínimo do multiplicador de peso adaptativo. */
  minWeight: number;
  /** Limite máximo do multiplicador. */
  maxWeight: number;
  /** Máximo de ajustes propostos por ciclo (anti-loop). */
  maxAdjustmentsPerCycle: number;
  /** Janela mínima entre recomputações relevantes (anti-thrashing). */
  freezeWindowMs: number;
  /** Tamanho mínimo de amostra para autorizar adaptação (vs. ficar static). */
  minSampleSizeForAdaptation: number;
};

export type AdaptivePrioritizationLayerSummary = {
  computedAt: string;
  /** Estado global da camada (governa a UI: static vs adaptive vs validated). */
  layerState: AdaptivePriorityState;
  signals: AdaptiveSignalSnapshot;
  weighting: AdaptiveWeightingProfile;
  adjustments: AdaptivePriorityAdjustment[];
  boundaries: AdaptationBoundaries;
  /** Texto narrativo para o painel — destaques do ciclo. */
  narrative: string[];
  /** Foi atingido algum limite (clamp/maxAdjustments) neste ciclo. */
  bounded: boolean;
  /** Janela de histórico considerada (para auditoria). */
  windowFromISO: string;
};

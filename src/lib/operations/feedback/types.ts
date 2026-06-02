import type { OperationalRecommendationFeedbackType } from "@/lib/database.types";

export type { OperationalRecommendationFeedbackType };

/** Rollup bruto vindo do RPC Postgres (já filtrado por tenant e janela). */
export type OperationalRecommendationFeedbackRollupPayload = {
  sampleSize: number;
  countsByFeedbackType: Partial<Record<OperationalRecommendationFeedbackType, number>>;
  dailyByType: Array<{
    bucket: string;
    feedback_type: OperationalRecommendationFeedbackType;
    c: number;
  }>;
  byActorType: Array<{
    actor_profile_id: string;
    feedback_type: OperationalRecommendationFeedbackType;
    c: number;
  }>;
  byTriggerType: Array<{
    trigger_key: string;
    feedback_type: OperationalRecommendationFeedbackType;
    c: number;
  }>;
  mitigationScoredSuccess: number;
  mitigationScoredTotal: number;
};

export type RecommendationLatestFeedbackRow = {
  recommendation_id: string;
  feedback_type: OperationalRecommendationFeedbackType;
  effectiveness_score: number | null;
  created_at: string;
};

export type RecommendationEffectivenessMetrics = {
  sampleSize: number;
  accepted: number;
  dismissed: number;
  ignored: number;
  executed: number;
  executionFailed: number;
  /** executed / (executed + execution_failed) quando houver tentativas. */
  executionSuccessRate: number | null;
  /** (accepted + executed) / respostas humanas totais. */
  alignmentRate: number | null;
  /** executed com nota ≥ 0,7 quando há scores; senão null. */
  scoredMitigationSuccessRate: number | null;
};

export type CoordinatorFeedbackSummary = {
  actorProfileId: string;
  countsByFeedbackType: Partial<Record<OperationalRecommendationFeedbackType, number>>;
  total: number;
  alignmentRate: number | null;
};

export type AcceptanceTrendPoint = {
  bucket: string;
  accepted: number;
  executed: number;
  dismissed: number;
  ignored: number;
};

export type OperationalLearningSignal = {
  id: string;
  kind: "coordination" | "effectiveness" | "trend";
  headline: string;
  detail: string;
};

export type RecommendationItemFeedbackHints = {
  lastFeedbackType: OperationalRecommendationFeedbackType | null;
  lastFeedbackAt: string | null;
  lastEffectivenessScore: number | null;
  confidenceLabel: string;
};

export type OperationalRecommendationFeedbackOverlay = {
  window: { fromISO: string; toISO: string };
  rollups: OperationalRecommendationFeedbackRollupPayload;
  effectiveness: RecommendationEffectivenessMetrics;
  coordinatorSummaries: CoordinatorFeedbackSummary[];
  acceptanceTrend: AcceptanceTrendPoint[];
  learningSignals: OperationalLearningSignal[];
  byRecommendationId: Record<string, RecommendationItemFeedbackHints>;
};

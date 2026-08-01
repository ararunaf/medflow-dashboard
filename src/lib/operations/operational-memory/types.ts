import type { OperationalForecastProjection } from "@/lib/operations/recommendations/types";
import type { OperationalHealthState } from "@/lib/operations/scoring/types";
import type {
  JsonObject,
  OperationalMemoryKind,
  OperationalMemoryState,
  OperationalMemorySubjectKind,
} from "@/lib/database.types";

export type { OperationalMemoryKind, OperationalMemoryState, OperationalMemorySubjectKind };

export type OperationalMemoryExplainability = {
  provenance: Array<{ source: string; ref: string; note?: string }>;
  historicalReasoning: string[];
  effectivenessRationale: string[];
  references: Array<{ kind: string; id: string }>;
};

export type OperationalMemoryLearningSignals = {
  recommendationSuccessHint?: number | null;
  rollbackCorrelation?: "none" | "weak" | "moderate" | "strong";
  forecastDelta?: "aligned" | "over_forecasted" | "under_forecasted" | "unknown";
  coordinationFriction?: number;
  orchestrationTerminal?: "completed" | "rolled_back" | "blocked_step" | "preview";
};

export type OperationalMemoryInsight = {
  id: string;
  memoryKind: OperationalMemoryKind;
  memoryState: OperationalMemoryState;
  subjectKind: OperationalMemorySubjectKind;
  subjectId: string;
  outcomeNarrative: string;
  effectivenessScore: number | null;
  learningSignals: OperationalMemoryLearningSignals;
  explainability: OperationalMemoryExplainability;
  references: JsonObject;
  createdAt: string;
};

export type OperationalMemoryEffectivenessFusion = {
  recommendationQuality: number | null;
  memoryEffectivenessAvg: number | null;
  rollbackPressure: "low" | "medium" | "high";
  narratives: string[];
};

export type OperationalMemoryRegistryHighlight = {
  kind: OperationalMemoryKind;
  pipeline:
    | "supervised_baseline"
    | "future_adaptive_prioritization"
    | "future_ml_features"
    | "future_rl_reward_shaping";
  note: string;
};

export type OperationalMemoryLayerSummary = {
  computedAt: string;
  windowFromISO: string;
  recentInsights: OperationalMemoryInsight[];
  effectivenessFusion: OperationalMemoryEffectivenessFusion;
  registryHighlights: OperationalMemoryRegistryHighlight[];
  forecastProbe?: {
    projection: OperationalForecastProjection;
    healthState: OperationalHealthState;
    alignmentNote: string;
  };
};

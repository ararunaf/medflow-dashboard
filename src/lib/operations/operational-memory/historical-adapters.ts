import type { OperationalRecommendationFeedbackType } from "@/lib/database.types";
import type { OperationalMutationExecutionState } from "@/lib/database.types";
import type { OperationalForecastProjection } from "@/lib/operations/recommendations/types";
import type { OperationalHealthState } from "@/lib/operations/scoring/types";
import type {
  OperationalMemoryLearningSignals,
  OperationalMemoryState,
} from "@/lib/operations/operational-memory/types";

export function memoryStateForRecommendationFeedback(
  feedbackType: OperationalRecommendationFeedbackType,
): OperationalMemoryState {
  if (feedbackType === "executed" || feedbackType === "accepted") return "tracked";
  if (feedbackType === "execution_failed") return "tracked";
  return "observed";
}

export function learningSignalsFromFeedback(
  feedbackType: OperationalRecommendationFeedbackType,
): OperationalMemoryLearningSignals {
  const recommendationSuccessHint =
    feedbackType === "executed"
      ? 0.95
      : feedbackType === "accepted"
        ? 0.82
        : feedbackType === "dismissed"
          ? 0.35
          : feedbackType === "ignored"
            ? 0.5
            : feedbackType === "execution_failed"
              ? 0.15
              : null;
  return {
    recommendationSuccessHint,
    rollbackCorrelation: feedbackType === "execution_failed" ? "weak" : "none",
  };
}

export function learningSignalsFromExecutionState(
  state: OperationalMutationExecutionState,
): OperationalMemoryLearningSignals {
  if (state === "executed") return { recommendationSuccessHint: 0.9, rollbackCorrelation: "none" };
  if (state === "rolled_back") return { rollbackCorrelation: "strong" };
  if (state === "failed") return { rollbackCorrelation: "moderate" };
  return {};
}

export function forecastAlignmentSignal(input: {
  projection: OperationalForecastProjection;
  health: OperationalHealthState;
}): OperationalMemoryLearningSignals {
  const criticalish = input.health === "critical" || input.health === "warning";
  const projectedBad =
    input.projection === "critical_projection" || input.projection === "deteriorating";
  let forecastDelta: OperationalMemoryLearningSignals["forecastDelta"] = "unknown";
  if (projectedBad && !criticalish) forecastDelta = "over_forecasted";
  else if (!projectedBad && criticalish) forecastDelta = "under_forecasted";
  else forecastDelta = "aligned";
  return { forecastDelta };
}

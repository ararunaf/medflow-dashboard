/**
 * Server functions — feedback humano sobre recomendações operacionais.
 */
import { createServerFn } from "@tanstack/react-start";
import {
  expectOperationalRecommendationFeedbackType,
  expectOperationalRecommendationId,
  expectOptionalEffectivenessScore,
} from "@/lib/domain/operations/validation";
import {
  optionalString,
  requireObject,
  runMutation,
  type MutationResult,
} from "@/lib/server/fn-helpers";
import {
  submitOperationalRecommendationFeedback,
  type SubmitOperationalRecommendationFeedbackInput,
} from "@/lib/services/operations/operational-feedback-service";

export type { SubmitOperationalRecommendationFeedbackInput };

export const submitOperationalRecommendationFeedbackFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): SubmitOperationalRecommendationFeedbackInput => {
    const obj = requireObject(raw);
    const notesRaw = optionalString(obj.notes, "notes");
    const notes = notesRaw === undefined ? null : notesRaw.length > 0 ? notesRaw : null;
    return {
      recommendationId: expectOperationalRecommendationId(obj.recommendationId, "recommendationId"),
      feedbackType: expectOperationalRecommendationFeedbackType(obj.feedbackType, "feedbackType"),
      effectivenessScore: expectOptionalEffectivenessScore(
        obj.effectivenessScore,
        "effectivenessScore",
      ),
      notes,
    };
  })
  .handler(async ({ data }): Promise<MutationResult<{ id: string }>> => {
    return runMutation((ctx) => submitOperationalRecommendationFeedback(ctx, data));
  });

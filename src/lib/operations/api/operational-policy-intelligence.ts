/**
 * Server functions — inteligência operacional de políticas supervisionadas.
 */
import { createServerFn } from "@tanstack/react-start";
import {
  expectSupervisedPolicyLifecycleState,
  expectUuid,
} from "@/lib/domain/operations/validation";
import { requireObject, runMutation, type MutationResult } from "@/lib/server/fn-helpers";
import {
  patchPolicyGovernanceRecommendationLifecycle,
  patchPolicyIntelligenceCycleLifecycle,
  type PatchPolicyGovernanceRecommendationLifecycleInput,
  type PatchPolicyIntelligenceCycleLifecycleInput,
  runOperationalPolicyIntelligenceAnalysis,
} from "@/lib/services/operations/operational-policy-intelligence-service";

export type {
  PatchPolicyGovernanceRecommendationLifecycleInput,
  PatchPolicyIntelligenceCycleLifecycleInput,
};

export const runOperationalPolicyIntelligenceAnalysisFn = createServerFn({
  method: "POST",
}).handler(async (): Promise<MutationResult<{ cycleId: string; skippedDuplicate?: boolean }>> => {
  return runMutation((ctx) => runOperationalPolicyIntelligenceAnalysis(ctx));
});

export const patchPolicyGovernanceRecommendationLifecycleFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): PatchPolicyGovernanceRecommendationLifecycleInput => {
    const obj = requireObject(raw);
    return {
      recommendationId: expectUuid(obj.recommendationId, "recommendationId"),
      nextLifecycleState: expectSupervisedPolicyLifecycleState(
        obj.nextLifecycleState,
        "nextLifecycleState",
      ),
    };
  })
  .handler(async ({ data }): Promise<MutationResult<void>> => {
    return runMutation((ctx) => patchPolicyGovernanceRecommendationLifecycle(ctx, data));
  });

export const patchPolicyIntelligenceCycleLifecycleFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): PatchPolicyIntelligenceCycleLifecycleInput => {
    const obj = requireObject(raw);
    return {
      cycleId: expectUuid(obj.cycleId, "cycleId"),
      nextLifecycleState: expectSupervisedPolicyLifecycleState(
        obj.nextLifecycleState,
        "nextLifecycleState",
      ),
    };
  })
  .handler(async ({ data }): Promise<MutationResult<void>> => {
    return runMutation((ctx) => patchPolicyIntelligenceCycleLifecycle(ctx, data));
  });

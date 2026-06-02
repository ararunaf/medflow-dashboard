/**
 * Server functions — priorização operacional adaptativa supervisionada.
 * Apenas governança (validate / mark as supervised). A camada é recomputada
 * pelo command center snapshot a cada ciclo.
 */
import { createServerFn } from "@tanstack/react-start";
import {
  expectAdaptiveAdjustmentId,
  expectAdaptivePriorityState,
  expectAdaptivePrioritySubjectKind,
  expectOptionalString,
} from "@/lib/domain/operations/validation";
import { requireObject, runMutation, type MutationResult } from "@/lib/server/fn-helpers";
import {
  recordAdaptivePriorityTransition,
  type RecordAdaptivePriorityTransitionInput,
} from "@/lib/services/operations/operational-adaptive-prioritization-service";
import type { AdaptiveSupervisedTransition } from "@/lib/operations/adaptive-prioritization/types";

export type { RecordAdaptivePriorityTransitionInput };

export const recordAdaptivePriorityTransitionFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): RecordAdaptivePriorityTransitionInput => {
    const obj = requireObject(raw);
    const note = expectOptionalString(obj.note, "note", 280);
    return {
      adjustmentId: expectAdaptiveAdjustmentId(obj.adjustmentId, "adjustmentId"),
      subjectKind: expectAdaptivePrioritySubjectKind(obj.subjectKind, "subjectKind"),
      nextState: expectAdaptivePriorityState(obj.nextState, "nextState"),
      note: note.length > 0 ? note : null,
    };
  })
  .handler(async ({ data }): Promise<MutationResult<AdaptiveSupervisedTransition>> => {
    return runMutation((ctx) => recordAdaptivePriorityTransition(ctx, data));
  });

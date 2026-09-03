/**
 * Server function do Shift Matching Agent — F4-S3.
 *
 * Ação sob demanda (não é uma query cacheável): manager clica "Sugerir
 * profissionais" no detalhe de um plantão aberto, isso dispara uma chamada
 * real de IA (custo/latência), então tratamos como mutation.
 */
import { createServerFn } from "@tanstack/react-start";
import { expectUuid } from "@/lib/domain/operations/validation";
import { requireObject, runMutation, type MutationResult } from "@/lib/server/fn-helpers";
import {
  suggestProfessionalsForShift,
} from "@/lib/services/operations/shift-matching-service";
import type { ShiftMatchSuggestion } from "@/lib/services/operations/shift-matching-agent";

export const suggestProfessionalsForShiftFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): { shiftId: string } => {
    const obj = requireObject(raw);
    return { shiftId: expectUuid(obj.shiftId, "shiftId") };
  })
  .handler(async ({ data }): Promise<MutationResult<ShiftMatchSuggestion[]>> => {
    return runMutation((ctx) => suggestProfessionalsForShift(ctx, data.shiftId));
  });

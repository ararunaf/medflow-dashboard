/**
 * Server function do Check-in Confirmation Agent — F4-S4.
 *
 * Ação sob demanda (não é uma query cacheável): manager clica "Revisar
 * presença" na aba de check-ins, isso dispara uma chamada real de IA para
 * os itens sinalizados — tratamos como mutation, mesmo padrão do Shift
 * Matching Agent (F4-S3).
 */
import { createServerFn } from "@tanstack/react-start";
import { runMutation, type MutationResult } from "@/lib/server/fn-helpers";
import { reviewAttendance } from "@/lib/services/operations/attendance-review-service";
import type { AttendanceReviewSuggestion } from "@/lib/services/operations/checkin-confirmation-agent";

export const reviewAttendanceFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<MutationResult<AttendanceReviewSuggestion[]>> => {
    return runMutation((ctx) => reviewAttendance(ctx));
  },
);

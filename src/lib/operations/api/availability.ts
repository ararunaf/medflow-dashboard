/**
 * Server function de disponibilidade (availability).
 */
import { createServerFn } from "@tanstack/react-start";
import { ValidationError } from "@/lib/domain/operations/errors";
import { expectTimeOfDay, expectUuid, expectWeekday } from "@/lib/domain/operations/validation";
import { requireObject, runMutation, type MutationResult } from "@/lib/server/fn-helpers";
import {
  updateAvailability,
  type AvailabilityWindow,
  type UpdateAvailabilityInput,
} from "@/lib/services/operations/availability";
import type { AvailabilityRow } from "@/lib/services/operations/types";

export type { AvailabilityWindow, UpdateAvailabilityInput };

export const updateAvailabilityFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): UpdateAvailabilityInput => {
    const obj = requireObject(raw);
    const professionalId = expectUuid(obj.professionalId, "professionalId");
    if (!Array.isArray(obj.windows)) {
      throw new ValidationError("Campo `windows` deve ser um array.");
    }
    const windows: AvailabilityWindow[] = obj.windows.map((entry, index) => {
      const w = requireObject(entry, `windows[${index}]`);
      return {
        weekday: expectWeekday(w.weekday, `windows[${index}].weekday`),
        startTime: expectTimeOfDay(w.startTime, `windows[${index}].startTime`),
        endTime: expectTimeOfDay(w.endTime, `windows[${index}].endTime`),
        available: w.available === undefined ? undefined : Boolean(w.available),
      };
    });
    return { professionalId, windows };
  })
  .handler(async ({ data }): Promise<MutationResult<AvailabilityRow[]>> => {
    return runMutation((ctx) => updateAvailability(ctx, data));
  });

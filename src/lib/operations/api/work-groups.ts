/**
 * Server functions de escrita para grupos de trabalho — F5-S1.
 */
import { createServerFn } from "@tanstack/react-start";
import { ValidationError } from "@/lib/domain/operations/errors";
import { expectUuid } from "@/lib/domain/operations/validation";
import { requireObject, requireString, runMutation, type MutationResult } from "@/lib/server/fn-helpers";
import {
  createWorkGroup,
  setProfessionalWorkGroup,
  type SetProfessionalWorkGroupInput,
  type WorkGroupListItem,
} from "@/lib/services/operations/work-groups";

export type { SetProfessionalWorkGroupInput };

export const createWorkGroupFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): { name: string } => {
    const obj = requireObject(raw);
    return { name: requireString(obj.name, "name", { maxLength: 80 }) };
  })
  .handler(async ({ data }): Promise<MutationResult<WorkGroupListItem>> => {
    return runMutation((ctx) => createWorkGroup(ctx, data.name));
  });

export const setProfessionalWorkGroupFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): SetProfessionalWorkGroupInput => {
    const obj = requireObject(raw);
    if (obj.workGroupId !== null && typeof obj.workGroupId !== "string") {
      throw new ValidationError("Campo workGroupId deve ser string ou null.", { field: "workGroupId" });
    }
    return {
      professionalId: expectUuid(obj.professionalId, "professionalId"),
      workGroupId: obj.workGroupId === null ? null : expectUuid(obj.workGroupId, "workGroupId"),
    };
  })
  .handler(async ({ data }): Promise<MutationResult<void>> => {
    return runMutation((ctx) => setProfessionalWorkGroup(ctx, data));
  });

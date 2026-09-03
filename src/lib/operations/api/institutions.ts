/**
 * Server functions de escrita para afiliação profissional↔hospital.
 */
import { createServerFn } from "@tanstack/react-start";
import { ValidationError } from "@/lib/domain/operations/errors";
import { expectUuid } from "@/lib/domain/operations/validation";
import { requireObject, runMutation, type MutationResult } from "@/lib/server/fn-helpers";
import {
  setProfessionalHospitalAffiliation,
  type SetProfessionalHospitalAffiliationInput,
} from "@/lib/services/operations/institutions";

export type { SetProfessionalHospitalAffiliationInput };

export const setProfessionalHospitalAffiliationFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): SetProfessionalHospitalAffiliationInput => {
    const obj = requireObject(raw);
    if (typeof obj.active !== "boolean") {
      throw new ValidationError("Campo active deve ser boolean.", { field: "active" });
    }
    return {
      professionalId: expectUuid(obj.professionalId, "professionalId"),
      hospitalId: expectUuid(obj.hospitalId, "hospitalId"),
      active: obj.active,
    };
  })
  .handler(async ({ data }): Promise<MutationResult<void>> => {
    return runMutation((ctx) => setProfessionalHospitalAffiliation(ctx, data));
  });

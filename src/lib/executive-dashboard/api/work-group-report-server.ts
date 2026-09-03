/**
 * Server function do relatório de produção por grupo de trabalho — F5-S1.
 */
import { createServerFn } from "@tanstack/react-start";
import { ValidationError } from "@/lib/domain/operations/errors";
import { runQuery, type QueryResult } from "@/lib/server/fn-helpers";
import {
  buildWorkGroupProductionRows,
  type WorkGroupProductionRow,
} from "@/lib/services/reporting/work-group-report-service";

export type { WorkGroupProductionRow };

export const getWorkGroupProductionFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown): { competence_month: string } => {
    const obj =
      raw != null && typeof raw === "object" && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : {};
    const cm = obj.competence_month;
    if (typeof cm !== "string" || !/^\d{4}-\d{2}-01$/.test(cm)) {
      throw new ValidationError("Campo competence_month deve ser ISO YYYY-MM-01.", {
        field: "competence_month",
      });
    }
    return { competence_month: cm };
  })
  .handler(async ({ data }): Promise<QueryResult<WorkGroupProductionRow[]>> => {
    return runQuery((ctx) => buildWorkGroupProductionRows(ctx, data.competence_month));
  });

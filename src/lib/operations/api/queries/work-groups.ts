/**
 * Server function de leitura para grupos de trabalho — F5-S1.
 */
import { createServerFn } from "@tanstack/react-start";
import { runQuery, type QueryResult } from "@/lib/server/fn-helpers";
import {
  listProfessionalWorkGroupAssignments,
  listWorkGroups,
  type ProfessionalWorkGroupAssignment,
  type WorkGroupListItem,
} from "@/lib/services/operations/work-groups";

export type { ProfessionalWorkGroupAssignment, WorkGroupListItem };

export const listWorkGroupsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<QueryResult<WorkGroupListItem[]>> => {
    return runQuery((ctx) => listWorkGroups(ctx));
  },
);

/** Manager-only: profissionais do tenant + o grupo de trabalho atual de cada um. */
export const listProfessionalWorkGroupAssignmentsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<QueryResult<ProfessionalWorkGroupAssignment[]>> => {
    return runQuery((ctx) => listProfessionalWorkGroupAssignments(ctx));
  },
);

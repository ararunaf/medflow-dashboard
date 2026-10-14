/**
 * Server functions de leitura para instituições (hospitals) e afiliação
 * profissional↔hospital — base da "central multi-instituição".
 */
import { createServerFn } from "@tanstack/react-start";
import { runQuery, type QueryResult } from "@/lib/server/fn-helpers";
import {
  listHospitals,
  listProfessionalAffiliations,
  listSchedulingTree,
  type HospitalListItem,
  type ProfessionalAffiliationSummary,
  type SchedulingTree,
} from "@/lib/services/operations/institutions";

export type { HospitalListItem, ProfessionalAffiliationSummary, SchedulingTree };

export const listHospitalsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<QueryResult<HospitalListItem[]>> => {
    return runQuery((ctx) => listHospitals(ctx));
  },
);

/** Manager-only: matriz completa profissional × hospital, para a tela de administração. */
export const listProfessionalAffiliationsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<QueryResult<ProfessionalAffiliationSummary[]>> => {
    return runQuery((ctx) => listProfessionalAffiliations(ctx));
  },
);

/** Manager-only: setores e escalas para montar a escala na tela Escalas. */
export const listSchedulingTreeFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<QueryResult<SchedulingTree>> => {
    return runQuery((ctx) => listSchedulingTree(ctx));
  },
);

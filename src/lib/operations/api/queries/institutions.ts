/**
 * Server functions de leitura para instituições (hospitals) e afiliação
 * profissional↔hospital — base da "central multi-instituição".
 */
import { createServerFn } from "@tanstack/react-start";
import { runQuery, type QueryResult } from "@/lib/server/fn-helpers";
import {
  listHospitals,
  listProfessionalAffiliations,
  type HospitalListItem,
  type ProfessionalAffiliationSummary,
} from "@/lib/services/operations/institutions";

export type { HospitalListItem, ProfessionalAffiliationSummary };

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

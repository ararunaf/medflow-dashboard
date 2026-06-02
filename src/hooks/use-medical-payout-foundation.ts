import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MutationResult, QueryResult } from "@/lib/server/fn-helpers";
import {
  calculateMedicalPayoutFn,
  createPayoutRuleFn,
  ensureDraftMedicalPayoutFn,
  loadMedicalPayoutFoundationBundleFn,
  markMedicalPayoutApprovedFn,
  markMedicalPayoutPaidFn,
  markMedicalPayoutReviewedFn,
  setPayoutRuleActiveFn,
  syncMedicalProductionFn,
  type MedicalPayoutFoundationBundle,
} from "@/lib/medical-payout/api/medical-payout-server";
import { opsKeys } from "@/lib/queries/keys";
import { unwrap } from "@/lib/queries/result";

export function defaultCompetenceMonthUtc(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export function medicalPayoutFoundationQueryOptions(competenceMonth: string) {
  return queryOptions<MedicalPayoutFoundationBundle>({
    queryKey: opsKeys.medicalPayoutFoundation(competenceMonth),
    queryFn: async () =>
      unwrap(
        (await loadMedicalPayoutFoundationBundleFn({
          data: { competenceMonth },
        })) as QueryResult<MedicalPayoutFoundationBundle>,
      ),
    staleTime: 15_000,
  });
}

export function useMedicalPayoutFoundationQuery(
  competenceMonth: string,
  opts: { enabled?: boolean } = {},
) {
  return useQuery({
    ...medicalPayoutFoundationQueryOptions(competenceMonth),
    enabled: opts.enabled ?? true,
  });
}

export function useMedicalPayoutMutations(competenceMonth: string) {
  const qc = useQueryClient();
  const inv = () => {
    void qc.invalidateQueries({ queryKey: opsKeys.medicalPayoutFoundation(competenceMonth) });
    void qc.invalidateQueries({ queryKey: opsKeys.tissFoundation() });
    void qc.invalidateQueries({ queryKey: opsKeys.timeline() });
  };

  return {
    syncProduction: useMutation({
      mutationFn: async () =>
        unwrap(
          (await syncMedicalProductionFn({ data: { competenceMonth } })) as MutationResult<{
            upserted: number;
          }>,
        ),
      onSuccess: () => inv(),
    }),
    createRule: useMutation({
      mutationFn: async (input: {
        payoutType: string;
        payoutPercentage?: number | null;
        fixedValue?: number | null;
        professionalId?: string | null;
        insuranceProviderId?: string | null;
        specialty?: string;
        active?: boolean;
      }) => unwrap((await createPayoutRuleFn({ data: input })) as MutationResult<unknown>),
      onSuccess: () => inv(),
    }),
    setRuleActive: useMutation({
      mutationFn: async (input: { ruleId: string; active: boolean }) =>
        unwrap((await setPayoutRuleActiveFn({ data: input })) as MutationResult<void>),
      onSuccess: () => inv(),
    }),
    ensureDraft: useMutation({
      mutationFn: async (professionalId: string) =>
        unwrap(
          (await ensureDraftMedicalPayoutFn({
            data: { professionalId, competenceMonth },
          })) as MutationResult<unknown>,
        ),
      onSuccess: () => inv(),
    }),
    calculate: useMutation({
      mutationFn: async (input: { payoutId: string; skipSync?: boolean }) =>
        unwrap(
          (await calculateMedicalPayoutFn({ data: input })) as MutationResult<{ completed: true }>,
        ),
      onSuccess: () => inv(),
    }),
    markReviewed: useMutation({
      mutationFn: async (payoutId: string) =>
        unwrap(
          (await markMedicalPayoutReviewedFn({ data: { payoutId } })) as MutationResult<unknown>,
        ),
      onSuccess: () => inv(),
    }),
    markApproved: useMutation({
      mutationFn: async (payoutId: string) =>
        unwrap(
          (await markMedicalPayoutApprovedFn({ data: { payoutId } })) as MutationResult<unknown>,
        ),
      onSuccess: () => inv(),
    }),
    markPaid: useMutation({
      mutationFn: async (payoutId: string) =>
        unwrap((await markMedicalPayoutPaidFn({ data: { payoutId } })) as MutationResult<unknown>),
      onSuccess: () => inv(),
    }),
  };
}

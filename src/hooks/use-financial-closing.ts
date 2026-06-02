import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FinancialClosingRow } from "@/lib/services/financial-closing/types";
import type { FinancialClosingDetailPayload } from "@/lib/financial-closing/api/financial-closing-server";
import {
  ensureDraftClosingFn,
  listFinancialClosingsFn,
  loadFinancialClosingDetailFn,
  refreshClosingTotalsFn,
  runFinancialClosingBulkOpFn,
  transitionClosingStatusFn,
} from "@/lib/financial-closing/api/financial-closing-server";
import type { MutationResult, QueryResult } from "@/lib/server/fn-helpers";
import { reportOperationalFailureClient } from "@/lib/observability/report-operational-failure-client";
import { opsKeys } from "@/lib/queries/keys";
import { unwrap } from "@/lib/queries/result";

export function financialClosingsQueryOptions(search?: string) {
  return queryOptions<FinancialClosingRow[]>({
    queryKey: opsKeys.financialClosingsList(search),
    queryFn: async () =>
      unwrap(
        (await listFinancialClosingsFn({
          data: { search, limit: 200 },
        })) as QueryResult<FinancialClosingRow[]>,
      ),
    staleTime: 10_000,
  });
}

export function financialClosingDetailQueryOptions(closingId: string | null) {
  return queryOptions<FinancialClosingDetailPayload>({
    queryKey: opsKeys.financialClosingDetail(closingId ?? ""),
    queryFn: async () =>
      unwrap(
        (await loadFinancialClosingDetailFn({
          data: { closingId: closingId! },
        })) as QueryResult<FinancialClosingDetailPayload>,
      ),
    enabled: !!closingId,
    staleTime: 8_000,
  });
}

export function useFinancialClosingsQuery(search?: string) {
  return useQuery(financialClosingsQueryOptions(search));
}

export function useFinancialClosingDetailQuery(closingId: string | null) {
  return useQuery({
    ...financialClosingDetailQueryOptions(closingId),
    enabled: !!closingId,
  });
}

export function useFinancialClosingMutations() {
  const qc = useQueryClient();
  const listKey = financialClosingsQueryOptions().queryKey;
  const invLists = () =>
    void qc.invalidateQueries({ queryKey: [...opsKeys.all, "financial-closings"] });
  const invDetail = (closingId: string) =>
    void qc.invalidateQueries({ queryKey: opsKeys.financialClosingDetail(closingId) });

  return {
    ensureDraft: useMutation({
      mutationFn: async (competenceMonth: string) =>
        unwrap(
          (await ensureDraftClosingFn({
            data: { competenceMonth },
          })) as MutationResult<FinancialClosingRow>,
        ),
      onSuccess: (_row) => {
        invLists();
      },
      onError: (err) => {
        void reportOperationalFailureClient({ source: "closing", err });
      },
    }),
    refreshTotals: useMutation({
      mutationFn: async (closingId: string) =>
        unwrap(
          (await refreshClosingTotalsFn({
            data: { closingId },
          })) as MutationResult<FinancialClosingRow>,
        ),
      onSuccess: (row) => {
        invLists();
        invDetail(row.id);
      },
      onError: (err) => {
        void reportOperationalFailureClient({ source: "closing", err });
      },
    }),
    bulkOp: useMutation({
      mutationFn: async (input: {
        op: "refresh_totals" | "send_to_review";
        closingIds: string[];
      }) =>
        unwrap(
          (await runFinancialClosingBulkOpFn({
            data: input,
          })) as MutationResult<{ processed: FinancialClosingRow[]; skipped: number }>,
        ),
      onSuccess: (res) => {
        invLists();
        for (const row of res.processed) {
          invDetail(row.id);
        }
        void qc.invalidateQueries({ queryKey: opsKeys.timeline() });
      },
      onError: (err) => {
        void reportOperationalFailureClient({ source: "closing", err });
      },
    }),
    transitionStatus: useMutation({
      mutationFn: async (input: {
        closingId: string;
        toStatus: FinancialClosingRow["status"];
        note?: string;
      }) =>
        unwrap(
          (await transitionClosingStatusFn({ data: input })) as MutationResult<FinancialClosingRow>,
        ),
      onMutate: async (vars) => {
        await qc.cancelQueries({ queryKey: listKey });
        const previousList = qc.getQueryData<FinancialClosingRow[]>(listKey);
        if (previousList) {
          qc.setQueryData(
            listKey,
            previousList.map((r) =>
              r.id === vars.closingId ? { ...r, status: vars.toStatus } : r,
            ),
          );
        }
        const detailKey = opsKeys.financialClosingDetail(vars.closingId);
        await qc.cancelQueries({ queryKey: detailKey });
        const previousDetail = qc.getQueryData<FinancialClosingDetailPayload>(detailKey);
        if (previousDetail?.closing) {
          qc.setQueryData(detailKey, {
            ...previousDetail,
            closing: { ...previousDetail.closing, status: vars.toStatus },
          });
        }
        return { previousList, previousDetail, closingId: vars.closingId };
      },
      onError: (err, vars, ctx) => {
        if (ctx?.previousList) qc.setQueryData(listKey, ctx.previousList);
        if (ctx?.previousDetail) {
          qc.setQueryData(opsKeys.financialClosingDetail(ctx.closingId), ctx.previousDetail);
        }
        void reportOperationalFailureClient({ source: "closing", err });
      },
      onSuccess: (row) => {
        invLists();
        invDetail(row.id);
        void qc.invalidateQueries({
          queryKey: opsKeys.medicalPayoutFoundation(row.competence_month),
        });
        void qc.invalidateQueries({ queryKey: opsKeys.timeline() });
      },
    }),
  };
}

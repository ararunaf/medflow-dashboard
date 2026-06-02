import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  OperationalReconciliationRow,
  ReconciliationMatchingMode,
} from "@/lib/services/reconciliation/types";
import type { OperationalReconciliationDetailPayload } from "@/lib/operational-reconciliation/api/reconciliation-server";
import {
  applyReconciliationCsvFn,
  ensureDraftReconciliationFn,
  finalizeReconciliationFn,
  linkReconciliationClosingFn,
  listOperationalReconciliationsFn,
  loadOperationalReconciliationDetailFn,
  resolveReconciliationIssueFn,
  runOperationalMatchingFn,
  runReconciliationBulkOpFn,
  upsertManualReconciliationItemFn,
} from "@/lib/operational-reconciliation/api/reconciliation-server";
import type { MutationResult, QueryResult } from "@/lib/server/fn-helpers";
import { reportOperationalFailureClient } from "@/lib/observability/report-operational-failure-client";
import { opsKeys } from "@/lib/queries/keys";
import { unwrap } from "@/lib/queries/result";

export function operationalReconciliationsQueryOptions(search?: string) {
  return queryOptions<OperationalReconciliationRow[]>({
    queryKey: opsKeys.operationalReconciliationsList(search),
    queryFn: async () =>
      unwrap(
        (await listOperationalReconciliationsFn({
          data: { search, limit: 200 },
        })) as QueryResult<OperationalReconciliationRow[]>,
      ),
    staleTime: 10_000,
  });
}

export function operationalReconciliationDetailQueryOptions(reconciliationId: string | null) {
  return queryOptions<OperationalReconciliationDetailPayload>({
    queryKey: opsKeys.operationalReconciliationDetail(reconciliationId ?? ""),
    queryFn: async () =>
      unwrap(
        (await loadOperationalReconciliationDetailFn({
          data: { reconciliationId: reconciliationId! },
        })) as QueryResult<OperationalReconciliationDetailPayload>,
      ),
    enabled: !!reconciliationId,
    staleTime: 8_000,
  });
}

export function useOperationalReconciliationsQuery(search?: string) {
  return useQuery(operationalReconciliationsQueryOptions(search));
}

export function useOperationalReconciliationDetailQuery(reconciliationId: string | null) {
  return useQuery({
    ...operationalReconciliationDetailQueryOptions(reconciliationId),
    enabled: !!reconciliationId,
  });
}

export function useOperationalReconciliationMutations() {
  const qc = useQueryClient();
  const listKey = operationalReconciliationsQueryOptions().queryKey;
  const invLists = () =>
    void qc.invalidateQueries({ queryKey: [...opsKeys.all, "operational-reconciliations"] });
  const invDetail = (reconciliationId: string) =>
    void qc.invalidateQueries({
      queryKey: opsKeys.operationalReconciliationDetail(reconciliationId),
    });

  return {
    ensureDraft: useMutation({
      mutationFn: async (competenceMonth: string) =>
        unwrap(
          (await ensureDraftReconciliationFn({
            data: { competenceMonth },
          })) as MutationResult<OperationalReconciliationRow>,
        ),
      onSuccess: () => {
        invLists();
      },
      onError: (err) => {
        void reportOperationalFailureClient({ source: "reconciliation", err });
      },
    }),
    runMatching: useMutation({
      mutationFn: async (input: { reconciliationId: string; mode: ReconciliationMatchingMode }) =>
        unwrap((await runOperationalMatchingFn({ data: input })) as MutationResult<{ ok: true }>),
      onSuccess: (_d, vars) => {
        invLists();
        invDetail(vars.reconciliationId);
        void qc.invalidateQueries({ queryKey: opsKeys.timeline() });
      },
      onError: (err) => {
        void reportOperationalFailureClient({ source: "reconciliation", err });
      },
    }),
    applyCsv: useMutation({
      mutationFn: async (input: { reconciliationId: string; csvText: string }) =>
        unwrap(
          (await applyReconciliationCsvFn({ data: input })) as MutationResult<{
            rowsInserted: number;
          }>,
        ),
      onSuccess: (_d, vars) => {
        invLists();
        invDetail(vars.reconciliationId);
      },
      onError: (err) => {
        void reportOperationalFailureClient({ source: "upload", err });
      },
    }),
    linkClosing: useMutation({
      mutationFn: async (input: { reconciliationId: string; closingId: string | null }) =>
        unwrap(
          (await linkReconciliationClosingFn({
            data: input,
          })) as MutationResult<OperationalReconciliationRow>,
        ),
      onSuccess: (row) => {
        invLists();
        invDetail(row.id);
      },
      onError: (err) => {
        void reportOperationalFailureClient({ source: "reconciliation", err });
      },
    }),
    finalize: useMutation({
      mutationFn: async (reconciliationId: string) =>
        unwrap(
          (await finalizeReconciliationFn({
            data: { reconciliationId },
          })) as MutationResult<OperationalReconciliationRow>,
        ),
      onSuccess: (row) => {
        invLists();
        invDetail(row.id);
        void qc.invalidateQueries({ queryKey: opsKeys.timeline() });
      },
      onError: (err) => {
        void reportOperationalFailureClient({ source: "reconciliation", err });
      },
    }),
    resolveIssue: useMutation({
      mutationFn: async (input: { issueId: string; resolved: boolean; reconciliationId: string }) =>
        unwrap(
          (await resolveReconciliationIssueFn({ data: input })) as MutationResult<{ ok: true }>,
        ),
      onSuccess: (_d, vars) => {
        invDetail(vars.reconciliationId);
        invLists();
      },
      onError: (err) => {
        void reportOperationalFailureClient({ source: "reconciliation", err });
      },
    }),
    upsertManualItem: useMutation({
      mutationFn: async (input: {
        reconciliationId: string;
        referenceId: string;
        expectedValue: number;
        receivedValue: number;
      }) =>
        unwrap(
          (await upsertManualReconciliationItemFn({ data: input })) as MutationResult<{ ok: true }>,
        ),
      onSuccess: (_d, vars) => {
        invDetail(vars.reconciliationId);
        invLists();
      },
      onError: (err) => {
        void reportOperationalFailureClient({ source: "reconciliation", err });
      },
    }),
    bulkRefresh: useMutation({
      mutationFn: async (reconciliationIds: string[]) =>
        unwrap(
          (await runReconciliationBulkOpFn({
            data: { op: "refresh_totals", reconciliationIds },
          })) as MutationResult<{ processed: OperationalReconciliationRow[]; skipped: number }>,
        ),
      onSuccess: (res) => {
        invLists();
        for (const row of res.processed) {
          invDetail(row.id);
        }
      },
      onError: (err) => {
        void reportOperationalFailureClient({ source: "reconciliation", err });
      },
    }),
  };
}

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/lib/database.types";
import type { QueryResult } from "@/lib/server/fn-helpers";
import {
  addTissGuideItemFn,
  assignGuideToBatchFn,
  closeTissBatchFn,
  createInsuranceContractFn,
  createInsuranceProviderFn,
  createInsuranceRuleFn,
  createTissBatchFn,
  createTissDenialAppealFn,
  createTissDenialFn,
  createTissGuideFn,
  createTissReturnFn,
  createTussProcedureFn,
  exportTissBatchXmlFn,
  listInsuranceContractsFn,
  listInsuranceRulesFn,
  listTissBatchExportsFn,
  loadTissFoundationBundleFn,
  removeGuideFromBatchFn,
  removeTissGuideItemFn,
  setTissGuideStatusFn,
  updateTissDenialAppealStatusFn,
  updateTissDenialStatusFn,
  updateTissReturnStatusFn,
  type TissFoundationBundle,
} from "@/lib/tiss/api/tiss-server";
import { opsKeys } from "@/lib/queries/keys";
import { unwrap } from "@/lib/queries/result";

export function tissFoundationQueryOptions() {
  return queryOptions<TissFoundationBundle>({
    queryKey: opsKeys.tissFoundation(),
    queryFn: async () =>
      unwrap((await loadTissFoundationBundleFn()) as QueryResult<TissFoundationBundle>),
    staleTime: 20_000,
  });
}

export function useTissFoundationQuery(opts: { enabled?: boolean } = {}) {
  return useQuery({ ...tissFoundationQueryOptions(), enabled: opts.enabled ?? true });
}

type TissBatchExportListRow = Pick<
  Database["public"]["Tables"]["tiss_batch_exports"]["Row"],
  "id" | "batch_id" | "checksum_sha256" | "byte_length" | "preview" | "created_at"
>;

export function useTissBatchExportsQuery(batchId: string | null) {
  return useQuery({
    queryKey: opsKeys.tissBatchExports(batchId ?? "none"),
    queryFn: async (): Promise<TissBatchExportListRow[]> => {
      if (!batchId) return [];
      return unwrap(
        (await listTissBatchExportsFn({ data: { batchId } })) as QueryResult<
          TissBatchExportListRow[]
        >,
      );
    },
    enabled: !!batchId,
  });
}

export function useInsuranceContractsQuery(providerId: string | null) {
  return useQuery({
    queryKey: [...opsKeys.tissFoundation(), "contracts", providerId ?? "none"],
    queryFn: async () => {
      if (!providerId) return [];
      return unwrap(
        (await listInsuranceContractsFn({ data: { providerId } })) as QueryResult<unknown[]>,
      );
    },
    enabled: !!providerId,
  });
}

export function useInsuranceRulesQuery(contractId: string | null) {
  return useQuery({
    queryKey: [...opsKeys.tissFoundation(), "rules", contractId ?? "none"],
    queryFn: async () => {
      if (!contractId) return [];
      return unwrap(
        (await listInsuranceRulesFn({ data: { contractId } })) as QueryResult<unknown[]>,
      );
    },
    enabled: !!contractId,
  });
}

export function useTissMutations() {
  const qc = useQueryClient();
  const inv = () => {
    void qc.invalidateQueries({ queryKey: opsKeys.tissFoundation() });
    void qc.invalidateQueries({ queryKey: opsKeys.timeline() });
  };

  const createProvider = useMutation({
    mutationFn: async (input: { name: string; ansCode?: string }) =>
      unwrap(await createInsuranceProviderFn({ data: input })),
    onSuccess: () => inv(),
  });
  const createContract = useMutation({
    mutationFn: async (input: {
      insuranceProviderId: string;
      contractNumber: string;
      name?: string;
    }) => unwrap(await createInsuranceContractFn({ data: input })),
    onSuccess: () => inv(),
  });
  const createRule = useMutation({
    mutationFn: async (input: {
      insuranceContractId: string;
      name: string;
      parameters?: Record<string, unknown>;
    }) => unwrap(await createInsuranceRuleFn({ data: input })),
    onSuccess: () => inv(),
  });
  const createProcedure = useMutation({
    mutationFn: async (input: {
      code: string;
      description: string;
      specialty?: string;
      operationalGroup?: string;
      defaultValue?: number;
    }) => unwrap(await createTussProcedureFn({ data: input })),
    onSuccess: () => inv(),
  });
  const createGuide = useMutation({
    mutationFn: async (input: {
      guideType: string;
      patientName: string;
      insuranceProviderId: string;
      insuranceContractId?: string | null;
      professionalId: string;
      attendanceDate: string;
    }) => unwrap(await createTissGuideFn({ data: input })),
    onSuccess: () => inv(),
  });
  const setGuideStatus = useMutation({
    mutationFn: async (input: { guideId: string; status: string }) =>
      unwrap(await setTissGuideStatusFn({ data: input })),
    onSuccess: () => inv(),
  });
  const addGuideItem = useMutation({
    mutationFn: async (input: {
      guideId: string;
      procedureId: string;
      quantity?: number;
      unitValue: number;
      executionDate: string;
    }) => unwrap(await addTissGuideItemFn({ data: input })),
    onSuccess: () => inv(),
  });
  const removeGuideItem = useMutation({
    mutationFn: async (input: { itemId: string }) =>
      unwrap(await removeTissGuideItemFn({ data: input })),
    onSuccess: () => inv(),
  });
  const createBatch = useMutation({
    mutationFn: async (input: { competence: string }) =>
      unwrap(await createTissBatchFn({ data: input })),
    onSuccess: () => inv(),
  });
  const assignGuide = useMutation({
    mutationFn: async (input: { guideId: string; batchId: string }) =>
      unwrap(await assignGuideToBatchFn({ data: input })),
    onSuccess: () => inv(),
  });
  const removeGuideFromBatch = useMutation({
    mutationFn: async (input: { guideId: string }) =>
      unwrap(await removeGuideFromBatchFn({ data: input })),
    onSuccess: () => inv(),
  });
  const closeBatch = useMutation({
    mutationFn: async (input: { batchId: string }) =>
      unwrap(await closeTissBatchFn({ data: input })),
    onSuccess: () => inv(),
  });
  const exportBatchXml = useMutation({
    mutationFn: async (input: { batchId: string }) =>
      unwrap(await exportTissBatchXmlFn({ data: input })),
    onSuccess: (_data, vars) => {
      inv();
      void qc.invalidateQueries({ queryKey: opsKeys.tissBatchExports(vars.batchId) });
    },
  });

  const createReturn = useMutation({
    mutationFn: async (input: { batchId: string; returnReference: string }) =>
      unwrap(await createTissReturnFn({ data: input })),
    onSuccess: () => inv(),
  });
  const updateReturnStatus = useMutation({
    mutationFn: async (input: { returnId: string; status: string }) =>
      unwrap(await updateTissReturnStatusFn({ data: input })),
    onSuccess: () => inv(),
  });
  const createDenial = useMutation({
    mutationFn: async (input: {
      returnId: string;
      guideId: string;
      denialType: string;
      denialReasonCode?: string;
      denialReasonDescription?: string;
      deniedValue: number;
      status?: string;
    }) => unwrap(await createTissDenialFn({ data: input })),
    onSuccess: () => inv(),
  });
  const updateDenial = useMutation({
    mutationFn: async (input: {
      denialId: string;
      status?: string;
      deniedValue?: number;
      denialReasonCode?: string;
      denialReasonDescription?: string;
    }) => unwrap(await updateTissDenialStatusFn({ data: input })),
    onSuccess: () => inv(),
  });
  const createAppeal = useMutation({
    mutationFn: async (input: { denialId: string; appealReason: string }) =>
      unwrap(await createTissDenialAppealFn({ data: input })),
    onSuccess: () => inv(),
  });
  const updateAppealStatus = useMutation({
    mutationFn: async (input: { appealId: string; appealStatus: string }) =>
      unwrap(await updateTissDenialAppealStatusFn({ data: input })),
    onSuccess: () => inv(),
  });

  return {
    createProvider,
    createContract,
    createRule,
    createProcedure,
    createGuide,
    setGuideStatus,
    addGuideItem,
    removeGuideItem,
    createBatch,
    assignGuide,
    removeGuideFromBatch,
    closeBatch,
    exportBatchXml,
    createReturn,
    updateReturnStatus,
    createDenial,
    updateDenial,
    createAppeal,
    updateAppealStatus,
  };
}

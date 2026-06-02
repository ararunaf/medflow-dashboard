import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  applyDemoCatalogSeedFn,
  getOperationalReadinessFn,
  saveTenantSettingsFn,
} from "@/lib/commercial/api/commercial-server";
import type { OperationalReadinessPayload } from "@/lib/commercial/api/commercial-server";
import { opsKeys } from "@/lib/queries/keys";
import { unwrap } from "@/lib/queries/result";
import type { QueryResult } from "@/lib/server/fn-helpers";

export function operationalReadinessQueryOptions() {
  return queryOptions<OperationalReadinessPayload>({
    queryKey: opsKeys.operationalReadiness(),
    queryFn: async () =>
      unwrap((await getOperationalReadinessFn()) as QueryResult<OperationalReadinessPayload>),
    staleTime: 30_000,
  });
}

export function useOperationalReadinessQuery() {
  return useQuery(operationalReadinessQueryOptions());
}

export function useSaveTenantSettingsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      unwrap(await saveTenantSettingsFn({ data: payload })),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: opsKeys.operationalReadiness() });
      void qc.invalidateQueries({ queryKey: opsKeys.tenantSettings() });
    },
  });
}

export function useApplyDemoCatalogMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => unwrap(await applyDemoCatalogSeedFn({ data: {} })),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: opsKeys.tissFoundation() });
      void qc.invalidateQueries({ queryKey: opsKeys.operationalReadiness() });
    },
  });
}

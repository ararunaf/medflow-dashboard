import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OperationalMonitoringBundle } from "@/lib/operational-observability/api/operational-observability-server";
import type { OperationalBackupBundle } from "@/lib/services/operational-backup/operational-backup-export-service";
import {
  exportOperationalBackupBundleFn,
  getOperationalMonitoringBundleFn,
} from "@/lib/operational-observability/api/operational-observability-server";
import type { QueryResult } from "@/lib/server/fn-helpers";
import { opsKeys } from "@/lib/queries/keys";
import { unwrap } from "@/lib/queries/result";

export function operationalMonitoringQueryOptions() {
  return queryOptions<OperationalMonitoringBundle>({
    queryKey: opsKeys.operationalMonitoring(),
    queryFn: async () =>
      unwrap(
        (await getOperationalMonitoringBundleFn()) as QueryResult<OperationalMonitoringBundle>,
      ),
    staleTime: 20_000,
  });
}

export function useOperationalMonitoringQuery() {
  return useQuery(operationalMonitoringQueryOptions());
}

export function useExportOperationalBackupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      unwrap((await exportOperationalBackupBundleFn()) as QueryResult<OperationalBackupBundle>),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: opsKeys.operationalMonitoring() });
    },
  });
}

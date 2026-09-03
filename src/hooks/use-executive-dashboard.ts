import { queryOptions, useQuery } from "@tanstack/react-query";
import { getExecutiveDashboardBundleFn } from "@/lib/executive-dashboard/api/executive-dashboard-server";
import type { ExecutiveDashboardBundlePayload } from "@/lib/executive-dashboard/api/executive-dashboard-server";
import { getWorkGroupProductionFn } from "@/lib/executive-dashboard/api/work-group-report-server";
import type { WorkGroupProductionRow } from "@/lib/executive-dashboard/api/work-group-report-server";
import type { QueryResult } from "@/lib/server/fn-helpers";
import { opsKeys } from "@/lib/queries/keys";
import { unwrap } from "@/lib/queries/result";

export function executiveDashboardBundleQueryOptions(competenceMonth?: string) {
  return queryOptions<ExecutiveDashboardBundlePayload>({
    queryKey: opsKeys.executiveDashboardBundle(competenceMonth),
    queryFn: async () =>
      unwrap(
        (await getExecutiveDashboardBundleFn({
          data: { competence_month: competenceMonth },
        })) as QueryResult<ExecutiveDashboardBundlePayload>,
      ),
    staleTime: 12_000,
  });
}

export function useExecutiveDashboardBundleQuery(competenceMonth?: string) {
  return useQuery(executiveDashboardBundleQueryOptions(competenceMonth));
}

export function workGroupProductionQueryOptions(competenceMonth: string) {
  return queryOptions<WorkGroupProductionRow[]>({
    queryKey: opsKeys.workGroupProduction(competenceMonth),
    queryFn: async () =>
      unwrap(await getWorkGroupProductionFn({ data: { competence_month: competenceMonth } })),
    staleTime: 12_000,
  });
}

export function useWorkGroupProductionQuery(competenceMonth: string, opts: { enabled?: boolean } = {}) {
  return useQuery({ ...workGroupProductionQueryOptions(competenceMonth), ...opts });
}

export function executiveDashboardRoutePrefetch(
  queryClient: import("@tanstack/react-query").QueryClient,
  competenceMonth?: string,
) {
  return queryClient
    .prefetchQuery(executiveDashboardBundleQueryOptions(competenceMonth))
    .catch(() => undefined);
}

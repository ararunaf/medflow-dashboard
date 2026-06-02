/**
 * Analytics operacional — série histórica + comparativo de período.
 * Invalidação via `opsKeys.operationalAnalytics()` no realtime.
 */
import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  getOperationalAnalyticsFn,
  type OperationalAnalyticsSnapshot,
} from "@/lib/operations/api/queries/operational-analytics";
import { opsKeys } from "@/lib/queries/keys";
import { unwrap } from "@/lib/queries/result";

const DEFAULT_STALE_MS = 60_000;

type ReadOpts = {
  enabled?: boolean;
  staleTime?: number;
  refetchOnWindowFocus?: boolean | "always";
};

export const operationalAnalyticsQueryOptions = () =>
  queryOptions<OperationalAnalyticsSnapshot>({
    queryKey: opsKeys.operationalAnalytics(),
    queryFn: async () => unwrap(await getOperationalAnalyticsFn()),
    staleTime: DEFAULT_STALE_MS,
  });

export function useOperationalAnalyticsQuery(opts: ReadOpts = {}) {
  return useQuery({ ...operationalAnalyticsQueryOptions(), ...opts });
}

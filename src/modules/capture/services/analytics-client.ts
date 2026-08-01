import { getAnalyticsSnapshotFn } from "@/lib/capture/api/analytics-server";
import type { AnalyticsFilters, AnalyticsSnapshot } from "@/lib/capture/analytics";
import type { QueryResult } from "@/lib/operations/api";
import { describeError, unwrap } from "@/lib/queries/result";

export async function fetchAnalyticsSnapshot(input?: {
  filters?: AnalyticsFilters;
  trendDays?: number;
}): Promise<AnalyticsSnapshot> {
  const res = (await getAnalyticsSnapshotFn({
    data: input ?? {},
  })) as QueryResult<AnalyticsSnapshot>;
  if (!res.ok) throw new Error(describeError(res).message);
  return unwrap<AnalyticsSnapshot>(res);
}

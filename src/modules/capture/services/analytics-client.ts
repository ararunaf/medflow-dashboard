import { getAnalyticsSnapshotFn } from "@/lib/capture/api/analytics-server";
import type { AnalyticsFilters, AnalyticsSnapshot } from "@/lib/capture/analytics";
import { describeError } from "@/lib/queries/result";

export async function fetchAnalyticsSnapshot(input?: {
  filters?: AnalyticsFilters;
  trendDays?: number;
}): Promise<AnalyticsSnapshot> {
  const res = await getAnalyticsSnapshotFn({ data: input ?? {} });
  if (!res.ok) throw new Error(describeError(res));
  return res.data;
}

/**
 * Query server-side: analytics operacional (KPIs + tendências leves).
 */
import { createServerFn } from "@tanstack/react-start";
import { loadOperationalAnalyticsSnapshot } from "@/lib/operations/analytics/operational-analytics-service";
import { runQuery, type QueryResult } from "@/lib/server/fn-helpers";
import type { OperationalAnalyticsSnapshot } from "@/lib/operations/analytics/operational-analytics-service";

export type { OperationalAnalyticsSnapshot };

export const getOperationalAnalyticsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<QueryResult<OperationalAnalyticsSnapshot>> => {
    return runQuery(async (ctx) => loadOperationalAnalyticsSnapshot(ctx));
  },
);

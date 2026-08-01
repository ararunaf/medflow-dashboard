/**
 * Cliente — dashboard e métricas do Learning Loop.
 */
import {
  getCaptureLearningDashboardFn,
  getCaptureLearningMetricsFn,
  getCaptureLearningRecordsFn,
} from "@/lib/capture/api/capture-server";
import type {
  LearningDashboardView,
  LearningMetricsStore,
  LearningRecordsStore,
} from "@/lib/capture/learning";
import type { QueryResult } from "@/lib/operations/api";
import { unwrap } from "@/lib/queries/result";

export async function fetchCaptureLearningDashboard(): Promise<LearningDashboardView> {
  const res = (await getCaptureLearningDashboardFn()) as QueryResult<LearningDashboardView>;
  return unwrap<LearningDashboardView>(res);
}

export async function fetchCaptureLearningMetrics(): Promise<LearningMetricsStore> {
  const res = (await getCaptureLearningMetricsFn()) as QueryResult<LearningMetricsStore>;
  return unwrap<LearningMetricsStore>(res);
}

export async function fetchCaptureLearningRecords(): Promise<LearningRecordsStore> {
  const res = (await getCaptureLearningRecordsFn()) as QueryResult<LearningRecordsStore>;
  return unwrap<LearningRecordsStore>(res);
}

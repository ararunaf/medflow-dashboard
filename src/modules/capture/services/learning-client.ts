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

export async function fetchCaptureLearningDashboard(): Promise<LearningDashboardView> {
  const res = await getCaptureLearningDashboardFn();
  return res.data as LearningDashboardView;
}

export async function fetchCaptureLearningMetrics(): Promise<LearningMetricsStore> {
  const res = await getCaptureLearningMetricsFn();
  return res.data as LearningMetricsStore;
}

export async function fetchCaptureLearningRecords(): Promise<LearningRecordsStore> {
  const res = await getCaptureLearningRecordsFn();
  return res.data as LearningRecordsStore;
}

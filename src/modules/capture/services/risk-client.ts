import {
  getCaptureRiskAssessmentJsonDownloadFn,
  getCaptureRiskAssessmentReportFn,
  getCaptureRiskDashboardFn,
} from "@/lib/capture/api/capture-server";
import type { RiskDashboardView } from "@/lib/capture/risk";
import type { QueryResult } from "@/lib/operations/api";
import { unwrap } from "@/lib/queries/result";

type RiskReportData = {
  summary: unknown;
  report: unknown;
  metadata: unknown;
};

export async function fetchCaptureRiskAssessment(sessionId: string) {
  const result = (await getCaptureRiskAssessmentReportFn({
    data: { sessionId },
  })) as QueryResult<RiskReportData>;
  return unwrap<RiskReportData>(result);
}

export async function downloadRiskAssessmentJson(sessionId: string): Promise<string> {
  const result = (await getCaptureRiskAssessmentJsonDownloadFn({
    data: { sessionId },
  })) as QueryResult<{ signedUrl: string; expiresAt: string; filename: string }>;
  return unwrap<{ signedUrl: string; expiresAt: string; filename: string }>(result).signedUrl;
}

export async function fetchCaptureRiskDashboard(): Promise<RiskDashboardView> {
  const res = (await getCaptureRiskDashboardFn()) as QueryResult<RiskDashboardView>;
  return unwrap<RiskDashboardView>(res);
}

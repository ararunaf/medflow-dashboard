import {
  getCaptureRiskAssessmentJsonDownloadFn,
  getCaptureRiskAssessmentReportFn,
  getCaptureRiskDashboardFn,
} from "@/lib/capture/api/capture-server";
import type { RiskDashboardView } from "@/lib/capture/risk";

export async function fetchCaptureRiskAssessment(sessionId: string) {
  const result = await getCaptureRiskAssessmentReportFn({ data: { sessionId } });
  return result.data;
}

export async function downloadRiskAssessmentJson(sessionId: string): Promise<string> {
  const result = await getCaptureRiskAssessmentJsonDownloadFn({ data: { sessionId } });
  return result.data.signedUrl;
}

export async function fetchCaptureRiskDashboard(): Promise<RiskDashboardView> {
  const res = await getCaptureRiskDashboardFn();
  return res.data;
}

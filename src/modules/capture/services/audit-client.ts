/**
 * Cliente — consulta e download de AuditReport.
 */
import {
  getCaptureAuditReportFn,
  getCaptureAuditReportJsonDownloadFn,
} from "@/lib/capture/api/capture-server";
import type { AuditReport, AuditReportSummaryMeta } from "@/lib/capture/audit";

export type CaptureAuditReportView = {
  summary: AuditReportSummaryMeta | null;
  report: AuditReport | null;
};

export async function fetchCaptureAuditReport(
  sessionId: string,
): Promise<CaptureAuditReportView> {
  const res = await getCaptureAuditReportFn({ data: { sessionId } });
  return {
    summary: (res.data.summary as AuditReportSummaryMeta | null) ?? null,
    report: (res.data.report as AuditReport | null) ?? null,
  };
}

export async function downloadAuditReportJson(sessionId: string): Promise<string> {
  const res = await getCaptureAuditReportJsonDownloadFn({ data: { sessionId } });
  return res.data.signedUrl;
}

/**
 * Cliente — consulta e download de AuditReport.
 */
import {
  getCaptureAuditReportFn,
  getCaptureAuditReportJsonDownloadFn,
} from "@/lib/capture/api/capture-server";
import type { AuditReport, AuditReportSummaryMeta } from "@/lib/capture/audit";
import type { QueryResult } from "@/lib/operations/api";
import { unwrap } from "@/lib/queries/result";

export type CaptureAuditReportView = {
  summary: AuditReportSummaryMeta | null;
  report: AuditReport | null;
};

type AuditReportFnData = {
  summary: unknown;
  report: unknown;
};

export async function fetchCaptureAuditReport(sessionId: string): Promise<CaptureAuditReportView> {
  const res = (await getCaptureAuditReportFn({
    data: { sessionId },
  })) as QueryResult<AuditReportFnData>;
  const data = unwrap<AuditReportFnData>(res);
  return {
    summary: (data.summary as AuditReportSummaryMeta | null) ?? null,
    report: (data.report as AuditReport | null) ?? null,
  };
}

export async function downloadAuditReportJson(sessionId: string): Promise<string> {
  const res = (await getCaptureAuditReportJsonDownloadFn({
    data: { sessionId },
  })) as QueryResult<{ signedUrl: string; expiresAt: string; filename: string }>;
  return unwrap<{ signedUrl: string; expiresAt: string; filename: string }>(res).signedUrl;
}

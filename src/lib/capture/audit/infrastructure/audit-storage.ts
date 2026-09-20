/**
 * Persistência de AuditReport no bucket clinical-documents.
 * MEDICFLOW-PREVENTIVE-AUDIT-01
 *
 * Preserva ocr_result.json e structured_guide.json existentes.
 */
import type { ServiceCtx } from "@/lib/services/operations/types";
import {
  captureStorageDownload,
  captureStorageUpload,
} from "../../infrastructure/enterprise-storage-bridge";
import { buildCaptureReportDownloadUrl } from "../../infrastructure/report-download-url";
import type { AuditReport, AuditReportSummaryMeta } from "../types/audit-report";

export const AUDIT_REPORT_FILENAME = "audit_report.json";

export function buildAuditReportStoragePath(tenantId: string, sessionId: string): string {
  return `${tenantId}/${sessionId}/audit/${AUDIT_REPORT_FILENAME}`;
}

export async function persistAuditReport(
  ctx: ServiceCtx,
  sessionId: string,
  report: AuditReport,
): Promise<{ storagePath: string }> {
  const storagePath = buildAuditReportStoragePath(ctx.tenantId, sessionId);
  const payload = JSON.stringify(report, null, 2);

  await captureStorageUpload(ctx, {
    key: storagePath,
    body: new TextEncoder().encode(payload),
    contentType: "application/json",
    upsert: true,
    sessionId,
    encrypt: true,
  });
  return { storagePath };
}

export async function loadAuditReport(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<AuditReport | null> {
  const storagePath = buildAuditReportStoragePath(ctx.tenantId, sessionId);
  const body = await captureStorageDownload(ctx, { key: storagePath, sessionId, encrypted: true });
  if (!body) return null;
  const text = new TextDecoder().decode(body);
  return JSON.parse(text) as AuditReport;
}

export async function getAuditReportSignedUrl(
  ctx: ServiceCtx,
  sessionId: string,
  ttlSeconds = 3600,
): Promise<{ signedUrl: string; expiresAt: string; filename: string }> {
  void ctx;
  return {
    signedUrl: buildCaptureReportDownloadUrl(sessionId, "audit"),
    expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    filename: AUDIT_REPORT_FILENAME,
  };
}

export function buildAuditReportSummaryFromResult(
  report: AuditReport,
  storagePath: string,
  auditDurationMs: number,
): AuditReportSummaryMeta {
  return {
    status: "completed",
    score: report.score.overall,
    approved: report.score.approved,
    blocking: report.score.blocking,
    criticalCount: report.summary.criticalCount,
    highCount: report.summary.highCount,
    mediumCount: report.summary.mediumCount,
    lowCount: report.summary.lowCount,
    totalFindings: report.summary.totalFindings,
    storagePath,
    auditDurationMs,
  };
}

export function buildAuditReportSummaryFromMetadata(
  metadata: Record<string, unknown>,
): AuditReportSummaryMeta | null {
  const audit = metadata.audit as AuditReportSummaryMeta | undefined;
  if (!audit || typeof audit !== "object") return null;
  return audit;
}

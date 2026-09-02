/**
 * Persistência de FieldAuditReport no bucket clinical-documents — F2-S4.
 * Mesmo padrão de contract-intelligence-storage.ts / risk-storage.
 */
import type { ServiceCtx } from "@/lib/services/operations/types";
import {
  captureStorageDownload,
  captureStorageUpload,
} from "../../infrastructure/enterprise-storage-bridge";
import type { FieldAuditReport, FieldAuditSummaryMeta } from "../types/field-audit-report";

export const FIELD_AUDIT_FILENAME = "field_audit_report.json";

export function buildFieldAuditStoragePath(tenantId: string, sessionId: string): string {
  return `${tenantId}/${sessionId}/audit/${FIELD_AUDIT_FILENAME}`;
}

export async function persistFieldAuditReport(
  ctx: ServiceCtx,
  sessionId: string,
  report: FieldAuditReport,
): Promise<{ storagePath: string }> {
  const storagePath = buildFieldAuditStoragePath(ctx.tenantId, sessionId);
  const payload = JSON.stringify(report, null, 2);

  await captureStorageUpload(ctx, {
    key: storagePath,
    body: new TextEncoder().encode(payload),
    contentType: "application/json",
    upsert: true,
    sessionId,
  });
  return { storagePath };
}

export async function loadFieldAuditReport(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<FieldAuditReport | null> {
  const storagePath = buildFieldAuditStoragePath(ctx.tenantId, sessionId);
  const body = await captureStorageDownload(ctx, { key: storagePath, sessionId });
  if (!body) return null;
  const text = new TextDecoder().decode(body);
  return JSON.parse(text) as FieldAuditReport;
}

export function buildFieldAuditSummaryFromReport(
  report: FieldAuditReport,
  storagePath: string,
  durationMs: number,
): FieldAuditSummaryMeta {
  return {
    status: "completed",
    opinionsGenerated: report.summary.opinionsGenerated,
    criticalCount: report.summary.criticalCount,
    attentionCount: report.summary.attentionCount,
    storagePath,
    durationMs,
  };
}

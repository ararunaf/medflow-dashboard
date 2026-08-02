/**
 * Persistência de RiskAssessmentReport no bucket clinical-documents.
 * MEDICFLOW-GLOSA-RISK-ENGINE-01
 *
 * Preserva audit_report.json, contract_intelligence_report.json e demais artefatos.
 */
import type { ServiceCtx } from "@/lib/services/operations/types";
import {
  captureStorageDownload,
  captureStorageSignedUrl,
  captureStorageUpload,
} from "../../infrastructure/enterprise-storage-bridge";
import type { RiskAssessmentReport, RiskAssessmentSummaryMeta } from "../types/risk-assessment";

export const RISK_ASSESSMENT_FILENAME = "risk_assessment.json";

export function buildRiskAssessmentStoragePath(tenantId: string, sessionId: string): string {
  return `${tenantId}/${sessionId}/audit/${RISK_ASSESSMENT_FILENAME}`;
}

export async function persistRiskAssessmentReport(
  ctx: ServiceCtx,
  sessionId: string,
  report: RiskAssessmentReport,
): Promise<{ storagePath: string }> {
  const storagePath = buildRiskAssessmentStoragePath(ctx.tenantId, sessionId);
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

export async function loadRiskAssessmentReport(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<RiskAssessmentReport | null> {
  const storagePath = buildRiskAssessmentStoragePath(ctx.tenantId, sessionId);
  const body = await captureStorageDownload(ctx, { key: storagePath, sessionId });
  if (!body) return null;
  const text = new TextDecoder().decode(body);
  return JSON.parse(text) as RiskAssessmentReport;
}

export async function getRiskAssessmentSignedUrl(
  ctx: ServiceCtx,
  sessionId: string,
  ttlSeconds = 3600,
): Promise<{ signedUrl: string; expiresAt: string; filename: string }> {
  const storagePath = buildRiskAssessmentStoragePath(ctx.tenantId, sessionId);
  const { signedUrl, expiresAt } = await captureStorageSignedUrl(ctx, {
    key: storagePath,
    expiresInSeconds: ttlSeconds,
    downloadFilename: RISK_ASSESSMENT_FILENAME,
    sessionId,
  });

  return {
    signedUrl,
    expiresAt,
    filename: RISK_ASSESSMENT_FILENAME,
  };
}

export function buildRiskAssessmentSummaryFromResult(
  report: RiskAssessmentReport,
  storagePath: string,
  assessmentDurationMs: number,
): RiskAssessmentSummaryMeta {
  return {
    status: "completed",
    overallRiskScore: report.assessment.overallRiskScore,
    overallRiskLevel: report.assessment.overallRiskLevel,
    estimatedDenialProbability: report.assessment.estimatedDenialProbability,
    estimatedFinancialImpact: report.assessment.estimatedFinancialImpact,
    blockingIssuesCount: report.assessment.blockingIssues.length,
    storagePath,
    assessmentDurationMs,
  };
}

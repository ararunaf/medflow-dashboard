/**
 * Persistência de RiskAssessmentReport no bucket clinical-documents.
 * MEDICFLOW-GLOSA-RISK-ENGINE-01
 *
 * Preserva audit_report.json, contract_intelligence_report.json e demais artefatos.
 */
import type { ServiceCtx } from "@/lib/services/operations/types";
import { CLINICAL_DOCUMENTS_BUCKET } from "../../infrastructure/storage-paths";
import type {
  RiskAssessmentReport,
  RiskAssessmentSummaryMeta,
} from "../types/risk-assessment";

export const RISK_ASSESSMENT_FILENAME = "risk_assessment.json";

export function buildRiskAssessmentStoragePath(
  tenantId: string,
  sessionId: string,
): string {
  return `${tenantId}/${sessionId}/audit/${RISK_ASSESSMENT_FILENAME}`;
}

export async function persistRiskAssessmentReport(
  ctx: ServiceCtx,
  sessionId: string,
  report: RiskAssessmentReport,
): Promise<{ storagePath: string }> {
  const storagePath = buildRiskAssessmentStoragePath(ctx.tenantId, sessionId);
  const payload = JSON.stringify(report, null, 2);

  const { error } = await ctx.client.storage
    .from(CLINICAL_DOCUMENTS_BUCKET)
    .upload(storagePath, new TextEncoder().encode(payload), {
      contentType: "application/json",
      upsert: true,
    });

  if (error) throw error;
  return { storagePath };
}

export async function loadRiskAssessmentReport(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<RiskAssessmentReport | null> {
  const storagePath = buildRiskAssessmentStoragePath(ctx.tenantId, sessionId);
  const { data, error } = await ctx.client.storage
    .from(CLINICAL_DOCUMENTS_BUCKET)
    .download(storagePath);

  if (error || !data) return null;

  const text = await data.text();
  return JSON.parse(text) as RiskAssessmentReport;
}

export async function getRiskAssessmentSignedUrl(
  ctx: ServiceCtx,
  sessionId: string,
  ttlSeconds = 3600,
): Promise<{ signedUrl: string; expiresAt: string; filename: string }> {
  const storagePath = buildRiskAssessmentStoragePath(ctx.tenantId, sessionId);
  const { data, error } = await ctx.client.storage
    .from(CLINICAL_DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, ttlSeconds, {
      download: RISK_ASSESSMENT_FILENAME,
    });

  if (error || !data?.signedUrl) {
    throw error ?? new Error("Relatório de risco de glosa não encontrado.");
  }

  return {
    signedUrl: data.signedUrl,
    expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
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

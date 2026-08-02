/**
 * Persistência de ContractIntelligenceReport no bucket clinical-documents.
 * MEDICFLOW-CONTRACT-INTELLIGENCE-01
 *
 * Preserva audit_report.json e demais artefatos existentes.
 */
import type { ServiceCtx } from "@/lib/services/operations/types";
import {
  captureStorageDownload,
  captureStorageSignedUrl,
  captureStorageUpload,
} from "../../infrastructure/enterprise-storage-bridge";
import type {
  ContractIntelligenceReport,
  ContractIntelligenceSummaryMeta,
} from "../types/contract-intelligence-report";

export const CONTRACT_INTELLIGENCE_FILENAME = "contract_intelligence_report.json";

export function buildContractIntelligenceStoragePath(tenantId: string, sessionId: string): string {
  return `${tenantId}/${sessionId}/audit/${CONTRACT_INTELLIGENCE_FILENAME}`;
}

export async function persistContractIntelligenceReport(
  ctx: ServiceCtx,
  sessionId: string,
  report: ContractIntelligenceReport,
): Promise<{ storagePath: string }> {
  const storagePath = buildContractIntelligenceStoragePath(ctx.tenantId, sessionId);
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

export async function loadContractIntelligenceReport(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<ContractIntelligenceReport | null> {
  const storagePath = buildContractIntelligenceStoragePath(ctx.tenantId, sessionId);
  const body = await captureStorageDownload(ctx, { key: storagePath, sessionId });
  if (!body) return null;
  const text = new TextDecoder().decode(body);
  return JSON.parse(text) as ContractIntelligenceReport;
}

export async function getContractIntelligenceSignedUrl(
  ctx: ServiceCtx,
  sessionId: string,
  ttlSeconds = 3600,
): Promise<{ signedUrl: string; expiresAt: string; filename: string }> {
  const storagePath = buildContractIntelligenceStoragePath(ctx.tenantId, sessionId);
  const { signedUrl, expiresAt } = await captureStorageSignedUrl(ctx, {
    key: storagePath,
    expiresInSeconds: ttlSeconds,
    downloadFilename: CONTRACT_INTELLIGENCE_FILENAME,
    sessionId,
  });

  return {
    signedUrl,
    expiresAt,
    filename: CONTRACT_INTELLIGENCE_FILENAME,
  };
}

export function buildContractIntelligenceSummaryFromResult(
  report: ContractIntelligenceReport,
  storagePath: string,
  enrichmentDurationMs: number,
): ContractIntelligenceSummaryMeta {
  return {
    status: "completed",
    enrichedCount: report.summary.enrichedCount,
    appliedRulesCount: report.summary.appliedRulesCount,
    totalEstimatedFinancialImpactCents: report.summary.totalEstimatedFinancialImpactCents,
    averageDenialRisk: report.summary.averageDenialRisk,
    operatorResolved: report.summary.operatorResolved,
    contractResolved: report.summary.contractResolved,
    storagePath,
    enrichmentDurationMs,
  };
}

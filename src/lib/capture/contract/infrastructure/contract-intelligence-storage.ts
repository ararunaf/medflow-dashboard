/**
 * Persistência de ContractIntelligenceReport no bucket clinical-documents.
 * MEDICFLOW-CONTRACT-INTELLIGENCE-01
 *
 * Preserva audit_report.json e demais artefatos existentes.
 */
import type { ServiceCtx } from "@/lib/services/operations/types";
import { CLINICAL_DOCUMENTS_BUCKET } from "../../infrastructure/storage-paths";
import type {
  ContractIntelligenceReport,
  ContractIntelligenceSummaryMeta,
} from "../types/contract-intelligence-report";

export const CONTRACT_INTELLIGENCE_FILENAME = "contract_intelligence_report.json";

export function buildContractIntelligenceStoragePath(
  tenantId: string,
  sessionId: string,
): string {
  return `${tenantId}/${sessionId}/audit/${CONTRACT_INTELLIGENCE_FILENAME}`;
}

export async function persistContractIntelligenceReport(
  ctx: ServiceCtx,
  sessionId: string,
  report: ContractIntelligenceReport,
): Promise<{ storagePath: string }> {
  const storagePath = buildContractIntelligenceStoragePath(ctx.tenantId, sessionId);
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

export async function loadContractIntelligenceReport(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<ContractIntelligenceReport | null> {
  const storagePath = buildContractIntelligenceStoragePath(ctx.tenantId, sessionId);
  const { data, error } = await ctx.client.storage
    .from(CLINICAL_DOCUMENTS_BUCKET)
    .download(storagePath);

  if (error || !data) return null;

  const text = await data.text();
  return JSON.parse(text) as ContractIntelligenceReport;
}

export async function getContractIntelligenceSignedUrl(
  ctx: ServiceCtx,
  sessionId: string,
  ttlSeconds = 3600,
): Promise<{ signedUrl: string; expiresAt: string; filename: string }> {
  const storagePath = buildContractIntelligenceStoragePath(ctx.tenantId, sessionId);
  const { data, error } = await ctx.client.storage
    .from(CLINICAL_DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, ttlSeconds, {
      download: CONTRACT_INTELLIGENCE_FILENAME,
    });

  if (error || !data?.signedUrl) {
    throw error ?? new Error("Relatório de inteligência contratual não encontrado.");
  }

  return {
    signedUrl: data.signedUrl,
    expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
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

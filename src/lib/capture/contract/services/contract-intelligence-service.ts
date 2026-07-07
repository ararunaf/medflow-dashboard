/**
 * ContractIntelligenceService — orquestra PreventiveAudit → enriquecimento → persistência.
 * MEDICFLOW-CONTRACT-INTELLIGENCE-01
 *
 * Consome StructuredGuide e AuditReport existentes.
 * Não altera OCR, Parser, PreventiveAudit nem Learning Loop.
 */
import { NotFoundError, ValidationError } from "@/lib/domain/operations/errors";
import type { ServiceCtx } from "@/lib/services/operations/types";
import {
  appendCaptureEvent,
  buildCaptureEvent,
} from "../../infrastructure/capture-events";
import { getCaptureSession } from "../../infrastructure/capture-session-store";
import { loadStructuredGuide } from "../../parser/infrastructure/parser-storage";
import type { StructuredGuide } from "../../parser/types/structured-guide";
import { loadAuditReport } from "../../audit/infrastructure/audit-storage";
import type { AuditReport } from "../../audit/types/audit-report";
import {
  getDefaultContractIntelligenceEngine,
} from "../engine/contract-intelligence-engine";
import {
  buildContractIntelligenceSummaryFromResult,
  loadContractIntelligenceReport,
  persistContractIntelligenceReport,
} from "../infrastructure/contract-intelligence-storage";
import type { ContractIntelligenceReport } from "../types/contract-intelligence-report";

export type RunContractIntelligenceResult = {
  sessionId: string;
  report: ContractIntelligenceReport;
  enrichedCount: number;
};

async function persistSessionMetadata(
  ctx: ServiceCtx,
  sessionId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  const { error } = await ctx.client
    .from("capture_sessions")
    .update({ metadata, updated_by: ctx.actorProfileId })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", sessionId)
    .is("deleted_at", null);
  if (error) throw error;
}

export class ContractIntelligenceService {
  private readonly engine = getDefaultContractIntelligenceEngine();

  async enrichFromAudit(
    ctx: ServiceCtx,
    sessionId: string,
    guide: StructuredGuide,
    auditReport: AuditReport,
    metadata: Record<string, unknown>,
  ): Promise<RunContractIntelligenceResult> {
    const start = Date.now();

    metadata = appendCaptureEvent(
      metadata,
      buildCaptureEvent("contract_intelligence_started", sessionId),
    );
    await persistSessionMetadata(ctx, sessionId, metadata);

    try {
      const { report } = this.engine.enrich(guide, auditReport.findings, {
        sessionId,
        tenantId: ctx.tenantId,
      });

      const enrichmentDurationMs = Date.now() - start;
      const { storagePath } = await persistContractIntelligenceReport(ctx, sessionId, report);
      const summary = buildContractIntelligenceSummaryFromResult(
        report,
        storagePath,
        enrichmentDurationMs,
      );

      metadata = {
        ...metadata,
        capturePhase: "contract_intelligence_completed",
        contractIntelligence: summary,
        contractIntelligencePreview: {
          enrichedCount: report.summary.enrichedCount,
          appliedRulesCount: report.summary.appliedRulesCount,
          totalEstimatedFinancialImpactCents: report.summary.totalEstimatedFinancialImpactCents,
          averageDenialRisk: report.summary.averageDenialRisk,
          operatorResolved: report.summary.operatorResolved,
          contractResolved: report.summary.contractResolved,
        },
      };

      metadata = appendCaptureEvent(
        metadata,
        buildCaptureEvent("contract_intelligence_finished", sessionId, {
          enrichedCount: report.summary.enrichedCount,
          appliedRulesCount: report.summary.appliedRulesCount,
          totalEstimatedFinancialImpactCents: report.summary.totalEstimatedFinancialImpactCents,
          averageDenialRisk: report.summary.averageDenialRisk,
          operatorResolved: report.summary.operatorResolved,
          contractResolved: report.summary.contractResolved,
          enrichmentDurationMs,
          storagePath,
        }),
      );

      await persistSessionMetadata(ctx, sessionId, metadata);

      return {
        sessionId,
        report,
        enrichedCount: report.summary.enrichedCount,
      };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      metadata = appendCaptureEvent(
        {
          ...metadata,
          contractIntelligence: { status: "failed", error: reason },
        },
        buildCaptureEvent("contract_intelligence_failed", sessionId, { reason }),
      );
      await persistSessionMetadata(ctx, sessionId, metadata);
      throw err;
    }
  }

  async enrichSession(ctx: ServiceCtx, sessionId: string): Promise<RunContractIntelligenceResult> {
    const detail = await getCaptureSession(ctx, sessionId);
    const auditDone =
      detail.metadata?.audit &&
      typeof detail.metadata.audit === "object" &&
      (detail.metadata.audit as { status?: string }).status === "completed";

    if (!auditDone) {
      throw new ValidationError(
        "Inteligência contratual só pode ser executada após auditoria concluída.",
        { status: detail.status },
      );
    }

    const guide = await loadStructuredGuide(ctx, sessionId);
    if (!guide) throw new NotFoundError("StructuredGuide", sessionId);

    const auditReport = await loadAuditReport(ctx, sessionId);
    if (!auditReport) throw new NotFoundError("AuditReport", sessionId);

    return this.enrichFromAudit(ctx, sessionId, guide, auditReport, detail.metadata ?? {});
  }

  async getContractIntelligenceReport(
    ctx: ServiceCtx,
    sessionId: string,
  ): Promise<ContractIntelligenceReport | null> {
    return loadContractIntelligenceReport(ctx, sessionId);
  }
}

let defaultService: ContractIntelligenceService | null = null;

export function getDefaultContractIntelligenceService(): ContractIntelligenceService {
  if (!defaultService) defaultService = new ContractIntelligenceService();
  return defaultService;
}

export async function runCaptureContractIntelligence(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<RunContractIntelligenceResult> {
  return getDefaultContractIntelligenceService().enrichSession(ctx, sessionId);
}

export async function getCaptureContractIntelligenceReport(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<ContractIntelligenceReport | null> {
  return getDefaultContractIntelligenceService().getContractIntelligenceReport(ctx, sessionId);
}

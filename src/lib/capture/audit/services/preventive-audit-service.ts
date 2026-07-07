/**
 * PreventiveAuditService — orquestra StructuredGuide → AuditReport → persistência.
 * MEDICFLOW-PREVENTIVE-AUDIT-01
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
import { getDefaultPreventiveAuditEngine } from "../engine/preventive-audit-engine";
import {
  buildAuditReportSummaryFromResult,
  loadAuditReport,
  persistAuditReport,
} from "../infrastructure/audit-storage";
import type { AuditReport } from "../types/audit-report";

export type RunCaptureAuditResult = {
  sessionId: string;
  report: AuditReport;
  findingCount: number;
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

export class PreventiveAuditService {
  private readonly engine = getDefaultPreventiveAuditEngine();

  async auditFromGuide(
    ctx: ServiceCtx,
    sessionId: string,
    guide: StructuredGuide,
    metadata: Record<string, unknown>,
  ): Promise<RunCaptureAuditResult> {
    const start = Date.now();

    metadata = appendCaptureEvent(
      metadata,
      buildCaptureEvent("audit_started", sessionId),
    );
    await persistSessionMetadata(ctx, sessionId, metadata);

    try {
      const { report } = this.engine.audit(guide, { sessionId });
      const auditDurationMs = Date.now() - start;
      const { storagePath } = await persistAuditReport(ctx, sessionId, report);
      const summary = buildAuditReportSummaryFromResult(report, storagePath, auditDurationMs);

      metadata = {
        ...metadata,
        capturePhase: "audit_completed",
        audit: summary,
        auditPreview: {
          score: report.score.overall,
          approved: report.score.approved,
          blocking: report.score.blocking,
          criticalCount: report.summary.criticalCount,
          highCount: report.summary.highCount,
          mediumCount: report.summary.mediumCount,
          totalFindings: report.summary.totalFindings,
        },
      };

      metadata = appendCaptureEvent(
        metadata,
        buildCaptureEvent("audit_finished", sessionId, {
          score: report.score.overall,
          approved: report.score.approved,
          blocking: report.score.blocking,
          criticalCount: report.summary.criticalCount,
          highCount: report.summary.highCount,
          mediumCount: report.summary.mediumCount,
          lowCount: report.summary.lowCount,
          totalFindings: report.summary.totalFindings,
          auditDurationMs,
          storagePath,
        }),
      );

      await persistSessionMetadata(ctx, sessionId, metadata);

      return {
        sessionId,
        report,
        findingCount: report.findings.length,
      };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      metadata = appendCaptureEvent(
        {
          ...metadata,
          capturePhase: "failed",
          audit: { status: "failed", error: reason },
        },
        buildCaptureEvent("audit_failed", sessionId, { reason }),
      );
      await persistSessionMetadata(ctx, sessionId, metadata);
      throw err;
    }
  }

  async auditSession(ctx: ServiceCtx, sessionId: string): Promise<RunCaptureAuditResult> {
    const detail = await getCaptureSession(ctx, sessionId);
    const parserDone =
      detail.metadata?.parser &&
      typeof detail.metadata.parser === "object" &&
      (detail.metadata.parser as { status?: string }).status === "completed";

    if (!parserDone) {
      throw new ValidationError("Auditoria só pode ser executada após parser concluído.", {
        status: detail.status,
      });
    }

    const guide = await loadStructuredGuide(ctx, sessionId);
    if (!guide) throw new NotFoundError("StructuredGuide", sessionId);

    return this.auditFromGuide(ctx, sessionId, guide, detail.metadata ?? {});
  }

  async getAuditReport(ctx: ServiceCtx, sessionId: string): Promise<AuditReport | null> {
    return loadAuditReport(ctx, sessionId);
  }
}

let defaultService: PreventiveAuditService | null = null;

export function getDefaultPreventiveAuditService(): PreventiveAuditService {
  if (!defaultService) defaultService = new PreventiveAuditService();
  return defaultService;
}

export async function runCaptureAudit(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<RunCaptureAuditResult> {
  return getDefaultPreventiveAuditService().auditSession(ctx, sessionId);
}

export async function getCaptureAuditReport(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<AuditReport | null> {
  return getDefaultPreventiveAuditService().getAuditReport(ctx, sessionId);
}

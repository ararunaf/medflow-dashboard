/**
 * FieldAuditService — orquestra Audit + ContractIntelligence + Risk → Field Audit Agent → persistência.
 * F2-S4 — Field Audit Agent.
 *
 * Consome relatórios já persistidos (audit_report.json, contract_intelligence_report.json,
 * risk_assessment_report.json); não recalcula nada. Passa sempre pelo
 * AIProviderPort (ARCH-02) — nunca chama o vendor diretamente.
 */
import { NotFoundError, ValidationError } from "@/lib/domain/operations/errors";
import type { Json, JsonObject } from "@/lib/database.types";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { createAIProviderFactory } from "@/lib/enterprise/ai-provider/factory/ai-provider-factory";
import { appendCaptureEvent, buildCaptureEvent } from "../../infrastructure/capture-events";
import { getCaptureSession } from "../../infrastructure/capture-session-store";
import { loadAuditReport } from "../infrastructure/audit-storage";
import { loadContractIntelligenceReport } from "../../contract/infrastructure/contract-intelligence-storage";
import { getCaptureRiskAssessmentReport } from "../../risk/services/glosa-risk-service";
import { generateFieldAuditOpinions, groupFindingsByField } from "../engine/field-audit-agent";
import {
  buildFieldAuditSummaryFromReport,
  loadFieldAuditReport,
  persistFieldAuditReport,
} from "../infrastructure/field-audit-storage";
import type { FieldAuditReport } from "../types/field-audit-report";

export type RunFieldAuditResult = {
  sessionId: string;
  report: FieldAuditReport;
};

async function persistSessionMetadata(
  ctx: ServiceCtx,
  sessionId: string,
  metadata: JsonObject,
): Promise<void> {
  const { error } = await ctx.client
    .from("capture_sessions")
    .update({ metadata: metadata as Json, updated_by: ctx.actorProfileId })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", sessionId)
    .is("deleted_at", null);
  if (error) throw error;
}

export class FieldAuditService {
  async runForSession(ctx: ServiceCtx, sessionId: string): Promise<RunFieldAuditResult> {
    const start = Date.now();
    const detail = await getCaptureSession(ctx, sessionId);
    let metadata = detail.metadata ?? {};

    const auditReport = await loadAuditReport(ctx, sessionId);
    if (!auditReport) throw new NotFoundError("AuditReport", sessionId);

    const riskReport = await getCaptureRiskAssessmentReport(ctx, sessionId);
    if (!riskReport) {
      throw new ValidationError(
        "Field Audit Agent só pode rodar após a avaliação de risco de glosa concluir.",
        { sessionId },
      );
    }

    // Contrato pode legitimamente não ter enriquecido nenhum finding (operadora
    // sem regra cadastrada) — segue com lista vazia, não é erro.
    const contractReport = await loadContractIntelligenceReport(ctx, sessionId);

    metadata = appendCaptureEvent(metadata, buildCaptureEvent("field_audit_started", sessionId));
    await persistSessionMetadata(ctx, sessionId, metadata);

    try {
      const bundles = groupFindingsByField(
        auditReport.findings,
        contractReport?.findings ?? [],
        riskReport.findingRisks,
      );

      const aiProvider = createAIProviderFactory().create({ provider: "openai" });
      const opinions = await generateFieldAuditOpinions(aiProvider, bundles);

      const report: FieldAuditReport = {
        version: "field_audit_v1",
        sessionId,
        generatedAt: new Date().toISOString(),
        model: process.env.MEDFLOW_OPENAI_MODEL ?? "gpt-4o-mini",
        opinions,
        summary: {
          fieldsWithFindings: bundles.length,
          opinionsGenerated: opinions.length,
          criticalCount: opinions.filter((o) => o.verdict === "critico").length,
          attentionCount: opinions.filter((o) => o.verdict === "atencao").length,
        },
      };

      const durationMs = Date.now() - start;
      const { storagePath } = await persistFieldAuditReport(ctx, sessionId, report);
      const summary = buildFieldAuditSummaryFromReport(report, storagePath, durationMs);

      metadata = {
        ...metadata,
        fieldAudit: summary,
      };
      metadata = appendCaptureEvent(
        metadata,
        buildCaptureEvent("field_audit_finished", sessionId, {
          opinionsGenerated: report.summary.opinionsGenerated,
          criticalCount: report.summary.criticalCount,
          attentionCount: report.summary.attentionCount,
          durationMs,
          storagePath,
        }),
      );
      await persistSessionMetadata(ctx, sessionId, metadata);

      return { sessionId, report };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      metadata = appendCaptureEvent(
        { ...metadata, fieldAudit: { status: "failed", error: reason } },
        buildCaptureEvent("field_audit_failed", sessionId, { reason }),
      );
      await persistSessionMetadata(ctx, sessionId, metadata);
      throw err;
    }
  }

  async getReport(ctx: ServiceCtx, sessionId: string): Promise<FieldAuditReport | null> {
    return loadFieldAuditReport(ctx, sessionId);
  }
}

let defaultService: FieldAuditService | null = null;

export function getDefaultFieldAuditService(): FieldAuditService {
  if (!defaultService) defaultService = new FieldAuditService();
  return defaultService;
}

export async function runCaptureFieldAudit(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<RunFieldAuditResult> {
  return getDefaultFieldAuditService().runForSession(ctx, sessionId);
}

export async function getCaptureFieldAuditReport(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<FieldAuditReport | null> {
  return getDefaultFieldAuditService().getReport(ctx, sessionId);
}

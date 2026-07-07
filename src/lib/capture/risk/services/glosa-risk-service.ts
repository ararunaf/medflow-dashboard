/**
 * GlosaRiskService — orquestra Contract Intelligence → Risk Engine → persistência.
 * MEDICFLOW-GLOSA-RISK-ENGINE-01
 *
 * Consome StructuredGuide, AuditReport e ContractIntelligenceReport existentes.
 * Não altera OCR, Parser, PreventiveAudit, Contract Intelligence, Correction Assistant
 * nem Learning Loop.
 */
import { NotFoundError, ValidationError } from "@/lib/domain/operations/errors";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { loadAuditReport } from "../../audit/infrastructure/audit-storage";
import type { AuditReport } from "../../audit/types/audit-report";
import { loadContractIntelligenceReport } from "../../contract/infrastructure/contract-intelligence-storage";
import type { ContractIntelligenceReport } from "../../contract/types/contract-intelligence-report";
import {
  appendCaptureEvent,
  buildCaptureEvent,
} from "../../infrastructure/capture-events";
import { getCaptureSession } from "../../infrastructure/capture-session-store";
import { loadLearningMetrics } from "../../learning/infrastructure/learning-storage";
import { loadStructuredGuide } from "../../parser/infrastructure/parser-storage";
import type { StructuredGuide } from "../../parser/types/structured-guide";
import { getDefaultGlosaRiskEngine } from "../engine/glosa-risk-engine";
import {
  buildRiskDashboardView,
  extractTopRiskCauses,
  type RiskDashboardView,
  type RiskSessionSummary,
} from "../engine/risk-dashboard";
import {
  buildRiskAssessmentSummaryFromResult,
  loadRiskAssessmentReport,
  persistRiskAssessmentReport,
} from "../infrastructure/risk-storage";
import type { RiskAssessmentReport } from "../types/risk-assessment";

export type RunGlosaRiskResult = {
  sessionId: string;
  report: RiskAssessmentReport;
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

function sessionSummaryFromMetadata(
  sessionId: string,
  metadata: Record<string, unknown>,
): RiskSessionSummary | null {
  const risk = metadata.riskAssessment;
  if (!risk || typeof risk !== "object") return null;
  const r = risk as Record<string, unknown>;
  if (r.status !== "completed") return null;

  const preview = metadata.riskAssessmentPreview as Record<string, unknown> | undefined;

  return {
    sessionId,
    overallRiskScore: (r.overallRiskScore as number) ?? 0,
    overallRiskLevel: (r.overallRiskLevel as RiskSessionSummary["overallRiskLevel"]) ?? "Baixo",
    estimatedDenialProbability: (r.estimatedDenialProbability as number) ?? 0,
    estimatedFinancialImpact: (r.estimatedFinancialImpact as number) ?? 0,
    guideType: (preview?.guideType as string) ?? "desconhecido",
    operatorAnsCode: (preview?.operatorAnsCode as string) ?? null,
    operatorName: (preview?.operatorName as string) ?? null,
    topRiskFactorId: (preview?.topRiskFactorId as string) ?? null,
    assessedAt: (preview?.assessedAt as string) ?? new Date().toISOString(),
  };
}

export class GlosaRiskService {
  private readonly engine = getDefaultGlosaRiskEngine();

  async assessFromContract(
    ctx: ServiceCtx,
    sessionId: string,
    guide: StructuredGuide,
    auditReport: AuditReport,
    contractReport: ContractIntelligenceReport,
    metadata: Record<string, unknown>,
  ): Promise<RunGlosaRiskResult> {
    const start = Date.now();

    metadata = appendCaptureEvent(
      metadata,
      buildCaptureEvent("risk_assessment_started", sessionId),
    );
    await persistSessionMetadata(ctx, sessionId, metadata);

    try {
      const learningMetrics = await loadLearningMetrics(ctx);

      const { report } = this.engine.assess(guide, auditReport, contractReport, {
        sessionId,
        tenantId: ctx.tenantId,
        learningMetrics,
      });

      const assessmentDurationMs = Date.now() - start;
      const { storagePath } = await persistRiskAssessmentReport(ctx, sessionId, report);
      const summary = buildRiskAssessmentSummaryFromResult(
        report,
        storagePath,
        assessmentDurationMs,
      );

      const topFactor = report.assessment.topRiskFactors[0];

      metadata = {
        ...metadata,
        capturePhase: "risk_assessment_completed",
        riskAssessment: summary,
        riskAssessmentPreview: {
          overallRiskScore: report.assessment.overallRiskScore,
          overallRiskLevel: report.assessment.overallRiskLevel,
          estimatedDenialProbability: report.assessment.estimatedDenialProbability,
          estimatedFinancialImpact: report.assessment.estimatedFinancialImpact,
          blockingIssuesCount: report.assessment.blockingIssues.length,
          guideType: report.guideType,
          operatorAnsCode: report.operatorAnsCode,
          operatorName: report.operatorName,
          topRiskFactorId: topFactor?.factorId ?? null,
          topRiskFactorLabel: topFactor?.label ?? null,
          assessedAt: report.assessedAt,
        },
      };

      metadata = appendCaptureEvent(
        metadata,
        buildCaptureEvent("risk_assessment_finished", sessionId, {
          overallRiskScore: report.assessment.overallRiskScore,
          overallRiskLevel: report.assessment.overallRiskLevel,
          estimatedDenialProbability: report.assessment.estimatedDenialProbability,
          estimatedFinancialImpact: report.assessment.estimatedFinancialImpact,
          blockingIssuesCount: report.assessment.blockingIssues.length,
          assessmentDurationMs,
          storagePath,
        }),
      );

      await persistSessionMetadata(ctx, sessionId, metadata);

      return { sessionId, report };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      metadata = appendCaptureEvent(
        {
          ...metadata,
          riskAssessment: { status: "failed", error: reason },
        },
        buildCaptureEvent("risk_assessment_failed", sessionId, { reason }),
      );
      await persistSessionMetadata(ctx, sessionId, metadata);
      throw err;
    }
  }

  async assessSession(ctx: ServiceCtx, sessionId: string): Promise<RunGlosaRiskResult> {
    const detail = await getCaptureSession(ctx, sessionId);
    const contractDone =
      detail.metadata?.contractIntelligence &&
      typeof detail.metadata.contractIntelligence === "object" &&
      (detail.metadata.contractIntelligence as { status?: string }).status === "completed";

    if (!contractDone) {
      throw new ValidationError(
        "Avaliação de risco só pode ser executada após inteligência contratual concluída.",
        { status: detail.status },
      );
    }

    const guide = await loadStructuredGuide(ctx, sessionId);
    if (!guide) throw new NotFoundError("StructuredGuide", sessionId);

    const auditReport = await loadAuditReport(ctx, sessionId);
    if (!auditReport) throw new NotFoundError("AuditReport", sessionId);

    const contractReport = await loadContractIntelligenceReport(ctx, sessionId);
    if (!contractReport) throw new NotFoundError("ContractIntelligenceReport", sessionId);

    return this.assessFromContract(
      ctx,
      sessionId,
      guide,
      auditReport,
      contractReport,
      detail.metadata ?? {},
    );
  }

  async getRiskAssessmentReport(
    ctx: ServiceCtx,
    sessionId: string,
  ): Promise<RiskAssessmentReport | null> {
    return loadRiskAssessmentReport(ctx, sessionId);
  }

  async getDashboard(ctx: ServiceCtx): Promise<RiskDashboardView> {
    const { data, error } = await ctx.client
      .from("capture_sessions")
      .select("id, metadata")
      .eq("tenant_id", ctx.tenantId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    const sessions: RiskSessionSummary[] = [];
    const allContributions: Array<{ factorId: string; label: string; contribution: number }> = [];

    for (const row of data ?? []) {
      const summary = sessionSummaryFromMetadata(row.id, row.metadata as Record<string, unknown>);
      if (summary) sessions.push(summary);
    }

    for (const s of sessions.slice(0, 50)) {
      const report = await loadRiskAssessmentReport(ctx, s.sessionId);
      if (!report) continue;
      for (const factor of report.scoringBreakdown.slice(0, 5)) {
        allContributions.push({
          factorId: factor.factorId,
          label: factor.label,
          contribution: factor.contribution,
        });
      }
    }

    const topCauses = extractTopRiskCauses(sessions, allContributions);
    return buildRiskDashboardView(sessions, topCauses);
  }
}

let defaultService: GlosaRiskService | null = null;

export function getDefaultGlosaRiskService(): GlosaRiskService {
  if (!defaultService) defaultService = new GlosaRiskService();
  return defaultService;
}

export async function runCaptureGlosaRisk(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<RunGlosaRiskResult> {
  return getDefaultGlosaRiskService().assessSession(ctx, sessionId);
}

export async function getCaptureRiskAssessmentReport(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<RiskAssessmentReport | null> {
  return getDefaultGlosaRiskService().getRiskAssessmentReport(ctx, sessionId);
}

export async function getCaptureRiskDashboard(ctx: ServiceCtx): Promise<RiskDashboardView> {
  return getDefaultGlosaRiskService().getDashboard(ctx);
}

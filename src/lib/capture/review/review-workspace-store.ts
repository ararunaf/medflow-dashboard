/**
 * Persistência do Workspace de Revisão — metadata.review em capture_sessions.
 * MEDICFLOW-REVIEW-WORKSPACE-01 — sem alteração de infraestrutura/migrations.
 */
import { ValidationError } from "@/lib/domain/operations/errors";
import type { Json, JsonObject } from "@/lib/database.types";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { getCaptureAuditReportViaEnterprise } from "../enterprise/process-audit-via-enterprise";
import { getCaptureContractIntelligenceReportViaEnterprise } from "../enterprise/process-contract-via-enterprise";
import { getCaptureRiskAssessmentReportViaEnterprise } from "../enterprise/process-risk-via-enterprise";
import { getCaptureCorrectionProposalsViaEnterprise } from "../enterprise/process-correction-via-enterprise";
import { getCaptureFieldAuditReportViaEnterprise } from "../enterprise/process-field-audit-via-enterprise";
import {
  getCaptureSession,
  getCaptureSessionStatus,
  transitionCaptureSession,
} from "../infrastructure/capture-session-store";
import { getCaptureOcrResult } from "../ocr/services/ocr-service";
import { getCaptureStructuredGuideViaEnterprise } from "../enterprise/process-parser-via-enterprise";
import type { CaptureSessionStatus, CaptureStatusHistoryEntry } from "../types";
import { parseReviewMetadata } from "./review-workspace-service";
import type {
  ReviewApprovalStatus,
  ReviewWorkspaceMetadata,
  SetReviewApprovalInput,
} from "./types";

const VALID_APPROVAL_STATUSES = new Set<ReviewApprovalStatus>([
  "em_revisao",
  "aguardando_correcoes",
  "aprovada",
  "reprovada",
]);

async function persistReviewMetadata(
  ctx: ServiceCtx,
  sessionId: string,
  metadata: JsonObject,
  review: ReviewWorkspaceMetadata,
): Promise<void> {
  const { error } = await ctx.client
    .from("capture_sessions")
    .update({
      metadata: { ...metadata, review } as Json,
      updated_by: ctx.actorProfileId,
    })
    .eq("tenant_id", ctx.tenantId)
    .eq("id", sessionId)
    .is("deleted_at", null);

  if (error) throw error;
}

async function ensureReviewStatus(
  ctx: ServiceCtx,
  sessionId: string,
  currentStatus: CaptureSessionStatus,
): Promise<CaptureSessionStatus> {
  if (currentStatus === "REVIEW" || currentStatus === "APPROVED") return currentStatus;

  const reviewable: CaptureSessionStatus[] = ["AUDITING", "PARSING", "OCR_COMPLETED"];
  if (!reviewable.includes(currentStatus)) return currentStatus;

  try {
    const session = await transitionCaptureSession(
      ctx,
      sessionId,
      "REVIEW",
      "review_workspace_entered",
    );
    return session.status;
  } catch {
    return currentStatus;
  }
}

function targetDbStatusForApproval(
  approvalStatus: ReviewApprovalStatus,
  currentStatus: CaptureSessionStatus,
): CaptureSessionStatus | null {
  if (approvalStatus === "aprovada" && currentStatus !== "APPROVED") return "APPROVED";
  if (
    (approvalStatus === "reprovada" ||
      approvalStatus === "aguardando_correcoes" ||
      approvalStatus === "em_revisao") &&
    currentStatus !== "REVIEW" &&
    currentStatus !== "APPROVED"
  ) {
    return "REVIEW";
  }
  return null;
}

export type ReviewWorkspaceSnapshot = {
  sessionId: string;
  sessionStatus: CaptureSessionStatus;
  metadata: JsonObject;
  review: ReviewWorkspaceMetadata;
  /** Transições de status da sessão — já persistidas em capture_sessions.status_history. */
  statusHistory: CaptureStatusHistoryEntry[];
  file: {
    name: string;
    mimeType: string;
    byteLength: number;
    checksumSha256?: string;
  } | null;
  ocr: Awaited<ReturnType<typeof getCaptureOcrResult>> | null;
  ocrSummary: JsonObject | null;
  structuredGuide: Awaited<ReturnType<typeof getCaptureStructuredGuideViaEnterprise>> | null;
  parserSummary: JsonObject | null;
  auditReport: Awaited<ReturnType<typeof getCaptureAuditReportViaEnterprise>> | null;
  auditSummary: JsonObject | null;
  contractIntelligenceReport: Awaited<
    ReturnType<typeof getCaptureContractIntelligenceReportViaEnterprise>
  > | null;
  contractIntelligenceSummary: JsonObject | null;
  riskAssessmentReport: Awaited<
    ReturnType<typeof getCaptureRiskAssessmentReportViaEnterprise>
  > | null;
  riskAssessmentSummary: JsonObject | null;
  correctionStore: Awaited<ReturnType<typeof getCaptureCorrectionProposalsViaEnterprise>> | null;
  correctionSummary: JsonObject | null;
  fieldAuditReport: Awaited<ReturnType<typeof getCaptureFieldAuditReportViaEnterprise>> | null;
  fieldAuditSummary: JsonObject | null;
};

export async function getReviewWorkspaceSnapshot(
  ctx: ServiceCtx,
  sessionId: string,
): Promise<ReviewWorkspaceSnapshot> {
  const status = await getCaptureSessionStatus(ctx, sessionId);
  const detail = await getCaptureSession(ctx, sessionId);
  let review = parseReviewMetadata(status.metadata);

  if (!review.enteredAt) {
    const now = new Date().toISOString();
    review = { ...review, enteredAt: now, lastUpdatedAt: now };
    await persistReviewMetadata(ctx, sessionId, status.metadata, review);
  }

  const doc = detail.documents[detail.documents.length - 1];

  let ocr: ReviewWorkspaceSnapshot["ocr"] = null;
  let structuredGuide: ReviewWorkspaceSnapshot["structuredGuide"] = null;
  let auditReport: ReviewWorkspaceSnapshot["auditReport"] = null;
  let contractIntelligenceReport: ReviewWorkspaceSnapshot["contractIntelligenceReport"] = null;
  let riskAssessmentReport: ReviewWorkspaceSnapshot["riskAssessmentReport"] = null;
  let correctionStore: ReviewWorkspaceSnapshot["correctionStore"] = null;
  let fieldAuditReport: ReviewWorkspaceSnapshot["fieldAuditReport"] = null;

  try {
    ocr = await getCaptureOcrResult(ctx, sessionId);
  } catch {
    /* OCR ainda indisponível */
  }

  try {
    structuredGuide = await getCaptureStructuredGuideViaEnterprise(ctx, sessionId);
  } catch {
    /* Parser ainda indisponível */
  }

  try {
    auditReport = await getCaptureAuditReportViaEnterprise(ctx, sessionId);
  } catch {
    /* Auditoria ainda indisponível */
  }

  try {
    contractIntelligenceReport = await getCaptureContractIntelligenceReportViaEnterprise(
      ctx,
      sessionId,
    );
  } catch {
    /* Inteligência contratual ainda indisponível */
  }

  try {
    riskAssessmentReport = await getCaptureRiskAssessmentReportViaEnterprise(ctx, sessionId);
  } catch {
    /* Avaliação de risco ainda indisponível */
  }

  try {
    correctionStore = await getCaptureCorrectionProposalsViaEnterprise(ctx, sessionId);
  } catch {
    /* Correções ainda indisponíveis */
  }

  try {
    fieldAuditReport = await getCaptureFieldAuditReportViaEnterprise(ctx, sessionId);
  } catch {
    /* Field Audit Agent ainda indisponível */
  }

  return {
    sessionId,
    sessionStatus: status.status,
    metadata: status.metadata,
    review,
    statusHistory: detail.statusHistory,
    file: doc
      ? {
          name: doc.originalFilename,
          mimeType: doc.mimeType,
          byteLength: doc.byteLength,
          checksumSha256: doc.checksumSha256,
        }
      : null,
    ocr,
    ocrSummary: (status.metadata.ocr as JsonObject | undefined) ?? null,
    structuredGuide,
    parserSummary: (status.metadata.parser as JsonObject | undefined) ?? null,
    auditReport,
    auditSummary: (status.metadata.audit as JsonObject | undefined) ?? null,
    contractIntelligenceReport,
    contractIntelligenceSummary:
      (status.metadata.contractIntelligence as JsonObject | undefined) ?? null,
    riskAssessmentReport,
    riskAssessmentSummary: (status.metadata.riskAssessment as JsonObject | undefined) ?? null,
    correctionStore,
    correctionSummary: (status.metadata.correction as JsonObject | undefined) ?? null,
    fieldAuditReport,
    fieldAuditSummary: (status.metadata.fieldAudit as JsonObject | undefined) ?? null,
  };
}

export async function setReviewApprovalDecision(
  ctx: ServiceCtx,
  input: SetReviewApprovalInput,
): Promise<{ review: ReviewWorkspaceMetadata; sessionStatus: CaptureSessionStatus }> {
  if (!VALID_APPROVAL_STATUSES.has(input.status)) {
    throw new ValidationError("Status de aprovação inválido.", { status: input.status });
  }

  const status = await getCaptureSessionStatus(ctx, input.sessionId);
  let sessionStatus = status.status;

  sessionStatus = await ensureReviewStatus(ctx, input.sessionId, sessionStatus);

  const now = new Date().toISOString();
  const existing = parseReviewMetadata(status.metadata);
  const decision = {
    status: input.status,
    note: input.note,
    at: now,
    actorProfileId: ctx.actorProfileId,
  };

  const review: ReviewWorkspaceMetadata = {
    ...existing,
    approvalStatus: input.status,
    decisions: [...existing.decisions, decision],
    enteredAt: existing.enteredAt ?? now,
    lastUpdatedAt: now,
  };

  await persistReviewMetadata(ctx, input.sessionId, status.metadata, review);

  const targetStatus = targetDbStatusForApproval(input.status, sessionStatus);
  if (targetStatus) {
    try {
      const session = await transitionCaptureSession(
        ctx,
        input.sessionId,
        targetStatus,
        `review_approval:${input.status}`,
      );
      sessionStatus = session.status;
    } catch {
      /* transição não aplicável neste estado — decisão permanece em metadata */
    }
  }

  return { review, sessionStatus };
}

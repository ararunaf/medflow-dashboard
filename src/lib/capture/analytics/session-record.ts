/**
 * Normalização de capture_sessions → registros analíticos auditáveis.
 * MEDICFLOW-ANALYTICS-01
 */
import { buildOcrSummaryFromMetadata } from "../ocr/infrastructure/ocr-storage";
import { buildStructuredGuideSummaryFromMetadata } from "../parser/infrastructure/parser-storage";
import { buildAuditReportSummaryFromMetadata } from "../audit/infrastructure/audit-storage";
import { buildCorrectionSummaryFromMetadata } from "../correction/infrastructure/correction-storage";
import { parseReviewMetadata } from "../review/review-workspace-service";
import { resolveProcessingQueue } from "../processing/queue-mapper";
import { isCriticalGuide } from "../processing/prioritizer";
import type { CaptureSessionStatus } from "../types";
import type { RiskLevel } from "../risk/types/risk-assessment";
import type { AnalyticsSessionRecord } from "./types";

type DbSessionRow = {
  id: string;
  status: CaptureSessionStatus;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

function extractRisk(metadata: Record<string, unknown>): {
  riskLevel: RiskLevel | null;
  riskScore: number | null;
  estimatedFinancialImpact: number;
} {
  const risk = metadata.riskAssessment;
  if (!risk || typeof risk !== "object") {
    return { riskLevel: null, riskScore: null, estimatedFinancialImpact: 0 };
  }
  const r = risk as Record<string, unknown>;
  return {
    riskLevel: (r.overallRiskLevel as RiskLevel) ?? null,
    riskScore: typeof r.overallRiskScore === "number" ? r.overallRiskScore : null,
    estimatedFinancialImpact:
      typeof r.estimatedFinancialImpact === "number" ? r.estimatedFinancialImpact : 0,
  };
}

function extractOperator(metadata: Record<string, unknown>): {
  operatorName: string | null;
  operatorAnsCode: string | null;
} {
  const preview = metadata.riskAssessmentPreview;
  if (preview && typeof preview === "object") {
    const p = preview as Record<string, unknown>;
    return {
      operatorName: typeof p.operatorName === "string" ? p.operatorName : null,
      operatorAnsCode: typeof p.operatorAnsCode === "string" ? p.operatorAnsCode : null,
    };
  }
  return { operatorName: null, operatorAnsCode: null };
}

function extractGuideType(metadata: Record<string, unknown>): string | null {
  const parser = buildStructuredGuideSummaryFromMetadata(metadata);
  if (parser?.guideType) return parser.guideType;
  const preview = metadata.riskAssessmentPreview;
  if (preview && typeof preview === "object") {
    const guideType = (preview as Record<string, unknown>).guideType;
    if (typeof guideType === "string") return guideType;
  }
  return null;
}

function extractGlosaRuleHits(metadata: Record<string, unknown>): Array<{ ruleId: string; count: number }> {
  const events = metadata.captureEvents;
  if (!Array.isArray(events)) return [];

  const counts = new Map<string, number>();
  for (const raw of events) {
    if (!raw || typeof raw !== "object") continue;
    const ev = raw as Record<string, unknown>;
    const payload = ev.payload;
    if (!payload || typeof payload !== "object") continue;
    const p = payload as Record<string, unknown>;

    if (ev.type === "learning_recorded" && typeof p.ruleId === "string" && p.ruleId) {
      counts.set(p.ruleId, (counts.get(p.ruleId) ?? 0) + 1);
      continue;
    }

    if (ev.type === "proposal_generated") {
      const ruleId =
        typeof p.ruleId === "string" && p.ruleId
          ? p.ruleId
          : typeof p.field === "string" && p.field
            ? `field:${p.field}`
            : null;
      if (!ruleId) continue;
      counts.set(ruleId, (counts.get(ruleId) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([ruleId, count]) => ({ ruleId, count }))
    .sort((a, b) => b.count - a.count);
}

function computeReviewDurations(
  review: ReturnType<typeof parseReviewMetadata>,
  updatedAt: string,
): { reviewDurationMs: number | null; approvalDurationMs: number | null } {
  const enteredMs = review.enteredAt ? Date.parse(review.enteredAt) : null;
  const updatedMs = Date.parse(updatedAt);

  let approvalAtMs: number | null = null;
  for (const d of review.decisions) {
    if (d.status === "aprovada" || d.status === "reprovada") {
      const t = Date.parse(d.at);
      if (!Number.isNaN(t)) approvalAtMs = t;
    }
  }

  const reviewDurationMs =
    enteredMs != null && !Number.isNaN(enteredMs) && updatedMs > enteredMs
      ? updatedMs - enteredMs
      : null;

  const approvalDurationMs =
    enteredMs != null &&
    approvalAtMs != null &&
    !Number.isNaN(enteredMs) &&
    approvalAtMs > enteredMs
      ? approvalAtMs - enteredMs
      : null;

  return { reviewDurationMs, approvalDurationMs };
}

export function mapSessionToAnalyticsRecord(row: DbSessionRow): AnalyticsSessionRecord {
  const metadata = row.metadata ?? {};
  const review = parseReviewMetadata(metadata);
  const queue = resolveProcessingQueue(row.status, metadata);
  const { riskLevel, riskScore, estimatedFinancialImpact } = extractRisk(metadata);
  const { operatorName, operatorAnsCode } = extractOperator(metadata);
  const ocr = buildOcrSummaryFromMetadata(metadata);
  const parser = buildStructuredGuideSummaryFromMetadata(metadata);
  const audit = buildAuditReportSummaryFromMetadata(metadata);
  const correction = buildCorrectionSummaryFromMetadata(metadata);
  const { reviewDurationMs, approvalDurationMs } = computeReviewDurations(review, row.updated_at);

  return {
    sessionId: row.id,
    sessionStatus: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    queue,
    approvalStatus: review.approvalStatus,
    operatorName,
    operatorAnsCode,
    guideType: extractGuideType(metadata),
    riskLevel,
    riskScore,
    estimatedFinancialImpact,
    isCritical: isCriticalGuide(riskLevel, riskScore),
    ocrConfidence: ocr?.averageConfidence ?? null,
    parserConfidence: parser?.overallConfidence ?? null,
    auditFindingsCount: audit?.totalFindings ?? 0,
    auditBlockingCount: audit?.blocking ? 1 : 0,
    correctionAccepted: correction?.acceptedCount ?? 0,
    correctionEdited: correction?.editedCount ?? 0,
    correctionRejected: correction?.rejectedCount ?? 0,
    correctionPending: correction?.pendingCount ?? 0,
    correctionTotal: correction?.totalProposals ?? 0,
    reviewEnteredAt: review.enteredAt ?? null,
    reviewDurationMs,
    approvalDurationMs,
    glosaRuleHits: extractGlosaRuleHits(metadata),
  };
}

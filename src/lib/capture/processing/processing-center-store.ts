/**
 * Store do Centro de Processamento — lista sessões de captura para filas operacionais.
 * MEDICFLOW-PROCESSING-CENTER-01
 */
import { PermissionError } from "@/lib/domain/operations/errors";
import { can } from "@/lib/auth/rbac";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { parseReviewMetadata } from "../review/review-workspace-service";
import type { CaptureSessionStatus } from "../types";
import type { RiskLevel } from "../risk/types/risk-assessment";
import { applyProcessingFilters, countByQueue } from "./filters";
import { buildProcessingDashboard } from "./dashboard";
import { resolveProcessingQueue } from "./queue-mapper";
import {
  computePriorityScore,
  isCriticalGuide,
  sortByPriority,
} from "./prioritizer";
import type {
  ProcessingCenterListResult,
  ProcessingCenterQueryInput,
  ProcessingGuideItem,
  ProcessingOperationalDashboard,
} from "./types";

type DbSessionRow = {
  id: string;
  status: CaptureSessionStatus;
  metadata: Record<string, unknown> | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type DbDocumentRow = {
  session_id: string;
  original_filename: string;
};

function assertBillingAccess(ctx: ServiceCtx): void {
  if (!can(ctx.role, "financial_closing:read")) {
    throw new PermissionError("Sem permissão para o Centro de Processamento.");
  }
}

function extractGuideType(metadata: Record<string, unknown>): string | null {
  const parser = metadata.parser;
  if (parser && typeof parser === "object") {
    const guideType = (parser as Record<string, unknown>).guideType;
    if (typeof guideType === "string") return guideType;
  }
  const preview = metadata.riskAssessmentPreview;
  if (preview && typeof preview === "object") {
    const guideType = (preview as Record<string, unknown>).guideType;
    if (typeof guideType === "string") return guideType;
  }
  return null;
}

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
  const contractPreview = metadata.contractIntelligencePreview;
  if (contractPreview && typeof contractPreview === "object") {
    return { operatorName: null, operatorAnsCode: null };
  }
  return { operatorName: null, operatorAnsCode: null };
}

function extractContractualPriority(metadata: Record<string, unknown>): number {
  const contract = metadata.contractIntelligence;
  if (!contract || typeof contract !== "object") return 0;
  const c = contract as Record<string, unknown>;
  const applied = typeof c.appliedRulesCount === "number" ? c.appliedRulesCount : 0;
  const avgDenial = typeof c.averageDenialRisk === "number" ? c.averageDenialRisk : 0;
  const impact =
    typeof c.totalEstimatedFinancialImpactCents === "number"
      ? c.totalEstimatedFinancialImpactCents / 100
      : 0;
  return Math.min(100, applied * 5 + avgDenial * 0.5 + Math.min(impact / 1000, 30));
}

function extractResponsible(metadata: Record<string, unknown>, createdBy: string): string {
  const review = parseReviewMetadata(metadata);
  const lastDecision = review.decisions[review.decisions.length - 1];
  return lastDecision?.actorProfileId ?? createdBy;
}

function mapSessionToGuideItem(
  row: DbSessionRow,
  filename: string | null,
  nowMs: number,
): ProcessingGuideItem {
  const metadata = row.metadata ?? {};
  const review = parseReviewMetadata(metadata);
  const queue = resolveProcessingQueue(row.status, metadata);
  const { riskLevel, riskScore, estimatedFinancialImpact } = extractRisk(metadata);
  const { operatorName, operatorAnsCode } = extractOperator(metadata);
  const contractualPriority = extractContractualPriority(metadata);
  const createdMs = new Date(row.created_at).getTime();
  const waitTimeMs = Math.max(0, nowMs - createdMs);

  const priorityScore = computePriorityScore({
    riskScore,
    riskLevel,
    estimatedFinancialImpact,
    contractualPriority,
    waitTimeMs,
    operatorName,
  });

  return {
    sessionId: row.id,
    filename,
    queue,
    status: row.status,
    approvalStatus: review.approvalStatus,
    operatorName,
    operatorAnsCode,
    guideType: extractGuideType(metadata),
    riskLevel,
    riskScore,
    estimatedFinancialImpact,
    contractualPriority,
    waitTimeMs,
    responsibleProfileId: extractResponsible(metadata, row.created_by),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    priorityScore,
    isCritical: isCriticalGuide(riskLevel, riskScore),
  };
}

async function loadAllProcessingItems(ctx: ServiceCtx): Promise<ProcessingGuideItem[]> {
  const { data: sessions, error } = await ctx.client
    .from("capture_sessions")
    .select("id, status, metadata, created_by, created_at, updated_at")
    .eq("tenant_id", ctx.tenantId)
    .is("deleted_at", null)
    .neq("status", "ARCHIVED")
    .order("updated_at", { ascending: false });

  if (error) throw error;

  const rows = (sessions ?? []) as DbSessionRow[];
  const sessionIds = rows.map((r) => r.id);

  const filenameBySession = new Map<string, string>();
  if (sessionIds.length > 0) {
    const { data: docs, error: docsErr } = await ctx.client
      .from("capture_documents")
      .select("session_id, original_filename")
      .eq("tenant_id", ctx.tenantId)
      .in("session_id", sessionIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (docsErr) throw docsErr;

    for (const doc of (docs ?? []) as DbDocumentRow[]) {
      if (!filenameBySession.has(doc.session_id)) {
        filenameBySession.set(doc.session_id, doc.original_filename);
      }
    }
  }

  const nowMs = Date.now();
  return rows.map((row) =>
    mapSessionToGuideItem(row, filenameBySession.get(row.id) ?? null, nowMs),
  );
}

export async function listProcessingCenterGuides(
  ctx: ServiceCtx,
  input: ProcessingCenterQueryInput = {},
): Promise<ProcessingCenterListResult> {
  assertBillingAccess(ctx);

  const allItems = await loadAllProcessingItems(ctx);
  const queueCounts = countByQueue(allItems);
  const filtered = applyProcessingFilters(allItems, input.filters, input.queue);
  const sorted = sortByPriority(filtered);

  const offset = input.offset ?? 0;
  const limit = input.limit ?? 200;
  const items = sorted.slice(offset, offset + limit);

  return {
    items,
    total: filtered.length,
    queueCounts,
  };
}

export async function getProcessingOperationalDashboard(
  ctx: ServiceCtx,
  filters?: ProcessingCenterQueryInput["filters"],
): Promise<ProcessingOperationalDashboard> {
  assertBillingAccess(ctx);
  const allItems = await loadAllProcessingItems(ctx);
  const filtered = applyProcessingFilters(allItems, filters);
  return buildProcessingDashboard(filtered);
}

/** URL de retorno ao workspace a partir do centro de processamento. */
export function buildReviewWorkspaceUrl(
  sessionId: string,
  returnTo = "/processamento",
  queue?: string,
): string {
  const params = new URLSearchParams({ returnTo });
  if (queue) params.set("queue", queue);
  return `/captura/revisao/${sessionId}?${params.toString()}`;
}

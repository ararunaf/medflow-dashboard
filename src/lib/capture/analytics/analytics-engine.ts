/**
 * AnalyticsEngine — consolida métricas operacionais e financeiras do pipeline.
 * MEDICFLOW-ANALYTICS-01
 *
 * Fonte única: capture_sessions.metadata + learning_metrics.json (tenant).
 * Sem IA generativa — cálculos determinísticos e auditáveis.
 */
import { PermissionError } from "@/lib/domain/operations/errors";
import { can } from "@/lib/auth/rbac";
import type { ServiceCtx } from "@/lib/services/operations/types";
import { loadLearningMetrics } from "../learning/infrastructure/learning-storage";
import { applyAnalyticsFilters } from "./filters";
import { mapSessionToAnalyticsRecord } from "./session-record";
import { buildExecutiveKpis } from "./aggregators/executive";
import { buildQualityIndicators } from "./aggregators/quality";
import { buildOperatorComparisons } from "./aggregators/operators";
import { buildAnalyticsTrends } from "./aggregators/trends";
import type { CaptureSessionStatus } from "../types";
import type { AnalyticsQueryInput, AnalyticsSnapshot } from "./types";

type DbSessionRow = {
  id: string;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

const DEFAULT_TREND_DAYS = 28;

function assertAnalyticsAccess(ctx: ServiceCtx): void {
  if (!can(ctx.role, "financial_closing:read")) {
    throw new PermissionError("Sem permissão para Analytics.");
  }
}

async function loadAnalyticsSessionRows(ctx: ServiceCtx): Promise<DbSessionRow[]> {
  const { data, error } = await ctx.client
    .from("capture_sessions")
    .select("id, status, metadata, created_at, updated_at")
    .eq("tenant_id", ctx.tenantId)
    .is("deleted_at", null)
    .neq("status", "ARCHIVED")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as DbSessionRow[];
}

export class AnalyticsEngine {
  async loadSnapshot(ctx: ServiceCtx, input: AnalyticsQueryInput = {}): Promise<AnalyticsSnapshot> {
    assertAnalyticsAccess(ctx);

    const filters = input.filters ?? {};
    const trendDays = input.trendDays ?? DEFAULT_TREND_DAYS;
    const asOf = new Date();

    const [rows, learningMetrics] = await Promise.all([
      loadAnalyticsSessionRows(ctx),
      loadLearningMetrics(ctx),
    ]);

    const allRecords = rows.map((row) =>
      mapSessionToAnalyticsRecord({
        ...row,
        status: row.status as CaptureSessionStatus,
      }),
    );
    const records = applyAnalyticsFilters(allRecords, filters);

    return {
      asOf: asOf.toISOString(),
      filtersApplied: filters,
      sessionCount: records.length,
      executive: buildExecutiveKpis(records),
      quality: buildQualityIndicators(records, learningMetrics),
      operators: buildOperatorComparisons(records),
      trends: buildAnalyticsTrends(records, trendDays, asOf),
    };
  }
}

let defaultEngine: AnalyticsEngine | null = null;

export function getDefaultAnalyticsEngine(): AnalyticsEngine {
  if (!defaultEngine) defaultEngine = new AnalyticsEngine();
  return defaultEngine;
}

export async function loadAnalyticsSnapshot(
  ctx: ServiceCtx,
  input: AnalyticsQueryInput = {},
): Promise<AnalyticsSnapshot> {
  return getDefaultAnalyticsEngine().loadSnapshot(ctx, input);
}

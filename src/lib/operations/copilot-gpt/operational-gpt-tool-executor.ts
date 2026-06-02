/**
 * Execução server-side de tools do copiloto GPT (consultas + registro supervisionado de propostas).
 */
import { assertCan } from "@/lib/auth/rbac";
import { mapPostgresError } from "@/lib/domain/operations/errors";
import { expectUuid } from "@/lib/domain/operations/validation";
import type { OperationalEntityType, OperationalEventSeverity } from "@/lib/database.types";
import { evaluateOperationalAlerts } from "@/lib/operations/alerts/engine";
import { loadOperationalAnalyticsSnapshot } from "@/lib/operations/analytics/operational-analytics-service";
import { loadOperationalCommandCenterSnapshot } from "@/lib/operations/api/queries/command-center";
import {
  SWAP_LIST_SELECT,
  toSwapListItem,
  type RawSwapRow,
} from "@/lib/operations/api/queries/swaps";
import {
  SHIFT_LIST_SELECT,
  toShiftListItem,
  type RawShiftRow,
} from "@/lib/operations/api/queries/shifts";
import {
  isOperationalEntityType,
  isOperationalEventSeverity,
} from "@/lib/operations/timeline/event-registry";
import type { TimelineScope } from "@/lib/operations/timeline/timeline-adapters";
import type { OperationalAnalyticsSnapshot } from "@/lib/operations/analytics/operational-analytics-service";
import type { OperationalCommandCenterSnapshot } from "@/lib/operations/api/queries/command-center";
import {
  OPERATIONAL_GPT_MAX_TOOL_RESULT_CHARS,
  OPERATIONAL_GPT_TIMELINE_LIMIT_CAP,
  clampInt,
  parseToolArgumentsJson,
} from "@/lib/operations/copilot-gpt/operational-gpt-tool-safety";
import type { OperationalGptToolName } from "@/lib/operations/copilot-gpt/operational-gpt-tool-registry";
import { isOperationalGptReadOnlyToolName } from "@/lib/operations/copilot-gpt/operational-gpt-tool-registry";
import { listOperationalEventsPage } from "@/lib/services/operations/operational-event-queries";
import {
  parseGptSubmitOperationalProposalArgs,
  submitOperationalActionProposalFromGpt,
} from "@/lib/services/operations/operational-action-proposal-service";
import type { ServiceCtx } from "@/lib/services/operations/types";

export type OperationalGptToolTraceEntry = {
  name: OperationalGptToolName;
  ok: boolean;
  detail?: string;
  rowCount?: number;
  /** Resumo não sensível dos argumentos (auditoria UI). */
  argsSummary?: string;
};

export class OperationalGptToolRequestCache {
  private analytics: OperationalAnalyticsSnapshot | undefined;

  private commandCenter: OperationalCommandCenterSnapshot | undefined;

  /** Correlation da requisição HTTP (auditoria GPT). */
  correlationId: string | null = null;

  contextFingerprint: string | null = null;

  proposalSubmitCount = 0;

  async getAnalytics(ctx: ServiceCtx): Promise<OperationalAnalyticsSnapshot> {
    if (!this.analytics) {
      this.analytics = await loadOperationalAnalyticsSnapshot(ctx);
    }
    return this.analytics;
  }

  async getCommandCenter(ctx: ServiceCtx): Promise<OperationalCommandCenterSnapshot> {
    if (!this.commandCenter) {
      this.commandCenter = await loadOperationalCommandCenterSnapshot(ctx);
    }
    return this.commandCenter;
  }
}

function safeStringifyForToolResult(data: unknown): string {
  const s = JSON.stringify(data);
  if (s.length <= OPERATIONAL_GPT_MAX_TOOL_RESULT_CHARS) return s;
  return JSON.stringify({
    truncated: true,
    approxChars: s.length,
    preview: `${s.slice(0, Math.floor(OPERATIONAL_GPT_MAX_TOOL_RESULT_CHARS * 0.55))}…`,
    hint: "Resultado truncado por limite de payload; refine filtros ou use paginação (cursor).",
  });
}

function summarizeArgs(name: OperationalGptToolName, args: Record<string, unknown>): string {
  const parts: string[] = [];
  if (name === "submit_operational_action_proposal") {
    if (typeof args.actionKind === "string") parts.push(`kind=${args.actionKind}`);
    if (typeof args.title === "string") parts.push("title");
    return `${name}${parts.length ? `(${parts.join(",")})` : ""}`;
  }
  const sk = args.scopeKind;
  if (typeof sk === "string") parts.push(`scope=${sk}`);
  if (typeof args.shiftId === "string") parts.push("shiftId");
  if (typeof args.swapId === "string") parts.push("swapId");
  if (typeof args.professionalId === "string") parts.push("professionalId");
  if (typeof args.recommendationId === "string") parts.push("recId");
  if (typeof args.limit === "number") parts.push(`limit=${args.limit}`);
  if (args.cursorCreatedAt && args.cursorId) parts.push("cursor=…");
  return `${name}${parts.length ? `(${parts.join(",")})` : ""}`;
}

function parseScope(args: Record<string, unknown>): TimelineScope {
  const kind = typeof args.scopeKind === "string" ? args.scopeKind : "";
  if (kind === "global") return { kind: "global" };
  if (kind === "shift") {
    return { kind: "shift", shiftId: expectUuid(args.shiftId, "shiftId") };
  }
  if (kind === "professional") {
    return {
      kind: "professional",
      professionalId: expectUuid(args.professionalId, "professionalId"),
    };
  }
  if (kind === "swap") {
    return { kind: "swap", swapId: expectUuid(args.swapId, "swapId") };
  }
  throw new Error("scopeKind inválido ou incompleto para a timeline.");
}

function optionalSeverity(raw: unknown): OperationalEventSeverity | undefined {
  if (typeof raw !== "string") return undefined;
  return isOperationalEventSeverity(raw) ? raw : undefined;
}

function optionalEntityType(raw: unknown): OperationalEntityType | undefined {
  if (typeof raw !== "string") return undefined;
  return isOperationalEntityType(raw) ? raw : undefined;
}

export async function executeOperationalGptTool(input: {
  ctx: ServiceCtx;
  name: OperationalGptToolName;
  argumentsJson: string;
  cache: OperationalGptToolRequestCache;
}): Promise<{ content: string; trace: OperationalGptToolTraceEntry }> {
  const args = parseToolArgumentsJson(input.argumentsJson);
  const baseTrace: OperationalGptToolTraceEntry = {
    name: input.name,
    ok: true,
    argsSummary: summarizeArgs(input.name, args),
  };

  const fail = (msg: string): { content: string; trace: OperationalGptToolTraceEntry } => ({
    content: safeStringifyForToolResult({ ok: false, error: msg, tool: input.name }),
    trace: { ...baseTrace, ok: false, detail: msg },
  });

  try {
    assertCan(input.ctx.role, "shifts:read");

    if (input.name === "submit_operational_action_proposal") {
      if (input.cache.proposalSubmitCount >= 2) {
        return fail("Limite de submit_operational_action_proposal por pergunta (2).");
      }
      let parsed;
      try {
        parsed = parseGptSubmitOperationalProposalArgs(args);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return fail(msg);
      }
      if (!parsed.gptCorrelationId && input.cache.correlationId) {
        parsed.gptCorrelationId = input.cache.correlationId;
      }
      if (!parsed.contextFingerprint && input.cache.contextFingerprint) {
        parsed.contextFingerprint = input.cache.contextFingerprint;
      }
      input.cache.proposalSubmitCount += 1;
      const res = await submitOperationalActionProposalFromGpt(input.ctx, parsed);
      if (res.duplicateOf) {
        return {
          content: safeStringifyForToolResult({
            ok: true,
            duplicate: true,
            proposalId: res.id,
            reference: `operational_action_proposal:${res.id}`,
            hint: "Proposta equivalente já registrada nos últimos 15 minutos (dedupe).",
          }),
          trace: { ...baseTrace, rowCount: 0, detail: "dedupe_hit" },
        };
      }
      return {
        content: safeStringifyForToolResult({
          ok: true,
          tool: input.name,
          proposalId: res.id,
          reference: `operational_action_proposal:${res.id}`,
          state: parsed.requestImmediateConfirmation ? "awaiting_confirmation" : "suggested",
          governance: "Aguardando fluxo humano — nenhuma mutação operacional executada.",
        }),
        trace: { ...baseTrace, rowCount: 1, detail: "proposal_inserted" },
      };
    }

    if (!isOperationalGptReadOnlyToolName(input.name)) {
      return fail(`Tool não suportada: ${String(input.name)}`);
    }

    switch (input.name) {
      case "get_operational_timeline": {
        const scope = parseScope(args);
        const limit = clampInt(args.limit, 20, 1, OPERATIONAL_GPT_TIMELINE_LIMIT_CAP);
        const cursor =
          typeof args.cursorCreatedAt === "string" && typeof args.cursorId === "string"
            ? { createdAt: args.cursorCreatedAt, id: expectUuid(args.cursorId, "cursorId") }
            : undefined;
        const page = await listOperationalEventsPage(input.ctx, {
          scope,
          limit,
          cursor,
          severity: optionalSeverity(args.severity) ?? null,
          entityType: optionalEntityType(args.entityType) ?? null,
        });
        const body = {
          ok: true,
          tool: input.name,
          provenance: "operational_events",
          scope,
          limit,
          nextCursor: page.nextCursor,
          events: page.rows.map((r) => ({
            id: r.id,
            timeline_event: `timeline_event:${r.id}`,
            created_at: r.created_at,
            severity: r.severity,
            event_type: r.event_type,
            entity_type: r.entity_type,
            entity_id: r.entity_id,
            description: r.description ? String(r.description).slice(0, 500) : null,
          })),
        };
        return {
          content: safeStringifyForToolResult(body),
          trace: { ...baseTrace, rowCount: page.rows.length },
        };
      }

      case "get_operational_events": {
        const limit = clampInt(args.limit, 25, 1, OPERATIONAL_GPT_TIMELINE_LIMIT_CAP);
        const page = await listOperationalEventsPage(input.ctx, {
          scope: { kind: "global" },
          limit,
          severity: optionalSeverity(args.severity) ?? null,
          entityType: optionalEntityType(args.entityType) ?? null,
        });
        const body = {
          ok: true,
          tool: input.name,
          provenance: "operational_events",
          events: page.rows.map((r) => ({
            id: r.id,
            timeline_event: `timeline_event:${r.id}`,
            created_at: r.created_at,
            severity: r.severity,
            event_type: r.event_type,
            entity_type: r.entity_type,
            entity_id: r.entity_id,
            description: r.description ? String(r.description).slice(0, 420) : null,
          })),
          nextCursor: page.nextCursor,
        };
        return {
          content: safeStringifyForToolResult(body),
          trace: { ...baseTrace, rowCount: page.rows.length },
        };
      }

      case "get_shift_details": {
        const shiftId = expectUuid(args.shiftId, "shiftId");
        const { data, error } = await input.ctx.client
          .from("shifts")
          .select(SHIFT_LIST_SELECT)
          .eq("tenant_id", input.ctx.tenantId)
          .eq("id", shiftId)
          .maybeSingle()
          .returns<RawShiftRow>();
        if (error) throw mapPostgresError(error);
        if (!data) return fail("Plantão não encontrado ou sem acesso.");
        const item = toShiftListItem(data);
        return {
          content: safeStringifyForToolResult({
            ok: true,
            tool: input.name,
            shiftId,
            detail: item,
          }),
          trace: { ...baseTrace, rowCount: 1 },
        };
      }

      case "get_swap_details": {
        assertCan(input.ctx.role, "swaps:read");
        const swapId = expectUuid(args.swapId, "swapId");
        const { data, error } = await input.ctx.client
          .from("shift_swap_requests")
          .select(SWAP_LIST_SELECT)
          .eq("tenant_id", input.ctx.tenantId)
          .eq("id", swapId)
          .maybeSingle()
          .returns<RawSwapRow>();
        if (error) throw mapPostgresError(error);
        if (!data) return fail("Troca não encontrada ou sem acesso.");
        const item = toSwapListItem(data, input.ctx.professionalId);
        return {
          content: safeStringifyForToolResult({
            ok: true,
            tool: input.name,
            swapId,
            detail: item,
          }),
          trace: { ...baseTrace, rowCount: 1 },
        };
      }

      case "get_operational_kpis": {
        const analytics = await input.cache.getAnalytics(input.ctx);
        const includeTrendSamples = args.includeTrendSamples === true;
        const kpiKeys = [
          "avg_coverage_pct",
          "avg_confirmation_rate_pct",
          "avg_pressure_score",
          "swaps_requested",
          "pending_assignments_now",
        ] as const;
        const primary: Record<string, number | null | undefined> = {};
        const compare: Record<string, number | null | undefined> = {};
        const deltaPct: Record<string, number | null | undefined> = {};
        for (const k of kpiKeys) {
          primary[k] = analytics.kpis.primary[k];
          compare[k] = analytics.kpis.compare[k];
          deltaPct[k] = analytics.kpis.deltaPct[k];
        }
        const body: Record<string, unknown> = {
          ok: true,
          tool: input.name,
          provenance: "operational_analytics",
          asOf: analytics.asOf,
          periods: { primary: analytics.primary, compare: analytics.compare },
          kpis: { primary, compare, deltaPct },
          summaries: {
            operational: analytics.summaries.operational.slice(0, 600),
            workforce: analytics.summaries.workforce.slice(0, 600),
          },
          scoringRefs: {
            healthState: analytics.scoring.healthState,
            consolidatedRiskScore: analytics.scoring.consolidatedRiskScore,
            operationalHealthScore: analytics.scoring.operationalHealthScore,
          },
          meta: { cappedShiftsSample: analytics.meta.cappedShiftsSample },
        };
        if (includeTrendSamples) {
          body.trendSamples = {
            dailyCoveragePct: analytics.trends.dailyCoveragePct.slice(-10),
            dailyPressureScore: analytics.trends.dailyPressureScore.slice(-10),
          };
        }
        return {
          content: safeStringifyForToolResult(body),
          trace: { ...baseTrace, detail: "analytics_snapshot", rowCount: kpiKeys.length },
        };
      }

      case "get_forecast_snapshot": {
        const cc = await input.cache.getCommandCenter(input.ctx);
        const fc = cc.recommendations.forecast;
        const body = {
          ok: true,
          tool: input.name,
          provenance: "recommendation_bundle_forecast",
          forecast: {
            computedAt: fc.computedAt,
            basis: fc.basis,
            projection: fc.projection,
            rationale: fc.rationale.slice(0, 12),
          },
          recommendationSummary: cc.recommendations.summary,
          fingerprintWindow: { asOf: cc.asOf, window: cc.window },
        };
        return {
          content: safeStringifyForToolResult(body),
          trace: { ...baseTrace, detail: `projection=${fc.projection}` },
        };
      }

      case "get_recommendation_details": {
        const recommendationId =
          typeof args.recommendationId === "string" ? args.recommendationId.trim() : "";
        if (!recommendationId) return fail("recommendationId obrigatório.");
        const cc = await input.cache.getCommandCenter(input.ctx);
        const item = cc.recommendations.items.find((i) => i.id === recommendationId);
        if (!item) {
          const analytics = await input.cache.getAnalytics(input.ctx);
          const fromAnalytics = analytics.recommendations.items.find(
            (i) => i.id === recommendationId,
          );
          if (!fromAnalytics) return fail("Recomendação não encontrada no snapshot atual.");
          return {
            content: safeStringifyForToolResult({
              ok: true,
              tool: input.name,
              source: "analytics_period",
              recommendation: fromAnalytics,
              reference: `recommendation:${fromAnalytics.id}`,
            }),
            trace: { ...baseTrace, rowCount: 1, detail: "from_analytics" },
          };
        }
        const fb = cc.recommendationFeedback.byRecommendationId[item.id];
        return {
          content: safeStringifyForToolResult({
            ok: true,
            tool: input.name,
            source: "live_command_center",
            recommendation: item,
            reference: `recommendation:${item.id}`,
            feedbackHints: fb
              ? {
                  confidenceLabel: fb.confidenceLabel,
                  lastEffectivenessScore: fb.lastEffectivenessScore,
                  lastFeedbackType: fb.lastFeedbackType,
                  lastFeedbackAt: fb.lastFeedbackAt,
                }
              : null,
          }),
          trace: { ...baseTrace, rowCount: 1, detail: "from_command_center" },
        };
      }

      case "get_recent_alerts": {
        const limit = clampInt(args.limit, 16, 1, 24);
        const cc = await input.cache.getCommandCenter(input.ctx);
        const { scoring, recommendations, recommendationFeedback, ...core } = cc;
        void scoring;
        void recommendations;
        void recommendationFeedback;
        const alerts = evaluateOperationalAlerts(core);
        const sliced = alerts.slice(0, limit);
        return {
          content: safeStringifyForToolResult({
            ok: true,
            tool: input.name,
            provenance: "operational_alert_engine",
            asOf: cc.asOf,
            alerts: sliced.map((a) => ({
              alert: `alert:${a.id}`,
              id: a.id,
              severity: a.severity,
              title: a.title,
              detail: a.detail.slice(0, 500),
            })),
          }),
          trace: { ...baseTrace, rowCount: sliced.length },
        };
      }

      default: {
        return fail(`Tool não suportada: ${String(input.name)}`);
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return fail(msg);
  }
}

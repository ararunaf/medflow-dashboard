/**
 * Server functions — Analytics Executivo (MEDICFLOW-ANALYTICS-01).
 */
import { createServerFn } from "@tanstack/react-start";
import { optionalString, runQuery } from "@/lib/server/fn-helpers";
import { loadAnalyticsSnapshot } from "../analytics/analytics-engine";
import type { AnalyticsFilters } from "../analytics/types";
import { PROCESSING_QUEUE_IDS } from "../processing/types";
import { RISK_LEVELS } from "../risk/types/risk-assessment";
import { CAPTURE_SESSION_STATUSES } from "../types";
import type { ProcessingCenterFilters, ProcessingQueueId } from "../processing/types";

function parseFilters(raw: unknown): AnalyticsFilters {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  const filters: ProcessingCenterFilters = {};

  const operator = optionalString(obj.operator, "operator");
  if (operator) filters.operator = operator;

  const guideType = optionalString(obj.guideType, "guideType");
  if (guideType) filters.guideType = guideType;

  const riskLevel = optionalString(obj.riskLevel, "riskLevel");
  if (riskLevel && (RISK_LEVELS as readonly string[]).includes(riskLevel)) {
    filters.riskLevel = riskLevel as ProcessingCenterFilters["riskLevel"];
  }

  const queue = optionalString(obj.queue, "queue");
  if (queue && (PROCESSING_QUEUE_IDS as readonly string[]).includes(queue)) {
    filters.queue = queue as ProcessingQueueId;
  }

  const status = optionalString(obj.status, "status");
  if (status && (CAPTURE_SESSION_STATUSES as readonly string[]).includes(status)) {
    filters.status = status as ProcessingCenterFilters["status"];
  }

  const periodFrom = optionalString(obj.periodFrom, "periodFrom");
  if (periodFrom) filters.periodFrom = periodFrom;

  const periodTo = optionalString(obj.periodTo, "periodTo");
  if (periodTo) filters.periodTo = periodTo;

  const responsible = optionalString(obj.responsible, "responsible");
  if (responsible) filters.responsible = responsible;

  return filters;
}

function parseSnapshotInput(raw: unknown) {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const trendDays = typeof obj.trendDays === "number" ? obj.trendDays : undefined;
  return {
    filters: parseFilters(obj.filters),
    trendDays,
  };
}

export const getAnalyticsSnapshotFn = createServerFn({ method: "GET" })
  .inputValidator(parseSnapshotInput)
  .handler(async ({ data }) => {
    return runQuery((ctx) => loadAnalyticsSnapshot(ctx, data));
  });

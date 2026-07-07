/**
 * Server functions — Centro Operacional de Processamento.
 * MEDICFLOW-PROCESSING-CENTER-01
 */
import { createServerFn } from "@tanstack/react-start";
import {
  optionalString,
  requireObject,
  runMutation,
  runQuery,
} from "@/lib/server/fn-helpers";
import {
  getProcessingOperationalDashboard,
  listProcessingCenterGuides,
} from "../processing/processing-center-store";
import type { ProcessingCenterFilters, ProcessingQueueId } from "../processing/types";
import { PROCESSING_QUEUE_IDS } from "../processing/types";
import { RISK_LEVELS } from "../risk/types/risk-assessment";
import { CAPTURE_SESSION_STATUSES } from "../types";

function parseFilters(raw: unknown): ProcessingCenterFilters {
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

function parseListInput(raw: unknown) {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const queue = optionalString(obj.queue, "queue");
  const limit = typeof obj.limit === "number" ? obj.limit : undefined;
  const offset = typeof obj.offset === "number" ? obj.offset : undefined;

  return {
    filters: parseFilters(obj.filters),
    queue:
      queue && (PROCESSING_QUEUE_IDS as readonly string[]).includes(queue)
        ? (queue as ProcessingQueueId)
        : undefined,
    limit,
    offset,
  };
}

function parseDashboardInput(raw: unknown) {
  const obj = raw && typeof raw === "object" ? requireObject(raw) : {};
  return { filters: parseFilters(obj.filters) };
}

export const listProcessingCenterFn = createServerFn({ method: "GET" })
  .inputValidator(parseListInput)
  .handler(async ({ data }) => {
    return runQuery((ctx) => listProcessingCenterGuides(ctx, data));
  });

export const getProcessingDashboardFn = createServerFn({ method: "GET" })
  .inputValidator(parseDashboardInput)
  .handler(async ({ data }) => {
    return runQuery((ctx) => getProcessingOperationalDashboard(ctx, data.filters));
  });

/** Placeholder para futuras mutações — mantém runMutation disponível. */
export const refreshProcessingCenterFn = createServerFn({ method: "POST" })
  .inputValidator(() => ({}))
  .handler(async () => {
    return runMutation(async (ctx) => {
      const result = await listProcessingCenterGuides(ctx, {});
      return { refreshedAt: new Date().toISOString(), total: result.total };
    });
  });

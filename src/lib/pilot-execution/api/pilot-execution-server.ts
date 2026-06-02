/**
 * Server functions — execução piloto V1 (feedback, incidentes, adoção, flags, analytics).
 */
import { createServerFn } from "@tanstack/react-start";
import { ValidationError } from "@/lib/domain/operations/errors";
import {
  runMutation,
  runQuery,
  type MutationResult,
  type QueryResult,
} from "@/lib/server/fn-helpers";
import { requireObject, optionalString } from "@/lib/server/fn-helpers";
import {
  buildPilotLightAnalytics,
  buildPilotIncidentsExport,
  computeOperationalAdoptionScore,
  ensureDefaultPilotFeatureFlags,
  isPilotFlagEnabled,
  listPilotFeatureFlags,
  listPilotIncidents,
  listRecentPilotFeedback,
  listRecentPilotSuggestions,
  recordPilotAdoptionEvent,
  reportPilotIncident,
  setPilotFeatureFlag,
  submitPilotFeedback,
  submitPilotSuggestion,
  updatePilotIncident,
} from "@/lib/services/pilot-execution";
import type {
  PilotAdoptionEventType,
  PilotFeedbackSeverity,
  PilotIncidentSeverity,
  PilotIncidentStatus,
  PilotFollowUpStatus,
} from "@/lib/services/pilot-execution";

const FEEDBACK_SEVERITIES = new Set(["low", "medium", "high"]);
const INCIDENT_SEVERITIES = new Set(["low", "medium", "high", "critical"]);
const INCIDENT_STATUSES = new Set(["open", "investigating", "resolved", "closed"]);
const FOLLOW_UP_STATUSES = new Set(["pending", "scheduled", "done", "not_required"]);
const ADOPTION_TYPES = new Set([
  "login",
  "onboarding_complete",
  "dashboard_view",
  "financial_workflow",
  "module_access",
  "feature_use",
]);

function parseContext(o: Record<string, unknown>) {
  const route =
    optionalString(o.context_route, "context_route") ?? optionalString(o.route, "route");
  const module =
    optionalString(o.context_module, "context_module") ?? optionalString(o.module, "module");
  return route || module ? { route: route ?? null, module: module ?? null } : undefined;
}

export type PilotExecutionBundle = {
  feedback: Awaited<ReturnType<typeof listRecentPilotFeedback>>;
  suggestions: Awaited<ReturnType<typeof listRecentPilotSuggestions>>;
  incidents: Awaited<ReturnType<typeof listPilotIncidents>>;
  flags: Awaited<ReturnType<typeof listPilotFeatureFlags>>;
  analytics: Awaited<ReturnType<typeof buildPilotLightAnalytics>>;
  adoption: Awaited<ReturnType<typeof computeOperationalAdoptionScore>>;
};

export const getPilotExecutionBundleFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => {
    if (raw == null) return { onboardingPercent: 0 };
    const o =
      typeof raw === "object" && raw !== null && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : {};
    const nested =
      typeof o.data === "object" && o.data !== null && !Array.isArray(o.data)
        ? (o.data as Record<string, unknown>)
        : o;
    const p = nested.onboardingPercent;
    const onboardingPercent =
      typeof p === "number" && Number.isFinite(p) ? Math.max(0, Math.min(100, p)) : 0;
    return { onboardingPercent };
  })
  .handler(async ({ data }): Promise<QueryResult<PilotExecutionBundle>> => {
    return runQuery(async (ctx) => {
      const [feedback, suggestions, incidents, flags] = await Promise.all([
        listRecentPilotFeedback(ctx, 25),
        listRecentPilotSuggestions(ctx, 25),
        listPilotIncidents(ctx, 50),
        listPilotFeatureFlags(ctx),
      ]);
      const [analytics, adoption] = await Promise.all([
        buildPilotLightAnalytics(ctx),
        computeOperationalAdoptionScore(ctx, { onboardingPercent: data.onboardingPercent }),
      ]);
      return { feedback, suggestions, incidents, flags, analytics, adoption };
    });
  });

export const submitPilotFeedbackFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw, "payload");
    const severity = optionalString(o.severity, "severity") ?? "medium";
    if (!FEEDBACK_SEVERITIES.has(severity)) {
      throw new ValidationError("severity inválida.", { field: "severity" });
    }
    const description = optionalString(o.description, "description");
    if (!description?.trim()) {
      throw new ValidationError("description é obrigatória.", { field: "description" });
    }
    const category = optionalString(o.category, "category") ?? "other";
    return {
      category,
      severity: severity as PilotFeedbackSeverity,
      description: description.trim(),
      context: parseContext(o),
    };
  })
  .handler(async ({ data }): Promise<MutationResult<{ id: string }>> => {
    return runMutation((ctx) => submitPilotFeedback(ctx, data));
  });

export const submitPilotSuggestionFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw, "payload");
    const severity = optionalString(o.severity, "severity") ?? "medium";
    if (!FEEDBACK_SEVERITIES.has(severity)) {
      throw new ValidationError("severity inválida.", { field: "severity" });
    }
    const description = optionalString(o.description, "description");
    if (!description?.trim()) {
      throw new ValidationError("description é obrigatória.", { field: "description" });
    }
    return {
      category: optionalString(o.category, "category") ?? "improvement",
      severity: severity as PilotFeedbackSeverity,
      description: description.trim(),
      context: parseContext(o),
    };
  })
  .handler(async ({ data }): Promise<MutationResult<{ id: string }>> => {
    return runMutation((ctx) => submitPilotSuggestion(ctx, data));
  });

export const reportPilotIncidentFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw, "payload");
    const severity = optionalString(o.severity, "severity") ?? "medium";
    if (!INCIDENT_SEVERITIES.has(severity)) {
      throw new ValidationError("severity inválida.", { field: "severity" });
    }
    const description = optionalString(o.description, "description");
    if (!description?.trim()) {
      throw new ValidationError("description é obrigatória.", { field: "description" });
    }
    return {
      category: optionalString(o.category, "category") ?? "operational",
      severity: severity as PilotIncidentSeverity,
      description: description.trim(),
      operationalSource: optionalString(o.operationalSource, "operationalSource") ?? "unknown",
      context: parseContext(o),
    };
  })
  .handler(async ({ data }): Promise<MutationResult<{ id: string }>> => {
    return runMutation((ctx) => reportPilotIncident(ctx, data));
  });

export const updatePilotIncidentFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw, "payload");
    const incidentId = optionalString(o.incidentId, "incidentId");
    if (!incidentId) throw new ValidationError("incidentId obrigatório.", { field: "incidentId" });
    const incidentStatus = optionalString(o.incidentStatus, "incidentStatus");
    if (incidentStatus && !INCIDENT_STATUSES.has(incidentStatus)) {
      throw new ValidationError("incidentStatus inválido.", { field: "incidentStatus" });
    }
    const followUpStatus = optionalString(o.followUpStatus, "followUpStatus");
    if (followUpStatus && !FOLLOW_UP_STATUSES.has(followUpStatus)) {
      throw new ValidationError("followUpStatus inválido.", { field: "followUpStatus" });
    }
    return {
      incidentId,
      incidentStatus: incidentStatus as PilotIncidentStatus | undefined,
      followUpStatus: followUpStatus as PilotFollowUpStatus | undefined,
      resolutionNotes:
        o.resolutionNotes === null ? null : optionalString(o.resolutionNotes, "resolutionNotes"),
    };
  })
  .handler(
    async ({ data }): Promise<MutationResult<Awaited<ReturnType<typeof updatePilotIncident>>>> => {
      return runMutation((ctx) => updatePilotIncident(ctx, data));
    },
  );

export const recordPilotAdoptionEventFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw, "payload");
    const eventType = optionalString(o.eventType, "eventType");
    if (!eventType || !ADOPTION_TYPES.has(eventType)) {
      throw new ValidationError("eventType inválido.", { field: "eventType" });
    }
    const module = optionalString(o.module, "module");
    if (!module?.trim()) {
      throw new ValidationError("module é obrigatório.", { field: "module" });
    }
    const metadata =
      o.metadata && typeof o.metadata === "object" && !Array.isArray(o.metadata)
        ? (o.metadata as Record<string, unknown>)
        : undefined;
    return {
      eventType: eventType as PilotAdoptionEventType,
      module: module.trim(),
      metadata,
    };
  })
  .handler(async ({ data }): Promise<MutationResult<{ recorded: boolean; id?: string }>> => {
    return runMutation(async (ctx) => {
      const result = await recordPilotAdoptionEvent(ctx, data);
      return { recorded: !!result, id: result?.id };
    });
  });

export const setPilotFeatureFlagFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const o = requireObject(raw, "payload");
    const flagKey = optionalString(o.flagKey, "flagKey");
    if (!flagKey?.trim()) throw new ValidationError("flagKey obrigatório.", { field: "flagKey" });
    if (typeof o.enabled !== "boolean") {
      throw new ValidationError("enabled deve ser boolean.", { field: "enabled" });
    }
    return { flagKey: flagKey.trim(), enabled: o.enabled };
  })
  .handler(
    async ({ data }): Promise<MutationResult<Awaited<ReturnType<typeof setPilotFeatureFlag>>>> => {
      return runMutation((ctx) => setPilotFeatureFlag(ctx, data.flagKey, data.enabled));
    },
  );

export const ensurePilotFeatureFlagsFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    if (raw == null) return {};
    if (typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, never>;
    return {};
  })
  .handler(
    async (): Promise<
      MutationResult<Awaited<ReturnType<typeof ensureDefaultPilotFeatureFlags>>>
    > => {
      return runMutation((ctx) => ensureDefaultPilotFeatureFlags(ctx));
    },
  );

export const exportPilotIncidentsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<QueryResult<ReturnType<typeof buildPilotIncidentsExport>>> => {
    return runQuery(async (ctx) => {
      const incidents = await listPilotIncidents(ctx, 200);
      return buildPilotIncidentsExport({ tenantId: ctx.tenantId, incidents });
    });
  },
);

export { isPilotFlagEnabled };

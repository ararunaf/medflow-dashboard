import type { ServiceCtx } from "@/lib/services/operations/types";
import { clampJsonMetadata } from "@/lib/services/resilience/resilience-service";
import type { PilotAdoptionEventType } from "./pilot-execution-types";

const DEDUPE_WINDOW_MS = 60_000;

/** Registro fire-and-forget de adoção — falhas não propagam. */
export async function recordPilotAdoptionEvent(
  ctx: ServiceCtx,
  input: {
    eventType: PilotAdoptionEventType;
    module: string;
    metadata?: Record<string, unknown>;
  },
): Promise<{ id: string } | null> {
  const row = {
    tenant_id: ctx.tenantId,
    actor_profile_id: ctx.actorProfileId,
    event_type: input.eventType,
    module: input.module.slice(0, 64),
    metadata: clampJsonMetadata(input.metadata ?? {}),
  };
  const { data, error } = await ctx.client
    .from("pilot_adoption_events")
    .insert(row)
    .select("id")
    .maybeSingle();
  if (error) {
    console.warn("[pilot_adoption_events]", error.message);
    return null;
  }
  return data?.id ? { id: data.id } : null;
}

export type OperationalAdoptionScore = {
  score: number;
  label: string;
  breakdown: {
    onboardingSignals: number;
    moduleDiversity: number;
    loginActivity: number;
    dashboardUsage: number;
    financialWorkflow: number;
  };
  onboardingComplete: boolean;
  distinctModules: number;
  eventCount30d: number;
};

export async function computeOperationalAdoptionScore(
  ctx: ServiceCtx,
  args: { onboardingPercent: number },
): Promise<OperationalAdoptionScore> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: events, error } = await ctx.client
    .from("pilot_adoption_events")
    .select("event_type, module, created_at")
    .eq("tenant_id", ctx.tenantId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  const list = events ?? [];

  const modules = new Set(list.map((e) => e.module));
  const hasLogin = list.some((e) => e.event_type === "login");
  const hasDashboard = list.some((e) => e.event_type === "dashboard_view");
  const hasFinancial = list.some((e) => e.event_type === "financial_workflow");
  const onboardingComplete =
    list.some((e) => e.event_type === "onboarding_complete") || args.onboardingPercent >= 85;

  const onboardingSignals = Math.min(25, Math.round(args.onboardingPercent * 0.25));
  const moduleDiversity = Math.min(25, modules.size * 5);
  const loginActivity = hasLogin ? 15 : 0;
  const dashboardUsage = hasDashboard ? 20 : 0;
  const financialWorkflow = hasFinancial ? 15 : 0;

  const raw =
    onboardingSignals + moduleDiversity + loginActivity + dashboardUsage + financialWorkflow;
  const score = Math.min(100, raw);

  let label = "Inicial";
  if (score >= 75) label = "Consolidada";
  else if (score >= 50) label = "Em expansão";
  else if (score >= 25) label = "Ativação";

  return {
    score,
    label,
    breakdown: {
      onboardingSignals,
      moduleDiversity,
      loginActivity,
      dashboardUsage,
      financialWorkflow,
    },
    onboardingComplete,
    distinctModules: modules.size,
    eventCount30d: list.length,
  };
}

/** Evita spam de eventos idênticos na mesma sessão (cliente pode chamar várias vezes). */
export function shouldSkipAdoptionDedupe(
  lastKey: string | null,
  nextKey: string,
  lastAtMs: number | null,
): boolean {
  if (lastKey !== nextKey) return false;
  if (lastAtMs == null) return false;
  return Date.now() - lastAtMs < DEDUPE_WINDOW_MS;
}

export function adoptionEventKey(eventType: string, module: string): string {
  return `${eventType}:${module}`;
}

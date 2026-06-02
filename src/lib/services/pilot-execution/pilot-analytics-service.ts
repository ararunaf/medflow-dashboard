import type { ServiceCtx } from "@/lib/services/operations/types";

export type PilotLightAnalytics = {
  moduleUsage: { module: string; count: number }[];
  profileUsage: { role: string; count: number }[];
  topRoutes: { route: string; count: number }[];
  feedbackByCategory: { category: string; count: number }[];
  openIncidents: number;
  suggestionsPending: number;
  avgOnboardingDays: number | null;
  bottlenecks: { label: string; detail: string }[];
};

function tally(items: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const x of items) {
    m.set(x, (m.get(x) ?? 0) + 1);
  }
  return m;
}

function topN(m: Map<string, number>, n: number): { key: string; count: number }[] {
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));
}

export async function buildPilotLightAnalytics(ctx: ServiceCtx): Promise<PilotLightAnalytics> {
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [adoptionRes, feedbackRes, incidentsRes, suggestionsRes] = await Promise.all([
    ctx.client
      .from("pilot_adoption_events")
      .select("module, event_type, actor_profile_id, created_at")
      .eq("tenant_id", ctx.tenantId)
      .gte("created_at", since30)
      .limit(400),
    ctx.client
      .from("pilot_feedback")
      .select("category, context_route")
      .eq("tenant_id", ctx.tenantId)
      .gte("created_at", since30)
      .limit(200),
    ctx.client
      .from("pilot_incidents")
      .select("incident_status, severity, operational_source")
      .eq("tenant_id", ctx.tenantId)
      .gte("created_at", since30)
      .limit(100),
    ctx.client
      .from("pilot_suggestions")
      .select("suggestion_status")
      .eq("tenant_id", ctx.tenantId)
      .gte("created_at", since30)
      .limit(100),
  ]);

  if (adoptionRes.error) throw adoptionRes.error;
  if (feedbackRes.error) throw feedbackRes.error;
  if (incidentsRes.error) throw incidentsRes.error;
  if (suggestionsRes.error) throw suggestionsRes.error;

  const adoption = adoptionRes.data ?? [];
  const feedback = feedbackRes.data ?? [];
  const incidents = incidentsRes.data ?? [];
  const suggestions = suggestionsRes.data ?? [];

  const moduleTally = tally(adoption.map((e) => e.module));
  const routeTally = tally(
    feedback.map((f) => f.context_route).filter((r): r is string => !!r?.trim()),
  );
  const categoryTally = tally(feedback.map((f) => f.category));

  const { data: profiles } = await ctx.client
    .from("profiles")
    .select("id, role")
    .eq("tenant_id", ctx.tenantId);
  const roleById = new Map((profiles ?? []).map((p) => [p.id, p.role as string]));
  const profileTally = tally(adoption.map((e) => roleById.get(e.actor_profile_id) ?? "unknown"));

  const openIncidents = incidents.filter(
    (i) => i.incident_status === "open" || i.incident_status === "investigating",
  ).length;

  const suggestionsPending = suggestions.filter((s) => s.suggestion_status === "submitted").length;

  const onboardingEvents = adoption.filter((e) => e.event_type === "onboarding_complete");
  let avgOnboardingDays: number | null = null;
  if (onboardingEvents.length > 0) {
    const days = onboardingEvents.map((e) => {
      const d = new Date(e.created_at);
      return d.getTime() / (24 * 60 * 60 * 1000);
    });
    const avgDay = days.reduce((a, b) => a + b, 0) / days.length;
    const nowDay = Date.now() / (24 * 60 * 60 * 1000);
    avgOnboardingDays = Math.max(1, Math.round(nowDay - avgDay + 1));
  }

  const bottlenecks: { label: string; detail: string }[] = [];
  if (openIncidents >= 3) {
    bottlenecks.push({
      label: "Incidentes abertos",
      detail: `${openIncidents} incidente(s) aguardando resolução`,
    });
  }
  const modTop = topN(moduleTally, 1)[0];
  const modLow = moduleTally.size < 3;
  if (modLow && adoption.length > 0) {
    bottlenecks.push({
      label: "Baixa diversidade de módulos",
      detail: "Menos de 3 módulos com uso registrado nos últimos 30 dias",
    });
  }
  if (modTop && adoption.length >= 10) {
    const total = adoption.length;
    const share = modTop.count / total;
    if (share > 0.7) {
      bottlenecks.push({
        label: "Concentração de uso",
        detail: `Módulo "${modTop.key}" concentra ${Math.round(share * 100)}% dos acessos`,
      });
    }
  }

  return {
    moduleUsage: topN(moduleTally, 8).map(({ key, count }) => ({ module: key, count })),
    profileUsage: topN(profileTally, 6).map(({ key, count }) => ({ role: key, count })),
    topRoutes: topN(routeTally, 6).map(({ key, count }) => ({ route: key, count })),
    feedbackByCategory: topN(categoryTally, 6).map(({ key, count }) => ({ category: key, count })),
    openIncidents,
    suggestionsPending,
    avgOnboardingDays,
    bottlenecks,
  };
}

import type { OperationalHealthCheck } from "@/lib/services/operational-health/operational-health-service";
import type { TenantSettingsRow } from "@/lib/services/tenant-settings/tenant-settings-service";
import type { ReadinessItem } from "@/lib/services/readiness-check/readiness-check-service";
import { validatePublicEnv } from "@/lib/env/public-env-validation";

export type DeploymentReadinessItem = ReadinessItem & { kind: "env" | "ops" | "security" };

export function buildDeploymentReadinessItems(
  settings: TenantSettingsRow | null,
  health: OperationalHealthCheck[],
): DeploymentReadinessItem[] {
  const env = validatePublicEnv();
  const dbOk = health.find((h) => h.id === "database")?.ok ?? false;
  const latencyOk = health.find((h) => h.id === "latency")?.ok ?? true;

  const items: DeploymentReadinessItem[] = [
    {
      id: "env_supabase",
      kind: "env",
      done: env.supabaseConfigured,
      title: "Variáveis Supabase (VITE_) configuradas",
      hint: "Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no painel de deploy.",
    },
    {
      id: "env_warnings",
      kind: "env",
      done: env.warnings.length === 0,
      title: "Sem avisos críticos de ambiente",
      hint: env.warnings.join(" · ") || "Variáveis públicas revisadas.",
    },
    {
      id: "ops_db",
      kind: "ops",
      done: dbOk,
      title: "Health check de banco em tempo real",
      hint: "Garante RLS e conectividade antes do tráfego real.",
    },
    {
      id: "ops_latency",
      kind: "ops",
      done: latencyOk,
      title: "Latência de leitura aceitável",
      hint: "Acima de 5s sugere instabilidade de rede ou projeto Supabase.",
    },
    {
      id: "sec_contact",
      kind: "security",
      done: !!(settings?.contact_email?.trim() || settings?.support_phone?.trim()),
      title: "Canal de contato institucional",
      hint: "Útil para suporte em incidentes e onboarding.",
    },
    {
      id: "sec_app_url",
      kind: "security",
      done: env.appUrlConfigured,
      title: "URL canônica de produção",
      hint: "VITE_MEDFLOW_APP_URL para redirects, OG e smoke tests.",
    },
  ];

  return items;
}

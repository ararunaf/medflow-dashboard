import { validatePublicEnv } from "@/lib/env/public-env-validation";
import { runStartupChecks } from "@/lib/env/startup-checks";
import type { OperationalHealthCheck } from "@/lib/services/operational-health/operational-health-service";
import type { TenantSettingsRow } from "@/lib/services/tenant-settings/tenant-settings-service";
import type { ReadinessItem } from "@/lib/services/readiness-check/readiness-check-service";
import { buildDeploymentReadinessItems } from "@/lib/services/deployment-readiness/deployment-readiness-service";

export type ProductionValidationItem = ReadinessItem & {
  category: "env" | "tenant" | "security" | "ops";
  critical: boolean;
};

export type ProductionValidationReport = {
  ok: boolean;
  scorePercent: number;
  items: ProductionValidationItem[];
  startup: ReturnType<typeof runStartupChecks>;
};

export function buildProductionValidationReport(
  settings: TenantSettingsRow | null,
  health: OperationalHealthCheck[],
): ProductionValidationReport {
  const startup = runStartupChecks();
  const env = validatePublicEnv();
  const deployment = buildDeploymentReadinessItems(settings, health);
  const dbOk = health.find((h) => h.id === "database")?.ok ?? false;

  const items: ProductionValidationItem[] = [
    ...deployment.map((d) => ({
      id: d.id,
      done: d.done,
      title: d.title,
      hint: d.hint,
      category:
        d.kind === "env"
          ? ("env" as const)
          : d.kind === "security"
            ? ("security" as const)
            : ("ops" as const),
      critical: d.id === "env_supabase" || d.id === "ops_db",
    })),
    {
      id: "tenant_institution",
      category: "tenant",
      critical: true,
      done: !!settings?.institution_name?.trim(),
      title: "Nome institucional para tenants reais",
      hint: "Obrigatório para onboarding e relatórios com marca.",
    },
    {
      id: "tenant_timezone",
      category: "tenant",
      critical: false,
      done: !!settings?.operational_timezone?.trim(),
      title: "Fuso operacional configurado",
      hint: "Padrão America/Sao_Paulo se não informado.",
    },
    {
      id: "sec_app_url",
      category: "security",
      critical: false,
      done: env.appUrlConfigured,
      title: "URL canônica de produção (VITE_MEDFLOW_APP_URL)",
      hint: "Usada em metadados, redirects seguros e smoke tests.",
    },
    {
      id: "startup_ok",
      category: "env",
      critical: true,
      done: startup.ok,
      title: "Startup checks SSR",
      hint: startup.checks.map((c) => c.detail).join(" · "),
    },
    {
      id: "ops_session_db",
      category: "ops",
      critical: true,
      done: dbOk,
      title: "Tenant responde no Supabase com RLS",
      hint: "Validação antes de aceitar tráfego real.",
    },
  ];

  const critical = items.filter((i) => i.critical);
  const criticalDone = critical.filter((i) => i.done).length;
  const allDone = items.filter((i) => i.done).length;
  const scorePercent = items.length ? Math.round((allDone / items.length) * 100) : 0;
  const ok = critical.every((i) => i.done) && criticalDone === critical.length;

  return { ok, scorePercent, items, startup };
}

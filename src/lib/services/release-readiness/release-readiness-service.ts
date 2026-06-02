import { validatePublicEnv } from "@/lib/env/public-env-validation";
import { runStartupChecks } from "@/lib/env/startup-checks";
import { buildDeploymentReadinessItems } from "@/lib/services/deployment-readiness/deployment-readiness-service";
import type { OperationalHealthCheck } from "@/lib/services/operational-health/operational-health-service";
import {
  buildProductionValidationReport,
  type ProductionValidationReport,
} from "@/lib/services/production-validation/production-validation-service";
import type { ReadinessItem } from "@/lib/services/readiness-check/readiness-check-service";
import {
  buildSecurityValidationReport,
  type SecurityValidationReport,
} from "@/lib/services/security-validation/security-validation-service";
import type { TenantSettingsRow } from "@/lib/services/tenant-settings/tenant-settings-service";

export type ReleaseReadinessItem = ReadinessItem & {
  area: "env" | "security" | "ops" | "release";
  critical: boolean;
};

export type ReleaseReadinessReport = {
  ready: boolean;
  scorePercent: number;
  production: ProductionValidationReport;
  security: SecurityValidationReport;
  items: ReleaseReadinessItem[];
  manualSteps: string[];
};

export function buildReleaseReadinessReport(
  settings: TenantSettingsRow | null,
  health: OperationalHealthCheck[],
): ReleaseReadinessReport {
  const startup = runStartupChecks();
  const env = validatePublicEnv();
  const production = buildProductionValidationReport(settings, health);
  const security = buildSecurityValidationReport(env);
  const deployment = buildDeploymentReadinessItems(settings, health);

  const items: ReleaseReadinessItem[] = [
    ...deployment.map((d) => ({
      id: `dep_${d.id}`,
      done: d.done,
      title: d.title,
      hint: d.hint,
      area:
        d.kind === "env"
          ? ("env" as const)
          : d.kind === "security"
            ? ("security" as const)
            : ("ops" as const),
      critical: d.id === "env_supabase" || d.id === "ops_db",
    })),
    ...security.items.map((s) => ({
      id: `sec_${s.id}`,
      done: s.passed,
      title: s.title,
      hint: s.detail,
      area: "security" as const,
      critical: s.critical,
    })),
    {
      id: "rel_startup",
      area: "release",
      critical: true,
      done: startup.ok,
      title: "Startup checks SSR",
      hint: startup.checks.map((c) => c.detail).join(" · "),
    },
    {
      id: "rel_score",
      area: "release",
      critical: false,
      done: production.scorePercent >= 80,
      title: "Score de produção ≥ 80%",
      hint: `Atual: ${production.scorePercent}%.`,
    },
  ];

  const critical = items.filter((i) => i.critical);
  const ready = critical.every((i) => i.done) && production.ok;
  const done = items.filter((i) => i.done).length;
  const scorePercent = items.length ? Math.round((done / items.length) * 100) : 0;

  const manualSteps = [
    "Aplicar migrations em supabase/migrations no projeto de produção (manual).",
    "Configurar variáveis VITE_* no painel Cloudflare antes do build de deploy.",
    "Configurar secrets MEDFLOW_* (OpenAI) apenas no servidor — sem prefixo VITE_.",
    "Executar smoke tests em /lancamento após deploy.",
    "Confirmar DNS e VITE_MEDFLOW_APP_URL alinhados ao domínio final.",
  ];

  return { ready, scorePercent, production, security, items, manualSteps };
}

import { validatePublicEnv, type PublicEnvStatus } from "@/lib/env/public-env-validation";
import { isStagingAppUrl, isStagingBuildMode, STAGING_APP_URL } from "@/lib/env/medflow-domains";

export type StartupCheckResult = {
  ok: boolean;
  publicEnv: PublicEnvStatus;
  checks: { id: string; ok: boolean; label: string; detail: string }[];
};

/**
 * Checagens leves no boot SSR — sem I/O pesado.
 */
export function runStartupChecks(): StartupCheckResult {
  const publicEnv = validatePublicEnv();
  const checks: StartupCheckResult["checks"] = [
    {
      id: "supabase_public",
      ok: publicEnv.supabaseConfigured,
      label: "Supabase público (VITE_)",
      detail: publicEnv.supabaseConfigured
        ? "URL e anon key presentes."
        : "Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.",
    },
    {
      id: "env_warnings",
      ok: publicEnv.warnings.length === 0,
      label: "Sem avisos críticos de ambiente",
      detail: publicEnv.warnings.join(" · ") || "OK",
    },
    {
      id: "production_domain",
      ok:
        !publicEnv.isProductionBuild ||
        (isStagingBuildMode() ? isStagingAppUrl(getInstitutionalDomain()) : true),
      label: isStagingBuildMode() ? "Domínio staging" : "Domínio institucional (produção)",
      detail: getInstitutionalDomain()
        ? `VITE_MEDFLOW_APP_URL=${getInstitutionalDomain()}`
        : isStagingBuildMode()
          ? `Obrigatório: VITE_MEDFLOW_APP_URL=${STAGING_APP_URL}`
          : "Opcional: defina VITE_MEDFLOW_APP_URL para redirects e OG canônico.",
    },
  ];

  const criticalOk = checks.filter((c) => c.id !== "production_domain").every((c) => c.ok);
  return { ok: criticalOk, publicEnv, checks };
}

export function getInstitutionalDomain(): string | undefined {
  const raw =
    typeof import.meta !== "undefined"
      ? (import.meta.env.VITE_MEDFLOW_APP_URL as string | undefined)
      : undefined;
  const trimmed = raw?.trim();
  return trimmed || undefined;
}

export function getInstitutionalContactEmail(): string {
  const raw =
    typeof import.meta !== "undefined"
      ? (import.meta.env.VITE_MEDFLOW_CONTACT_EMAIL as string | undefined)
      : undefined;
  return raw?.trim() || "contato@medicflow.ai";
}

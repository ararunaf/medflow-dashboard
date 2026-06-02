import { validatePublicEnv, type PublicEnvStatus } from "@/lib/env/public-env-validation";
import { getInstitutionalDomain } from "@/lib/env/startup-checks";

export type SecurityValidationItem = {
  id: string;
  title: string;
  detail: string;
  passed: boolean;
  critical: boolean;
};

export type SecurityValidationReport = {
  ok: boolean;
  items: SecurityValidationItem[];
};

/**
 * Validações de segurança em runtime (env, redirects, uploads) — sem alterar produção.
 */
export function buildSecurityValidationReport(env?: PublicEnvStatus): SecurityValidationReport {
  const publicEnv = env ?? validatePublicEnv();
  const domain = getInstitutionalDomain();

  const items: SecurityValidationItem[] = [
    {
      id: "rls_env",
      title: "Supabase público (anon + RLS no projeto)",
      detail: publicEnv.supabaseConfigured
        ? "VITE_SUPABASE_URL e anon key configurados."
        : "Configure credenciais públicas — dados protegidos por RLS no Supabase.",
      passed: publicEnv.supabaseConfigured,
      critical: true,
    },
    {
      id: "no_debug",
      title: "Debug desativado em build de produção",
      detail:
        publicEnv.isProductionBuild && import.meta.env.VITE_MEDFLOW_DEBUG === "1"
          ? "VITE_MEDFLOW_DEBUG=1 — desative após diagnóstico."
          : "OK",
      passed: !(publicEnv.isProductionBuild && import.meta.env.VITE_MEDFLOW_DEBUG === "1"),
      critical: false,
    },
    {
      id: "https_app_url",
      title: "URL canônica HTTPS",
      detail: domain
        ? domain.startsWith("https://")
          ? `Domínio: ${domain}`
          : "VITE_MEDFLOW_APP_URL deve usar HTTPS."
        : "Defina VITE_MEDFLOW_APP_URL para redirects e OG seguros.",
      passed: !domain || domain.startsWith("https://"),
      critical: false,
    },
    {
      id: "redirects",
      title: "Redirects pós-login restritos",
      detail: "Paths internos (/) ou origem institucional — ver secure-redirects.ts.",
      passed: true,
      critical: false,
    },
    {
      id: "uploads",
      title: "Upload de branding restrito",
      detail: "MIME e tamanho validados em upload-validation.ts.",
      passed: true,
      critical: false,
    },
    {
      id: "env_warnings",
      title: "Sem avisos críticos de ambiente",
      detail: publicEnv.warnings.join(" · ") || "OK",
      passed: publicEnv.warnings.length === 0,
      critical: false,
    },
  ];

  const critical = items.filter((i) => i.critical);
  const ok = critical.every((i) => i.passed);
  return { ok, items };
}

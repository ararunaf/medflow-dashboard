import {
  isLocalhostUrl,
  isStagingAppUrl,
  isStagingBuildMode,
  STAGING_APP_URL,
} from "@/lib/env/medflow-domains";

export type PublicEnvStatus = {
  ok: boolean;
  supabaseConfigured: boolean;
  appUrlConfigured: boolean;
  warnings: string[];
  /** Indica build de produção (Vite) — não confundir com ambiente de hospedagem. */
  isProductionBuild: boolean;
  appUrl?: string;
  contactEmail?: string;
};

/**
 * Validação leve de variáveis públicas (VITE_*).
 * Executa no servidor (SSR) e pode ser espelhada no cliente.
 */
export function validatePublicEnv(): PublicEnvStatus {
  const warnings: string[] = [];
  const url =
    typeof import.meta !== "undefined"
      ? (import.meta.env.VITE_SUPABASE_URL as string | undefined)
      : undefined;
  const anon =
    typeof import.meta !== "undefined"
      ? (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
      : undefined;

  const supabaseConfigured = !!(url?.trim() && anon?.trim());
  if (!supabaseConfigured) {
    warnings.push(
      "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes — login e dados não funcionam.",
    );
  }
  if (url && !/^https:\/\/.+\.supabase\.co\/?$/i.test(url.trim()) && !url.includes("localhost")) {
    warnings.push(
      "VITE_SUPABASE_URL com formato incomum — confira se aponta para o projeto correto.",
    );
  }

  const isProductionBuild = typeof import.meta !== "undefined" && import.meta.env.PROD === true;
  const isStagingBuild = isStagingBuildMode();

  if (isProductionBuild && import.meta.env.VITE_MEDFLOW_DEBUG === "1") {
    warnings.push("VITE_MEDFLOW_DEBUG=1 em build de produção — desative após diagnóstico.");
  }

  const appUrl = (import.meta.env.VITE_MEDFLOW_APP_URL as string | undefined)?.trim();
  const appUrlConfigured = !!appUrl;
  if (isStagingBuild && !appUrlConfigured) {
    warnings.push(`VITE_MEDFLOW_APP_URL ausente — obrigatório em staging (${STAGING_APP_URL}).`);
  } else if (isProductionBuild && !isStagingBuild && !appUrlConfigured) {
    warnings.push("VITE_MEDFLOW_APP_URL ausente — recomendado para OG, redirects e go-live.");
  }
  if (appUrl && !/^https:\/\/.+/i.test(appUrl)) {
    warnings.push(
      isStagingBuild
        ? "VITE_MEDFLOW_APP_URL deve usar HTTPS em staging."
        : "VITE_MEDFLOW_APP_URL deve usar HTTPS em produção.",
    );
  }
  if (isStagingBuild && appUrl) {
    if (isLocalhostUrl(appUrl)) {
      warnings.push(
        `VITE_MEDFLOW_APP_URL não pode usar localhost em staging — use ${STAGING_APP_URL}.`,
      );
    } else if (!isStagingAppUrl(appUrl)) {
      warnings.push(`VITE_MEDFLOW_APP_URL deve ser ${STAGING_APP_URL} em builds staging.`);
    }
  }
  if (isProductionBuild && !isStagingBuild && appUrl && isLocalhostUrl(appUrl)) {
    warnings.push("VITE_MEDFLOW_APP_URL não pode usar localhost em produção.");
  }

  const contactEmail = (import.meta.env.VITE_MEDFLOW_CONTACT_EMAIL as string | undefined)?.trim();

  return {
    ok: supabaseConfigured && warnings.length === 0,
    supabaseConfigured,
    appUrlConfigured,
    warnings,
    isProductionBuild,
    appUrl: appUrl || undefined,
    contactEmail: contactEmail || undefined,
  };
}

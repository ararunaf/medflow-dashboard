import {
  isLocalhostUrl,
  isStagingAppUrl,
  STAGING_APP_URL,
} from "./staging-domain.mjs";

const REQUIRED = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];
const RECOMMENDED_PROD = ["VITE_MEDFLOW_APP_URL"];
const REQUIRED_STAGING = ["VITE_MEDFLOW_APP_URL"];

/**
 * Validação de variáveis para CI e pré-deploy (Node — espelha public-env-validation).
 */
export function validateEnv({ production = false, staging = false } = {}) {
  const warnings = [];
  const errors = [];

  for (const key of REQUIRED) {
    const value = process.env[key]?.trim();
    if (!value) {
      errors.push(`${key} ausente — login e dados não funcionam.`);
    }
  }

  const url = process.env.VITE_SUPABASE_URL?.trim();
  if (url && !/^https:\/\/.+\.supabase\.co\/?$/i.test(url) && !url.includes("localhost")) {
    warnings.push("VITE_SUPABASE_URL com formato incomum — confira o projeto Supabase.");
  }

  if (production || staging) {
    const urlKeys = staging ? REQUIRED_STAGING : RECOMMENDED_PROD;
    for (const key of urlKeys) {
      if (!process.env[key]?.trim()) {
        const ctx = staging ? "staging" : "produção";
        const msg = `${key} ausente — obrigatório para OG, redirects e Auth (${ctx}).`;
        if (staging) errors.push(msg);
        else warnings.push(msg.replace("obrigatório", "recomendado"));
      }
    }
    const appUrl = process.env.VITE_MEDFLOW_APP_URL?.trim();
    if (appUrl && !/^https:\/\/.+/i.test(appUrl)) {
      const msg = staging
        ? "VITE_MEDFLOW_APP_URL deve usar HTTPS em staging."
        : "VITE_MEDFLOW_APP_URL deve usar HTTPS em produção.";
      if (staging) errors.push(msg);
      else warnings.push(msg);
    }
    if (staging && appUrl) {
      if (isLocalhostUrl(appUrl)) {
        errors.push(
          "VITE_MEDFLOW_APP_URL não pode usar localhost em staging — use " + STAGING_APP_URL,
        );
      } else if (!isStagingAppUrl(appUrl)) {
        errors.push(
          `VITE_MEDFLOW_APP_URL deve apontar para ${STAGING_APP_URL} (recebido: ${appUrl}).`,
        );
      }
    }
    if (production && !staging && appUrl && isLocalhostUrl(appUrl)) {
      errors.push("VITE_MEDFLOW_APP_URL não pode usar localhost em produção.");
    }
    if (process.env.VITE_MEDFLOW_DEBUG === "1") {
      warnings.push("VITE_MEDFLOW_DEBUG=1 — desative antes do go-live.");
    }
    const placeholderPattern = /YOUR_|your_|placeholder|example\.com/i;
    for (const key of REQUIRED) {
      const value = process.env[key]?.trim();
      if (value && placeholderPattern.test(value)) {
        errors.push(`${key} ainda contém placeholder — substitua antes do deploy.`);
      }
    }
  }

  if (process.env.VITE_SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    errors.push(
      "VITE_SUPABASE_SERVICE_ROLE_KEY detectada — nunca use service role com prefixo VITE_.",
    );
  }
  if (process.env.VITE_MEDFLOW_OPENAI_API_KEY?.trim()) {
    errors.push("Chave OpenAI com prefixo VITE_ — use MEDFLOW_OPENAI_API_KEY no servidor.");
  }

  const ok = errors.length === 0;
  return { ok, production, errors, warnings };
}

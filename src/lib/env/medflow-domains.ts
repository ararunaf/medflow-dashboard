/** Domínio canônico do ambiente staging (alinhado a scripts/lib/staging-domain.mjs). */
export const STAGING_APP_HOST = "staging.medicflow.app.br";
export const STAGING_APP_URL = `https://${STAGING_APP_HOST}`;

const LOCALHOST_PATTERN = /localhost|127\.0\.0\.1/i;

export function isLocalhostUrl(url: string | undefined): boolean {
  return LOCALHOST_PATTERN.test(url ?? "");
}

export function isStagingAppUrl(url: string | undefined): boolean {
  const trimmed = url?.trim();
  if (!trimmed) return false;
  try {
    return new URL(trimmed).hostname.toLowerCase() === STAGING_APP_HOST;
  } catch {
    return false;
  }
}

export function isStagingBuildMode(): boolean {
  return typeof import.meta !== "undefined" && import.meta.env.MODE === "staging";
}

/** Domínio canônico do ambiente staging (deploy + Supabase Auth). */
export const STAGING_APP_HOST = "staging.medicflow.app.br";
export const STAGING_APP_URL = `https://${STAGING_APP_HOST}`;

const LOCALHOST_PATTERN = /localhost|127\.0\.0\.1/i;

export function isLocalhostUrl(url) {
  return LOCALHOST_PATTERN.test(String(url ?? ""));
}

export function isStagingAppUrl(url) {
  const trimmed = String(url ?? "").trim();
  if (!trimmed) return false;
  try {
    const host = new URL(trimmed).hostname.toLowerCase();
    return host === STAGING_APP_HOST;
  } catch {
    return false;
  }
}

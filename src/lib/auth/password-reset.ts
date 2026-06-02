import { getInstitutionalDomain } from "@/lib/env/startup-checks";

/** URL de retorno após o clique no e-mail de recuperação (Supabase Auth). */
export function getPasswordResetRedirectUrl(): string {
  const configured = getInstitutionalDomain()?.replace(/\/$/, "");
  const base =
    configured ??
    (typeof window !== "undefined" ? window.location.origin.replace(/\/$/, "") : "");
  return `${base}/login/redefinir-senha`;
}

import { getBrowserSupabase } from "@/lib/supabase/browser";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type { AppErrorKind } from "./types";

let redirectInFlight = false;

/**
 * Encerra sessão local e redireciona para login com motivo na query string.
 * Idempotente — evita loops quando várias queries falham em paralelo.
 */
export async function redirectToLoginWithReason(
  reason: Extract<AppErrorKind, "session_expired" | "invalid_token"> = "session_expired",
): Promise<void> {
  if (typeof window === "undefined") return;
  if (redirectInFlight) return;

  const path = window.location.pathname;
  if (path === "/login" || path.startsWith("/login/") || path.startsWith("/site")) return;

  redirectInFlight = true;
  try {
    if (getSupabasePublicConfig()) {
      const supabase = getBrowserSupabase();
      await supabase.auth.signOut({ scope: "local" });
    }
    const target = `/login?reason=${encodeURIComponent(reason)}`;
    window.location.assign(target);
  } finally {
    redirectInFlight = false;
  }
}

export function parseLoginReason(
  search: string | Record<string, unknown> | undefined,
): AppErrorKind | null {
  if (!search) return null;
  const raw =
    typeof search === "string"
      ? new URLSearchParams(search).get("reason")
      : typeof search.reason === "string"
        ? search.reason
        : null;
  if (raw === "session_expired" || raw === "invalid_token") return raw;
  return null;
}

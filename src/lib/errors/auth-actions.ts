import { getBrowserSupabase } from "@/lib/supabase/browser";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type { AppErrorKind } from "./types";

let redirectInFlight = false;

const RECOVERY_GUARD_KEY = "medflow_auth_recovery_at";
const RECOVERY_GUARD_WINDOW_MS = 60_000;

function recoveryRecentlyAttempted(): boolean {
  try {
    const raw = sessionStorage.getItem(RECOVERY_GUARD_KEY);
    return raw !== null && Date.now() - Number(raw) < RECOVERY_GUARD_WINDOW_MS;
  } catch {
    return true; // sem sessionStorage não há como evitar laço — não tenta recuperar
  }
}

/**
 * Uma única chamada ao servidor pode voltar "sem sessão" mesmo com o usuário
 * logado (requisição que saiu antes do login concluir, cookie ainda não
 * sincronizado, outra aba renovando o token). Derrubar a sessão nesse caso
 * mandava o usuário de volta ao login logo depois de entrar. Antes de
 * deslogar, confirma com o Supabase: se a sessão do navegador ainda renova,
 * regrava os cookies e recarrega a página uma vez (guarda de 60s contra laço).
 */
async function tryRecoverSession(): Promise<boolean> {
  if (recoveryRecentlyAttempted()) return false;
  try {
    const supabase = getBrowserSupabase();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return false;
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) return false;
    sessionStorage.setItem(RECOVERY_GUARD_KEY, String(Date.now()));
    return true;
  } catch {
    return false;
  }
}

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
      if (await tryRecoverSession()) {
        window.location.reload();
        return;
      }
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

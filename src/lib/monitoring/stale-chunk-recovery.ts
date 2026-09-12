const RELOAD_GUARD_KEY = "medflow_stale_chunk_reload_at";
const RELOAD_GUARD_WINDOW_MS = 15_000;

function recentlyReloaded(): boolean {
  try {
    const raw = sessionStorage.getItem(RELOAD_GUARD_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < RELOAD_GUARD_WINDOW_MS;
  } catch {
    return false;
  }
}

function markReloaded(): void {
  try {
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
  } catch {
    // sessionStorage indisponível (ex.: modo privado) — segue sem guarda de repetição
  }
}

/**
 * Depois de um deploy, uma aba já aberta ainda referencia chunks JS com hash
 * antigo. O Vite dispara `vite:preloadError` quando um import dinâmico desses
 * falha (ex.: ao navegar para "/" logo após o login) — isso derrubava a tela
 * para branco sem nenhum erro visível na UI. Recarrega uma vez para buscar o
 * HTML/assets atuais; a guarda por sessionStorage evita loop caso o reload
 * em si também falhe (ex.: rede fora do ar).
 */
export function initStaleChunkRecovery(): void {
  if (typeof window === "undefined") return;
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    if (recentlyReloaded()) return;
    markReloaded();
    window.location.reload();
  });
}

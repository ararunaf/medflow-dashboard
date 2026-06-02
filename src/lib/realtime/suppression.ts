/**
 * Self-suppression de eventos realtime gerados pelas próprias mutations
 * do usuário.
 *
 * Por que existir?
 *  Quando o profissional aceita um plantão, a UI já mostra um toast
 *  "Plantão confirmado" via `onSuccess` da mutation. Logo em seguida,
 *  o Supabase Realtime entrega um `UPDATE` em `shift_assignments` e o
 *  hook global re-emitiria a mesma notificação, dando sensação de
 *  duplicidade.
 *
 * Estratégia:
 *  - antes de chamar a mutation, marcamos `(tabela, id)` com TTL curto;
 *  - o handler realtime consulta `isSuppressed(tabela, id)` e, se
 *    estiver marcado, ainda invalida as queries, mas NÃO dispara toast;
 *  - marcas expiram sozinhas para evitar memory leaks.
 *
 * Isso preserva: invalidation correta + UX limpa para o próprio autor.
 */
import type { RealtimeOpsTable } from "./types";

const DEFAULT_TTL_MS = 4000;

const marks = new Map<string, number>(); // key -> expiresAt (ms epoch)

function makeKey(table: RealtimeOpsTable, id: string): string {
  return `${table}::${id}`;
}

function prune(now: number) {
  if (marks.size === 0) return;
  for (const [k, exp] of marks) {
    if (exp <= now) marks.delete(k);
  }
}

/**
 * Marca `(tabela, id)` como “evento esperado pelo próprio usuário”.
 * Retorna função para limpar manualmente (raramente necessária — o TTL
 * já cuida do cleanup).
 */
export function suppressOnce(
  table: RealtimeOpsTable,
  id: string | null | undefined,
  ttlMs: number = DEFAULT_TTL_MS,
): () => void {
  if (!id) return () => {};
  const now = Date.now();
  prune(now);
  const key = makeKey(table, id);
  marks.set(key, now + ttlMs);
  return () => {
    marks.delete(key);
  };
}

export function isSuppressed(table: RealtimeOpsTable, id: string | null | undefined): boolean {
  if (!id) return false;
  const now = Date.now();
  prune(now);
  const exp = marks.get(makeKey(table, id));
  if (!exp) return false;
  if (exp <= now) {
    marks.delete(makeKey(table, id));
    return false;
  }
  return true;
}

/** Limpa todas as marcas. Chamado em logout / teardown. */
export function clearSuppressions(): void {
  marks.clear();
}

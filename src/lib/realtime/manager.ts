/**
 * Realtime Manager — singleton client-side do MedFlow-IA.
 *
 * Centraliza todas as subscriptions ao Supabase Realtime, garantindo:
 *
 *  - **Refcount por canal**: vários consumidores podem assinar a mesma
 *    `(tabela, filtro, evento)` sem criar conexões duplicadas. O canal
 *    só é destruído quando o refcount cai para zero.
 *  - **Status observável**: derivado das callbacks de `subscribe()` do
 *    Supabase, exposto via `onStatusChange()`. Útil para badges de
 *    “operação viva / reconectando”.
 *  - **Reconexão suave**: o supabase-js já mantém o websocket vivo;
 *    quando a aba volta ao foco ou a conexão retorna, expomos um
 *    listener para invalidação “catch-up” no nível do hook.
 *  - **Cleanup seguro**: nunca chama `removeChannel` em SSR e tolera
 *    falhas silenciosamente para não derrubar a árvore React.
 *
 * Este módulo nunca importa nada de TanStack Query — quem traduz
 * eventos em `invalidateQueries`/toasts é o `useOperationalRealtime`.
 */
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type {
  ChangeEvent,
  ChangeEventType,
  RealtimeOpsTable,
  RealtimeStatus,
  RowFor,
  SubscribeOptions,
  Unsubscribe,
} from "./types";

type Handler<T extends RealtimeOpsTable> = (event: ChangeEvent<T>) => void;

type ChannelEntry = {
  key: string;
  table: RealtimeOpsTable;
  channel: RealtimeChannel;
  handlers: Set<Handler<RealtimeOpsTable>>;
  refcount: number;
  status: RealtimeStatus;
};

const entries = new Map<string, ChannelEntry>();
const statusListeners = new Set<(status: RealtimeStatus) => void>();
const reconnectListeners = new Set<() => void>();

let globalStatus: RealtimeStatus = "idle";
let visibilityWired = false;
let lastReconnectAt = 0;

function keyOf<T extends RealtimeOpsTable>(opts: SubscribeOptions<T>): string {
  return `${opts.table}|${opts.event ?? "*"}|${opts.filter ?? ""}`;
}

function emitGlobalStatus(next: RealtimeStatus) {
  if (next === globalStatus) return;
  globalStatus = next;
  for (const l of statusListeners) {
    try {
      l(next);
    } catch {
      // ignore
    }
  }
}

function recomputeGlobalStatus() {
  if (entries.size === 0) {
    emitGlobalStatus("idle");
    return;
  }
  const statuses = Array.from(entries.values()).map((e) => e.status);
  if (statuses.some((s) => s === "open")) {
    emitGlobalStatus("open");
    return;
  }
  if (statuses.some((s) => s === "error")) {
    emitGlobalStatus("error");
    return;
  }
  if (statuses.some((s) => s === "connecting")) {
    emitGlobalStatus("connecting");
    return;
  }
  emitGlobalStatus("closed");
}

function mapPayload<T extends RealtimeOpsTable>(
  table: T,
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
): ChangeEvent<T> {
  const eventType = (payload.eventType ?? "UPDATE") as ChangeEventType;
  const newRow =
    payload.new && typeof payload.new === "object" && Object.keys(payload.new).length > 0
      ? (payload.new as unknown as RowFor<T>)
      : null;
  const oldRow =
    payload.old && typeof payload.old === "object" && Object.keys(payload.old).length > 0
      ? (payload.old as unknown as RowFor<T>)
      : null;
  return {
    table,
    eventType,
    newRow,
    oldRow,
    commitTimestamp: payload.commit_timestamp ?? new Date().toISOString(),
  };
}

function wireVisibilityOnce() {
  if (visibilityWired || typeof window === "undefined") return;
  visibilityWired = true;

  const trigger = () => {
    // Debounce: evita disparar vários reconnects em sequência.
    const now = Date.now();
    if (now - lastReconnectAt < 1500) return;
    lastReconnectAt = now;
    for (const l of reconnectListeners) {
      try {
        l();
      } catch {
        // ignore
      }
    }
  };

  window.addEventListener("online", trigger);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") trigger();
  });
}

/**
 * Subscreve a `(tabela, filtro, evento)` e devolve um `Unsubscribe`.
 *
 * Em SSR ou quando o Supabase não está configurado, retorna um
 * unsubscribe no-op — chamadas podem permanecer no código sem causar
 * efeitos colaterais durante o build / hidratação.
 */
export function subscribe<T extends RealtimeOpsTable>(
  opts: SubscribeOptions<T>,
  handler: Handler<T>,
): Unsubscribe {
  if (typeof window === "undefined" || !getSupabasePublicConfig()) {
    return () => {};
  }

  wireVisibilityOnce();

  const key = keyOf(opts);
  let entry = entries.get(key) as ChannelEntry | undefined;

  if (!entry) {
    const supabase = getBrowserSupabase();
    const channel = supabase.channel(`mf:${key}`);
    const handlers = new Set<Handler<RealtimeOpsTable>>();

    const created: ChannelEntry = {
      key,
      table: opts.table,
      channel,
      handlers,
      refcount: 0,
      status: "connecting",
    };
    entries.set(key, created);
    entry = created;

    channel.on(
      "postgres_changes",
      {
        event: opts.event ?? "*",
        schema: "public",
        table: opts.table,
        ...(opts.filter ? { filter: opts.filter } : {}),
      },
      (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        const evt = mapPayload(opts.table, payload);
        for (const h of created.handlers) {
          try {
            (h as Handler<T>)(evt);
          } catch (err) {
            // Nunca derruba a fila por erro de um único handler.
            console.error("[realtime] handler error", err);
          }
        }
      },
    );

    channel.subscribe((status) => {
      switch (status) {
        case "SUBSCRIBED":
          created.status = "open";
          break;
        case "CHANNEL_ERROR":
          created.status = "error";
          break;
        case "TIMED_OUT":
          created.status = "error";
          break;
        case "CLOSED":
          created.status = "closed";
          break;
        default:
          created.status = "connecting";
      }
      recomputeGlobalStatus();
    });

    recomputeGlobalStatus();
  }

  entry.handlers.add(handler as Handler<RealtimeOpsTable>);
  entry.refcount += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    const current = entries.get(key);
    if (!current) return;
    current.handlers.delete(handler as Handler<RealtimeOpsTable>);
    current.refcount -= 1;
    if (current.refcount <= 0) {
      try {
        getBrowserSupabase().removeChannel(current.channel);
      } catch {
        // ignore
      }
      entries.delete(key);
      recomputeGlobalStatus();
    }
  };
}

/** Snapshot do status agregado (mais alto = melhor). */
export function getRealtimeStatus(): RealtimeStatus {
  return globalStatus;
}

/** Observador do status agregado — útil para badges/health pills. */
export function onRealtimeStatusChange(listener: (status: RealtimeStatus) => void): Unsubscribe {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

/**
 * Observador “acabou de reconectar”: disparado em `online` e em
 * `visibilitychange → visible`. Hooks operacionais escutam isso para
 * fazer um `invalidateQueries` de catch-up após o usuário voltar.
 */
export function onRealtimeReconnect(listener: () => void): Unsubscribe {
  reconnectListeners.add(listener);
  return () => {
    reconnectListeners.delete(listener);
  };
}

/**
 * Encerra todos os canais ativos. Chamado no logout para garantir que
 * a próxima sessão comece limpa.
 */
export function teardownAllRealtime(): void {
  if (typeof window === "undefined") return;
  if (entries.size === 0) {
    recomputeGlobalStatus();
    return;
  }
  for (const e of entries.values()) {
    try {
      getBrowserSupabase().removeChannel(e.channel);
    } catch {
      // ignore
    }
  }
  entries.clear();
  recomputeGlobalStatus();
}

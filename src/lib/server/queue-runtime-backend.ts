/**
 * Server-only binder — ativa QueueRuntime backend Supabase (OPER-INF-Q).
 *
 * Usa service role. Não é Port. Não altera Enterprise Runtime.
 * Arquivo sob `src/lib/server/` — bloqueado no client via importProtection.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminSupabase } from "@/lib/server/supabase-admin";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import {
  createQueueRuntimeBackend,
  injectQueueRuntimeBackend,
  SupabaseQueueRuntimeBackend,
  type QueueRuntimePersistenceBackend,
} from "@/lib/enterprise/queue-runtime/backend";

/**
 * Cria o backend preferindo Supabase admin quando disponível.
 */
export function createServerQueueRuntimeBackend(): QueueRuntimePersistenceBackend {
  const cfg = getSupabasePublicConfig();
  const admin = getAdminSupabase() as SupabaseClient | null;
  if (cfg && admin) {
    return new SupabaseQueueRuntimeBackend({
      client: admin,
      isConfigured: () => true,
    });
  }
  return createQueueRuntimeBackend({ preferMemory: true });
}

/**
 * Injeta o backend Supabase (ou memory fallback) no registry do Queue Runtime.
 * Idempotente — seguro chamar no bootstrap do worker.
 */
export function bindServerQueueRuntimeBackend(): QueueRuntimePersistenceBackend {
  const backend = createServerQueueRuntimeBackend();
  injectQueueRuntimeBackend(backend);
  return backend;
}

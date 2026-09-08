/**
 * Server-only binder — ativa QueueRuntime backend Supabase (OPER-INF-Q).
 *
 * Usa service role. Não é Port. Não altera Enterprise Runtime.
 * Arquivo sob `src/lib/server/` — bloqueado no client via importProtection.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminSupabase } from "@/lib/server/supabase-admin";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { validatePublicEnv } from "@/lib/env/public-env-validation";
import {
  createQueueRuntimeBackend,
  injectQueueRuntimeBackend,
  SupabaseQueueRuntimeBackend,
  type QueueRuntimePersistenceBackend,
} from "@/lib/enterprise/queue-runtime/backend";

export class QueueRuntimeProductionMisconfiguredError extends Error {
  constructor() {
    super(
      "Queue Runtime: backend persistente Supabase indisponível em build de produção/staging " +
        "(config pública VITE_SUPABASE_* ou admin client ausente) — boot bloqueado (fail-closed) " +
        "em vez de degradar silenciosamente para memória. Para permitir memory explicitamente " +
        "(ex.: ambiente efêmero controlado), defina MEDICFLOW_QUEUE_RUNTIME_BACKEND=memory.",
    );
    this.name = "QueueRuntimeProductionMisconfiguredError";
  }
}

/**
 * Lê o override explícito (mesma env var já usada por createQueueRuntimeBackend()
 * para o mesmo propósito). Só depende de process.env — testável fora do Vite.
 */
export function isExplicitMemoryOverride(env: NodeJS.ProcessEnv = process.env): boolean {
  return (env.MEDICFLOW_QUEUE_RUNTIME_BACKEND ?? "").trim().toLowerCase() === "memory";
}

/**
 * Decisão pura de fail-closed — extraída para ser testável sem depender de
 * import.meta.env (só existe dentro do bundle Vite; sob o test runner tsx
 * deste projeto, import.meta.env é undefined).
 */
export function shouldFailClosedForMemoryQueue(input: {
  isProductionBuild: boolean;
  explicitMemoryOverride: boolean;
}): boolean {
  return input.isProductionBuild && !input.explicitMemoryOverride;
}

/**
 * Cria o backend preferindo Supabase admin quando disponível.
 *
 * Fail-closed em build de produção/staging: sem config Supabase válida, o
 * boot falha em vez de cair silenciosamente para memory (Queue deixaria de
 * ser durável sem nenhum sinal disso). Memory só é permitido sem Supabase
 * fora de build de produção (dev local) ou via override explícito
 * MEDICFLOW_QUEUE_RUNTIME_BACKEND=memory.
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

  const failClosed = shouldFailClosedForMemoryQueue({
    isProductionBuild: validatePublicEnv().isProductionBuild,
    explicitMemoryOverride: isExplicitMemoryOverride(),
  });
  if (failClosed) {
    throw new QueueRuntimeProductionMisconfiguredError();
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

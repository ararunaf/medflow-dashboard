/**
 * Factory do backend persistente do Queue Runtime (OPER-INF-Q).
 *
 * Preferência operacional:
 * 1. Backend injetado no server (Supabase via registry)
 * 2. Cliente Supabase passado em options
 * 3. Memory durable (sempre disponível)
 *
 * Não importa `@/lib/server/*` (fronteira client/server preservada).
 */
import { MemoryQueueRuntimeBackend } from "./memory-queue-runtime-backend";
import { getInjectedQueueRuntimeBackend } from "./queue-runtime-backend-registry";
import type { QueueRuntimePersistenceBackend } from "./queue-runtime-persistence-backend";
import {
  SupabaseQueueRuntimeBackend,
  type SupabaseQueueRuntimeBackendOptions,
} from "./supabase-queue-runtime-backend";

export type CreateQueueRuntimeBackendOptions = {
  /** Força backend memory (testes). */
  preferMemory?: boolean;
  /** Cliente Supabase (service role) para backend nativo. */
  supabase?: SupabaseQueueRuntimeBackendOptions;
};

function resolveBackendMode(): "supabase" | "memory" | "auto" {
  const raw =
    (typeof process !== "undefined" && process.env?.MEDICFLOW_QUEUE_RUNTIME_BACKEND) || "";
  const normalized = raw.trim().toLowerCase();
  if (normalized === "supabase") return "supabase";
  if (normalized === "memory") return "memory";
  return "auto";
}

/**
 * Resolve o backend operacional padrão do QueueRuntimePort.
 */
export function createQueueRuntimeBackend(
  options: CreateQueueRuntimeBackendOptions = {},
): QueueRuntimePersistenceBackend {
  if (options.preferMemory) {
    return new MemoryQueueRuntimeBackend();
  }

  const mode = resolveBackendMode();
  if (mode === "memory") {
    return new MemoryQueueRuntimeBackend();
  }

  const injected = getInjectedQueueRuntimeBackend();
  if (injected) {
    return injected;
  }

  const supabaseOpts = options.supabase;
  if (supabaseOpts?.client) {
    return new SupabaseQueueRuntimeBackend(supabaseOpts);
  }

  return new MemoryQueueRuntimeBackend();
}

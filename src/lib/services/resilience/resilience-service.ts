import {
  OPERATIONAL_JSON_METADATA_MAX_BYTES,
  OPERATIONAL_MESSAGE_MAX_CHARS,
  OPERATIONAL_STACK_SNIPPET_MAX_CHARS,
} from "@/lib/operational/constants";
import type { Json } from "@/lib/database.types";

export type RetryOptions = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
};

const DEFAULT_RETRY: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 200,
  maxDelayMs: 2_000,
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Retry com backoff exponencial e teto — evita loops longos.
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  opts: Partial<RetryOptions> = {},
): Promise<T> {
  const { maxAttempts, baseDelayMs, maxDelayMs } = { ...DEFAULT_RETRY, ...opts };
  let last: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (e) {
      last = e;
      if (attempt === maxAttempts) break;
      const exp = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      await sleep(exp);
    }
  }
  throw last instanceof Error ? last : new Error(String(last));
}

export function clampMessage(s: string, max = OPERATIONAL_MESSAGE_MAX_CHARS): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function clampStackSnippet(s: string | undefined): string | null {
  if (!s) return null;
  const t = s.trim();
  if (t.length <= OPERATIONAL_STACK_SNIPPET_MAX_CHARS) return t;
  return `${t.slice(0, OPERATIONAL_STACK_SNIPPET_MAX_CHARS - 1)}…`;
}

/** Reduz metadata JSON para caber no limite do Postgres sem serializar logs gigantes. */
export function clampJsonMetadata(meta: Record<string, unknown>): Json {
  const json = JSON.stringify(meta);
  if (json.length <= OPERATIONAL_JSON_METADATA_MAX_BYTES) return meta as Json;
  return {
    _truncated: true,
    _originalBytes: json.length,
    preview: json.slice(0, Math.max(0, OPERATIONAL_JSON_METADATA_MAX_BYTES - 120)),
  } as Json;
}

export type IdempotencyGuard = {
  tryAcquire: (key: string) => boolean;
  release: (key: string) => void;
};

/** Evita cliques duplicados em mutações críticas (mesma chave até release). */
export function createIdempotencyGuard(): IdempotencyGuard {
  const inflight = new Set<string>();
  return {
    tryAcquire(key: string) {
      if (inflight.has(key)) return false;
      inflight.add(key);
      return true;
    },
    release(key: string) {
      inflight.delete(key);
    },
  };
}

/**
 * Tipos da Retry Infrastructure operacional (OPER-INF-R).
 *
 * NÃO é Port Enterprise. NÃO é Gateway. NÃO é Runtime paralelo.
 * Reutiliza exclusivamente:
 *   SchedulerRuntimePort (tempo)
 *   WorkerRuntimePort (executor — acionado pelo Scheduler)
 *   QueueRuntimePort (transporte)
 *
 * Retry nunca executa processamento — apenas decide e agenda nova tentativa.
 * Dead Letter permanece destino definitivo após exceder maxAttempts.
 */

export type RetryStatus = "scheduled" | "exhausted" | "cancelled";

export type RetryMetadata = Readonly<Record<string, string | number | boolean | null | undefined>>;

/** Política operacional de reenvio (sem regra de negócio TISS). */
export type RetryPolicy = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
};

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  baseDelayMs: 50,
  maxDelayMs: 5_000,
};

/**
 * Registro operacional de retry (decisão + agendamento).
 * Sem payload de domínio — apenas metadata estrutural.
 */
export type RetryRecord = {
  kind: "canonical-retry-record";
  retryId: string;
  sourceMessageId: string;
  requeuedMessageId?: string;
  sourceQueueId?: string;
  sourceQueueName?: string;
  attemptCount: number;
  maxAttempts: number;
  delayMs: number;
  status: RetryStatus;
  failureReason: string;
  scheduledAt: string;
  nextAttemptAt: string;
  scheduleId?: string;
  jobId?: string;
  metadata: RetryMetadata;
  payloadRef?: string;
  correlationId?: string | null;
};

export type RetryDecideInput = {
  retryId?: string;
  sourceMessageId: string;
  sourceQueueId?: string;
  sourceQueueName?: string;
  /** Tentativas já ocorridas (inclui a falha atual). */
  attemptCount?: number;
  failureReason?: string;
  policy?: Partial<RetryPolicy>;
  metadata?: RetryMetadata;
  payloadRef?: string;
  correlationId?: string | null;
  workerName?: string;
  scheduleName?: string;
};

export type RetryDecision = "retry-scheduled" | "dead-letter" | "rejected";

export type RetryDecideResult = {
  ok: boolean;
  decision: RetryDecision;
  record?: RetryRecord;
  code?: string;
  message?: string;
};

export type RetryGetByIdInput = {
  retryId: string;
};

export type RetryGetByIdResult = {
  ok: boolean;
  record?: RetryRecord;
  code?: string;
  message?: string;
};

export type RetryStatsResult = {
  ok: boolean;
  totalRetries: number;
  scheduledRetries: number;
  exhaustedRetries: number;
  code?: string;
  message?: string;
};

/**
 * Calcula delay com exponential backoff:
 *   delay = min(maxDelayMs, baseDelayMs * 2^(attemptCount - 1))
 */
export function computeExponentialBackoffDelayMs(
  attemptCount: number,
  policy: RetryPolicy,
): number {
  const attempt = Math.max(1, Math.floor(attemptCount));
  const raw = policy.baseDelayMs * 2 ** (attempt - 1);
  if (!Number.isFinite(raw) || raw < 0) return policy.baseDelayMs;
  return Math.min(policy.maxDelayMs, Math.floor(raw));
}

export function resolveRetryPolicy(partial?: Partial<RetryPolicy>): RetryPolicy {
  const maxAttempts =
    typeof partial?.maxAttempts === "number" &&
    Number.isFinite(partial.maxAttempts) &&
    partial.maxAttempts >= 1
      ? Math.floor(partial.maxAttempts)
      : DEFAULT_RETRY_POLICY.maxAttempts;
  const baseDelayMs =
    typeof partial?.baseDelayMs === "number" &&
    Number.isFinite(partial.baseDelayMs) &&
    partial.baseDelayMs >= 0
      ? Math.floor(partial.baseDelayMs)
      : DEFAULT_RETRY_POLICY.baseDelayMs;
  const maxDelayMs =
    typeof partial?.maxDelayMs === "number" &&
    Number.isFinite(partial.maxDelayMs) &&
    partial.maxDelayMs >= baseDelayMs
      ? Math.floor(partial.maxDelayMs)
      : Math.max(DEFAULT_RETRY_POLICY.maxDelayMs, baseDelayMs);
  return { maxAttempts, baseDelayMs, maxDelayMs };
}

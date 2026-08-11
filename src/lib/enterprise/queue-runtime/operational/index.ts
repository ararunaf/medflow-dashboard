/**
 * OPER-INF-D / OPER-INF-R — motores operacionais internos do Queue Runtime.
 *
 * DeadLetterRuntimePort é contrato INTERNO — não é Port Enterprise novo.
 * DefaultRetryInfrastructure NÃO é Port — reutiliza Scheduler/Worker/Queue Ports.
 *
 * Dead Letter: armazenamento definitivo via QueueRuntimePort.
 * Retry: decisão de reenvio + agendamento (nunca executa processamento).
 */
export type {
  DeadLetterGetByIdInput,
  DeadLetterGetByIdResult,
  DeadLetterMetadata,
  DeadLetterParkInput,
  DeadLetterParkResult,
  DeadLetterPurgeInput,
  DeadLetterPurgeResult,
  DeadLetterRecord,
  DeadLetterStatsResult,
} from "./dead-letter-types";

export { ENTERPRISE_DEAD_LETTER_QUEUE_NAME } from "./dead-letter-types";

export type { DeadLetterRuntimePort } from "./dead-letter-runtime-port";

export {
  IN_MEMORY_DEAD_LETTER_STORE_ID,
  InMemoryDeadLetterStore,
} from "./in-memory-dead-letter-store";

export {
  DefaultDeadLetterRuntime,
  createDeadLetterId,
  resetDeadLetterIdSequences,
  type DefaultDeadLetterRuntimeOptions,
} from "./default-dead-letter-runtime";

export type {
  RetryDecideInput,
  RetryDecideResult,
  RetryDecision,
  RetryGetByIdInput,
  RetryGetByIdResult,
  RetryMetadata,
  RetryPolicy,
  RetryRecord,
  RetryStatsResult,
  RetryStatus,
} from "./retry-types";

export {
  DEFAULT_RETRY_POLICY,
  computeExponentialBackoffDelayMs,
  resolveRetryPolicy,
} from "./retry-types";

export { IN_MEMORY_RETRY_STORE_ID, InMemoryRetryStore } from "./in-memory-retry-store";

export {
  DefaultRetryInfrastructure,
  createRetryId,
  resetRetryIdSequences,
  type DefaultRetryInfrastructureOptions,
} from "./default-retry-infrastructure";

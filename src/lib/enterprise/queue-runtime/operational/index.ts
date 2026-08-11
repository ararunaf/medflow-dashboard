/**
 * OPER-INF-D — motor operacional interno do Dead Letter Runtime.
 *
 * DeadLetterRuntimePort é contrato INTERNO — não é Port Enterprise novo.
 * Consome exclusivamente QueueRuntimePort para isolamento da fila principal.
 * Sem retry. Sem reprocessamento. Sem scheduler. Sem worker.
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

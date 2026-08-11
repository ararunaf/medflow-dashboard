/**
 * Tipos do Dead Letter operacional (OPER-INF-D).
 *
 * DeadLetterRuntimePort é contrato INTERNO do Queue Runtime —
 * NÃO é Port Enterprise novo. NÃO é Gateway. NÃO registra em getEnterpriseRuntime().
 * Sem retry. Sem reprocessamento. Sem scheduler. Sem worker. Sem regras de negócio.
 */

/** Fila isolada de dead letters (nunca confundida com a fila principal). */
export const ENTERPRISE_DEAD_LETTER_QUEUE_NAME = "enterprise-dead-letter";

export type DeadLetterMetadata = Readonly<
  Record<string, string | number | boolean | null | undefined>
>;

/**
 * Registro definitivo de mensagem morta (falha permanente).
 * A DLQ NÃO decide reenvio — apenas armazena.
 */
export type DeadLetterRecord = {
  kind: "canonical-dead-letter-record";
  deadLetterId: string;
  sourceMessageId: string;
  sourceQueueId?: string;
  sourceQueueName?: string;
  failureReason: string;
  attemptCount: number;
  parkedAt: string;
  metadata: DeadLetterMetadata;
  payloadRef?: string;
  correlationId?: string | null;
};

export type DeadLetterParkInput = {
  deadLetterId?: string;
  sourceMessageId: string;
  sourceQueueId?: string;
  sourceQueueName?: string;
  failureReason: string;
  attemptCount: number;
  metadata?: DeadLetterMetadata;
  payloadRef?: string;
  correlationId?: string | null;
};

export type DeadLetterParkResult = {
  ok: boolean;
  record?: DeadLetterRecord;
  code?: string;
  message?: string;
};

export type DeadLetterGetByIdInput = {
  deadLetterId: string;
};

export type DeadLetterGetByIdResult = {
  ok: boolean;
  record?: DeadLetterRecord;
  code?: string;
  message?: string;
};

export type DeadLetterPurgeInput = {
  /** Se informado, remove apenas este registro; senão purge total. */
  deadLetterId?: string;
};

export type DeadLetterPurgeResult = {
  ok: boolean;
  purgedCount: number;
  code?: string;
  message?: string;
};

export type DeadLetterStatsResult = {
  ok: boolean;
  totalDeadLetters: number;
  code?: string;
  message?: string;
};

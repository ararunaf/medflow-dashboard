/**
 * Helpers de identidade — INF-05 Enterprise Queue Runtime.
 */

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createQueueRuntimeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const hex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

let resultSeq = 0;
let queueSeq = 0;
let messageSeq = 0;
let batchSeq = 0;

/** Gera id estrutural para resultados de Queue Runtime canônico. */
export function createQueueResultId(prefix = "queue-result"): string {
  resultSeq += 1;
  return `${prefix}-${resultSeq.toString(36)}`;
}

/** Gera id estrutural para filas canônicas. */
export function createQueueId(prefix = "queue"): string {
  queueSeq += 1;
  return `${prefix}-${queueSeq.toString(36)}`;
}

/** Gera id estrutural para mensagens canônicas. */
export function createQueueMessageId(prefix = "queue-msg"): string {
  messageSeq += 1;
  return `${prefix}-${messageSeq.toString(36)}`;
}

/** Gera id estrutural para lotes canônicos. */
export function createQueueBatchId(prefix = "queue-batch"): string {
  batchSeq += 1;
  return `${prefix}-${batchSeq.toString(36)}`;
}

export function resetQueueRuntimeIdSequences(): void {
  resultSeq = 0;
  queueSeq = 0;
  messageSeq = 0;
  batchSeq = 0;
}

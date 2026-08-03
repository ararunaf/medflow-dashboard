/**
 * Helpers de identidade — INF-08 Enterprise Persistent Queue Runtime.
 */

/** Gera UUID v4-like genérico (runtime-safe; sem crypto obrigatória). */
export function createPersistentQueueRuntimeRequestId(): string {
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
let scheduleSeq = 0;
let jobSeq = 0;
let dispatchSeq = 0;

/** Gera id estrutural para resultados de Persistent Queue Runtime canônico. */
export function createPersistentQueueResultId(prefix = "pqr-result"): string {
  resultSeq += 1;
  return `${prefix}-${resultSeq.toString(36)}`;
}

/** Gera id estrutural para PersistentQueues canônicos. */
export function createPersistentQueueId(prefix = "persist"): string {
  scheduleSeq += 1;
  return `${prefix}-${scheduleSeq.toString(36)}`;
}

/** Gera id estrutural para Messages canônicos. */
export function createPersistentMessageId(prefix = "pmsg"): string {
  jobSeq += 1;
  return `${prefix}-${jobSeq.toString(36)}`;
}

/** Gera id estrutural para Envelopes canônicos. */
export function createPersistentEnvelopeId(prefix = "penv"): string {
  dispatchSeq += 1;
  return `${prefix}-${dispatchSeq.toString(36)}`;
}

export function resetPersistentQueueRuntimeIdSequences(): void {
  resultSeq = 0;
  scheduleSeq = 0;
  jobSeq = 0;
  dispatchSeq = 0;
}

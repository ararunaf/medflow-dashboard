/**
 * Helpers de identidade — INF-01 Message Queue Foundation.
 *
 * Sem OCR, IA, parsers, banco, workers ou conhecimento clínico / TISS.
 */

let executionMessageQueueIdSeq = 0;
let messageIdSeq = 0;

function next(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

export function createExecutionMessageQueueId(): string {
  executionMessageQueueIdSeq += 1;
  return next("execution-message-queue", executionMessageQueueIdSeq);
}

export function createCanonicalQueueMessageId(): string {
  messageIdSeq += 1;
  return next("canonical-queue-message", messageIdSeq);
}

export function resetExecutionMessageQueueIdSequence(): void {
  executionMessageQueueIdSeq = 0;
}

export function resetCanonicalQueueMessageIdSequence(): void {
  messageIdSeq = 0;
}

export function resetAllMessageQueueIdSequences(): void {
  resetExecutionMessageQueueIdSequence();
  resetCanonicalQueueMessageIdSequence();
}

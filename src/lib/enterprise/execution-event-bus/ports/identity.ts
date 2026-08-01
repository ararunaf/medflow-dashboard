/**
 * Helpers de identidade — EPC-24 Sprint 05 (Execution Event Bus).
 *
 * Sem OCR, IA, parsers, filas ou conhecimento clínico / TISS.
 */

let eventBusIdSeq = 0;
let eventIdSeq = 0;
let envelopeIdSeq = 0;
let historyIdSeq = 0;
let publisherIdSeq = 0;
let subscriberIdSeq = 0;
let registrationIdSeq = 0;

function next(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

export function createEventBusId(): string {
  eventBusIdSeq += 1;
  return next("execution-event-bus", eventBusIdSeq);
}

export function createEventId(): string {
  eventIdSeq += 1;
  return next("execution-event", eventIdSeq);
}

export function createEnvelopeId(): string {
  envelopeIdSeq += 1;
  return next("execution-event-envelope", envelopeIdSeq);
}

export function createEventHistoryId(): string {
  historyIdSeq += 1;
  return next("execution-event-history", historyIdSeq);
}

export function createPublisherId(): string {
  publisherIdSeq += 1;
  return next("execution-event-publisher", publisherIdSeq);
}

export function createSubscriberId(): string {
  subscriberIdSeq += 1;
  return next("execution-event-subscriber", subscriberIdSeq);
}

export function createRegistrationId(): string {
  registrationIdSeq += 1;
  return next("execution-event-registration", registrationIdSeq);
}

export function resetEventBusIdSequence(): void {
  eventBusIdSeq = 0;
}

export function resetEventIdSequence(): void {
  eventIdSeq = 0;
}

export function resetEnvelopeIdSequence(): void {
  envelopeIdSeq = 0;
}

export function resetEventHistoryIdSequence(): void {
  historyIdSeq = 0;
}

export function resetPublisherIdSequence(): void {
  publisherIdSeq = 0;
}

export function resetSubscriberIdSequence(): void {
  subscriberIdSeq = 0;
}

export function resetRegistrationIdSequence(): void {
  registrationIdSeq = 0;
}

export function resetAllExecutionEventBusIdSequences(): void {
  resetEventBusIdSequence();
  resetEventIdSequence();
  resetEnvelopeIdSequence();
  resetEventHistoryIdSequence();
  resetPublisherIdSequence();
  resetSubscriberIdSequence();
  resetRegistrationIdSequence();
}

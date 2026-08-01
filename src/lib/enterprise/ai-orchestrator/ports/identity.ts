/**
 * Identidade de requests de orquestração — EPC-16.
 *
 * Sequência in-process para testes determinísticos.
 * Sem UUID de rede, sem I/O.
 */

let sequence = 0;

/** Gera um requestId estável e determinístico no processo. */
export function createOrchestrationRequestId(): string {
  sequence += 1;
  return `aio-req-${sequence}`;
}

/** Reset da sequência — exclusivo para testes. */
export function resetOrchestrationRequestIdSequence(): void {
  sequence = 0;
}

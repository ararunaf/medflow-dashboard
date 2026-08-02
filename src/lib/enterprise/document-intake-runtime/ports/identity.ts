/**
 * Identidade de registros do Document Intake Runtime — DIP-01.
 *
 * Sequência in-process para testes determinísticos.
 * Sem UUID de rede, sem I/O.
 */

let runtimeSessionSequence = 0;

/** Gera um RuntimeSessionId estável e determinístico no processo. */
export function createRuntimeSessionId(): string {
  runtimeSessionSequence += 1;
  return `dip-intake-session-${runtimeSessionSequence}`;
}

/** Reset da sequência — exclusivo para testes. */
export function resetRuntimeSessionIdSequence(): void {
  runtimeSessionSequence = 0;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllDocumentIntakeRuntimeIdSequences(): void {
  resetRuntimeSessionIdSequence();
}

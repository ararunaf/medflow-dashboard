/**
 * Identidade de registros do Capture Engine Runtime — DIP-02.
 *
 * Sequência in-process para testes determinísticos.
 * Sem UUID de rede, sem I/O.
 */

let captureSessionSequence = 0;

/** Gera um RuntimeSessionId estável e determinístico no processo. */
export function createCaptureRuntimeSessionId(): string {
  captureSessionSequence += 1;
  return `dip-capture-session-${captureSessionSequence}`;
}

/** Reset da sequência — exclusivo para testes. */
export function resetCaptureRuntimeSessionIdSequence(): void {
  captureSessionSequence = 0;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllCaptureEngineRuntimeIdSequences(): void {
  resetCaptureRuntimeSessionIdSequence();
}

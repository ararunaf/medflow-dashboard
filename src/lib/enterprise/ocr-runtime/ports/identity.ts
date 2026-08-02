/**
 * Identidade de registros do OCR Runtime — DIP-03.
 *
 * Sequência in-process para testes determinísticos.
 * Sem UUID de rede, sem I/O.
 */

let ocrSessionSequence = 0;

/** Gera um RuntimeSessionId estável e determinístico no processo. */
export function createOCRRuntimeSessionId(): string {
  ocrSessionSequence += 1;
  return `dip-ocr-session-${ocrSessionSequence}`;
}

/** Reset da sequência — exclusivo para testes. */
export function resetOCRRuntimeSessionIdSequence(): void {
  ocrSessionSequence = 0;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllOCRRuntimeIdSequences(): void {
  resetOCRRuntimeSessionIdSequence();
}

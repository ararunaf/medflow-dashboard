/**
 * Identidade de registros do Document Search Runtime — DIP-06.
 *
 * Sequência in-process para testes determinísticos.
 * Sem UUID de rede, sem I/O.
 */

let searchSessionSequence = 0;

/** Gera um RuntimeSessionId estável e determinístico no processo. */
export function createDocumentSearchRuntimeSessionId(): string {
  searchSessionSequence += 1;
  return `dip-search-session-${searchSessionSequence}`;
}

/** Reset da sequência — exclusivo para testes. */
export function resetDocumentSearchRuntimeSessionIdSequence(): void {
  searchSessionSequence = 0;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllDocumentSearchRuntimeIdSequences(): void {
  resetDocumentSearchRuntimeSessionIdSequence();
}

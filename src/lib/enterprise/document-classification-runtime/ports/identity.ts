/**
 * Identidade de registros do Document Classification Runtime — DIP-04.
 *
 * Sequência in-process para testes determinísticos.
 * Sem UUID de rede, sem I/O.
 */

let classificationSessionSequence = 0;

/** Gera um RuntimeSessionId estável e determinístico no processo. */
export function createDocumentClassificationRuntimeSessionId(): string {
  classificationSessionSequence += 1;
  return `dip-classification-session-${classificationSessionSequence}`;
}

/** Reset da sequência — exclusivo para testes. */
export function resetDocumentClassificationRuntimeSessionIdSequence(): void {
  classificationSessionSequence = 0;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllDocumentClassificationRuntimeIdSequences(): void {
  resetDocumentClassificationRuntimeSessionIdSequence();
}

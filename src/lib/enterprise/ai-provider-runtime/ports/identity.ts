/**
 * Identidade de registros do AI Provider Runtime — ARCH-02 / DIP-07.
 */

let aiSessionSequence = 0;

/** Gera um RuntimeSessionId estável e determinístico no processo. */
export function createAIProviderRuntimeSessionId(): string {
  aiSessionSequence += 1;
  return `dip-ai-session-${aiSessionSequence}`;
}

/** Reset da sequência — exclusivo para testes. */
export function resetAIProviderRuntimeSessionIdSequence(): void {
  aiSessionSequence = 0;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllAIProviderRuntimeIdSequences(): void {
  resetAIProviderRuntimeSessionIdSequence();
}

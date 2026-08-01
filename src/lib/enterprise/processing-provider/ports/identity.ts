/**
 * Identidade estrutural de Processing Providers — EPC-14.
 *
 * Geração de ProviderId opaca. Sem domínio clínico / TISS / OCR.
 */

let sequence = 0;

/** Cria um ProviderId estável e opaco. */
export function createProviderId(prefix = "pp"): string {
  sequence += 1;
  const stamp = Date.now().toString(36);
  return `${prefix}-${stamp}-${sequence.toString(36)}`;
}

/** Reinicia o contador (apenas testes). */
export function resetProviderIdSequence(): void {
  sequence = 0;
}

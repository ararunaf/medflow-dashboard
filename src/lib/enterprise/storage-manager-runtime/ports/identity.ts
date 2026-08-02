/**
 * Identidade de registros do Storage Manager Runtime — DIP-05.
 *
 * Sequência in-process para testes determinísticos.
 * Sem UUID de rede, sem I/O.
 */

let storageSessionSequence = 0;

/** Gera um RuntimeSessionId estável e determinístico no processo. */
export function createStorageManagerRuntimeSessionId(): string {
  storageSessionSequence += 1;
  return `dip-storage-session-${storageSessionSequence}`;
}

/** Reset da sequência — exclusivo para testes. */
export function resetStorageManagerRuntimeSessionIdSequence(): void {
  storageSessionSequence = 0;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllStorageManagerRuntimeIdSequences(): void {
  resetStorageManagerRuntimeSessionIdSequence();
}

/**
 * Identidade de auditorias — EPC-18.
 *
 * Sequência in-process para testes determinísticos.
 * Sem UUID de rede, sem I/O.
 */

let auditSequence = 0;
let findingSequence = 0;

/** Gera um AuditId estável e determinístico no processo. */
export function createAuditId(): string {
  auditSequence += 1;
  return `aia-audit-${auditSequence}`;
}

/** Reset da sequência de AuditId — exclusivo para testes. */
export function resetAuditIdSequence(): void {
  auditSequence = 0;
}

/** Gera um FindingId estável e determinístico no processo. */
export function createFindingId(): string {
  findingSequence += 1;
  return `aia-finding-${findingSequence}`;
}

/** Reset da sequência de FindingId — exclusivo para testes. */
export function resetFindingIdSequence(): void {
  findingSequence = 0;
}

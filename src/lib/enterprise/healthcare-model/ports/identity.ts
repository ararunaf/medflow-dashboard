/**
 * Identidade de entidades do Healthcare Model — EPC-19.
 *
 * Sequência in-process para testes determinísticos.
 * Sem UUID de rede, sem I/O.
 */

let entitySequence = 0;
let relationshipSequence = 0;

/** Gera um EntityId estável e determinístico no processo. */
export function createHealthcareEntityId(kind?: string): string {
  entitySequence += 1;
  const prefix = kind ? `hcm-${kind}` : "hcm-entity";
  return `${prefix}-${entitySequence}`;
}

/** Reset da sequência de EntityId — exclusivo para testes. */
export function resetHealthcareEntityIdSequence(): void {
  entitySequence = 0;
}

/** Gera um RelationshipId estável e determinístico no processo. */
export function createHealthcareRelationshipId(): string {
  relationshipSequence += 1;
  return `hcm-rel-${relationshipSequence}`;
}

/** Reset da sequência de RelationshipId — exclusivo para testes. */
export function resetHealthcareRelationshipIdSequence(): void {
  relationshipSequence = 0;
}

/**
 * Identidade de registros do TISS Profile — EPC-22.
 *
 * Sequência in-process para testes determinísticos.
 * Sem UUID de rede, sem I/O.
 */

let profileSequence = 0;
let conceptSequence = 0;
let relationshipSequence = 0;
let versionSequence = 0;
let metadataSequence = 0;

/** Gera um TISSProfileId estável e determinístico no processo. */
export function createTISSProfileId(): string {
  profileSequence += 1;
  return `tiss-profile-${profileSequence}`;
}

/** Reset da sequência de TISSProfileId — exclusivo para testes. */
export function resetTISSProfileIdSequence(): void {
  profileSequence = 0;
}

/** Gera um ProfileConceptId estável e determinístico no processo. */
export function createProfileConceptId(): string {
  conceptSequence += 1;
  return `tiss-profile-concept-${conceptSequence}`;
}

/** Reset da sequência de ProfileConceptId — exclusivo para testes. */
export function resetProfileConceptIdSequence(): void {
  conceptSequence = 0;
}

/** Gera um ProfileRelationshipId estável e determinístico no processo. */
export function createProfileRelationshipId(): string {
  relationshipSequence += 1;
  return `tiss-profile-rel-${relationshipSequence}`;
}

/** Reset da sequência de ProfileRelationshipId — exclusivo para testes. */
export function resetProfileRelationshipIdSequence(): void {
  relationshipSequence = 0;
}

/** Gera um ProfileVersionId estável e determinístico no processo. */
export function createProfileVersionId(): string {
  versionSequence += 1;
  return `tiss-profile-ver-${versionSequence}`;
}

/** Reset da sequência de ProfileVersionId — exclusivo para testes. */
export function resetProfileVersionIdSequence(): void {
  versionSequence = 0;
}

/** Gera um ProfileMetadataId estável e determinístico no processo. */
export function createProfileMetadataId(): string {
  metadataSequence += 1;
  return `tiss-profile-meta-${metadataSequence}`;
}

/** Reset da sequência de ProfileMetadataId — exclusivo para testes. */
export function resetProfileMetadataIdSequence(): void {
  metadataSequence = 0;
}

/** Reset de todas as sequências — exclusivo para testes. */
export function resetAllTISSProfileIdSequences(): void {
  resetTISSProfileIdSequence();
  resetProfileConceptIdSequence();
  resetProfileRelationshipIdSequence();
  resetProfileVersionIdSequence();
  resetProfileMetadataIdSequence();
}

/**
 * Identidade de conceitos do TISS Vocabulary — EPC-20.
 *
 * Sequência in-process para testes determinísticos.
 * Sem UUID de rede, sem I/O.
 */

let conceptSequence = 0;
let relationshipSequence = 0;

/** Gera um ConceptId estável e determinístico no processo. */
export function createTISSConceptId(category?: string): string {
  conceptSequence += 1;
  const prefix = category ? `tiss-concept-${category}` : "tiss-concept";
  return `${prefix}-${conceptSequence}`;
}

/** Reset da sequência de ConceptId — exclusivo para testes. */
export function resetTISSConceptIdSequence(): void {
  conceptSequence = 0;
}

/** Gera um ConceptRelationshipId estável e determinístico no processo. */
export function createConceptRelationshipId(): string {
  relationshipSequence += 1;
  return `tiss-rel-${relationshipSequence}`;
}

/** Reset da sequência de ConceptRelationshipId — exclusivo para testes. */
export function resetConceptRelationshipIdSequence(): void {
  relationshipSequence = 0;
}

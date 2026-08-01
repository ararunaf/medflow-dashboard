/**
 * TISSVocabularyStore — contrato interno do store (EPC-20).
 *
 * Camada entre Adapter e persistência física.
 * NÃO é banco; NÃO cria migrations; NÃO conhece layout XML / parsers / regras.
 */
import type { TISSConcept } from "../ports/models";
import type { ConceptRelationship } from "../ports/relationships";

export type StoredTISSConcept = TISSConcept;
export type StoredConceptRelationship = ConceptRelationship;

export interface TISSVocabularyStore {
  readonly storeId: string;

  getConcept(conceptId: string): StoredTISSConcept | undefined;
  getConceptByCode(conceptCode: string): StoredTISSConcept | undefined;
  setConcept(concept: StoredTISSConcept): void;
  listConcepts(): readonly StoredTISSConcept[];
  removeConcept(conceptId: string): boolean;
  conceptCount(): number;

  getRelationship(relationshipId: string): StoredConceptRelationship | undefined;
  setRelationship(relationship: StoredConceptRelationship): void;
  listRelationships(): readonly StoredConceptRelationship[];
  removeRelationship(relationshipId: string): boolean;
  relationshipCount(): number;

  /** Prontidão do store (sem I/O externo obrigatório). */
  health(): { ok: boolean; message?: string };
}

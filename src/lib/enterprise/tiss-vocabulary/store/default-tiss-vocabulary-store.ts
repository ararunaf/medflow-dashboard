/**
 * DefaultTISSVocabularyStore — store in-process padrão (EPC-20).
 *
 * Utiliza mecanismo em memória do processo (sem novo banco, sem migrations).
 */
import type {
  StoredConceptRelationship,
  StoredTISSConcept,
  TISSVocabularyStore,
} from "./tiss-vocabulary-store";

export const DEFAULT_TISS_VOCABULARY_STORE_ID = "default-in-process";

export type DefaultTISSVocabularyStoreOptions = {
  concepts?: readonly StoredTISSConcept[];
  relationships?: readonly StoredConceptRelationship[];
};

export class DefaultTISSVocabularyStore implements TISSVocabularyStore {
  readonly storeId = DEFAULT_TISS_VOCABULARY_STORE_ID;

  private readonly concepts = new Map<string, StoredTISSConcept>();
  private readonly conceptsByCode = new Map<string, string>();
  private readonly relationships = new Map<string, StoredConceptRelationship>();

  constructor(options: DefaultTISSVocabularyStoreOptions = {}) {
    for (const concept of options.concepts ?? []) {
      this.setConcept(concept);
    }
    for (const relationship of options.relationships ?? []) {
      this.relationships.set(relationship.id, relationship);
    }
  }

  getConcept(conceptId: string): StoredTISSConcept | undefined {
    return this.concepts.get(conceptId);
  }

  getConceptByCode(conceptCode: string): StoredTISSConcept | undefined {
    const id = this.conceptsByCode.get(conceptCode);
    return id ? this.concepts.get(id) : undefined;
  }

  setConcept(concept: StoredTISSConcept): void {
    const previous = this.concepts.get(concept.id);
    if (previous && previous.conceptCode !== concept.conceptCode) {
      this.conceptsByCode.delete(previous.conceptCode);
    }
    this.concepts.set(concept.id, concept);
    this.conceptsByCode.set(concept.conceptCode, concept.id);
  }

  listConcepts(): readonly StoredTISSConcept[] {
    return [...this.concepts.values()];
  }

  removeConcept(conceptId: string): boolean {
    const existing = this.concepts.get(conceptId);
    if (!existing) return false;
    this.conceptsByCode.delete(existing.conceptCode);
    return this.concepts.delete(conceptId);
  }

  conceptCount(): number {
    return this.concepts.size;
  }

  getRelationship(relationshipId: string): StoredConceptRelationship | undefined {
    return this.relationships.get(relationshipId);
  }

  setRelationship(relationship: StoredConceptRelationship): void {
    this.relationships.set(relationship.id, relationship);
  }

  listRelationships(): readonly StoredConceptRelationship[] {
    return [...this.relationships.values()];
  }

  removeRelationship(relationshipId: string): boolean {
    return this.relationships.delete(relationshipId);
  }

  relationshipCount(): number {
    return this.relationships.size;
  }

  health(): { ok: boolean; message?: string } {
    return {
      ok: true,
      message: `DefaultTISSVocabularyStore ready (${this.concepts.size} concepts, ${this.relationships.size} relationships).`,
    };
  }
}

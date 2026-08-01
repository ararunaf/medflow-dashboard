/**
 * Ports — TISS Vocabulary Foundation (EPC-20).
 */
export type { TISSVocabularyPort } from "./tiss-vocabulary-port";

export type {
  GetConceptInput,
  GetConceptResult,
  ListConceptsInput,
  ListConceptsResult,
  RegisterConceptInput,
  RegisterConceptResult,
  TISSVocabularyCapabilities,
  TISSVocabularyHealth,
  TISSVocabularyProviderId,
  TISSVocabularyProviderOptions,
} from "./types";

export type {
  TISSConcept,
  TISSConceptCategory,
  TISSConceptStatus,
  TISSConceptTag,
  TISSConfigurationReference,
  TISSMetadataReference,
} from "./models";

export { TISS_CONCEPT_CATEGORIES, TISS_FOUNDATION_CONCEPTS } from "./models";

export type { ConceptRelationship } from "./relationships";
export { TISS_RELATIONSHIP_CHAIN_EXAMPLE } from "./relationships";

export {
  createConceptRelationshipId,
  createTISSConceptId,
  resetConceptRelationshipIdSequence,
  resetTISSConceptIdSequence,
} from "./identity";

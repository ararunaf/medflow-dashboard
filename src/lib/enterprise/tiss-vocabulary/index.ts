/**
 * Enterprise TISS Vocabulary Foundation — Ports & Adapters (EPC-20).
 *
 * Fluxo oficial:
 *   Application → TISSVocabularyPort → TISSVocabularyAdapter
 *     → TISSVocabularyStore → TISSVocabularyFactory → TISSVocabularyProvider
 *
 * Catálogo semântico permanente do MedicFlow Enterprise.
 * Qualquer versão futura da TISS deverá ser adaptada a este vocabulário
 * via TISS Mapping, antes de alimentar Healthcare Model, Rule Engine,
 * Workflow ou AI Auditor.
 *
 * EPC-20: fundação estrutural apenas.
 * NÃO implementa parser XML, TISS Intelligence, regras, validações,
 * OCR, AI, Workflow, banco, APIs, UI ou migrations.
 */
export type {
  ConceptRelationship,
  GetConceptInput,
  GetConceptResult,
  ListConceptsInput,
  ListConceptsResult,
  RegisterConceptInput,
  RegisterConceptResult,
  TISSConcept,
  TISSConceptCategory,
  TISSConceptStatus,
  TISSConceptTag,
  TISSConfigurationReference,
  TISSMetadataReference,
  TISSVocabularyCapabilities,
  TISSVocabularyHealth,
  TISSVocabularyPort,
  TISSVocabularyProviderId,
  TISSVocabularyProviderOptions,
} from "./ports";

export {
  TISS_CONCEPT_CATEGORIES,
  TISS_FOUNDATION_CONCEPTS,
  TISS_RELATIONSHIP_CHAIN_EXAMPLE,
  createConceptRelationshipId,
  createTISSConceptId,
  resetConceptRelationshipIdSequence,
  resetTISSConceptIdSequence,
} from "./ports";

export {
  DEFAULT_TISS_VOCABULARY_ADAPTER_ID,
  DEFAULT_TISS_VOCABULARY_VERSION,
  DefaultTISSVocabularyAdapter,
  MOCK_TISS_VOCABULARY_ADAPTER_ID,
  MOCK_TISS_VOCABULARY_VERSION,
  MockTISSVocabularyAdapter,
  type DefaultTISSVocabularyRuntime,
  type MockTISSVocabularyAdapterOptions,
} from "./adapters";

export {
  DEFAULT_TISS_VOCABULARY_STORE_ID,
  DefaultTISSVocabularyStore,
  type DefaultTISSVocabularyStoreOptions,
  type StoredConceptRelationship,
  type StoredTISSConcept,
  type TISSVocabularyStore,
} from "./store";

export {
  TISSVocabularyFactory,
  createTISSVocabularyFactory,
  type TISSVocabularyFactoryOptions,
} from "./factory";

export { createTISSVocabularyPort } from "./providers";

export { getTISSVocabularyHealthSummary, type TISSVocabularyHealthSummary } from "./demo";

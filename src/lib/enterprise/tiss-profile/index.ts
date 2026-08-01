/**
 * Enterprise TISS Profile Foundation — Ports & Adapters (EPC-22).
 *
 * Fluxo oficial:
 *   Application → TISSProfilePort → TISSProfileAdapter
 *     → TISSProfileStore → TISSProfileFactory → TISSProfileProvider
 *
 * Camada canônica que representa a estrutura esperada de um documento TISS.
 * O Profile NÃO representa uma guia específica — é um padrão estrutural reutilizável.
 *
 * Pipeline futuro:
 *   Origem → Mapping → Vocabulary → Profile → Healthcare Model → Rule Engine → AI Auditor
 *
 * EPC-22: fundação estrutural apenas.
 * NÃO implementa parser XML, OCR, AI, Rule Engine, Workflow, contratos,
 * validações, regras, banco, APIs, UI ou migrations.
 */
export type {
  GetProfileInput,
  GetProfileResult,
  ListProfilesInput,
  ListProfilesResult,
  ProfileCardinality,
  ProfileConcept,
  ProfileConfigurationReference,
  ProfileEngineMetadataReference,
  ProfileMetadata,
  ProfileRecord,
  ProfileRecordKind,
  ProfileRelationship,
  ProfileRequirement,
  ProfileStatus,
  ProfileTag,
  ProfileVersion,
  ProfileVersionFamily,
  RegisterProfileInput,
  RegisterProfileResult,
  TISSProfile,
  TISSProfileCapabilities,
  TISSProfileHealth,
  TISSProfilePort,
  TISSProfileProviderId,
  TISSProfileProviderOptions,
} from "./ports";

export {
  PROFILE_PIPELINE,
  PROFILE_PREPARED_VERSION_FAMILIES,
  PROFILE_STRUCTURAL_CHAIN,
  PROFILE_VERSION_FAMILIES,
  createProfileConceptId,
  createProfileMetadataId,
  createProfileRelationshipId,
  createProfileVersionId,
  createTISSProfileId,
  resetAllTISSProfileIdSequences,
  resetProfileConceptIdSequence,
  resetProfileMetadataIdSequence,
  resetProfileRelationshipIdSequence,
  resetProfileVersionIdSequence,
  resetTISSProfileIdSequence,
} from "./ports";

export {
  DEFAULT_TISS_PROFILE_ADAPTER_ID,
  DEFAULT_TISS_PROFILE_VERSION,
  DefaultTISSProfileAdapter,
  MOCK_TISS_PROFILE_ADAPTER_ID,
  MOCK_TISS_PROFILE_VERSION,
  MockTISSProfileAdapter,
  type DefaultTISSProfileRuntime,
  type MockTISSProfileAdapterOptions,
} from "./adapters";

export {
  DEFAULT_TISS_PROFILE_STORE_ID,
  DefaultTISSProfileStore,
  type DefaultTISSProfileStoreOptions,
  type StoredProfileMetadata,
  type StoredProfileRelationship,
  type StoredProfileVersion,
  type StoredTISSProfile,
  type TISSProfileStore,
} from "./store";

export {
  TISSProfileFactory,
  createTISSProfileFactory,
  type TISSProfileFactoryOptions,
} from "./factory";

export { createTISSProfilePort } from "./providers";

export { getTISSProfileHealthSummary, type TISSProfileHealthSummary } from "./demo";

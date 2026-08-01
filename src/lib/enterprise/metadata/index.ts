/**
 * Enterprise Metadata Engine — Ports & Adapters (EPC-04).
 *
 * Fluxo oficial:
 *   Application → MetadataPort → MetadataAdapter
 *     → Metadata Store → Metadata Provider
 *
 * Domain/Application NÃO devem importar conceitos clínicos, TISS, OCR, IA,
 * Workflow, Storage ou Persistence de produto.
 *
 * Conceitos nativos únicos:
 * Entity | Attribute | Relationship | Constraint | Schema | Template |
 * Property | Enumeration | Reference | Validation | Version | Namespace |
 * Tag | Category
 */
export type {
  GetEntityInput,
  GetEntityResult,
  GetSchemaInput,
  GetSchemaResult,
  ListSchemasInput,
  ListSchemasResult,
  ListTemplatesInput,
  ListTemplatesResult,
  MetadataArtifactKind,
  MetadataAttribute,
  MetadataCapabilities,
  MetadataCategory,
  MetadataCompatibility,
  MetadataConstraint,
  MetadataConstraintKind,
  MetadataEntity,
  MetadataEnumeration,
  MetadataHealth,
  MetadataId,
  MetadataName,
  MetadataNamespace,
  MetadataPort,
  MetadataProperty,
  MetadataPropertyKind,
  MetadataProviderId,
  MetadataProviderOptions,
  MetadataReference,
  MetadataRelationship,
  MetadataSchema,
  MetadataSchemaStatus,
  MetadataTag,
  MetadataTemplate,
  MetadataValidation,
  MetadataVersionInfo,
  MetadataVersionLabel,
  RegisterEntityInput,
  RegisterEntityResult,
  RegisterSchemaInput,
  RegisterSchemaResult,
  RegisterTemplateInput,
  RegisterTemplateResult,
} from "./ports";

export {
  METADATA_CONSTRAINT_KINDS,
  METADATA_SCHEMA_STATUSES,
  collectionConstraint,
  createVersionInfo,
  declaresCompatibilityWith,
  declaresIncompatibilityWith,
  defineConstraint,
  entityDeclaresInheritance,
  expressionConstraint,
  getDeclaredInheritanceChain,
  getEntityBaseReference,
  getSchemaBaseReference,
  getSchemaStatus,
  getSchemaVersion,
  isKnownConstraintKind,
  isKnownSchemaStatus,
  rangeConstraint,
  referenceConstraint,
  regexConstraint,
  requiredConstraint,
  schemaDeclaresInheritance,
  touchVersionInfo,
  uniqueConstraint,
} from "./ports";

export {
  DEFAULT_METADATA_ADAPTER_ID,
  DefaultMetadataAdapter,
  MockMetadataAdapter,
  type DefaultMetadataRuntime,
  type MockMetadataAdapterOptions,
} from "./adapters";

export {
  DEFAULT_METADATA_STORE_ID,
  DefaultMetadataStore,
  type DefaultMetadataStoreOptions,
  type MetadataStore,
  type StoredMetadataEntity,
  type StoredMetadataSchema,
  type StoredMetadataTemplate,
} from "./store";

export { createMetadataPort } from "./providers";

export { getMetadataHealthSummary, type MetadataHealthSummary } from "./demo";

/**
 * Enterprise Document Intake Foundation — Ports & Adapters (EPC-12).
 *
 * Fluxo oficial:
 *   Application → DocumentIntakePort → DocumentIntakeAdapter
 *     → DocumentIntakeStore → DocumentIntakeFactory → DocumentIntakeProvider
 *
 * Domain/Application NÃO devem importar conceitos clínicos, TISS, OCR, IA,
 * captura, upload funcional, watcher, scanner, e-mail ou contratos específicos.
 *
 * Document Intake apenas recebe documentos e registra origem, estado
 * e referências estruturais opacas. Especializações ficam FORA deste componente.
 */
export type {
  CreateIntakeInput,
  CreateIntakeResult,
  DocumentIntake,
  DocumentIntakeCapabilities,
  DocumentIntakeHealth,
  DocumentIntakePort,
  DocumentIntakeProviderId,
  DocumentIntakeProviderOptions,
  GetIntakeInput,
  GetIntakeResult,
  IntakeConfigurationReference,
  IntakeDeclaredCapability,
  IntakeDocumentIdentityReference,
  IntakeId,
  IntakeMetadataReference,
  IntakeOpaqueReference,
  IntakePriority,
  IntakeStatus,
  IntakeStorageReference,
  IntakeTag,
  IntakeWorkflowReference,
  ListIntakesInput,
  ListIntakesResult,
  SourceType,
} from "./ports";

export {
  INTAKE_PRIORITIES,
  INTAKE_STATUSES,
  SOURCE_TYPES,
  createIntakeId,
  defineConfigurationReference,
  defineDocumentIdentityReference,
  defineMetadataReference,
  defineOpaqueReference,
  defineStorageReference,
  defineWorkflowReference,
  getDocumentId,
  getStorageKey,
  getWorkflowId,
  hasKnownPriority,
  hasKnownSourceType,
  hasKnownStatus,
  intakeHasKnownSourceType,
  isArchived,
  isCompleted,
  isFailed,
  isReceived,
  listSourceTypes,
  preparePriority,
  prepareStatusTransition,
  referencesDocumentIdentity,
  referencesWorkflow,
  withLifecycle,
} from "./ports";

export {
  DEFAULT_DOCUMENT_INTAKE_ADAPTER_ID,
  DefaultDocumentIntakeAdapter,
  MockDocumentIntakeAdapter,
  type DefaultDocumentIntakeRuntime,
  type MockDocumentIntakeAdapterOptions,
} from "./adapters";

export {
  DEFAULT_DOCUMENT_INTAKE_STORE_ID,
  DefaultDocumentIntakeStore,
  type DefaultDocumentIntakeStoreOptions,
  type DocumentIntakeStore,
  type StoredDocumentIntake,
} from "./store";

export {
  DocumentIntakeFactory,
  createDocumentIntakeFactory,
  type DocumentIntakeFactoryOptions,
} from "./factory";

export { createDocumentIntakePort } from "./providers";

export { getDocumentIntakeHealthSummary, type DocumentIntakeHealthSummary } from "./demo";

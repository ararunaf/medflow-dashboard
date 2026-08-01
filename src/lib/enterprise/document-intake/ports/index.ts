export type { DocumentIntakePort } from "./document-intake-port";
export type {
  CreateIntakeInput,
  CreateIntakeResult,
  DocumentIntake,
  DocumentIntakeCapabilities,
  DocumentIntakeHealth,
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
} from "./types";

export { INTAKE_PRIORITIES, INTAKE_STATUSES, SOURCE_TYPES } from "./types";

export { createIntakeId } from "./identity";

export {
  hasKnownPriority,
  hasKnownStatus,
  isArchived,
  isCompleted,
  isFailed,
  isReceived,
  preparePriority,
  prepareStatusTransition,
  withLifecycle,
} from "./lifecycle";

export { hasKnownSourceType, intakeHasKnownSourceType, listSourceTypes } from "./source-type";

export {
  defineConfigurationReference,
  defineDocumentIdentityReference,
  defineMetadataReference,
  defineOpaqueReference,
  defineStorageReference,
  defineWorkflowReference,
  getDocumentId,
  getStorageKey,
  getWorkflowId,
  referencesDocumentIdentity,
  referencesWorkflow,
} from "./references";

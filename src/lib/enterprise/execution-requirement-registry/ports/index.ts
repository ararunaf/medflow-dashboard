/**
 * Ports — Execution Requirement Registry Foundation (EPC-24 Sprint 12).
 */
export type { ExecutionRequirementRegistryPort } from "./execution-requirement-registry-port";

export type {
  ExecutionRequirement,
  ExecutionRequirementCapabilities,
  ExecutionRequirementCategory,
  ExecutionRequirementCategoryKind,
  ExecutionRequirementDefinition,
  ExecutionRequirementFilter,
  ExecutionRequirementHealth,
  ExecutionRequirementMetadata,
  ExecutionRequirementRecordKind,
  ExecutionRequirementReference,
  ExecutionRequirementRegistry,
  ExecutionRequirementRegistryPortCapabilities,
  ExecutionRequirementRegistryPortHealth,
  ExecutionRequirementRegistryProviderId,
  ExecutionRequirementRegistryProviderOptions,
  ExecutionRequirementResult,
  ExecutionRequirementScope,
  ExecutionRequirementScopeKind,
  ExecutionRequirementStatistics,
  ExecutionRequirementStatisticsResult,
  FindRequirementsInput,
  FindRequirementsResult,
  GetRequirementInput,
  GetRequirementResult,
  ListRequirementsInput,
  ListRequirementsResult,
  RegisterRequirementInput,
  RegisterRequirementResult,
} from "./types";

export { STRUCTURAL_REQUIREMENT_REGISTRY_CAPABILITY } from "./models";

export {
  createExecutionRequirementId,
  createExecutionRequirementRegistryId,
  createRequirementCategoryId,
  createRequirementDefinitionId,
  createRequirementScopeId,
  resetAllExecutionRequirementRegistryIdSequences,
  resetExecutionRequirementIdSequence,
  resetExecutionRequirementRegistryIdSequence,
  resetRequirementCategoryIdSequence,
  resetRequirementDefinitionIdSequence,
  resetRequirementScopeIdSequence,
} from "./identity";

/**
 * Ports — Execution Environment Registry Foundation (EPC-24 Sprint 14).
 */
export type { ExecutionEnvironmentRegistryPort } from "./execution-environment-registry-port";

export type {
  ExecutionEnvironment,
  ExecutionEnvironmentCapabilities,
  ExecutionEnvironmentCategory,
  ExecutionEnvironmentCategoryKind,
  ExecutionEnvironmentDefinition,
  ExecutionEnvironmentFilter,
  ExecutionEnvironmentHealth,
  ExecutionEnvironmentMetadata,
  ExecutionEnvironmentRecordKind,
  ExecutionEnvironmentReference,
  ExecutionEnvironmentRegistry,
  ExecutionEnvironmentRegistryPortCapabilities,
  ExecutionEnvironmentRegistryPortHealth,
  ExecutionEnvironmentRegistryProviderId,
  ExecutionEnvironmentRegistryProviderOptions,
  ExecutionEnvironmentResult,
  ExecutionEnvironmentScope,
  ExecutionEnvironmentScopeKind,
  ExecutionEnvironmentStatistics,
  ExecutionEnvironmentStatisticsResult,
  FindEnvironmentsInput,
  FindEnvironmentsResult,
  GetEnvironmentInput,
  GetEnvironmentResult,
  ListEnvironmentsInput,
  ListEnvironmentsResult,
  RegisterEnvironmentInput,
  RegisterEnvironmentResult,
} from "./types";

export { STRUCTURAL_ENVIRONMENT_REGISTRY_CAPABILITY } from "./models";

export {
  createExecutionEnvironmentId,
  createExecutionEnvironmentRegistryId,
  createEnvironmentCategoryId,
  createEnvironmentDefinitionId,
  createEnvironmentScopeId,
  resetAllExecutionEnvironmentRegistryIdSequences,
  resetExecutionEnvironmentIdSequence,
  resetExecutionEnvironmentRegistryIdSequence,
  resetEnvironmentCategoryIdSequence,
  resetEnvironmentDefinitionIdSequence,
  resetEnvironmentScopeIdSequence,
} from "./identity";

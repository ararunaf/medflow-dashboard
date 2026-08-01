/**
 * Ports — Execution Resource Registry Foundation (EPC-24 Sprint 13).
 */
export type { ExecutionResourceRegistryPort } from "./execution-resource-registry-port";

export type {
  ExecutionResource,
  ExecutionResourceCapabilities,
  ExecutionResourceCategory,
  ExecutionResourceCategoryKind,
  ExecutionResourceDefinition,
  ExecutionResourceFilter,
  ExecutionResourceHealth,
  ExecutionResourceMetadata,
  ExecutionResourceRecordKind,
  ExecutionResourceReference,
  ExecutionResourceRegistry,
  ExecutionResourceRegistryPortCapabilities,
  ExecutionResourceRegistryPortHealth,
  ExecutionResourceRegistryProviderId,
  ExecutionResourceRegistryProviderOptions,
  ExecutionResourceResult,
  ExecutionResourceScope,
  ExecutionResourceScopeKind,
  ExecutionResourceStatistics,
  ExecutionResourceStatisticsResult,
  FindResourcesInput,
  FindResourcesResult,
  GetResourceInput,
  GetResourceResult,
  ListResourcesInput,
  ListResourcesResult,
  RegisterResourceInput,
  RegisterResourceResult,
} from "./types";

export { STRUCTURAL_RESOURCE_REGISTRY_CAPABILITY } from "./models";

export {
  createExecutionResourceId,
  createExecutionResourceRegistryId,
  createResourceCategoryId,
  createResourceDefinitionId,
  createResourceScopeId,
  resetAllExecutionResourceRegistryIdSequences,
  resetExecutionResourceIdSequence,
  resetExecutionResourceRegistryIdSequence,
  resetResourceCategoryIdSequence,
  resetResourceDefinitionIdSequence,
  resetResourceScopeIdSequence,
} from "./identity";

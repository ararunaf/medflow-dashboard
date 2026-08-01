/**
 * Ports — Execution Capability Registry Foundation (EPC-24 Sprint 08).
 */
export type { ExecutionCapabilityRegistryPort } from "./execution-capability-registry-port";

export type {
  ExecutionCapability,
  ExecutionCapabilityCapabilities,
  ExecutionCapabilityCategory,
  ExecutionCapabilityCategoryKind,
  ExecutionCapabilityDefinition,
  ExecutionCapabilityDescriptor,
  ExecutionCapabilityFilter,
  ExecutionCapabilityHealth,
  ExecutionCapabilityMetadata,
  ExecutionCapabilityRecordKind,
  ExecutionCapabilityReference,
  ExecutionCapabilityRegistry,
  ExecutionCapabilityRegistryPortCapabilities,
  ExecutionCapabilityRegistryPortHealth,
  ExecutionCapabilityRegistryProviderId,
  ExecutionCapabilityRegistryProviderOptions,
  ExecutionCapabilityResult,
  ExecutionCapabilityStatistics,
  ExecutionCapabilityStatisticsResult,
  FindCapabilitiesInput,
  FindCapabilitiesResult,
  GetCapabilityInput,
  GetCapabilityResult,
  ListCapabilitiesInput,
  ListCapabilitiesResult,
  RegisterCapabilityInput,
  RegisterCapabilityResult,
} from "./types";

export { STRUCTURAL_CAPABILITY_REGISTRY_CAPABILITY } from "./models";

export {
  createCapabilityCategoryId,
  createCapabilityDefinitionId,
  createCapabilityDescriptorId,
  createExecutionCapabilityId,
  createExecutionCapabilityRegistryId,
  resetAllExecutionCapabilityRegistryIdSequences,
  resetCapabilityCategoryIdSequence,
  resetCapabilityDefinitionIdSequence,
  resetCapabilityDescriptorIdSequence,
  resetExecutionCapabilityIdSequence,
  resetExecutionCapabilityRegistryIdSequence,
} from "./identity";

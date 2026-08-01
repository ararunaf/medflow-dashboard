/**
 * Ports — Execution Dependency Registry Foundation (EPC-24 Sprint 09).
 */
export type { ExecutionDependencyRegistryPort } from "./execution-dependency-registry-port";

export type {
  ExecutionDependency,
  ExecutionDependencyCapabilities,
  ExecutionDependencyDefinition,
  ExecutionDependencyEdge,
  ExecutionDependencyFilter,
  ExecutionDependencyGraph,
  ExecutionDependencyHealth,
  ExecutionDependencyMetadata,
  ExecutionDependencyNode,
  ExecutionDependencyNodeRole,
  ExecutionDependencyRecordKind,
  ExecutionDependencyReference,
  ExecutionDependencyRegistry,
  ExecutionDependencyRegistryPortCapabilities,
  ExecutionDependencyRegistryPortHealth,
  ExecutionDependencyRegistryProviderId,
  ExecutionDependencyRegistryProviderOptions,
  ExecutionDependencyResult,
  ExecutionDependencyStatistics,
  ExecutionDependencyStatisticsResult,
  FindDependenciesInput,
  FindDependenciesResult,
  GetDependencyInput,
  GetDependencyResult,
  ListDependenciesInput,
  ListDependenciesResult,
  RegisterDependencyInput,
  RegisterDependencyResult,
} from "./types";

export { STRUCTURAL_DEPENDENCY_REGISTRY_CAPABILITY } from "./models";

export {
  createDependencyDefinitionId,
  createDependencyEdgeId,
  createDependencyGraphId,
  createDependencyNodeId,
  createExecutionDependencyId,
  createExecutionDependencyRegistryId,
  resetAllExecutionDependencyRegistryIdSequences,
  resetDependencyDefinitionIdSequence,
  resetDependencyEdgeIdSequence,
  resetDependencyGraphIdSequence,
  resetDependencyNodeIdSequence,
  resetExecutionDependencyIdSequence,
  resetExecutionDependencyRegistryIdSequence,
} from "./identity";

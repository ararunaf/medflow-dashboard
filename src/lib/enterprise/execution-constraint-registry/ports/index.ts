/**
 * Ports — Execution Constraint Registry Foundation (EPC-24 Sprint 11).
 */
export type { ExecutionConstraintRegistryPort } from "./execution-constraint-registry-port";

export type {
  ExecutionConstraint,
  ExecutionConstraintCapabilities,
  ExecutionConstraintCategory,
  ExecutionConstraintCategoryKind,
  ExecutionConstraintDefinition,
  ExecutionConstraintFilter,
  ExecutionConstraintHealth,
  ExecutionConstraintMetadata,
  ExecutionConstraintRecordKind,
  ExecutionConstraintReference,
  ExecutionConstraintRegistry,
  ExecutionConstraintRegistryPortCapabilities,
  ExecutionConstraintRegistryPortHealth,
  ExecutionConstraintRegistryProviderId,
  ExecutionConstraintRegistryProviderOptions,
  ExecutionConstraintResult,
  ExecutionConstraintScope,
  ExecutionConstraintScopeKind,
  ExecutionConstraintStatistics,
  ExecutionConstraintStatisticsResult,
  FindConstraintsInput,
  FindConstraintsResult,
  GetConstraintInput,
  GetConstraintResult,
  ListConstraintsInput,
  ListConstraintsResult,
  RegisterConstraintInput,
  RegisterConstraintResult,
} from "./types";

export { STRUCTURAL_CONSTRAINT_REGISTRY_CAPABILITY } from "./models";

export {
  createExecutionConstraintId,
  createExecutionConstraintRegistryId,
  createConstraintCategoryId,
  createConstraintDefinitionId,
  createConstraintScopeId,
  resetAllExecutionConstraintRegistryIdSequences,
  resetExecutionConstraintIdSequence,
  resetExecutionConstraintRegistryIdSequence,
  resetConstraintCategoryIdSequence,
  resetConstraintDefinitionIdSequence,
  resetConstraintScopeIdSequence,
} from "./identity";

/**
 * Ports — Execution Registry Foundation (EPC-24 Sprint 06).
 */
export type { ExecutionRegistryPort } from "./execution-registry-port";

export type {
  ExecutionRegistryCapabilities,
  ExecutionRegistryEntry,
  ExecutionRegistryFilter,
  ExecutionRegistryHealth,
  ExecutionRegistryIndex,
  ExecutionRegistryMetadata,
  ExecutionRegistryPortCapabilities,
  ExecutionRegistryPortHealth,
  ExecutionRegistryProviderId,
  ExecutionRegistryProviderOptions,
  ExecutionRegistryQuery,
  ExecutionRegistryRecord,
  ExecutionRegistryRecordKind,
  ExecutionRegistryReference,
  ExecutionRegistryResult,
  ExecutionRegistrySnapshot,
  ExecutionRegistryStatistics,
  ExecutionRegistryStatisticsResult,
  FindRegistryExecutionInput,
  FindRegistryExecutionResult,
  GetRegistryExecutionInput,
  GetRegistryExecutionResult,
  ListRegistryExecutionsInput,
  ListRegistryExecutionsResult,
  RegisterExecutionInput,
  RegisterExecutionResult,
  RemoveRegistryExecutionInput,
  RemoveRegistryExecutionResult,
} from "./types";

export { STRUCTURAL_REGISTRY_CAPABILITY } from "./models";

export {
  createExecutionRegistryId,
  createRegistryIndexId,
  createRegistryRecordId,
  createRegistrySnapshotId,
  resetAllExecutionRegistryIdSequences,
  resetExecutionRegistryIdSequence,
  resetRegistryIndexIdSequence,
  resetRegistryRecordIdSequence,
  resetRegistrySnapshotIdSequence,
} from "./identity";

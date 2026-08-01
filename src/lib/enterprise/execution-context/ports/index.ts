/**
 * Ports — Execution Context Foundation (EPC-24 Sprint 03).
 */
export type { ExecutionContextPort } from "./execution-context-port";

export type {
  CreateContextInput,
  CreateContextResult,
  ExecutionContext,
  ExecutionContextCapabilities,
  ExecutionContextCapability,
  ExecutionContextHealth,
  ExecutionContextHistoryEntry,
  ExecutionContextIdentity,
  ExecutionContextMetadata,
  ExecutionContextPhase,
  ExecutionContextPipelineAttachment,
  ExecutionContextProviderId,
  ExecutionContextProviderOptions,
  ExecutionContextRecord,
  ExecutionContextRecordKind,
  ExecutionContextReference,
  ExecutionContextSnapshot,
  ExecutionContextStage,
  ExecutionContextState,
  ExecutionContextStatus,
  ExecutionContextTrace,
  GetContextInput,
  GetContextResult,
  ListContextsInput,
  ListContextsResult,
  UpdateContextInput,
  UpdateContextResult,
} from "./types";

export {
  createContextId,
  createHistoryId,
  createReferenceId,
  createSnapshotId,
  createStageId,
  createTraceId,
  resetAllExecutionContextIdSequences,
  resetContextIdSequence,
  resetHistoryIdSequence,
  resetReferenceIdSequence,
  resetSnapshotIdSequence,
  resetStageIdSequence,
  resetTraceIdSequence,
} from "./identity";

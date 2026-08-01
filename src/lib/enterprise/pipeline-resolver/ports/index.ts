/**
 * Ports — Pipeline Resolver Foundation (EPC-24 Sprint 02).
 */
export type { PipelineResolverPort } from "./pipeline-resolver-port";

export type {
  GetPipelineInput,
  GetPipelineResult,
  ListPipelinesInput,
  ListPipelinesResult,
  OfficialOrchestratedPort,
  OfficialPortContract,
  OfficialPortRef,
  OfficialPortRegistry,
  OfficialPortStageDescriptor,
  PipelineCapabilities,
  PipelineDefinition,
  PipelineDependency,
  PipelineNode,
  PipelineRecord,
  PipelineRecordKind,
  PipelineResolution,
  PipelineResolutionResult,
  PipelineResolutionStatus,
  PipelineResolverCapabilities,
  PipelineResolverHealth,
  PipelineResolverProviderId,
  PipelineResolverProviderOptions,
  PipelineStage,
  PipelineStageName,
  ResolvePipelineInput,
  ResolvePipelineResult,
} from "./types";

export {
  OFFICIAL_PORT_CHAIN,
  OFFICIAL_PORT_CONTRACTS,
  OFFICIAL_PORT_REFS,
  OFFICIAL_PORT_RESOLUTION_NOTES,
} from "./official-ports";

export {
  CANONICAL_PIPELINE_ID,
  CANONICAL_PIPELINE_NAME,
  CANONICAL_PIPELINE_PORT_CONTRACTS,
  CANONICAL_PIPELINE_VERSION,
  allocatePipelineId,
  buildCanonicalPipelineDefinition,
  createStableCanonicalPipelineDefinition,
} from "./default-pipeline";

export {
  createDependencyId,
  createNodeId,
  createPipelineId,
  createResolutionId,
  createResolutionResultId,
  createStageId,
  resetAllPipelineResolverIdSequences,
  resetDependencyIdSequence,
  resetNodeIdSequence,
  resetPipelineIdSequence,
  resetResolutionIdSequence,
  resetResolutionResultIdSequence,
  resetStageIdSequence,
} from "./identity";

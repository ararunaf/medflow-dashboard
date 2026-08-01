/**
 * Enterprise Pipeline Resolver Foundation — Ports & Adapters (EPC-24 Sprint 02).
 *
 * Fluxo oficial:
 *   Application → PipelineResolverPort → PipelineResolverAdapter
 *     → PipelineResolverStore → PipelineResolverFactory
 *     → PipelineResolverProvider
 *
 * O Resolver NÃO executa OCR, IA, Mapping ou regras.
 * Apenas descobre e compõe estruturalmente o pipeline via Ports oficiais.
 *
 * Fluxo de resolução:
 *   Canonical Execution Request
 *     → Pipeline Resolver
 *     → Document Processing Port
 *     → Processing Provider Port
 *     → OCR Provider Port
 *     → TISS Mapping Port
 *     → TISS Vocabulary Port
 *     → TISS Profile Port
 *     → Healthcare Model Port
 *     → Contract Rule Binding Port
 *     → TISS Rule Runtime Port
 *     → AI Auditor Port
 *     → Canonical Execution Result
 *
 * EPC-24 Sprint 02: resolução dinâmica estrutural apenas.
 * Nenhuma etapa é executada.
 */
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
  PipelineResolverPort,
  PipelineResolverProviderId,
  PipelineResolverProviderOptions,
  PipelineStage,
  PipelineStageName,
  ResolvePipelineInput,
  ResolvePipelineResult,
} from "./ports";

export {
  CANONICAL_PIPELINE_ID,
  CANONICAL_PIPELINE_NAME,
  CANONICAL_PIPELINE_PORT_CONTRACTS,
  CANONICAL_PIPELINE_VERSION,
  OFFICIAL_PORT_CHAIN,
  OFFICIAL_PORT_CONTRACTS,
  OFFICIAL_PORT_REFS,
  OFFICIAL_PORT_RESOLUTION_NOTES,
  allocatePipelineId,
  buildCanonicalPipelineDefinition,
  createDependencyId,
  createNodeId,
  createPipelineId,
  createResolutionId,
  createResolutionResultId,
  createStableCanonicalPipelineDefinition,
  createStageId,
  resetAllPipelineResolverIdSequences,
  resetDependencyIdSequence,
  resetNodeIdSequence,
  resetPipelineIdSequence,
  resetResolutionIdSequence,
  resetResolutionResultIdSequence,
  resetStageIdSequence,
} from "./ports";

export {
  DEFAULT_PIPELINE_RESOLVER_ADAPTER_ID,
  DEFAULT_PIPELINE_RESOLVER_VERSION,
  DefaultPipelineResolverAdapter,
  MOCK_PIPELINE_RESOLVER_ADAPTER_ID,
  MOCK_PIPELINE_RESOLVER_VERSION,
  MockPipelineResolverAdapter,
  type DefaultPipelineResolverRuntime,
  type MockPipelineResolverAdapterOptions,
} from "./adapters";

export {
  DEFAULT_PIPELINE_RESOLVER_STORE_ID,
  DefaultPipelineResolverStore,
  type DefaultPipelineResolverStoreOptions,
  type PipelineResolverStore,
  type StoredPipelineDefinition,
  type StoredPipelineResolution,
} from "./store";

export {
  PipelineResolverFactory,
  createPipelineResolverFactory,
  type PipelineResolverFactoryOptions,
} from "./factory";

export { createPipelineResolverPort } from "./providers";

export { getPipelineResolverHealthSummary, type PipelineResolverHealthSummary } from "./demo";

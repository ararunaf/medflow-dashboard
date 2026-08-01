/**
 * Enterprise TISS Rule Runtime Foundation — Ports & Adapters (EPC-23).
 *
 * Fluxo oficial:
 *   Application → TISSRuleRuntimePort → TISSRuleRuntimeAdapter
 *     → TISSRuleRuntimeStore → TISSRuleRuntimeFactory → TISSRuleRuntimeProvider
 *
 * O Runtime NÃO toma decisões. NÃO interpreta regras. NÃO interpreta contratos.
 * Apenas orquestra o pipeline Enterprise.
 *
 * Pipeline canônico:
 *   Healthcare Model → TISS Profile → Contract Rule Binding → Rule Packs
 *   → Rule Engine → Expression Engine → Execution Result → AI Auditor (futuro)
 *
 * EPC-23: fundação estrutural apenas.
 * NÃO implementa regras TISS, validações ANS, contratos reais, OCR, IA,
 * parser XML, banco, APIs, UI ou migrations.
 */
export type {
  CollectResultsInput,
  CollectResultsResult,
  DispatchRulesInput,
  DispatchRulesResult,
  ExecutionMetadata,
  ExecutionPipeline,
  ExecutionRecord,
  ExecutionRecordKind,
  ExecutionResult,
  ExecutionStage,
  ExecutionStageName,
  ExecutionStatus,
  ExecutionTrace,
  ResolveBindingsInput,
  ResolveBindingsResult,
  ResolveProfileInput,
  ResolveProfileResult,
  ResolveRulePacksInput,
  ResolveRulePacksResult,
  RuntimeVersionFamily,
  StartExecutionInput,
  StartExecutionResult,
  TISSExecutionContext,
  TISSRuleRuntimeCapabilities,
  TISSRuleRuntimeHealth,
  TISSRuleRuntimePort,
  TISSRuleRuntimeProviderId,
  TISSRuleRuntimeProviderOptions,
} from "./ports";

export {
  EXECUTION_PIPELINE_STAGES,
  FUTURE_INTEGRATION_NOTES,
  RUNTIME_ORCHESTRATED_COMPONENTS,
  RUNTIME_ORCHESTRATION_PIPELINE,
  RUNTIME_STRUCTURAL_CHAIN,
  RUNTIME_VERSION_FAMILIES,
  createCanonicalPipelineStages,
  createCorrelationId,
  createExecutionId,
  createPipelineId,
  createResultId,
  createRuntimeMetadataId,
  createStageId,
  createTraceId,
  resetAllTISSRuleRuntimeIdSequences,
  resetCorrelationIdSequence,
  resetExecutionIdSequence,
  resetPipelineIdSequence,
  resetResultIdSequence,
  resetRuntimeMetadataIdSequence,
  resetStageIdSequence,
  resetTraceIdSequence,
} from "./ports";

export {
  DEFAULT_TISS_RULE_RUNTIME_ADAPTER_ID,
  DEFAULT_TISS_RULE_RUNTIME_VERSION,
  DefaultTISSRuleRuntimeAdapter,
  MOCK_TISS_RULE_RUNTIME_ADAPTER_ID,
  MOCK_TISS_RULE_RUNTIME_VERSION,
  MockTISSRuleRuntimeAdapter,
  type DefaultTISSRuleRuntimeRuntime,
  type MockTISSRuleRuntimeAdapterOptions,
} from "./adapters";

export {
  DEFAULT_TISS_RULE_RUNTIME_STORE_ID,
  DefaultTISSRuleRuntimeStore,
  type DefaultTISSRuleRuntimeStoreOptions,
  type StoredExecutionMetadata,
  type StoredExecutionPipeline,
  type StoredExecutionResult,
  type StoredExecutionTrace,
  type StoredTISSExecutionContext,
  type TISSRuleRuntimeStore,
} from "./store";

export {
  TISSRuleRuntimeFactory,
  createTISSRuleRuntimeFactory,
  type TISSRuleRuntimeFactoryOptions,
} from "./factory";

export { createTISSRuleRuntimePort } from "./providers";

export { getTISSRuleRuntimeHealthSummary, type TISSRuleRuntimeHealthSummary } from "./demo";

/**
 * Enterprise Observability Foundation — Ports & Adapters (INF-04).
 *
 * Fluxo oficial:
 *   Application → ExecutionObservabilityPort → ExecutionObservabilityAdapter
 *     → InMemoryExecutionObservabilityStore → ExecutionObservabilityFactory
 *     → ExecutionObservabilityProvider
 *
 * O Observability Foundation NÃO implementa logs reais. NÃO coleta métricas.
 * NÃO faz tracing distribuído. NÃO transmite eventos.
 * NÃO integra OpenTelemetry / Prometheus / Grafana / Azure Monitor /
 * CloudWatch / Datadog / Elastic APM.
 * NÃO acessa Engines. NÃO persiste em banco.
 * Apenas representa estruturalmente a infraestrutura de observabilidade.
 *
 * Integração com Scheduler Foundation: exclusivamente via ExecutionSchedulerPort (INF-03).
 *
 * Fluxo de orquestração:
 *   Execution Context
 *     → Message Queue (ExecutionQueuePort)
 *     → Worker Foundation (ExecutionWorkerPort)
 *     → Scheduler Foundation (ExecutionSchedulerPort)
 *     → Observability Foundation (ExecutionObservabilityPort)
 *     → Execution Context atualizado (executionObservabilityId)
 *
 * INF-04: infraestrutura estrutural apenas.
 * Nenhuma Engine é invocada. Nenhum log/métrica/trace é gerado.
 */
export type {
  CanonicalObservation,
  CanonicalObservationCapabilities,
  CanonicalObservationConfiguration,
  CanonicalObservationHealth,
  CanonicalObservationIdentity,
  CanonicalObservationMetadata,
  CanonicalObservationRecordKind,
  CanonicalObservationReference,
  CanonicalObservationStatistics,
  CanonicalObservationMetadataValue,
  ExecutionObservabilityPort,
  ExecutionObservabilityPortCapabilities,
  ExecutionObservabilityPortHealth,
  GetObservationInput,
  GetObservationResult,
  ListObservationsInput,
  ListObservationsResult,
  ObservationStatisticsResult,
  ObservabilityFoundationProviderId,
  ObservabilityFoundationProviderOptions,
  RegisterObservationInput,
  RegisterObservationResult,
  StructuralObservationLifecycleStatus,
  UnregisterObservationInput,
  UnregisterObservationResult,
} from "./ports";

export {
  STRUCTURAL_OBSERVABILITY_FOUNDATION_CAPABILITY,
  createExecutionObservabilityId,
  resetAllObservabilityFoundationIdSequences,
  resetExecutionObservabilityIdSequence,
} from "./ports";

export {
  DEFAULT_EXECUTION_OBSERVABILITY_ADAPTER_ID,
  DEFAULT_EXECUTION_OBSERVABILITY_VERSION,
  DefaultExecutionObservabilityAdapter,
  MOCK_EXECUTION_OBSERVABILITY_ADAPTER_ID,
  MOCK_EXECUTION_OBSERVABILITY_VERSION,
  MockExecutionObservabilityAdapter,
  type DefaultExecutionObservabilityRuntime,
  type MockExecutionObservabilityAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_EXECUTION_OBSERVABILITY_STORE_ID,
  InMemoryExecutionObservabilityStore,
  type ExecutionObservabilityStore,
  type InMemoryExecutionObservabilityStoreOptions,
  type StoredCanonicalObservation,
} from "./store";

export {
  ExecutionObservabilityFactory,
  createExecutionObservabilityFactory,
  type ExecutionObservabilityFactoryOptions,
} from "./factory";

export {
  ExecutionObservabilityProvider,
  createExecutionObservabilityPort,
  createExecutionObservabilityProvider,
} from "./providers";

export {
  getObservabilityFoundationHealthSummary,
  type ObservabilityFoundationHealthSummary,
} from "./demo";

export {
  AI_OBSERVABILITY_FOUNDATION_CONSUMER_ID,
  AI_OBSERVABILITY_FOUNDATION_CONSUMER_REFERENCE,
  AUDITORIA_OBSERVABILITY_FOUNDATION_CONSUMER_ID,
  AUDITORIA_OBSERVABILITY_FOUNDATION_CONSUMER_REFERENCE,
  IMPORTACAO_OBSERVABILITY_FOUNDATION_CONSUMER_ID,
  IMPORTACAO_OBSERVABILITY_FOUNDATION_CONSUMER_REFERENCE,
  OCR_PIPELINE_OBSERVABILITY_FOUNDATION_CONSUMER_ID,
  OCR_PIPELINE_OBSERVABILITY_FOUNDATION_CONSUMER_REFERENCE,
  RULE_ENGINE_OBSERVABILITY_FOUNDATION_CONSUMER_ID,
  RULE_ENGINE_OBSERVABILITY_FOUNDATION_CONSUMER_REFERENCE,
  TISS_OBSERVABILITY_FOUNDATION_CONSUMER_ID,
  TISS_OBSERVABILITY_FOUNDATION_CONSUMER_REFERENCE,
  WORKFLOW_OBSERVABILITY_FOUNDATION_CONSUMER_ID,
  WORKFLOW_OBSERVABILITY_FOUNDATION_CONSUMER_REFERENCE,
  type AiObservabilityFoundationConsumerReference,
  type AuditoriaObservabilityFoundationConsumerReference,
  type ImportacaoObservabilityFoundationConsumerReference,
  type OcrPipelineObservabilityFoundationConsumerReference,
  type RuleEngineObservabilityFoundationConsumerReference,
  type TissObservabilityFoundationConsumerReference,
  type WorkflowObservabilityFoundationConsumerReference,
} from "./consumers";

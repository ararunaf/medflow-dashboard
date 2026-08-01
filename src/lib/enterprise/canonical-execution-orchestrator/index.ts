/**
 * Enterprise Canonical Execution Orchestrator Foundation — Ports & Adapters (EPC-24).
 *
 * Fluxo oficial:
 *   Application → CanonicalExecutionOrchestratorPort → CanonicalExecutionOrchestratorAdapter
 *     → CanonicalExecutionOrchestratorStore → CanonicalExecutionOrchestratorFactory
 *     → CanonicalExecutionOrchestratorProvider
 *
 * O Orquestrador NÃO toma decisões. NÃO executa OCR, IA, Mapping ou regras.
 * Apenas coordena o pipeline Enterprise via Ports oficiais da Foundation.
 *
 * Pipeline canônico:
 *   Document Intake → Document Processing → Processing Provider → OCR Provider
 *   → TISS Mapping → TISS Vocabulary → TISS Profile → Healthcare Model
 *   → Contract Rule Binding → TISS Rule Runtime → AI Auditor
 *
 * EPC-24 Sprint 02: composição dinâmica via PipelineResolverPort.
 * EPC-24 Sprint 03: cria e utiliza exclusivamente o ExecutionContextPort.
 * EPC-24 Sprint 04: ciclo de vida estrutural via ExecutionStateMachinePort.
 * EPC-24 Sprint 05: barramento estrutural via ExecutionEventBusPort.
 * EPC-24 Sprint 06: catálogo estrutural via ExecutionRegistryPort.
 * EPC-24 Sprint 07: rastreamento estrutural via ExecutionTracePort.
 * EPC-24 Sprint 08: catálogo estrutural de capacidades via ExecutionCapabilityRegistryPort.
 * EPC-24 Sprint 09: registro estrutural de dependências via ExecutionDependencyRegistryPort.
 * EPC-24 Sprint 10: registro estrutural de políticas via ExecutionPolicyRegistryPort.
 * EPC-24 Sprint 11: registro estrutural de restrições via ExecutionConstraintRegistryPort.
 * EPC-24 Sprint 12: registro estrutural de requisitos via ExecutionRequirementRegistryPort.
 * EPC-24 Sprint 13: registro estrutural de recursos via ExecutionResourceRegistryPort.
 * EPC-24 Sprint 14: registro estrutural de ambientes via ExecutionEnvironmentRegistryPort.
 * INF-01: infraestrutura estrutural de filas via ExecutionQueuePort.
 * O Orchestrator NÃO conhece a sequência dos módulos — solicita ao Resolver.
 * O Execution Context é o único objeto de transporte da execução.
 * O ciclo de vida é obtido exclusivamente via Execution State Machine.
 * O Event Bus representa estruturalmente eventos — sem entrega nesta sprint.
 * O Registry representa estruturalmente o catálogo — sem persistência nesta sprint.
 * O Trace representa estruturalmente o rastreamento — sem logs/telemetria nesta sprint.
 * O Capability Registry representa estruturalmente capacidades — sem execução/descoberta nesta sprint.
 * O Dependency Registry representa estruturalmente dependências — sem resolução/ordenação nesta sprint.
 * O Policy Registry representa estruturalmente políticas — sem interpretação/avaliação nesta sprint.
 * O Constraint Registry representa estruturalmente restrições — sem validação/bloqueio nesta sprint.
 * O Requirement Registry representa estruturalmente requisitos — sem validação/pré-condições nesta sprint.
 * O Resource Registry representa estruturalmente recursos — sem alocação/reserva/balanceamento nesta sprint.
 * O Environment Registry representa estruturalmente ambientes — sem seleção/provisionamento/ativação nesta sprint.
 * O Message Queue representa estruturalmente filas — sem publicação/consumo/workers nesta sprint.
 * NÃO implementa regras TISS, validações ANS, OCR, IA, parser XML,
 * contratos específicos, operadoras, banco, APIs, UI ou migrations.
 */
export type {
  CanonicalExecutionContext,
  CanonicalExecutionOrchestratorCapabilities,
  CanonicalExecutionOrchestratorHealth,
  CanonicalExecutionOrchestratorPort,
  CanonicalExecutionOrchestratorProviderId,
  CanonicalExecutionOrchestratorProviderOptions,
  CanonicalExecutionRecord,
  CanonicalExecutionRecordKind,
  CanonicalExecutionRequest,
  CanonicalExecutionResult,
  CanonicalExecutionStatus,
  CanonicalExecutionStep,
  CanonicalExecutionStepName,
  CanonicalExecutionTrace,
  FoundationOrchestratedPort,
  FoundationPortContract,
  FoundationPortRef,
  FoundationPortRegistry,
  FoundationPortStepDescriptor,
  GetExecutionInput,
  GetExecutionResult,
  ListExecutionsInput,
  ListExecutionsResult,
  ExecutionContext,
  ExecutionContextPort,
  ExecutionEventBus,
  ExecutionEventBusPort,
  ExecutionLifecycle,
  ExecutionRegistryEntry,
  ExecutionRegistryPort,
  ExecutionStateMachinePort,
  ExecutionTrace,
  ExecutionTracePort,
  ExecutionCapabilityRegistry,
  ExecutionCapabilityRegistryPort,
  ExecutionDependencyRegistry,
  ExecutionDependencyRegistryPort,
  ExecutionPolicyRegistry,
  ExecutionPolicyRegistryPort,
  ExecutionConstraintRegistry,
  ExecutionConstraintRegistryPort,
  ExecutionRequirementRegistry,
  ExecutionRequirementRegistryPort,
  ExecutionResourceRegistry,
  ExecutionResourceRegistryPort,
  ExecutionEnvironmentRegistry,
  ExecutionEnvironmentRegistryPort,
  CanonicalQueue,
  ExecutionQueuePort,
  PipelineResolverPort,
  StartExecutionInput,
  StartExecutionResult,
} from "./ports";

export {
  CANONICAL_EXECUTION_STEPS,
  CANONICAL_ORCHESTRATED_COMPONENTS,
  CANONICAL_ORCHESTRATION_PIPELINE,
  CANONICAL_STRUCTURAL_CHAIN,
  FOUNDATION_PORT_CHAIN,
  FUTURE_PORT_INTEGRATION_NOTES,
  ORCHESTRATED_FOUNDATION_PORT_CONTRACTS,
  ORCHESTRATED_FOUNDATION_PORTS,
  createCanonicalExecutionSteps,
  createCorrelationId,
  createExecutionId,
  createResultId,
  createStepId,
  createTraceId,
  resetAllCanonicalExecutionIdSequences,
  resetCorrelationIdSequence,
  resetExecutionIdSequence,
  resetResultIdSequence,
  resetStepIdSequence,
  resetTraceIdSequence,
} from "./ports";

export {
  DEFAULT_CANONICAL_EXECUTION_ORCHESTRATOR_ADAPTER_ID,
  DEFAULT_CANONICAL_EXECUTION_ORCHESTRATOR_VERSION,
  DefaultCanonicalExecutionOrchestratorAdapter,
  MOCK_CANONICAL_EXECUTION_ORCHESTRATOR_ADAPTER_ID,
  MOCK_CANONICAL_EXECUTION_ORCHESTRATOR_VERSION,
  MockCanonicalExecutionOrchestratorAdapter,
  type DefaultCanonicalExecutionOrchestratorRuntime,
  type MockCanonicalExecutionOrchestratorAdapterOptions,
} from "./adapters";

export {
  DEFAULT_CANONICAL_EXECUTION_ORCHESTRATOR_STORE_ID,
  DefaultCanonicalExecutionOrchestratorStore,
  type CanonicalExecutionOrchestratorStore,
  type DefaultCanonicalExecutionOrchestratorStoreOptions,
  type StoredCanonicalExecutionContext,
  type StoredCanonicalExecutionResult,
  type StoredCanonicalExecutionTrace,
} from "./store";

export {
  CanonicalExecutionOrchestratorFactory,
  createCanonicalExecutionOrchestratorFactory,
  type CanonicalExecutionOrchestratorFactoryOptions,
} from "./factory";

export { createCanonicalExecutionOrchestratorPort } from "./providers";

export {
  getCanonicalExecutionOrchestratorHealthSummary,
  type CanonicalExecutionOrchestratorHealthSummary,
} from "./demo";

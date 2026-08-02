/**
 * Enterprise Health Center Foundation — Ports & Adapters (INF-05).
 *
 * Fluxo oficial:
 *   Application → ExecutionHealthCenterPort → ExecutionHealthCenterAdapter
 *     → InMemoryExecutionHealthCenterStore → ExecutionHealthCenterFactory
 *     → ExecutionHealthCenterProvider
 *
 * O Health Center Foundation NÃO implementa monitoramento real.
 * NÃO executa health checks reais. NÃO faz polling. NÃO renderiza dashboards.
 * NÃO executa diagnósticos. NÃO consulta componentes, filas, workers, banco
 * ou serviços externos. NÃO consulta Observability observations.
 * NÃO acessa Engines. NÃO persiste em banco.
 * Apenas representa estruturalmente a infraestrutura de Health Center.
 *
 * Integração com Observability Foundation: exclusivamente via ExecutionObservabilityPort (INF-04).
 *
 * Fluxo de orquestração:
 *   Execution Context
 *     → Message Queue (ExecutionQueuePort)
 *     → Worker Foundation (ExecutionWorkerPort)
 *     → Scheduler Foundation (ExecutionSchedulerPort)
 *     → Observability Foundation (ExecutionObservabilityPort)
 *     → Health Center Foundation (ExecutionHealthCenterPort)
 *     → Execution Context atualizado (executionHealthCenterId)
 *
 * INF-05: infraestrutura estrutural apenas.
 * Nenhuma Engine é invocada. Nenhum monitoramento/health check real é executado.
 */
export type {
  CanonicalHealthComponent,
  CanonicalHealthComponentCapabilities,
  CanonicalHealthComponentConfiguration,
  CanonicalHealthComponentHealth,
  CanonicalHealthComponentIdentity,
  CanonicalHealthComponentRecordKind,
  CanonicalHealthComponentReference,
  CanonicalHealthComponentStatistics,
  CanonicalHealthComponentStatus,
  CanonicalHealthComponentStatusValue,
  ComponentStatisticsResult,
  ExecutionHealthCenterPort,
  ExecutionHealthCenterPortCapabilities,
  ExecutionHealthCenterPortHealth,
  GetComponentInput,
  GetComponentResult,
  HealthCenterFoundationProviderId,
  HealthCenterFoundationProviderOptions,
  ListComponentsInput,
  ListComponentsResult,
  RegisterComponentInput,
  RegisterComponentResult,
  StructuralHealthComponentKey,
  StructuralHealthComponentLifecycleStatus,
  StructuralMonitorableComponentCatalogEntry,
  UnregisterComponentInput,
  UnregisterComponentResult,
} from "./ports";

export {
  STRUCTURAL_HEALTH_CENTER_FOUNDATION_CAPABILITY,
  STRUCTURAL_MONITORABLE_COMPONENT_CATALOG,
  createExecutionHealthCenterId,
  createHealthComponentId,
  resetAllHealthCenterFoundationIdSequences,
  resetExecutionHealthCenterIdSequence,
  resetHealthComponentIdSequence,
} from "./ports";

export {
  DEFAULT_EXECUTION_HEALTH_CENTER_ADAPTER_ID,
  DEFAULT_EXECUTION_HEALTH_CENTER_VERSION,
  DefaultExecutionHealthCenterAdapter,
  MOCK_EXECUTION_HEALTH_CENTER_ADAPTER_ID,
  MOCK_EXECUTION_HEALTH_CENTER_VERSION,
  MockExecutionHealthCenterAdapter,
  type DefaultExecutionHealthCenterRuntime,
  type MockExecutionHealthCenterAdapterOptions,
} from "./adapters";

export {
  IN_MEMORY_EXECUTION_HEALTH_CENTER_STORE_ID,
  InMemoryExecutionHealthCenterStore,
  type ExecutionHealthCenterStore,
  type InMemoryExecutionHealthCenterStoreOptions,
  type StoredCanonicalHealthComponent,
} from "./store";

export {
  ExecutionHealthCenterFactory,
  createExecutionHealthCenterFactory,
  type ExecutionHealthCenterFactoryOptions,
} from "./factory";

export {
  ExecutionHealthCenterProvider,
  createExecutionHealthCenterPort,
  createExecutionHealthCenterProvider,
} from "./providers";

export {
  getHealthCenterFoundationHealthSummary,
  type HealthCenterFoundationHealthSummary,
} from "./demo";

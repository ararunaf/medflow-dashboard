/**
 * Tipos vendor-agnósticos do Health Center Foundation — INF-05 Health Center Foundation.
 *
 * Representa estruturalmente a infraestrutura de Health Center Enterprise.
 * NÃO implementa monitoramento real. NÃO executa health checks reais.
 * NÃO faz polling. NÃO renderiza dashboards. NÃO executa diagnósticos.
 * NÃO consulta componentes, filas, workers, banco ou serviços externos.
 *
 * Arquitetura obrigatória (ECS-01):
 *   Application → ExecutionHealthCenterPort → Adapter → Store → Factory → Provider
 *
 * Integração com Observability Foundation: exclusivamente via ExecutionObservabilityPort (INF-04).
 */
import type {
  CanonicalHealthComponent,
  CanonicalHealthComponentHealth,
  CanonicalHealthComponentStatistics,
  CanonicalHealthComponentStatusValue,
} from "./models";

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
  StructuralHealthComponentKey,
  StructuralMonitorableComponentCatalogEntry,
} from "./models";

/* ─────────────────────────────────────────────────────────────────────────
 * Mecanismo do Port (adapter id)
 * ───────────────────────────────────────────────────────────────────────── */

/** Provedores / mecanismos do Health Center Foundation (extensível). */
export type HealthCenterFoundationProviderId = "default" | "mock" | "test";

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — getComponent / registerComponent / unregisterComponent
 * ───────────────────────────────────────────────────────────────────────── */

/** Entrada estrutural de obtenção / criação de Health Component. */
export type GetComponentInput = {
  healthComponentId?: string;
  executionHealthCenterId?: string;
  executionId?: string;
  correlationId?: string;
  contextId?: string;
  stateMachineId?: string;
  eventBusId?: string;
  executionRegistryId?: string;
  executionTraceId?: string;
  executionCapabilityRegistryId?: string;
  executionDependencyRegistryId?: string;
  executionPolicyRegistryId?: string;
  executionConstraintRegistryId?: string;
  executionRequirementRegistryId?: string;
  executionResourceRegistryId?: string;
  executionEnvironmentRegistryId?: string;
  executionMessageQueueId?: string;
  executionWorkerId?: string;
  executionSchedulerId?: string;
  executionObservabilityId?: string;
  pipelineId?: string;
  key?: string;
  name?: string;
  /** Se true (default), cria Component estrutural quando inexistente. */
  createIfMissing?: boolean;
  tags?: readonly string[];
  version?: string;
  structuralNotes?: string;
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
  references?: readonly {
    name: string;
    value: string;
    notes?: string;
  }[];
};

export type GetComponentResult = {
  ok: boolean;
  component?: CanonicalHealthComponent;
  message?: string;
  code?: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  monitoringPerformed: false;
  healthCheckPerformed: false;
  probingPerformed: false;
  diagnosticsExecuted: false;
  pollingPerformed: false;
  dashboardRendered: false;
  externalQueryPerformed: false;
  componentConsulted: false;
  externalIntegrationUsed: false;
  processingPerformed: false;
  realHealthBackend: false;
};

export type RegisterComponentInput = GetComponentInput;

export type RegisterComponentResult = GetComponentResult;

export type UnregisterComponentInput = {
  healthComponentId: string;
};

export type UnregisterComponentResult = {
  ok: boolean;
  component?: CanonicalHealthComponent;
  message?: string;
  code?: string;
  monitoringPerformed: false;
  healthCheckPerformed: false;
  probingPerformed: false;
  diagnosticsExecuted: false;
  pollingPerformed: false;
  dashboardRendered: false;
  externalQueryPerformed: false;
  componentConsulted: false;
  externalIntegrationUsed: false;
  processingPerformed: false;
  realHealthBackend: false;
  enginesInvoked: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — listComponents
 * ───────────────────────────────────────────────────────────────────────── */

export type ListComponentsInput = {
  executionId?: string;
  executionHealthCenterId?: string;
  limit?: number;
};

export type ListComponentsResult = {
  ok: boolean;
  components: readonly CanonicalHealthComponent[];
  message?: string;
  code?: string;
  monitoringPerformed: false;
  healthCheckPerformed: false;
  probingPerformed: false;
  diagnosticsExecuted: false;
  pollingPerformed: false;
  dashboardRendered: false;
  externalQueryPerformed: false;
  componentConsulted: false;
  externalIntegrationUsed: false;
  processingPerformed: false;
  realHealthBackend: false;
  enginesInvoked: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Health / Capabilities / Statistics / Provider options
 * ───────────────────────────────────────────────────────────────────────── */

export type ExecutionHealthCenterPortHealth = {
  ok: boolean;
  provider: HealthCenterFoundationProviderId;
  latencyMs?: number;
  message?: string;
  storedComponentCount?: number;
  storedReferenceCount?: number;
  storedHealthCenterCount?: number;
  structuralHealth?: CanonicalHealthComponentHealth;
};

/**
 * Capacidades do ExecutionHealthCenterPort.
 * Declara explicitamente o que a fundação NÃO faz.
 */
export type ExecutionHealthCenterPortCapabilities = {
  provider: HealthCenterFoundationProviderId;
  adapterId: string;
  supportsRegisterComponent: true;
  supportsUnregisterComponent: true;
  supportsGetComponent: true;
  supportsListComponents: true;
  supportsStatistics: true;
  supportsHealth: true;
  supportsCapabilities: true;
  /** Health Center Foundation estrutural exclusivamente — sem monitoramento real. */
  structuralHealthCenterOnly: true;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  monitoringPerformed: false;
  healthCheckPerformed: false;
  probingPerformed: false;
  diagnosticsExecuted: false;
  pollingPerformed: false;
  dashboardRendered: false;
  externalQueryPerformed: false;
  componentConsulted: false;
  externalIntegrationUsed: false;
  realHealthBackend: false;
  implementsOcr: false;
  implementsAi: false;
  implementsTiss: false;
  implementsXmlParser: false;
  implementsPersistence: false;
  implementsUi: false;
  implementsHttpHealth: false;
  implementsRealMonitoring: false;
  implementsRealHealthChecks: false;
  /** Conhece exclusivamente ExecutionObservabilityPort (INF-04). */
  usesExecutionObservabilityPortOnly: true;
  noDirectEngineCoupling: true;
  /** Desacoplado de Engines (OCR / IA / Rule / Mapping / TISS). */
  decoupledFromEngines: true;
};

export type ComponentStatisticsResult = {
  ok: boolean;
  statistics?: CanonicalHealthComponentStatistics;
  message?: string;
  code?: string;
};

/** Opções de resolução do ExecutionHealthCenterPort (provider factory). */
export type HealthCenterFoundationProviderOptions = {
  /**
   * Mecanismo desejado. Default de produção da fundação: `default`
   * (DefaultExecutionHealthCenterAdapter).
   */
  provider?: HealthCenterFoundationProviderId;
};

/** Status transition helper type (estrutural). */
export type StructuralHealthComponentLifecycleStatus = Extract<
  CanonicalHealthComponentStatusValue,
  "registered-structural" | "unregistered-structural"
>;

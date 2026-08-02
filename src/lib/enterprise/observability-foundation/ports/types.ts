/**
 * Tipos vendor-agnósticos do Observability Foundation — INF-04 Observability Foundation.
 *
 * Representa estruturalmente a infraestrutura de observabilidade Enterprise.
 * NÃO implementa logs reais. NÃO coleta métricas. NÃO faz tracing.
 * NÃO integra OpenTelemetry / Prometheus / Grafana / Azure Monitor /
 * CloudWatch / Datadog / Elastic APM. NÃO transmite eventos.
 *
 * Arquitetura obrigatória (ECS-01):
 *   Application → ExecutionObservabilityPort → Adapter → Store → Factory → Provider
 *
 * Integração com Scheduler Foundation: exclusivamente via ExecutionSchedulerPort (INF-03).
 */
import type {
  CanonicalObservation,
  CanonicalObservationHealth,
  CanonicalObservationStatistics,
  CanonicalObservationMetadataValue,
} from "./models";

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
} from "./models";

/* ─────────────────────────────────────────────────────────────────────────
 * Mecanismo do Port (adapter id)
 * ───────────────────────────────────────────────────────────────────────── */

/** Provedores / mecanismos do Observability Foundation (extensível). */
export type ObservabilityFoundationProviderId = "default" | "mock" | "test";

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — getObservation / registerObservation / unregisterObservation
 * ───────────────────────────────────────────────────────────────────────── */

/** Entrada estrutural de obtenção / criação de Observation. */
export type GetObservationInput = {
  executionObservabilityId?: string;
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
  pipelineId?: string;
  key?: string;
  name?: string;
  /** Se true (default), cria Observation estrutural quando inexistente. */
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

export type GetObservationResult = {
  ok: boolean;
  observation?: CanonicalObservation;
  message?: string;
  code?: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  loggingPerformed: false;
  metricsCollected: false;
  tracingPerformed: false;
  eventsTransmitted: false;
  externalIntegrationUsed: false;
  processingPerformed: false;
  realObservabilityBackend: false;
};

export type RegisterObservationInput = GetObservationInput;

export type RegisterObservationResult = GetObservationResult;

export type UnregisterObservationInput = {
  executionObservabilityId: string;
};

export type UnregisterObservationResult = {
  ok: boolean;
  observation?: CanonicalObservation;
  message?: string;
  code?: string;
  loggingPerformed: false;
  metricsCollected: false;
  tracingPerformed: false;
  eventsTransmitted: false;
  externalIntegrationUsed: false;
  processingPerformed: false;
  realObservabilityBackend: false;
  enginesInvoked: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — listObservations
 * ───────────────────────────────────────────────────────────────────────── */

export type ListObservationsInput = {
  executionId?: string;
  limit?: number;
};

export type ListObservationsResult = {
  ok: boolean;
  observations: readonly CanonicalObservation[];
  message?: string;
  code?: string;
  loggingPerformed: false;
  metricsCollected: false;
  tracingPerformed: false;
  eventsTransmitted: false;
  externalIntegrationUsed: false;
  processingPerformed: false;
  realObservabilityBackend: false;
  enginesInvoked: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Health / Capabilities / Statistics / Provider options
 * ───────────────────────────────────────────────────────────────────────── */

export type ExecutionObservabilityPortHealth = {
  ok: boolean;
  provider: ObservabilityFoundationProviderId;
  latencyMs?: number;
  message?: string;
  storedObservationCount?: number;
  storedReferenceCount?: number;
  structuralHealth?: CanonicalObservationHealth;
};

/**
 * Capacidades do ExecutionObservabilityPort.
 * Declara explicitamente o que a fundação NÃO faz.
 */
export type ExecutionObservabilityPortCapabilities = {
  provider: ObservabilityFoundationProviderId;
  adapterId: string;
  supportsRegisterObservation: true;
  supportsUnregisterObservation: true;
  supportsGetObservation: true;
  supportsListObservations: true;
  supportsStatistics: true;
  supportsHealth: true;
  supportsCapabilities: true;
  /** Observability Foundation estrutural exclusivamente — sem monitoramento real. */
  structuralObservabilityOnly: true;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  loggingPerformed: false;
  metricsCollected: false;
  tracingPerformed: false;
  eventsTransmitted: false;
  externalIntegrationUsed: false;
  realObservabilityBackend: false;
  implementsOcr: false;
  implementsAi: false;
  implementsTiss: false;
  implementsXmlParser: false;
  implementsOpenTelemetry: false;
  implementsPrometheus: false;
  implementsGrafana: false;
  implementsAzureMonitor: false;
  implementsCloudWatch: false;
  implementsDatadog: false;
  implementsElasticApm: false;
  implementsPersistence: false;
  implementsUi: false;
  implementsHttpObservability: false;
  /** Conhece exclusivamente ExecutionSchedulerPort (INF-03). */
  usesExecutionSchedulerPortOnly: true;
  noDirectEngineCoupling: true;
  /** Desacoplado de Engines (OCR / IA / Rule / Mapping / TISS). */
  decoupledFromEngines: true;
};

export type ObservationStatisticsResult = {
  ok: boolean;
  statistics?: CanonicalObservationStatistics;
  message?: string;
  code?: string;
};

/** Opções de resolução do ExecutionObservabilityPort (provider factory). */
export type ObservabilityFoundationProviderOptions = {
  /**
   * Mecanismo desejado. Default de produção da fundação: `default`
   * (DefaultExecutionObservabilityAdapter).
   */
  provider?: ObservabilityFoundationProviderId;
};

/** Status transition helper type (estrutural). */
export type StructuralObservationLifecycleStatus = Extract<
  CanonicalObservationMetadataValue,
  "registered-structural" | "unregistered-structural"
>;

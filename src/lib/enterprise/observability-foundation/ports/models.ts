/**
 * Modelos canônicos do Observability Foundation — INF-04 Observability Foundation.
 *
 * Representação estrutural da infraestrutura de observabilidade Enterprise.
 * Sem regras de negócio. Sem OCR. Sem IA. Sem Mapping. Sem parsers.
 * Sem banco. Sem persistência real. Sem logs reais. Sem métricas reais.
 * Sem tracing distribuído. Sem OpenTelemetry / Prometheus / Grafana /
 * Azure Monitor / CloudWatch / Datadog / Elastic APM.
 * Sem Engines. Sem acesso externo. Sem transmissão de eventos.
 */

/* ─────────────────────────────────────────────────────────────────────────
 * Types / kinds
 * ───────────────────────────────────────────────────────────────────────── */

/** Kinds de registros canônicos do Observability Foundation. */
export type CanonicalObservationRecordKind =
  | "canonical-observation"
  | "canonical-observation-identity"
  | "canonical-observation-metadata"
  | "canonical-observation-reference"
  | "canonical-observation-configuration"
  | "canonical-observation-capabilities"
  | "canonical-observation-statistics"
  | "canonical-observation-health";

/** Valor estrutural opaco de metadata/status (sem monitoramento real). */
export type CanonicalObservationMetadataValue =
  | "structural"
  | "registered-structural"
  | "unregistered-structural"
  | "unknown";

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalObservationIdentity
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Identidade estrutural de uma Observation.
 * Sem identidade de runtime real / sem correlação de telemetria.
 */
export type CanonicalObservationIdentity = {
  kind: "canonical-observation-identity";
  executionObservabilityId: string;
  key: string;
  name: string;
  version?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalObservationMetadata
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Metadata estrutural da Observation.
 * Declara estado opaco — sem logs, sem métricas, sem tracing, sem transmissão.
 */
export type CanonicalObservationMetadata = {
  kind: "canonical-observation-metadata";
  value: CanonicalObservationMetadataValue;
  updatedAt: string;
  notes?: string;
  /** Observabilidade real NÃO ocorre nesta sprint. */
  loggingPerformed: false;
  metricsCollected: false;
  tracingPerformed: false;
  eventsTransmitted: false;
  externalIntegrationUsed: false;
  processingPerformed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalObservationReference
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Referência estrutural opaca anexada a uma Observation.
 * Sem conteúdo de negócio.
 */
export type CanonicalObservationReference = {
  kind: "canonical-observation-reference";
  name: string;
  value: string;
  notes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalObservationConfiguration
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Configuração estrutural da Observation.
 * Declara o contrato opaco — sem backends reais de observabilidade.
 */
export type CanonicalObservationConfiguration = {
  kind: "canonical-observation-configuration";
  key: string;
  name: string;
  version?: string;
  description?: string;
  portRef?: string;
  portContract?: string;
  /** Port exclusivo do Scheduler Foundation conhecido pela Observability. */
  schedulerPortContract: "ExecutionSchedulerPort";
  notes?: string;
  /** Backend real NÃO está conectado nesta sprint. */
  backendConnected: false;
  loggingPerformed: false;
  metricsCollected: false;
  tracingPerformed: false;
  eventsTransmitted: false;
  externalIntegrationUsed: false;
  processingPerformed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalObservationCapabilities
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Capacidades estruturais declaradas pelo Observability Foundation.
 * Explicitamente sem logs / métricas / tracing / Engines / backends externos.
 */
export type CanonicalObservationCapabilities = {
  kind: "canonical-observation-capabilities";
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
  decoupledFromEngines: true;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalObservation
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Observation canônica estrutural.
 * Representa a infraestrutura de observabilidade — sem logs, métricas ou tracing.
 */
export type CanonicalObservation = {
  kind: "canonical-observation";
  id: string;
  /** Alias (= id da observation). Anexado ao Execution Context. */
  executionObservabilityId: string;
  identity: CanonicalObservationIdentity;
  metadata: CanonicalObservationMetadata;
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
  /** Referência estrutural ao Scheduler Foundation (via ExecutionSchedulerPort apenas). */
  executionSchedulerId?: string;
  pipelineId?: string;
  configuration: CanonicalObservationConfiguration;
  references: readonly CanonicalObservationReference[];
  capability: CanonicalObservationCapabilities;
  createdAt: string;
  updatedAt: string;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  loggingPerformed: false;
  metricsCollected: false;
  tracingPerformed: false;
  eventsTransmitted: false;
  externalIntegrationUsed: false;
  realObservabilityBackend: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalObservationStatistics
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Estatísticas estruturais do store in-memory.
 * Sem métricas de negócio / sem analytics / sem throughput real.
 */
export type CanonicalObservationStatistics = {
  kind: "canonical-observation-statistics";
  totalObservations: number;
  totalReferences: number;
  computedAt: string;
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

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalObservationHealth
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Saúde estrutural do Observability Foundation (modelo canônico).
 * Distinto do health do Port (types) — aqui é representação estrutural.
 */
export type CanonicalObservationHealth = {
  kind: "canonical-observation-health";
  ok: boolean;
  message?: string;
  observationCount: number;
  indexReady: true;
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
  checkedAt: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Catálogo estrutural
 * ───────────────────────────────────────────────────────────────────────── */

/** Capacidades canônicas embutidas em toda entrada do Observability Foundation. */
export const STRUCTURAL_OBSERVABILITY_FOUNDATION_CAPABILITY: CanonicalObservationCapabilities = {
  kind: "canonical-observation-capabilities",
  structuralObservabilityOnly: true,
  persistenceImplemented: false,
  databaseUsed: false,
  enginesInvoked: false,
  stagesExecuted: false,
  processingPerformed: false,
  loggingPerformed: false,
  metricsCollected: false,
  tracingPerformed: false,
  eventsTransmitted: false,
  externalIntegrationUsed: false,
  realObservabilityBackend: false,
  implementsOcr: false,
  implementsAi: false,
  implementsTiss: false,
  implementsXmlParser: false,
  implementsOpenTelemetry: false,
  implementsPrometheus: false,
  implementsGrafana: false,
  implementsAzureMonitor: false,
  implementsCloudWatch: false,
  implementsDatadog: false,
  implementsElasticApm: false,
  implementsPersistence: false,
  implementsUi: false,
  implementsHttpObservability: false,
  usesExecutionSchedulerPortOnly: true,
  noDirectEngineCoupling: true,
  decoupledFromEngines: true,
};

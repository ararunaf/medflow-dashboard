/**
 * Tipos vendor-agnósticos do Enterprise Scalability Runtime — INF-10.
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → ScalabilityRuntimePort
 *     → Adapter → Scalability Runtime Store → Canonical Scalability Result
 *
 * Sem backends de escalabilidade reais. Sem OpenTelemetry/App Insights/Prometheus/Grafana.
 * Sem scaling/cluster/failover/sharding reais.
 */
import type { QueueRuntimePort } from "../../queue-runtime/ports/queue-runtime-port";
import type { WorkerRuntimePort } from "../../worker-runtime/ports/worker-runtime-port";
import type { SchedulerRuntimePort } from "../../scheduler-runtime/ports/scheduler-runtime-port";
import type { PersistentQueueRuntimePort } from "../../persistent-queue-runtime/ports/persistent-queue-runtime-port";
import type { ObservabilityRuntimePort } from "../../observability-runtime/ports/observability-runtime-port";
import type { TISSRuntimePort } from "../../tiss-runtime/ports/tiss-runtime-port";
import type {
  CanonicalScalabilityScope,
  CanonicalScalabilityCapabilities,
  CanonicalScalabilityEnvelope,
  CanonicalScalabilityHealth,
  CanonicalScalabilitySignal,
  CanonicalScalabilityMetadata,
  CanonicalScalabilityResult,
  CanonicalScalabilityStatistics,
} from "./canonical";
import type { ScalabilityRuntimeCapabilities } from "./capabilities";

export type {
  CanonicalScalabilityScope,
  CanonicalScalabilityCapabilities,
  CanonicalScalabilityEnvelope,
  CanonicalScalabilityHealth,
  CanonicalScalabilityIdentity,
  CanonicalScalabilitySignal,
  CanonicalScalabilityMetadata,
  CanonicalScalabilityOperation,
  CanonicalScalabilityProvider,
  CanonicalScalabilityResult,
  CanonicalScalabilityStatistics,
  CanonicalScalabilityStatus,
} from "./canonical";
export type { ScalabilityRuntimeCapabilities };

/** Provedores / mecanismos do Scalability Runtime. */
export type ScalabilityRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry. */
export type ScalabilityRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado (NÃO é telemetria real). */
export type ScalabilityRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido (NÃO é logging real). */
export type ScalabilityRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: ScalabilityRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/** Resultado de health check. */
export type ScalabilityRuntimeHealth = CanonicalScalabilityHealth & {
  provider: ScalabilityRuntimeProviderId;
  status?: ScalabilityRuntimeStatus;
};

/** Capacidades do adapter no nível do Port. */
export type ScalabilityRuntimePortCapabilities = {
  provider: ScalabilityRuntimeProviderId;
  adapterId: string;
  engine: ScalabilityRuntimeCapabilities;
  canonical: CanonicalScalabilityCapabilities;
  supportsCanonicalScalability: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  usesQueueRuntimePort: boolean;
  usesWorkerRuntimePort: boolean;
  usesSchedulerRuntimePort: boolean;
  usesPersistentQueueRuntimePort: boolean;
  usesObservabilityRuntimePort: boolean;
  usesTISSRuntimePort: boolean;
  runtimeReady: true;
  realScalabilityBackend: false;
  kubernetesImplemented: false;
  dockerSwarmImplemented: false;
  azureScaleSetImplemented: false;
  horizontalPodAutoscalerImplemented: false;
  autoScalingImplemented: false;
  clusterImplemented: false;
  loadBalancerImplemented: false;
  failoverImplemented: false;
  shardingImplemented: false;
  partitioningImplemented: false;
  horizontalScalingImplemented: false;
  verticalScalingImplemented: false;
  nodeManagementImplemented: false;
  highAvailabilityImplemented: false;
  elasticScalingImplemented: false;
  capacityPlanningImplemented: false;
  realScalabilityOrchestrationImplemented: false;
  realDistributedProcessingImplemented: false;
  realExternalIntegrationImplemented: false;
  implementsKubernetes: false;
  implementsDockerSwarm: false;
  implementsAzureScaleSet: false;
  implementsHorizontalPodAutoscaler: false;
  implementsAutoScaling: false;
  implementsCluster: false;
  implementsLoadBalancer: false;
  implementsFailover: false;
  implementsSharding: false;
  implementsPartitioning: false;
  implementsHorizontalScaling: false;
  implementsVerticalScaling: false;
  implementsNodeManagement: false;
  implementsHighAvailability: false;
  implementsElasticScaling: false;
  implementsCapacityPlanning: false;
  implementsRealScalabilityOrchestration: false;
  implementsRealDistributedProcessing: false;
  implementsRealExternalIntegration: false;
  implementsRealScalabilityBackend: false;
  implementsHttp: false;
  implementsWebsocket: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsTissPattern: false;
};

/** Metadados estáveis do provedor. */
export type ScalabilityRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
};

/** Info agregada retornada por providerInfo(). */
export type ScalabilityRuntimeInfo = {
  providerId: ScalabilityRuntimeProviderId;
  metadata: ScalabilityRuntimeProviderMetadata;
  status: ScalabilityRuntimeStatus;
  providerType: "SCALABILITY_RUNTIME";
  capabilities: ScalabilityRuntimeCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel). */
export type ScalabilityRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional. */
export type ScalabilityRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: ScalabilityRuntimeProviderId;
  telemetry: ScalabilityRuntimeTelemetry;
  logs?: readonly ScalabilityRuntimeStructuredLog[];
  simulated?: boolean;
};

export type RegisterScalabilityScopeInput = ScalabilityRuntimeOperationalControls & {
  scopeName?: string;
  scopeId?: string;
  correlationId?: string | null;
  metadata?: CanonicalScalabilityMetadata;
};

export type RegisterScalabilityScopeResult = ScalabilityRuntimeOperationEnvelope & {
  result?: CanonicalScalabilityResult;
  scope?: CanonicalScalabilityScope;
};

export type UnregisterScalabilityScopeInput = ScalabilityRuntimeOperationalControls & {
  scopeId: string;
};

export type UnregisterScalabilityScopeResult = ScalabilityRuntimeOperationEnvelope & {
  result?: CanonicalScalabilityResult;
  scope?: CanonicalScalabilityScope;
};

export type ObserveSignalInput = ScalabilityRuntimeOperationalControls & {
  scopeId?: string;
  scopeName?: string;
  signalId?: string;
  metadata?: CanonicalScalabilityMetadata;
};

export type ObserveSignalResult = ScalabilityRuntimeOperationEnvelope & {
  result?: CanonicalScalabilityResult;
  scope?: CanonicalScalabilityScope;
  /** Nome distinto de OperationEnvelope.message (texto). */
  scalabilitySignal?: CanonicalScalabilitySignal;
  envelope?: CanonicalScalabilityEnvelope;
};

export type ReleaseSignalInput = ScalabilityRuntimeOperationalControls & {
  scopeId: string;
  signalId?: string;
};

export type ReleaseSignalResult = ScalabilityRuntimeOperationEnvelope & {
  result?: CanonicalScalabilityResult;
  scope?: CanonicalScalabilityScope;
  /** Nome distinto de OperationEnvelope.message (texto). */
  scalabilitySignal?: CanonicalScalabilitySignal;
};

export type ListScalabilityScopesInput = ScalabilityRuntimeOperationalControls & {
  scopeId?: string;
  activeOnly?: boolean;
};

export type ListScalabilityScopesResult = ScalabilityRuntimeOperationEnvelope & {
  scopes?: readonly CanonicalScalabilityScope[];
  signals?: readonly CanonicalScalabilitySignal[];
  result?: CanonicalScalabilityResult;
};

export type ScalabilityStatsInput = ScalabilityRuntimeOperationalControls & {
  scopeId?: string;
};

export type ScalabilityStatsResult = ScalabilityRuntimeOperationEnvelope & {
  statistics?: CanonicalScalabilityStatistics;
  result?: CanonicalScalabilityResult;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * Queue + Worker + Scheduler + Persistent Queue + Observability + TISS Runtime são dependências
 * obrigatórias preparadas — NÃO consumidas nesta sprint.
 */
export type ScalabilityRuntimeEnterpriseDeps = {
  getQueueRuntimePort(): QueueRuntimePort;
  getWorkerRuntimePort(): WorkerRuntimePort;
  getSchedulerRuntimePort(): SchedulerRuntimePort;
  getPersistentQueueRuntimePort(): PersistentQueueRuntimePort;
  getObservabilityRuntimePort(): ObservabilityRuntimePort;
  getTISSRuntimePort(): TISSRuntimePort;
};

/** Opções de resolução do ScalabilityRuntimePort. */
export type ScalabilityRuntimeOptions = {
  /**
   * Provedor desejado. Default da fundação: `enterprise` (INF-10).
   */
  provider?: ScalabilityRuntimeProviderId;
  enterpriseDeps?: ScalabilityRuntimeEnterpriseDeps;
};

/** Entrada de registro no ScalabilityRuntimeRegistry. */
export type ScalabilityRuntimeRegistration = {
  providerId: ScalabilityRuntimeProviderId;
  name: string;
  version: string;
  status: ScalabilityRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: ScalabilityRuntimeCapabilities;
  description?: string;
};

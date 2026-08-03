/**
 * Tipos vendor-agnósticos do Enterprise Worker Runtime — INF-06.
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → WorkerRuntimePort
 *     → Adapter → Worker Runtime Store → Canonical Worker Result
 *
 * Sem Workers reais. Sem Thread Pool. Sem Scheduler. Sem backends de fila.
 */
import type { PersistentQueueRuntimePort } from "../../persistent-queue-runtime/ports/persistent-queue-runtime-port";
import type { ObservabilityRuntimePort } from "../../observability-runtime/ports/observability-runtime-port";
import type { ScalabilityRuntimePort } from "../../scalability-runtime/ports/scalability-runtime-port";
import type { QueueRuntimePort } from "../../queue-runtime/ports/queue-runtime-port";
import type { SchedulerRuntimePort } from "../../scheduler-runtime/ports/scheduler-runtime-port";
import type {
  CanonicalWorker,
  CanonicalWorkerCapabilities,
  CanonicalWorkerExecution,
  CanonicalWorkerHealth,
  CanonicalWorkerMetadata,
  CanonicalWorkerResult,
  CanonicalWorkerStatistics,
  CanonicalWorkerTask,
} from "./canonical";
import type { WorkerRuntimeCapabilities } from "./capabilities";

export type {
  CanonicalWorker,
  CanonicalWorkerCapabilities,
  CanonicalWorkerExecution,
  CanonicalWorkerHealth,
  CanonicalWorkerIdentity,
  CanonicalWorkerMetadata,
  CanonicalWorkerOperation,
  CanonicalWorkerProvider,
  CanonicalWorkerResult,
  CanonicalWorkerStatistics,
  CanonicalWorkerStatus,
  CanonicalWorkerTask,
} from "./canonical";
export type { WorkerRuntimeCapabilities };

/** Provedores / mecanismos do Worker Runtime. */
export type WorkerRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry. */
export type WorkerRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado. */
export type WorkerRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido. */
export type WorkerRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: WorkerRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/** Resultado de health check. */
export type WorkerRuntimeHealth = CanonicalWorkerHealth & {
  provider: WorkerRuntimeProviderId;
  status?: WorkerRuntimeStatus;
};

/** Capacidades do adapter no nível do Port. */
export type WorkerRuntimePortCapabilities = {
  provider: WorkerRuntimeProviderId;
  adapterId: string;
  engine: WorkerRuntimeCapabilities;
  canonical: CanonicalWorkerCapabilities;
  supportsCanonicalWorker: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  usesQueueRuntimePort: boolean;
  /** INF-07 — dependência Scheduler Runtime preparada (sem consumo). */
  usesSchedulerRuntimePort: boolean;
  /** INF-08 — dependência Persistent Queue Runtime preparada (sem consumo). */
  usesPersistentQueueRuntimePort: boolean;
  /** INF-09 — dependência Observability Runtime preparada (sem consumo). */
  usesObservabilityRuntimePort: boolean;
  /** INF-10 — dependência Scalability Runtime preparada (sem consumo). */
  usesScalabilityRuntimePort: boolean;
  runtimeReady: true;
  realWorkers: false;
  tasksExecuted: false;
  parallelProcessing: false;
  schedulerImplemented: false;
  threadPoolImplemented: false;
  persistenceImplemented: false;
  queueConsumed: false;
  implementsRabbitMq: false;
  implementsKafka: false;
  implementsAzureServiceBus: false;
  implementsAzureQueue: false;
  implementsRedis: false;
  implementsBullMq: false;
  implementsRealWorkers: false;
  implementsScheduler: false;
  implementsThreadPool: false;
  implementsCron: false;
  implementsDeadLetter: false;
  implementsRetryReal: false;
  implementsHttp: false;
  implementsWebsocket: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsTissPattern: false;
};

/** Metadados estáveis do provedor. */
export type WorkerRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
};

/** Info agregada retornada por providerInfo(). */
export type WorkerRuntimeInfo = {
  providerId: WorkerRuntimeProviderId;
  metadata: WorkerRuntimeProviderMetadata;
  status: WorkerRuntimeStatus;
  providerType: "WORKER_RUNTIME";
  capabilities: WorkerRuntimeCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel). */
export type WorkerRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional. */
export type WorkerRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: WorkerRuntimeProviderId;
  telemetry: WorkerRuntimeTelemetry;
  logs?: readonly WorkerRuntimeStructuredLog[];
  simulated?: boolean;
};

export type RegisterWorkerInput = WorkerRuntimeOperationalControls & {
  workerName?: string;
  workerId?: string;
  correlationId?: string | null;
  metadata?: CanonicalWorkerMetadata;
};

export type RegisterWorkerResult = WorkerRuntimeOperationEnvelope & {
  result?: CanonicalWorkerResult;
  worker?: CanonicalWorker;
};

export type UnregisterWorkerInput = WorkerRuntimeOperationalControls & {
  workerId: string;
};

export type UnregisterWorkerResult = WorkerRuntimeOperationEnvelope & {
  result?: CanonicalWorkerResult;
  worker?: CanonicalWorker;
};

export type AllocateWorkerInput = WorkerRuntimeOperationalControls & {
  workerId?: string;
  workerName?: string;
  taskId?: string;
  metadata?: CanonicalWorkerMetadata;
};

export type AllocateWorkerResult = WorkerRuntimeOperationEnvelope & {
  result?: CanonicalWorkerResult;
  worker?: CanonicalWorker;
  task?: CanonicalWorkerTask;
  execution?: CanonicalWorkerExecution;
};

export type ReleaseWorkerInput = WorkerRuntimeOperationalControls & {
  workerId: string;
};

export type ReleaseWorkerResult = WorkerRuntimeOperationEnvelope & {
  result?: CanonicalWorkerResult;
  worker?: CanonicalWorker;
};

export type HeartbeatWorkerInput = WorkerRuntimeOperationalControls & {
  workerId: string;
};

export type HeartbeatWorkerResult = WorkerRuntimeOperationEnvelope & {
  result?: CanonicalWorkerResult;
  worker?: CanonicalWorker;
};

export type WorkerStatsInput = WorkerRuntimeOperationalControls & {
  workerId?: string;
};

export type WorkerStatsResult = WorkerRuntimeOperationEnvelope & {
  statistics?: CanonicalWorkerStatistics;
  result?: CanonicalWorkerResult;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * Queue Runtime é dependência obrigatória preparada — NÃO consumida.
 * Scheduler Runtime é dependência preparada (opcional no Port shape) — NÃO agendada/executada.
 * Persistent Queue Runtime é dependência preparada (opcional no Port shape) — NÃO persistida/consumida.
 * Observability Runtime é dependência preparada (opcional no Port shape) — NÃO observada/emitida.
 */
export type WorkerRuntimeEnterpriseDeps = {
  getQueueRuntimePort(): QueueRuntimePort;
  /** INF-07 — Scheduler Runtime preparado (sem consumo funcional). */
  getSchedulerRuntimePort?: () => SchedulerRuntimePort;
  /** INF-08 — Persistent Queue Runtime preparado (sem consumo funcional). */
  getPersistentQueueRuntimePort?: () => PersistentQueueRuntimePort;
  /** INF-09 — Observability Runtime preparado (sem consumo funcional). */
  getObservabilityRuntimePort?: () => ObservabilityRuntimePort;
  /** INF-10 — Scalability Runtime preparado (sem consumo funcional). */
  getScalabilityRuntimePort?: () => ScalabilityRuntimePort;
};

/** Opções de resolução do WorkerRuntimePort. */
export type WorkerRuntimeOptions = {
  /**
   * Provedor desejado. Default da fundação: `enterprise` (INF-06).
   */
  provider?: WorkerRuntimeProviderId;
  enterpriseDeps?: WorkerRuntimeEnterpriseDeps;
};

/** Entrada de registro no WorkerRuntimeRegistry. */
export type WorkerRuntimeRegistration = {
  providerId: WorkerRuntimeProviderId;
  name: string;
  version: string;
  status: WorkerRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: WorkerRuntimeCapabilities;
  description?: string;
};

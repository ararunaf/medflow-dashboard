/**
 * Tipos vendor-agnósticos do Enterprise Scheduler Runtime — INF-07.
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → SchedulerRuntimePort
 *     → Adapter → Scheduler Runtime Store → Canonical Scheduler Result
 *
 * Sem Scheduler real. Sem Cron. Sem Timer. Sem Workers reais. Sem filas reais.
 */
import type { PersistentQueueRuntimePort } from "../../persistent-queue-runtime/ports/persistent-queue-runtime-port";
import type { ObservabilityRuntimePort } from "../../observability-runtime/ports/observability-runtime-port";
import type { ScalabilityRuntimePort } from "../../scalability-runtime/ports/scalability-runtime-port";
import type { QueueRuntimePort } from "../../queue-runtime/ports/queue-runtime-port";
import type { WorkerRuntimePort } from "../../worker-runtime/ports/worker-runtime-port";
import type {
  CanonicalSchedule,
  CanonicalSchedulerCapabilities,
  CanonicalSchedulerDispatch,
  CanonicalSchedulerHealth,
  CanonicalSchedulerJob,
  CanonicalSchedulerMetadata,
  CanonicalSchedulerResult,
  CanonicalSchedulerStatistics,
} from "./canonical";
import type { SchedulerRuntimeCapabilities } from "./capabilities";

export type {
  CanonicalSchedule,
  CanonicalSchedulerCapabilities,
  CanonicalSchedulerDispatch,
  CanonicalSchedulerHealth,
  CanonicalSchedulerIdentity,
  CanonicalSchedulerJob,
  CanonicalSchedulerMetadata,
  CanonicalSchedulerOperation,
  CanonicalSchedulerProvider,
  CanonicalSchedulerResult,
  CanonicalSchedulerStatistics,
  CanonicalSchedulerStatus,
} from "./canonical";
export type { SchedulerRuntimeCapabilities };

/** Provedores / mecanismos do Scheduler Runtime. */
export type SchedulerRuntimeProviderId = "mock" | "test" | "default" | "enterprise";

/** Status operacional declarado no registry. */
export type SchedulerRuntimeStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";

/** Telemetria estrutural embutida no resultado. */
export type SchedulerRuntimeTelemetry = {
  latencyMs: number;
  attempts: number;
  cancelled: boolean;
  operation?: string;
};

/** Logging estrutural embutido. */
export type SchedulerRuntimeStructuredLog = {
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  requestId?: string;
  providerId?: SchedulerRuntimeProviderId;
  attempt?: number;
  operation?: string;
};

/** Resultado de health check. */
export type SchedulerRuntimeHealth = CanonicalSchedulerHealth & {
  provider: SchedulerRuntimeProviderId;
  status?: SchedulerRuntimeStatus;
};

/** Capacidades do adapter no nível do Port. */
export type SchedulerRuntimePortCapabilities = {
  provider: SchedulerRuntimeProviderId;
  adapterId: string;
  engine: SchedulerRuntimeCapabilities;
  canonical: CanonicalSchedulerCapabilities;
  supportsCanonicalSchedule: boolean;
  supportsTimeout: boolean;
  supportsRetry: boolean;
  supportsCancellation: boolean;
  supportsTelemetry: boolean;
  usesQueueRuntimePort: boolean;
  usesWorkerRuntimePort: boolean;
  /** INF-08 — dependência Persistent Queue Runtime preparada (sem consumo). */
  usesPersistentQueueRuntimePort: boolean;
  /** INF-09 — dependência Observability Runtime preparada (sem consumo). */
  usesObservabilityRuntimePort: boolean;
  /** INF-10 — dependência Scalability Runtime preparada (sem consumo). */
  usesScalabilityRuntimePort: boolean;
  runtimeReady: true;
  realScheduler: false;
  cronImplemented: false;
  timerImplemented: false;
  retrySchedulingImplemented: false;
  delayJobsImplemented: false;
  jobDispatcherImplemented: false;
  timeWindowsImplemented: false;
  workersOrchestrated: false;
  queueConsumed: false;
  parallelProcessing: false;
  persistenceImplemented: false;
  implementsCron: false;
  implementsQuartz: false;
  implementsHangfire: false;
  implementsCelery: false;
  implementsBullMq: false;
  implementsAzureScheduler: false;
  implementsAzureFunctionsTimer: false;
  implementsTaskScheduler: false;
  implementsRealScheduler: false;
  implementsTimer: false;
  implementsClock: false;
  implementsBackgroundService: false;
  implementsRetryReal: false;
  implementsDelayQueue: false;
  implementsThreadPool: false;
  implementsWorkers: false;
  implementsParallelProcessing: false;
  implementsRabbitMq: false;
  implementsKafka: false;
  implementsAzureServiceBus: false;
  implementsRedis: false;
  implementsHttp: false;
  implementsWebsocket: false;
  knowsOperatorOrCooperative: false;
  knowsContract: false;
  knowsTenant: false;
  knowsTissPattern: false;
};

/** Metadados estáveis do provedor. */
export type SchedulerRuntimeProviderMetadata = {
  name: string;
  version: string;
  vendor: string;
  description?: string;
};

/** Info agregada retornada por providerInfo(). */
export type SchedulerRuntimeInfo = {
  providerId: SchedulerRuntimeProviderId;
  metadata: SchedulerRuntimeProviderMetadata;
  status: SchedulerRuntimeStatus;
  providerType: "SCHEDULER_RUNTIME";
  capabilities: SchedulerRuntimeCapabilities;
};

/** Controles operacionais comuns (timeout / retry / cancel). */
export type SchedulerRuntimeOperationalControls = {
  requestId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  attributes?: Readonly<Record<string, unknown>>;
};

/** Envelope comum de resultado operacional. */
export type SchedulerRuntimeOperationEnvelope = {
  ok: boolean;
  requestId?: string;
  message?: string;
  code?: string;
  provider: SchedulerRuntimeProviderId;
  telemetry: SchedulerRuntimeTelemetry;
  logs?: readonly SchedulerRuntimeStructuredLog[];
  simulated?: boolean;
};

export type RegisterScheduleInput = SchedulerRuntimeOperationalControls & {
  scheduleName?: string;
  scheduleId?: string;
  correlationId?: string | null;
  metadata?: CanonicalSchedulerMetadata;
};

export type RegisterScheduleResult = SchedulerRuntimeOperationEnvelope & {
  result?: CanonicalSchedulerResult;
  schedule?: CanonicalSchedule;
};

export type UnregisterScheduleInput = SchedulerRuntimeOperationalControls & {
  scheduleId: string;
};

export type UnregisterScheduleResult = SchedulerRuntimeOperationEnvelope & {
  result?: CanonicalSchedulerResult;
  schedule?: CanonicalSchedule;
};

export type ScheduleJobInput = SchedulerRuntimeOperationalControls & {
  scheduleId?: string;
  scheduleName?: string;
  jobId?: string;
  metadata?: CanonicalSchedulerMetadata;
};

export type ScheduleJobResult = SchedulerRuntimeOperationEnvelope & {
  result?: CanonicalSchedulerResult;
  schedule?: CanonicalSchedule;
  job?: CanonicalSchedulerJob;
  dispatch?: CanonicalSchedulerDispatch;
};

export type CancelScheduleInput = SchedulerRuntimeOperationalControls & {
  scheduleId: string;
  jobId?: string;
};

export type CancelScheduleResult = SchedulerRuntimeOperationEnvelope & {
  result?: CanonicalSchedulerResult;
  schedule?: CanonicalSchedule;
  job?: CanonicalSchedulerJob;
};

export type ListSchedulesInput = SchedulerRuntimeOperationalControls & {
  scheduleId?: string;
  activeOnly?: boolean;
};

export type ListSchedulesResult = SchedulerRuntimeOperationEnvelope & {
  schedules?: readonly CanonicalSchedule[];
  jobs?: readonly CanonicalSchedulerJob[];
  result?: CanonicalSchedulerResult;
};

export type SchedulerStatsInput = SchedulerRuntimeOperationalControls & {
  scheduleId?: string;
};

export type SchedulerStatsResult = SchedulerRuntimeOperationEnvelope & {
  statistics?: CanonicalSchedulerStatistics;
  result?: CanonicalSchedulerResult;
};

/**
 * Dependências Enterprise injetadas no adapter default/enterprise.
 * Queue + Worker Runtime são dependências obrigatórias preparadas — NÃO consumidas nesta sprint.
 * Persistent Queue Runtime é dependência preparada (opcional no Port shape) — NÃO persistida/consumida.
 * Observability Runtime é dependência preparada (opcional no Port shape) — NÃO observada/emitida.
 */
export type SchedulerRuntimeEnterpriseDeps = {
  getQueueRuntimePort(): QueueRuntimePort;
  getWorkerRuntimePort(): WorkerRuntimePort;
  /** INF-08 — Persistent Queue Runtime preparado (sem consumo funcional). */
  getPersistentQueueRuntimePort?: () => PersistentQueueRuntimePort;
  /** INF-09 — Observability Runtime preparado (sem consumo funcional). */
  getObservabilityRuntimePort?: () => ObservabilityRuntimePort;
  /** INF-10 — Scalability Runtime preparado (sem consumo funcional). */
  getScalabilityRuntimePort?: () => ScalabilityRuntimePort;
};

/** Opções de resolução do SchedulerRuntimePort. */
export type SchedulerRuntimeOptions = {
  /**
   * Provedor desejado. Default da fundação: `enterprise` (INF-07).
   */
  provider?: SchedulerRuntimeProviderId;
  enterpriseDeps?: SchedulerRuntimeEnterpriseDeps;
};

/** Entrada de registro no SchedulerRuntimeRegistry. */
export type SchedulerRuntimeRegistration = {
  providerId: SchedulerRuntimeProviderId;
  name: string;
  version: string;
  status: SchedulerRuntimeStatus;
  adapterId: string;
  vendor: string;
  capabilities: SchedulerRuntimeCapabilities;
  description?: string;
};

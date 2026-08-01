/**
 * Tipos vendor-agnósticos do Worker Foundation — INF-02 Worker Foundation.
 *
 * Representa estruturalmente a infraestrutura de Workers Enterprise.
 * NÃO executa Workers. NÃO inicia threads. NÃO processa mensagens.
 * NÃO integra BullMQ / Hangfire / Azure Workers / AWS Lambda / Cloudflare Workers / K8s Jobs.
 *
 * Arquitetura obrigatória (ECS-01):
 *   Application → ExecutionWorkerPort → Adapter → Store → Factory → Provider
 *
 * Integração com Message Queue: exclusivamente via ExecutionQueuePort (INF-01).
 */
import type {
  CanonicalWorker,
  CanonicalWorkerHealth,
  CanonicalWorkerStatistics,
  CanonicalWorkerStatusValue,
} from "./models";

export type {
  CanonicalWorker,
  CanonicalWorkerCapabilities,
  CanonicalWorkerConfiguration,
  CanonicalWorkerHealth,
  CanonicalWorkerIdentity,
  CanonicalWorkerRecordKind,
  CanonicalWorkerReference,
  CanonicalWorkerStatistics,
  CanonicalWorkerStatus,
  CanonicalWorkerStatusValue,
} from "./models";

/* ─────────────────────────────────────────────────────────────────────────
 * Mecanismo do Port (adapter id)
 * ───────────────────────────────────────────────────────────────────────── */

/** Provedores / mecanismos do Worker Foundation (extensível). */
export type WorkerFoundationProviderId = "default" | "mock" | "test";

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — getWorker / registerWorker / unregisterWorker
 * ───────────────────────────────────────────────────────────────────────── */

/** Entrada estrutural de obtenção / criação de Worker. */
export type GetWorkerInput = {
  executionWorkerId?: string;
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
  pipelineId?: string;
  key?: string;
  name?: string;
  /** Se true (default), cria Worker estrutural quando inexistente. */
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

export type GetWorkerResult = {
  ok: boolean;
  worker?: CanonicalWorker;
  message?: string;
  code?: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  executionPerformed: false;
  threadsSpawned: false;
  backgroundJobsStarted: false;
  concurrencyEnabled: false;
  asynchronousProcessing: false;
  messagesConsumed: false;
  processingPerformed: false;
  realWorkerBackend: false;
};

export type RegisterWorkerInput = GetWorkerInput;

export type RegisterWorkerResult = GetWorkerResult;

export type UnregisterWorkerInput = {
  executionWorkerId: string;
};

export type UnregisterWorkerResult = {
  ok: boolean;
  worker?: CanonicalWorker;
  message?: string;
  code?: string;
  executionPerformed: false;
  threadsSpawned: false;
  backgroundJobsStarted: false;
  concurrencyEnabled: false;
  messagesConsumed: false;
  processingPerformed: false;
  realWorkerBackend: false;
  enginesInvoked: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — start / stop / pause / resume (estrutural — sem execução real)
 * ───────────────────────────────────────────────────────────────────────── */

export type StartWorkerInput = {
  executionWorkerId: string;
};

export type StartWorkerResult = {
  ok: boolean;
  worker?: CanonicalWorker;
  message?: string;
  code?: string;
  /** Sempre false — start estrutural NÃO executa. */
  executionPerformed: false;
  threadsSpawned: false;
  backgroundJobsStarted: false;
  concurrencyEnabled: false;
  asynchronousProcessing: false;
  messagesConsumed: false;
  processingPerformed: false;
  realWorkerBackend: false;
  enginesInvoked: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

export type StopWorkerInput = {
  executionWorkerId: string;
};

export type StopWorkerResult = StartWorkerResult;

export type PauseWorkerInput = {
  executionWorkerId: string;
};

export type PauseWorkerResult = StartWorkerResult;

export type ResumeWorkerInput = {
  executionWorkerId: string;
};

export type ResumeWorkerResult = StartWorkerResult;

/* ─────────────────────────────────────────────────────────────────────────
 * Health / Capabilities / Statistics / Provider options
 * ───────────────────────────────────────────────────────────────────────── */

export type ExecutionWorkerPortHealth = {
  ok: boolean;
  provider: WorkerFoundationProviderId;
  latencyMs?: number;
  message?: string;
  storedWorkerCount?: number;
  storedReferenceCount?: number;
  structuralHealth?: CanonicalWorkerHealth;
};

/**
 * Capacidades do ExecutionWorkerPort.
 * Declara explicitamente o que a fundação NÃO faz.
 */
export type ExecutionWorkerPortCapabilities = {
  provider: WorkerFoundationProviderId;
  adapterId: string;
  supportsRegisterWorker: true;
  supportsUnregisterWorker: true;
  supportsStartWorker: true;
  supportsStopWorker: true;
  supportsPauseWorker: true;
  supportsResumeWorker: true;
  supportsGetWorker: true;
  supportsStatistics: true;
  supportsHealth: true;
  supportsCapabilities: true;
  /** Worker Foundation estrutural exclusivamente — sem execução real. */
  structuralWorkerOnly: true;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  executionPerformed: false;
  threadsSpawned: false;
  backgroundJobsStarted: false;
  concurrencyEnabled: false;
  asynchronousProcessing: false;
  messagesConsumed: false;
  realWorkerBackend: false;
  implementsOcr: false;
  implementsAi: false;
  implementsTiss: false;
  implementsXmlParser: false;
  implementsBullMq: false;
  implementsHangfire: false;
  implementsAzureWorkers: false;
  implementsAwsLambda: false;
  implementsCloudflareWorkers: false;
  implementsKubernetesJobs: false;
  implementsWorkerThreads: false;
  implementsBackgroundServices: false;
  implementsPersistence: false;
  implementsUi: false;
  implementsHttpWorkersQueues: false;
  /** Conhece exclusivamente ExecutionQueuePort (INF-01). */
  usesExecutionQueuePortOnly: true;
  noDirectEngineCoupling: true;
  /** Desacoplado de Engines (OCR / IA / Rule / Mapping / TISS). */
  decoupledFromEngines: true;
};

export type WorkerStatisticsResult = {
  ok: boolean;
  statistics?: CanonicalWorkerStatistics;
  message?: string;
  code?: string;
};

/** Opções de resolução do ExecutionWorkerPort (provider factory). */
export type WorkerFoundationProviderOptions = {
  /**
   * Mecanismo desejado. Default de produção da fundação: `default`
   * (DefaultExecutionWorkerAdapter).
   */
  provider?: WorkerFoundationProviderId;
};

/** Status transition helper type (estrutural). */
export type StructuralWorkerLifecycleStatus = Extract<
  CanonicalWorkerStatusValue,
  | "started-structural"
  | "stopped-structural"
  | "paused-structural"
  | "resumed-structural"
  | "unregistered-structural"
>;

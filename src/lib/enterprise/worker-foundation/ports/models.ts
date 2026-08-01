/**
 * Modelos canônicos do Worker Foundation — INF-02 Worker Foundation.
 *
 * Representação estrutural da infraestrutura de Workers Enterprise.
 * Sem regras de negócio. Sem OCR. Sem IA. Sem Mapping. Sem parsers.
 * Sem banco. Sem persistência real. Sem execução. Sem threads.
 * Sem BullMQ / Hangfire / Azure Workers / AWS Lambda / Cloudflare Workers / K8s Jobs.
 * Sem Engines. Sem acesso externo. Sem processamento concorrente / assíncrono.
 */

/* ─────────────────────────────────────────────────────────────────────────
 * Types / kinds
 * ───────────────────────────────────────────────────────────────────────── */

/** Kinds de registros canônicos do Worker Foundation. */
export type CanonicalWorkerRecordKind =
  | "canonical-worker"
  | "canonical-worker-identity"
  | "canonical-worker-status"
  | "canonical-worker-reference"
  | "canonical-worker-configuration"
  | "canonical-worker-capabilities"
  | "canonical-worker-statistics"
  | "canonical-worker-health";

/** Valor estrutural opaco de status (sem execução real). */
export type CanonicalWorkerStatusValue =
  | "structural"
  | "registered-structural"
  | "started-structural"
  | "stopped-structural"
  | "paused-structural"
  | "resumed-structural"
  | "unregistered-structural"
  | "unknown";

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalWorkerIdentity
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Identidade estrutural de um Worker.
 * Sem identidade de runtime real.
 */
export type CanonicalWorkerIdentity = {
  kind: "canonical-worker-identity";
  executionWorkerId: string;
  key: string;
  name: string;
  version?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalWorkerStatus
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Status estrutural do Worker.
 * Declara estado opaco — sem threads, sem background jobs, sem execução.
 */
export type CanonicalWorkerStatus = {
  kind: "canonical-worker-status";
  value: CanonicalWorkerStatusValue;
  updatedAt: string;
  notes?: string;
  /** Execução real NÃO ocorre nesta sprint. */
  executionPerformed: false;
  threadsSpawned: false;
  backgroundJobsStarted: false;
  concurrencyEnabled: false;
  messagesConsumed: false;
  processingPerformed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalWorkerReference
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Referência estrutural opaca anexada a um Worker.
 * Sem conteúdo de negócio.
 */
export type CanonicalWorkerReference = {
  kind: "canonical-worker-reference";
  name: string;
  value: string;
  notes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalWorkerConfiguration
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Configuração estrutural do Worker.
 * Declara o contrato opaco — sem execução, sem backend real.
 */
export type CanonicalWorkerConfiguration = {
  kind: "canonical-worker-configuration";
  key: string;
  name: string;
  version?: string;
  description?: string;
  portRef?: string;
  portContract?: string;
  /** Port exclusivo da Message Queue conhecido pelo Worker. */
  queuePortContract: "ExecutionQueuePort";
  notes?: string;
  /** Backend real NÃO está conectado nesta sprint. */
  backendConnected: false;
  executionPerformed: false;
  threadsSpawned: false;
  backgroundJobsStarted: false;
  concurrencyEnabled: false;
  messagesConsumed: false;
  processingPerformed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalWorkerCapabilities
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Capacidades estruturais declaradas pelo Worker Foundation.
 * Explicitamente sem execução real / threads / Engines / backends externos.
 */
export type CanonicalWorkerCapabilities = {
  kind: "canonical-worker-capabilities";
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
  decoupledFromEngines: true;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalWorker
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Worker canônico estrutural.
 * Representa a infraestrutura de Worker — sem execução, sem threads, sem backend real.
 */
export type CanonicalWorker = {
  kind: "canonical-worker";
  id: string;
  /** Alias (= id do worker). Anexado ao Execution Context. */
  executionWorkerId: string;
  identity: CanonicalWorkerIdentity;
  status: CanonicalWorkerStatus;
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
  /** Referência estrutural à Message Queue (via ExecutionQueuePort apenas). */
  executionMessageQueueId?: string;
  pipelineId?: string;
  configuration: CanonicalWorkerConfiguration;
  references: readonly CanonicalWorkerReference[];
  capability: CanonicalWorkerCapabilities;
  createdAt: string;
  updatedAt: string;
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
  persistenceImplemented: false;
  databaseUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalWorkerStatistics
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Estatísticas estruturais do store in-memory.
 * Sem métricas de negócio / sem analytics / sem throughput real.
 */
export type CanonicalWorkerStatistics = {
  kind: "canonical-worker-statistics";
  totalWorkers: number;
  totalReferences: number;
  computedAt: string;
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

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalWorkerHealth
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Saúde estrutural do Worker Foundation (modelo canônico).
 * Distinto do health do Port (types) — aqui é representação estrutural.
 */
export type CanonicalWorkerHealth = {
  kind: "canonical-worker-health";
  ok: boolean;
  message?: string;
  workerCount: number;
  indexReady: true;
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
  checkedAt: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Catálogo estrutural
 * ───────────────────────────────────────────────────────────────────────── */

/** Capacidades canônicas embutidas em toda entrada do Worker Foundation. */
export const STRUCTURAL_WORKER_FOUNDATION_CAPABILITY: CanonicalWorkerCapabilities = {
  kind: "canonical-worker-capabilities",
  structuralWorkerOnly: true,
  persistenceImplemented: false,
  databaseUsed: false,
  enginesInvoked: false,
  stagesExecuted: false,
  processingPerformed: false,
  executionPerformed: false,
  threadsSpawned: false,
  backgroundJobsStarted: false,
  concurrencyEnabled: false,
  asynchronousProcessing: false,
  messagesConsumed: false,
  realWorkerBackend: false,
  implementsOcr: false,
  implementsAi: false,
  implementsTiss: false,
  implementsXmlParser: false,
  implementsBullMq: false,
  implementsHangfire: false,
  implementsAzureWorkers: false,
  implementsAwsLambda: false,
  implementsCloudflareWorkers: false,
  implementsKubernetesJobs: false,
  implementsWorkerThreads: false,
  implementsBackgroundServices: false,
  implementsPersistence: false,
  implementsUi: false,
  implementsHttpWorkersQueues: false,
  usesExecutionQueuePortOnly: true,
  noDirectEngineCoupling: true,
  decoupledFromEngines: true,
};

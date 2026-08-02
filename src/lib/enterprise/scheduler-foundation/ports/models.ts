/**
 * Modelos canônicos do Scheduler Foundation — INF-03 Scheduler Foundation.
 *
 * Representação estrutural da infraestrutura de agendamento Enterprise.
 * Sem regras de negócio. Sem OCR. Sem IA. Sem Mapping. Sem parsers.
 * Sem banco. Sem persistência real. Sem execução. Sem cron. Sem timers.
 * Sem node-cron / BullMQ Scheduler / Quartz / Hangfire / Azure Scheduler /
 * Cloudflare Cron / Kubernetes CronJobs.
 * Sem Engines. Sem acesso externo. Sem disparo de jobs / Workers.
 */

/* ─────────────────────────────────────────────────────────────────────────
 * Types / kinds
 * ───────────────────────────────────────────────────────────────────────── */

/** Kinds de registros canônicos do Scheduler Foundation. */
export type CanonicalScheduleRecordKind =
  | "canonical-schedule"
  | "canonical-schedule-identity"
  | "canonical-schedule-status"
  | "canonical-schedule-reference"
  | "canonical-schedule-configuration"
  | "canonical-schedule-capabilities"
  | "canonical-schedule-statistics"
  | "canonical-schedule-health";

/** Valor estrutural opaco de status (sem execução real / sem cron). */
export type CanonicalScheduleStatusValue =
  | "structural"
  | "registered-structural"
  | "enabled-structural"
  | "disabled-structural"
  | "paused-structural"
  | "resumed-structural"
  | "unregistered-structural"
  | "unknown";

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalScheduleIdentity
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Identidade estrutural de um Schedule.
 * Sem identidade de runtime real / sem cron expression.
 */
export type CanonicalScheduleIdentity = {
  kind: "canonical-schedule-identity";
  executionSchedulerId: string;
  key: string;
  name: string;
  version?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalScheduleStatus
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Status estrutural do Schedule.
 * Declara estado opaco — sem cron, sem timers, sem execução, sem jobs.
 */
export type CanonicalScheduleStatus = {
  kind: "canonical-schedule-status";
  value: CanonicalScheduleStatusValue;
  updatedAt: string;
  notes?: string;
  /** Execução real NÃO ocorre nesta sprint. */
  executionPerformed: false;
  scheduleExecuted: false;
  cronUsed: false;
  timersUsed: false;
  jobsDispatched: false;
  workersStarted: false;
  processingPerformed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalScheduleReference
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Referência estrutural opaca anexada a um Schedule.
 * Sem conteúdo de negócio.
 */
export type CanonicalScheduleReference = {
  kind: "canonical-schedule-reference";
  name: string;
  value: string;
  notes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalScheduleConfiguration
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Configuração estrutural do Schedule.
 * Declara o contrato opaco — sem execução, sem cron, sem backend real.
 */
export type CanonicalScheduleConfiguration = {
  kind: "canonical-schedule-configuration";
  key: string;
  name: string;
  version?: string;
  description?: string;
  portRef?: string;
  portContract?: string;
  /** Port exclusivo do Worker Foundation conhecido pelo Scheduler. */
  workerPortContract: "ExecutionWorkerPort";
  notes?: string;
  /** Backend real NÃO está conectado nesta sprint. */
  backendConnected: false;
  executionPerformed: false;
  scheduleExecuted: false;
  cronUsed: false;
  timersUsed: false;
  jobsDispatched: false;
  workersStarted: false;
  processingPerformed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalScheduleCapabilities
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Capacidades estruturais declaradas pelo Scheduler Foundation.
 * Explicitamente sem execução real / cron / timers / Engines / backends externos.
 */
export type CanonicalScheduleCapabilities = {
  kind: "canonical-schedule-capabilities";
  structuralSchedulerOnly: true;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  executionPerformed: false;
  scheduleExecuted: false;
  cronUsed: false;
  timersUsed: false;
  jobsDispatched: false;
  workersStarted: false;
  realSchedulerBackend: false;
  implementsOcr: false;
  implementsAi: false;
  implementsTiss: false;
  implementsXmlParser: false;
  implementsNodeCron: false;
  implementsBullMqScheduler: false;
  implementsQuartz: false;
  implementsHangfire: false;
  implementsAzureScheduler: false;
  implementsCloudflareCron: false;
  implementsKubernetesCronJobs: false;
  implementsSetInterval: false;
  implementsSetTimeout: false;
  implementsPersistence: false;
  implementsUi: false;
  implementsHttpSchedulers: false;
  /** Conhece exclusivamente ExecutionWorkerPort (INF-02). */
  usesExecutionWorkerPortOnly: true;
  noDirectEngineCoupling: true;
  decoupledFromEngines: true;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalSchedule
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Schedule canônico estrutural.
 * Representa a infraestrutura de agendamento — sem execução, sem cron, sem timers.
 */
export type CanonicalSchedule = {
  kind: "canonical-schedule";
  id: string;
  /** Alias (= id do schedule). Anexado ao Execution Context. */
  executionSchedulerId: string;
  identity: CanonicalScheduleIdentity;
  status: CanonicalScheduleStatus;
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
  /** Referência estrutural ao Worker Foundation (via ExecutionWorkerPort apenas). */
  executionWorkerId?: string;
  pipelineId?: string;
  configuration: CanonicalScheduleConfiguration;
  references: readonly CanonicalScheduleReference[];
  capability: CanonicalScheduleCapabilities;
  createdAt: string;
  updatedAt: string;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  executionPerformed: false;
  scheduleExecuted: false;
  cronUsed: false;
  timersUsed: false;
  jobsDispatched: false;
  workersStarted: false;
  realSchedulerBackend: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalScheduleStatistics
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Estatísticas estruturais do store in-memory.
 * Sem métricas de negócio / sem analytics / sem throughput real / sem cron ticks.
 */
export type CanonicalScheduleStatistics = {
  kind: "canonical-schedule-statistics";
  totalSchedules: number;
  totalReferences: number;
  computedAt: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  executionPerformed: false;
  scheduleExecuted: false;
  cronUsed: false;
  timersUsed: false;
  jobsDispatched: false;
  workersStarted: false;
  processingPerformed: false;
  realSchedulerBackend: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * CanonicalScheduleHealth
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Saúde estrutural do Scheduler Foundation (modelo canônico).
 * Distinto do health do Port (types) — aqui é representação estrutural.
 */
export type CanonicalScheduleHealth = {
  kind: "canonical-schedule-health";
  ok: boolean;
  message?: string;
  scheduleCount: number;
  indexReady: true;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  executionPerformed: false;
  scheduleExecuted: false;
  cronUsed: false;
  timersUsed: false;
  jobsDispatched: false;
  workersStarted: false;
  processingPerformed: false;
  realSchedulerBackend: false;
  checkedAt: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Catálogo estrutural
 * ───────────────────────────────────────────────────────────────────────── */

/** Capacidades canônicas embutidas em toda entrada do Scheduler Foundation. */
export const STRUCTURAL_SCHEDULER_FOUNDATION_CAPABILITY: CanonicalScheduleCapabilities = {
  kind: "canonical-schedule-capabilities",
  structuralSchedulerOnly: true,
  persistenceImplemented: false,
  databaseUsed: false,
  enginesInvoked: false,
  stagesExecuted: false,
  processingPerformed: false,
  executionPerformed: false,
  scheduleExecuted: false,
  cronUsed: false,
  timersUsed: false,
  jobsDispatched: false,
  workersStarted: false,
  realSchedulerBackend: false,
  implementsOcr: false,
  implementsAi: false,
  implementsTiss: false,
  implementsXmlParser: false,
  implementsNodeCron: false,
  implementsBullMqScheduler: false,
  implementsQuartz: false,
  implementsHangfire: false,
  implementsAzureScheduler: false,
  implementsCloudflareCron: false,
  implementsKubernetesCronJobs: false,
  implementsSetInterval: false,
  implementsSetTimeout: false,
  implementsPersistence: false,
  implementsUi: false,
  implementsHttpSchedulers: false,
  usesExecutionWorkerPortOnly: true,
  noDirectEngineCoupling: true,
  decoupledFromEngines: true,
};

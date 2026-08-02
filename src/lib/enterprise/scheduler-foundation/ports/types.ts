/**
 * Tipos vendor-agnósticos do Scheduler Foundation — INF-03 Scheduler Foundation.
 *
 * Representa estruturalmente a infraestrutura de agendamento Enterprise.
 * NÃO executa agendamentos. NÃO utiliza cron. NÃO cria timers.
 * NÃO integra node-cron / BullMQ Scheduler / Quartz / Hangfire /
 * Azure Scheduler / Cloudflare Cron / Kubernetes CronJobs.
 *
 * Arquitetura obrigatória (ECS-01):
 *   Application → ExecutionSchedulerPort → Adapter → Store → Factory → Provider
 *
 * Integração com Worker Foundation: exclusivamente via ExecutionWorkerPort (INF-02).
 */
import type {
  CanonicalSchedule,
  CanonicalScheduleHealth,
  CanonicalScheduleStatistics,
  CanonicalScheduleStatusValue,
} from "./models";

export type {
  CanonicalSchedule,
  CanonicalScheduleCapabilities,
  CanonicalScheduleConfiguration,
  CanonicalScheduleHealth,
  CanonicalScheduleIdentity,
  CanonicalScheduleRecordKind,
  CanonicalScheduleReference,
  CanonicalScheduleStatistics,
  CanonicalScheduleStatus,
  CanonicalScheduleStatusValue,
} from "./models";

/* ─────────────────────────────────────────────────────────────────────────
 * Mecanismo do Port (adapter id)
 * ───────────────────────────────────────────────────────────────────────── */

/** Provedores / mecanismos do Scheduler Foundation (extensível). */
export type SchedulerFoundationProviderId = "default" | "mock" | "test";

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — getSchedule / registerSchedule / unregisterSchedule
 * ───────────────────────────────────────────────────────────────────────── */

/** Entrada estrutural de obtenção / criação de Schedule. */
export type GetScheduleInput = {
  executionSchedulerId?: string;
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
  pipelineId?: string;
  key?: string;
  name?: string;
  /** Se true (default), cria Schedule estrutural quando inexistente. */
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

export type GetScheduleResult = {
  ok: boolean;
  schedule?: CanonicalSchedule;
  message?: string;
  code?: string;
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

export type RegisterScheduleInput = GetScheduleInput;

export type RegisterScheduleResult = GetScheduleResult;

export type UnregisterScheduleInput = {
  executionSchedulerId: string;
};

export type UnregisterScheduleResult = {
  ok: boolean;
  schedule?: CanonicalSchedule;
  message?: string;
  code?: string;
  executionPerformed: false;
  scheduleExecuted: false;
  cronUsed: false;
  timersUsed: false;
  jobsDispatched: false;
  workersStarted: false;
  processingPerformed: false;
  realSchedulerBackend: false;
  enginesInvoked: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — enable / disable / pause / resume (estrutural — sem execução)
 * ───────────────────────────────────────────────────────────────────────── */

export type EnableScheduleInput = {
  executionSchedulerId: string;
};

export type EnableScheduleResult = {
  ok: boolean;
  schedule?: CanonicalSchedule;
  message?: string;
  code?: string;
  /** Sempre false — enable estrutural NÃO executa / NÃO agenda. */
  executionPerformed: false;
  scheduleExecuted: false;
  cronUsed: false;
  timersUsed: false;
  jobsDispatched: false;
  workersStarted: false;
  processingPerformed: false;
  realSchedulerBackend: false;
  enginesInvoked: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

export type DisableScheduleInput = {
  executionSchedulerId: string;
};

export type DisableScheduleResult = EnableScheduleResult;

export type PauseScheduleInput = {
  executionSchedulerId: string;
};

export type PauseScheduleResult = EnableScheduleResult;

export type ResumeScheduleInput = {
  executionSchedulerId: string;
};

export type ResumeScheduleResult = EnableScheduleResult;

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — listSchedules
 * ───────────────────────────────────────────────────────────────────────── */

export type ListSchedulesInput = {
  executionId?: string;
  limit?: number;
};

export type ListSchedulesResult = {
  ok: boolean;
  schedules: readonly CanonicalSchedule[];
  message?: string;
  code?: string;
  executionPerformed: false;
  scheduleExecuted: false;
  cronUsed: false;
  timersUsed: false;
  jobsDispatched: false;
  workersStarted: false;
  processingPerformed: false;
  realSchedulerBackend: false;
  enginesInvoked: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Health / Capabilities / Statistics / Provider options
 * ───────────────────────────────────────────────────────────────────────── */

export type ExecutionSchedulerPortHealth = {
  ok: boolean;
  provider: SchedulerFoundationProviderId;
  latencyMs?: number;
  message?: string;
  storedScheduleCount?: number;
  storedReferenceCount?: number;
  structuralHealth?: CanonicalScheduleHealth;
};

/**
 * Capacidades do ExecutionSchedulerPort.
 * Declara explicitamente o que a fundação NÃO faz.
 */
export type ExecutionSchedulerPortCapabilities = {
  provider: SchedulerFoundationProviderId;
  adapterId: string;
  supportsRegisterSchedule: true;
  supportsUnregisterSchedule: true;
  supportsEnableSchedule: true;
  supportsDisableSchedule: true;
  supportsPauseSchedule: true;
  supportsResumeSchedule: true;
  supportsGetSchedule: true;
  supportsListSchedules: true;
  supportsStatistics: true;
  supportsHealth: true;
  supportsCapabilities: true;
  /** Scheduler Foundation estrutural exclusivamente — sem execução real. */
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
  /** Desacoplado de Engines (OCR / IA / Rule / Mapping / TISS). */
  decoupledFromEngines: true;
};

export type ScheduleStatisticsResult = {
  ok: boolean;
  statistics?: CanonicalScheduleStatistics;
  message?: string;
  code?: string;
};

/** Opções de resolução do ExecutionSchedulerPort (provider factory). */
export type SchedulerFoundationProviderOptions = {
  /**
   * Mecanismo desejado. Default de produção da fundação: `default`
   * (DefaultExecutionSchedulerAdapter).
   */
  provider?: SchedulerFoundationProviderId;
};

/** Status transition helper type (estrutural). */
export type StructuralScheduleLifecycleStatus = Extract<
  CanonicalScheduleStatusValue,
  | "enabled-structural"
  | "disabled-structural"
  | "paused-structural"
  | "resumed-structural"
  | "unregistered-structural"
>;

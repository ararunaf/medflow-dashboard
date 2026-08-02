/**
 * Helpers internos do Scheduler Foundation (INF-03).
 *
 * Somente criação / registro / armazenamento estrutural in-memory.
 * Sem persistência real. Sem banco. Sem Engines. Sem execução.
 * Sem cron. Sem timers. Sem jobs. Sem disparo de Workers.
 */
import { createExecutionSchedulerId } from "../ports/identity";
import {
  STRUCTURAL_SCHEDULER_FOUNDATION_CAPABILITY,
  type CanonicalSchedule,
  type CanonicalScheduleConfiguration,
  type CanonicalScheduleHealth,
  type CanonicalScheduleIdentity,
  type CanonicalScheduleReference,
  type CanonicalScheduleStatistics,
  type CanonicalScheduleStatus,
  type CanonicalScheduleStatusValue,
} from "../ports/models";
import type {
  ExecutionSchedulerPortCapabilities,
  GetScheduleInput,
  StructuralScheduleLifecycleStatus,
} from "../ports/types";
import type { ExecutionSchedulerStore, StoredCanonicalSchedule } from "../store";

export function foundationCapabilitiesBase(
  adapterId: string,
): Omit<ExecutionSchedulerPortCapabilities, "provider"> {
  return {
    adapterId,
    supportsRegisterSchedule: true,
    supportsUnregisterSchedule: true,
    supportsEnableSchedule: true,
    supportsDisableSchedule: true,
    supportsPauseSchedule: true,
    supportsResumeSchedule: true,
    supportsGetSchedule: true,
    supportsListSchedules: true,
    supportsStatistics: true,
    supportsHealth: true,
    supportsCapabilities: true,
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
}

export type ScheduleBuildFactories = {
  createSchedulerId?: () => string;
};

function buildReferences(input: GetScheduleInput): CanonicalScheduleReference[] {
  const references: CanonicalScheduleReference[] = (input.references ?? []).map((ref) => ({
    kind: "canonical-schedule-reference" as const,
    name: ref.name,
    value: ref.value,
    notes: ref.notes,
  }));

  const derived: Array<[string, string | undefined, string]> = [
    ["contextId", input.contextId, "Structural context reference"],
    ["stateMachineId", input.stateMachineId, "Structural state machine reference"],
    ["eventBusId", input.eventBusId, "Structural event bus reference"],
    ["executionRegistryId", input.executionRegistryId, "Structural execution registry reference"],
    ["executionTraceId", input.executionTraceId, "Structural execution trace reference"],
    [
      "executionCapabilityRegistryId",
      input.executionCapabilityRegistryId,
      "Structural capability registry reference",
    ],
    [
      "executionDependencyRegistryId",
      input.executionDependencyRegistryId,
      "Structural dependency registry reference",
    ],
    [
      "executionPolicyRegistryId",
      input.executionPolicyRegistryId,
      "Structural policy registry reference",
    ],
    [
      "executionConstraintRegistryId",
      input.executionConstraintRegistryId,
      "Structural constraint registry reference",
    ],
    [
      "executionRequirementRegistryId",
      input.executionRequirementRegistryId,
      "Structural requirement registry reference",
    ],
    [
      "executionResourceRegistryId",
      input.executionResourceRegistryId,
      "Structural resource registry reference",
    ],
    [
      "executionEnvironmentRegistryId",
      input.executionEnvironmentRegistryId,
      "Structural environment registry reference",
    ],
    [
      "executionMessageQueueId",
      input.executionMessageQueueId,
      "Structural message queue reference (opaque id only)",
    ],
    [
      "executionWorkerId",
      input.executionWorkerId,
      "Structural worker reference via ExecutionWorkerPort only",
    ],
    ["pipelineId", input.pipelineId, "Structural pipeline reference"],
  ];

  for (const [name, value, notes] of derived) {
    if (value) {
      references.push({
        kind: "canonical-schedule-reference",
        name,
        value,
        notes,
      });
    }
  }

  return references;
}

function buildStatus(
  value: CanonicalScheduleStatusValue,
  stamp: string,
  notes?: string,
): CanonicalScheduleStatus {
  return {
    kind: "canonical-schedule-status",
    value,
    updatedAt: stamp,
    notes,
    executionPerformed: false,
    scheduleExecuted: false,
    cronUsed: false,
    timersUsed: false,
    jobsDispatched: false,
    workersStarted: false,
    processingPerformed: false,
  };
}

export function ensureSchedule(
  store: ExecutionSchedulerStore,
  input: GetScheduleInput,
  stamp: string,
  factories?: ScheduleBuildFactories,
): CanonicalSchedule {
  const createSchedulerId = factories?.createSchedulerId ?? createExecutionSchedulerId;

  if (input.executionSchedulerId) {
    const existing = store.getSchedule(input.executionSchedulerId);
    if (existing) return existing.schedule;
  }

  if (input.executionId) {
    const byExec = store.getScheduleByExecution(input.executionId);
    if (byExec) return byExec.schedule;
  }

  const executionSchedulerId = input.executionSchedulerId ?? createSchedulerId();
  const key = input.key ?? "structural-execution-scheduler";
  const name = input.name ?? "Structural Execution Scheduler";

  const identity: CanonicalScheduleIdentity = {
    kind: "canonical-schedule-identity",
    executionSchedulerId,
    key,
    name,
    version: input.version ?? "1",
  };

  const configuration: CanonicalScheduleConfiguration = {
    kind: "canonical-schedule-configuration",
    key,
    name,
    version: input.version ?? "1",
    description:
      "Bootstrap structural execution scheduler — no real scheduling, no cron, no timers",
    portRef: "ExecutionSchedulerPort",
    portContract: "structural-scheduler-foundation",
    workerPortContract: "ExecutionWorkerPort",
    notes:
      "Structural scheduler configuration — no node-cron/BullMQ/Quartz/Hangfire/Azure/Cloudflare/K8s CronJobs/setInterval/setTimeout",
    backendConnected: false,
    executionPerformed: false,
    scheduleExecuted: false,
    cronUsed: false,
    timersUsed: false,
    jobsDispatched: false,
    workersStarted: false,
    processingPerformed: false,
  };

  const schedule: CanonicalSchedule = {
    kind: "canonical-schedule",
    id: executionSchedulerId,
    executionSchedulerId,
    identity,
    status: buildStatus(
      "registered-structural",
      stamp,
      "Schedule registered structurally — no execution, no cron, no timers, no jobs",
    ),
    executionId: input.executionId,
    correlationId: input.correlationId,
    contextId: input.contextId,
    stateMachineId: input.stateMachineId,
    eventBusId: input.eventBusId,
    executionRegistryId: input.executionRegistryId,
    executionTraceId: input.executionTraceId,
    executionCapabilityRegistryId: input.executionCapabilityRegistryId,
    executionDependencyRegistryId: input.executionDependencyRegistryId,
    executionPolicyRegistryId: input.executionPolicyRegistryId,
    executionConstraintRegistryId: input.executionConstraintRegistryId,
    executionRequirementRegistryId: input.executionRequirementRegistryId,
    executionResourceRegistryId: input.executionResourceRegistryId,
    executionEnvironmentRegistryId: input.executionEnvironmentRegistryId,
    executionMessageQueueId: input.executionMessageQueueId,
    executionWorkerId: input.executionWorkerId,
    pipelineId: input.pipelineId,
    configuration,
    references: buildReferences(input),
    capability: STRUCTURAL_SCHEDULER_FOUNDATION_CAPABILITY,
    createdAt: stamp,
    updatedAt: stamp,
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
    persistenceImplemented: false,
    databaseUsed: false,
  };

  const stored: StoredCanonicalSchedule = { schedule };
  store.setSchedule(stored);
  return schedule;
}

export function updateScheduleStatus(
  store: ExecutionSchedulerStore,
  executionSchedulerId: string,
  status: StructuralScheduleLifecycleStatus | "registered-structural",
  stamp: string,
  notes?: string,
): CanonicalSchedule | undefined {
  const existing = store.getSchedule(executionSchedulerId);
  if (!existing) return undefined;

  const updated: CanonicalSchedule = {
    ...existing.schedule,
    status: buildStatus(status, stamp, notes),
    updatedAt: stamp,
  };
  store.setSchedule({ schedule: updated });
  return updated;
}

export function buildStatistics(
  store: ExecutionSchedulerStore,
  stamp: string,
): CanonicalScheduleStatistics {
  return {
    kind: "canonical-schedule-statistics",
    totalSchedules: store.scheduleCount(),
    totalReferences: store.referenceCount(),
    computedAt: stamp,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    executionPerformed: false,
    scheduleExecuted: false,
    cronUsed: false,
    timersUsed: false,
    jobsDispatched: false,
    workersStarted: false,
    processingPerformed: false,
    realSchedulerBackend: false,
  };
}

export function buildStructuralHealth(
  store: ExecutionSchedulerStore,
  stamp: string,
  message?: string,
): CanonicalScheduleHealth {
  return {
    kind: "canonical-schedule-health",
    ok: true,
    message: message ?? "Scheduler Foundation structural health ok — in-memory only",
    scheduleCount: store.scheduleCount(),
    indexReady: true,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    executionPerformed: false,
    scheduleExecuted: false,
    cronUsed: false,
    timersUsed: false,
    jobsDispatched: false,
    workersStarted: false,
    processingPerformed: false,
    realSchedulerBackend: false,
    checkedAt: stamp,
  };
}

/** Flags literais de negação reutilizadas em resultados estruturais. */
export const STRUCTURAL_SCHEDULER_NEGATION_FLAGS = {
  executionPerformed: false as const,
  scheduleExecuted: false as const,
  cronUsed: false as const,
  timersUsed: false as const,
  jobsDispatched: false as const,
  workersStarted: false as const,
  processingPerformed: false as const,
  realSchedulerBackend: false as const,
  enginesInvoked: false as const,
  persistenceImplemented: false as const,
  databaseUsed: false as const,
};

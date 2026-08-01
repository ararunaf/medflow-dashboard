/**
 * Helpers internos do Worker Foundation (INF-02).
 *
 * Somente criação / registro / armazenamento estrutural in-memory.
 * Sem persistência real. Sem banco. Sem Engines. Sem execução.
 * Sem threads. Sem background jobs. Sem concorrência. Sem consumo de mensagens.
 */
import { createExecutionWorkerId } from "../ports/identity";
import {
  STRUCTURAL_WORKER_FOUNDATION_CAPABILITY,
  type CanonicalWorker,
  type CanonicalWorkerConfiguration,
  type CanonicalWorkerHealth,
  type CanonicalWorkerIdentity,
  type CanonicalWorkerReference,
  type CanonicalWorkerStatistics,
  type CanonicalWorkerStatus,
  type CanonicalWorkerStatusValue,
} from "../ports/models";
import type {
  ExecutionWorkerPortCapabilities,
  GetWorkerInput,
  StructuralWorkerLifecycleStatus,
} from "../ports/types";
import type { ExecutionWorkerStore, StoredCanonicalWorker } from "../store";

export function foundationCapabilitiesBase(
  adapterId: string,
): Omit<ExecutionWorkerPortCapabilities, "provider"> {
  return {
    adapterId,
    supportsRegisterWorker: true,
    supportsUnregisterWorker: true,
    supportsStartWorker: true,
    supportsStopWorker: true,
    supportsPauseWorker: true,
    supportsResumeWorker: true,
    supportsGetWorker: true,
    supportsStatistics: true,
    supportsHealth: true,
    supportsCapabilities: true,
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
}

export type WorkerBuildFactories = {
  createWorkerId?: () => string;
};

function buildReferences(input: GetWorkerInput): CanonicalWorkerReference[] {
  const references: CanonicalWorkerReference[] = (input.references ?? []).map((ref) => ({
    kind: "canonical-worker-reference" as const,
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
      "Structural message queue reference via ExecutionQueuePort only",
    ],
    ["pipelineId", input.pipelineId, "Structural pipeline reference"],
  ];

  for (const [name, value, notes] of derived) {
    if (value) {
      references.push({
        kind: "canonical-worker-reference",
        name,
        value,
        notes,
      });
    }
  }

  return references;
}

function buildStatus(
  value: CanonicalWorkerStatusValue,
  stamp: string,
  notes?: string,
): CanonicalWorkerStatus {
  return {
    kind: "canonical-worker-status",
    value,
    updatedAt: stamp,
    notes,
    executionPerformed: false,
    threadsSpawned: false,
    backgroundJobsStarted: false,
    concurrencyEnabled: false,
    messagesConsumed: false,
    processingPerformed: false,
  };
}

export function ensureWorker(
  store: ExecutionWorkerStore,
  input: GetWorkerInput,
  stamp: string,
  factories?: WorkerBuildFactories,
): CanonicalWorker {
  const createWorkerId = factories?.createWorkerId ?? createExecutionWorkerId;

  if (input.executionWorkerId) {
    const existing = store.getWorker(input.executionWorkerId);
    if (existing) return existing.worker;
  }

  if (input.executionId) {
    const byExec = store.getWorkerByExecution(input.executionId);
    if (byExec) return byExec.worker;
  }

  const executionWorkerId = input.executionWorkerId ?? createWorkerId();
  const key = input.key ?? "structural-execution-worker";
  const name = input.name ?? "Structural Execution Worker";

  const identity: CanonicalWorkerIdentity = {
    kind: "canonical-worker-identity",
    executionWorkerId,
    key,
    name,
    version: input.version ?? "1",
  };

  const configuration: CanonicalWorkerConfiguration = {
    kind: "canonical-worker-configuration",
    key,
    name,
    version: input.version ?? "1",
    description: "Bootstrap structural execution worker — no real execution, no threads",
    portRef: "ExecutionWorkerPort",
    portContract: "structural-worker-foundation",
    queuePortContract: "ExecutionQueuePort",
    notes:
      "Structural worker configuration — no BullMQ/Hangfire/Azure/Lambda/Cloudflare/K8s/WorkerThreads",
    backendConnected: false,
    executionPerformed: false,
    threadsSpawned: false,
    backgroundJobsStarted: false,
    concurrencyEnabled: false,
    messagesConsumed: false,
    processingPerformed: false,
  };

  const worker: CanonicalWorker = {
    kind: "canonical-worker",
    id: executionWorkerId,
    executionWorkerId,
    identity,
    status: buildStatus(
      "registered-structural",
      stamp,
      "Worker registered structurally — no execution, no threads, no background jobs",
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
    pipelineId: input.pipelineId,
    configuration,
    references: buildReferences(input),
    capability: STRUCTURAL_WORKER_FOUNDATION_CAPABILITY,
    createdAt: stamp,
    updatedAt: stamp,
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
    persistenceImplemented: false,
    databaseUsed: false,
  };

  const stored: StoredCanonicalWorker = { worker };
  store.setWorker(stored);
  return worker;
}

export function updateWorkerStatus(
  store: ExecutionWorkerStore,
  executionWorkerId: string,
  status: StructuralWorkerLifecycleStatus | "registered-structural",
  stamp: string,
  notes?: string,
): CanonicalWorker | undefined {
  const existing = store.getWorker(executionWorkerId);
  if (!existing) return undefined;

  const updated: CanonicalWorker = {
    ...existing.worker,
    status: buildStatus(status, stamp, notes),
    updatedAt: stamp,
  };
  store.setWorker({ worker: updated });
  return updated;
}

export function buildStatistics(
  store: ExecutionWorkerStore,
  stamp: string,
): CanonicalWorkerStatistics {
  return {
    kind: "canonical-worker-statistics",
    totalWorkers: store.workerCount(),
    totalReferences: store.referenceCount(),
    computedAt: stamp,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    executionPerformed: false,
    threadsSpawned: false,
    backgroundJobsStarted: false,
    concurrencyEnabled: false,
    asynchronousProcessing: false,
    messagesConsumed: false,
    processingPerformed: false,
    realWorkerBackend: false,
  };
}

export function buildStructuralHealth(
  store: ExecutionWorkerStore,
  stamp: string,
  message?: string,
): CanonicalWorkerHealth {
  return {
    kind: "canonical-worker-health",
    ok: true,
    message: message ?? "Worker Foundation structural health ok — in-memory only",
    workerCount: store.workerCount(),
    indexReady: true,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    executionPerformed: false,
    threadsSpawned: false,
    backgroundJobsStarted: false,
    concurrencyEnabled: false,
    asynchronousProcessing: false,
    messagesConsumed: false,
    processingPerformed: false,
    realWorkerBackend: false,
    checkedAt: stamp,
  };
}

/** Flags literais de negação reutilizadas em resultados estruturais. */
export const STRUCTURAL_WORKER_NEGATION_FLAGS = {
  executionPerformed: false as const,
  threadsSpawned: false as const,
  backgroundJobsStarted: false as const,
  concurrencyEnabled: false as const,
  asynchronousProcessing: false as const,
  messagesConsumed: false as const,
  processingPerformed: false as const,
  realWorkerBackend: false as const,
  enginesInvoked: false as const,
  persistenceImplemented: false as const,
  databaseUsed: false as const,
};

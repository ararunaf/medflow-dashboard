/**
 * Helpers internos do Message Queue (INF-01).
 *
 * Somente criação / registro / armazenamento estrutural in-memory.
 * Sem persistência real. Sem banco. Sem Engines. Sem workers.
 * Sem publicação. Sem consumo. Sem processamento.
 */
import { createCanonicalQueueMessageId, createExecutionMessageQueueId } from "../ports/identity";
import {
  STRUCTURAL_MESSAGE_QUEUE_CAPABILITY,
  type CanonicalQueue,
  type CanonicalQueueConfiguration,
  type CanonicalQueueHealth,
  type CanonicalQueueMessage,
  type CanonicalQueueMessageStatus,
  type CanonicalQueueMetadata,
  type CanonicalQueueReference,
  type CanonicalQueueStatistics,
} from "../ports/models";
import type { EnqueueInput, ExecutionQueuePortCapabilities, GetQueueInput } from "../ports/types";
import type {
  MessageQueueStore,
  StoredCanonicalQueue,
  StoredCanonicalQueueMessage,
} from "../store";

export function foundationCapabilitiesBase(
  adapterId: string,
): Omit<ExecutionQueuePortCapabilities, "provider"> {
  return {
    adapterId,
    supportsEnqueue: true,
    supportsDequeue: true,
    supportsPeek: true,
    supportsAcknowledge: true,
    supportsReject: true,
    supportsRetry: true,
    supportsGetQueue: true,
    supportsGetStatistics: true,
    supportsHealth: true,
    supportsCapabilities: true,
    structuralMessageQueueOnly: true,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    messagesPublished: false,
    messagesConsumed: false,
    workersInvoked: false,
    realQueueBackend: false,
    implementsOcr: false,
    implementsAi: false,
    implementsTiss: false,
    implementsXmlParser: false,
    implementsRabbitMq: false,
    implementsRedis: false,
    implementsAzureQueue: false,
    implementsAwsSqs: false,
    implementsGooglePubSub: false,
    implementsCloudflareQueues: false,
    implementsPersistence: false,
    implementsUi: false,
    implementsHttpWorkersQueues: false,
    noDirectEngineCoupling: true,
    decoupledFromEngines: true,
  };
}

export type QueueBuildFactories = {
  createQueueId?: () => string;
  createMessageId?: () => string;
};

function buildReferences(input: GetQueueInput | EnqueueInput): CanonicalQueueReference[] {
  const references: CanonicalQueueReference[] = (input.references ?? []).map((ref) => ({
    kind: "canonical-queue-reference" as const,
    name: ref.name,
    value: ref.value,
    notes: ref.notes,
  }));

  const derived: Array<[string, string | undefined, string]> = [
    [
      "contextId",
      "contextId" in input ? input.contextId : undefined,
      "Structural context reference",
    ],
    [
      "stateMachineId",
      "stateMachineId" in input ? input.stateMachineId : undefined,
      "Structural state machine reference",
    ],
    [
      "eventBusId",
      "eventBusId" in input ? input.eventBusId : undefined,
      "Structural event bus reference",
    ],
    [
      "executionRegistryId",
      "executionRegistryId" in input ? input.executionRegistryId : undefined,
      "Structural execution registry reference",
    ],
    [
      "executionTraceId",
      "executionTraceId" in input ? input.executionTraceId : undefined,
      "Structural execution trace reference",
    ],
    [
      "executionCapabilityRegistryId",
      "executionCapabilityRegistryId" in input ? input.executionCapabilityRegistryId : undefined,
      "Structural capability registry reference",
    ],
    [
      "executionDependencyRegistryId",
      "executionDependencyRegistryId" in input ? input.executionDependencyRegistryId : undefined,
      "Structural dependency registry reference",
    ],
    [
      "executionPolicyRegistryId",
      "executionPolicyRegistryId" in input ? input.executionPolicyRegistryId : undefined,
      "Structural policy registry reference",
    ],
    [
      "executionConstraintRegistryId",
      "executionConstraintRegistryId" in input ? input.executionConstraintRegistryId : undefined,
      "Structural constraint registry reference",
    ],
    [
      "executionRequirementRegistryId",
      "executionRequirementRegistryId" in input ? input.executionRequirementRegistryId : undefined,
      "Structural requirement registry reference",
    ],
    [
      "executionResourceRegistryId",
      "executionResourceRegistryId" in input ? input.executionResourceRegistryId : undefined,
      "Structural resource registry reference",
    ],
    [
      "executionEnvironmentRegistryId",
      "executionEnvironmentRegistryId" in input ? input.executionEnvironmentRegistryId : undefined,
      "Structural environment registry reference",
    ],
    [
      "pipelineId",
      "pipelineId" in input ? input.pipelineId : undefined,
      "Structural pipeline reference",
    ],
  ];

  for (const [name, value, notes] of derived) {
    if (value) {
      references.push({
        kind: "canonical-queue-reference",
        name,
        value,
        notes,
      });
    }
  }

  return references;
}

export function ensureQueue(
  store: MessageQueueStore,
  input: GetQueueInput,
  stamp: string,
  factories?: QueueBuildFactories,
): CanonicalQueue {
  const createQueueId = factories?.createQueueId ?? createExecutionMessageQueueId;

  if (input.executionMessageQueueId) {
    const existing = store.getQueue(input.executionMessageQueueId);
    if (existing) return existing.queue;
  }

  if (input.executionId) {
    const byExec = store.getQueueByExecution(input.executionId);
    if (byExec) return byExec.queue;
  }

  const executionMessageQueueId = input.executionMessageQueueId ?? createQueueId();
  const key = input.key ?? "structural-execution-queue";
  const name = input.name ?? "Structural Execution Message Queue";

  const configuration: CanonicalQueueConfiguration = {
    kind: "canonical-queue-configuration",
    key,
    name,
    version: input.version ?? "1",
    description: "Bootstrap structural message queue — no real backend, no workers",
    portRef: "ExecutionQueuePort",
    portContract: "structural-message-queue",
    notes: "Structural queue configuration — no RabbitMQ/Redis/SQS/Azure/PubSub/Cloudflare",
    backendConnected: false,
    messagesPublished: false,
    messagesConsumed: false,
    workersInvoked: false,
    processingPerformed: false,
  };

  const metadata: CanonicalQueueMetadata = {
    kind: "canonical-queue-metadata",
    tags: input.tags ?? ["message-queue", "foundation", "structural"],
    version: input.version ?? "1",
    createdAt: stamp,
    updatedAt: stamp,
    structuralNotes:
      input.structuralNotes ??
      "Structural Message Queue — in-memory only, no publishing, no consumers, no workers, no engines",
    customAttributes: input.customAttributes,
  };

  const queue: CanonicalQueue = {
    kind: "canonical-queue",
    id: executionMessageQueueId,
    executionMessageQueueId,
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
    pipelineId: input.pipelineId,
    configuration,
    messageIds: [],
    messageCount: 0,
    references: buildReferences(input),
    metadata,
    capability: STRUCTURAL_MESSAGE_QUEUE_CAPABILITY,
    createdAt: stamp,
    updatedAt: stamp,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    messagesPublished: false,
    messagesConsumed: false,
    workersInvoked: false,
    realQueueBackend: false,
    persistenceImplemented: false,
    databaseUsed: false,
  };

  const stored: StoredCanonicalQueue = { queue };
  store.setQueue(stored);
  return queue;
}

export function buildMessage(
  input: EnqueueInput,
  queue: CanonicalQueue,
  stamp: string,
  factories?: QueueBuildFactories,
): CanonicalQueueMessage {
  const createMessageId = factories?.createMessageId ?? createCanonicalQueueMessageId;
  const messageId = input.messageId ?? createMessageId();

  const metadata: CanonicalQueueMetadata = {
    kind: "canonical-queue-metadata",
    tags: input.tags,
    version: "1",
    createdAt: stamp,
    updatedAt: stamp,
    structuralNotes:
      input.structuralNotes ??
      "Structural queue message — stored in-memory only, not published, not consumed",
  };

  return {
    kind: "canonical-queue-message",
    id: messageId,
    messageId,
    executionMessageQueueId: queue.executionMessageQueueId,
    executionId: input.executionId ?? queue.executionId,
    correlationId: input.correlationId ?? queue.correlationId,
    contextId: input.contextId ?? queue.contextId,
    payloadRef: input.payloadRef,
    status: "enqueued-structural",
    references: buildReferences(input),
    metadata,
    registeredAt: stamp,
    updatedAt: stamp,
    messagesPublished: false,
    messagesConsumed: false,
    workersInvoked: false,
    processingPerformed: false,
    enginesInvoked: false,
    persistenceImplemented: false,
    databaseUsed: false,
  };
}

export function appendMessageToQueue(
  store: MessageQueueStore,
  queue: CanonicalQueue,
  queueMessage: CanonicalQueueMessage,
  stamp: string,
): CanonicalQueue {
  const messageIds = [...queue.messageIds, queueMessage.messageId];
  const updated: CanonicalQueue = {
    ...queue,
    messageIds,
    messageCount: messageIds.length,
    updatedAt: stamp,
    metadata: {
      ...queue.metadata,
      updatedAt: stamp,
    },
  };
  store.setQueue({ queue: updated });
  return updated;
}

export function persistMessage(
  store: MessageQueueStore,
  queueMessage: CanonicalQueueMessage,
): void {
  const stored: StoredCanonicalQueueMessage = {
    queueMessage,
    queueId: queueMessage.executionMessageQueueId,
  };
  store.setMessage(stored);
}

export function updateMessageStatus(
  store: MessageQueueStore,
  messageId: string,
  status: CanonicalQueueMessageStatus,
  stamp: string,
): CanonicalQueueMessage | undefined {
  const existing = store.getMessage(messageId);
  if (!existing) return undefined;
  const updated: CanonicalQueueMessage = {
    ...existing.queueMessage,
    status,
    updatedAt: stamp,
    metadata: {
      ...existing.queueMessage.metadata,
      updatedAt: stamp,
    },
  };
  store.setMessage({
    queueMessage: updated,
    queueId: existing.queueId,
  });
  return updated;
}

export function buildStatistics(store: MessageQueueStore, stamp: string): CanonicalQueueStatistics {
  return {
    kind: "canonical-queue-statistics",
    totalQueues: store.queueCount(),
    totalMessages: store.messageCount(),
    totalReferences: store.referenceCount(),
    computedAt: stamp,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    messagesPublished: false,
    messagesConsumed: false,
    workersInvoked: false,
    processingPerformed: false,
    realQueueBackend: false,
  };
}

export function buildStructuralHealth(
  store: MessageQueueStore,
  stamp: string,
  message?: string,
): CanonicalQueueHealth {
  return {
    kind: "canonical-queue-health",
    ok: true,
    message: message ?? "Message Queue structural health ok — in-memory only",
    queueCount: store.queueCount(),
    messageCount: store.messageCount(),
    indexReady: true,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    messagesPublished: false,
    messagesConsumed: false,
    workersInvoked: false,
    processingPerformed: false,
    realQueueBackend: false,
    checkedAt: stamp,
  };
}

/** Flags literais de negação reutilizadas em resultados estruturais. */
export const STRUCTURAL_QUEUE_NEGATION_FLAGS = {
  messagesPublished: false as const,
  messagesConsumed: false as const,
  workersInvoked: false as const,
  processingPerformed: false as const,
  realQueueBackend: false as const,
  enginesInvoked: false as const,
  persistenceImplemented: false as const,
  databaseUsed: false as const,
};

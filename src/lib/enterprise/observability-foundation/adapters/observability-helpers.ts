/**
 * Helpers internos do Observability Foundation (INF-04).
 *
 * Somente criação / registro / armazenamento estrutural in-memory.
 * Sem persistência real. Sem banco. Sem Engines. Sem logs. Sem métricas.
 * Sem tracing. Sem transmissão de eventos. Sem backends externos.
 */
import { createExecutionObservabilityId } from "../ports/identity";
import {
  STRUCTURAL_OBSERVABILITY_FOUNDATION_CAPABILITY,
  type CanonicalObservation,
  type CanonicalObservationConfiguration,
  type CanonicalObservationHealth,
  type CanonicalObservationIdentity,
  type CanonicalObservationMetadata,
  type CanonicalObservationMetadataValue,
  type CanonicalObservationReference,
  type CanonicalObservationStatistics,
} from "../ports/models";
import type {
  ExecutionObservabilityPortCapabilities,
  GetObservationInput,
  StructuralObservationLifecycleStatus,
} from "../ports/types";
import type { ExecutionObservabilityStore, StoredCanonicalObservation } from "../store";

export function foundationCapabilitiesBase(
  adapterId: string,
): Omit<ExecutionObservabilityPortCapabilities, "provider"> {
  return {
    adapterId,
    supportsRegisterObservation: true,
    supportsUnregisterObservation: true,
    supportsGetObservation: true,
    supportsListObservations: true,
    supportsStatistics: true,
    supportsHealth: true,
    supportsCapabilities: true,
    structuralObservabilityOnly: true,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    loggingPerformed: false,
    metricsCollected: false,
    tracingPerformed: false,
    eventsTransmitted: false,
    externalIntegrationUsed: false,
    realObservabilityBackend: false,
    implementsOcr: false,
    implementsAi: false,
    implementsTiss: false,
    implementsXmlParser: false,
    implementsOpenTelemetry: false,
    implementsPrometheus: false,
    implementsGrafana: false,
    implementsAzureMonitor: false,
    implementsCloudWatch: false,
    implementsDatadog: false,
    implementsElasticApm: false,
    implementsPersistence: false,
    implementsUi: false,
    implementsHttpObservability: false,
    usesExecutionSchedulerPortOnly: true,
    noDirectEngineCoupling: true,
    decoupledFromEngines: true,
  };
}

export type ObservationBuildFactories = {
  createObservabilityId?: () => string;
};

function buildReferences(input: GetObservationInput): CanonicalObservationReference[] {
  const references: CanonicalObservationReference[] = (input.references ?? []).map((ref) => ({
    kind: "canonical-observation-reference" as const,
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
    ["executionWorkerId", input.executionWorkerId, "Structural worker reference (opaque id only)"],
    [
      "executionSchedulerId",
      input.executionSchedulerId,
      "Structural scheduler reference via ExecutionSchedulerPort only",
    ],
    ["pipelineId", input.pipelineId, "Structural pipeline reference"],
  ];

  for (const [name, value, notes] of derived) {
    if (value) {
      references.push({
        kind: "canonical-observation-reference",
        name,
        value,
        notes,
      });
    }
  }

  return references;
}

function buildMetadata(
  value: CanonicalObservationMetadataValue,
  stamp: string,
  notes?: string,
): CanonicalObservationMetadata {
  return {
    kind: "canonical-observation-metadata",
    value,
    updatedAt: stamp,
    notes,
    loggingPerformed: false,
    metricsCollected: false,
    tracingPerformed: false,
    eventsTransmitted: false,
    externalIntegrationUsed: false,
    processingPerformed: false,
  };
}

export function ensureObservation(
  store: ExecutionObservabilityStore,
  input: GetObservationInput,
  stamp: string,
  factories?: ObservationBuildFactories,
): CanonicalObservation {
  const createObservabilityId = factories?.createObservabilityId ?? createExecutionObservabilityId;

  if (input.executionObservabilityId) {
    const existing = store.getObservation(input.executionObservabilityId);
    if (existing) return existing.observation;
  }

  if (input.executionId) {
    const byExec = store.getObservationByExecution(input.executionId);
    if (byExec) return byExec.observation;
  }

  const executionObservabilityId = input.executionObservabilityId ?? createObservabilityId();
  const key = input.key ?? "structural-execution-observability";
  const name = input.name ?? "Structural Execution Observability";

  const identity: CanonicalObservationIdentity = {
    kind: "canonical-observation-identity",
    executionObservabilityId,
    key,
    name,
    version: input.version ?? "1",
  };

  const configuration: CanonicalObservationConfiguration = {
    kind: "canonical-observation-configuration",
    key,
    name,
    version: input.version ?? "1",
    description:
      "Bootstrap structural execution observability — no real logs, metrics, tracing or transmission",
    portRef: "ExecutionObservabilityPort",
    portContract: "structural-observability-foundation",
    schedulerPortContract: "ExecutionSchedulerPort",
    notes:
      "Structural observability configuration — no OpenTelemetry/Prometheus/Grafana/Azure Monitor/CloudWatch/Datadog/Elastic APM",
    backendConnected: false,
    loggingPerformed: false,
    metricsCollected: false,
    tracingPerformed: false,
    eventsTransmitted: false,
    externalIntegrationUsed: false,
    processingPerformed: false,
  };

  const observation: CanonicalObservation = {
    kind: "canonical-observation",
    id: executionObservabilityId,
    executionObservabilityId,
    identity,
    metadata: buildMetadata(
      "registered-structural",
      stamp,
      "Observation registered structurally — no logs, no metrics, no tracing, no transmission",
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
    executionSchedulerId: input.executionSchedulerId,
    pipelineId: input.pipelineId,
    configuration,
    references: buildReferences(input),
    capability: STRUCTURAL_OBSERVABILITY_FOUNDATION_CAPABILITY,
    createdAt: stamp,
    updatedAt: stamp,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    loggingPerformed: false,
    metricsCollected: false,
    tracingPerformed: false,
    eventsTransmitted: false,
    externalIntegrationUsed: false,
    realObservabilityBackend: false,
    persistenceImplemented: false,
    databaseUsed: false,
  };

  const stored: StoredCanonicalObservation = { observation };
  store.setObservation(stored);
  return observation;
}

export function updateObservationMetadata(
  store: ExecutionObservabilityStore,
  executionObservabilityId: string,
  status: StructuralObservationLifecycleStatus,
  stamp: string,
  notes?: string,
): CanonicalObservation | undefined {
  const existing = store.getObservation(executionObservabilityId);
  if (!existing) return undefined;

  const updated: CanonicalObservation = {
    ...existing.observation,
    metadata: buildMetadata(status, stamp, notes),
    updatedAt: stamp,
  };
  store.setObservation({ observation: updated });
  return updated;
}

export function buildStatistics(
  store: ExecutionObservabilityStore,
  stamp: string,
): CanonicalObservationStatistics {
  return {
    kind: "canonical-observation-statistics",
    totalObservations: store.observationCount(),
    totalReferences: store.referenceCount(),
    computedAt: stamp,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    loggingPerformed: false,
    metricsCollected: false,
    tracingPerformed: false,
    eventsTransmitted: false,
    externalIntegrationUsed: false,
    processingPerformed: false,
    realObservabilityBackend: false,
  };
}

export function buildStructuralHealth(
  store: ExecutionObservabilityStore,
  stamp: string,
  message?: string,
): CanonicalObservationHealth {
  return {
    kind: "canonical-observation-health",
    ok: true,
    message: message ?? "Observability Foundation structural health ok — in-memory only",
    observationCount: store.observationCount(),
    indexReady: true,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    loggingPerformed: false,
    metricsCollected: false,
    tracingPerformed: false,
    eventsTransmitted: false,
    externalIntegrationUsed: false,
    processingPerformed: false,
    realObservabilityBackend: false,
    checkedAt: stamp,
  };
}

/** Flags literais de negação reutilizadas em resultados estruturais. */
export const STRUCTURAL_OBSERVABILITY_NEGATION_FLAGS = {
  loggingPerformed: false as const,
  metricsCollected: false as const,
  tracingPerformed: false as const,
  eventsTransmitted: false as const,
  externalIntegrationUsed: false as const,
  processingPerformed: false as const,
  realObservabilityBackend: false as const,
  enginesInvoked: false as const,
  persistenceImplemented: false as const,
  databaseUsed: false as const,
};

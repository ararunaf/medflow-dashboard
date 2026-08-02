/**
 * Helpers internos do Health Center Foundation (INF-05).
 *
 * Somente criação / registro / armazenamento estrutural in-memory.
 * Sem persistência real. Sem banco. Sem Engines. Sem monitoramento.
 * Sem health checks. Sem polling. Sem dashboards. Sem diagnósticos.
 * Sem consultas externas. Sem consultas a Observability observations.
 */
import { createExecutionHealthCenterId, createHealthComponentId } from "../ports/identity";
import {
  STRUCTURAL_HEALTH_CENTER_FOUNDATION_CAPABILITY,
  type CanonicalHealthComponent,
  type CanonicalHealthComponentConfiguration,
  type CanonicalHealthComponentHealth,
  type CanonicalHealthComponentIdentity,
  type CanonicalHealthComponentReference,
  type CanonicalHealthComponentStatistics,
  type CanonicalHealthComponentStatus,
  type CanonicalHealthComponentStatusValue,
} from "../ports/models";
import type {
  ExecutionHealthCenterPortCapabilities,
  GetComponentInput,
  StructuralHealthComponentLifecycleStatus,
} from "../ports/types";
import type { ExecutionHealthCenterStore, StoredCanonicalHealthComponent } from "../store";

export function foundationCapabilitiesBase(
  adapterId: string,
): Omit<ExecutionHealthCenterPortCapabilities, "provider"> {
  return {
    adapterId,
    supportsRegisterComponent: true,
    supportsUnregisterComponent: true,
    supportsGetComponent: true,
    supportsListComponents: true,
    supportsStatistics: true,
    supportsHealth: true,
    supportsCapabilities: true,
    structuralHealthCenterOnly: true,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    monitoringPerformed: false,
    healthCheckPerformed: false,
    probingPerformed: false,
    diagnosticsExecuted: false,
    pollingPerformed: false,
    dashboardRendered: false,
    externalQueryPerformed: false,
    componentConsulted: false,
    externalIntegrationUsed: false,
    realHealthBackend: false,
    implementsOcr: false,
    implementsAi: false,
    implementsTiss: false,
    implementsXmlParser: false,
    implementsPersistence: false,
    implementsUi: false,
    implementsHttpHealth: false,
    implementsRealMonitoring: false,
    implementsRealHealthChecks: false,
    usesExecutionObservabilityPortOnly: true,
    noDirectEngineCoupling: true,
    decoupledFromEngines: true,
  };
}

export type HealthComponentBuildFactories = {
  createHealthCenterId?: () => string;
  createHealthComponentId?: () => string;
};

function buildReferences(input: GetComponentInput): CanonicalHealthComponentReference[] {
  const references: CanonicalHealthComponentReference[] = (input.references ?? []).map((ref) => ({
    kind: "canonical-health-component-reference" as const,
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
      "Structural scheduler reference (opaque id only)",
    ],
    [
      "executionObservabilityId",
      input.executionObservabilityId,
      "Structural observability reference via ExecutionObservabilityPort only — observation NOT consulted",
    ],
    ["pipelineId", input.pipelineId, "Structural pipeline reference"],
  ];

  for (const [name, value, notes] of derived) {
    if (value) {
      references.push({
        kind: "canonical-health-component-reference",
        name,
        value,
        notes,
      });
    }
  }

  return references;
}

function buildStatus(
  value: CanonicalHealthComponentStatusValue,
  stamp: string,
  notes?: string,
): CanonicalHealthComponentStatus {
  return {
    kind: "canonical-health-component-status",
    value,
    updatedAt: stamp,
    notes,
    monitoringPerformed: false,
    healthCheckPerformed: false,
    probingPerformed: false,
    diagnosticsExecuted: false,
    pollingPerformed: false,
    dashboardRendered: false,
    externalQueryPerformed: false,
    componentConsulted: false,
    externalIntegrationUsed: false,
    processingPerformed: false,
  };
}

/**
 * Resolve ou cria executionHealthCenterId estruturalmente.
 * NÃO consulta Observability. NÃO executa health checks.
 */
export function resolveExecutionHealthCenterId(
  store: ExecutionHealthCenterStore,
  input: GetComponentInput,
  factories?: HealthComponentBuildFactories,
): string {
  if (input.executionHealthCenterId) return input.executionHealthCenterId;

  if (input.executionId) {
    const existing = store.getComponentsByExecution(input.executionId);
    if (existing.length > 0) {
      return existing[0]!.component.executionHealthCenterId;
    }
  }

  const createHealthCenterId = factories?.createHealthCenterId ?? createExecutionHealthCenterId;
  return createHealthCenterId();
}

export function ensureComponent(
  store: ExecutionHealthCenterStore,
  input: GetComponentInput,
  stamp: string,
  factories?: HealthComponentBuildFactories,
): CanonicalHealthComponent {
  const createComponentId = factories?.createHealthComponentId ?? createHealthComponentId;

  if (input.healthComponentId) {
    const existing = store.getComponent(input.healthComponentId);
    if (existing) return existing.component;
  }

  const executionHealthCenterId = resolveExecutionHealthCenterId(store, input, factories);
  const key = input.key ?? "structural-health-component";

  const byKey = store.getComponentByHealthCenterAndKey(executionHealthCenterId, key);
  if (byKey) return byKey.component;

  const healthComponentId = input.healthComponentId ?? createComponentId();
  const name = input.name ?? "Structural Health Component";

  const identity: CanonicalHealthComponentIdentity = {
    kind: "canonical-health-component-identity",
    healthComponentId,
    executionHealthCenterId,
    key,
    name,
    version: input.version ?? "1",
  };

  const configuration: CanonicalHealthComponentConfiguration = {
    kind: "canonical-health-component-configuration",
    key,
    name,
    version: input.version ?? "1",
    description:
      "Bootstrap structural health component — no real monitoring, health checks, polling or diagnostics",
    portRef: "ExecutionHealthCenterPort",
    portContract: "structural-health-center-foundation",
    observabilityPortContract: "ExecutionObservabilityPort",
    notes:
      "Structural health center configuration — no real monitoring/health checks/polling/dashboards/diagnostics",
    backendConnected: false,
    monitoringPerformed: false,
    healthCheckPerformed: false,
    probingPerformed: false,
    diagnosticsExecuted: false,
    pollingPerformed: false,
    dashboardRendered: false,
    externalQueryPerformed: false,
    componentConsulted: false,
    externalIntegrationUsed: false,
    processingPerformed: false,
  };

  const component: CanonicalHealthComponent = {
    kind: "canonical-health-component",
    id: healthComponentId,
    healthComponentId,
    executionHealthCenterId,
    identity,
    status: buildStatus(
      "registered-structural",
      stamp,
      "Component registered structurally — no monitoring, no health checks, no queries",
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
    executionObservabilityId: input.executionObservabilityId,
    pipelineId: input.pipelineId,
    configuration,
    references: buildReferences(input),
    capability: STRUCTURAL_HEALTH_CENTER_FOUNDATION_CAPABILITY,
    createdAt: stamp,
    updatedAt: stamp,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    monitoringPerformed: false,
    healthCheckPerformed: false,
    probingPerformed: false,
    diagnosticsExecuted: false,
    pollingPerformed: false,
    dashboardRendered: false,
    externalQueryPerformed: false,
    componentConsulted: false,
    externalIntegrationUsed: false,
    realHealthBackend: false,
    persistenceImplemented: false,
    databaseUsed: false,
  };

  const stored: StoredCanonicalHealthComponent = { component };
  store.setComponent(stored);
  return component;
}

export function updateComponentStatus(
  store: ExecutionHealthCenterStore,
  healthComponentId: string,
  status: StructuralHealthComponentLifecycleStatus,
  stamp: string,
  notes?: string,
): CanonicalHealthComponent | undefined {
  const existing = store.getComponent(healthComponentId);
  if (!existing) return undefined;

  const updated: CanonicalHealthComponent = {
    ...existing.component,
    status: buildStatus(status, stamp, notes),
    updatedAt: stamp,
  };
  store.setComponent({ component: updated });
  return updated;
}

export function buildStatistics(
  store: ExecutionHealthCenterStore,
  stamp: string,
): CanonicalHealthComponentStatistics {
  return {
    kind: "canonical-health-component-statistics",
    totalComponents: store.componentCount(),
    totalReferences: store.referenceCount(),
    totalHealthCenters: store.healthCenterCount(),
    computedAt: stamp,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    monitoringPerformed: false,
    healthCheckPerformed: false,
    probingPerformed: false,
    diagnosticsExecuted: false,
    pollingPerformed: false,
    dashboardRendered: false,
    externalQueryPerformed: false,
    componentConsulted: false,
    externalIntegrationUsed: false,
    processingPerformed: false,
    realHealthBackend: false,
  };
}

export function buildStructuralHealth(
  store: ExecutionHealthCenterStore,
  stamp: string,
  message?: string,
): CanonicalHealthComponentHealth {
  return {
    kind: "canonical-health-component-health",
    ok: true,
    message: message ?? "Health Center Foundation structural health ok — in-memory only",
    componentCount: store.componentCount(),
    healthCenterCount: store.healthCenterCount(),
    indexReady: true,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    monitoringPerformed: false,
    healthCheckPerformed: false,
    probingPerformed: false,
    diagnosticsExecuted: false,
    pollingPerformed: false,
    dashboardRendered: false,
    externalQueryPerformed: false,
    componentConsulted: false,
    externalIntegrationUsed: false,
    processingPerformed: false,
    realHealthBackend: false,
    checkedAt: stamp,
  };
}

/** Flags literais de negação reutilizadas em resultados estruturais. */
export const STRUCTURAL_HEALTH_CENTER_NEGATION_FLAGS = {
  monitoringPerformed: false as const,
  healthCheckPerformed: false as const,
  probingPerformed: false as const,
  diagnosticsExecuted: false as const,
  pollingPerformed: false as const,
  dashboardRendered: false as const,
  externalQueryPerformed: false as const,
  componentConsulted: false as const,
  externalIntegrationUsed: false as const,
  processingPerformed: false as const,
  realHealthBackend: false as const,
  enginesInvoked: false as const,
  persistenceImplemented: false as const,
  databaseUsed: false as const,
};

/**
 * Helpers internos do Execution Resource Registry (EPC-24 Sprint 13).
 *
 * Somente criação / registro / armazenamento estrutural in-memory.
 * Sem persistência real. Sem banco. Sem Engines. Sem validação de recursos.
 * Sem alocação de recursos. Sem balanceamento de carga. Sem verificação de reserva/balanceamento.
 */
import {
  createExecutionResourceId,
  createExecutionResourceRegistryId,
  createResourceCategoryId,
  createResourceDefinitionId,
  createResourceScopeId,
} from "../ports/identity";
import {
  STRUCTURAL_RESOURCE_REGISTRY_CAPABILITY,
  type ExecutionResource,
  type ExecutionResourceCategory,
  type ExecutionResourceCategoryKind,
  type ExecutionResourceDefinition,
  type ExecutionResourceFilter,
  type ExecutionResourceHealth,
  type ExecutionResourceMetadata,
  type ExecutionResourceReference,
  type ExecutionResourceRegistry,
  type ExecutionResourceScope,
  type ExecutionResourceScopeKind,
  type ExecutionResourceStatistics,
} from "../ports/models";
import type {
  ExecutionResourceRegistryPortCapabilities,
  RegisterResourceInput,
} from "../ports/types";
import type {
  ExecutionResourceRegistryStore,
  StoredExecutionResource,
  StoredExecutionResourceRegistry,
} from "../store";

export function foundationCapabilitiesBase(
  adapterId: string,
): Omit<ExecutionResourceRegistryPortCapabilities, "provider"> {
  return {
    adapterId,
    supportsRegisterResource: true,
    supportsGetResource: true,
    supportsListResources: true,
    supportsFindResources: true,
    supportsHealth: true,
    supportsCapabilities: true,
    supportsStatistics: true,
    structuralResourceRegistryOnly: true,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    resourceAllocationImplemented: false,
    resourceReservationImplemented: false,
    loadBalancingImplemented: false,
    resourcesReserved: false,
    schedulingImplemented: false,
    resourcesAllocated: false,
    implementsOcr: false,
    implementsAi: false,
    implementsXmlParser: false,
    implementsResourceAllocation: false,
    implementsResourceReservation: false,
    implementsLoadBalancing: false,
    implementsScheduling: false,
    implementsPersistence: false,
    implementsUi: false,
    implementsHttpWorkersQueues: false,
    noDirectEngineCoupling: true,
    decoupledFromEngines: true,
    workersInvoked: false,
  };
}

export type ResourceBuildFactories = {
  createResourceId?: () => string;
  createDefinitionId?: () => string;
  createScopeId?: () => string;
  createCategoryId?: () => string;
  createRegistryId?: () => string;
};

function buildReferences(input: RegisterResourceInput): ExecutionResourceReference[] {
  const references: ExecutionResourceReference[] = (input.references ?? []).map((ref) => ({
    kind: "execution-resource-reference" as const,
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
    ["pipelineId", input.pipelineId, "Structural pipeline reference"],
  ];

  for (const [name, value, notes] of derived) {
    if (value) {
      references.push({
        kind: "execution-resource-reference",
        name,
        value,
        notes,
      });
    }
  }

  return references;
}

export function ensureResourceRegistry(
  store: ExecutionResourceRegistryStore,
  input: RegisterResourceInput,
  stamp: string,
  factories?: ResourceBuildFactories,
): ExecutionResourceRegistry {
  const createRegistryId = factories?.createRegistryId ?? createExecutionResourceRegistryId;

  if (input.executionResourceRegistryId) {
    const existing = store.getRegistry(input.executionResourceRegistryId);
    if (existing) return existing.registry;
  }

  if (input.executionId) {
    const byExec = store.getRegistryByExecution(input.executionId);
    if (byExec) return byExec.registry;
  }

  const executionResourceRegistryId = input.executionResourceRegistryId ?? createRegistryId();

  const references = buildReferences(input);

  const metadata: ExecutionResourceMetadata = {
    kind: "execution-resource-metadata",
    tags: input.tags,
    version: input.version ?? "1",
    createdAt: stamp,
    updatedAt: stamp,
    structuralNotes:
      input.structuralNotes ??
      "Structural Resource Registry — in-memory only, no resource allocation, no resource allocation engine, no engines",
    customAttributes: input.customAttributes,
  };

  const registry: ExecutionResourceRegistry = {
    kind: "execution-resource-registry",
    id: executionResourceRegistryId,
    executionResourceRegistryId,
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
    pipelineId: input.pipelineId,
    resourceIds: [],
    resourceKeys: [],
    resourceCount: 0,
    references,
    metadata,
    capability: STRUCTURAL_RESOURCE_REGISTRY_CAPABILITY,
    createdAt: stamp,
    updatedAt: stamp,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    resourceAllocationImplemented: false,
    resourceReservationImplemented: false,
    resourcesAllocated: false,
    workersInvoked: false,
    persistenceImplemented: false,
    databaseUsed: false,
  };

  const stored: StoredExecutionResourceRegistry = { registry };
  store.setRegistry(stored);
  return registry;
}

export function buildResource(
  input: RegisterResourceInput,
  registry: ExecutionResourceRegistry,
  stamp: string,
  factories?: ResourceBuildFactories,
): ExecutionResource {
  const createResourceId = factories?.createResourceId ?? createExecutionResourceId;
  const createDefinitionId = factories?.createDefinitionId ?? createResourceDefinitionId;
  const createScopeId = factories?.createScopeId ?? createResourceScopeId;
  const createCategoryId = factories?.createCategoryId ?? createResourceCategoryId;

  const executionResourceId = input.executionResourceId ?? createResourceId();
  const categoryKind: ExecutionResourceCategoryKind = input.category ?? "structural";
  const scopeKind: ExecutionResourceScopeKind = input.scope ?? "execution";

  const category: ExecutionResourceCategory = {
    kind: "execution-resource-category",
    id: createCategoryId(),
    category: categoryKind,
    label: input.categoryLabel ?? categoryKind,
    notes: "Structural resource category — no business interpretation",
    resourceAllocated: false,
    schedulingImplemented: false,
  };

  const scope: ExecutionResourceScope = {
    kind: "execution-resource-scope",
    id: createScopeId(),
    scope: scopeKind,
    label: input.scopeLabel ?? scopeKind,
    notes: "Structural resource scope — declared but not allocated",
    declared: true,
    evaluable: false,
    resourceAllocated: false,
    schedulingImplemented: false,
    resourcesAllocated: false,
  };

  const definition: ExecutionResourceDefinition = {
    kind: "execution-resource-definition",
    id: createDefinitionId(),
    key: input.key,
    version: input.definitionVersion ?? input.version ?? "1",
    description: input.definitionDescription,
    portRef: input.portRef,
    portContract: input.portContract,
    notes: "Structural resource definition — not allocatable in this sprint",
    enginesInvoked: false,
    resourceAllocated: false,
    schedulingImplemented: false,
    loadBalancingImplemented: false,
    resourcesReserved: false,
    resourcesAllocated: false,
  };

  const metadata: ExecutionResourceMetadata = {
    kind: "execution-resource-metadata",
    tags: input.tags,
    version: input.version ?? "1",
    createdAt: stamp,
    updatedAt: stamp,
    structuralNotes: input.structuralNotes,
    customAttributes: input.customAttributes,
  };

  return {
    kind: "execution-resource",
    id: executionResourceId,
    executionResourceId,
    executionResourceRegistryId: registry.executionResourceRegistryId,
    executionId: input.executionId ?? registry.executionId,
    correlationId: input.correlationId ?? registry.correlationId,
    contextId: input.contextId ?? registry.contextId,
    key: input.key,
    name: input.name,
    category,
    scope,
    definition,
    references: buildReferences(input),
    metadata,
    capability: STRUCTURAL_RESOURCE_REGISTRY_CAPABILITY,
    registeredAt: stamp,
    updatedAt: stamp,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    resourceAllocated: false,
    schedulingImplemented: false,
    resourcesAllocated: false,
    persistenceImplemented: false,
    databaseUsed: false,
  };
}

export function appendResourceToRegistry(
  store: ExecutionResourceRegistryStore,
  registry: ExecutionResourceRegistry,
  resource: ExecutionResource,
  stamp: string,
): ExecutionResourceRegistry {
  const resourceIds = [...registry.resourceIds, resource.executionResourceId];
  const resourceKeys = [...registry.resourceKeys, resource.key];

  const updated: ExecutionResourceRegistry = {
    ...registry,
    resourceIds,
    resourceKeys,
    resourceCount: resourceIds.length,
    updatedAt: stamp,
    metadata: {
      ...registry.metadata,
      updatedAt: stamp,
    },
  };

  store.setRegistry({ registry: updated });
  return updated;
}

export function persistResource(
  store: ExecutionResourceRegistryStore,
  resource: ExecutionResource,
): void {
  const stored: StoredExecutionResource = {
    resource,
    registryId: resource.executionResourceRegistryId,
  };
  store.setResource(stored);
}

export function matchesFilter(
  resource: ExecutionResource,
  filter?: ExecutionResourceFilter,
): boolean {
  if (!filter) return true;
  if (
    filter.executionResourceRegistryId &&
    resource.executionResourceRegistryId !== filter.executionResourceRegistryId
  ) {
    return false;
  }
  if (filter.executionResourceId && resource.executionResourceId !== filter.executionResourceId) {
    return false;
  }
  if (filter.executionId && resource.executionId !== filter.executionId) return false;
  if (filter.correlationId && resource.correlationId !== filter.correlationId) return false;
  if (filter.contextId && resource.contextId !== filter.contextId) return false;
  if (filter.key && resource.key !== filter.key) return false;
  if (filter.category && resource.category.category !== filter.category) return false;
  if (filter.scope && resource.scope.scope !== filter.scope) return false;
  if (filter.tags && filter.tags.length > 0) {
    const entryTags = resource.metadata.tags ?? [];
    const hasAll = filter.tags.every((tag) => entryTags.includes(tag));
    if (!hasAll) return false;
  }
  return true;
}

export function buildStatistics(
  store: ExecutionResourceRegistryStore,
  stamp: string,
): ExecutionResourceStatistics {
  return {
    kind: "execution-resource-statistics",
    totalRegistries: store.registryCount(),
    totalResources: store.resourceCount(),
    totalReferences: store.referenceCount(),
    totalCategories: store.categoryCount(),
    totalScopes: store.scopeCount(),
    computedAt: stamp,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    resourceAllocationImplemented: false,
    resourceReservationImplemented: false,
  };
}

export function buildStructuralHealth(
  store: ExecutionResourceRegistryStore,
  stamp: string,
  message?: string,
): ExecutionResourceHealth {
  return {
    kind: "execution-resource-health",
    ok: true,
    message: message ?? "Execution Resource Registry structural health ok — in-memory only",
    registryCount: store.registryCount(),
    resourceCount: store.resourceCount(),
    indexReady: true,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    resourceAllocationImplemented: false,
    resourceReservationImplemented: false,
    resourcesAllocated: false,
    checkedAt: stamp,
  };
}

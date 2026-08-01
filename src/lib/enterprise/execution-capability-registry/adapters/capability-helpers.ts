/**
 * Helpers internos do Execution Capability Registry (EPC-24 Sprint 08).
 *
 * Somente criação / registro / armazenamento estrutural in-memory.
 * Sem persistência real. Sem banco. Sem Engines. Sem descoberta automática.
 * Sem reflexão. Sem plugins. Sem carregamento dinâmico. Sem execução.
 */
import {
  createCapabilityCategoryId,
  createCapabilityDefinitionId,
  createCapabilityDescriptorId,
  createExecutionCapabilityId,
  createExecutionCapabilityRegistryId,
} from "../ports/identity";
import {
  STRUCTURAL_CAPABILITY_REGISTRY_CAPABILITY,
  type ExecutionCapability,
  type ExecutionCapabilityCategory,
  type ExecutionCapabilityCategoryKind,
  type ExecutionCapabilityDefinition,
  type ExecutionCapabilityDescriptor,
  type ExecutionCapabilityFilter,
  type ExecutionCapabilityHealth,
  type ExecutionCapabilityMetadata,
  type ExecutionCapabilityReference,
  type ExecutionCapabilityRegistry,
  type ExecutionCapabilityStatistics,
} from "../ports/models";
import type {
  ExecutionCapabilityRegistryPortCapabilities,
  RegisterCapabilityInput,
} from "../ports/types";
import type {
  ExecutionCapabilityRegistryStore,
  StoredExecutionCapability,
  StoredExecutionCapabilityRegistry,
} from "../store";

export function foundationCapabilitiesBase(
  adapterId: string,
): Omit<ExecutionCapabilityRegistryPortCapabilities, "provider"> {
  return {
    adapterId,
    supportsRegisterCapability: true,
    supportsGetCapability: true,
    supportsListCapabilities: true,
    supportsFindCapabilities: true,
    supportsHealth: true,
    supportsCapabilities: true,
    supportsStatistics: true,
    structuralCapabilityRegistryOnly: true,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    autoDiscoveryImplemented: false,
    dynamicLoadingImplemented: false,
    reflectionUsed: false,
    pluginsUsed: false,
    capabilitiesExecuted: false,
    implementsOcr: false,
    implementsAi: false,
    implementsXmlParser: false,
    implementsTissRules: false,
    implementsMapping: false,
    implementsValidation: false,
    implementsPersistence: false,
    implementsUi: false,
    implementsHttpWorkersQueues: false,
    noDirectEngineCoupling: true,
    decoupledFromEngines: true,
  };
}

export type CapabilityBuildFactories = {
  createCapabilityId?: () => string;
  createDefinitionId?: () => string;
  createDescriptorId?: () => string;
  createCategoryId?: () => string;
  createRegistryId?: () => string;
};

function buildReferences(input: RegisterCapabilityInput): ExecutionCapabilityReference[] {
  const references: ExecutionCapabilityReference[] = (input.references ?? []).map((ref) => ({
    kind: "execution-capability-reference" as const,
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
    ["pipelineId", input.pipelineId, "Structural pipeline reference"],
  ];

  for (const [name, value, notes] of derived) {
    if (value) {
      references.push({
        kind: "execution-capability-reference",
        name,
        value,
        notes,
      });
    }
  }

  return references;
}

export function ensureCapabilityRegistry(
  store: ExecutionCapabilityRegistryStore,
  input: RegisterCapabilityInput,
  stamp: string,
  factories?: CapabilityBuildFactories,
): ExecutionCapabilityRegistry {
  const createRegistryId = factories?.createRegistryId ?? createExecutionCapabilityRegistryId;

  if (input.executionCapabilityRegistryId) {
    const existing = store.getRegistry(input.executionCapabilityRegistryId);
    if (existing) return existing.registry;
  }

  if (input.executionId) {
    const byExec = store.getRegistryByExecution(input.executionId);
    if (byExec) return byExec.registry;
  }

  const executionCapabilityRegistryId = input.executionCapabilityRegistryId ?? createRegistryId();

  const references = buildReferences(input);

  const metadata: ExecutionCapabilityMetadata = {
    kind: "execution-capability-metadata",
    tags: input.tags,
    version: input.version ?? "1",
    createdAt: stamp,
    updatedAt: stamp,
    structuralNotes:
      input.structuralNotes ??
      "Structural capability registry — in-memory only, no auto-discovery, no engines",
    customAttributes: input.customAttributes,
  };

  const registry: ExecutionCapabilityRegistry = {
    kind: "execution-capability-registry",
    id: executionCapabilityRegistryId,
    executionCapabilityRegistryId,
    executionId: input.executionId,
    correlationId: input.correlationId,
    contextId: input.contextId,
    stateMachineId: input.stateMachineId,
    eventBusId: input.eventBusId,
    executionRegistryId: input.executionRegistryId,
    executionTraceId: input.executionTraceId,
    pipelineId: input.pipelineId,
    capabilityIds: [],
    capabilityKeys: [],
    capabilityCount: 0,
    references,
    metadata,
    capability: STRUCTURAL_CAPABILITY_REGISTRY_CAPABILITY,
    createdAt: stamp,
    updatedAt: stamp,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    autoDiscoveryImplemented: false,
    dynamicLoadingImplemented: false,
    capabilitiesExecuted: false,
    persistenceImplemented: false,
    databaseUsed: false,
  };

  const stored: StoredExecutionCapabilityRegistry = { registry };
  store.setRegistry(stored);
  return registry;
}

export function buildCapability(
  input: RegisterCapabilityInput,
  registry: ExecutionCapabilityRegistry,
  stamp: string,
  factories?: CapabilityBuildFactories,
): ExecutionCapability {
  const createCapabilityId = factories?.createCapabilityId ?? createExecutionCapabilityId;
  const createDefinitionId = factories?.createDefinitionId ?? createCapabilityDefinitionId;
  const createDescriptorId = factories?.createDescriptorId ?? createCapabilityDescriptorId;
  const createCategoryId = factories?.createCategoryId ?? createCapabilityCategoryId;

  const executionCapabilityId = input.executionCapabilityId ?? createCapabilityId();
  const categoryKind: ExecutionCapabilityCategoryKind = input.category ?? "structural";

  const category: ExecutionCapabilityCategory = {
    kind: "execution-capability-category",
    id: createCategoryId(),
    category: categoryKind,
    label: input.categoryLabel ?? categoryKind,
    notes: "Structural capability category — no business interpretation",
    autoDiscovered: false,
    dynamicallyLoaded: false,
  };

  const definition: ExecutionCapabilityDefinition = {
    kind: "execution-capability-definition",
    id: createDefinitionId(),
    key: input.key,
    version: input.definitionVersion ?? input.version ?? "1",
    description: input.definitionDescription,
    portRef: input.portRef,
    portContract: input.portContract,
    notes: "Structural capability definition — not executable in this sprint",
    enginesInvoked: false,
    autoDiscovered: false,
    dynamicallyLoaded: false,
    reflectionUsed: false,
    pluginsUsed: false,
  };

  const descriptor: ExecutionCapabilityDescriptor = {
    kind: "execution-capability-descriptor",
    id: createDescriptorId(),
    key: input.key,
    label: input.descriptorLabel ?? input.name,
    category: categoryKind,
    available: true,
    executable: false,
    notes: "Structural capability descriptor — available but not executed",
    enginesInvoked: false,
    autoDiscovered: false,
    dynamicallyLoaded: false,
  };

  const metadata: ExecutionCapabilityMetadata = {
    kind: "execution-capability-metadata",
    tags: input.tags,
    version: input.version ?? "1",
    createdAt: stamp,
    updatedAt: stamp,
    structuralNotes: input.structuralNotes,
    customAttributes: input.customAttributes,
  };

  return {
    kind: "execution-capability",
    id: executionCapabilityId,
    executionCapabilityId,
    executionCapabilityRegistryId: registry.executionCapabilityRegistryId,
    executionId: input.executionId ?? registry.executionId,
    correlationId: input.correlationId ?? registry.correlationId,
    contextId: input.contextId ?? registry.contextId,
    key: input.key,
    name: input.name,
    category,
    definition,
    descriptor,
    references: buildReferences(input),
    metadata,
    capability: STRUCTURAL_CAPABILITY_REGISTRY_CAPABILITY,
    registeredAt: stamp,
    updatedAt: stamp,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    autoDiscovered: false,
    dynamicallyLoaded: false,
    capabilitiesExecuted: false,
    persistenceImplemented: false,
    databaseUsed: false,
  };
}

export function appendCapabilityToRegistry(
  store: ExecutionCapabilityRegistryStore,
  registry: ExecutionCapabilityRegistry,
  capability: ExecutionCapability,
  stamp: string,
): ExecutionCapabilityRegistry {
  const capabilityIds = [...registry.capabilityIds, capability.executionCapabilityId];
  const capabilityKeys = [...registry.capabilityKeys, capability.key];

  const updated: ExecutionCapabilityRegistry = {
    ...registry,
    capabilityIds,
    capabilityKeys,
    capabilityCount: capabilityIds.length,
    updatedAt: stamp,
    metadata: {
      ...registry.metadata,
      updatedAt: stamp,
    },
  };

  store.setRegistry({ registry: updated });
  return updated;
}

export function persistCapability(
  store: ExecutionCapabilityRegistryStore,
  capability: ExecutionCapability,
): void {
  const stored: StoredExecutionCapability = {
    capability,
    registryId: capability.executionCapabilityRegistryId,
  };
  store.setCapability(stored);
}

export function matchesFilter(
  capability: ExecutionCapability,
  filter?: ExecutionCapabilityFilter,
): boolean {
  if (!filter) return true;
  if (
    filter.executionCapabilityRegistryId &&
    capability.executionCapabilityRegistryId !== filter.executionCapabilityRegistryId
  ) {
    return false;
  }
  if (
    filter.executionCapabilityId &&
    capability.executionCapabilityId !== filter.executionCapabilityId
  ) {
    return false;
  }
  if (filter.executionId && capability.executionId !== filter.executionId) return false;
  if (filter.correlationId && capability.correlationId !== filter.correlationId) return false;
  if (filter.contextId && capability.contextId !== filter.contextId) return false;
  if (filter.key && capability.key !== filter.key) return false;
  if (filter.category && capability.category.category !== filter.category) return false;
  if (filter.tags && filter.tags.length > 0) {
    const entryTags = capability.metadata.tags ?? [];
    const hasAll = filter.tags.every((tag) => entryTags.includes(tag));
    if (!hasAll) return false;
  }
  return true;
}

export function buildStatistics(
  store: ExecutionCapabilityRegistryStore,
  stamp: string,
): ExecutionCapabilityStatistics {
  return {
    kind: "execution-capability-statistics",
    totalRegistries: store.registryCount(),
    totalCapabilities: store.capabilityCount(),
    totalReferences: store.referenceCount(),
    totalCategories: store.categoryCount(),
    computedAt: stamp,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    autoDiscoveryImplemented: false,
    dynamicLoadingImplemented: false,
  };
}

export function buildStructuralHealth(
  store: ExecutionCapabilityRegistryStore,
  stamp: string,
  message?: string,
): ExecutionCapabilityHealth {
  return {
    kind: "execution-capability-health",
    ok: true,
    message: message ?? "Execution Capability Registry structural health ok — in-memory only",
    registryCount: store.registryCount(),
    capabilityCount: store.capabilityCount(),
    indexReady: true,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    autoDiscoveryImplemented: false,
    dynamicLoadingImplemented: false,
    checkedAt: stamp,
  };
}

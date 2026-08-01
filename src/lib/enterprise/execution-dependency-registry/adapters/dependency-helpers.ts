/**
 * Helpers internos do Execution Dependency Registry (EPC-24 Sprint 09).
 *
 * Somente criação / registro / armazenamento estrutural in-memory.
 * Sem persistência real. Sem banco. Sem Engines. Sem resolução de dependências.
 * Sem ordenação topológica. Sem DAG solver. Sem execução.
 */
import {
  createDependencyDefinitionId,
  createDependencyEdgeId,
  createDependencyGraphId,
  createDependencyNodeId,
  createExecutionDependencyId,
  createExecutionDependencyRegistryId,
} from "../ports/identity";
import {
  STRUCTURAL_DEPENDENCY_REGISTRY_CAPABILITY,
  type ExecutionDependency,
  type ExecutionDependencyDefinition,
  type ExecutionDependencyEdge,
  type ExecutionDependencyFilter,
  type ExecutionDependencyGraph,
  type ExecutionDependencyHealth,
  type ExecutionDependencyMetadata,
  type ExecutionDependencyNode,
  type ExecutionDependencyReference,
  type ExecutionDependencyRegistry,
  type ExecutionDependencyStatistics,
} from "../ports/models";
import type {
  ExecutionDependencyRegistryPortCapabilities,
  RegisterDependencyInput,
} from "../ports/types";
import type {
  ExecutionDependencyRegistryStore,
  StoredExecutionDependency,
  StoredExecutionDependencyRegistry,
} from "../store";

export function foundationCapabilitiesBase(
  adapterId: string,
): Omit<ExecutionDependencyRegistryPortCapabilities, "provider"> {
  return {
    adapterId,
    supportsRegisterDependency: true,
    supportsGetDependency: true,
    supportsListDependencies: true,
    supportsFindDependencies: true,
    supportsHealth: true,
    supportsCapabilities: true,
    supportsStatistics: true,
    structuralDependencyRegistryOnly: true,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    dependencyResolutionImplemented: false,
    topologicalSortImplemented: false,
    dagSolverImplemented: false,
    automaticOrderingImplemented: false,
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

export type DependencyBuildFactories = {
  createDependencyId?: () => string;
  createDefinitionId?: () => string;
  createGraphId?: () => string;
  createNodeId?: () => string;
  createEdgeId?: () => string;
  createRegistryId?: () => string;
};

function buildReferences(input: RegisterDependencyInput): ExecutionDependencyReference[] {
  const references: ExecutionDependencyReference[] = (input.references ?? []).map((ref) => ({
    kind: "execution-dependency-reference" as const,
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
    ["pipelineId", input.pipelineId, "Structural pipeline reference"],
  ];

  for (const [name, value, notes] of derived) {
    if (value) {
      references.push({
        kind: "execution-dependency-reference",
        name,
        value,
        notes,
      });
    }
  }

  return references;
}

export function ensureDependencyRegistry(
  store: ExecutionDependencyRegistryStore,
  input: RegisterDependencyInput,
  stamp: string,
  factories?: DependencyBuildFactories,
): ExecutionDependencyRegistry {
  const createRegistryId = factories?.createRegistryId ?? createExecutionDependencyRegistryId;

  if (input.executionDependencyRegistryId) {
    const existing = store.getRegistry(input.executionDependencyRegistryId);
    if (existing) return existing.registry;
  }

  if (input.executionId) {
    const byExec = store.getRegistryByExecution(input.executionId);
    if (byExec) return byExec.registry;
  }

  const executionDependencyRegistryId = input.executionDependencyRegistryId ?? createRegistryId();

  const references = buildReferences(input);

  const metadata: ExecutionDependencyMetadata = {
    kind: "execution-dependency-metadata",
    tags: input.tags,
    version: input.version ?? "1",
    createdAt: stamp,
    updatedAt: stamp,
    structuralNotes:
      input.structuralNotes ??
      "Structural dependency registry — in-memory only, no resolution, no ordering, no engines",
    customAttributes: input.customAttributes,
  };

  const registry: ExecutionDependencyRegistry = {
    kind: "execution-dependency-registry",
    id: executionDependencyRegistryId,
    executionDependencyRegistryId,
    executionId: input.executionId,
    correlationId: input.correlationId,
    contextId: input.contextId,
    stateMachineId: input.stateMachineId,
    eventBusId: input.eventBusId,
    executionRegistryId: input.executionRegistryId,
    executionTraceId: input.executionTraceId,
    executionCapabilityRegistryId: input.executionCapabilityRegistryId,
    pipelineId: input.pipelineId,
    dependencyIds: [],
    dependencyKeys: [],
    dependencyCount: 0,
    graphIds: [],
    references,
    metadata,
    capability: STRUCTURAL_DEPENDENCY_REGISTRY_CAPABILITY,
    createdAt: stamp,
    updatedAt: stamp,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    dependencyResolutionImplemented: false,
    topologicalSortImplemented: false,
    dagSolverImplemented: false,
    automaticOrderingImplemented: false,
    persistenceImplemented: false,
    databaseUsed: false,
  };

  const stored: StoredExecutionDependencyRegistry = { registry };
  store.setRegistry(stored);
  return registry;
}

export function buildDependency(
  input: RegisterDependencyInput,
  registry: ExecutionDependencyRegistry,
  stamp: string,
  factories?: DependencyBuildFactories,
): ExecutionDependency {
  const createDependencyId = factories?.createDependencyId ?? createExecutionDependencyId;
  const createDefinitionId = factories?.createDefinitionId ?? createDependencyDefinitionId;
  const createGraphId = factories?.createGraphId ?? createDependencyGraphId;
  const createNodeId = factories?.createNodeId ?? createDependencyNodeId;
  const createEdgeId = factories?.createEdgeId ?? createDependencyEdgeId;

  const executionDependencyId = input.executionDependencyId ?? createDependencyId();
  const sourceKey = input.sourceKey ?? input.key;
  const targetKey = input.targetKey ?? `${input.key}-target`;

  const definition: ExecutionDependencyDefinition = {
    kind: "execution-dependency-definition",
    id: createDefinitionId(),
    key: input.key,
    version: input.definitionVersion ?? input.version ?? "1",
    description: input.definitionDescription,
    sourceKey,
    targetKey,
    relation: input.relation ?? "depends-on",
    portRef: input.portRef,
    portContract: input.portContract,
    notes: "Structural dependency definition — not resolved / not ordered in this sprint",
    enginesInvoked: false,
    dependencyResolved: false,
    ordered: false,
    dagComputed: false,
    topologicalSortApplied: false,
  };

  const sourceNode: ExecutionDependencyNode = {
    kind: "execution-dependency-node",
    id: createNodeId(),
    key: sourceKey,
    label: input.sourceLabel ?? sourceKey,
    role: "source",
    notes: "Structural dependency source node — no resolution",
    dependencyResolved: false,
    ordered: false,
    dagComputed: false,
  };

  const targetNode: ExecutionDependencyNode = {
    kind: "execution-dependency-node",
    id: createNodeId(),
    key: targetKey,
    label: input.targetLabel ?? targetKey,
    role: "target",
    notes: "Structural dependency target node — no resolution",
    dependencyResolved: false,
    ordered: false,
    dagComputed: false,
  };

  const edge: ExecutionDependencyEdge = {
    kind: "execution-dependency-edge",
    id: createEdgeId(),
    fromNodeId: sourceNode.id,
    toNodeId: targetNode.id,
    fromKey: sourceKey,
    toKey: targetKey,
    relation: input.relation ?? "depends-on",
    notes: "Structural dependency edge — no DAG / no topological sort",
    dependencyResolved: false,
    ordered: false,
    dagComputed: false,
    topologicalSortApplied: false,
  };

  const graph: ExecutionDependencyGraph = {
    kind: "execution-dependency-graph",
    id: createGraphId(),
    nodes: [sourceNode, targetNode],
    edges: [edge],
    nodeCount: 2,
    edgeCount: 1,
    notes: "Structural dependency graph — representation only, not solved",
    dependencyResolved: false,
    ordered: false,
    dagComputed: false,
    topologicalSortApplied: false,
    dependencyResolutionApplied: false,
  };

  const metadata: ExecutionDependencyMetadata = {
    kind: "execution-dependency-metadata",
    tags: input.tags,
    version: input.version ?? "1",
    createdAt: stamp,
    updatedAt: stamp,
    structuralNotes: input.structuralNotes,
    customAttributes: input.customAttributes,
  };

  return {
    kind: "execution-dependency",
    id: executionDependencyId,
    executionDependencyId,
    executionDependencyRegistryId: registry.executionDependencyRegistryId,
    executionId: input.executionId ?? registry.executionId,
    correlationId: input.correlationId ?? registry.correlationId,
    contextId: input.contextId ?? registry.contextId,
    key: input.key,
    name: input.name,
    sourceKey,
    targetKey,
    definition,
    sourceNode,
    targetNode,
    edge,
    graph,
    references: buildReferences(input),
    metadata,
    capability: STRUCTURAL_DEPENDENCY_REGISTRY_CAPABILITY,
    registeredAt: stamp,
    updatedAt: stamp,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    dependencyResolved: false,
    ordered: false,
    dagComputed: false,
    topologicalSortApplied: false,
    persistenceImplemented: false,
    databaseUsed: false,
  };
}

export function appendDependencyToRegistry(
  store: ExecutionDependencyRegistryStore,
  registry: ExecutionDependencyRegistry,
  dependency: ExecutionDependency,
  stamp: string,
): ExecutionDependencyRegistry {
  const dependencyIds = [...registry.dependencyIds, dependency.executionDependencyId];
  const dependencyKeys = [...registry.dependencyKeys, dependency.key];
  const graphIds = [...registry.graphIds, dependency.graph.id];

  const updated: ExecutionDependencyRegistry = {
    ...registry,
    dependencyIds,
    dependencyKeys,
    dependencyCount: dependencyIds.length,
    graphIds,
    updatedAt: stamp,
    metadata: {
      ...registry.metadata,
      updatedAt: stamp,
    },
  };

  store.setRegistry({ registry: updated });
  return updated;
}

export function persistDependency(
  store: ExecutionDependencyRegistryStore,
  dependency: ExecutionDependency,
): void {
  const stored: StoredExecutionDependency = {
    dependency,
    registryId: dependency.executionDependencyRegistryId,
  };
  store.setDependency(stored);
}

export function matchesFilter(
  dependency: ExecutionDependency,
  filter?: ExecutionDependencyFilter,
): boolean {
  if (!filter) return true;
  if (
    filter.executionDependencyRegistryId &&
    dependency.executionDependencyRegistryId !== filter.executionDependencyRegistryId
  ) {
    return false;
  }
  if (
    filter.executionDependencyId &&
    dependency.executionDependencyId !== filter.executionDependencyId
  ) {
    return false;
  }
  if (filter.executionId && dependency.executionId !== filter.executionId) return false;
  if (filter.correlationId && dependency.correlationId !== filter.correlationId) return false;
  if (filter.contextId && dependency.contextId !== filter.contextId) return false;
  if (filter.key && dependency.key !== filter.key) return false;
  if (filter.sourceKey && dependency.sourceKey !== filter.sourceKey) return false;
  if (filter.targetKey && dependency.targetKey !== filter.targetKey) return false;
  if (filter.tags && filter.tags.length > 0) {
    const entryTags = dependency.metadata.tags ?? [];
    const hasAll = filter.tags.every((tag) => entryTags.includes(tag));
    if (!hasAll) return false;
  }
  return true;
}

export function buildStatistics(
  store: ExecutionDependencyRegistryStore,
  stamp: string,
): ExecutionDependencyStatistics {
  return {
    kind: "execution-dependency-statistics",
    totalRegistries: store.registryCount(),
    totalDependencies: store.dependencyCount(),
    totalReferences: store.referenceCount(),
    totalNodes: store.nodeCount(),
    totalEdges: store.edgeCount(),
    totalGraphs: store.graphCount(),
    computedAt: stamp,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    dependencyResolutionImplemented: false,
    topologicalSortImplemented: false,
    dagSolverImplemented: false,
  };
}

export function buildStructuralHealth(
  store: ExecutionDependencyRegistryStore,
  stamp: string,
  message?: string,
): ExecutionDependencyHealth {
  return {
    kind: "execution-dependency-health",
    ok: true,
    message: message ?? "Execution Dependency Registry structural health ok — in-memory only",
    registryCount: store.registryCount(),
    dependencyCount: store.dependencyCount(),
    indexReady: true,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    dependencyResolutionImplemented: false,
    topologicalSortImplemented: false,
    dagSolverImplemented: false,
    checkedAt: stamp,
  };
}

/**
 * Helpers internos do Execution Environment Registry (EPC-24 Sprint 14).
 *
 * Somente criação / registro / armazenamento estrutural in-memory.
 * Sem persistência real. Sem banco. Sem Engines. Sem seleção de ambientes.
 * Sem seleção de ambientes. Sem ativação de ambientes. Sem verificação de reserva/balanceamento.
 */
import {
  createExecutionEnvironmentId,
  createExecutionEnvironmentRegistryId,
  createEnvironmentCategoryId,
  createEnvironmentDefinitionId,
  createEnvironmentScopeId,
} from "../ports/identity";
import {
  STRUCTURAL_ENVIRONMENT_REGISTRY_CAPABILITY,
  type ExecutionEnvironment,
  type ExecutionEnvironmentCategory,
  type ExecutionEnvironmentCategoryKind,
  type ExecutionEnvironmentDefinition,
  type ExecutionEnvironmentFilter,
  type ExecutionEnvironmentHealth,
  type ExecutionEnvironmentMetadata,
  type ExecutionEnvironmentReference,
  type ExecutionEnvironmentRegistry,
  type ExecutionEnvironmentScope,
  type ExecutionEnvironmentScopeKind,
  type ExecutionEnvironmentStatistics,
} from "../ports/models";
import type {
  ExecutionEnvironmentRegistryPortCapabilities,
  RegisterEnvironmentInput,
} from "../ports/types";
import type {
  ExecutionEnvironmentRegistryStore,
  StoredExecutionEnvironment,
  StoredExecutionEnvironmentRegistry,
} from "../store";

export function foundationCapabilitiesBase(
  adapterId: string,
): Omit<ExecutionEnvironmentRegistryPortCapabilities, "provider"> {
  return {
    adapterId,
    supportsRegisterEnvironment: true,
    supportsGetEnvironment: true,
    supportsListEnvironments: true,
    supportsFindEnvironments: true,
    supportsHealth: true,
    supportsCapabilities: true,
    supportsStatistics: true,
    structuralEnvironmentRegistryOnly: true,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    environmentSelectionImplemented: false,
    environmentProvisioningImplemented: false,
    environmentActivationImplemented: false,
    environmentsSelected: false,
    environmentsProvisioned: false,
    environmentsActivated: false,
    implementsOcr: false,
    implementsAi: false,
    implementsXmlParser: false,
    implementsEnvironmentSelection: false,
    implementsEnvironmentProvisioning: false,
    implementsEnvironmentActivation: false,
    implementsPersistence: false,
    implementsUi: false,
    implementsHttpWorkersQueues: false,
    noDirectEngineCoupling: true,
    decoupledFromEngines: true,
    workersInvoked: false,
  };
}

export type EnvironmentBuildFactories = {
  createEnvironmentId?: () => string;
  createDefinitionId?: () => string;
  createScopeId?: () => string;
  createCategoryId?: () => string;
  createRegistryId?: () => string;
};

function buildReferences(input: RegisterEnvironmentInput): ExecutionEnvironmentReference[] {
  const references: ExecutionEnvironmentReference[] = (input.references ?? []).map((ref) => ({
    kind: "execution-environment-reference" as const,
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
    ["pipelineId", input.pipelineId, "Structural pipeline reference"],
  ];

  for (const [name, value, notes] of derived) {
    if (value) {
      references.push({
        kind: "execution-environment-reference",
        name,
        value,
        notes,
      });
    }
  }

  return references;
}

export function ensureEnvironmentRegistry(
  store: ExecutionEnvironmentRegistryStore,
  input: RegisterEnvironmentInput,
  stamp: string,
  factories?: EnvironmentBuildFactories,
): ExecutionEnvironmentRegistry {
  const createRegistryId = factories?.createRegistryId ?? createExecutionEnvironmentRegistryId;

  if (input.executionEnvironmentRegistryId) {
    const existing = store.getRegistry(input.executionEnvironmentRegistryId);
    if (existing) return existing.registry;
  }

  if (input.executionId) {
    const byExec = store.getRegistryByExecution(input.executionId);
    if (byExec) return byExec.registry;
  }

  const executionEnvironmentRegistryId = input.executionEnvironmentRegistryId ?? createRegistryId();

  const references = buildReferences(input);

  const metadata: ExecutionEnvironmentMetadata = {
    kind: "execution-environment-metadata",
    tags: input.tags,
    version: input.version ?? "1",
    createdAt: stamp,
    updatedAt: stamp,
    structuralNotes:
      input.structuralNotes ??
      "Structural Environment Registry — in-memory only, no environment selection, no environment selection engine, no engines",
    customAttributes: input.customAttributes,
  };

  const registry: ExecutionEnvironmentRegistry = {
    kind: "execution-environment-registry",
    id: executionEnvironmentRegistryId,
    executionEnvironmentRegistryId,
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
    pipelineId: input.pipelineId,
    environmentIds: [],
    environmentKeys: [],
    environmentCount: 0,
    references,
    metadata,
    capability: STRUCTURAL_ENVIRONMENT_REGISTRY_CAPABILITY,
    createdAt: stamp,
    updatedAt: stamp,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    environmentSelectionImplemented: false,
    environmentProvisioningImplemented: false,
    environmentsActivated: false,
    workersInvoked: false,
    persistenceImplemented: false,
    databaseUsed: false,
  };

  const stored: StoredExecutionEnvironmentRegistry = { registry };
  store.setRegistry(stored);
  return registry;
}

export function buildEnvironment(
  input: RegisterEnvironmentInput,
  registry: ExecutionEnvironmentRegistry,
  stamp: string,
  factories?: EnvironmentBuildFactories,
): ExecutionEnvironment {
  const createEnvironmentId = factories?.createEnvironmentId ?? createExecutionEnvironmentId;
  const createDefinitionId = factories?.createDefinitionId ?? createEnvironmentDefinitionId;
  const createScopeId = factories?.createScopeId ?? createEnvironmentScopeId;
  const createCategoryId = factories?.createCategoryId ?? createEnvironmentCategoryId;

  const executionEnvironmentId = input.executionEnvironmentId ?? createEnvironmentId();
  const categoryKind: ExecutionEnvironmentCategoryKind = input.category ?? "structural";
  const scopeKind: ExecutionEnvironmentScopeKind = input.scope ?? "execution";

  const category: ExecutionEnvironmentCategory = {
    kind: "execution-environment-category",
    id: createCategoryId(),
    category: categoryKind,
    label: input.categoryLabel ?? categoryKind,
    notes: "Structural environment category — no business interpretation",
    environmentSelected: false,
    environmentsProvisioned: false,
  };

  const scope: ExecutionEnvironmentScope = {
    kind: "execution-environment-scope",
    id: createScopeId(),
    scope: scopeKind,
    label: input.scopeLabel ?? scopeKind,
    notes: "Structural environment scope — declared but not allocated",
    declared: true,
    evaluable: false,
    environmentSelected: false,
    environmentsProvisioned: false,
    environmentsActivated: false,
  };

  const definition: ExecutionEnvironmentDefinition = {
    kind: "execution-environment-definition",
    id: createDefinitionId(),
    key: input.key,
    version: input.definitionVersion ?? input.version ?? "1",
    description: input.definitionDescription,
    portRef: input.portRef,
    portContract: input.portContract,
    notes: "Structural environment definition — not allocatable in this sprint",
    enginesInvoked: false,
    environmentSelected: false,
    environmentsProvisioned: false,
    environmentActivationImplemented: false,
    environmentsSelected: false,
    environmentsActivated: false,
  };

  const metadata: ExecutionEnvironmentMetadata = {
    kind: "execution-environment-metadata",
    tags: input.tags,
    version: input.version ?? "1",
    createdAt: stamp,
    updatedAt: stamp,
    structuralNotes: input.structuralNotes,
    customAttributes: input.customAttributes,
  };

  return {
    kind: "execution-environment",
    id: executionEnvironmentId,
    executionEnvironmentId,
    executionEnvironmentRegistryId: registry.executionEnvironmentRegistryId,
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
    capability: STRUCTURAL_ENVIRONMENT_REGISTRY_CAPABILITY,
    registeredAt: stamp,
    updatedAt: stamp,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    environmentSelected: false,
    environmentsProvisioned: false,
    environmentsActivated: false,
    persistenceImplemented: false,
    databaseUsed: false,
  };
}

export function appendEnvironmentToRegistry(
  store: ExecutionEnvironmentRegistryStore,
  registry: ExecutionEnvironmentRegistry,
  environment: ExecutionEnvironment,
  stamp: string,
): ExecutionEnvironmentRegistry {
  const environmentIds = [...registry.environmentIds, environment.executionEnvironmentId];
  const environmentKeys = [...registry.environmentKeys, environment.key];

  const updated: ExecutionEnvironmentRegistry = {
    ...registry,
    environmentIds,
    environmentKeys,
    environmentCount: environmentIds.length,
    updatedAt: stamp,
    metadata: {
      ...registry.metadata,
      updatedAt: stamp,
    },
  };

  store.setRegistry({ registry: updated });
  return updated;
}

export function persistEnvironment(
  store: ExecutionEnvironmentRegistryStore,
  environment: ExecutionEnvironment,
): void {
  const stored: StoredExecutionEnvironment = {
    environment,
    registryId: environment.executionEnvironmentRegistryId,
  };
  store.setEnvironment(stored);
}

export function matchesFilter(
  environment: ExecutionEnvironment,
  filter?: ExecutionEnvironmentFilter,
): boolean {
  if (!filter) return true;
  if (
    filter.executionEnvironmentRegistryId &&
    environment.executionEnvironmentRegistryId !== filter.executionEnvironmentRegistryId
  ) {
    return false;
  }
  if (
    filter.executionEnvironmentId &&
    environment.executionEnvironmentId !== filter.executionEnvironmentId
  ) {
    return false;
  }
  if (filter.executionId && environment.executionId !== filter.executionId) return false;
  if (filter.correlationId && environment.correlationId !== filter.correlationId) return false;
  if (filter.contextId && environment.contextId !== filter.contextId) return false;
  if (filter.key && environment.key !== filter.key) return false;
  if (filter.category && environment.category.category !== filter.category) return false;
  if (filter.scope && environment.scope.scope !== filter.scope) return false;
  if (filter.tags && filter.tags.length > 0) {
    const entryTags = environment.metadata.tags ?? [];
    const hasAll = filter.tags.every((tag) => entryTags.includes(tag));
    if (!hasAll) return false;
  }
  return true;
}

export function buildStatistics(
  store: ExecutionEnvironmentRegistryStore,
  stamp: string,
): ExecutionEnvironmentStatistics {
  return {
    kind: "execution-environment-statistics",
    totalRegistries: store.registryCount(),
    totalEnvironments: store.environmentCount(),
    totalReferences: store.referenceCount(),
    totalCategories: store.categoryCount(),
    totalScopes: store.scopeCount(),
    computedAt: stamp,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    environmentSelectionImplemented: false,
    environmentProvisioningImplemented: false,
  };
}

export function buildStructuralHealth(
  store: ExecutionEnvironmentRegistryStore,
  stamp: string,
  message?: string,
): ExecutionEnvironmentHealth {
  return {
    kind: "execution-environment-health",
    ok: true,
    message: message ?? "Execution Environment Registry structural health ok — in-memory only",
    registryCount: store.registryCount(),
    environmentCount: store.environmentCount(),
    indexReady: true,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    environmentSelectionImplemented: false,
    environmentProvisioningImplemented: false,
    environmentsActivated: false,
    checkedAt: stamp,
  };
}

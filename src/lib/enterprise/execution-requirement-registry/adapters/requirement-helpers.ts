/**
 * Helpers internos do Execution Requirement Registry (EPC-24 Sprint 12).
 *
 * Somente criação / registro / armazenamento estrutural in-memory.
 * Sem persistência real. Sem banco. Sem Engines. Sem validação de requisitos.
 * Sem Rule Engine. Sem Decision Engine. Sem verificação de pré-condições.
 */
import {
  createExecutionRequirementId,
  createExecutionRequirementRegistryId,
  createRequirementCategoryId,
  createRequirementDefinitionId,
  createRequirementScopeId,
} from "../ports/identity";
import {
  STRUCTURAL_REQUIREMENT_REGISTRY_CAPABILITY,
  type ExecutionRequirement,
  type ExecutionRequirementCategory,
  type ExecutionRequirementCategoryKind,
  type ExecutionRequirementDefinition,
  type ExecutionRequirementFilter,
  type ExecutionRequirementHealth,
  type ExecutionRequirementMetadata,
  type ExecutionRequirementReference,
  type ExecutionRequirementRegistry,
  type ExecutionRequirementScope,
  type ExecutionRequirementScopeKind,
  type ExecutionRequirementStatistics,
} from "../ports/models";
import type {
  ExecutionRequirementRegistryPortCapabilities,
  RegisterRequirementInput,
} from "../ports/types";
import type {
  ExecutionRequirementRegistryStore,
  StoredExecutionRequirement,
  StoredExecutionRequirementRegistry,
} from "../store";

export function foundationCapabilitiesBase(
  adapterId: string,
): Omit<ExecutionRequirementRegistryPortCapabilities, "provider"> {
  return {
    adapterId,
    supportsRegisterRequirement: true,
    supportsGetRequirement: true,
    supportsListRequirements: true,
    supportsFindRequirements: true,
    supportsHealth: true,
    supportsCapabilities: true,
    supportsStatistics: true,
    structuralRequirementRegistryOnly: true,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    requirementValidationImplemented: false,
    ruleEngineInvoked: false,
    decisionEngineInvoked: false,
    rulesEnforced: false,
    rulesApplied: false,
    requirementsValidated: false,
    implementsOcr: false,
    implementsAi: false,
    implementsXmlParser: false,
    implementsRequirementValidation: false,
    implementsExecutionBlocking: false,
    implementsDecisionEngine: false,
    implementsRuleExecution: false,
    implementsPersistence: false,
    implementsUi: false,
    implementsHttpWorkersQueues: false,
    noDirectEngineCoupling: true,
    decoupledFromEngines: true,
    executionBlocked: false,
  };
}

export type RequirementBuildFactories = {
  createRequirementId?: () => string;
  createDefinitionId?: () => string;
  createScopeId?: () => string;
  createCategoryId?: () => string;
  createRegistryId?: () => string;
};

function buildReferences(input: RegisterRequirementInput): ExecutionRequirementReference[] {
  const references: ExecutionRequirementReference[] = (input.references ?? []).map((ref) => ({
    kind: "execution-requirement-reference" as const,
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
    ["pipelineId", input.pipelineId, "Structural pipeline reference"],
  ];

  for (const [name, value, notes] of derived) {
    if (value) {
      references.push({
        kind: "execution-requirement-reference",
        name,
        value,
        notes,
      });
    }
  }

  return references;
}

export function ensureRequirementRegistry(
  store: ExecutionRequirementRegistryStore,
  input: RegisterRequirementInput,
  stamp: string,
  factories?: RequirementBuildFactories,
): ExecutionRequirementRegistry {
  const createRegistryId = factories?.createRegistryId ?? createExecutionRequirementRegistryId;

  if (input.executionRequirementRegistryId) {
    const existing = store.getRegistry(input.executionRequirementRegistryId);
    if (existing) return existing.registry;
  }

  if (input.executionId) {
    const byExec = store.getRegistryByExecution(input.executionId);
    if (byExec) return byExec.registry;
  }

  const executionRequirementRegistryId = input.executionRequirementRegistryId ?? createRegistryId();

  const references = buildReferences(input);

  const metadata: ExecutionRequirementMetadata = {
    kind: "execution-requirement-metadata",
    tags: input.tags,
    version: input.version ?? "1",
    createdAt: stamp,
    updatedAt: stamp,
    structuralNotes:
      input.structuralNotes ??
      "Structural Requirement Registry — in-memory only, no requirement validation, no rule engine, no engines",
    customAttributes: input.customAttributes,
  };

  const registry: ExecutionRequirementRegistry = {
    kind: "execution-requirement-registry",
    id: executionRequirementRegistryId,
    executionRequirementRegistryId,
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
    pipelineId: input.pipelineId,
    requirementIds: [],
    requirementKeys: [],
    requirementCount: 0,
    references,
    metadata,
    capability: STRUCTURAL_REQUIREMENT_REGISTRY_CAPABILITY,
    createdAt: stamp,
    updatedAt: stamp,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    requirementValidationImplemented: false,
    ruleEngineInvoked: false,
    requirementsValidated: false,
    executionBlocked: false,
    persistenceImplemented: false,
    databaseUsed: false,
  };

  const stored: StoredExecutionRequirementRegistry = { registry };
  store.setRegistry(stored);
  return registry;
}

export function buildRequirement(
  input: RegisterRequirementInput,
  registry: ExecutionRequirementRegistry,
  stamp: string,
  factories?: RequirementBuildFactories,
): ExecutionRequirement {
  const createRequirementId = factories?.createRequirementId ?? createExecutionRequirementId;
  const createDefinitionId = factories?.createDefinitionId ?? createRequirementDefinitionId;
  const createScopeId = factories?.createScopeId ?? createRequirementScopeId;
  const createCategoryId = factories?.createCategoryId ?? createRequirementCategoryId;

  const executionRequirementId = input.executionRequirementId ?? createRequirementId();
  const categoryKind: ExecutionRequirementCategoryKind = input.category ?? "structural";
  const scopeKind: ExecutionRequirementScopeKind = input.scope ?? "execution";

  const category: ExecutionRequirementCategory = {
    kind: "execution-requirement-category",
    id: createCategoryId(),
    category: categoryKind,
    label: input.categoryLabel ?? categoryKind,
    notes: "Structural requirement category — no business interpretation",
    requirementValidated: false,
    rulesApplied: false,
  };

  const scope: ExecutionRequirementScope = {
    kind: "execution-requirement-scope",
    id: createScopeId(),
    scope: scopeKind,
    label: input.scopeLabel ?? scopeKind,
    notes: "Structural requirement scope — declared but not validated",
    declared: true,
    evaluable: false,
    requirementValidated: false,
    rulesApplied: false,
    requirementsValidated: false,
  };

  const definition: ExecutionRequirementDefinition = {
    kind: "execution-requirement-definition",
    id: createDefinitionId(),
    key: input.key,
    version: input.definitionVersion ?? input.version ?? "1",
    description: input.definitionDescription,
    portRef: input.portRef,
    portContract: input.portContract,
    notes: "Structural requirement definition — not validatable in this sprint",
    enginesInvoked: false,
    requirementValidated: false,
    rulesApplied: false,
    decisionEngineInvoked: false,
    rulesEnforced: false,
    requirementsValidated: false,
  };

  const metadata: ExecutionRequirementMetadata = {
    kind: "execution-requirement-metadata",
    tags: input.tags,
    version: input.version ?? "1",
    createdAt: stamp,
    updatedAt: stamp,
    structuralNotes: input.structuralNotes,
    customAttributes: input.customAttributes,
  };

  return {
    kind: "execution-requirement",
    id: executionRequirementId,
    executionRequirementId,
    executionRequirementRegistryId: registry.executionRequirementRegistryId,
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
    capability: STRUCTURAL_REQUIREMENT_REGISTRY_CAPABILITY,
    registeredAt: stamp,
    updatedAt: stamp,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    requirementValidated: false,
    rulesApplied: false,
    requirementsValidated: false,
    persistenceImplemented: false,
    databaseUsed: false,
  };
}

export function appendRequirementToRegistry(
  store: ExecutionRequirementRegistryStore,
  registry: ExecutionRequirementRegistry,
  requirement: ExecutionRequirement,
  stamp: string,
): ExecutionRequirementRegistry {
  const requirementIds = [...registry.requirementIds, requirement.executionRequirementId];
  const requirementKeys = [...registry.requirementKeys, requirement.key];

  const updated: ExecutionRequirementRegistry = {
    ...registry,
    requirementIds,
    requirementKeys,
    requirementCount: requirementIds.length,
    updatedAt: stamp,
    metadata: {
      ...registry.metadata,
      updatedAt: stamp,
    },
  };

  store.setRegistry({ registry: updated });
  return updated;
}

export function persistRequirement(
  store: ExecutionRequirementRegistryStore,
  requirement: ExecutionRequirement,
): void {
  const stored: StoredExecutionRequirement = {
    requirement,
    registryId: requirement.executionRequirementRegistryId,
  };
  store.setRequirement(stored);
}

export function matchesFilter(
  requirement: ExecutionRequirement,
  filter?: ExecutionRequirementFilter,
): boolean {
  if (!filter) return true;
  if (
    filter.executionRequirementRegistryId &&
    requirement.executionRequirementRegistryId !== filter.executionRequirementRegistryId
  ) {
    return false;
  }
  if (
    filter.executionRequirementId &&
    requirement.executionRequirementId !== filter.executionRequirementId
  ) {
    return false;
  }
  if (filter.executionId && requirement.executionId !== filter.executionId) return false;
  if (filter.correlationId && requirement.correlationId !== filter.correlationId) return false;
  if (filter.contextId && requirement.contextId !== filter.contextId) return false;
  if (filter.key && requirement.key !== filter.key) return false;
  if (filter.category && requirement.category.category !== filter.category) return false;
  if (filter.scope && requirement.scope.scope !== filter.scope) return false;
  if (filter.tags && filter.tags.length > 0) {
    const entryTags = requirement.metadata.tags ?? [];
    const hasAll = filter.tags.every((tag) => entryTags.includes(tag));
    if (!hasAll) return false;
  }
  return true;
}

export function buildStatistics(
  store: ExecutionRequirementRegistryStore,
  stamp: string,
): ExecutionRequirementStatistics {
  return {
    kind: "execution-requirement-statistics",
    totalRegistries: store.registryCount(),
    totalRequirements: store.requirementCount(),
    totalReferences: store.referenceCount(),
    totalCategories: store.categoryCount(),
    totalScopes: store.scopeCount(),
    computedAt: stamp,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    requirementValidationImplemented: false,
    ruleEngineInvoked: false,
  };
}

export function buildStructuralHealth(
  store: ExecutionRequirementRegistryStore,
  stamp: string,
  message?: string,
): ExecutionRequirementHealth {
  return {
    kind: "execution-requirement-health",
    ok: true,
    message: message ?? "Execution Requirement Registry structural health ok — in-memory only",
    registryCount: store.registryCount(),
    requirementCount: store.requirementCount(),
    indexReady: true,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    requirementValidationImplemented: false,
    ruleEngineInvoked: false,
    requirementsValidated: false,
    checkedAt: stamp,
  };
}

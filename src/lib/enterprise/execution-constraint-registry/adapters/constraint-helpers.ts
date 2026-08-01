/**
 * Helpers internos do Execution Constraint Registry (EPC-24 Sprint 11).
 *
 * Somente criação / registro / armazenamento estrutural in-memory.
 * Sem persistência real. Sem banco. Sem Engines. Sem interpretação de restrições.
 * Sem Rule Engine. Sem Decision Engine. Sem aplicação de regras.
 */
import {
  createExecutionConstraintId,
  createExecutionConstraintRegistryId,
  createConstraintCategoryId,
  createConstraintDefinitionId,
  createConstraintScopeId,
} from "../ports/identity";
import {
  STRUCTURAL_CONSTRAINT_REGISTRY_CAPABILITY,
  type ExecutionConstraint,
  type ExecutionConstraintCategory,
  type ExecutionConstraintCategoryKind,
  type ExecutionConstraintDefinition,
  type ExecutionConstraintFilter,
  type ExecutionConstraintHealth,
  type ExecutionConstraintMetadata,
  type ExecutionConstraintReference,
  type ExecutionConstraintRegistry,
  type ExecutionConstraintScope,
  type ExecutionConstraintScopeKind,
  type ExecutionConstraintStatistics,
} from "../ports/models";
import type {
  ExecutionConstraintRegistryPortCapabilities,
  RegisterConstraintInput,
} from "../ports/types";
import type {
  ExecutionConstraintRegistryStore,
  StoredExecutionConstraint,
  StoredExecutionConstraintRegistry,
} from "../store";

export function foundationCapabilitiesBase(
  adapterId: string,
): Omit<ExecutionConstraintRegistryPortCapabilities, "provider"> {
  return {
    adapterId,
    supportsRegisterConstraint: true,
    supportsGetConstraint: true,
    supportsListConstraints: true,
    supportsFindConstraints: true,
    supportsHealth: true,
    supportsCapabilities: true,
    supportsStatistics: true,
    structuralConstraintRegistryOnly: true,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    constraintValidationImplemented: false,
    ruleEngineInvoked: false,
    decisionEngineInvoked: false,
    rulesEnforced: false,
    rulesApplied: false,
    constraintsValidated: false,
    implementsOcr: false,
    implementsAi: false,
    implementsXmlParser: false,
    implementsConstraintValidation: false,
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

export type ConstraintBuildFactories = {
  createConstraintId?: () => string;
  createDefinitionId?: () => string;
  createScopeId?: () => string;
  createCategoryId?: () => string;
  createRegistryId?: () => string;
};

function buildReferences(input: RegisterConstraintInput): ExecutionConstraintReference[] {
  const references: ExecutionConstraintReference[] = (input.references ?? []).map((ref) => ({
    kind: "execution-constraint-reference" as const,
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
    ["pipelineId", input.pipelineId, "Structural pipeline reference"],
  ];

  for (const [name, value, notes] of derived) {
    if (value) {
      references.push({
        kind: "execution-constraint-reference",
        name,
        value,
        notes,
      });
    }
  }

  return references;
}

export function ensureConstraintRegistry(
  store: ExecutionConstraintRegistryStore,
  input: RegisterConstraintInput,
  stamp: string,
  factories?: ConstraintBuildFactories,
): ExecutionConstraintRegistry {
  const createRegistryId = factories?.createRegistryId ?? createExecutionConstraintRegistryId;

  if (input.executionConstraintRegistryId) {
    const existing = store.getRegistry(input.executionConstraintRegistryId);
    if (existing) return existing.registry;
  }

  if (input.executionId) {
    const byExec = store.getRegistryByExecution(input.executionId);
    if (byExec) return byExec.registry;
  }

  const executionConstraintRegistryId = input.executionConstraintRegistryId ?? createRegistryId();

  const references = buildReferences(input);

  const metadata: ExecutionConstraintMetadata = {
    kind: "execution-constraint-metadata",
    tags: input.tags,
    version: input.version ?? "1",
    createdAt: stamp,
    updatedAt: stamp,
    structuralNotes:
      input.structuralNotes ??
      "Structural Constraint Registry — in-memory only, no constraint interpretation, no rule engine, no engines",
    customAttributes: input.customAttributes,
  };

  const registry: ExecutionConstraintRegistry = {
    kind: "execution-constraint-registry",
    id: executionConstraintRegistryId,
    executionConstraintRegistryId,
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
    pipelineId: input.pipelineId,
    constraintIds: [],
    constraintKeys: [],
    constraintCount: 0,
    references,
    metadata,
    capability: STRUCTURAL_CONSTRAINT_REGISTRY_CAPABILITY,
    createdAt: stamp,
    updatedAt: stamp,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    constraintValidationImplemented: false,
    ruleEngineInvoked: false,
    constraintsValidated: false,
    executionBlocked: false,
    persistenceImplemented: false,
    databaseUsed: false,
  };

  const stored: StoredExecutionConstraintRegistry = { registry };
  store.setRegistry(stored);
  return registry;
}

export function buildConstraint(
  input: RegisterConstraintInput,
  registry: ExecutionConstraintRegistry,
  stamp: string,
  factories?: ConstraintBuildFactories,
): ExecutionConstraint {
  const createConstraintId = factories?.createConstraintId ?? createExecutionConstraintId;
  const createDefinitionId = factories?.createDefinitionId ?? createConstraintDefinitionId;
  const createScopeId = factories?.createScopeId ?? createConstraintScopeId;
  const createCategoryId = factories?.createCategoryId ?? createConstraintCategoryId;

  const executionConstraintId = input.executionConstraintId ?? createConstraintId();
  const categoryKind: ExecutionConstraintCategoryKind = input.category ?? "structural";
  const scopeKind: ExecutionConstraintScopeKind = input.scope ?? "execution";

  const category: ExecutionConstraintCategory = {
    kind: "execution-constraint-category",
    id: createCategoryId(),
    category: categoryKind,
    label: input.categoryLabel ?? categoryKind,
    notes: "Structural constraint category — no business interpretation",
    constraintValidated: false,
    rulesApplied: false,
  };

  const scope: ExecutionConstraintScope = {
    kind: "execution-constraint-scope",
    id: createScopeId(),
    scope: scopeKind,
    label: input.scopeLabel ?? scopeKind,
    notes: "Structural constraint scope — declared but not evaluated",
    declared: true,
    evaluable: false,
    constraintValidated: false,
    rulesApplied: false,
    constraintsValidated: false,
  };

  const definition: ExecutionConstraintDefinition = {
    kind: "execution-constraint-definition",
    id: createDefinitionId(),
    key: input.key,
    version: input.definitionVersion ?? input.version ?? "1",
    description: input.definitionDescription,
    portRef: input.portRef,
    portContract: input.portContract,
    notes: "Structural constraint definition — not evaluable in this sprint",
    enginesInvoked: false,
    constraintValidated: false,
    rulesApplied: false,
    decisionEngineInvoked: false,
    rulesEnforced: false,
    constraintsValidated: false,
  };

  const metadata: ExecutionConstraintMetadata = {
    kind: "execution-constraint-metadata",
    tags: input.tags,
    version: input.version ?? "1",
    createdAt: stamp,
    updatedAt: stamp,
    structuralNotes: input.structuralNotes,
    customAttributes: input.customAttributes,
  };

  return {
    kind: "execution-constraint",
    id: executionConstraintId,
    executionConstraintId,
    executionConstraintRegistryId: registry.executionConstraintRegistryId,
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
    capability: STRUCTURAL_CONSTRAINT_REGISTRY_CAPABILITY,
    registeredAt: stamp,
    updatedAt: stamp,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    constraintValidated: false,
    rulesApplied: false,
    constraintsValidated: false,
    persistenceImplemented: false,
    databaseUsed: false,
  };
}

export function appendConstraintToRegistry(
  store: ExecutionConstraintRegistryStore,
  registry: ExecutionConstraintRegistry,
  constraint: ExecutionConstraint,
  stamp: string,
): ExecutionConstraintRegistry {
  const constraintIds = [...registry.constraintIds, constraint.executionConstraintId];
  const constraintKeys = [...registry.constraintKeys, constraint.key];

  const updated: ExecutionConstraintRegistry = {
    ...registry,
    constraintIds,
    constraintKeys,
    constraintCount: constraintIds.length,
    updatedAt: stamp,
    metadata: {
      ...registry.metadata,
      updatedAt: stamp,
    },
  };

  store.setRegistry({ registry: updated });
  return updated;
}

export function persistConstraint(
  store: ExecutionConstraintRegistryStore,
  constraint: ExecutionConstraint,
): void {
  const stored: StoredExecutionConstraint = {
    constraint,
    registryId: constraint.executionConstraintRegistryId,
  };
  store.setConstraint(stored);
}

export function matchesFilter(
  constraint: ExecutionConstraint,
  filter?: ExecutionConstraintFilter,
): boolean {
  if (!filter) return true;
  if (
    filter.executionConstraintRegistryId &&
    constraint.executionConstraintRegistryId !== filter.executionConstraintRegistryId
  ) {
    return false;
  }
  if (
    filter.executionConstraintId &&
    constraint.executionConstraintId !== filter.executionConstraintId
  ) {
    return false;
  }
  if (filter.executionId && constraint.executionId !== filter.executionId) return false;
  if (filter.correlationId && constraint.correlationId !== filter.correlationId) return false;
  if (filter.contextId && constraint.contextId !== filter.contextId) return false;
  if (filter.key && constraint.key !== filter.key) return false;
  if (filter.category && constraint.category.category !== filter.category) return false;
  if (filter.scope && constraint.scope.scope !== filter.scope) return false;
  if (filter.tags && filter.tags.length > 0) {
    const entryTags = constraint.metadata.tags ?? [];
    const hasAll = filter.tags.every((tag) => entryTags.includes(tag));
    if (!hasAll) return false;
  }
  return true;
}

export function buildStatistics(
  store: ExecutionConstraintRegistryStore,
  stamp: string,
): ExecutionConstraintStatistics {
  return {
    kind: "execution-constraint-statistics",
    totalRegistries: store.registryCount(),
    totalConstraints: store.constraintCount(),
    totalReferences: store.referenceCount(),
    totalCategories: store.categoryCount(),
    totalScopes: store.scopeCount(),
    computedAt: stamp,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    constraintValidationImplemented: false,
    ruleEngineInvoked: false,
  };
}

export function buildStructuralHealth(
  store: ExecutionConstraintRegistryStore,
  stamp: string,
  message?: string,
): ExecutionConstraintHealth {
  return {
    kind: "execution-constraint-health",
    ok: true,
    message: message ?? "Execution Constraint Registry structural health ok — in-memory only",
    registryCount: store.registryCount(),
    constraintCount: store.constraintCount(),
    indexReady: true,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    constraintValidationImplemented: false,
    ruleEngineInvoked: false,
    constraintsValidated: false,
    checkedAt: stamp,
  };
}

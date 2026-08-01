/**
 * Helpers internos do Execution Policy Registry (EPC-24 Sprint 10).
 *
 * Somente criação / registro / armazenamento estrutural in-memory.
 * Sem persistência real. Sem banco. Sem Engines. Sem interpretação de políticas.
 * Sem Rule Engine. Sem Decision Engine. Sem aplicação de regras.
 */
import {
  createExecutionPolicyId,
  createExecutionPolicyRegistryId,
  createPolicyCategoryId,
  createPolicyDefinitionId,
  createPolicyScopeId,
} from "../ports/identity";
import {
  STRUCTURAL_POLICY_REGISTRY_CAPABILITY,
  type ExecutionPolicy,
  type ExecutionPolicyCategory,
  type ExecutionPolicyCategoryKind,
  type ExecutionPolicyDefinition,
  type ExecutionPolicyFilter,
  type ExecutionPolicyHealth,
  type ExecutionPolicyMetadata,
  type ExecutionPolicyReference,
  type ExecutionPolicyRegistry,
  type ExecutionPolicyScope,
  type ExecutionPolicyScopeKind,
  type ExecutionPolicyStatistics,
} from "../ports/models";
import type { ExecutionPolicyRegistryPortCapabilities, RegisterPolicyInput } from "../ports/types";
import type {
  ExecutionPolicyRegistryStore,
  StoredExecutionPolicy,
  StoredExecutionPolicyRegistry,
} from "../store";

export function foundationCapabilitiesBase(
  adapterId: string,
): Omit<ExecutionPolicyRegistryPortCapabilities, "provider"> {
  return {
    adapterId,
    supportsRegisterPolicy: true,
    supportsGetPolicy: true,
    supportsListPolicies: true,
    supportsFindPolicies: true,
    supportsHealth: true,
    supportsCapabilities: true,
    supportsStatistics: true,
    structuralPolicyRegistryOnly: true,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    policyInterpretationImplemented: false,
    ruleEngineInvoked: false,
    decisionEngineInvoked: false,
    rulesEnforced: false,
    rulesApplied: false,
    policiesEvaluated: false,
    implementsOcr: false,
    implementsAi: false,
    implementsXmlParser: false,
    implementsPolicyEvaluation: false,
    implementsDecisionEngine: false,
    implementsRuleExecution: false,
    implementsPersistence: false,
    implementsUi: false,
    implementsHttpWorkersQueues: false,
    noDirectEngineCoupling: true,
    decoupledFromEngines: true,
  };
}

export type PolicyBuildFactories = {
  createPolicyId?: () => string;
  createDefinitionId?: () => string;
  createScopeId?: () => string;
  createCategoryId?: () => string;
  createRegistryId?: () => string;
};

function buildReferences(input: RegisterPolicyInput): ExecutionPolicyReference[] {
  const references: ExecutionPolicyReference[] = (input.references ?? []).map((ref) => ({
    kind: "execution-policy-reference" as const,
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
    ["pipelineId", input.pipelineId, "Structural pipeline reference"],
  ];

  for (const [name, value, notes] of derived) {
    if (value) {
      references.push({
        kind: "execution-policy-reference",
        name,
        value,
        notes,
      });
    }
  }

  return references;
}

export function ensurePolicyRegistry(
  store: ExecutionPolicyRegistryStore,
  input: RegisterPolicyInput,
  stamp: string,
  factories?: PolicyBuildFactories,
): ExecutionPolicyRegistry {
  const createRegistryId = factories?.createRegistryId ?? createExecutionPolicyRegistryId;

  if (input.executionPolicyRegistryId) {
    const existing = store.getRegistry(input.executionPolicyRegistryId);
    if (existing) return existing.registry;
  }

  if (input.executionId) {
    const byExec = store.getRegistryByExecution(input.executionId);
    if (byExec) return byExec.registry;
  }

  const executionPolicyRegistryId = input.executionPolicyRegistryId ?? createRegistryId();

  const references = buildReferences(input);

  const metadata: ExecutionPolicyMetadata = {
    kind: "execution-policy-metadata",
    tags: input.tags,
    version: input.version ?? "1",
    createdAt: stamp,
    updatedAt: stamp,
    structuralNotes:
      input.structuralNotes ??
      "Structural Policy Registry — in-memory only, no policy interpretation, no rule engine, no engines",
    customAttributes: input.customAttributes,
  };

  const registry: ExecutionPolicyRegistry = {
    kind: "execution-policy-registry",
    id: executionPolicyRegistryId,
    executionPolicyRegistryId,
    executionId: input.executionId,
    correlationId: input.correlationId,
    contextId: input.contextId,
    stateMachineId: input.stateMachineId,
    eventBusId: input.eventBusId,
    executionRegistryId: input.executionRegistryId,
    executionTraceId: input.executionTraceId,
    executionCapabilityRegistryId: input.executionCapabilityRegistryId,
    executionDependencyRegistryId: input.executionDependencyRegistryId,
    pipelineId: input.pipelineId,
    policyIds: [],
    policyKeys: [],
    policyCount: 0,
    references,
    metadata,
    capability: STRUCTURAL_POLICY_REGISTRY_CAPABILITY,
    createdAt: stamp,
    updatedAt: stamp,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    policyInterpretationImplemented: false,
    ruleEngineInvoked: false,
    policiesEvaluated: false,
    persistenceImplemented: false,
    databaseUsed: false,
  };

  const stored: StoredExecutionPolicyRegistry = { registry };
  store.setRegistry(stored);
  return registry;
}

export function buildPolicy(
  input: RegisterPolicyInput,
  registry: ExecutionPolicyRegistry,
  stamp: string,
  factories?: PolicyBuildFactories,
): ExecutionPolicy {
  const createPolicyId = factories?.createPolicyId ?? createExecutionPolicyId;
  const createDefinitionId = factories?.createDefinitionId ?? createPolicyDefinitionId;
  const createScopeId = factories?.createScopeId ?? createPolicyScopeId;
  const createCategoryId = factories?.createCategoryId ?? createPolicyCategoryId;

  const executionPolicyId = input.executionPolicyId ?? createPolicyId();
  const categoryKind: ExecutionPolicyCategoryKind = input.category ?? "structural";
  const scopeKind: ExecutionPolicyScopeKind = input.scope ?? "execution";

  const category: ExecutionPolicyCategory = {
    kind: "execution-policy-category",
    id: createCategoryId(),
    category: categoryKind,
    label: input.categoryLabel ?? categoryKind,
    notes: "Structural policy category — no business interpretation",
    policyInterpreted: false,
    rulesApplied: false,
  };

  const scope: ExecutionPolicyScope = {
    kind: "execution-policy-scope",
    id: createScopeId(),
    scope: scopeKind,
    label: input.scopeLabel ?? scopeKind,
    notes: "Structural policy scope — declared but not evaluated",
    declared: true,
    evaluable: false,
    policyInterpreted: false,
    rulesApplied: false,
    policiesEvaluated: false,
  };

  const definition: ExecutionPolicyDefinition = {
    kind: "execution-policy-definition",
    id: createDefinitionId(),
    key: input.key,
    version: input.definitionVersion ?? input.version ?? "1",
    description: input.definitionDescription,
    portRef: input.portRef,
    portContract: input.portContract,
    notes: "Structural policy definition — not evaluable in this sprint",
    enginesInvoked: false,
    policyInterpreted: false,
    rulesApplied: false,
    decisionEngineInvoked: false,
    rulesEnforced: false,
    policiesEvaluated: false,
  };

  const metadata: ExecutionPolicyMetadata = {
    kind: "execution-policy-metadata",
    tags: input.tags,
    version: input.version ?? "1",
    createdAt: stamp,
    updatedAt: stamp,
    structuralNotes: input.structuralNotes,
    customAttributes: input.customAttributes,
  };

  return {
    kind: "execution-policy",
    id: executionPolicyId,
    executionPolicyId,
    executionPolicyRegistryId: registry.executionPolicyRegistryId,
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
    capability: STRUCTURAL_POLICY_REGISTRY_CAPABILITY,
    registeredAt: stamp,
    updatedAt: stamp,
    enginesInvoked: false,
    stagesExecuted: false,
    processingPerformed: false,
    policyInterpreted: false,
    rulesApplied: false,
    policiesEvaluated: false,
    persistenceImplemented: false,
    databaseUsed: false,
  };
}

export function appendPolicyToRegistry(
  store: ExecutionPolicyRegistryStore,
  registry: ExecutionPolicyRegistry,
  policy: ExecutionPolicy,
  stamp: string,
): ExecutionPolicyRegistry {
  const policyIds = [...registry.policyIds, policy.executionPolicyId];
  const policyKeys = [...registry.policyKeys, policy.key];

  const updated: ExecutionPolicyRegistry = {
    ...registry,
    policyIds,
    policyKeys,
    policyCount: policyIds.length,
    updatedAt: stamp,
    metadata: {
      ...registry.metadata,
      updatedAt: stamp,
    },
  };

  store.setRegistry({ registry: updated });
  return updated;
}

export function persistPolicy(store: ExecutionPolicyRegistryStore, policy: ExecutionPolicy): void {
  const stored: StoredExecutionPolicy = {
    policy,
    registryId: policy.executionPolicyRegistryId,
  };
  store.setPolicy(stored);
}

export function matchesFilter(policy: ExecutionPolicy, filter?: ExecutionPolicyFilter): boolean {
  if (!filter) return true;
  if (
    filter.executionPolicyRegistryId &&
    policy.executionPolicyRegistryId !== filter.executionPolicyRegistryId
  ) {
    return false;
  }
  if (filter.executionPolicyId && policy.executionPolicyId !== filter.executionPolicyId) {
    return false;
  }
  if (filter.executionId && policy.executionId !== filter.executionId) return false;
  if (filter.correlationId && policy.correlationId !== filter.correlationId) return false;
  if (filter.contextId && policy.contextId !== filter.contextId) return false;
  if (filter.key && policy.key !== filter.key) return false;
  if (filter.category && policy.category.category !== filter.category) return false;
  if (filter.scope && policy.scope.scope !== filter.scope) return false;
  if (filter.tags && filter.tags.length > 0) {
    const entryTags = policy.metadata.tags ?? [];
    const hasAll = filter.tags.every((tag) => entryTags.includes(tag));
    if (!hasAll) return false;
  }
  return true;
}

export function buildStatistics(
  store: ExecutionPolicyRegistryStore,
  stamp: string,
): ExecutionPolicyStatistics {
  return {
    kind: "execution-policy-statistics",
    totalRegistries: store.registryCount(),
    totalPolicies: store.policyCount(),
    totalReferences: store.referenceCount(),
    totalCategories: store.categoryCount(),
    totalScopes: store.scopeCount(),
    computedAt: stamp,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    policyInterpretationImplemented: false,
    ruleEngineInvoked: false,
  };
}

export function buildStructuralHealth(
  store: ExecutionPolicyRegistryStore,
  stamp: string,
  message?: string,
): ExecutionPolicyHealth {
  return {
    kind: "execution-policy-health",
    ok: true,
    message: message ?? "Execution Policy Registry structural health ok — in-memory only",
    registryCount: store.registryCount(),
    policyCount: store.policyCount(),
    indexReady: true,
    persistenceImplemented: false,
    databaseUsed: false,
    enginesInvoked: false,
    policyInterpretationImplemented: false,
    ruleEngineInvoked: false,
    policiesEvaluated: false,
    checkedAt: stamp,
  };
}

/**
 * Tipos vendor-agnósticos do Execution Policy Registry — EPC-24 Sprint 10.
 *
 * Representa estruturalmente as políticas disponíveis para execução.
 * NÃO interpreta políticas. NÃO aplica regras. NÃO acessa Engines.
 * NÃO invoca Rule Engine. NÃO invoca Decision Engine.
 *
 * Arquitetura obrigatória (ECS-01):
 *   Application → ExecutionPolicyRegistryPort → Adapter → Store → Factory → Provider
 */
import type {
  ExecutionPolicy,
  ExecutionPolicyCategoryKind,
  ExecutionPolicyFilter,
  ExecutionPolicyHealth,
  ExecutionPolicyRegistry,
  ExecutionPolicyResult,
  ExecutionPolicyScopeKind,
  ExecutionPolicyStatistics,
} from "./models";

export type {
  ExecutionPolicy,
  ExecutionPolicyCapabilities,
  ExecutionPolicyCategory,
  ExecutionPolicyCategoryKind,
  ExecutionPolicyDefinition,
  ExecutionPolicyFilter,
  ExecutionPolicyHealth,
  ExecutionPolicyMetadata,
  ExecutionPolicyRecordKind,
  ExecutionPolicyReference,
  ExecutionPolicyRegistry,
  ExecutionPolicyResult,
  ExecutionPolicyScope,
  ExecutionPolicyScopeKind,
  ExecutionPolicyStatistics,
} from "./models";

/* ─────────────────────────────────────────────────────────────────────────
 * Mecanismo do Port (adapter id)
 * ───────────────────────────────────────────────────────────────────────── */

/** Provedores / mecanismos do Execution Policy Registry (extensível). */
export type ExecutionPolicyRegistryProviderId = "default" | "mock" | "test";

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — registerPolicy
 * ───────────────────────────────────────────────────────────────────────── */

/** Entrada estrutural de registro de política. */
export type RegisterPolicyInput = {
  executionPolicyId?: string;
  executionPolicyRegistryId?: string;
  executionId?: string;
  correlationId?: string;
  contextId?: string;
  stateMachineId?: string;
  eventBusId?: string;
  executionRegistryId?: string;
  executionTraceId?: string;
  executionCapabilityRegistryId?: string;
  executionDependencyRegistryId?: string;
  pipelineId?: string;
  key: string;
  name: string;
  category?: ExecutionPolicyCategoryKind;
  categoryLabel?: string;
  scope?: ExecutionPolicyScopeKind;
  scopeLabel?: string;
  definitionVersion?: string;
  definitionDescription?: string;
  portRef?: string;
  portContract?: string;
  tags?: readonly string[];
  version?: string;
  structuralNotes?: string;
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
  references?: readonly {
    name: string;
    value: string;
    notes?: string;
  }[];
};

/** Resultado estrutural de registerPolicy. */
export type RegisterPolicyResult = {
  ok: boolean;
  policy?: ExecutionPolicy;
  registry?: ExecutionPolicyRegistry;
  message?: string;
  code?: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  policyInterpretationImplemented: false;
  ruleEngineInvoked: false;
  policiesEvaluated: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — getPolicy
 * ───────────────────────────────────────────────────────────────────────── */

export type GetPolicyInput = {
  executionPolicyId?: string;
  executionPolicyRegistryId?: string;
  key?: string;
};

export type GetPolicyResult = {
  ok: boolean;
  policy?: ExecutionPolicy;
  registry?: ExecutionPolicyRegistry;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — listPolicies
 * ───────────────────────────────────────────────────────────────────────── */

export type ListPoliciesInput = {
  filter?: ExecutionPolicyFilter;
  limit?: number;
};

export type ListPoliciesResult = {
  ok: boolean;
  policies?: readonly ExecutionPolicy[];
  registry?: ExecutionPolicyRegistry;
  total?: number;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — findPolicies
 * ───────────────────────────────────────────────────────────────────────── */

export type FindPoliciesInput = {
  filter: ExecutionPolicyFilter;
};

export type FindPoliciesResult = ExecutionPolicyResult;

/* ─────────────────────────────────────────────────────────────────────────
 * Health / Capabilities / Statistics / Provider options
 * ───────────────────────────────────────────────────────────────────────── */

export type ExecutionPolicyRegistryPortHealth = {
  ok: boolean;
  provider: ExecutionPolicyRegistryProviderId;
  latencyMs?: number;
  message?: string;
  storedRegistryCount?: number;
  storedPolicyCount?: number;
  storedReferenceCount?: number;
  storedCategoryCount?: number;
  storedScopeCount?: number;
  structuralHealth?: ExecutionPolicyHealth;
};

/**
 * Capacidades do ExecutionPolicyRegistryPort.
 * Declara explicitamente o que a fundação NÃO faz.
 */
export type ExecutionPolicyRegistryPortCapabilities = {
  provider: ExecutionPolicyRegistryProviderId;
  adapterId: string;
  supportsRegisterPolicy: true;
  supportsGetPolicy: true;
  supportsListPolicies: true;
  supportsFindPolicies: true;
  supportsHealth: true;
  supportsCapabilities: true;
  supportsStatistics: true;
  /** Policy Registry estrutural exclusivamente — sem avaliação. */
  structuralPolicyRegistryOnly: true;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  policyInterpretationImplemented: false;
  ruleEngineInvoked: false;
  decisionEngineInvoked: false;
  rulesEnforced: false;
  rulesApplied: false;
  policiesEvaluated: false;
  implementsOcr: false;
  implementsAi: false;
  implementsXmlParser: false;
  implementsPolicyEvaluation: false;
  implementsDecisionEngine: false;
  implementsRuleExecution: false;
  implementsPersistence: false;
  implementsUi: false;
  implementsHttpWorkersQueues: false;
  noDirectEngineCoupling: true;
  /** Desacoplado de Engines (OCR / IA / Rule / Mapping). */
  decoupledFromEngines: true;
};

export type ExecutionPolicyStatisticsResult = {
  ok: boolean;
  statistics?: ExecutionPolicyStatistics;
  message?: string;
  code?: string;
};

/** Opções de resolução do ExecutionPolicyRegistryPort (provider factory). */
export type ExecutionPolicyRegistryProviderOptions = {
  /**
   * Mecanismo desejado. Default de produção da fundação: `default`
   * (DefaultExecutionPolicyRegistryAdapter).
   */
  provider?: ExecutionPolicyRegistryProviderId;
};

/**
 * Tipos vendor-agnósticos do Execution Requirement Registry — EPC-24 Sprint 12.
 *
 * Representa estruturalmente as requisitos disponíveis para execução.
 * NÃO valida requisitos. NÃO verifica pré-condições. NÃO acessa Engines.
 * NÃO invoca Rule Engine. NÃO invoca Decision Engine.
 *
 * Arquitetura obrigatória (ECS-01):
 *   Application → ExecutionRequirementRegistryPort → Adapter → Store → Factory → Provider
 */
import type {
  ExecutionRequirement,
  ExecutionRequirementCategoryKind,
  ExecutionRequirementFilter,
  ExecutionRequirementHealth,
  ExecutionRequirementRegistry,
  ExecutionRequirementResult,
  ExecutionRequirementScopeKind,
  ExecutionRequirementStatistics,
} from "./models";

export type {
  ExecutionRequirement,
  ExecutionRequirementCapabilities,
  ExecutionRequirementCategory,
  ExecutionRequirementCategoryKind,
  ExecutionRequirementDefinition,
  ExecutionRequirementFilter,
  ExecutionRequirementHealth,
  ExecutionRequirementMetadata,
  ExecutionRequirementRecordKind,
  ExecutionRequirementReference,
  ExecutionRequirementRegistry,
  ExecutionRequirementResult,
  ExecutionRequirementScope,
  ExecutionRequirementScopeKind,
  ExecutionRequirementStatistics,
} from "./models";

/* ─────────────────────────────────────────────────────────────────────────
 * Mecanismo do Port (adapter id)
 * ───────────────────────────────────────────────────────────────────────── */

/** Provedores / mecanismos do Execution Requirement Registry (extensível). */
export type ExecutionRequirementRegistryProviderId = "default" | "mock" | "test";

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — registerRequirement
 * ───────────────────────────────────────────────────────────────────────── */

/** Entrada estrutural de registro de requisito. */
export type RegisterRequirementInput = {
  executionRequirementId?: string;
  executionRequirementRegistryId?: string;
  executionId?: string;
  correlationId?: string;
  contextId?: string;
  stateMachineId?: string;
  eventBusId?: string;
  executionRegistryId?: string;
  executionTraceId?: string;
  executionCapabilityRegistryId?: string;
  executionDependencyRegistryId?: string;
  executionPolicyRegistryId?: string;
  executionConstraintRegistryId?: string;
  pipelineId?: string;
  key: string;
  name: string;
  category?: ExecutionRequirementCategoryKind;
  categoryLabel?: string;
  scope?: ExecutionRequirementScopeKind;
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

/** Resultado estrutural de registerRequirement. */
export type RegisterRequirementResult = {
  ok: boolean;
  requirement?: ExecutionRequirement;
  registry?: ExecutionRequirementRegistry;
  message?: string;
  code?: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  requirementValidationImplemented: false;
  ruleEngineInvoked: false;
  requirementsValidated: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — getRequirement
 * ───────────────────────────────────────────────────────────────────────── */

export type GetRequirementInput = {
  executionRequirementId?: string;
  executionRequirementRegistryId?: string;
  key?: string;
};

export type GetRequirementResult = {
  ok: boolean;
  requirement?: ExecutionRequirement;
  registry?: ExecutionRequirementRegistry;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — listRequirements
 * ───────────────────────────────────────────────────────────────────────── */

export type ListRequirementsInput = {
  filter?: ExecutionRequirementFilter;
  limit?: number;
};

export type ListRequirementsResult = {
  ok: boolean;
  requirements?: readonly ExecutionRequirement[];
  registry?: ExecutionRequirementRegistry;
  total?: number;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — findRequirements
 * ───────────────────────────────────────────────────────────────────────── */

export type FindRequirementsInput = {
  filter: ExecutionRequirementFilter;
};

export type FindRequirementsResult = ExecutionRequirementResult;

/* ─────────────────────────────────────────────────────────────────────────
 * Health / Capabilities / Statistics / Provider options
 * ───────────────────────────────────────────────────────────────────────── */

export type ExecutionRequirementRegistryPortHealth = {
  ok: boolean;
  provider: ExecutionRequirementRegistryProviderId;
  latencyMs?: number;
  message?: string;
  storedRegistryCount?: number;
  storedRequirementCount?: number;
  storedReferenceCount?: number;
  storedCategoryCount?: number;
  storedScopeCount?: number;
  structuralHealth?: ExecutionRequirementHealth;
};

/**
 * Capacidades do ExecutionRequirementRegistryPort.
 * Declara explicitamente o que a fundação NÃO faz.
 */
export type ExecutionRequirementRegistryPortCapabilities = {
  provider: ExecutionRequirementRegistryProviderId;
  adapterId: string;
  supportsRegisterRequirement: true;
  supportsGetRequirement: true;
  supportsListRequirements: true;
  supportsFindRequirements: true;
  supportsHealth: true;
  supportsCapabilities: true;
  supportsStatistics: true;
  /** Requirement Registry estrutural exclusivamente — sem validação. */
  structuralRequirementRegistryOnly: true;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  requirementValidationImplemented: false;
  ruleEngineInvoked: false;
  decisionEngineInvoked: false;
  rulesEnforced: false;
  rulesApplied: false;
  requirementsValidated: false;
  implementsOcr: false;
  implementsAi: false;
  implementsXmlParser: false;
  implementsRequirementValidation: false;
  implementsExecutionBlocking: false;
  implementsDecisionEngine: false;
  implementsRuleExecution: false;
  implementsPersistence: false;
  implementsUi: false;
  implementsHttpWorkersQueues: false;
  noDirectEngineCoupling: true;
  /** Desacoplado de Engines (OCR / IA / Rule / Mapping). */
  decoupledFromEngines: true;
  executionBlocked: false;
};

export type ExecutionRequirementStatisticsResult = {
  ok: boolean;
  statistics?: ExecutionRequirementStatistics;
  message?: string;
  code?: string;
};

/** Opções de resolução do ExecutionRequirementRegistryPort (provider factory). */
export type ExecutionRequirementRegistryProviderOptions = {
  /**
   * Mecanismo desejado. Default de produção da fundação: `default`
   * (DefaultExecutionRequirementRegistryAdapter).
   */
  provider?: ExecutionRequirementRegistryProviderId;
};

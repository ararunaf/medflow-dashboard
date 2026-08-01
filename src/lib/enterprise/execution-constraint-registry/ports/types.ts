/**
 * Tipos vendor-agnósticos do Execution Constraint Registry — EPC-24 Sprint 11.
 *
 * Representa estruturalmente as restrições disponíveis para execução.
 * NÃO interpreta restrições. NÃO aplica regras. NÃO acessa Engines.
 * NÃO invoca Rule Engine. NÃO invoca Decision Engine.
 *
 * Arquitetura obrigatória (ECS-01):
 *   Application → ExecutionConstraintRegistryPort → Adapter → Store → Factory → Provider
 */
import type {
  ExecutionConstraint,
  ExecutionConstraintCategoryKind,
  ExecutionConstraintFilter,
  ExecutionConstraintHealth,
  ExecutionConstraintRegistry,
  ExecutionConstraintResult,
  ExecutionConstraintScopeKind,
  ExecutionConstraintStatistics,
} from "./models";

export type {
  ExecutionConstraint,
  ExecutionConstraintCapabilities,
  ExecutionConstraintCategory,
  ExecutionConstraintCategoryKind,
  ExecutionConstraintDefinition,
  ExecutionConstraintFilter,
  ExecutionConstraintHealth,
  ExecutionConstraintMetadata,
  ExecutionConstraintRecordKind,
  ExecutionConstraintReference,
  ExecutionConstraintRegistry,
  ExecutionConstraintResult,
  ExecutionConstraintScope,
  ExecutionConstraintScopeKind,
  ExecutionConstraintStatistics,
} from "./models";

/* ─────────────────────────────────────────────────────────────────────────
 * Mecanismo do Port (adapter id)
 * ───────────────────────────────────────────────────────────────────────── */

/** Provedores / mecanismos do Execution Constraint Registry (extensível). */
export type ExecutionConstraintRegistryProviderId = "default" | "mock" | "test";

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — registerConstraint
 * ───────────────────────────────────────────────────────────────────────── */

/** Entrada estrutural de registro de restrição. */
export type RegisterConstraintInput = {
  executionConstraintId?: string;
  executionConstraintRegistryId?: string;
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
  pipelineId?: string;
  key: string;
  name: string;
  category?: ExecutionConstraintCategoryKind;
  categoryLabel?: string;
  scope?: ExecutionConstraintScopeKind;
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

/** Resultado estrutural de registerConstraint. */
export type RegisterConstraintResult = {
  ok: boolean;
  constraint?: ExecutionConstraint;
  registry?: ExecutionConstraintRegistry;
  message?: string;
  code?: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  constraintValidationImplemented: false;
  ruleEngineInvoked: false;
  constraintsValidated: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — getConstraint
 * ───────────────────────────────────────────────────────────────────────── */

export type GetConstraintInput = {
  executionConstraintId?: string;
  executionConstraintRegistryId?: string;
  key?: string;
};

export type GetConstraintResult = {
  ok: boolean;
  constraint?: ExecutionConstraint;
  registry?: ExecutionConstraintRegistry;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — listConstraints
 * ───────────────────────────────────────────────────────────────────────── */

export type ListConstraintsInput = {
  filter?: ExecutionConstraintFilter;
  limit?: number;
};

export type ListConstraintsResult = {
  ok: boolean;
  constraints?: readonly ExecutionConstraint[];
  registry?: ExecutionConstraintRegistry;
  total?: number;
  message?: string;
  code?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Port I/O — findConstraints
 * ───────────────────────────────────────────────────────────────────────── */

export type FindConstraintsInput = {
  filter: ExecutionConstraintFilter;
};

export type FindConstraintsResult = ExecutionConstraintResult;

/* ─────────────────────────────────────────────────────────────────────────
 * Health / Capabilities / Statistics / Provider options
 * ───────────────────────────────────────────────────────────────────────── */

export type ExecutionConstraintRegistryPortHealth = {
  ok: boolean;
  provider: ExecutionConstraintRegistryProviderId;
  latencyMs?: number;
  message?: string;
  storedRegistryCount?: number;
  storedConstraintCount?: number;
  storedReferenceCount?: number;
  storedCategoryCount?: number;
  storedScopeCount?: number;
  structuralHealth?: ExecutionConstraintHealth;
};

/**
 * Capacidades do ExecutionConstraintRegistryPort.
 * Declara explicitamente o que a fundação NÃO faz.
 */
export type ExecutionConstraintRegistryPortCapabilities = {
  provider: ExecutionConstraintRegistryProviderId;
  adapterId: string;
  supportsRegisterConstraint: true;
  supportsGetConstraint: true;
  supportsListConstraints: true;
  supportsFindConstraints: true;
  supportsHealth: true;
  supportsCapabilities: true;
  supportsStatistics: true;
  /** Constraint Registry estrutural exclusivamente — sem avaliação. */
  structuralConstraintRegistryOnly: true;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  constraintValidationImplemented: false;
  ruleEngineInvoked: false;
  decisionEngineInvoked: false;
  rulesEnforced: false;
  rulesApplied: false;
  constraintsValidated: false;
  implementsOcr: false;
  implementsAi: false;
  implementsXmlParser: false;
  implementsConstraintValidation: false;
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

export type ExecutionConstraintStatisticsResult = {
  ok: boolean;
  statistics?: ExecutionConstraintStatistics;
  message?: string;
  code?: string;
};

/** Opções de resolução do ExecutionConstraintRegistryPort (provider factory). */
export type ExecutionConstraintRegistryProviderOptions = {
  /**
   * Mecanismo desejado. Default de produção da fundação: `default`
   * (DefaultExecutionConstraintRegistryAdapter).
   */
  provider?: ExecutionConstraintRegistryProviderId;
};

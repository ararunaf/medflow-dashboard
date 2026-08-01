/**
 * Modelos canônicos do Execution Constraint Registry — EPC-24 Sprint 11.
 *
 * Representação estrutural das restrições disponíveis para execução.
 * Sem regras de negócio. Sem OCR. Sem IA. Sem Mapping. Sem parsers.
 * Sem banco. Sem persistência real. Sem interpretação de restrições.
 * Sem Rule Engine. Sem Decision Engine. Sem aplicação de regras.
 * Sem Engines. Sem acesso externo. Sem avaliação de restrições.
 */

/* ─────────────────────────────────────────────────────────────────────────
 * Types / kinds
 * ───────────────────────────────────────────────────────────────────────── */

/** Kinds de registros canônicos do Execution Constraint Registry. */
export type ExecutionConstraintRecordKind =
  | "execution-constraint"
  | "execution-constraint-definition"
  | "execution-constraint-metadata"
  | "execution-constraint-category"
  | "execution-constraint-reference"
  | "execution-constraint-scope"
  | "execution-constraint-registry"
  | "execution-constraint-statistics"
  | "execution-constraint-capabilities"
  | "execution-constraint-health"
  | "execution-constraint-result"
  | "execution-constraint-filter";

/**
 * Categoria estrutural de restrição.
 * Classificação opaca — sem interpretação de negócio.
 */
export type ExecutionConstraintCategoryKind =
  | "structural"
  | "governance"
  | "compliance"
  | "execution"
  | "pipeline"
  | "lifecycle"
  | "foundation"
  | "catalog"
  | "unknown";

/**
 * Escopo estrutural de restrição.
 * Classificação opaca — sem avaliação.
 */
export type ExecutionConstraintScopeKind =
  | "execution"
  | "pipeline"
  | "stage"
  | "context"
  | "global"
  | "platform"
  | "unknown";

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionConstraintCategory
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Categoria canônica estrutural de uma restrição.
 * Sem regra de negócio. Sem interpretação de restrições.
 */
export type ExecutionConstraintCategory = {
  kind: "execution-constraint-category";
  id: string;
  category: ExecutionConstraintCategoryKind;
  label?: string;
  notes?: string;
  constraintValidated: false;
  rulesApplied: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionConstraintScope
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Escopo canônico estrutural de uma restrição.
 * Explicitamente não avaliável nesta sprint.
 */
export type ExecutionConstraintScope = {
  kind: "execution-constraint-scope";
  id: string;
  scope: ExecutionConstraintScopeKind;
  label?: string;
  notes?: string;
  declared: true;
  /** Restrições NÃO são avaliadas nesta sprint. */
  evaluable: false;
  constraintValidated: false;
  rulesApplied: false;
  constraintsValidated: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionConstraintMetadata
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Metadados estruturais de uma restrição / registry.
 * Sem interpretação de negócio.
 */
export type ExecutionConstraintMetadata = {
  kind: "execution-constraint-metadata";
  tags?: readonly string[];
  version?: string;
  createdAt?: string;
  updatedAt?: string;
  structuralNotes?: string;
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionConstraintReference
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Referência estrutural opaca anexada a uma restrição / registry.
 * Sem conteúdo de negócio.
 */
export type ExecutionConstraintReference = {
  kind: "execution-constraint-reference";
  name: string;
  value: string;
  notes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionConstraintDefinition
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Definição estrutural de uma restrição.
 * Descreve o contrato opaco — sem avaliação.
 */
export type ExecutionConstraintDefinition = {
  kind: "execution-constraint-definition";
  id: string;
  key: string;
  version?: string;
  description?: string;
  portRef?: string;
  portContract?: string;
  notes?: string;
  enginesInvoked: false;
  constraintValidated: false;
  rulesApplied: false;
  decisionEngineInvoked: false;
  rulesEnforced: false;
  constraintsValidated: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionConstraintCapabilities (modelo canônico embutido)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Capacidades estruturais declaradas pelo Constraint Registry.
 * Explicitamente sem interpretação / Rule Engine / Decision Engine / Engines.
 */
export type ExecutionConstraintCapabilities = {
  kind: "execution-constraint-capabilities";
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
  decoupledFromEngines: true;
  executionBlocked: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionConstraintFilter
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Filtro estrutural para listagem / busca de restrições.
 * Sem regras de negócio.
 */
export type ExecutionConstraintFilter = {
  kind: "execution-constraint-filter";
  executionConstraintRegistryId?: string;
  executionConstraintId?: string;
  executionId?: string;
  correlationId?: string;
  contextId?: string;
  key?: string;
  category?: ExecutionConstraintCategoryKind;
  scope?: ExecutionConstraintScopeKind;
  tags?: readonly string[];
  limit?: number;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionConstraint
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Restrição canônica registrada estruturalmente.
 * Representa uma restrição disponível — sem avaliação.
 */
export type ExecutionConstraint = {
  kind: "execution-constraint";
  id: string;
  /** Alias (= id da restrição). */
  executionConstraintId: string;
  executionConstraintRegistryId: string;
  executionId?: string;
  correlationId?: string;
  contextId?: string;
  key: string;
  name: string;
  category: ExecutionConstraintCategory;
  scope: ExecutionConstraintScope;
  definition: ExecutionConstraintDefinition;
  references: readonly ExecutionConstraintReference[];
  metadata: ExecutionConstraintMetadata;
  capability: ExecutionConstraintCapabilities;
  registeredAt: string;
  updatedAt: string;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  constraintValidated: false;
  rulesApplied: false;
  constraintsValidated: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionConstraintRegistry
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Agregado raiz do Registro Canônico de Restrições.
 * Catálogo estrutural in-memory — sem interpretação de restrições.
 */
export type ExecutionConstraintRegistry = {
  kind: "execution-constraint-registry";
  id: string;
  /** Alias (= id do registry). */
  executionConstraintRegistryId: string;
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
  constraintIds: readonly string[];
  constraintKeys: readonly string[];
  constraintCount: number;
  references: readonly ExecutionConstraintReference[];
  metadata: ExecutionConstraintMetadata;
  capability: ExecutionConstraintCapabilities;
  createdAt: string;
  updatedAt: string;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  constraintValidationImplemented: false;
  ruleEngineInvoked: false;
  constraintsValidated: false;
  executionBlocked: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionConstraintStatistics
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Estatísticas estruturais do catálogo in-memory.
 * Sem métricas de negócio / sem analytics.
 */
export type ExecutionConstraintStatistics = {
  kind: "execution-constraint-statistics";
  totalRegistries: number;
  totalConstraints: number;
  totalReferences: number;
  totalCategories: number;
  totalScopes: number;
  computedAt: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  constraintValidationImplemented: false;
  ruleEngineInvoked: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionConstraintHealth (modelo canônico)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Saúde estrutural do Constraint Registry (modelo canônico).
 * Distinto do health do Port (types) — aqui é representação estrutural.
 */
export type ExecutionConstraintHealth = {
  kind: "execution-constraint-health";
  ok: boolean;
  message?: string;
  registryCount: number;
  constraintCount: number;
  indexReady: true;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  constraintValidationImplemented: false;
  ruleEngineInvoked: false;
  constraintsValidated: false;
  checkedAt: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionConstraintResult
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Resultado estrutural de uma operação do Constraint Registry.
 * Sem efeitos colaterais de avaliação / regras / negócio.
 */
export type ExecutionConstraintResult = {
  kind: "execution-constraint-result";
  ok: boolean;
  executionConstraintRegistryId?: string;
  executionConstraintId?: string;
  executionId?: string;
  constraint?: ExecutionConstraint;
  registry?: ExecutionConstraintRegistry;
  constraints?: readonly ExecutionConstraint[];
  statistics?: ExecutionConstraintStatistics;
  health?: ExecutionConstraintHealth;
  code?: string;
  message?: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  constraintValidationImplemented: false;
  ruleEngineInvoked: false;
  constraintsValidated: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Catálogo estrutural
 * ───────────────────────────────────────────────────────────────────────── */

/** Capacidades canônicas embutidas em toda entrada do Constraint Registry. */
export const STRUCTURAL_CONSTRAINT_REGISTRY_CAPABILITY: ExecutionConstraintCapabilities = {
  kind: "execution-constraint-capabilities",
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

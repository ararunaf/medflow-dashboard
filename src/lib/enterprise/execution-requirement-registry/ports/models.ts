/**
 * Modelos canônicos do Execution Requirement Registry — EPC-24 Sprint 12.
 *
 * Representação estrutural dos requisitos disponíveis para execução.
 * Sem regras de negócio. Sem OCR. Sem IA. Sem Mapping. Sem parsers.
 * Sem banco. Sem persistência real. Sem validação de requisitos.
 * Sem Rule Engine. Sem Decision Engine. Sem verificação de pré-condições.
 * Sem Engines. Sem acesso externo. Sem validação de requisitos.
 */

/* ─────────────────────────────────────────────────────────────────────────
 * Types / kinds
 * ───────────────────────────────────────────────────────────────────────── */

/** Kinds de registros canônicos do Execution Requirement Registry. */
export type ExecutionRequirementRecordKind =
  | "execution-requirement"
  | "execution-requirement-definition"
  | "execution-requirement-metadata"
  | "execution-requirement-category"
  | "execution-requirement-reference"
  | "execution-requirement-scope"
  | "execution-requirement-registry"
  | "execution-requirement-statistics"
  | "execution-requirement-capabilities"
  | "execution-requirement-health"
  | "execution-requirement-result"
  | "execution-requirement-filter";

/**
 * Categoria estrutural de requisito.
 * Classificação opaca — sem validação de negócio.
 */
export type ExecutionRequirementCategoryKind =
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
 * Escopo estrutural de requisito.
 * Classificação opaca — sem validação.
 */
export type ExecutionRequirementScopeKind =
  | "execution"
  | "pipeline"
  | "stage"
  | "context"
  | "global"
  | "platform"
  | "unknown";

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionRequirementCategory
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Categoria canônica estrutural de uma requisito.
 * Sem regra de negócio. Sem validação de requisitos.
 */
export type ExecutionRequirementCategory = {
  kind: "execution-requirement-category";
  id: string;
  category: ExecutionRequirementCategoryKind;
  label?: string;
  notes?: string;
  requirementValidated: false;
  rulesApplied: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionRequirementScope
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Escopo canônico estrutural de uma requisito.
 * Explicitamente não validável nesta sprint.
 */
export type ExecutionRequirementScope = {
  kind: "execution-requirement-scope";
  id: string;
  scope: ExecutionRequirementScopeKind;
  label?: string;
  notes?: string;
  declared: true;
  /** Requisitos NÃO são validadas nesta sprint. */
  evaluable: false;
  requirementValidated: false;
  rulesApplied: false;
  requirementsValidated: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionRequirementMetadata
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Metadados estruturais de uma requisito / registry.
 * Sem validação de negócio.
 */
export type ExecutionRequirementMetadata = {
  kind: "execution-requirement-metadata";
  tags?: readonly string[];
  version?: string;
  createdAt?: string;
  updatedAt?: string;
  structuralNotes?: string;
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionRequirementReference
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Referência estrutural opaca anexada a uma requisito / registry.
 * Sem conteúdo de negócio.
 */
export type ExecutionRequirementReference = {
  kind: "execution-requirement-reference";
  name: string;
  value: string;
  notes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionRequirementDefinition
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Definição estrutural de uma requisito.
 * Descreve o contrato opaco — sem validação.
 */
export type ExecutionRequirementDefinition = {
  kind: "execution-requirement-definition";
  id: string;
  key: string;
  version?: string;
  description?: string;
  portRef?: string;
  portContract?: string;
  notes?: string;
  enginesInvoked: false;
  requirementValidated: false;
  rulesApplied: false;
  decisionEngineInvoked: false;
  rulesEnforced: false;
  requirementsValidated: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionRequirementCapabilities (modelo canônico embutido)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Capacidades estruturais declaradas pelo Requirement Registry.
 * Explicitamente sem interpretação / Rule Engine / Decision Engine / Engines.
 */
export type ExecutionRequirementCapabilities = {
  kind: "execution-requirement-capabilities";
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
  decoupledFromEngines: true;
  executionBlocked: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionRequirementFilter
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Filtro estrutural para listagem / busca de requisitos.
 * Sem regras de negócio.
 */
export type ExecutionRequirementFilter = {
  kind: "execution-requirement-filter";
  executionRequirementRegistryId?: string;
  executionRequirementId?: string;
  executionId?: string;
  correlationId?: string;
  contextId?: string;
  key?: string;
  category?: ExecutionRequirementCategoryKind;
  scope?: ExecutionRequirementScopeKind;
  tags?: readonly string[];
  limit?: number;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionRequirement
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Requisito canônica registrada estruturalmente.
 * Representa uma requisito disponível — sem validação.
 */
export type ExecutionRequirement = {
  kind: "execution-requirement";
  id: string;
  /** Alias (= id da requisito). */
  executionRequirementId: string;
  executionRequirementRegistryId: string;
  executionId?: string;
  correlationId?: string;
  contextId?: string;
  key: string;
  name: string;
  category: ExecutionRequirementCategory;
  scope: ExecutionRequirementScope;
  definition: ExecutionRequirementDefinition;
  references: readonly ExecutionRequirementReference[];
  metadata: ExecutionRequirementMetadata;
  capability: ExecutionRequirementCapabilities;
  registeredAt: string;
  updatedAt: string;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  requirementValidated: false;
  rulesApplied: false;
  requirementsValidated: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionRequirementRegistry
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Agregado raiz do Registro Canônico de Requisitos.
 * Catálogo estrutural in-memory — sem validação de requisitos.
 */
export type ExecutionRequirementRegistry = {
  kind: "execution-requirement-registry";
  id: string;
  /** Alias (= id do registry). */
  executionRequirementRegistryId: string;
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
  requirementIds: readonly string[];
  requirementKeys: readonly string[];
  requirementCount: number;
  references: readonly ExecutionRequirementReference[];
  metadata: ExecutionRequirementMetadata;
  capability: ExecutionRequirementCapabilities;
  createdAt: string;
  updatedAt: string;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  requirementValidationImplemented: false;
  ruleEngineInvoked: false;
  requirementsValidated: false;
  executionBlocked: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionRequirementStatistics
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Estatísticas estruturais do catálogo in-memory.
 * Sem métricas de negócio / sem analytics.
 */
export type ExecutionRequirementStatistics = {
  kind: "execution-requirement-statistics";
  totalRegistries: number;
  totalRequirements: number;
  totalReferences: number;
  totalCategories: number;
  totalScopes: number;
  computedAt: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  requirementValidationImplemented: false;
  ruleEngineInvoked: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionRequirementHealth (modelo canônico)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Saúde estrutural do Requirement Registry (modelo canônico).
 * Distinto do health do Port (types) — aqui é representação estrutural.
 */
export type ExecutionRequirementHealth = {
  kind: "execution-requirement-health";
  ok: boolean;
  message?: string;
  registryCount: number;
  requirementCount: number;
  indexReady: true;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  requirementValidationImplemented: false;
  ruleEngineInvoked: false;
  requirementsValidated: false;
  checkedAt: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionRequirementResult
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Resultado estrutural de uma operação do Requirement Registry.
 * Sem efeitos colaterais de validação / regras / negócio.
 */
export type ExecutionRequirementResult = {
  kind: "execution-requirement-result";
  ok: boolean;
  executionRequirementRegistryId?: string;
  executionRequirementId?: string;
  executionId?: string;
  requirement?: ExecutionRequirement;
  registry?: ExecutionRequirementRegistry;
  requirements?: readonly ExecutionRequirement[];
  statistics?: ExecutionRequirementStatistics;
  health?: ExecutionRequirementHealth;
  code?: string;
  message?: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  requirementValidationImplemented: false;
  ruleEngineInvoked: false;
  requirementsValidated: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Catálogo estrutural
 * ───────────────────────────────────────────────────────────────────────── */

/** Capacidades canônicas embutidas em toda entrada do Requirement Registry. */
export const STRUCTURAL_REQUIREMENT_REGISTRY_CAPABILITY: ExecutionRequirementCapabilities = {
  kind: "execution-requirement-capabilities",
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

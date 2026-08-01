/**
 * Modelos canônicos do Execution Policy Registry — EPC-24 Sprint 10.
 *
 * Representação estrutural das políticas disponíveis para execução.
 * Sem regras de negócio. Sem OCR. Sem IA. Sem Mapping. Sem parsers.
 * Sem banco. Sem persistência real. Sem interpretação de políticas.
 * Sem Rule Engine. Sem Decision Engine. Sem aplicação de regras.
 * Sem Engines. Sem acesso externo. Sem avaliação de políticas.
 */

/* ─────────────────────────────────────────────────────────────────────────
 * Types / kinds
 * ───────────────────────────────────────────────────────────────────────── */

/** Kinds de registros canônicos do Execution Policy Registry. */
export type ExecutionPolicyRecordKind =
  | "execution-policy"
  | "execution-policy-definition"
  | "execution-policy-metadata"
  | "execution-policy-category"
  | "execution-policy-reference"
  | "execution-policy-scope"
  | "execution-policy-registry"
  | "execution-policy-statistics"
  | "execution-policy-capabilities"
  | "execution-policy-health"
  | "execution-policy-result"
  | "execution-policy-filter";

/**
 * Categoria estrutural de política.
 * Classificação opaca — sem interpretação de negócio.
 */
export type ExecutionPolicyCategoryKind =
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
 * Escopo estrutural de política.
 * Classificação opaca — sem avaliação.
 */
export type ExecutionPolicyScopeKind =
  | "execution"
  | "pipeline"
  | "stage"
  | "context"
  | "global"
  | "platform"
  | "unknown";

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionPolicyCategory
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Categoria canônica estrutural de uma política.
 * Sem regra de negócio. Sem interpretação de políticas.
 */
export type ExecutionPolicyCategory = {
  kind: "execution-policy-category";
  id: string;
  category: ExecutionPolicyCategoryKind;
  label?: string;
  notes?: string;
  policyInterpreted: false;
  rulesApplied: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionPolicyScope
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Escopo canônico estrutural de uma política.
 * Explicitamente não avaliável nesta sprint.
 */
export type ExecutionPolicyScope = {
  kind: "execution-policy-scope";
  id: string;
  scope: ExecutionPolicyScopeKind;
  label?: string;
  notes?: string;
  declared: true;
  /** Políticas NÃO são avaliadas nesta sprint. */
  evaluable: false;
  policyInterpreted: false;
  rulesApplied: false;
  policiesEvaluated: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionPolicyMetadata
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Metadados estruturais de uma política / registry.
 * Sem interpretação de negócio.
 */
export type ExecutionPolicyMetadata = {
  kind: "execution-policy-metadata";
  tags?: readonly string[];
  version?: string;
  createdAt?: string;
  updatedAt?: string;
  structuralNotes?: string;
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionPolicyReference
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Referência estrutural opaca anexada a uma política / registry.
 * Sem conteúdo de negócio.
 */
export type ExecutionPolicyReference = {
  kind: "execution-policy-reference";
  name: string;
  value: string;
  notes?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionPolicyDefinition
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Definição estrutural de uma política.
 * Descreve o contrato opaco — sem avaliação.
 */
export type ExecutionPolicyDefinition = {
  kind: "execution-policy-definition";
  id: string;
  key: string;
  version?: string;
  description?: string;
  portRef?: string;
  portContract?: string;
  notes?: string;
  enginesInvoked: false;
  policyInterpreted: false;
  rulesApplied: false;
  decisionEngineInvoked: false;
  rulesEnforced: false;
  policiesEvaluated: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionPolicyCapabilities (modelo canônico embutido)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Capacidades estruturais declaradas pelo Policy Registry.
 * Explicitamente sem interpretação / Rule Engine / Decision Engine / Engines.
 */
export type ExecutionPolicyCapabilities = {
  kind: "execution-policy-capabilities";
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
  decoupledFromEngines: true;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionPolicyFilter
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Filtro estrutural para listagem / busca de políticas.
 * Sem regras de negócio.
 */
export type ExecutionPolicyFilter = {
  kind: "execution-policy-filter";
  executionPolicyRegistryId?: string;
  executionPolicyId?: string;
  executionId?: string;
  correlationId?: string;
  contextId?: string;
  key?: string;
  category?: ExecutionPolicyCategoryKind;
  scope?: ExecutionPolicyScopeKind;
  tags?: readonly string[];
  limit?: number;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionPolicy
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Política canônica registrada estruturalmente.
 * Representa uma política disponível — sem avaliação.
 */
export type ExecutionPolicy = {
  kind: "execution-policy";
  id: string;
  /** Alias (= id da política). */
  executionPolicyId: string;
  executionPolicyRegistryId: string;
  executionId?: string;
  correlationId?: string;
  contextId?: string;
  key: string;
  name: string;
  category: ExecutionPolicyCategory;
  scope: ExecutionPolicyScope;
  definition: ExecutionPolicyDefinition;
  references: readonly ExecutionPolicyReference[];
  metadata: ExecutionPolicyMetadata;
  capability: ExecutionPolicyCapabilities;
  registeredAt: string;
  updatedAt: string;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  policyInterpreted: false;
  rulesApplied: false;
  policiesEvaluated: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionPolicyRegistry
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Agregado raiz do Registro Canônico de Políticas.
 * Catálogo estrutural in-memory — sem interpretação de políticas.
 */
export type ExecutionPolicyRegistry = {
  kind: "execution-policy-registry";
  id: string;
  /** Alias (= id do registry). */
  executionPolicyRegistryId: string;
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
  policyIds: readonly string[];
  policyKeys: readonly string[];
  policyCount: number;
  references: readonly ExecutionPolicyReference[];
  metadata: ExecutionPolicyMetadata;
  capability: ExecutionPolicyCapabilities;
  createdAt: string;
  updatedAt: string;
  enginesInvoked: false;
  stagesExecuted: false;
  processingPerformed: false;
  policyInterpretationImplemented: false;
  ruleEngineInvoked: false;
  policiesEvaluated: false;
  persistenceImplemented: false;
  databaseUsed: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionPolicyStatistics
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Estatísticas estruturais do catálogo in-memory.
 * Sem métricas de negócio / sem analytics.
 */
export type ExecutionPolicyStatistics = {
  kind: "execution-policy-statistics";
  totalRegistries: number;
  totalPolicies: number;
  totalReferences: number;
  totalCategories: number;
  totalScopes: number;
  computedAt: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  policyInterpretationImplemented: false;
  ruleEngineInvoked: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionPolicyHealth (modelo canônico)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Saúde estrutural do Policy Registry (modelo canônico).
 * Distinto do health do Port (types) — aqui é representação estrutural.
 */
export type ExecutionPolicyHealth = {
  kind: "execution-policy-health";
  ok: boolean;
  message?: string;
  registryCount: number;
  policyCount: number;
  indexReady: true;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  policyInterpretationImplemented: false;
  ruleEngineInvoked: false;
  policiesEvaluated: false;
  checkedAt: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * ExecutionPolicyResult
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Resultado estrutural de uma operação do Policy Registry.
 * Sem efeitos colaterais de avaliação / regras / negócio.
 */
export type ExecutionPolicyResult = {
  kind: "execution-policy-result";
  ok: boolean;
  executionPolicyRegistryId?: string;
  executionPolicyId?: string;
  executionId?: string;
  policy?: ExecutionPolicy;
  registry?: ExecutionPolicyRegistry;
  policies?: readonly ExecutionPolicy[];
  statistics?: ExecutionPolicyStatistics;
  health?: ExecutionPolicyHealth;
  code?: string;
  message?: string;
  persistenceImplemented: false;
  databaseUsed: false;
  enginesInvoked: false;
  policyInterpretationImplemented: false;
  ruleEngineInvoked: false;
  policiesEvaluated: false;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Catálogo estrutural
 * ───────────────────────────────────────────────────────────────────────── */

/** Capacidades canônicas embutidas em toda entrada do Policy Registry. */
export const STRUCTURAL_POLICY_REGISTRY_CAPABILITY: ExecutionPolicyCapabilities = {
  kind: "execution-policy-capabilities",
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

/**
 * Tipos vendor-agnósticos da camada de regras — EPC-06A.
 *
 * Nenhum tipo clínico, financeiro, TISS, OCR, IA, Authorization, Auditoria,
 * Contract Intelligence ou Persistence de produto deve aparecer aqui.
 * O Rule Engine é genérico e reutilizável em qualquer plataforma IAeasy.
 *
 * Conceitos nativos únicos:
 * Rule | Condition | Operator | Action | Evaluation | Context | Priority |
 * Result | Outcome | Severity | Category | Status | Version |
 * MetadataReference | WorkflowReference
 *
 * EPC-06A: infraestrutura apenas.
 * NÃO avalia expressões, NÃO executa ações, NÃO faz parse/DSL.
 * Linguagem de regras = EPC-06B.
 */

/** Provedores / mecanismos de rule (extensível). */
export type RuleProviderId = "default" | "mock" | "test" | "database" | "remote" | "persistence";

/** Resultado de health check do mecanismo de regras. */
export type RuleHealth = {
  ok: boolean;
  provider: RuleProviderId;
  latencyMs?: number;
  message?: string;
};

/**
 * Capacidades declaradas pelo adapter.
 * Usado por Application/Domain para decisões sem conhecer o store.
 */
export type RuleCapabilities = {
  provider: RuleProviderId;
  /** Identificador legível do adapter (ex.: default-in-process). */
  adapterId: string;
  supportsRegisterRule: boolean;
  supportsGetRule: boolean;
  supportsListRules: boolean;
  supportsEnableRule: boolean;
  supportsDisableRule: boolean;
  /** Catálogo de operadores (sem evaluator nesta sprint). */
  supportsOperatorCatalog: boolean;
  /** Catálogo de ações (sem executor nesta sprint). */
  supportsActionCatalog: boolean;
  /** Catálogo de prioridades (sem scheduling nesta sprint). */
  supportsPriorityCatalog: boolean;
  /**
   * Avaliação / linguagem de regras.
   * EPC-06A: sempre false — motor de avaliação fica na EPC-06B.
   */
  supportsEvaluation: boolean;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Conceitos nativos
 * ───────────────────────────────────────────────────────────────────────── */

/** Identificador estável de uma Rule. */
export type RuleId = string;

/** Nome lógico. */
export type RuleName = string;

/** Namespace lógico — isolamento estrutural. */
export type RuleNamespace = string;

/** Tag genérica. */
export type RuleTag = string;

/** Versão nativa (estrutural, sem semântica de negócio). */
export type RuleVersion = string;

/**
 * Status nativo do Rule Engine.
 * Sem semântica de negócio clínico/financeiro.
 */
export type RuleStatus = "draft" | "enabled" | "disabled" | "archived";

/** Status conhecidos (infraestrutura). */
export const RULE_STATUSES: readonly RuleStatus[] = [
  "draft",
  "enabled",
  "disabled",
  "archived",
] as const;

/**
 * Priority nativa — catálogo estrutural (FASE 9).
 * Sem scheduling / fila nesta sprint.
 */
export type RulePriority = "critical" | "high" | "medium" | "low" | "informational";

export const RULE_PRIORITIES: readonly RulePriority[] = [
  "critical",
  "high",
  "medium",
  "low",
  "informational",
] as const;

/**
 * Severity nativa — descriptor estrutural.
 * Sem política de alerta de produto.
 */
export type RuleSeverity = "critical" | "high" | "medium" | "low" | "info";

export const RULE_SEVERITIES: readonly RuleSeverity[] = [
  "critical",
  "high",
  "medium",
  "low",
  "info",
] as const;

/**
 * Category nativa — rótulo estrutural livre.
 * NÃO é domínio clínico/financeiro; apenas agrupamento genérico.
 */
export type RuleCategory = string;

/**
 * Outcome nativo — resultado estrutural abstrato de uma Evaluation futura.
 * EPC-06A: tipo apenas; nenhuma Evaluation é executada.
 */
export type RuleOutcome = "pass" | "fail" | "warning" | "skipped" | "error" | "pending" | "manual";

export const RULE_OUTCOMES: readonly RuleOutcome[] = [
  "pass",
  "fail",
  "warning",
  "skipped",
  "error",
  "pending",
  "manual",
] as const;

/**
 * Operator nativo — catálogo (FASE 7).
 * Somente registro; sem parser, sem evaluator, sem regex engine.
 */
export type RuleOperatorId =
  | "equals"
  | "notEquals"
  | "greaterThan"
  | "lessThan"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "exists"
  | "notExists"
  | "regex"
  | "expression"
  | "external";

export const RULE_OPERATORS: readonly RuleOperatorId[] = [
  "equals",
  "notEquals",
  "greaterThan",
  "lessThan",
  "contains",
  "startsWith",
  "endsWith",
  "exists",
  "notExists",
  "regex",
  "expression",
  "external",
] as const;

/**
 * Action kind nativo — catálogo (FASE 8).
 * Somente registro; sem execução de side-effects.
 */
export type RuleActionKind =
  | "approve"
  | "reject"
  | "warning"
  | "notify"
  | "continue"
  | "stop"
  | "escalate"
  | "manualReview"
  | "store"
  | "custom";

export const RULE_ACTION_KINDS: readonly RuleActionKind[] = [
  "approve",
  "reject",
  "warning",
  "notify",
  "continue",
  "stop",
  "escalate",
  "manualReview",
  "store",
  "custom",
] as const;

/**
 * Referência genérica a metadata (FASE 6 prep).
 * O Rule Engine NÃO resolve Metadata; apenas aponta.
 */
export type MetadataReference = {
  /** Id de Schema/Entity/Template no Metadata Engine (opaco). */
  metadataId?: string;
  /** Namespace opaco no Metadata Engine. */
  metadataNamespace?: string;
  /** Nome lógico opaco. */
  metadataName?: string;
  /** Versão opaca. */
  metadataVersion?: string;
  /** Kind estrutural livre (ex.: "schema", "entity") — sem interpretação. */
  metadataKind?: string;
};

/**
 * Referência genérica a Workflow (FASE 6 prep).
 * O Rule Engine NÃO orquestra Workflow; apenas aponta.
 */
export type WorkflowReference = {
  /** Id de Workflow no Workflow Engine (opaco). */
  workflowId?: string;
  /** Namespace opaco. */
  workflowNamespace?: string;
  /** Nome lógico opaco. */
  workflowName?: string;
  /** Stage / Transition opacos (sem interpretação). */
  stageId?: string;
  transitionId?: string;
  /** Kind estrutural livre. */
  workflowKind?: string;
};

/**
 * Operator descriptor — entrada do catálogo.
 * NÃO contém implementação de comparação.
 */
export type RuleOperator = {
  id: RuleOperatorId;
  name: string;
  description?: string;
  /** Indica se requer valor de comparação estrutural. */
  requiresValue?: boolean;
  /** Indica se é placeholder para EPC-06B (expression/external). */
  deferred?: boolean;
};

/**
 * Condition nativa — descriptor estrutural.
 * NÃO é avaliada nesta sprint.
 */
export type RuleCondition = {
  id?: string;
  name?: RuleName;
  /** Campo / caminho opaco no Context futuro (sem resolução). */
  field?: string;
  operator: RuleOperatorId;
  /** Valor estrutural opaco — sem tipagem de domínio. */
  value?: unknown;
  /** Params estruturais livres. */
  params?: Readonly<Record<string, unknown>>;
  description?: string;
  tags?: readonly RuleTag[];
};

/**
 * Action nativa — descriptor estrutural.
 * NÃO é executada nesta sprint.
 */
export type RuleAction = {
  id?: string;
  name?: RuleName;
  kind: RuleActionKind;
  /** Payload estrutural opaco. */
  payload?: Readonly<Record<string, unknown>>;
  description?: string;
  tags?: readonly RuleTag[];
  metadataRef?: MetadataReference;
  workflowRef?: WorkflowReference;
};

/**
 * Context nativo — bag estrutural opaco para Evaluation futura.
 * EPC-06A: tipo apenas; adapters não avaliam Context.
 */
export type RuleContext = {
  /** Dados estruturais livres (sem semântica de domínio). */
  data?: Readonly<Record<string, unknown>>;
  /** Refs opacas. */
  metadataRef?: MetadataReference;
  workflowRef?: WorkflowReference;
  tags?: readonly RuleTag[];
};

/**
 * Evaluation nativa — descriptor / resultado estrutural futuro.
 * EPC-06A: tipo apenas; nenhuma Evaluation é produzida pelo Port.
 */
export type RuleEvaluation = {
  id?: string;
  ruleId: RuleId;
  at?: string;
  outcome?: RuleOutcome;
  severity?: RuleSeverity;
  message?: string;
  /** Contexto opaco associado (não interpretado). */
  context?: RuleContext;
  /** Actions sugeridas (não executadas). */
  suggestedActions?: readonly RuleAction[];
  data?: Readonly<Record<string, unknown>>;
};

/**
 * Result nativo — resultado estrutural de uma operação do Port.
 */
export type RuleResult = {
  ok: boolean;
  message?: string;
  /** Código estrutural livre (ex.: "not_found", "registered"). */
  code?: string;
  /** Dados estruturais opcionais. */
  data?: Readonly<Record<string, unknown>>;
};

/**
 * Rule nativa — definição composta de Conditions / Actions / …
 * Sem lógica de negócio, sem evaluator.
 */
export type RuleDefinition = {
  id: RuleId;
  name: RuleName;
  namespace?: RuleNamespace;
  description?: string;
  status?: RuleStatus;
  version?: RuleVersion;
  priority?: RulePriority;
  severity?: RuleSeverity;
  category?: RuleCategory;
  conditions?: readonly RuleCondition[];
  actions?: readonly RuleAction[];
  metadataRef?: MetadataReference;
  workflowRef?: WorkflowReference;
  tags?: readonly RuleTag[];
  createdAt?: string;
  updatedAt?: string;
};

/* ─────────────────────────────────────────────────────────────────────────
 * Inputs / Results do Port
 * ───────────────────────────────────────────────────────────────────────── */

export type RegisterRuleInput = {
  rule: RuleDefinition;
};

export type RegisterRuleResult = RuleResult & {
  id: RuleId;
};

export type GetRuleInput = {
  id?: RuleId;
  name?: RuleName;
  namespace?: RuleNamespace;
};

export type GetRuleResult = RuleResult & {
  rule?: RuleDefinition;
};

export type ListRulesInput = {
  namespace?: RuleNamespace;
  status?: RuleStatus;
  priority?: RulePriority;
  category?: RuleCategory;
  tag?: RuleTag;
  namePrefix?: string;
};

export type ListRulesResult = RuleResult & {
  rules: readonly RuleDefinition[];
};

export type EnableRuleInput = {
  id: RuleId;
};

export type EnableRuleResult = RuleResult & {
  rule?: RuleDefinition;
};

export type DisableRuleInput = {
  id: RuleId;
};

export type DisableRuleResult = RuleResult & {
  rule?: RuleDefinition;
};

/** Opções de resolução do RulePort (provider factory). */
export type RuleProviderOptions = {
  /**
   * Provedor desejado. Default de produção: `default`.
   * Em testes: `mock` | `test`.
   */
  provider?: RuleProviderId;
};

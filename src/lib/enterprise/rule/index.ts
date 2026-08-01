/**
 * Enterprise Rule Engine — Ports & Adapters (EPC-06A) + Expression Engine (EPC-06B).
 *
 * Fluxo oficial (registro):
 *   Application → RulePort → RuleAdapter
 *     → RuleStore → RuleFactory → RuleProvider
 *
 * Fluxo oficial (expressões — EPC-06B):
 *   Application → RulePort → Expression Engine
 *     → Expression Parser → AST → Evaluation Context
 *       → Evaluation Runtime → Rule Adapter
 *
 * Domain/Application NÃO devem importar conceitos clínicos, TISS, OCR, IA,
 * Authorization, Auditoria, Contratos ou Persistence de produto.
 *
 * Conceitos nativos únicos:
 * Rule | Condition | Operator | Action | Evaluation | Context | Priority |
 * Result | Outcome | Severity | Category | Status | Version |
 * MetadataReference | WorkflowReference
 *
 * EPC-06A: infraestrutura de registro/catálogos.
 * EPC-06B: linguagem genérica de parsing/avaliação (sem regras de negócio).
 * RulePort NÃO expõe evaluate/parse — Expression Engine é módulo separado.
 * NÃO executa actions. NÃO liga a UI/API/produção.
 */
export type {
  DisableRuleInput,
  DisableRuleResult,
  EnableRuleInput,
  EnableRuleResult,
  GetRuleInput,
  GetRuleResult,
  ListRulesInput,
  ListRulesResult,
  MetadataReference,
  RegisterRuleInput,
  RegisterRuleResult,
  RuleAction,
  RuleActionCatalogEntry,
  RuleActionKind,
  RuleCapabilities,
  RuleCategory,
  RuleCondition,
  RuleContext,
  RuleDefinition,
  RuleEvaluation,
  RuleHealth,
  RuleId,
  RuleName,
  RuleNamespace,
  RuleOperator,
  RuleOperatorId,
  RuleOutcome,
  RulePort,
  RulePriority,
  RulePriorityCatalogEntry,
  RuleProviderId,
  RuleProviderOptions,
  RuleResult,
  RuleSeverity,
  RuleStatus,
  RuleTag,
  RuleVersion,
  WorkflowReference,
} from "./ports";

export {
  RULE_ACTION_CATALOG,
  RULE_ACTION_KINDS,
  RULE_OPERATOR_CATALOG,
  RULE_OPERATORS,
  RULE_OUTCOMES,
  RULE_PRIORITIES,
  RULE_PRIORITY_CATALOG,
  RULE_SEVERITIES,
  RULE_STATUSES,
  defineAction,
  getActionCatalogEntry,
  getOperator,
  getPriority,
  getPriorityRank,
  isKnownActionKind,
  isKnownOperator,
  isKnownPriority,
  listActionCatalog,
  listOperators,
  listPriorities,
} from "./ports";

export {
  DEFAULT_RULE_ADAPTER_ID,
  DefaultRuleAdapter,
  MockRuleAdapter,
  type DefaultRuleRuntime,
  type MockRuleAdapterOptions,
} from "./adapters";

export {
  DEFAULT_RULE_STORE_ID,
  DefaultRuleStore,
  type DefaultRuleStoreOptions,
  type StoredRuleDefinition,
  type RuleStore,
} from "./store";

export {
  createRuleDefinition,
  nowIso,
  withRuleStatus,
  type CreateRuleDefinitionInput,
} from "./factory";

export { createRulePort } from "./providers";

export { getRuleHealthSummary, type RuleHealthSummary } from "./demo";

/** Expression Engine (EPC-06B) — parsing e avaliação genéricos. */
export {
  DEFAULT_EXPRESSION_REGISTRY,
  EXPRESSION_FUNCTIONS,
  EXPRESSION_FUNCTION_CATALOG,
  EXPRESSION_OPERATORS,
  EXPRESSION_OPERATOR_CATALOG,
  ExpressionEvaluationError,
  ExpressionParseError,
  compareEquals,
  compareOrdered,
  contextNow,
  createEvaluationContext,
  createExpressionRegistry,
  evaluateAst,
  evaluateAstSafe,
  evaluateExpression,
  evaluateIn,
  evaluateRegex,
  evaluateRule,
  getExpressionFunction,
  getExpressionOperator,
  isKnownExpressionFunction,
  isKnownExpressionOperator,
  listExpressionFunctions,
  listExpressionOperators,
  listRegisteredFunctions,
  listRegisteredOperators,
  parseExpression,
  pathExists,
  resolvePath,
  toBoolean,
  type AstNode,
  type EvaluateAstResult,
  type EvaluateExpressionInput,
  type EvaluateExpressionResult,
  type EvaluationContext,
  type EvaluationRuntimeOptions,
  type ExpressionFunctionDescriptor,
  type ExpressionFunctionId,
  type ExpressionOperatorDescriptor,
  type ExpressionOperatorId,
  type ExpressionRegistry,
  type ParsedExpression,
  type RuleEvaluatorOptions,
} from "./expression";

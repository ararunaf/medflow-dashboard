/**
 * Enterprise Rule Expression Engine — EPC-06B.
 *
 * Fluxo oficial:
 *   Application
 *     → RulePort
 *       → Expression Engine
 *         → Expression Parser
 *           → AST
 *             → Evaluation Context
 *               → Evaluation Runtime
 *                 → Rule Adapter
 *
 * Mecanismo genérico de parsing e avaliação.
 * Reutilizável em qualquer produto IAeasy.
 *
 * NÃO conhece: regras clínicas, TISS, contratos, operadoras, OCR, IA.
 * NÃO altera UI / API / banco.
 * NÃO liga a produção.
 */

export type {
  AstArrayNode,
  AstBinaryNode,
  AstCallNode,
  AstLiteralNode,
  AstNode,
  AstPathNode,
  AstUnaryNode,
  ExpressionBinaryOperator,
  ExpressionLiteralValue,
  ExpressionUnaryOperator,
  ParsedExpression,
} from "./ast";

export { ExpressionParseError, parseExpression } from "./parser";

export {
  contextNow,
  createEvaluationContext,
  pathExists,
  resolvePath,
  type EvaluationContext,
} from "./context";

export {
  ExpressionEvaluationError,
  evaluateAst,
  evaluateAstSafe,
  type EvaluateAstResult,
  type EvaluationRuntimeOptions,
} from "./runtime";

export {
  evaluateExpression,
  evaluateRule,
  type EvaluateExpressionInput,
  type EvaluateExpressionResult,
  type RuleEvaluatorOptions,
} from "./evaluator";

export {
  DEFAULT_EXPRESSION_REGISTRY,
  EXPRESSION_FUNCTIONS,
  EXPRESSION_FUNCTION_CATALOG,
  EXPRESSION_OPERATORS,
  EXPRESSION_OPERATOR_CATALOG,
  compareEquals,
  compareOrdered,
  createExpressionRegistry,
  evaluateIn,
  evaluateRegex,
  getExpressionFunction,
  getExpressionOperator,
  isKnownExpressionFunction,
  isKnownExpressionOperator,
  listExpressionFunctions,
  listExpressionOperators,
  listRegisteredFunctions,
  listRegisteredOperators,
  toBoolean,
  type ExpressionFunctionDescriptor,
  type ExpressionFunctionHandler,
  type ExpressionFunctionId,
  type ExpressionOperatorDescriptor,
  type ExpressionOperatorId,
  type ExpressionRegistry,
} from "./registry";

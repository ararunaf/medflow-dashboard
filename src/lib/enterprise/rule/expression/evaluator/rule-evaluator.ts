/**
 * Rule Evaluator — EPC-06B FASE 5.
 *
 * Recebe Rule + Evaluation Context → Resultado.
 * Sem acesso a banco. Sem acesso a APIs.
 * Sem execução de Actions. Sem regras clínicas/TISS/contratos.
 */

import type { RuleCondition, RuleDefinition, RuleEvaluation, RuleOutcome } from "../../ports/types";
import type { AstNode } from "../ast/types";
import type { EvaluationContext } from "../context/evaluation-context";
import { createEvaluationContext, pathExists, resolvePath } from "../context/evaluation-context";
import { parseExpression, ExpressionParseError } from "../parser";
import {
  DEFAULT_EXPRESSION_REGISTRY,
  compareEquals,
  compareOrdered,
  evaluateIn,
  evaluateRegex,
  toBoolean,
  type ExpressionRegistry,
} from "../registry";
import { evaluateAstSafe } from "../runtime";

export type RuleEvaluatorOptions = {
  registry?: ExpressionRegistry;
  /** Relógio opcional propagado ao Evaluation Context. */
  now?: Date;
};

export type EvaluateExpressionInput = {
  expression: string;
  context: EvaluationContext;
};

export type EvaluateExpressionResult = {
  ok: boolean;
  value?: unknown;
  truthy?: boolean;
  error?: string;
  code?: string;
};

/**
 * Avalia uma expressão textual genérica.
 * API pura — sem I/O.
 */
export function evaluateExpression(
  input: EvaluateExpressionInput,
  options: RuleEvaluatorOptions = {},
): EvaluateExpressionResult {
  try {
    const parsed = parseExpression(input.expression);
    const result = evaluateAstSafe(parsed.ast, input.context, {
      registry: options.registry ?? DEFAULT_EXPRESSION_REGISTRY,
    });
    if (!result.ok) {
      return { ok: false, error: result.error, code: "evaluation_error" };
    }
    return { ok: true, value: result.value, truthy: result.truthy, code: "evaluated" };
  } catch (err) {
    if (err instanceof ExpressionParseError) {
      return { ok: false, error: err.message, code: "parse_error" };
    }
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message, code: "evaluation_error" };
  }
}

/**
 * Avalia uma RuleDefinition contra um Evaluation Context.
 * - Conditions são AND-ed.
 * - Actions NÃO são executadas (apenas sugeridas no resultado).
 * - Status disabled/archived → skipped.
 */
export function evaluateRule(
  rule: RuleDefinition,
  context: EvaluationContext | Readonly<Record<string, unknown>>,
  options: RuleEvaluatorOptions = {},
): RuleEvaluation {
  const evalContext = isEvaluationContext(context)
    ? context
    : createEvaluationContext(context, { now: options.now });

  const at = (options.now ?? new Date()).toISOString();

  if (rule.status === "disabled" || rule.status === "archived") {
    return {
      ruleId: rule.id,
      at,
      outcome: "skipped",
      severity: rule.severity,
      message: `rule status is ${rule.status}`,
      context: { data: evalContext.data },
      suggestedActions: rule.actions,
      data: { status: rule.status },
    };
  }

  const conditions = rule.conditions ?? [];
  if (conditions.length === 0) {
    return {
      ruleId: rule.id,
      at,
      outcome: "pass",
      severity: rule.severity,
      message: "no conditions",
      context: { data: evalContext.data },
      suggestedActions: rule.actions,
      data: { matched: true },
    };
  }

  const details: Array<Record<string, unknown>> = [];
  let failed = false;
  let errored = false;

  for (const condition of conditions) {
    const result = evaluateCondition(condition, evalContext, options);
    details.push({
      conditionId: condition.id,
      operator: condition.operator,
      field: condition.field,
      ok: result.ok,
      matched: result.matched,
      error: result.error,
    });
    if (!result.ok) {
      errored = true;
      break;
    }
    if (!result.matched) {
      failed = true;
      break;
    }
  }

  let outcome: RuleOutcome;
  if (errored) outcome = "error";
  else if (failed) outcome = "fail";
  else outcome = "pass";

  return {
    ruleId: rule.id,
    at,
    outcome,
    severity: rule.severity,
    message:
      outcome === "pass"
        ? "all conditions matched"
        : outcome === "fail"
          ? "condition mismatch"
          : "condition evaluation error",
    context: { data: evalContext.data },
    suggestedActions: outcome === "pass" || outcome === "fail" ? rule.actions : undefined,
    data: { details, matched: outcome === "pass" },
  };
}

type ConditionEval = { ok: boolean; matched: boolean; error?: string };

function evaluateCondition(
  condition: RuleCondition,
  context: EvaluationContext,
  options: RuleEvaluatorOptions,
): ConditionEval {
  const registry = options.registry ?? DEFAULT_EXPRESSION_REGISTRY;

  if (condition.operator === "expression") {
    const expr =
      (typeof condition.value === "string" ? condition.value : undefined) ??
      (typeof condition.params?.expression === "string" ? condition.params.expression : undefined);
    if (!expr) {
      return { ok: false, matched: false, error: "expression operator requires string value" };
    }
    const result = evaluateExpression(
      { expression: expr, context },
      { registry, now: options.now },
    );
    if (!result.ok) return { ok: false, matched: false, error: result.error };
    return { ok: true, matched: Boolean(result.truthy) };
  }

  if (condition.operator === "external") {
    return {
      ok: false,
      matched: false,
      error: "external operator is not evaluable by Expression Engine",
    };
  }

  const fieldValue =
    condition.field !== undefined && condition.field.length > 0
      ? resolvePath(context, condition.field.split("."))
      : undefined;

  switch (condition.operator) {
    case "equals":
      return { ok: true, matched: compareEquals(fieldValue, condition.value) };
    case "notEquals":
      return { ok: true, matched: !compareEquals(fieldValue, condition.value) };
    case "greaterThan":
      return { ok: true, matched: compareOrdered(fieldValue, condition.value, ">") };
    case "lessThan":
      return { ok: true, matched: compareOrdered(fieldValue, condition.value, "<") };
    case "contains": {
      if (typeof fieldValue === "string" && typeof condition.value === "string") {
        return { ok: true, matched: fieldValue.includes(condition.value) };
      }
      if (Array.isArray(fieldValue)) {
        return {
          ok: true,
          matched: fieldValue.some((item) => compareEquals(item, condition.value)),
        };
      }
      return { ok: true, matched: false };
    }
    case "startsWith":
      return {
        ok: true,
        matched:
          typeof fieldValue === "string" &&
          typeof condition.value === "string" &&
          fieldValue.startsWith(condition.value),
      };
    case "endsWith":
      return {
        ok: true,
        matched:
          typeof fieldValue === "string" &&
          typeof condition.value === "string" &&
          fieldValue.endsWith(condition.value),
      };
    case "exists":
      return {
        ok: true,
        matched:
          condition.field !== undefined &&
          condition.field.length > 0 &&
          pathExists(context, condition.field.split(".")),
      };
    case "notExists":
      return {
        ok: true,
        matched:
          condition.field === undefined ||
          condition.field.length === 0 ||
          !pathExists(context, condition.field.split(".")),
      };
    case "regex":
      return {
        ok: true,
        matched: evaluateRegex(fieldValue, condition.value),
      };
    default: {
      // Fallback: monta AST estrutural se possível
      const ast = conditionToAst(condition);
      if (!ast) {
        return { ok: false, matched: false, error: `unsupported operator: ${condition.operator}` };
      }
      const result = evaluateAstSafe(ast, context, { registry });
      if (!result.ok) return { ok: false, matched: false, error: result.error };
      return { ok: true, matched: toBoolean(result.value) };
    }
  }
}

function conditionToAst(condition: RuleCondition): AstNode | undefined {
  if (!condition.field) return undefined;
  const path: AstNode = { kind: "path", path: condition.field.split(".") };
  const value: AstNode = { kind: "literal", value: normalizeLiteral(condition.value) };
  switch (condition.operator) {
    case "equals":
      return { kind: "binary", op: "==", left: path, right: value };
    case "notEquals":
      return { kind: "binary", op: "!=", left: path, right: value };
    case "greaterThan":
      return { kind: "binary", op: ">", left: path, right: value };
    case "lessThan":
      return { kind: "binary", op: "<", left: path, right: value };
    default:
      return undefined;
  }
}

function normalizeLiteral(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  return String(value);
}

function isEvaluationContext(
  value: EvaluationContext | Readonly<Record<string, unknown>>,
): value is EvaluationContext {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    typeof (value as EvaluationContext).data === "object" &&
    (value as EvaluationContext).data !== null
  );
}

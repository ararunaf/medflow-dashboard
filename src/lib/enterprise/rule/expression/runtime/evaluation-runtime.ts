/**
 * Evaluation Runtime — EPC-06B FASE 4.
 *
 * Executa AST contra Evaluation Context + Expression Registry.
 * Sem acesso a banco, APIs, UI ou domínio clínico.
 */

import type { AstNode, ExpressionBinaryOperator } from "../ast/types";
import type { EvaluationContext } from "../context/evaluation-context";
import { pathExists, resolvePath } from "../context/evaluation-context";
import {
  DEFAULT_EXPRESSION_REGISTRY,
  compareEquals,
  compareOrdered,
  evaluateIn,
  evaluateRegex,
  toBoolean,
  type ExpressionRegistry,
} from "../registry";

export type EvaluationRuntimeOptions = {
  registry?: ExpressionRegistry;
};

export type EvaluateAstResult = {
  ok: boolean;
  value: unknown;
  truthy: boolean;
  error?: string;
};

export class ExpressionEvaluationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExpressionEvaluationError";
  }
}

/**
 * Avalia um nó AST no contexto informado.
 * @throws ExpressionEvaluationError em falhas estruturais (função desconhecida, etc.)
 */
export function evaluateAst(
  node: AstNode,
  context: EvaluationContext,
  options: EvaluationRuntimeOptions = {},
): unknown {
  const registry = options.registry ?? DEFAULT_EXPRESSION_REGISTRY;
  return evalNode(node, context, registry);
}

/** Avalia AST e normaliza resultado (ok / truthy / erro). */
export function evaluateAstSafe(
  node: AstNode,
  context: EvaluationContext,
  options: EvaluationRuntimeOptions = {},
): EvaluateAstResult {
  try {
    const value = evaluateAst(node, context, options);
    return { ok: true, value, truthy: toBoolean(value) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, value: undefined, truthy: false, error: message };
  }
}

function evalNode(
  node: AstNode,
  context: EvaluationContext,
  registry: ExpressionRegistry,
): unknown {
  switch (node.kind) {
    case "literal":
      return node.value;

    case "path":
      return resolvePath(context, node.path);

    case "array":
      return node.elements.map((el) => evalNode(el, context, registry));

    case "unary":
      return evalUnary(node.op, node.argument, context, registry);

    case "binary":
      return evalBinary(node.op, node.left, node.right, context, registry);

    case "call":
      return evalCall(node.name, node.args, context, registry);

    default: {
      const _exhaustive: never = node;
      throw new ExpressionEvaluationError(`nó AST desconhecido: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

function evalUnary(
  op: "NOT" | "EXISTS" | "ISNULL",
  argument: AstNode,
  context: EvaluationContext,
  registry: ExpressionRegistry,
): boolean {
  switch (op) {
    case "NOT":
      return !toBoolean(evalNode(argument, context, registry));
    case "EXISTS":
      if (argument.kind === "path") {
        return pathExists(context, argument.path);
      }
      return evalNode(argument, context, registry) !== undefined;
    case "ISNULL": {
      const value = evalNode(argument, context, registry);
      return value === null || value === undefined;
    }
    default: {
      const _exhaustive: never = op;
      throw new ExpressionEvaluationError(`operador unário desconhecido: ${_exhaustive}`);
    }
  }
}

function evalBinary(
  op: ExpressionBinaryOperator,
  leftNode: AstNode,
  rightNode: AstNode,
  context: EvaluationContext,
  registry: ExpressionRegistry,
): unknown {
  // Short-circuit para AND / OR
  if (op === "AND") {
    const left = toBoolean(evalNode(leftNode, context, registry));
    if (!left) return false;
    return toBoolean(evalNode(rightNode, context, registry));
  }
  if (op === "OR") {
    const left = toBoolean(evalNode(leftNode, context, registry));
    if (left) return true;
    return toBoolean(evalNode(rightNode, context, registry));
  }

  const left = evalNode(leftNode, context, registry);
  const right = evalNode(rightNode, context, registry);

  switch (op) {
    case "==":
      return compareEquals(left, right);
    case "!=":
      return !compareEquals(left, right);
    case ">":
    case ">=":
    case "<":
    case "<=":
      return compareOrdered(left, right, op);
    case "IN":
      return evaluateIn(left, right);
    case "REGEX":
      return evaluateRegex(left, right);
    default: {
      const _exhaustive: never = op;
      throw new ExpressionEvaluationError(`operador binário desconhecido: ${_exhaustive}`);
    }
  }
}

function evalCall(
  name: string,
  args: readonly AstNode[],
  context: EvaluationContext,
  registry: ExpressionRegistry,
): unknown {
  const fn = registry.getFunction(name);
  if (!fn) {
    throw new ExpressionEvaluationError(`função desconhecida: ${name}`);
  }
  if (args.length < fn.arity.min || args.length > fn.arity.max) {
    throw new ExpressionEvaluationError(
      `função ${name} espera ${fn.arity.min}..${fn.arity.max} args, recebeu ${args.length}`,
    );
  }
  const evaluatedArgs = args.map((arg) => evalNode(arg, context, registry));
  return fn.handler(evaluatedArgs, context);
}

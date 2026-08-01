/**
 * Operadores mínimos da linguagem — EPC-06B FASE 7.
 *
 * == != > >= < <= AND OR NOT IN EXISTS REGEX ISNULL
 * Sem operadores clínicos / TISS / contratuais.
 */

import type { ExpressionBinaryOperator, ExpressionUnaryOperator } from "../ast/types";

/** Identificador de operador da Expression Language. */
export type ExpressionOperatorId = ExpressionBinaryOperator | ExpressionUnaryOperator;

export type ExpressionOperatorDescriptor = {
  id: ExpressionOperatorId;
  name: string;
  arity: 1 | 2;
  description?: string;
};

/** Catálogo mínimo obrigatório (FASE 7). */
export const EXPRESSION_OPERATORS: readonly ExpressionOperatorId[] = [
  "==",
  "!=",
  ">",
  ">=",
  "<",
  "<=",
  "AND",
  "OR",
  "NOT",
  "IN",
  "EXISTS",
  "REGEX",
  "ISNULL",
] as const;

export const EXPRESSION_OPERATOR_CATALOG: readonly ExpressionOperatorDescriptor[] = [
  { id: "==", name: "Equals", arity: 2, description: "Loose/structural equality." },
  { id: "!=", name: "Not Equals", arity: 2, description: "Inequality." },
  { id: ">", name: "Greater Than", arity: 2 },
  { id: ">=", name: "Greater Than Or Equal", arity: 2 },
  { id: "<", name: "Less Than", arity: 2 },
  { id: "<=", name: "Less Than Or Equal", arity: 2 },
  { id: "AND", name: "Logical And", arity: 2 },
  { id: "OR", name: "Logical Or", arity: 2 },
  { id: "NOT", name: "Logical Not", arity: 1 },
  { id: "IN", name: "In Collection", arity: 2 },
  { id: "EXISTS", name: "Exists", arity: 1, description: "Path presence in context." },
  { id: "REGEX", name: "Regex Match", arity: 2 },
  { id: "ISNULL", name: "Is Null", arity: 1 },
] as const;

export function isKnownExpressionOperator(id: string): id is ExpressionOperatorId {
  return (EXPRESSION_OPERATORS as readonly string[]).includes(id);
}

export function getExpressionOperator(
  id: ExpressionOperatorId,
): ExpressionOperatorDescriptor | undefined {
  return EXPRESSION_OPERATOR_CATALOG.find((op) => op.id === id);
}

export function listExpressionOperators(): readonly ExpressionOperatorDescriptor[] {
  return EXPRESSION_OPERATOR_CATALOG;
}

/** Comparação estrutural genérica (sem tipagem de domínio). */
export function compareEquals(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (left === null || right === null || left === undefined || right === undefined) {
    return left === right;
  }
  if (typeof left === "number" && typeof right === "string" && right.trim() !== "") {
    const n = Number(right);
    if (!Number.isNaN(n)) return left === n;
  }
  if (typeof right === "number" && typeof left === "string" && left.trim() !== "") {
    const n = Number(left);
    if (!Number.isNaN(n)) return n === right;
  }
  return left === right;
}

function toComparableNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (!Number.isNaN(n) && Number.isFinite(n)) return n;
  }
  if (value instanceof Date) return value.getTime();
  return undefined;
}

export function compareOrdered(
  left: unknown,
  right: unknown,
  op: ">" | ">=" | "<" | "<=",
): boolean {
  const a = toComparableNumber(left);
  const b = toComparableNumber(right);
  if (a !== undefined && b !== undefined) {
    switch (op) {
      case ">":
        return a > b;
      case ">=":
        return a >= b;
      case "<":
        return a < b;
      case "<=":
        return a <= b;
    }
  }
  if (typeof left === "string" && typeof right === "string") {
    switch (op) {
      case ">":
        return left > right;
      case ">=":
        return left >= right;
      case "<":
        return left < right;
      case "<=":
        return left <= right;
    }
  }
  return false;
}

export function evaluateIn(left: unknown, right: unknown): boolean {
  if (Array.isArray(right)) {
    return right.some((item) => compareEquals(left, item));
  }
  if (typeof right === "string" && typeof left === "string") {
    return right.includes(left);
  }
  return false;
}

export function evaluateRegex(value: unknown, pattern: unknown): boolean {
  if (typeof value !== "string" || typeof pattern !== "string") return false;
  try {
    return new RegExp(pattern).test(value);
  } catch {
    return false;
  }
}

export function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (value === null || value === undefined) return false;
  if (typeof value === "number") return value !== 0 && !Number.isNaN(value);
  if (typeof value === "string") return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * Funções nativas da linguagem — EPC-06B FASE 8.
 *
 * length | contains | startsWith | endsWith | matches | today | now
 * Sem funções específicas do MedicFlow.
 */

import type { EvaluationContext } from "../context/evaluation-context";
import { contextNow } from "../context/evaluation-context";
import { evaluateRegex } from "./operators";

/** Identificador de função nativa. */
export type ExpressionFunctionId =
  | "length"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "matches"
  | "today"
  | "now";

export type ExpressionFunctionHandler = (
  args: readonly unknown[],
  context: EvaluationContext,
) => unknown;

export type ExpressionFunctionDescriptor = {
  id: ExpressionFunctionId;
  name: string;
  arity: { min: number; max: number };
  description?: string;
  handler: ExpressionFunctionHandler;
};

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export const EXPRESSION_FUNCTIONS: readonly ExpressionFunctionId[] = [
  "length",
  "contains",
  "startsWith",
  "endsWith",
  "matches",
  "today",
  "now",
] as const;

export const EXPRESSION_FUNCTION_CATALOG: readonly ExpressionFunctionDescriptor[] = [
  {
    id: "length",
    name: "length",
    arity: { min: 1, max: 1 },
    description: "Length of string or array.",
    handler: (args) => {
      const v = args[0];
      if (typeof v === "string" || Array.isArray(v)) return v.length;
      return null;
    },
  },
  {
    id: "contains",
    name: "contains",
    arity: { min: 2, max: 2 },
    description: "String/array containment.",
    handler: (args) => {
      const haystack = args[0];
      const needle = args[1];
      if (typeof haystack === "string" && typeof needle === "string") {
        return haystack.includes(needle);
      }
      if (Array.isArray(haystack)) {
        return haystack.includes(needle);
      }
      return false;
    },
  },
  {
    id: "startsWith",
    name: "startsWith",
    arity: { min: 2, max: 2 },
    handler: (args) => {
      const s = asString(args[0]);
      const prefix = asString(args[1]);
      if (s === undefined || prefix === undefined) return false;
      return s.startsWith(prefix);
    },
  },
  {
    id: "endsWith",
    name: "endsWith",
    arity: { min: 2, max: 2 },
    handler: (args) => {
      const s = asString(args[0]);
      const suffix = asString(args[1]);
      if (s === undefined || suffix === undefined) return false;
      return s.endsWith(suffix);
    },
  },
  {
    id: "matches",
    name: "matches",
    arity: { min: 2, max: 2 },
    description: "Regex match helper (same semantics as REGEX operator).",
    handler: (args) => evaluateRegex(args[0], args[1]),
  },
  {
    id: "today",
    name: "today",
    arity: { min: 0, max: 0 },
    description: "ISO date (YYYY-MM-DD) from context clock.",
    handler: (_args, context) => {
      const d = contextNow(context);
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(d.getUTCDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    },
  },
  {
    id: "now",
    name: "now",
    arity: { min: 0, max: 0 },
    description: "ISO timestamp from context clock.",
    handler: (_args, context) => contextNow(context).toISOString(),
  },
] as const;

export function isKnownExpressionFunction(id: string): id is ExpressionFunctionId {
  return (EXPRESSION_FUNCTIONS as readonly string[]).includes(id);
}

export function getExpressionFunction(
  id: ExpressionFunctionId | string,
): ExpressionFunctionDescriptor | undefined {
  return EXPRESSION_FUNCTION_CATALOG.find((fn) => fn.id === id || fn.name === id);
}

export function listExpressionFunctions(): readonly ExpressionFunctionDescriptor[] {
  return EXPRESSION_FUNCTION_CATALOG;
}

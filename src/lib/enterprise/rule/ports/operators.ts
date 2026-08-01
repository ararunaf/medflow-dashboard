/**
 * Catálogo de Operators — EPC-06A FASE 7.
 *
 * Somente registro estrutural.
 * NÃO implementa lógica de comparação, parser, regex engine ou expressões.
 * Avaliação real = EPC-06B.
 */
import type { RuleOperator, RuleOperatorId } from "./types";
import { RULE_OPERATORS } from "./types";

/** Catálogo oficial de operators (infraestrutura). */
export const RULE_OPERATOR_CATALOG: readonly RuleOperator[] = [
  {
    id: "equals",
    name: "Equals",
    description: "Structural equality comparison (evaluator deferred to EPC-06B).",
    requiresValue: true,
  },
  {
    id: "notEquals",
    name: "Not Equals",
    description: "Structural inequality comparison (evaluator deferred to EPC-06B).",
    requiresValue: true,
  },
  {
    id: "greaterThan",
    name: "Greater Than",
    description: "Structural greater-than comparison (evaluator deferred to EPC-06B).",
    requiresValue: true,
  },
  {
    id: "lessThan",
    name: "Less Than",
    description: "Structural less-than comparison (evaluator deferred to EPC-06B).",
    requiresValue: true,
  },
  {
    id: "contains",
    name: "Contains",
    description: "Structural containment check (evaluator deferred to EPC-06B).",
    requiresValue: true,
  },
  {
    id: "startsWith",
    name: "Starts With",
    description: "Structural prefix check (evaluator deferred to EPC-06B).",
    requiresValue: true,
  },
  {
    id: "endsWith",
    name: "Ends With",
    description: "Structural suffix check (evaluator deferred to EPC-06B).",
    requiresValue: true,
  },
  {
    id: "exists",
    name: "Exists",
    description: "Structural presence check (evaluator deferred to EPC-06B).",
    requiresValue: false,
  },
  {
    id: "notExists",
    name: "Not Exists",
    description: "Structural absence check (evaluator deferred to EPC-06B).",
    requiresValue: false,
  },
  {
    id: "regex",
    name: "Regex",
    description: "Catalog placeholder — no regex engine in EPC-06A.",
    requiresValue: true,
    deferred: true,
  },
  {
    id: "expression",
    name: "Expression",
    description: "Catalog placeholder — no expression language in EPC-06A.",
    requiresValue: true,
    deferred: true,
  },
  {
    id: "external",
    name: "External",
    description: "Catalog placeholder — external evaluator hook for future sprints.",
    requiresValue: false,
    deferred: true,
  },
] as const;

/** Verifica se o id é um operator conhecido do catálogo. */
export function isKnownOperator(id: string): id is RuleOperatorId {
  return (RULE_OPERATORS as readonly string[]).includes(id);
}

/** Obtém descriptor do catálogo (ou undefined). */
export function getOperator(id: RuleOperatorId): RuleOperator | undefined {
  return RULE_OPERATOR_CATALOG.find((op) => op.id === id);
}

/** Lista o catálogo completo (somente leitura). */
export function listOperators(): readonly RuleOperator[] {
  return RULE_OPERATOR_CATALOG;
}

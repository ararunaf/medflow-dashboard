/**
 * Helpers estruturais de Condition — EPC-05.
 *
 * NÃO implementa Rule Engine. Avaliação é trivial/estrutural:
 * - always → true
 * - never → false
 * - event → compara eventName opcional
 * - expression / metadata / external → true por default (prep; sem interpretação)
 */
import type { WorkflowCondition, WorkflowConditionKind } from "./types";
import { WORKFLOW_CONDITION_KINDS } from "./types";

export { WORKFLOW_CONDITION_KINDS };

export function isKnownConditionKind(kind: string): kind is WorkflowConditionKind {
  return (WORKFLOW_CONDITION_KINDS as readonly string[]).includes(kind);
}

export function defineCondition(
  partial: Pick<WorkflowCondition, "kind"> & Partial<WorkflowCondition>,
): WorkflowCondition {
  return {
    kind: partial.kind,
    id: partial.id,
    name: partial.name,
    expression: partial.expression,
    eventName: partial.eventName,
    metadataRef: partial.metadataRef,
    params: partial.params,
    description: partial.description,
    tags: partial.tags,
  };
}

export function alwaysCondition(options: Partial<WorkflowCondition> = {}): WorkflowCondition {
  return defineCondition({ ...options, kind: "always" });
}

export function neverCondition(options: Partial<WorkflowCondition> = {}): WorkflowCondition {
  return defineCondition({ ...options, kind: "never" });
}

export function eventCondition(
  eventName: string,
  options: Partial<WorkflowCondition> = {},
): WorkflowCondition {
  return defineCondition({ ...options, kind: "event", eventName });
}

export function expressionCondition(
  expression: string,
  options: Partial<WorkflowCondition> = {},
): WorkflowCondition {
  return defineCondition({ ...options, kind: "expression", expression });
}

/**
 * Avaliação estrutural trivial (sem regras de negócio).
 * Rule Engine futuro substituirá este comportamento para kinds complexos.
 */
export function evaluateConditionStructurally(
  condition: WorkflowCondition,
  context?: { eventName?: string },
): boolean {
  switch (condition.kind) {
    case "always":
      return true;
    case "never":
      return false;
    case "event":
      if (!condition.eventName) return false;
      return context?.eventName === condition.eventName;
    case "expression":
    case "metadata":
    case "external":
      // Prep: sem evaluator — passa estruturalmente para não bloquear fundação.
      return true;
    default: {
      const _exhaustive: never = condition.kind;
      void _exhaustive;
      return false;
    }
  }
}

/** Todas as conditions must pass (AND estrutural). Lista vazia = true. */
export function evaluateConditionsStructurally(
  conditions: readonly WorkflowCondition[] | undefined,
  context?: { eventName?: string },
): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((c) => evaluateConditionStructurally(c, context));
}

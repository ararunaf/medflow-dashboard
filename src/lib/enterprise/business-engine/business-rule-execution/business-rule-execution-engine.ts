/**
 * BusinessRuleExecutionEngine — E-02.
 *
 * Executa regras canônicas do BusinessRuleCatalog.
 * Reutiliza catálogo. Sem TISS/ANS/Operadoras/Tenants/Contratos/Workflow.
 */
import type {
  CanonicalBusinessRule,
  CanonicalBusinessRuleAction,
  CanonicalBusinessRuleCondition,
  CanonicalBusinessRuleExecutionResult,
} from "../ports/canonical";

export type Facts = Record<string, unknown>;

export class BusinessRuleExecutionEngine {
  execute(rule: CanonicalBusinessRule, facts: Facts): CanonicalBusinessRuleExecutionResult {
    const matched =
      rule.conditions.length === 0 ||
      rule.conditions.every((c) => this.evaluateCondition(c, facts));
    const actions: readonly CanonicalBusinessRuleAction[] = matched
      ? rule.actions
      : [
          {
            kind: "canonical-business-rule-action",
            type: "log",
            message: "conditions did not match",
          },
        ];

    const output: Record<string, unknown> = {};
    for (const action of actions) {
      if (action.type === "set-value" && action.target) {
        output[action.target] = action.value;
      }
    }

    const ok = !actions.some((a) => a.type === "deny");
    return {
      kind: "canonical-business-rule-execution-result",
      ok,
      ruleId: rule.ruleId,
      matched,
      code: matched ? "BUSINESS_RULE_EXECUTED" : "BUSINESS_RULE_NOT_MATCHED",
      message: matched ? "rule matched and actions applied" : "rule did not match",
      actions,
      facts,
      output,
    };
  }

  private evaluateCondition(condition: CanonicalBusinessRuleCondition, facts: Facts): boolean {
    const factValue = facts[condition.field];
    const expected = condition.value;

    switch (condition.operator) {
      case "eq":
        return factValue === expected;
      case "neq":
        return factValue !== expected;
      case "gt":
        return this.asNumber(factValue) > this.asNumber(expected);
      case "gte":
        return this.asNumber(factValue) >= this.asNumber(expected);
      case "lt":
        return this.asNumber(factValue) < this.asNumber(expected);
      case "lte":
        return this.asNumber(factValue) <= this.asNumber(expected);
      case "in":
        return Array.isArray(expected) && expected.includes(factValue);
      case "contains":
        return this.asString(factValue).includes(this.asString(expected));
      default:
        return false;
    }
  }

  private asNumber(value: unknown): number {
    if (typeof value === "number") return value;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
  }

  private asString(value: unknown): string {
    if (typeof value === "string") return value;
    if (value === null || value === undefined) return "";
    return String(value);
  }
}

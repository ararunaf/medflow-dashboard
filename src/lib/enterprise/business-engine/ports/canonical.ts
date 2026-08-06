/**
 * Contratos canônicos da Enterprise Business Engine — BLOCO E.
 *
 * Sem TISS. Sem ANS. Sem Operadoras. Sem Workflow. Sem banco. Sem persistência.
 */

export interface CanonicalBusinessRuleCondition {
  readonly kind: "canonical-business-rule-condition";
  readonly field: string;
  readonly operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains";
  readonly value: unknown;
}

export interface CanonicalBusinessRuleAction {
  readonly kind: "canonical-business-rule-action";
  readonly type: "allow" | "deny" | "set-value" | "log";
  readonly target?: string;
  readonly value?: unknown;
  readonly message?: string;
}

export interface CanonicalBusinessRule {
  readonly kind: "canonical-business-rule";
  readonly ruleId: string;
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  readonly conditions: readonly CanonicalBusinessRuleCondition[];
  readonly actions: readonly CanonicalBusinessRuleAction[];
  readonly tags?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

export interface CanonicalBusinessRuleCatalogResult {
  readonly kind: "canonical-business-rule-catalog-result";
  readonly ok: boolean;
  readonly ruleId?: string;
  readonly code: string;
  readonly message: string;
  readonly rule?: CanonicalBusinessRule | null;
}

export interface CanonicalBusinessRuleCatalogHealth {
  readonly ok: boolean;
  readonly businessEngineOk: boolean;
  readonly businessRuleCatalogOk: boolean;
}

export interface CanonicalBusinessRuleCatalogStats {
  readonly totalRules: number;
  readonly ruleIds: readonly string[];
  readonly tags: readonly string[];
}

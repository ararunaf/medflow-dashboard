/**
 * BusinessRuleCatalog — E-01.
 *
 * Catálogo canônico de regras de negócio.
 * Sem execução. Sem TISS. Sem banco.
 */
import type {
  CanonicalBusinessRule,
  CanonicalBusinessRuleCatalogResult,
  CanonicalBusinessRuleCatalogStats,
} from "../ports/canonical";

export interface BusinessRuleCatalogStore {
  get(ruleId: string): CanonicalBusinessRule | undefined;
  set(rule: CanonicalBusinessRule): void;
  list(tag?: string, limit?: number, offset?: number): CanonicalBusinessRule[];
  all(): CanonicalBusinessRule[];
  stats(): CanonicalBusinessRuleCatalogStats;
}

export class InMemoryBusinessRuleCatalogStore implements BusinessRuleCatalogStore {
  private readonly rules = new Map<string, CanonicalBusinessRule>();

  get(ruleId: string): CanonicalBusinessRule | undefined {
    return this.rules.get(ruleId);
  }

  set(rule: CanonicalBusinessRule): void {
    this.rules.set(rule.ruleId, rule);
  }

  all(): CanonicalBusinessRule[] {
    return Array.from(this.rules.values());
  }

  list(tag?: string, limit = Number.POSITIVE_INFINITY, offset = 0): CanonicalBusinessRule[] {
    const all = this.all();
    const filtered = tag ? all.filter((r) => r.tags?.includes(tag)) : all;
    return filtered.slice(offset, offset + limit);
  }

  stats(): CanonicalBusinessRuleCatalogStats {
    const all = this.all();
    const tags = new Set<string>();
    for (const rule of all) {
      for (const tag of rule.tags ?? []) tags.add(tag);
    }
    return {
      totalRules: all.length,
      ruleIds: all.map((r) => r.ruleId),
      tags: Array.from(tags),
    };
  }
}

export class BusinessRuleCatalog {
  constructor(
    private readonly store: BusinessRuleCatalogStore = new InMemoryBusinessRuleCatalogStore(),
  ) {}

  register(rule: CanonicalBusinessRule): CanonicalBusinessRuleCatalogResult {
    if (!rule.ruleId || rule.ruleId.trim() === "") {
      return {
        kind: "canonical-business-rule-catalog-result",
        ok: false,
        code: "BUSINESS_RULE_CATALOG_INVALID_RULE_ID",
        message: "ruleId is required",
      };
    }
    if (!rule.name || rule.name.trim() === "") {
      return {
        kind: "canonical-business-rule-catalog-result",
        ok: false,
        code: "BUSINESS_RULE_CATALOG_INVALID_NAME",
        message: "name is required",
      };
    }
    this.store.set(rule);
    return {
      kind: "canonical-business-rule-catalog-result",
      ok: true,
      ruleId: rule.ruleId,
      rule,
      code: "BUSINESS_RULE_CATALOG_REGISTERED",
      message: "rule registered",
    };
  }

  find(ruleId: string): CanonicalBusinessRuleCatalogResult {
    const rule = this.store.get(ruleId);
    if (!rule) {
      return {
        kind: "canonical-business-rule-catalog-result",
        ok: false,
        code: "BUSINESS_RULE_CATALOG_NOT_FOUND",
        message: `rule ${ruleId} not found`,
      };
    }
    return {
      kind: "canonical-business-rule-catalog-result",
      ok: true,
      ruleId,
      rule,
      code: "BUSINESS_RULE_CATALOG_FOUND",
      message: "rule found",
    };
  }

  list(tag?: string, limit?: number, offset?: number): CanonicalBusinessRule[] {
    return this.store.list(tag, limit, offset);
  }

  stats(): CanonicalBusinessRuleCatalogStats {
    return this.store.stats();
  }
}

/**
 * DefaultBusinessEngineAdapter — E-01.
 *
 * Adapter oficial da Enterprise Business Engine.
 * Apenas `businessRuleCatalogImplemented = true`.
 */
import { BusinessRuleCatalog, InMemoryBusinessRuleCatalogStore } from "../business-rule-catalog";
import { E01_BUSINESS_ENGINE_CAPABILITIES } from "../ports/capabilities";
import type { BusinessEnginePort } from "../ports/business-engine-port";
import type {
  BusinessEngineCapabilities,
  BusinessEngineHealth,
  BusinessEngineInfo,
  FindBusinessRuleInput,
  FindBusinessRuleResult,
  GetBusinessRuleCatalogStatsInput,
  GetBusinessRuleCatalogStatsResult,
  ListBusinessRulesInput,
  ListBusinessRulesResult,
  RegisterBusinessRuleInput,
  RegisterBusinessRuleResult,
} from "../ports/types";

export const DEFAULT_BUSINESS_ENGINE_ADAPTER_ID = "default-enterprise-business-engine";

export interface DefaultBusinessEngineAdapterOptions {
  healthy?: boolean;
}

export class DefaultBusinessEngineAdapter implements BusinessEnginePort {
  readonly providerId = DEFAULT_BUSINESS_ENGINE_ADAPTER_ID;

  private readonly catalog = new BusinessRuleCatalog(new InMemoryBusinessRuleCatalogStore());
  private readonly healthy: boolean;

  constructor(options: DefaultBusinessEngineAdapterOptions = {}) {
    this.healthy = options.healthy ?? true;
  }

  identity(): BusinessEngineInfo {
    return {
      id: DEFAULT_BUSINESS_ENGINE_ADAPTER_ID,
      name: "Enterprise Business Engine",
      version: "1.0.0",
      vendor: "enterprise",
      provider: "default",
    };
  }

  getCapabilities(): BusinessEngineCapabilities {
    return { ...E01_BUSINESS_ENGINE_CAPABILITIES };
  }

  async health(): Promise<BusinessEngineHealth> {
    const ok = this.healthy;
    return {
      ok,
      businessEngineOk: ok,
      businessRuleCatalogOk: ok,
    };
  }

  async registerRule(input: RegisterBusinessRuleInput): Promise<RegisterBusinessRuleResult> {
    const result = this.catalog.register(input.rule);
    return {
      ok: result.ok,
      code: result.code,
      message: result.message,
      ruleId: result.ruleId,
      rule: result.rule ?? null,
    };
  }

  async listRules(input: ListBusinessRulesInput = {}): Promise<ListBusinessRulesResult> {
    const rules = this.catalog.list(input.tag, input.limit, input.offset);
    const total = this.catalog.stats().totalRules;
    return {
      ok: true,
      code: "BUSINESS_RULE_CATALOG_LIST_OK",
      message: "rules listed",
      rules,
      total,
    };
  }

  async findRule(input: FindBusinessRuleInput): Promise<FindBusinessRuleResult> {
    return this.catalog.find(input.ruleId);
  }

  async getCatalogStats(
    _input?: GetBusinessRuleCatalogStatsInput,
  ): Promise<GetBusinessRuleCatalogStatsResult> {
    return {
      ok: true,
      code: "BUSINESS_RULE_CATALOG_STATS_OK",
      message: "stats retrieved",
      stats: this.catalog.stats(),
    };
  }
}

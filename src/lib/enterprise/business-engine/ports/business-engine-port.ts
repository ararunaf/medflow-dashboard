/**
 * BusinessEnginePort — contrato único da Enterprise Business Engine.
 *
 * E-01: Business Rule Catalog (`businessRuleCatalogImplemented = true`).
 * Demais capabilities permanecem false.
 */
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
} from "./types";

export interface BusinessEnginePort {
  readonly providerId: string;

  /** Identidade canônica do Port. */
  identity(): BusinessEngineInfo;

  /** Capabilities atuais. */
  getCapabilities(): BusinessEngineCapabilities;

  /** Health do runtime. */
  health(): Promise<BusinessEngineHealth>;

  /** E-01 — registra uma regra no catálogo. */
  registerRule(input: RegisterBusinessRuleInput): Promise<RegisterBusinessRuleResult>;

  /** E-01 — lista regras do catálogo. */
  listRules(input?: ListBusinessRulesInput): Promise<ListBusinessRulesResult>;

  /** E-01 — encontra regra por ruleId. */
  findRule(input: FindBusinessRuleInput): Promise<FindBusinessRuleResult>;

  /** E-01 — estatísticas do catálogo. */
  getCatalogStats(
    input?: GetBusinessRuleCatalogStatsInput,
  ): Promise<GetBusinessRuleCatalogStatsResult>;
}

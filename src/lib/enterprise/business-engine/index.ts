/**
 * Enterprise Business Engine — BLOCO E.
 *
 * E-01: Business Rule Catalog.
 */
export type {
  BusinessEngineCapabilities,
  BusinessEngineHealth,
  BusinessEngineInfo,
  BusinessEnginePort,
  BusinessEngineProviderId,
  CanonicalBusinessRule,
  CanonicalBusinessRuleAction,
  CanonicalBusinessRuleCatalogHealth,
  CanonicalBusinessRuleCatalogResult,
  CanonicalBusinessRuleCatalogStats,
  CanonicalBusinessRuleCondition,
  FindBusinessRuleInput,
  FindBusinessRuleResult,
  GetBusinessRuleCatalogStatsInput,
  GetBusinessRuleCatalogStatsResult,
  ListBusinessRulesInput,
  ListBusinessRulesResult,
  RegisterBusinessRuleInput,
  RegisterBusinessRuleResult,
} from "./ports";
export { DEFAULT_BUSINESS_ENGINE_CAPABILITIES, E01_BUSINESS_ENGINE_CAPABILITIES } from "./ports";
export { DefaultBusinessEngineAdapter, MockBusinessEngineAdapter } from "./adapters";
export { BusinessRuleCatalog, InMemoryBusinessRuleCatalogStore } from "./business-rule-catalog";
export { createBusinessEnginePort } from "./providers/create-business-engine-port";
export { businessEngineRegistry } from "./registry/business-engine-registry";

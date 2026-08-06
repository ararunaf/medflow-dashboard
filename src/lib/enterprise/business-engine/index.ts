/**
 * Enterprise Business Engine — BLOCO E.
 *
 * E-01: Business Rule Catalog.
 * E-02: Business Rule Execution.
 * E-03: Business Transaction.
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
  CanonicalBusinessRuleExecutionResult,
  CanonicalBusinessTransactionResult,
  CanonicalBusinessTransactionStep,
  ExecuteBusinessRuleInput,
  ExecuteBusinessRuleResult,
  ExecuteBusinessTransactionInput,
  ExecuteBusinessTransactionResult,
  FindBusinessRuleInput,
  FindBusinessRuleResult,
  GetBusinessRuleCatalogStatsInput,
  GetBusinessRuleCatalogStatsResult,
  ListBusinessRulesInput,
  ListBusinessRulesResult,
  RegisterBusinessRuleInput,
  RegisterBusinessRuleResult,
} from "./ports";
export {
  DEFAULT_BUSINESS_ENGINE_CAPABILITIES,
  E01_BUSINESS_ENGINE_CAPABILITIES,
  E02_BUSINESS_ENGINE_CAPABILITIES,
  E03_BUSINESS_ENGINE_CAPABILITIES,
} from "./ports";
export { DefaultBusinessEngineAdapter, MockBusinessEngineAdapter } from "./adapters";
export { BusinessRuleCatalog, InMemoryBusinessRuleCatalogStore } from "./business-rule-catalog";
export { BusinessRuleExecutionEngine } from "./business-rule-execution";
export { BusinessTransactionEngine } from "./business-transaction";
export { createBusinessEnginePort } from "./providers/create-business-engine-port";
export { businessEngineRegistry } from "./registry/business-engine-registry";

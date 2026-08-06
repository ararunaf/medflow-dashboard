/**
 * Enterprise Business Engine — BLOCO E.
 *
 * E-01: Business Rule Catalog.
 * E-02: Business Rule Execution.
 * E-03: Business Transaction.
 * E-04: Business Workflow.
 * E-05: Business Process Orchestration.
 */
export type {
  BusinessEngineCapabilities,
  BusinessEngineHealth,
  BusinessEngineInfo,
  BusinessEnginePort,
  BusinessEngineProviderId,
  CanonicalBusinessProcess,
  CanonicalBusinessProcessOrchestrationResult,
  CanonicalBusinessRule,
  CanonicalBusinessRuleAction,
  CanonicalBusinessRuleCatalogHealth,
  CanonicalBusinessRuleCatalogResult,
  CanonicalBusinessRuleCatalogStats,
  CanonicalBusinessRuleCondition,
  CanonicalBusinessRuleExecutionResult,
  CanonicalBusinessTransactionResult,
  CanonicalBusinessTransactionStep,
  CanonicalBusinessWorkflowResult,
  CanonicalBusinessWorkflowStage,
  ExecuteBusinessProcessOrchestrationInput,
  ExecuteBusinessProcessOrchestrationResult,
  ExecuteBusinessRuleInput,
  ExecuteBusinessRuleResult,
  ExecuteBusinessTransactionInput,
  ExecuteBusinessTransactionResult,
  ExecuteBusinessWorkflowInput,
  ExecuteBusinessWorkflowResult,
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
  E04_BUSINESS_ENGINE_CAPABILITIES,
  E05_BUSINESS_ENGINE_CAPABILITIES,
} from "./ports";
export { DefaultBusinessEngineAdapter, MockBusinessEngineAdapter } from "./adapters";
export { BusinessRuleCatalog, InMemoryBusinessRuleCatalogStore } from "./business-rule-catalog";
export { BusinessRuleExecutionEngine } from "./business-rule-execution";
export { BusinessTransactionEngine } from "./business-transaction";
export { BusinessWorkflowEngine } from "./business-workflow";
export { BusinessProcessOrchestrationEngine } from "./business-process-orchestration";
export { createBusinessEnginePort } from "./providers/create-business-engine-port";
export { businessEngineRegistry } from "./registry/business-engine-registry";

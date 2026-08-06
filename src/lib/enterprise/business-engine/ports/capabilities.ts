/**
 * Capability matrix da Enterprise Business Engine — BLOCO E.
 *
 * Apenas `businessRuleCatalogImplemented` é ativada pela E-01.
 */

export interface BusinessEngineCapabilities {
  businessRuleCatalogImplemented: boolean;
  businessRuleExecutionImplemented: boolean;
  businessTransactionImplemented: boolean;
  businessWorkflowImplemented: boolean;
  businessProcessOrchestrationImplemented: boolean;
  businessDecisionTableImplemented: boolean;
  businessEventLogImplemented: boolean;
  businessAuditTrailImplemented: boolean;
  businessReportImplemented: boolean;
  businessEngineImplemented: boolean;
}

export const DEFAULT_BUSINESS_ENGINE_CAPABILITIES: BusinessEngineCapabilities = {
  businessRuleCatalogImplemented: false,
  businessRuleExecutionImplemented: false,
  businessTransactionImplemented: false,
  businessWorkflowImplemented: false,
  businessProcessOrchestrationImplemented: false,
  businessDecisionTableImplemented: false,
  businessEventLogImplemented: false,
  businessAuditTrailImplemented: false,
  businessReportImplemented: false,
  businessEngineImplemented: false,
};

export const E01_BUSINESS_ENGINE_CAPABILITIES: BusinessEngineCapabilities = {
  ...DEFAULT_BUSINESS_ENGINE_CAPABILITIES,
  businessRuleCatalogImplemented: true,
};

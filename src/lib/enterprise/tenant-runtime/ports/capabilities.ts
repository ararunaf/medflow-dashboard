/**
 * TenantRuntimeEngineCapabilities — capacidades declarativas (S3-02).
 *
 * Apenas declaração estrutural. Sem identidade real. Sem criptografia.
 * Sem assinatura digital. Sem cadeia de custódia. Sem Key Vault. Sem HSM.
 * Sem SIEM. Sem OpenTelemetry. Sem LGPD. Sem autenticação. Sem autorização.
 *
 * Todas as flags `*Implemented` são literalmente `false`.
 * Integrações estruturais de outros Ports declaradas como `false` — sem consumo funcional.
 */

import type { TenantCapabilities } from "./canonical";

export type TenantRuntimeEngineCapabilities = {
  supportsOpenJob?: boolean;
  supportsCloseJob?: boolean;
  supportsSubmitRequest?: boolean;
  supportsRegisterFinding?: boolean;
  supportsGetResult?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalTenant?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  usesAIOrchestrationRuntimePort?: boolean;
  usesValidationRuntimePort?: boolean;
  usesDocumentExtractionRuntimePort?: boolean;
  usesDocumentClassificationRuntimePort?: boolean;
  usesOCRRuntimePort?: boolean;
  usesIntelligentCaptureRuntimePort?: boolean;
  usesScannerRuntimePort?: boolean;
  usesWatchFolderRuntimePort?: boolean;
  usesUploadRuntimePort?: boolean;
  usesPersistentQueueRuntimePort?: boolean;
  usesWorkerRuntimePort?: boolean;
  usesSchedulerRuntimePort?: boolean;
  usesObservabilityRuntimePort?: boolean;
  usesScalabilityRuntimePort?: boolean;
  runtimeReady?: true;
  tenantEngineImplemented?: false;
  businessRulesImplemented?: false;
  tissTenantImplemented?: false;
  operatorTenantImplemented?: false;
  automaticTenantImplemented?: false;
  tenantSuggestionsImplemented?: false;
  tenantJustificationImplemented?: false;
  tenantScoreImplemented?: false;
  complianceImplemented?: false;
  automaticCorrectionImplemented?: false;
};

export function emptyTenantRuntimeEngineCapabilities(): TenantRuntimeEngineCapabilities {
  return {};
}

export function defineTenantRuntimeEngineCapabilities(
  capabilities: TenantRuntimeEngineCapabilities = {},
): TenantRuntimeEngineCapabilities {
  return { ...capabilities };
}

export const DEFAULT_TENANT_RUNTIME_ENGINE_CAPABILITIES: TenantRuntimeEngineCapabilities = {
  supportsOpenJob: true,
  supportsCloseJob: true,
  supportsSubmitRequest: true,
  supportsRegisterFinding: true,
  supportsGetResult: true,
  supportsStats: true,
  supportsHealth: true,
  supportsCanonicalTenant: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  usesAIOrchestrationRuntimePort: false,
  usesValidationRuntimePort: false,
  usesDocumentExtractionRuntimePort: false,
  usesDocumentClassificationRuntimePort: false,
  usesOCRRuntimePort: false,
  usesIntelligentCaptureRuntimePort: false,
  usesScannerRuntimePort: false,
  usesWatchFolderRuntimePort: false,
  usesUploadRuntimePort: false,
  usesPersistentQueueRuntimePort: false,
  usesWorkerRuntimePort: false,
  usesSchedulerRuntimePort: false,
  usesObservabilityRuntimePort: false,
  usesScalabilityRuntimePort: false,
  runtimeReady: true,
  tenantEngineImplemented: false,
  businessRulesImplemented: false,
  tissTenantImplemented: false,
  operatorTenantImplemented: false,
  automaticTenantImplemented: false,
  tenantSuggestionsImplemented: false,
  tenantJustificationImplemented: false,
  tenantScoreImplemented: false,
  complianceImplemented: false,
  automaticCorrectionImplemented: false,
};

export const DEFAULT_MOCK_TENANT_RUNTIME_ENGINE_CAPABILITIES: TenantRuntimeEngineCapabilities = {
  ...DEFAULT_TENANT_RUNTIME_ENGINE_CAPABILITIES,
};

export function toCanonicalTenantCapabilities(
  capabilities: TenantRuntimeEngineCapabilities = DEFAULT_TENANT_RUNTIME_ENGINE_CAPABILITIES,
): TenantCapabilities {
  return {
    kind: "canonical-tenant-capabilities",
    supportsOpenJob: capabilities.supportsOpenJob === true,
    supportsCloseJob: capabilities.supportsCloseJob === true,
    supportsSubmitRequest: capabilities.supportsSubmitRequest === true,
    supportsRegisterFinding: capabilities.supportsRegisterFinding === true,
    supportsGetResult: capabilities.supportsGetResult === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalTenant: capabilities.supportsCanonicalTenant === true,
    runtimeReady: true,
    tenantEngineImplemented: false,
    businessRulesImplemented: false,
    tissTenantImplemented: false,
    operatorTenantImplemented: false,
    automaticTenantImplemented: false,
    tenantSuggestionsImplemented: false,
    tenantJustificationImplemented: false,
    tenantScoreImplemented: false,
    complianceImplemented: false,
    automaticCorrectionImplemented: false,
  };
}

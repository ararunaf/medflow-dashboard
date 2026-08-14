/**
 * ComplianceRuntimeEngineCapabilities — capacidades declarativas (S3-02).
 *
 * Apenas declaração estrutural. Sem identidade real. Sem criptografia.
 * Sem assinatura digital. Sem cadeia de custódia. Sem Key Vault. Sem HSM.
 * Sem SIEM. Sem OpenTelemetry. Sem LGPD. Sem autenticação. Sem autorização.
 *
 * Todas as flags `*Implemented` são literalmente `false`.
 * Integrações estruturais de outros Ports declaradas como `false` — sem consumo funcional.
 */

import type { ComplianceCapabilities } from "./canonical";

export type ComplianceRuntimeEngineCapabilities = {
  supportsOpenJob?: boolean;
  supportsCloseJob?: boolean;
  supportsSubmitRequest?: boolean;
  supportsRegisterFinding?: boolean;
  supportsGetResult?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalCompliance?: boolean;
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
  complianceEngineImplemented?: false;
  lgpdImplemented?: false;
  privacyImplemented?: false;
  dataClassificationImplemented?: false;
  consentManagementImplemented?: false;
  auditComplianceImplemented?: false;
  retentionImplemented?: false;
  chainOfCustodyImplemented?: false;
  digitalSignatureImplemented?: false;
  encryptionImplemented?: false;
  hsmImplemented?: false;
  keyVaultImplemented?: false;
  siemImplemented?: false;
  openTelemetryImplemented?: false;
  businessRulesImplemented?: false;
  tissComplianceImplemented?: false;
  operatorComplianceImplemented?: false;
  automaticComplianceImplemented?: false;
  complianceSuggestionsImplemented?: false;
  complianceJustificationImplemented?: false;
  complianceScoreImplemented?: false;
  complianceImplemented?: false;
  automaticCorrectionImplemented?: false;
};

export function emptyComplianceRuntimeEngineCapabilities(): ComplianceRuntimeEngineCapabilities {
  return {};
}

export function defineComplianceRuntimeEngineCapabilities(
  capabilities: ComplianceRuntimeEngineCapabilities = {},
): ComplianceRuntimeEngineCapabilities {
  return { ...capabilities };
}

export const DEFAULT_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES: ComplianceRuntimeEngineCapabilities = {
  supportsOpenJob: true,
  supportsCloseJob: true,
  supportsSubmitRequest: true,
  supportsRegisterFinding: true,
  supportsGetResult: true,
  supportsStats: true,
  supportsHealth: true,
  supportsCanonicalCompliance: true,
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
  complianceEngineImplemented: false,
  lgpdImplemented: false,
  privacyImplemented: false,
  dataClassificationImplemented: false,
  consentManagementImplemented: false,
  auditComplianceImplemented: false,
  retentionImplemented: false,
  chainOfCustodyImplemented: false,
  digitalSignatureImplemented: false,
  encryptionImplemented: false,
  hsmImplemented: false,
  keyVaultImplemented: false,
  siemImplemented: false,
  openTelemetryImplemented: false,
  businessRulesImplemented: false,
  tissComplianceImplemented: false,
  operatorComplianceImplemented: false,
  automaticComplianceImplemented: false,
  complianceSuggestionsImplemented: false,
  complianceJustificationImplemented: false,
  complianceScoreImplemented: false,
  complianceImplemented: false,
  automaticCorrectionImplemented: false,
};

export const DEFAULT_MOCK_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES: ComplianceRuntimeEngineCapabilities =
  {
    ...DEFAULT_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES,
  };

export function toCanonicalComplianceCapabilities(
  capabilities: ComplianceRuntimeEngineCapabilities = DEFAULT_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES,
): ComplianceCapabilities {
  return {
    kind: "canonical-compliance-capabilities",
    supportsOpenJob: capabilities.supportsOpenJob === true,
    supportsCloseJob: capabilities.supportsCloseJob === true,
    supportsSubmitRequest: capabilities.supportsSubmitRequest === true,
    supportsRegisterFinding: capabilities.supportsRegisterFinding === true,
    supportsGetResult: capabilities.supportsGetResult === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalCompliance: capabilities.supportsCanonicalCompliance === true,
    runtimeReady: true,
    complianceEngineImplemented: false,
    lgpdImplemented: false,
    privacyImplemented: false,
    dataClassificationImplemented: false,
    consentManagementImplemented: false,
    auditComplianceImplemented: false,
    retentionImplemented: false,
    chainOfCustodyImplemented: false,
    digitalSignatureImplemented: false,
    encryptionImplemented: false,
    hsmImplemented: false,
    keyVaultImplemented: false,
    siemImplemented: false,
    openTelemetryImplemented: false,
    businessRulesImplemented: false,
    tissComplianceImplemented: false,
    operatorComplianceImplemented: false,
    automaticComplianceImplemented: false,
    complianceSuggestionsImplemented: false,
    complianceJustificationImplemented: false,
    complianceScoreImplemented: false,
    complianceImplemented: false,
    automaticCorrectionImplemented: false,
  };
}

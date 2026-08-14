/**
 * GovernanceRuntimeEngineCapabilities — capacidades declarativas (S6-02).
 *
 * Apenas declaração estrutural. Sem identidade real. Sem criptografia.
 * Sem assinatura digital. Sem cadeia de custódia. Sem Key Vault. Sem HSM.
 * Sem SIEM. Sem OpenTelemetry. Sem LGPD. Sem autenticação. Sem autorização.
 *
 * Todas as flags `*Implemented` são literalmente `false`.
 * Integrações estruturais de outros Ports declaradas como `false` — sem consumo funcional.
 */

import type { GovernanceCapabilities } from "./canonical";

export type GovernanceRuntimeEngineCapabilities = {
  supportsOpenJob?: boolean;
  supportsCloseJob?: boolean;
  supportsSubmitRequest?: boolean;
  supportsRegisterFinding?: boolean;
  supportsGetResult?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalGovernance?: boolean;
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
  governanceEngineImplemented?: false;
  lgpdImplemented?: false;
  privacyImplemented?: false;
  dataClassificationImplemented?: false;
  consentManagementImplemented?: false;
  auditGovernanceImplemented?: false;
  retentionImplemented?: false;
  chainOfCustodyImplemented?: false;
  digitalSignatureImplemented?: false;
  encryptionImplemented?: false;
  hsmImplemented?: false;
  keyVaultImplemented?: false;
  siemImplemented?: false;
  openTelemetryImplemented?: false;
  businessRulesImplemented?: false;
  tissGovernanceImplemented?: false;
  operatorGovernanceImplemented?: false;
  automaticGovernanceImplemented?: false;
  governanceSuggestionsImplemented?: false;
  governanceJustificationImplemented?: false;
  governanceScoreImplemented?: false;
  governanceImplemented?: false;
  automaticCorrectionImplemented?: false;
};

export function emptyGovernanceRuntimeEngineCapabilities(): GovernanceRuntimeEngineCapabilities {
  return {};
}

export function defineGovernanceRuntimeEngineCapabilities(
  capabilities: GovernanceRuntimeEngineCapabilities = {},
): GovernanceRuntimeEngineCapabilities {
  return { ...capabilities };
}

export const DEFAULT_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES: GovernanceRuntimeEngineCapabilities = {
  supportsOpenJob: true,
  supportsCloseJob: true,
  supportsSubmitRequest: true,
  supportsRegisterFinding: true,
  supportsGetResult: true,
  supportsStats: true,
  supportsHealth: true,
  supportsCanonicalGovernance: true,
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
  governanceEngineImplemented: false,
  lgpdImplemented: false,
  privacyImplemented: false,
  dataClassificationImplemented: false,
  consentManagementImplemented: false,
  auditGovernanceImplemented: false,
  retentionImplemented: false,
  chainOfCustodyImplemented: false,
  digitalSignatureImplemented: false,
  encryptionImplemented: false,
  hsmImplemented: false,
  keyVaultImplemented: false,
  siemImplemented: false,
  openTelemetryImplemented: false,
  businessRulesImplemented: false,
  tissGovernanceImplemented: false,
  operatorGovernanceImplemented: false,
  automaticGovernanceImplemented: false,
  governanceSuggestionsImplemented: false,
  governanceJustificationImplemented: false,
  governanceScoreImplemented: false,
  governanceImplemented: false,
  automaticCorrectionImplemented: false,
};

export const DEFAULT_MOCK_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES: GovernanceRuntimeEngineCapabilities =
  {
    ...DEFAULT_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES,
  };

export function toCanonicalGovernanceCapabilities(
  capabilities: GovernanceRuntimeEngineCapabilities = DEFAULT_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES,
): GovernanceCapabilities {
  return {
    kind: "canonical-governance-capabilities",
    supportsOpenJob: capabilities.supportsOpenJob === true,
    supportsCloseJob: capabilities.supportsCloseJob === true,
    supportsSubmitRequest: capabilities.supportsSubmitRequest === true,
    supportsRegisterFinding: capabilities.supportsRegisterFinding === true,
    supportsGetResult: capabilities.supportsGetResult === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalGovernance: capabilities.supportsCanonicalGovernance === true,
    runtimeReady: true,
    governanceEngineImplemented: false,
    lgpdImplemented: false,
    privacyImplemented: false,
    dataClassificationImplemented: false,
    consentManagementImplemented: false,
    auditGovernanceImplemented: false,
    retentionImplemented: false,
    chainOfCustodyImplemented: false,
    digitalSignatureImplemented: false,
    encryptionImplemented: false,
    hsmImplemented: false,
    keyVaultImplemented: false,
    siemImplemented: false,
    openTelemetryImplemented: false,
    businessRulesImplemented: false,
    tissGovernanceImplemented: false,
    operatorGovernanceImplemented: false,
    automaticGovernanceImplemented: false,
    governanceSuggestionsImplemented: false,
    governanceJustificationImplemented: false,
    governanceScoreImplemented: false,
    governanceImplemented: false,
    automaticCorrectionImplemented: false,
  };
}

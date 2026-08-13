/**
 * IdentityRuntimeEngineCapabilities — capacidades declarativas (S2-02).
 *
 * Apenas declaração estrutural. Sem identidade real. Sem criptografia.
 * Sem assinatura digital. Sem cadeia de custódia. Sem Key Vault. Sem HSM.
 * Sem SIEM. Sem OpenTelemetry. Sem LGPD. Sem autenticação. Sem autorização.
 *
 * Todas as flags `*Implemented` são literalmente `false`.
 * Integrações estruturais de outros Ports declaradas como `false` — sem consumo funcional.
 */

import type { IdentityCapabilities } from "./canonical";

export type IdentityRuntimeEngineCapabilities = {
  supportsOpenJob?: boolean;
  supportsCloseJob?: boolean;
  supportsSubmitRequest?: boolean;
  supportsRegisterFinding?: boolean;
  supportsGetResult?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalIdentity?: boolean;
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
  identityEngineImplemented?: false;
  businessRulesImplemented?: false;
  tissIdentityImplemented?: false;
  operatorIdentityImplemented?: false;
  automaticIdentityImplemented?: false;
  identitySuggestionsImplemented?: false;
  identityJustificationImplemented?: false;
  identityScoreImplemented?: false;
  complianceImplemented?: false;
  automaticCorrectionImplemented?: false;
};

export function emptyIdentityRuntimeEngineCapabilities(): IdentityRuntimeEngineCapabilities {
  return {};
}

export function defineIdentityRuntimeEngineCapabilities(
  capabilities: IdentityRuntimeEngineCapabilities = {},
): IdentityRuntimeEngineCapabilities {
  return { ...capabilities };
}

export const DEFAULT_IDENTITY_RUNTIME_ENGINE_CAPABILITIES: IdentityRuntimeEngineCapabilities = {
  supportsOpenJob: true,
  supportsCloseJob: true,
  supportsSubmitRequest: true,
  supportsRegisterFinding: true,
  supportsGetResult: true,
  supportsStats: true,
  supportsHealth: true,
  supportsCanonicalIdentity: true,
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
  identityEngineImplemented: false,
  businessRulesImplemented: false,
  tissIdentityImplemented: false,
  operatorIdentityImplemented: false,
  automaticIdentityImplemented: false,
  identitySuggestionsImplemented: false,
  identityJustificationImplemented: false,
  identityScoreImplemented: false,
  complianceImplemented: false,
  automaticCorrectionImplemented: false,
};

export const DEFAULT_MOCK_IDENTITY_RUNTIME_ENGINE_CAPABILITIES: IdentityRuntimeEngineCapabilities =
  {
    ...DEFAULT_IDENTITY_RUNTIME_ENGINE_CAPABILITIES,
  };

export function toCanonicalIdentityCapabilities(
  capabilities: IdentityRuntimeEngineCapabilities = DEFAULT_IDENTITY_RUNTIME_ENGINE_CAPABILITIES,
): IdentityCapabilities {
  return {
    kind: "canonical-identity-capabilities",
    supportsOpenJob: capabilities.supportsOpenJob === true,
    supportsCloseJob: capabilities.supportsCloseJob === true,
    supportsSubmitRequest: capabilities.supportsSubmitRequest === true,
    supportsRegisterFinding: capabilities.supportsRegisterFinding === true,
    supportsGetResult: capabilities.supportsGetResult === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalIdentity: capabilities.supportsCanonicalIdentity === true,
    runtimeReady: true,
    identityEngineImplemented: false,
    businessRulesImplemented: false,
    tissIdentityImplemented: false,
    operatorIdentityImplemented: false,
    automaticIdentityImplemented: false,
    identitySuggestionsImplemented: false,
    identityJustificationImplemented: false,
    identityScoreImplemented: false,
    complianceImplemented: false,
    automaticCorrectionImplemented: false,
  };
}

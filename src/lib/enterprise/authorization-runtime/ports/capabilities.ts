/**
 * AuthorizationRuntimeEngineCapabilities — capacidades declarativas (S3-02).
 *
 * Apenas declaração estrutural. Sem identidade real. Sem criptografia.
 * Sem assinatura digital. Sem cadeia de custódia. Sem Key Vault. Sem HSM.
 * Sem SIEM. Sem OpenTelemetry. Sem LGPD. Sem autenticação. Sem autorização.
 *
 * Todas as flags `*Implemented` são literalmente `false`.
 * Integrações estruturais de outros Ports declaradas como `false` — sem consumo funcional.
 */

import type { AuthorizationCapabilities } from "./canonical";

export type AuthorizationRuntimeEngineCapabilities = {
  supportsOpenJob?: boolean;
  supportsCloseJob?: boolean;
  supportsSubmitRequest?: boolean;
  supportsRegisterFinding?: boolean;
  supportsGetResult?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalAuthorization?: boolean;
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
  authorizationEngineImplemented?: false;
  businessRulesImplemented?: false;
  tissAuthorizationImplemented?: false;
  operatorAuthorizationImplemented?: false;
  automaticAuthorizationImplemented?: false;
  authorizationSuggestionsImplemented?: false;
  authorizationJustificationImplemented?: false;
  authorizationScoreImplemented?: false;
  complianceImplemented?: false;
  automaticCorrectionImplemented?: false;
};

export function emptyAuthorizationRuntimeEngineCapabilities(): AuthorizationRuntimeEngineCapabilities {
  return {};
}

export function defineAuthorizationRuntimeEngineCapabilities(
  capabilities: AuthorizationRuntimeEngineCapabilities = {},
): AuthorizationRuntimeEngineCapabilities {
  return { ...capabilities };
}

export const DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES: AuthorizationRuntimeEngineCapabilities =
  {
    supportsOpenJob: true,
    supportsCloseJob: true,
    supportsSubmitRequest: true,
    supportsRegisterFinding: true,
    supportsGetResult: true,
    supportsStats: true,
    supportsHealth: true,
    supportsCanonicalAuthorization: true,
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
    authorizationEngineImplemented: false,
    businessRulesImplemented: false,
    tissAuthorizationImplemented: false,
    operatorAuthorizationImplemented: false,
    automaticAuthorizationImplemented: false,
    authorizationSuggestionsImplemented: false,
    authorizationJustificationImplemented: false,
    authorizationScoreImplemented: false,
    complianceImplemented: false,
    automaticCorrectionImplemented: false,
  };

export const DEFAULT_MOCK_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES: AuthorizationRuntimeEngineCapabilities =
  {
    ...DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES,
  };

export function toCanonicalAuthorizationCapabilities(
  capabilities: AuthorizationRuntimeEngineCapabilities = DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES,
): AuthorizationCapabilities {
  return {
    kind: "canonical-authorization-capabilities",
    supportsOpenJob: capabilities.supportsOpenJob === true,
    supportsCloseJob: capabilities.supportsCloseJob === true,
    supportsSubmitRequest: capabilities.supportsSubmitRequest === true,
    supportsRegisterFinding: capabilities.supportsRegisterFinding === true,
    supportsGetResult: capabilities.supportsGetResult === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalAuthorization: capabilities.supportsCanonicalAuthorization === true,
    runtimeReady: true,
    authorizationEngineImplemented: false,
    businessRulesImplemented: false,
    tissAuthorizationImplemented: false,
    operatorAuthorizationImplemented: false,
    automaticAuthorizationImplemented: false,
    authorizationSuggestionsImplemented: false,
    authorizationJustificationImplemented: false,
    authorizationScoreImplemented: false,
    complianceImplemented: false,
    automaticCorrectionImplemented: false,
  };
}

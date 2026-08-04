/**
 * AuditRuntimeEngineCapabilities — capacidades declarativas (F3-CAP-10).
 *
 * Apenas declaração estrutural. Sem auditoria real. Sem IA. Sem OpenAI /
 * Azure OpenAI / Gemini / Claude. Sem ML. Sem regras TISS. Sem regras de
 * operadoras. Sem justificativas/correções/aprovação/rejeição automáticas.
 * Integrações estruturais (AIOrchestration/Validation/DocumentExtraction/
 * DocumentClassification/OCR/ICR/Scanner/WatchFolder/Upload/PQR/Worker/
 * Scheduler/Observability/Scalability) declaradas como preparadas —
 * sem consumo funcional.
 */

import type { AuditCapabilities } from "./canonical";

export type AuditRuntimeEngineCapabilities = {
  supportsOpenJob?: boolean;
  supportsCloseJob?: boolean;
  supportsSubmitRequest?: boolean;
  supportsRegisterFinding?: boolean;
  supportsGetResult?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalAudit?: boolean;
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
  auditEngineImplemented?: false;
  businessRulesImplemented?: false;
  tissAuditImplemented?: false;
  operatorAuditImplemented?: false;
  automaticAuditImplemented?: false;
  auditSuggestionsImplemented?: false;
  auditJustificationImplemented?: false;
  auditScoreImplemented?: false;
  complianceImplemented?: false;
  automaticCorrectionImplemented?: false;
};

export function emptyAuditRuntimeEngineCapabilities(): AuditRuntimeEngineCapabilities {
  return {};
}

export function defineAuditRuntimeEngineCapabilities(
  capabilities: AuditRuntimeEngineCapabilities = {},
): AuditRuntimeEngineCapabilities {
  return { ...capabilities };
}

export const DEFAULT_AUDIT_RUNTIME_ENGINE_CAPABILITIES: AuditRuntimeEngineCapabilities = {
  supportsOpenJob: true,
  supportsCloseJob: true,
  supportsSubmitRequest: true,
  supportsRegisterFinding: true,
  supportsGetResult: true,
  supportsStats: true,
  supportsHealth: true,
  supportsCanonicalAudit: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  usesAIOrchestrationRuntimePort: true,
  usesValidationRuntimePort: true,
  usesDocumentExtractionRuntimePort: true,
  usesDocumentClassificationRuntimePort: true,
  usesOCRRuntimePort: true,
  usesIntelligentCaptureRuntimePort: true,
  usesScannerRuntimePort: true,
  usesWatchFolderRuntimePort: true,
  usesUploadRuntimePort: true,
  usesPersistentQueueRuntimePort: true,
  usesWorkerRuntimePort: true,
  usesSchedulerRuntimePort: true,
  usesObservabilityRuntimePort: true,
  usesScalabilityRuntimePort: true,
  runtimeReady: true,
  auditEngineImplemented: false,
  businessRulesImplemented: false,
  tissAuditImplemented: false,
  operatorAuditImplemented: false,
  automaticAuditImplemented: false,
  auditSuggestionsImplemented: false,
  auditJustificationImplemented: false,
  auditScoreImplemented: false,
  complianceImplemented: false,
  automaticCorrectionImplemented: false,
};

export const DEFAULT_MOCK_AUDIT_RUNTIME_ENGINE_CAPABILITIES: AuditRuntimeEngineCapabilities = {
  ...DEFAULT_AUDIT_RUNTIME_ENGINE_CAPABILITIES,
};

export function toCanonicalAuditCapabilities(
  capabilities: AuditRuntimeEngineCapabilities = DEFAULT_AUDIT_RUNTIME_ENGINE_CAPABILITIES,
): AuditCapabilities {
  return {
    kind: "canonical-audit-capabilities",
    supportsOpenJob: capabilities.supportsOpenJob === true,
    supportsCloseJob: capabilities.supportsCloseJob === true,
    supportsSubmitRequest: capabilities.supportsSubmitRequest === true,
    supportsRegisterFinding: capabilities.supportsRegisterFinding === true,
    supportsGetResult: capabilities.supportsGetResult === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalAudit: capabilities.supportsCanonicalAudit === true,
    runtimeReady: true,
    auditEngineImplemented: false,
    businessRulesImplemented: false,
    tissAuditImplemented: false,
    operatorAuditImplemented: false,
    automaticAuditImplemented: false,
    auditSuggestionsImplemented: false,
    auditJustificationImplemented: false,
    auditScoreImplemented: false,
    complianceImplemented: false,
    automaticCorrectionImplemented: false,
  };
}

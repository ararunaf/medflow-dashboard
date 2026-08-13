/**
 * CompletedRuntimeEngineCapabilities — capacidades declarativas (A10-02).
 *
 * Apenas declaração estrutural. Sem completedoria real. Sem IA. Sem OpenAI /
 * Azure OpenAI / Gemini / Claude. Sem ML. Sem regras TISS. Sem regras de
 * operadoras. Sem justificativas/correções/aprovação/rejeição automáticas.
 * Integrações estruturais (AIOrchestration/Validation/DocumentExtraction/
 * DocumentClassification/OCR/ICR/Scanner/WatchFolder/Upload/PQR/Worker/
 * Scheduler/Observability/Scalability) declaradas como preparadas —
 * sem consumo funcional.
 */

import type { CompletedCapabilities } from "./canonical";

export type CompletedRuntimeEngineCapabilities = {
  supportsOpenJob?: boolean;
  supportsCloseJob?: boolean;
  supportsSubmitRequest?: boolean;
  supportsRegisterFinding?: boolean;
  supportsGetResult?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalCompleted?: boolean;
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
  completedEngineImplemented?: false;
  businessRulesImplemented?: false;
  tissCompletedImplemented?: false;
  operatorCompletedImplemented?: false;
  automaticCompletedImplemented?: false;
  completedSuggestionsImplemented?: false;
  completedJustificationImplemented?: false;
  completedScoreImplemented?: false;
  complianceImplemented?: false;
  automaticCorrectionImplemented?: false;
};

export function emptyCompletedRuntimeEngineCapabilities(): CompletedRuntimeEngineCapabilities {
  return {};
}

export function defineCompletedRuntimeEngineCapabilities(
  capabilities: CompletedRuntimeEngineCapabilities = {},
): CompletedRuntimeEngineCapabilities {
  return { ...capabilities };
}

export const DEFAULT_COMPLETED_RUNTIME_ENGINE_CAPABILITIES: CompletedRuntimeEngineCapabilities = {
  supportsOpenJob: true,
  supportsCloseJob: true,
  supportsSubmitRequest: true,
  supportsRegisterFinding: true,
  supportsGetResult: true,
  supportsStats: true,
  supportsHealth: true,
  supportsCanonicalCompleted: true,
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
  completedEngineImplemented: false,
  businessRulesImplemented: false,
  tissCompletedImplemented: false,
  operatorCompletedImplemented: false,
  automaticCompletedImplemented: false,
  completedSuggestionsImplemented: false,
  completedJustificationImplemented: false,
  completedScoreImplemented: false,
  complianceImplemented: false,
  automaticCorrectionImplemented: false,
};

export const DEFAULT_MOCK_COMPLETED_RUNTIME_ENGINE_CAPABILITIES: CompletedRuntimeEngineCapabilities =
  {
    ...DEFAULT_COMPLETED_RUNTIME_ENGINE_CAPABILITIES,
  };

export function toCanonicalCompletedCapabilities(
  capabilities: CompletedRuntimeEngineCapabilities = DEFAULT_COMPLETED_RUNTIME_ENGINE_CAPABILITIES,
): CompletedCapabilities {
  return {
    kind: "canonical-completed-capabilities",
    supportsOpenJob: capabilities.supportsOpenJob === true,
    supportsCloseJob: capabilities.supportsCloseJob === true,
    supportsSubmitRequest: capabilities.supportsSubmitRequest === true,
    supportsRegisterFinding: capabilities.supportsRegisterFinding === true,
    supportsGetResult: capabilities.supportsGetResult === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalCompleted: capabilities.supportsCanonicalCompleted === true,
    runtimeReady: true,
    completedEngineImplemented: false,
    businessRulesImplemented: false,
    tissCompletedImplemented: false,
    operatorCompletedImplemented: false,
    automaticCompletedImplemented: false,
    completedSuggestionsImplemented: false,
    completedJustificationImplemented: false,
    completedScoreImplemented: false,
    complianceImplemented: false,
    automaticCorrectionImplemented: false,
  };
}

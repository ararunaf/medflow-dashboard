/**
 * ValidationRuntimeEngineCapabilities — capacidades declarativas (F3-CAP-08).
 *
 * Apenas declaração estrutural. Sem validação real. Sem auditoria. Sem IA.
 * Sem ML. Sem LLM. Sem correção automática. Sem regras TISS/operadoras.
 * Integrações estruturais (DocumentExtraction/DocumentClassification/OCR/ICR/
 * Scanner/WatchFolder/Upload/PQR/Worker/Scheduler/Observability/Scalability)
 * declaradas como preparadas — sem consumo funcional.
 */

import type { ValidationCapabilities } from "./canonical";

export type ValidationRuntimeEngineCapabilities = {
  supportsOpenJob?: boolean;
  supportsCloseJob?: boolean;
  supportsSubmitRequest?: boolean;
  supportsRegisterDocument?: boolean;
  supportsGetResult?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalValidation?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
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
  fieldValidationImplemented?: false;
  documentValidationImplemented?: false;
  templateValidationImplemented?: false;
  operatorValidationImplemented?: false;
  tissValidationImplemented?: false;
  confidenceValidationImplemented?: false;
  qualityValidationImplemented?: false;
  mandatoryFieldValidationImplemented?: false;
  crossFieldValidationImplemented?: false;
  businessRuleValidationImplemented?: false;
  automaticApprovalImplemented?: false;
  automaticRejectionImplemented?: false;
};

export function emptyValidationRuntimeEngineCapabilities(): ValidationRuntimeEngineCapabilities {
  return {};
}

export function defineValidationRuntimeEngineCapabilities(
  capabilities: ValidationRuntimeEngineCapabilities = {},
): ValidationRuntimeEngineCapabilities {
  return { ...capabilities };
}

export const DEFAULT_VALIDATION_RUNTIME_ENGINE_CAPABILITIES: ValidationRuntimeEngineCapabilities = {
  supportsOpenJob: true,
  supportsCloseJob: true,
  supportsSubmitRequest: true,
  supportsRegisterDocument: true,
  supportsGetResult: true,
  supportsStats: true,
  supportsHealth: true,
  supportsCanonicalValidation: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
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
  fieldValidationImplemented: false,
  documentValidationImplemented: false,
  templateValidationImplemented: false,
  operatorValidationImplemented: false,
  tissValidationImplemented: false,
  confidenceValidationImplemented: false,
  qualityValidationImplemented: false,
  mandatoryFieldValidationImplemented: false,
  crossFieldValidationImplemented: false,
  businessRuleValidationImplemented: false,
  automaticApprovalImplemented: false,
  automaticRejectionImplemented: false,
};

export const DEFAULT_MOCK_VALIDATION_RUNTIME_ENGINE_CAPABILITIES: ValidationRuntimeEngineCapabilities =
  {
    ...DEFAULT_VALIDATION_RUNTIME_ENGINE_CAPABILITIES,
  };

export function toCanonicalValidationCapabilities(
  capabilities: ValidationRuntimeEngineCapabilities = DEFAULT_VALIDATION_RUNTIME_ENGINE_CAPABILITIES,
): ValidationCapabilities {
  return {
    kind: "canonical-validation-capabilities",
    supportsOpenJob: capabilities.supportsOpenJob === true,
    supportsCloseJob: capabilities.supportsCloseJob === true,
    supportsSubmitRequest: capabilities.supportsSubmitRequest === true,
    supportsRegisterDocument: capabilities.supportsRegisterDocument === true,
    supportsGetResult: capabilities.supportsGetResult === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalValidation: capabilities.supportsCanonicalValidation === true,
    runtimeReady: true,
    fieldValidationImplemented: false,
    documentValidationImplemented: false,
    templateValidationImplemented: false,
    operatorValidationImplemented: false,
    tissValidationImplemented: false,
    confidenceValidationImplemented: false,
    qualityValidationImplemented: false,
    mandatoryFieldValidationImplemented: false,
    crossFieldValidationImplemented: false,
    businessRuleValidationImplemented: false,
    automaticApprovalImplemented: false,
    automaticRejectionImplemented: false,
  };
}

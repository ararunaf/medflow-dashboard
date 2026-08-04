/**
 * AutoFillRuntimeEngineCapabilities — capacidades declarativas (F3-CAP-12).
 *
 * Apenas declaração estrutural. Sem preenchimento automático. Sem geração de
 * XML. Sem escrita em guias. Sem integração com operadoras. Sem IA.
 * Integrações estruturais (TISSMapping/Audit/Validation/DocumentExtraction/
 * DocumentClassification/OCR/AIOrchestration/IntelligentCapture/Scanner/
 * WatchFolder/Upload) declaradas como preparadas — sem consumo funcional.
 */

import type { AutoFillCapabilities } from "./canonical";

export type AutoFillRuntimeEngineCapabilities = {
  supportsPrepareAutoFill?: boolean;
  supportsGetResult?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalAutoFill?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
  usesTISSMappingRuntimePort?: boolean;
  usesAuditRuntimePort?: boolean;
  usesValidationRuntimePort?: boolean;
  usesDocumentExtractionRuntimePort?: boolean;
  usesDocumentClassificationRuntimePort?: boolean;
  usesOCRRuntimePort?: boolean;
  usesAIOrchestrationRuntimePort?: boolean;
  usesIntelligentCaptureRuntimePort?: boolean;
  usesScannerRuntimePort?: boolean;
  usesWatchFolderRuntimePort?: boolean;
  usesUploadRuntimePort?: boolean;
  runtimeReady?: true;
  autoFillEngineImplemented?: false;
  guideGenerationImplemented?: false;
  fieldPopulationImplemented?: false;
  templatePopulationImplemented?: false;
  operatorPopulationImplemented?: false;
  xmlPopulationImplemented?: false;
  validationIntegrationImplemented?: false;
  auditIntegrationImplemented?: false;
  qualityIntegrationImplemented?: false;
  automaticCompletionImplemented?: false;
};

export function emptyAutoFillRuntimeEngineCapabilities(): AutoFillRuntimeEngineCapabilities {
  return {};
}

export function defineAutoFillRuntimeEngineCapabilities(
  capabilities: AutoFillRuntimeEngineCapabilities = {},
): AutoFillRuntimeEngineCapabilities {
  return { ...capabilities };
}

export const DEFAULT_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES: AutoFillRuntimeEngineCapabilities = {
  supportsPrepareAutoFill: true,
  supportsGetResult: true,
  supportsStats: true,
  supportsHealth: true,
  supportsCanonicalAutoFill: true,
  supportsTimeout: true,
  supportsRetry: true,
  supportsCancellation: true,
  supportsTelemetry: true,
  usesTISSMappingRuntimePort: true,
  usesAuditRuntimePort: true,
  usesValidationRuntimePort: true,
  usesDocumentExtractionRuntimePort: true,
  usesDocumentClassificationRuntimePort: true,
  usesOCRRuntimePort: true,
  usesAIOrchestrationRuntimePort: true,
  usesIntelligentCaptureRuntimePort: true,
  usesScannerRuntimePort: true,
  usesWatchFolderRuntimePort: true,
  usesUploadRuntimePort: true,
  runtimeReady: true,
  autoFillEngineImplemented: false,
  guideGenerationImplemented: false,
  fieldPopulationImplemented: false,
  templatePopulationImplemented: false,
  operatorPopulationImplemented: false,
  xmlPopulationImplemented: false,
  validationIntegrationImplemented: false,
  auditIntegrationImplemented: false,
  qualityIntegrationImplemented: false,
  automaticCompletionImplemented: false,
};

export const DEFAULT_MOCK_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES: AutoFillRuntimeEngineCapabilities =
  {
    ...DEFAULT_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES,
  };

export function toAutoFillCapabilities(
  capabilities: AutoFillRuntimeEngineCapabilities = DEFAULT_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES,
): AutoFillCapabilities {
  return {
    kind: "canonical-auto-fill-capabilities",
    supportsPrepareAutoFill: capabilities.supportsPrepareAutoFill === true,
    supportsGetResult: capabilities.supportsGetResult === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalAutoFill: capabilities.supportsCanonicalAutoFill === true,
    runtimeReady: true,
    autoFillEngineImplemented: false,
    guideGenerationImplemented: false,
    fieldPopulationImplemented: false,
    templatePopulationImplemented: false,
    operatorPopulationImplemented: false,
    xmlPopulationImplemented: false,
    validationIntegrationImplemented: false,
    auditIntegrationImplemented: false,
    qualityIntegrationImplemented: false,
    automaticCompletionImplemented: false,
  };
}

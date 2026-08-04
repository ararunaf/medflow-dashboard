/**
 * AIOrchestrationRuntimeEngineCapabilities — capacidades declarativas (F3-CAP-09).
 *
 * Apenas declaração estrutural. Sem IA real. Sem OpenAI / Azure OpenAI / Gemini /
 * Claude / Ollama / Llama. Sem ML. Sem Prompt Engineering. Sem HTTP.
 * Sem agentes funcionais. Sem workflow. Sem decisão automática.
 * Integrações estruturais (Validation/DocumentExtraction/DocumentClassification/
 * OCR/ICR/Scanner/WatchFolder/Upload/PQR/Worker/Scheduler/Observability/Scalability)
 * declaradas como preparadas — sem consumo funcional.
 */

import type { AICapabilities } from "./canonical";

export type AIOrchestrationRuntimeEngineCapabilities = {
  supportsOpenJob?: boolean;
  supportsCloseJob?: boolean;
  supportsSubmitRequest?: boolean;
  supportsRegisterTask?: boolean;
  supportsGetResult?: boolean;
  supportsStats?: boolean;
  supportsHealth?: boolean;
  supportsCanonicalAIOrchestration?: boolean;
  supportsTimeout?: boolean;
  supportsRetry?: boolean;
  supportsCancellation?: boolean;
  supportsTelemetry?: boolean;
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
  llmImplemented?: false;
  agentExecutionImplemented?: false;
  providerSelectionImplemented?: false;
  promptExecutionImplemented?: false;
  multiAgentImplemented?: false;
  workflowOrchestrationImplemented?: false;
  aiSupervisorImplemented?: false;
  contextManagementImplemented?: false;
  memoryImplemented?: false;
  reasoningImplemented?: false;
  decisionEngineImplemented?: false;
};

export function emptyAIOrchestrationRuntimeEngineCapabilities(): AIOrchestrationRuntimeEngineCapabilities {
  return {};
}

export function defineAIOrchestrationRuntimeEngineCapabilities(
  capabilities: AIOrchestrationRuntimeEngineCapabilities = {},
): AIOrchestrationRuntimeEngineCapabilities {
  return { ...capabilities };
}

export const DEFAULT_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES: AIOrchestrationRuntimeEngineCapabilities =
  {
    supportsOpenJob: true,
    supportsCloseJob: true,
    supportsSubmitRequest: true,
    supportsRegisterTask: true,
    supportsGetResult: true,
    supportsStats: true,
    supportsHealth: true,
    supportsCanonicalAIOrchestration: true,
    supportsTimeout: true,
    supportsRetry: true,
    supportsCancellation: true,
    supportsTelemetry: true,
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
    llmImplemented: false,
    agentExecutionImplemented: false,
    providerSelectionImplemented: false,
    promptExecutionImplemented: false,
    multiAgentImplemented: false,
    workflowOrchestrationImplemented: false,
    aiSupervisorImplemented: false,
    contextManagementImplemented: false,
    memoryImplemented: false,
    reasoningImplemented: false,
    decisionEngineImplemented: false,
  };

export const DEFAULT_MOCK_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES: AIOrchestrationRuntimeEngineCapabilities =
  {
    ...DEFAULT_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES,
  };

export function toCanonicalAICapabilities(
  capabilities: AIOrchestrationRuntimeEngineCapabilities = DEFAULT_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES,
): AICapabilities {
  return {
    kind: "canonical-ai-capabilities",
    supportsOpenJob: capabilities.supportsOpenJob === true,
    supportsCloseJob: capabilities.supportsCloseJob === true,
    supportsSubmitRequest: capabilities.supportsSubmitRequest === true,
    supportsRegisterTask: capabilities.supportsRegisterTask === true,
    supportsGetResult: capabilities.supportsGetResult === true,
    supportsStats: capabilities.supportsStats === true,
    supportsHealth: capabilities.supportsHealth === true,
    supportsCanonicalAIOrchestration: capabilities.supportsCanonicalAIOrchestration === true,
    runtimeReady: true,
    llmImplemented: false,
    agentExecutionImplemented: false,
    providerSelectionImplemented: false,
    promptExecutionImplemented: false,
    multiAgentImplemented: false,
    workflowOrchestrationImplemented: false,
    aiSupervisorImplemented: false,
    contextManagementImplemented: false,
    memoryImplemented: false,
    reasoningImplemented: false,
    decisionEngineImplemented: false,
  };
}

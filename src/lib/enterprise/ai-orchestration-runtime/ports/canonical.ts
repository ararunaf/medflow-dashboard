/**
 * Modelos canônicos estruturais do Enterprise AI Orchestration Runtime — F3-CAP-09.
 *
 * Foundation estrutural vendor-agnostic para orquestração futura de Inteligência
 * Artificial no MedicFlow-AI.
 *
 * Sem IA real. Sem OpenAI. Sem Azure OpenAI. Sem Gemini. Sem Claude.
 * Sem Ollama. Sem Llama. Sem ML. Sem Prompt Engineering. Sem HTTP.
 * Sem agentes funcionais. Sem workflow. Sem decisão automática.
 * Sem persistência. Sem banco. Sem APIs.
 *
 * Todos os metadados e contratos abaixo são exclusivamente estruturais —
 * nenhum campo possui implementação funcional nesta sprint.
 */

import type { DocumentClassificationContext } from "../../document-extraction-runtime/ports/canonical";
import type { DocumentExtractionResult } from "../../document-extraction-runtime/ports/canonical";
import type { ValidationResult } from "../../validation-runtime/ports/canonical";

export type { DocumentClassificationContext, DocumentExtractionResult, ValidationResult };

/** Status estrutural de orquestração AI (F3-CAP-09). */
export type AIStatus =
  | "pending"
  | "job-open"
  | "job-closed"
  | "submitted"
  | "registered"
  | "planned"
  | "processed"
  | "failed"
  | "disabled"
  | "unknown"
  | (string & {});

/**
 * Provedores futuros de LLM — somente enum/contratos.
 * Todos desabilitados nesta sprint (enabled: false).
 */
export type FutureAIProviderKind =
  | "openai"
  | "azure-openai"
  | "gemini"
  | "claude"
  | "ollama"
  | "llama"
  | "custom"
  | (string & {});

/** Contrato estrutural de provedor futuro (desabilitado). */
export type FutureAIProviderContract = {
  kind: "canonical-future-ai-provider-contract";
  providerKind: FutureAIProviderKind;
  enabled: false;
  connected: false;
  httpImplemented: false;
  promptEngineeringImplemented: false;
  label?: string;
};

/** Catálogo estrutural de provedores futuros — todos desabilitados. */
export type FutureAIProviderCatalog = {
  kind: "canonical-future-ai-provider-catalog";
  openai: FutureAIProviderContract;
  azureOpenAI: FutureAIProviderContract;
  gemini: FutureAIProviderContract;
  claude: FutureAIProviderContract;
  ollama: FutureAIProviderContract;
  llama: FutureAIProviderContract;
  custom: FutureAIProviderContract;
};

/**
 * Identidade estrutural de agente futuro — nenhum agente executa lógica.
 */
export type FutureAIAgentKind =
  | "classification"
  | "extraction"
  | "validation"
  | "audit"
  | "tiss"
  | "medical-guide"
  | "quality"
  | "supervisor"
  | "coordinator"
  | (string & {});

/** Contrato base estrutural de agente (sem execução). */
export type AIAgent = {
  kind: "canonical-ai-agent";
  agentId: string;
  agentKind: FutureAIAgentKind;
  status: AIStatus;
  label?: string;
  agentExecutionImplemented: false;
  reasoningImplemented: false;
  decisionEngineImplemented: false;
};

/** ClassificationAgent — contrato estrutural apenas. */
export type ClassificationAgent = AIAgent & {
  agentKind: "classification";
  structuralRole: "classification-agent";
};

/** ExtractionAgent — contrato estrutural apenas. */
export type ExtractionAgent = AIAgent & {
  agentKind: "extraction";
  structuralRole: "extraction-agent";
};

/** ValidationAgent — contrato estrutural apenas. */
export type ValidationAgent = AIAgent & {
  agentKind: "validation";
  structuralRole: "validation-agent";
};

/** AuditAgent — contrato estrutural apenas. */
export type AuditAgent = AIAgent & {
  agentKind: "audit";
  structuralRole: "audit-agent";
};

/** TISSAgent — contrato estrutural apenas. */
export type TISSAgent = AIAgent & {
  agentKind: "tiss";
  structuralRole: "tiss-agent";
};

/** MedicalGuideAgent — contrato estrutural apenas. */
export type MedicalGuideAgent = AIAgent & {
  agentKind: "medical-guide";
  structuralRole: "medical-guide-agent";
};

/** QualityAgent — contrato estrutural apenas. */
export type QualityAgent = AIAgent & {
  agentKind: "quality";
  structuralRole: "quality-agent";
};

/** SupervisorAgent — contrato estrutural apenas. */
export type SupervisorAgent = AIAgent & {
  agentKind: "supervisor";
  structuralRole: "supervisor-agent";
};

/** CoordinatorAgent — contrato estrutural apenas. */
export type CoordinatorAgent = AIAgent & {
  agentKind: "coordinator";
  structuralRole: "coordinator-agent";
};

/** União estrutural dos contratos de agentes futuros. */
export type FutureAIAgentContract =
  | ClassificationAgent
  | ExtractionAgent
  | ValidationAgent
  | AuditAgent
  | TISSAgent
  | MedicalGuideAgent
  | QualityAgent
  | SupervisorAgent
  | CoordinatorAgent;

/**
 * AIOrchestrationContext canônico (F3-CAP-09).
 *
 * Capaz de receber futuramente DocumentClassificationContext +
 * DocumentExtractionResult + ValidationResult — sem qualquer processamento.
 */
export type AIOrchestrationContext = {
  kind: "canonical-ai-orchestration-context";
  jobId?: string;
  requestId?: string;
  taskId?: string;
  planId?: string;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
  agents?: readonly FutureAIAgentContract[];
  futureProviders?: FutureAIProviderCatalog;
  structuralNotes?: string;
};

/** Alias canônico AIContext (F3-CAP-09). */
export type AIContext = AIOrchestrationContext;

/** Metadata canônica estrutural (F3-CAP-09). */
export type AIMetadata = {
  kind: "canonical-ai-metadata";
  jobId?: string;
  requestId?: string;
  taskId?: string;
  planId?: string;
  correlationId?: string | null;
  channel?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
  orchestrationContext?: AIOrchestrationContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
};

/** Provedor canônico declarado (estrutural — nunca conectado). */
export type AIProvider = {
  kind: "canonical-ai-provider";
  providerId: string;
  providerKind?: FutureAIProviderKind;
  adapterId?: string;
  vendor?: string;
  version?: string;
  label?: string;
  enabled: false;
  connected: false;
  llmImplemented: false;
  httpImplemented: false;
};

/** Workflow canônico estrutural — nunca orquestrado. */
export type AIWorkflow = {
  kind: "canonical-ai-workflow";
  workflowId: string;
  status: AIStatus;
  steps?: readonly string[];
  workflowOrchestrationImplemented: false;
  multiAgentImplemented: false;
  decisionEngineImplemented: false;
};

/** Task canônica estrutural — nunca executada por agente. */
export type AITask = {
  kind: "canonical-ai-task";
  taskId: string;
  jobId?: string;
  requestId?: string;
  status: AIStatus;
  agentKind?: FutureAIAgentKind;
  metadata?: AIMetadata;
  orchestrationContext?: AIOrchestrationContext;
  createdAt: string;
  updatedAt: string;
  agentExecutionImplemented: false;
  llmImplemented: false;
  promptExecutionImplemented: false;
  reasoningImplemented: false;
  decisionEngineImplemented: false;
};

/** Plano de execução canônico estrutural — nunca dispara LLM. */
export type AIExecutionPlan = {
  kind: "canonical-ai-execution-plan";
  planId: string;
  jobId?: string;
  requestId?: string;
  status: AIStatus;
  tasks?: readonly AITask[];
  agents?: readonly FutureAIAgentContract[];
  workflow?: AIWorkflow;
  metadata?: AIMetadata;
  orchestrationContext?: AIOrchestrationContext;
  createdAt: string;
  updatedAt: string;
  providerSelectionImplemented: false;
  workflowOrchestrationImplemented: false;
  multiAgentImplemented: false;
  llmImplemented: false;
  agentExecutionImplemented: false;
};

/** Request canônico estrutural de AI (AIRequest). Nunca dispara LLM. */
export type AIRequest = {
  kind: "canonical-ai-request";
  requestId: string;
  jobId?: string;
  taskId?: string;
  planId?: string;
  status: AIStatus;
  metadata?: AIMetadata;
  orchestrationContext?: AIOrchestrationContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
  createdAt: string;
  updatedAt: string;
  llmImplemented: false;
  promptExecutionImplemented: false;
  agentExecutionImplemented: false;
  providerSelectionImplemented: false;
  memoryImplemented: false;
  reasoningImplemented: false;
  decisionEngineImplemented: false;
};

/** Response canônico estrutural (AIResponse). Nunca produzido por LLM real. */
export type AIResponse = {
  kind: "canonical-ai-response";
  responseId: string;
  requestId?: string;
  jobId?: string;
  status: AIStatus;
  content?: string;
  metadata?: AIMetadata;
  orchestrationContext?: AIOrchestrationContext;
  createdAt: string;
  updatedAt: string;
  llmImplemented: false;
  promptExecutionImplemented: false;
  reasoningImplemented: false;
  memoryImplemented: false;
};

/** Job canônico estrutural de orquestração AI. */
export type AIJob = {
  kind: "canonical-ai-job";
  jobId: string;
  status: AIStatus;
  identity?: {
    kind: "canonical-ai-identity";
    jobId?: string;
    correlationId?: string | null;
  };
  metadata?: AIMetadata;
  orchestrationContext?: AIOrchestrationContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  llmImplemented: false;
  agentExecutionImplemented: false;
  providerSelectionImplemented: false;
  promptExecutionImplemented: false;
  multiAgentImplemented: false;
  workflowOrchestrationImplemented: false;
  aiSupervisorImplemented: false;
  contextManagementImplemented: false;
  memoryImplemented: false;
  reasoningImplemented: false;
  decisionEngineImplemented: false;
};

/** Operação canônica do AI Orchestration Runtime (F3-CAP-09). */
export type CanonicalAIOrchestrationOperation =
  | "openJob"
  | "closeJob"
  | "submitRequest"
  | "registerTask"
  | "getResult"
  | "stats"
  | "health"
  | "capabilities"
  | (string & {});

/**
 * Resultado canônico de execução do AI Orchestration Runtime (F3-CAP-09).
 * Contém apenas referência/estrutura canônica — nunca IA real.
 */
export type AIExecutionResult = {
  kind: "canonical-ai-execution-result";
  ok: boolean;
  resultId: string;
  operation: CanonicalAIOrchestrationOperation;
  job?: AIJob;
  request?: AIRequest;
  response?: AIResponse;
  task?: AITask;
  plan?: AIExecutionPlan;
  workflow?: AIWorkflow;
  agents?: readonly FutureAIAgentContract[];
  provider?: AIProvider;
  metadata?: AIMetadata;
  orchestrationContext?: AIOrchestrationContext;
  classificationContext?: DocumentClassificationContext;
  extractionResult?: DocumentExtractionResult;
  validationResult?: ValidationResult;
  llmImplemented: false;
  agentExecutionImplemented: false;
  providerSelectionImplemented: false;
  promptExecutionImplemented: false;
  multiAgentImplemented: false;
  workflowOrchestrationImplemented: false;
  aiSupervisorImplemented: false;
  contextManagementImplemented: false;
  memoryImplemented: false;
  reasoningImplemented: false;
  decisionEngineImplemented: false;
  /** Sempre true — runtime estrutural pronto (sem IA real). */
  runtimeReady: true;
  status: AIStatus;
  messageText?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
};

/** Estatísticas estruturais do AI Orchestration Runtime (in-process). */
export type AIStatistics = {
  kind: "canonical-ai-statistics";
  totalJobs: number;
  openJobs: number;
  closedJobs: number;
  totalRequests: number;
  totalTasks: number;
  totalResults: number;
  llmImplementedCount: 0;
  agentExecutionImplementedCount: 0;
  providerSelectionImplementedCount: 0;
  promptExecutionImplementedCount: 0;
  multiAgentImplementedCount: 0;
  workflowOrchestrationImplementedCount: 0;
  aiSupervisorImplementedCount: 0;
  contextManagementImplementedCount: 0;
  memoryImplementedCount: 0;
  reasoningImplementedCount: 0;
  decisionEngineImplementedCount: 0;
};

/** Saúde canônica estrutural do provedor AI Orchestration Runtime. */
export type AIHealth = {
  kind: "canonical-ai-health";
  ok: boolean;
  provider: string;
  latencyMs?: number;
  message?: string;
  status?: string;
  storedJobCount?: number;
  storedRequestCount?: number;
  storedTaskCount?: number;
  storedResultCount?: number;
  validationRuntimeOk?: boolean;
  documentExtractionRuntimeOk?: boolean;
  documentClassificationRuntimeOk?: boolean;
  ocrRuntimeOk?: boolean;
  intelligentCaptureRuntimeOk?: boolean;
  scannerRuntimeOk?: boolean;
  watchFolderRuntimeOk?: boolean;
  uploadRuntimeOk?: boolean;
  persistentQueueRuntimeOk?: boolean;
  schedulerRuntimeOk?: boolean;
  workerRuntimeOk?: boolean;
  observabilityRuntimeOk?: boolean;
  scalabilityRuntimeOk?: boolean;
  runtimeReady: true;
  llmImplemented: false;
  agentExecutionImplemented: false;
  providerSelectionImplemented: false;
  promptExecutionImplemented: false;
  multiAgentImplemented: false;
  workflowOrchestrationImplemented: false;
  aiSupervisorImplemented: false;
  contextManagementImplemented: false;
  memoryImplemented: false;
  reasoningImplemented: false;
  decisionEngineImplemented: false;
};

/**
 * Capacidades canônicas declaradas do provedor AI Orchestration Runtime.
 * Todas as flags `*Implemented` permanecem literalmente `false`.
 */
export type AICapabilities = {
  kind: "canonical-ai-capabilities";
  supportsOpenJob: boolean;
  supportsCloseJob: boolean;
  supportsSubmitRequest: boolean;
  supportsRegisterTask: boolean;
  supportsGetResult: boolean;
  supportsStats: boolean;
  supportsHealth: boolean;
  supportsCanonicalAIOrchestration: boolean;
  runtimeReady: true;
  llmImplemented: false;
  agentExecutionImplemented: false;
  providerSelectionImplemented: false;
  promptExecutionImplemented: false;
  multiAgentImplemented: false;
  workflowOrchestrationImplemented: false;
  aiSupervisorImplemented: false;
  contextManagementImplemented: false;
  memoryImplemented: false;
  reasoningImplemented: false;
  decisionEngineImplemented: false;
};

/** Catálogo default de provedores futuros — todos desabilitados. */
export function createDisabledFutureAIProviderCatalog(): FutureAIProviderCatalog {
  const disabled = (
    providerKind: FutureAIProviderKind,
    label: string,
  ): FutureAIProviderContract => ({
    kind: "canonical-future-ai-provider-contract",
    providerKind,
    enabled: false,
    connected: false,
    httpImplemented: false,
    promptEngineeringImplemented: false,
    label,
  });
  return {
    kind: "canonical-future-ai-provider-catalog",
    openai: disabled("openai", "OpenAI"),
    azureOpenAI: disabled("azure-openai", "Azure OpenAI"),
    gemini: disabled("gemini", "Gemini"),
    claude: disabled("claude", "Claude"),
    ollama: disabled("ollama", "Ollama"),
    llama: disabled("llama", "Llama"),
    custom: disabled("custom", "Custom Provider"),
  };
}

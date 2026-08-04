/**
 * MockAIOrchestrationRuntimeAdapter — F3-CAP-09.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem IA real. Sem OpenAI/Azure/Gemini/Claude/Ollama/Llama.
 *
 * Delega sempre ao Default (mesmo sem enterpriseDeps).
 */
import {
  DEFAULT_MOCK_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalAICapabilities,
} from "../ports/capabilities";
import type { AIOrchestrationRuntimePort } from "../ports/ai-orchestration-runtime-port";
import type {
  AIOrchestrationRuntimeCapabilities,
  AIOrchestrationRuntimeEnterpriseDeps,
  AIOrchestrationRuntimeHealth,
  AIOrchestrationRuntimeInfo,
  AIOrchestrationRuntimeProviderId,
  AIOrchestrationRuntimeProviderMetadata,
  AIOrchestrationStatsInput,
  AIOrchestrationStatsResult,
  CloseAIOrchestrationJobInput,
  CloseAIOrchestrationJobResult,
  GetAIResultInput,
  GetAIResultResult,
  OpenAIOrchestrationJobInput,
  OpenAIOrchestrationJobResult,
  RegisterAITaskInput,
  RegisterAITaskResult,
  SubmitAIRequestInput,
  SubmitAIRequestResult,
} from "../ports/types";
import type { AIOrchestrationRuntimeStore } from "../store";
import { InMemoryAIOrchestrationRuntimeStore } from "../store";
import { DefaultAIOrchestrationRuntimeAdapter } from "./default-ai-orchestration-runtime-adapter";

export const MOCK_AI_ORCHESTRATION_RUNTIME_ADAPTER_ID =
  "mock-deterministic-ai-orchestration-runtime";
export const DEFAULT_MOCK_AI_ORCHESTRATION_RUNTIME_VERSION = "1.0.0";

export type MockAIOrchestrationRuntimeAdapterOptions = {
  provider?: Extract<AIOrchestrationRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: AIOrchestrationRuntimeStore;
  enterpriseDeps?: AIOrchestrationRuntimeEnterpriseDeps;
  now?: () => string;
};

function mockMetadata(
  providerId: Extract<AIOrchestrationRuntimeProviderId, "mock" | "test">,
): AIOrchestrationRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test AI Orchestration Runtime" : "Mock AI Orchestration Runtime",
    version: DEFAULT_MOCK_AI_ORCHESTRATION_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description: "Deterministic in-process AI Orchestration Runtime mock — no network, no real AI.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico (simulated:true).
 */
export class MockAIOrchestrationRuntimeAdapter implements AIOrchestrationRuntimePort {
  readonly providerId: Extract<AIOrchestrationRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: AIOrchestrationRuntimeProviderMetadata;
  private readonly delegate: DefaultAIOrchestrationRuntimeAdapter;

  constructor(options: MockAIOrchestrationRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ?? `${this.providerId} AI Orchestration Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultAIOrchestrationRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store ?? new InMemoryAIOrchestrationRuntimeStore(),
      enterpriseDeps: options.enterpriseDeps,
      now: options.now,
    });
  }

  getStore(): AIOrchestrationRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): AIOrchestrationRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_AI_ORCHESTRATION_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsOpenJob: true,
      supportsCloseJob: true,
      supportsSubmitRequest: true,
      supportsRegisterTask: true,
      supportsGetResult: true,
      supportsStats: true,
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
      engine: { ...DEFAULT_MOCK_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toCanonicalAICapabilities(
        DEFAULT_MOCK_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES,
      ),
    };
  }

  providerInfo(): AIOrchestrationRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "AI_ORCHESTRATION_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_AI_ORCHESTRATION_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<AIOrchestrationRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async openJob(input: OpenAIOrchestrationJobInput): Promise<OpenAIOrchestrationJobResult> {
    const result = await this.delegate.openJob(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async closeJob(input: CloseAIOrchestrationJobInput): Promise<CloseAIOrchestrationJobResult> {
    const result = await this.delegate.closeJob(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async submitRequest(input: SubmitAIRequestInput): Promise<SubmitAIRequestResult> {
    const result = await this.delegate.submitRequest(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async registerTask(input: RegisterAITaskInput): Promise<RegisterAITaskResult> {
    const result = await this.delegate.registerTask(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getResult(input: GetAIResultInput): Promise<GetAIResultResult> {
    const result = await this.delegate.getResult(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: AIOrchestrationStatsInput): Promise<AIOrchestrationStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}

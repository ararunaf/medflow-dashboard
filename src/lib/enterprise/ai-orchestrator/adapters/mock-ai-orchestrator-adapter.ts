/**
 * MockAIOrchestratorAdapter — EPC-16.
 *
 * Permite testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência externa.
 * NÃO executa IA. NÃO realiza chamadas HTTP.
 */
import { createDefaultAIProviderRegistry, type AIProviderRegistry } from "../../ai-provider";
import { createOrchestrationRequestId } from "../ports/identity";
import type { AIOrchestratorPort } from "../ports/ai-orchestrator-port";
import type {
  AIOrchestrationRequest,
  AIOrchestrationResult,
  AIOrchestratorCapabilities,
  AIOrchestratorHealth,
  AIOrchestratorProviderId,
  GetProviderInput,
  GetProviderResult,
  ListAvailableProvidersInput,
  ListAvailableProvidersResult,
} from "../ports/types";
import { selectProviderDeterministic } from "../runtime/select-provider";
import { DefaultAIOrchestratorStore, type AIOrchestratorStore } from "../store";

export type MockAIOrchestratorAdapterOptions = {
  provider?: Extract<AIOrchestratorProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: AIOrchestratorStore;
  registry?: AIProviderRegistry;
  createId?: () => string;
};

export class MockAIOrchestratorAdapter implements AIOrchestratorPort {
  readonly providerId: Extract<AIOrchestratorProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: AIOrchestratorStore;
  private readonly registry: AIProviderRegistry;
  private readonly createId: () => string;

  constructor(options: MockAIOrchestratorAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} ai-orchestrator ready.`;
    this.store = options.store ?? new DefaultAIOrchestratorStore();
    this.registry = options.registry ?? createDefaultAIProviderRegistry();
    this.createId = options.createId ?? createOrchestrationRequestId;
  }

  getStore(): AIOrchestratorStore {
    return this.store;
  }

  getRegistry(): AIProviderRegistry {
    return this.registry;
  }

  capabilities(): AIOrchestratorCapabilities {
    return {
      provider: this.providerId,
      adapterId: `${this.providerId}-in-memory`,
      supportsSelectProvider: true,
      supportsGetProvider: true,
      supportsListAvailableProviders: true,
      supportsMultipleProviders: true,
      supportsSelectionPolicies: true,
      usesAiProviderFramework: true,
      supportsFutureAiAuditor: true,
      supportsFutureOcr: true,
      supportsFutureWorkflow: true,
      supportsFutureRuleEngine: true,
      supportsFutureContractFoundation: true,
      supportsFutureDocumentProcessing: true,
    };
  }

  async health(): Promise<AIOrchestratorHealth> {
    return {
      ok: this.healthy,
      provider: this.providerId,
      latencyMs: 0,
      availableProviderCount: this.registry.list().length,
      storedSelectionCount: this.store.count(),
      message: this.message,
    };
  }

  async selectProvider(request: AIOrchestrationRequest): Promise<AIOrchestrationResult> {
    const result = selectProviderDeterministic(this.registry, request, this.createId);
    this.store.setSelection({ request, result });
    return result;
  }

  async getProvider(input: GetProviderInput): Promise<GetProviderResult> {
    const provider = this.registry.get(input.providerId);
    if (!provider) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    return { ok: true, provider };
  }

  async listAvailableProviders(
    input: ListAvailableProvidersInput = {},
  ): Promise<ListAvailableProvidersResult> {
    const includeStubs = input.includeStubs ?? true;
    let providers = this.registry.list().filter((entry) => {
      if (entry.status === "disabled" || entry.status === "unhealthy") return false;
      if (!includeStubs && entry.status === "stub") return false;
      if (input.status && entry.status !== input.status) return false;
      if (input.capability && !entry.capabilities.includes(input.capability)) return false;
      return true;
    });

    providers = [...providers].sort((a, b) => a.providerId.localeCompare(b.providerId));
    return { ok: true, providers };
  }
}

/** Alias canônico para testes / homologação. */
export { MockAIOrchestratorAdapter as DefaultMockAIOrchestrator };

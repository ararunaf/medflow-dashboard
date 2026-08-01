/**
 * DefaultAIOrchestratorAdapter — adapter default in-memory (EPC-16).
 *
 * Encapsula Store + AI Provider Framework (EPC-07) atrás do Port.
 * NÃO cria banco, NÃO cria migrations, NÃO altera UI / APIs.
 * NÃO executa IA real. NÃO realiza chamadas HTTP.
 */
import { createDefaultAIProviderRegistry, type AIProviderRegistry } from "../../ai-provider";
import { createOrchestrationRequestId } from "../ports/identity";
import type { AIOrchestratorPort } from "../ports/ai-orchestrator-port";
import type {
  AIOrchestrationRequest,
  AIOrchestrationResult,
  AIOrchestratorCapabilities,
  AIOrchestratorHealth,
  GetProviderInput,
  GetProviderResult,
  ListAvailableProvidersInput,
  ListAvailableProvidersResult,
} from "../ports/types";
import { selectProviderDeterministic } from "../runtime/select-provider";
import { DefaultAIOrchestratorStore, type AIOrchestratorStore } from "../store";

export const DEFAULT_AI_ORCHESTRATOR_ADAPTER_ID = "default-in-process";

/**
 * Runtime injetável — permite testes e bind customizado
 * sem acoplar o Port a detalhes de produto.
 */
export type DefaultAIOrchestratorRuntime = {
  /** Store ativo. Default: DefaultAIOrchestratorStore in-process. */
  store?: AIOrchestratorStore;
  /** Registry EPC-07. Default: createDefaultAIProviderRegistry(). */
  registry?: AIProviderRegistry;
  /** Probe opcional. */
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  /** Gerador de request id injetável (testes). */
  createId?: () => string;
};

function defaultRuntime(): DefaultAIOrchestratorRuntime {
  return {
    store: new DefaultAIOrchestratorStore(),
    registry: createDefaultAIProviderRegistry(),
  };
}

export class DefaultAIOrchestratorAdapter implements AIOrchestratorPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultAIOrchestratorRuntime;
  private readonly store: AIOrchestratorStore;
  private readonly registry: AIProviderRegistry;

  constructor(runtime: DefaultAIOrchestratorRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.store = runtime.store ?? new DefaultAIOrchestratorStore();
    this.registry = runtime.registry ?? createDefaultAIProviderRegistry();
  }

  /** Acesso estrutural ao store (testes / demo). Sem IA. */
  getStore(): AIOrchestratorStore {
    return this.store;
  }

  /** Acesso estrutural ao registry EPC-07 (testes / demo). Sem IA. */
  getRegistry(): AIProviderRegistry {
    return this.registry;
  }

  capabilities(): AIOrchestratorCapabilities {
    return {
      provider: "default",
      adapterId: DEFAULT_AI_ORCHESTRATOR_ADAPTER_ID,
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
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (this.runtime.ping) {
      const probe = await this.runtime.ping();
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: probe.ok,
        provider: "default",
        latencyMs: Math.max(0, Math.round(end - start)),
        availableProviderCount: this.registry.list().length,
        storedSelectionCount: this.store.count(),
        message:
          probe.message ??
          (probe.ok
            ? "Default ai-orchestrator probe ok."
            : "Default ai-orchestrator probe falhou."),
      };
    }

    const storeHealth = this.store.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: storeHealth.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      availableProviderCount: this.registry.list().length,
      storedSelectionCount: this.store.count(),
      message:
        storeHealth.message ??
        "AIOrchestratorStore + AIProviderRegistry prontos (sem I/O externo — EPC-16).",
    };
  }

  async selectProvider(request: AIOrchestrationRequest): Promise<AIOrchestrationResult> {
    const result = selectProviderDeterministic(
      this.registry,
      request,
      this.runtime.createId ?? createOrchestrationRequestId,
    );

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

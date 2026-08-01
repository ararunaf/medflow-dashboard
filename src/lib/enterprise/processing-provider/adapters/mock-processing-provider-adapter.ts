/**
 * MockProcessingProviderAdapter — EPC-14.
 *
 * Permite testes, homologação e desenvolvimento offline
 * sem alterar produção e sem dependência externa.
 * NÃO executa OCR, IA, parsers ou I/O.
 */
import { createProviderId } from "../ports/identity";
import type { ProcessingProviderPort } from "../ports/processing-provider-port";
import type {
  GetProviderInput,
  GetProviderResult,
  ListProvidersInput,
  ListProvidersResult,
  ProcessingProviderCapabilities,
  ProcessingProviderHealth,
  ProcessingProviderProviderId,
  ProviderDescriptor,
  RegisterProviderInput,
  RegisterProviderResult,
  UnregisterProviderInput,
  UnregisterProviderResult,
} from "../ports/types";
import { ProcessingProviderRegistry } from "../registry";

export type MockProcessingProviderAdapterOptions = {
  provider?: Extract<ProcessingProviderProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  /** Seed opcional de descriptors stub. */
  providers?: readonly ProviderDescriptor[];
  createId?: () => string;
};

export class MockProcessingProviderAdapter implements ProcessingProviderPort {
  readonly providerId: Extract<ProcessingProviderProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly registry: ProcessingProviderRegistry;
  private readonly createId: () => string;

  constructor(options: MockProcessingProviderAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} processing-provider ready.`;
    this.createId = options.createId ?? createProviderId;
    this.registry = new ProcessingProviderRegistry({ seed: options.providers });
  }

  getRegistry(): ProcessingProviderRegistry {
    return this.registry;
  }

  capabilities(): ProcessingProviderCapabilities {
    return {
      provider: this.providerId,
      adapterId: `${this.providerId}-in-memory`,
      supportsRegisterProvider: true,
      supportsUnregisterProvider: true,
      supportsGetProvider: true,
      supportsListProviders: true,
      supportsMultipleProviders: true,
      supportsCapabilitySelection: true,
      supportsAsyncDeclaration: true,
      supportsBatchDeclaration: true,
      supportsStreamingDeclaration: true,
      supportsFutureDocumentProcessingFoundation: true,
      supportsFutureAiProviders: true,
      supportsFutureWorkflow: true,
      supportsFutureRuleEngine: true,
    };
  }

  async health(): Promise<ProcessingProviderHealth> {
    return {
      ok: this.healthy,
      provider: this.providerId,
      latencyMs: 0,
      registeredCount: this.registry.count(),
      message: this.message,
    };
  }

  async registerProvider(input: RegisterProviderInput): Promise<RegisterProviderResult> {
    const providerId = input.provider.providerId ?? this.createId();
    const existing = this.registry.get(providerId);

    const provider: ProviderDescriptor = {
      ...input.provider,
      providerId,
      providerName: input.provider.providerName ?? existing?.providerName ?? providerId,
      providerVersion: input.provider.providerVersion ?? existing?.providerVersion ?? "0.0.0-stub",
      providerType: input.provider.providerType ?? existing?.providerType ?? "UNKNOWN",
      capabilities: input.provider.capabilities ?? existing?.capabilities ?? {},
      priority: input.provider.priority ?? existing?.priority ?? 0,
      enabled: input.provider.enabled ?? existing?.enabled ?? false,
      healthStatus: input.provider.healthStatus ?? existing?.healthStatus ?? "stub",
    };

    this.registry.register(provider);
    return {
      ok: true,
      providerId,
      provider,
      message: existing ? "provider updated" : "provider registered",
      code: existing ? "updated" : "created",
    };
  }

  async unregisterProvider(input: UnregisterProviderInput): Promise<UnregisterProviderResult> {
    const existed = this.registry.unregister(input.providerId);
    if (!existed) {
      return {
        ok: false,
        providerId: input.providerId,
        message: "not found",
        code: "not_found",
      };
    }
    return {
      ok: true,
      providerId: input.providerId,
      message: "provider unregistered",
      code: "removed",
    };
  }

  async getProvider(input: GetProviderInput): Promise<GetProviderResult> {
    const provider = this.registry.get(input.providerId);
    if (!provider) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    return { ok: true, provider };
  }

  async listProviders(input: ListProvidersInput = {}): Promise<ListProvidersResult> {
    return { ok: true, providers: this.registry.listFiltered(input) };
  }
}

/** Alias canônico para testes / homologação. */
export { MockProcessingProviderAdapter as DefaultMockProcessingProvider };

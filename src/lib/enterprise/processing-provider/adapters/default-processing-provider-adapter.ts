/**
 * DefaultProcessingProviderAdapter — adapter default in-memory (EPC-14).
 *
 * Encapsula o ProcessingProviderRegistry atrás do Port.
 * NÃO cria banco, NÃO cria migrations, NÃO altera UI / APIs.
 * NÃO executa OCR, IA, PDF, XML, Barcode, QRCode, HL7 ou DICOM.
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
  ProviderDescriptor,
  RegisterProviderInput,
  RegisterProviderResult,
  UnregisterProviderInput,
  UnregisterProviderResult,
} from "../ports/types";
import {
  ProcessingProviderRegistry,
  type ProcessingProviderRegistry as RegistryType,
} from "../registry";

export const DEFAULT_PROCESSING_PROVIDER_ADAPTER_ID = "default-in-process";

/**
 * Runtime injetável — permite testes e bind customizado
 * sem acoplar o Port a detalhes de produto.
 */
export type DefaultProcessingProviderRuntime = {
  /** Registry ativo. Default: ProcessingProviderRegistry vazio. */
  registry?: RegistryType;
  /** Probe opcional. */
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  /** Gerador de provider id injetável (testes). */
  createId?: () => string;
};

function defaultRuntime(): DefaultProcessingProviderRuntime {
  return {
    registry: new ProcessingProviderRegistry(),
  };
}

export class DefaultProcessingProviderAdapter implements ProcessingProviderPort {
  readonly providerId = "default" as const;

  private readonly runtime: DefaultProcessingProviderRuntime;
  private readonly registry: RegistryType;

  constructor(runtime: DefaultProcessingProviderRuntime = defaultRuntime()) {
    this.runtime = runtime;
    this.registry = runtime.registry ?? new ProcessingProviderRegistry();
  }

  /** Acesso estrutural ao registry (testes / demo). Sem processamento. */
  getRegistry(): RegistryType {
    return this.registry;
  }

  capabilities(): ProcessingProviderCapabilities {
    return {
      provider: "default",
      adapterId: DEFAULT_PROCESSING_PROVIDER_ADAPTER_ID,
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
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (this.runtime.ping) {
      const probe = await this.runtime.ping();
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: probe.ok,
        provider: "default",
        latencyMs: Math.max(0, Math.round(end - start)),
        registeredCount: this.registry.count(),
        message:
          probe.message ??
          (probe.ok
            ? "Default processing-provider probe ok."
            : "Default processing-provider probe falhou."),
      };
    }

    const registryHealth = this.registry.health();
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ok: registryHealth.ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      registeredCount: registryHealth.count,
      message:
        registryHealth.message ?? "ProcessingProviderRegistry pronto (sem I/O externo — EPC-14).",
    };
  }

  async registerProvider(input: RegisterProviderInput): Promise<RegisterProviderResult> {
    const providerId = input.provider.providerId ?? this.runtime.createId?.() ?? createProviderId();
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
    const providers = this.registry.listFiltered(input);
    return { ok: true, providers };
  }
}

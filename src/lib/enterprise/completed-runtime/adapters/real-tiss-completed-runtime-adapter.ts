/**
 * RealTissCompletedRuntimeAdapter — provider "real-tiss" do Completed Runtime.
 *
 * A10-02: ativação do provider real sem alterar Port, Runtime, Pipeline,
 * Queue, Worker, Scheduler, Retry, Dead Letter, Observability, Foundations ou Composition Root.
 *
 * Reutiliza integralmente DefaultCompletedRuntimeAdapter para lifecycle, retry,
 * observability (shape-check), telemetry, statistics, health, capabilities,
 * providerInfo, AbortSignal e CompletedRuntimeStore.
 *
 * NÃO implementa: assinatura digital, criptografia, SHA-256, cadeia de custódia,
 * Key Vault, HSM, SIEM, ICP-Brasil, Security Runtime, Completed, transmissão externa.
 */
import type { CompletedRuntimePort } from "../ports/completed-runtime-port";
import type { CompletedRuntimeStore } from "../store";
import {
  DEFAULT_COMPLETED_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalCompletedCapabilities,
} from "../ports/capabilities";
import {
  DEFAULT_COMPLETED_RUNTIME_VERSION,
  DefaultCompletedRuntimeAdapter,
  type DefaultCompletedRuntimeAdapterOptions,
} from "./default-completed-runtime-adapter";
import type {
  CompletedRuntimeCapabilities,
  CompletedRuntimeEnterpriseDeps,
  CompletedRuntimeHealth,
  CompletedRuntimeInfo,
  CompletedRuntimeProviderId,
  CompletedRuntimeProviderMetadata,
  CompletedStatsInput,
  CompletedStatsResult,
  CloseCompletedJobInput,
  CloseCompletedJobResult,
  GetCompletedResultInput,
  GetCompletedResultResult,
  OpenCompletedJobInput,
  OpenCompletedJobResult,
  RegisterCompletedFindingInput,
  RegisterCompletedFindingResult,
  SubmitCompletedRequestInput,
  SubmitCompletedRequestResult,
} from "../ports/types";

export const REALTISS_COMPLETED_RUNTIME_ADAPTER_ID = "real-tiss-completed-runtime";
export const REALTISS_COMPLETED_RUNTIME_VERSION = "1.0.0";

export const REALTISS_COMPLETED_IDENTITY: CompletedRuntimeProviderMetadata = {
  name: "RealTiss Completed Runtime",
  version: REALTISS_COMPLETED_RUNTIME_VERSION,
  vendor: "real-tiss",
  layer: "Foundation",
  vendorAgnostic: false,
  description:
    "RealTiss structural completed runtime adapter — reuses DefaultCompletedRuntimeAdapter lifecycle, retry, telemetry, statistics and store. No real completed, no security, no Completed.",
};

export type RealTissCompletedRuntimeAdapterOptions = Omit<
  DefaultCompletedRuntimeAdapterOptions,
  "provider"
> & {
  /** Provider confirmado (sempre "real-tiss"); preservado para compatibilidade com factory. */
  provider?: Extract<CompletedRuntimeProviderId, "real-tiss">;
};

/**
 * RealTiss Completed Runtime — delega todos os métodos operacionais ao
 * DefaultCompletedRuntimeAdapter e expõe identidade própria de provider.
 */
export class RealTissCompletedRuntimeAdapter implements CompletedRuntimePort {
  readonly providerId: Extract<CompletedRuntimeProviderId, "real-tiss"> = "real-tiss";

  private readonly delegate: DefaultCompletedRuntimeAdapter;
  private readonly metadata: CompletedRuntimeProviderMetadata;
  private readonly healthy: boolean;

  constructor(options: RealTissCompletedRuntimeAdapterOptions = {}) {
    this.metadata = REALTISS_COMPLETED_IDENTITY;
    this.healthy = options.healthy ?? true;

    this.delegate = new DefaultCompletedRuntimeAdapter({
      provider: "enterprise",
      healthy: this.healthy,
      message:
        options.message ??
        `${this.providerId} Completed Runtime ready (structural only — real provider active).`,
      store: options.store,
      enterpriseDeps: options.enterpriseDeps,
      defaultTimeoutMs: options.defaultTimeoutMs,
      defaultRetryCount: options.defaultRetryCount,
      defaultRetryBackoffMs: options.defaultRetryBackoffMs,
      now: options.now,
      sleep: options.sleep,
      failAttempts: options.failAttempts,
    });
  }

  /** Acesso estrutural ao store (testes / demo — não produto). */
  getStore(): CompletedRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): CompletedRuntimeCapabilities {
    const caps = this.delegate.capabilities();
    return {
      ...caps,
      provider: this.providerId,
      adapterId: REALTISS_COMPLETED_RUNTIME_ADAPTER_ID,
    };
  }

  providerInfo(): CompletedRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "COMPLETED_RUNTIME",
      capabilities: { ...DEFAULT_COMPLETED_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<CompletedRuntimeHealth> {
    const h = await this.delegate.health();
    return {
      ...h,
      provider: this.providerId,
    };
  }

  async openJob(input: OpenCompletedJobInput): Promise<OpenCompletedJobResult> {
    return this.delegate.openJob(input);
  }

  async closeJob(input: CloseCompletedJobInput): Promise<CloseCompletedJobResult> {
    return this.delegate.closeJob(input);
  }

  async submitRequest(input: SubmitCompletedRequestInput): Promise<SubmitCompletedRequestResult> {
    return this.delegate.submitRequest(input);
  }

  async registerFinding(
    input: RegisterCompletedFindingInput,
  ): Promise<RegisterCompletedFindingResult> {
    return this.delegate.registerFinding(input);
  }

  async getResult(input: GetCompletedResultInput): Promise<GetCompletedResultResult> {
    return this.delegate.getResult(input);
  }

  async stats(input?: CompletedStatsInput): Promise<CompletedStatsResult> {
    return this.delegate.stats(input);
  }
}

// Convenience para obter as canonical capabilities sem duplicar a definição.
export { DEFAULT_COMPLETED_RUNTIME_VERSION, toCanonicalCompletedCapabilities };

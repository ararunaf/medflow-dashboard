/**
 * RealTissIdentityRuntimeAdapter — provider "real-tiss" do Identity Runtime.
 *
 * S2-02: ativação do provider real sem alterar Port, Runtime, Pipeline,
 * Queue, Worker, Scheduler, Retry, Dead Letter, Observability, Foundations ou Composition Root.
 *
 * Reutiliza integralmente DefaultIdentityRuntimeAdapter para lifecycle, retry,
 * telemetry, statistics, health, capabilities, providerInfo, AbortSignal e IdentityRuntimeStore.
 *
 * NÃO implementa: assinatura digital, criptografia, SHA-256, cadeia de custódia,
 * Key Vault, HSM, SIEM, ICP-Brasil, Identity, transmissão externa.
 */
import type { IdentityRuntimePort } from "../ports/identity-runtime-port";
import type { IdentityRuntimeStore } from "../store";
import {
  DEFAULT_IDENTITY_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalIdentityCapabilities,
} from "../ports/capabilities";
import {
  DEFAULT_IDENTITY_RUNTIME_VERSION,
  DefaultIdentityRuntimeAdapter,
  type DefaultIdentityRuntimeAdapterOptions,
} from "./default-identity-runtime-adapter";
import type {
  IdentityRuntimeCapabilities,
  IdentityRuntimeHealth,
  IdentityRuntimeInfo,
  IdentityRuntimeProviderId,
  IdentityRuntimeProviderMetadata,
  IdentityStatsInput,
  IdentityStatsResult,
  CloseIdentityJobInput,
  CloseIdentityJobResult,
  GetIdentityResultInput,
  GetIdentityResultResult,
  OpenIdentityJobInput,
  OpenIdentityJobResult,
  RegisterIdentityFindingInput,
  RegisterIdentityFindingResult,
  SubmitIdentityRequestInput,
  SubmitIdentityRequestResult,
} from "../ports/types";

export const REALTISS_IDENTITY_RUNTIME_ADAPTER_ID = "real-tiss-identity-runtime";
export const REALTISS_IDENTITY_RUNTIME_VERSION = "1.0.0";

export const REALTISS_IDENTITY_IDENTITY: IdentityRuntimeProviderMetadata = {
  name: "RealTiss Identity Runtime",
  version: REALTISS_IDENTITY_RUNTIME_VERSION,
  vendor: "real-tiss",
  layer: "Foundation",
  vendorAgnostic: false,
  description:
    "RealTiss structural identity runtime adapter — reuses DefaultIdentityRuntimeAdapter lifecycle, retry, telemetry, statistics and store. No real identity, no cryptography, no digital signature, no chain of custody.",
};

export type RealTissIdentityRuntimeAdapterOptions = Omit<
  DefaultIdentityRuntimeAdapterOptions,
  "provider"
> & {
  /** Provider confirmado (sempre "real-tiss"); preservado para compatibilidade com factory. */
  provider?: Extract<IdentityRuntimeProviderId, "real-tiss">;
};

/**
 * RealTiss Identity Runtime — delega todos os métodos operacionais ao
 * DefaultIdentityRuntimeAdapter e expõe identidade própria de provider.
 */
export class RealTissIdentityRuntimeAdapter implements IdentityRuntimePort {
  readonly providerId: Extract<IdentityRuntimeProviderId, "real-tiss"> = "real-tiss";

  private readonly delegate: DefaultIdentityRuntimeAdapter;
  private readonly metadata: IdentityRuntimeProviderMetadata;
  private readonly healthy: boolean;

  constructor(options: RealTissIdentityRuntimeAdapterOptions = {}) {
    this.metadata = REALTISS_IDENTITY_IDENTITY;
    this.healthy = options.healthy ?? true;

    this.delegate = new DefaultIdentityRuntimeAdapter({
      provider: "enterprise",
      healthy: this.healthy,
      message:
        options.message ??
        `${this.providerId} Identity Runtime ready (structural only — real provider active).`,
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
  getStore(): IdentityRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): IdentityRuntimeCapabilities {
    const caps = this.delegate.capabilities();
    return {
      ...caps,
      provider: this.providerId,
      adapterId: REALTISS_IDENTITY_RUNTIME_ADAPTER_ID,
    };
  }

  providerInfo(): IdentityRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "IDENTITY_RUNTIME",
      capabilities: { ...DEFAULT_IDENTITY_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<IdentityRuntimeHealth> {
    const h = await this.delegate.health();
    return {
      ...h,
      provider: this.providerId,
    };
  }

  async openJob(input: OpenIdentityJobInput): Promise<OpenIdentityJobResult> {
    return this.delegate.openJob(input);
  }

  async closeJob(input: CloseIdentityJobInput): Promise<CloseIdentityJobResult> {
    return this.delegate.closeJob(input);
  }

  async submitRequest(input: SubmitIdentityRequestInput): Promise<SubmitIdentityRequestResult> {
    return this.delegate.submitRequest(input);
  }

  async registerFinding(
    input: RegisterIdentityFindingInput,
  ): Promise<RegisterIdentityFindingResult> {
    return this.delegate.registerFinding(input);
  }

  async getResult(input: GetIdentityResultInput): Promise<GetIdentityResultResult> {
    return this.delegate.getResult(input);
  }

  async stats(input?: IdentityStatsInput): Promise<IdentityStatsResult> {
    return this.delegate.stats(input);
  }
}

// Convenience para obter as canonical capabilities sem duplicar a definição.
export { DEFAULT_IDENTITY_RUNTIME_VERSION, toCanonicalIdentityCapabilities };

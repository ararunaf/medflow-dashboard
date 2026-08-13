/**
 * RealTissSecurityRuntimeAdapter — provider "real-tiss" do Security Runtime.
 *
 * S1-02: ativação do provider real sem alterar Port, Runtime, Pipeline,
 * Queue, Worker, Scheduler, Retry, Dead Letter, Observability, Foundations ou Composition Root.
 *
 * Reutiliza integralmente DefaultSecurityRuntimeAdapter para lifecycle, retry,
 * telemetry, statistics, health, capabilities, providerInfo, AbortSignal e SecurityRuntimeStore.
 *
 * NÃO implementa: assinatura digital, criptografia, SHA-256, cadeia de custódia,
 * Key Vault, HSM, SIEM, ICP-Brasil, Security, transmissão externa.
 */
import type { SecurityRuntimePort } from "../ports/security-runtime-port";
import type { SecurityRuntimeStore } from "../store";
import {
  DEFAULT_SECURITY_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalSecurityCapabilities,
} from "../ports/capabilities";
import {
  DEFAULT_SECURITY_RUNTIME_VERSION,
  DefaultSecurityRuntimeAdapter,
  type DefaultSecurityRuntimeAdapterOptions,
} from "./default-security-runtime-adapter";
import type {
  SecurityRuntimeCapabilities,
  SecurityRuntimeHealth,
  SecurityRuntimeInfo,
  SecurityRuntimeProviderId,
  SecurityRuntimeProviderMetadata,
  SecurityStatsInput,
  SecurityStatsResult,
  CloseSecurityJobInput,
  CloseSecurityJobResult,
  GetSecurityResultInput,
  GetSecurityResultResult,
  OpenSecurityJobInput,
  OpenSecurityJobResult,
  RegisterSecurityFindingInput,
  RegisterSecurityFindingResult,
  SubmitSecurityRequestInput,
  SubmitSecurityRequestResult,
} from "../ports/types";

export const REALTISS_SECURITY_RUNTIME_ADAPTER_ID = "real-tiss-security-runtime";
export const REALTISS_SECURITY_RUNTIME_VERSION = "1.0.0";

export const REALTISS_SECURITY_IDENTITY: SecurityRuntimeProviderMetadata = {
  name: "RealTiss Security Runtime",
  version: REALTISS_SECURITY_RUNTIME_VERSION,
  vendor: "real-tiss",
  layer: "Foundation",
  vendorAgnostic: false,
  description:
    "RealTiss structural security runtime adapter — reuses DefaultSecurityRuntimeAdapter lifecycle, retry, telemetry, statistics and store. No real security, no cryptography, no digital signature, no chain of custody.",
};

export type RealTissSecurityRuntimeAdapterOptions = Omit<
  DefaultSecurityRuntimeAdapterOptions,
  "provider"
> & {
  /** Provider confirmado (sempre "real-tiss"); preservado para compatibilidade com factory. */
  provider?: Extract<SecurityRuntimeProviderId, "real-tiss">;
};

/**
 * RealTiss Security Runtime — delega todos os métodos operacionais ao
 * DefaultSecurityRuntimeAdapter e expõe identidade própria de provider.
 */
export class RealTissSecurityRuntimeAdapter implements SecurityRuntimePort {
  readonly providerId: Extract<SecurityRuntimeProviderId, "real-tiss"> = "real-tiss";

  private readonly delegate: DefaultSecurityRuntimeAdapter;
  private readonly metadata: SecurityRuntimeProviderMetadata;
  private readonly healthy: boolean;

  constructor(options: RealTissSecurityRuntimeAdapterOptions = {}) {
    this.metadata = REALTISS_SECURITY_IDENTITY;
    this.healthy = options.healthy ?? true;

    this.delegate = new DefaultSecurityRuntimeAdapter({
      provider: "enterprise",
      healthy: this.healthy,
      message:
        options.message ??
        `${this.providerId} Security Runtime ready (structural only — real provider active).`,
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
  getStore(): SecurityRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): SecurityRuntimeCapabilities {
    const caps = this.delegate.capabilities();
    return {
      ...caps,
      provider: this.providerId,
      adapterId: REALTISS_SECURITY_RUNTIME_ADAPTER_ID,
    };
  }

  providerInfo(): SecurityRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "SECURITY_RUNTIME",
      capabilities: { ...DEFAULT_SECURITY_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<SecurityRuntimeHealth> {
    const h = await this.delegate.health();
    return {
      ...h,
      provider: this.providerId,
    };
  }

  async openJob(input: OpenSecurityJobInput): Promise<OpenSecurityJobResult> {
    return this.delegate.openJob(input);
  }

  async closeJob(input: CloseSecurityJobInput): Promise<CloseSecurityJobResult> {
    return this.delegate.closeJob(input);
  }

  async submitRequest(input: SubmitSecurityRequestInput): Promise<SubmitSecurityRequestResult> {
    return this.delegate.submitRequest(input);
  }

  async registerFinding(
    input: RegisterSecurityFindingInput,
  ): Promise<RegisterSecurityFindingResult> {
    return this.delegate.registerFinding(input);
  }

  async getResult(input: GetSecurityResultInput): Promise<GetSecurityResultResult> {
    return this.delegate.getResult(input);
  }

  async stats(input?: SecurityStatsInput): Promise<SecurityStatsResult> {
    return this.delegate.stats(input);
  }
}

// Convenience para obter as canonical capabilities sem duplicar a definição.
export { DEFAULT_SECURITY_RUNTIME_VERSION, toCanonicalSecurityCapabilities };

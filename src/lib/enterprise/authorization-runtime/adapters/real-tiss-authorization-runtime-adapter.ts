/**
 * RealTissAuthorizationRuntimeAdapter — provider "real-tiss" do Authorization Runtime.
 *
 * S3-02: ativação do provider real sem alterar Port, Runtime, Pipeline,
 * Queue, Worker, Scheduler, Retry, Dead Letter, Observability, Foundations ou Composition Root.
 *
 * Reutiliza integralmente DefaultAuthorizationRuntimeAdapter para lifecycle, retry,
 * telemetry, statistics, health, capabilities, providerInfo, AbortSignal e AuthorizationRuntimeStore.
 *
 * NÃO implementa: assinatura digital, criptografia, SHA-256, cadeia de custódia,
 * Key Vault, HSM, SIEM, ICP-Brasil, Authorization, transmissão externa.
 */
import type { AuthorizationRuntimePort } from "../ports/authorization-runtime-port";
import type { AuthorizationRuntimeStore } from "../store";
import {
  DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalAuthorizationCapabilities,
} from "../ports/capabilities";
import {
  DEFAULT_AUTHORIZATION_RUNTIME_VERSION,
  DefaultAuthorizationRuntimeAdapter,
  type DefaultAuthorizationRuntimeAdapterOptions,
} from "./default-authorization-runtime-adapter";
import type {
  AuthorizationRuntimeCapabilities,
  AuthorizationRuntimeHealth,
  AuthorizationRuntimeInfo,
  AuthorizationRuntimeProviderId,
  AuthorizationRuntimeProviderMetadata,
  AuthorizationStatsInput,
  AuthorizationStatsResult,
  CloseAuthorizationJobInput,
  CloseAuthorizationJobResult,
  GetAuthorizationResultInput,
  GetAuthorizationResultResult,
  OpenAuthorizationJobInput,
  OpenAuthorizationJobResult,
  RegisterAuthorizationFindingInput,
  RegisterAuthorizationFindingResult,
  SubmitAuthorizationRequestInput,
  SubmitAuthorizationRequestResult,
} from "../ports/types";

export const REALTISS_AUTHORIZATION_RUNTIME_ADAPTER_ID = "real-tiss-authorization-runtime";
export const REALTISS_AUTHORIZATION_RUNTIME_VERSION = "1.0.0";

export const REALTISS_AUTHORIZATION_IDENTITY: AuthorizationRuntimeProviderMetadata = {
  name: "RealTiss Authorization Runtime",
  version: REALTISS_AUTHORIZATION_RUNTIME_VERSION,
  vendor: "real-tiss",
  layer: "Foundation",
  vendorAgnostic: false,
  description:
    "RealTiss structural authorization runtime adapter — reuses DefaultAuthorizationRuntimeAdapter lifecycle, retry, telemetry, statistics and store. No real authorization, no cryptography, no digital signature, no chain of custody.",
};

export type RealTissAuthorizationRuntimeAdapterOptions = Omit<
  DefaultAuthorizationRuntimeAdapterOptions,
  "provider"
> & {
  /** Provider confirmado (sempre "real-tiss"); preservado para compatibilidade com factory. */
  provider?: Extract<AuthorizationRuntimeProviderId, "real-tiss">;
};

/**
 * RealTiss Authorization Runtime — delega todos os métodos operacionais ao
 * DefaultAuthorizationRuntimeAdapter e expõe identidade própria de provider.
 */
export class RealTissAuthorizationRuntimeAdapter implements AuthorizationRuntimePort {
  readonly providerId: Extract<AuthorizationRuntimeProviderId, "real-tiss"> = "real-tiss";

  private readonly delegate: DefaultAuthorizationRuntimeAdapter;
  private readonly metadata: AuthorizationRuntimeProviderMetadata;
  private readonly healthy: boolean;

  constructor(options: RealTissAuthorizationRuntimeAdapterOptions = {}) {
    this.metadata = REALTISS_AUTHORIZATION_IDENTITY;
    this.healthy = options.healthy ?? true;

    this.delegate = new DefaultAuthorizationRuntimeAdapter({
      provider: "enterprise",
      healthy: this.healthy,
      message:
        options.message ??
        `${this.providerId} Authorization Runtime ready (structural only — real provider active).`,
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
  getStore(): AuthorizationRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): AuthorizationRuntimeCapabilities {
    const caps = this.delegate.capabilities();
    return {
      ...caps,
      provider: this.providerId,
      adapterId: REALTISS_AUTHORIZATION_RUNTIME_ADAPTER_ID,
    };
  }

  providerInfo(): AuthorizationRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "AUTHORIZATION_RUNTIME",
      capabilities: { ...DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<AuthorizationRuntimeHealth> {
    const h = await this.delegate.health();
    return {
      ...h,
      provider: this.providerId,
    };
  }

  async openJob(input: OpenAuthorizationJobInput): Promise<OpenAuthorizationJobResult> {
    return this.delegate.openJob(input);
  }

  async closeJob(input: CloseAuthorizationJobInput): Promise<CloseAuthorizationJobResult> {
    return this.delegate.closeJob(input);
  }

  async submitRequest(
    input: SubmitAuthorizationRequestInput,
  ): Promise<SubmitAuthorizationRequestResult> {
    return this.delegate.submitRequest(input);
  }

  async registerFinding(
    input: RegisterAuthorizationFindingInput,
  ): Promise<RegisterAuthorizationFindingResult> {
    return this.delegate.registerFinding(input);
  }

  async getResult(input: GetAuthorizationResultInput): Promise<GetAuthorizationResultResult> {
    return this.delegate.getResult(input);
  }

  async stats(input?: AuthorizationStatsInput): Promise<AuthorizationStatsResult> {
    return this.delegate.stats(input);
  }
}

// Convenience para obter as canonical capabilities sem duplicar a definição.
export { DEFAULT_AUTHORIZATION_RUNTIME_VERSION, toCanonicalAuthorizationCapabilities };

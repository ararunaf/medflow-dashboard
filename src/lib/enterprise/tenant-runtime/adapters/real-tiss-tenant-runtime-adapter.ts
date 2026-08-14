/**
 * RealTissTenantRuntimeAdapter — provider "real-tiss" do Tenant Runtime.
 *
 * S3-02: ativação do provider real sem alterar Port, Runtime, Pipeline,
 * Queue, Worker, Scheduler, Retry, Dead Letter, Observability, Foundations ou Composition Root.
 *
 * Reutiliza integralmente DefaultTenantRuntimeAdapter para lifecycle, retry,
 * telemetry, statistics, health, capabilities, providerInfo, AbortSignal e TenantRuntimeStore.
 *
 * NÃO implementa: assinatura digital, criptografia, SHA-256, cadeia de custódia,
 * Key Vault, HSM, SIEM, ICP-Brasil, Tenant, transmissão externa.
 */
import type { TenantRuntimePort } from "../ports/tenant-runtime-port";
import type { TenantRuntimeStore } from "../store";
import {
  DEFAULT_TENANT_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalTenantCapabilities,
} from "../ports/capabilities";
import {
  DEFAULT_TENANT_RUNTIME_VERSION,
  DefaultTenantRuntimeAdapter,
  type DefaultTenantRuntimeAdapterOptions,
} from "./default-tenant-runtime-adapter";
import type {
  TenantRuntimeCapabilities,
  TenantRuntimeHealth,
  TenantRuntimeInfo,
  TenantRuntimeProviderId,
  TenantRuntimeProviderMetadata,
  TenantStatsInput,
  TenantStatsResult,
  CloseTenantJobInput,
  CloseTenantJobResult,
  GetTenantResultInput,
  GetTenantResultResult,
  OpenTenantJobInput,
  OpenTenantJobResult,
  RegisterTenantFindingInput,
  RegisterTenantFindingResult,
  SubmitTenantRequestInput,
  SubmitTenantRequestResult,
} from "../ports/types";

export const REALTISS_TENANT_RUNTIME_ADAPTER_ID = "real-tiss-tenant-runtime";
export const REALTISS_TENANT_RUNTIME_VERSION = "1.0.0";

export const REALTISS_TENANT_IDENTITY: TenantRuntimeProviderMetadata = {
  name: "RealTiss Tenant Runtime",
  version: REALTISS_TENANT_RUNTIME_VERSION,
  vendor: "real-tiss",
  layer: "Foundation",
  vendorAgnostic: false,
  description:
    "RealTiss structural tenant runtime adapter — reuses DefaultTenantRuntimeAdapter lifecycle, retry, telemetry, statistics and store. No real tenant, no cryptography, no digital signature, no chain of custody.",
};

export type RealTissTenantRuntimeAdapterOptions = Omit<
  DefaultTenantRuntimeAdapterOptions,
  "provider"
> & {
  /** Provider confirmado (sempre "real-tiss"); preservado para compatibilidade com factory. */
  provider?: Extract<TenantRuntimeProviderId, "real-tiss">;
};

/**
 * RealTiss Tenant Runtime — delega todos os métodos operacionais ao
 * DefaultTenantRuntimeAdapter e expõe identidade própria de provider.
 */
export class RealTissTenantRuntimeAdapter implements TenantRuntimePort {
  readonly providerId: Extract<TenantRuntimeProviderId, "real-tiss"> = "real-tiss";

  private readonly delegate: DefaultTenantRuntimeAdapter;
  private readonly metadata: TenantRuntimeProviderMetadata;
  private readonly healthy: boolean;

  constructor(options: RealTissTenantRuntimeAdapterOptions = {}) {
    this.metadata = REALTISS_TENANT_IDENTITY;
    this.healthy = options.healthy ?? true;

    this.delegate = new DefaultTenantRuntimeAdapter({
      provider: "enterprise",
      healthy: this.healthy,
      message:
        options.message ??
        `${this.providerId} Tenant Runtime ready (structural only — real provider active).`,
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
  getStore(): TenantRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): TenantRuntimeCapabilities {
    const caps = this.delegate.capabilities();
    return {
      ...caps,
      provider: this.providerId,
      adapterId: REALTISS_TENANT_RUNTIME_ADAPTER_ID,
    };
  }

  providerInfo(): TenantRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "TENANT_RUNTIME",
      capabilities: { ...DEFAULT_TENANT_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<TenantRuntimeHealth> {
    const h = await this.delegate.health();
    return {
      ...h,
      provider: this.providerId,
    };
  }

  async openJob(input: OpenTenantJobInput): Promise<OpenTenantJobResult> {
    return this.delegate.openJob(input);
  }

  async closeJob(input: CloseTenantJobInput): Promise<CloseTenantJobResult> {
    return this.delegate.closeJob(input);
  }

  async submitRequest(input: SubmitTenantRequestInput): Promise<SubmitTenantRequestResult> {
    return this.delegate.submitRequest(input);
  }

  async registerFinding(input: RegisterTenantFindingInput): Promise<RegisterTenantFindingResult> {
    return this.delegate.registerFinding(input);
  }

  async getResult(input: GetTenantResultInput): Promise<GetTenantResultResult> {
    return this.delegate.getResult(input);
  }

  async stats(input?: TenantStatsInput): Promise<TenantStatsResult> {
    return this.delegate.stats(input);
  }
}

// Convenience para obter as canonical capabilities sem duplicar a definição.
export { DEFAULT_TENANT_RUNTIME_VERSION, toCanonicalTenantCapabilities };

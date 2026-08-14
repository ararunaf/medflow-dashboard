/**
 * RealTissGovernanceRuntimeAdapter — provider "real-tiss" do Governance Runtime.
 *
 * S6-02: ativação do provider real sem alterar Port, Runtime, Pipeline,
 * Queue, Worker, Scheduler, Retry, Dead Letter, Observability, Foundations ou Composition Root.
 *
 * Reutiliza integralmente DefaultGovernanceRuntimeAdapter para lifecycle, retry,
 * telemetry, statistics, health, capabilities, providerInfo, AbortSignal e GovernanceRuntimeStore.
 *
 * NÃO implementa: assinatura digital, criptografia, SHA-256, cadeia de custódia,
 * Key Vault, HSM, SIEM, ICP-Brasil, Governance, transmissão externa.
 */
import type { GovernanceRuntimePort } from "../ports/governance-runtime-port";
import type { GovernanceRuntimeStore } from "../store";
import {
  DEFAULT_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalGovernanceCapabilities,
} from "../ports/capabilities";
import {
  DEFAULT_GOVERNANCE_RUNTIME_VERSION,
  DefaultGovernanceRuntimeAdapter,
  type DefaultGovernanceRuntimeAdapterOptions,
} from "./default-governance-runtime-adapter";
import type {
  GovernanceRuntimeCapabilities,
  GovernanceRuntimeHealth,
  GovernanceRuntimeInfo,
  GovernanceRuntimeProviderId,
  GovernanceRuntimeProviderMetadata,
  GovernanceStatsInput,
  GovernanceStatsResult,
  CloseGovernanceJobInput,
  CloseGovernanceJobResult,
  GetGovernanceResultInput,
  GetGovernanceResultResult,
  OpenGovernanceJobInput,
  OpenGovernanceJobResult,
  RegisterGovernanceFindingInput,
  RegisterGovernanceFindingResult,
  SubmitGovernanceRequestInput,
  SubmitGovernanceRequestResult,
} from "../ports/types";

export const REALTISS_GOVERNANCE_RUNTIME_ADAPTER_ID = "real-tiss-governance-runtime";
export const REALTISS_GOVERNANCE_RUNTIME_VERSION = "1.0.0";

export const REALTISS_GOVERNANCE_IDENTITY: GovernanceRuntimeProviderMetadata = {
  name: "RealTiss Governance Runtime",
  version: REALTISS_GOVERNANCE_RUNTIME_VERSION,
  vendor: "real-tiss",
  layer: "Foundation",
  vendorAgnostic: false,
  description:
    "RealTiss structural governance runtime adapter — reuses DefaultGovernanceRuntimeAdapter lifecycle, retry, telemetry, statistics and store. No real governance, no cryptography, no digital signature, no chain of custody.",
};

export type RealTissGovernanceRuntimeAdapterOptions = Omit<
  DefaultGovernanceRuntimeAdapterOptions,
  "provider"
> & {
  /** Provider confirmado (sempre "real-tiss"); preservado para compatibilidade com factory. */
  provider?: Extract<GovernanceRuntimeProviderId, "real-tiss">;
};

/**
 * RealTiss Governance Runtime — delega todos os métodos operacionais ao
 * DefaultGovernanceRuntimeAdapter e expõe identidade própria de provider.
 */
export class RealTissGovernanceRuntimeAdapter implements GovernanceRuntimePort {
  readonly providerId: Extract<GovernanceRuntimeProviderId, "real-tiss"> = "real-tiss";

  private readonly delegate: DefaultGovernanceRuntimeAdapter;
  private readonly metadata: GovernanceRuntimeProviderMetadata;
  private readonly healthy: boolean;

  constructor(options: RealTissGovernanceRuntimeAdapterOptions = {}) {
    this.metadata = REALTISS_GOVERNANCE_IDENTITY;
    this.healthy = options.healthy ?? true;

    this.delegate = new DefaultGovernanceRuntimeAdapter({
      provider: "enterprise",
      healthy: this.healthy,
      message:
        options.message ??
        `${this.providerId} Governance Runtime ready (structural only — real provider active).`,
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
  getStore(): GovernanceRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): GovernanceRuntimeCapabilities {
    const caps = this.delegate.capabilities();
    return {
      ...caps,
      provider: this.providerId,
      adapterId: REALTISS_GOVERNANCE_RUNTIME_ADAPTER_ID,
    };
  }

  providerInfo(): GovernanceRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "GOVERNANCE_RUNTIME",
      capabilities: { ...DEFAULT_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<GovernanceRuntimeHealth> {
    const h = await this.delegate.health();
    return {
      ...h,
      provider: this.providerId,
    };
  }

  async openJob(input: OpenGovernanceJobInput): Promise<OpenGovernanceJobResult> {
    return this.delegate.openJob(input);
  }

  async closeJob(input: CloseGovernanceJobInput): Promise<CloseGovernanceJobResult> {
    return this.delegate.closeJob(input);
  }

  async submitRequest(input: SubmitGovernanceRequestInput): Promise<SubmitGovernanceRequestResult> {
    return this.delegate.submitRequest(input);
  }

  async registerFinding(
    input: RegisterGovernanceFindingInput,
  ): Promise<RegisterGovernanceFindingResult> {
    return this.delegate.registerFinding(input);
  }

  async getResult(input: GetGovernanceResultInput): Promise<GetGovernanceResultResult> {
    return this.delegate.getResult(input);
  }

  async stats(input?: GovernanceStatsInput): Promise<GovernanceStatsResult> {
    return this.delegate.stats(input);
  }
}

// Convenience para obter as canonical capabilities sem duplicar a definição.
export { DEFAULT_GOVERNANCE_RUNTIME_VERSION, toCanonicalGovernanceCapabilities };

/**
 * RealTissComplianceRuntimeAdapter — provider "real-tiss" do Compliance Runtime.
 *
 * S3-02: ativação do provider real sem alterar Port, Runtime, Pipeline,
 * Queue, Worker, Scheduler, Retry, Dead Letter, Observability, Foundations ou Composition Root.
 *
 * Reutiliza integralmente DefaultComplianceRuntimeAdapter para lifecycle, retry,
 * telemetry, statistics, health, capabilities, providerInfo, AbortSignal e ComplianceRuntimeStore.
 *
 * NÃO implementa: assinatura digital, criptografia, SHA-256, cadeia de custódia,
 * Key Vault, HSM, SIEM, ICP-Brasil, Compliance, transmissão externa.
 */
import type { ComplianceRuntimePort } from "../ports/compliance-runtime-port";
import type { ComplianceRuntimeStore } from "../store";
import {
  DEFAULT_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalComplianceCapabilities,
} from "../ports/capabilities";
import {
  DEFAULT_COMPLIANCE_RUNTIME_VERSION,
  DefaultComplianceRuntimeAdapter,
  type DefaultComplianceRuntimeAdapterOptions,
} from "./default-compliance-runtime-adapter";
import type {
  ComplianceRuntimeCapabilities,
  ComplianceRuntimeHealth,
  ComplianceRuntimeInfo,
  ComplianceRuntimeProviderId,
  ComplianceRuntimeProviderMetadata,
  ComplianceStatsInput,
  ComplianceStatsResult,
  CloseComplianceJobInput,
  CloseComplianceJobResult,
  GetComplianceResultInput,
  GetComplianceResultResult,
  OpenComplianceJobInput,
  OpenComplianceJobResult,
  RegisterComplianceFindingInput,
  RegisterComplianceFindingResult,
  SubmitComplianceRequestInput,
  SubmitComplianceRequestResult,
} from "../ports/types";

export const REALTISS_COMPLIANCE_RUNTIME_ADAPTER_ID = "real-tiss-compliance-runtime";
export const REALTISS_COMPLIANCE_RUNTIME_VERSION = "1.0.0";

export const REALTISS_COMPLIANCE_IDENTITY: ComplianceRuntimeProviderMetadata = {
  name: "RealTiss Compliance Runtime",
  version: REALTISS_COMPLIANCE_RUNTIME_VERSION,
  vendor: "real-tiss",
  layer: "Foundation",
  vendorAgnostic: false,
  description:
    "RealTiss structural compliance runtime adapter — reuses DefaultComplianceRuntimeAdapter lifecycle, retry, telemetry, statistics and store. No real compliance, no cryptography, no digital signature, no chain of custody.",
};

export type RealTissComplianceRuntimeAdapterOptions = Omit<
  DefaultComplianceRuntimeAdapterOptions,
  "provider"
> & {
  /** Provider confirmado (sempre "real-tiss"); preservado para compatibilidade com factory. */
  provider?: Extract<ComplianceRuntimeProviderId, "real-tiss">;
};

/**
 * RealTiss Compliance Runtime — delega todos os métodos operacionais ao
 * DefaultComplianceRuntimeAdapter e expõe identidade própria de provider.
 */
export class RealTissComplianceRuntimeAdapter implements ComplianceRuntimePort {
  readonly providerId: Extract<ComplianceRuntimeProviderId, "real-tiss"> = "real-tiss";

  private readonly delegate: DefaultComplianceRuntimeAdapter;
  private readonly metadata: ComplianceRuntimeProviderMetadata;
  private readonly healthy: boolean;

  constructor(options: RealTissComplianceRuntimeAdapterOptions = {}) {
    this.metadata = REALTISS_COMPLIANCE_IDENTITY;
    this.healthy = options.healthy ?? true;

    this.delegate = new DefaultComplianceRuntimeAdapter({
      provider: "enterprise",
      healthy: this.healthy,
      message:
        options.message ??
        `${this.providerId} Compliance Runtime ready (structural only — real provider active).`,
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
  getStore(): ComplianceRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): ComplianceRuntimeCapabilities {
    const caps = this.delegate.capabilities();
    return {
      ...caps,
      provider: this.providerId,
      adapterId: REALTISS_COMPLIANCE_RUNTIME_ADAPTER_ID,
    };
  }

  providerInfo(): ComplianceRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "COMPLIANCE_RUNTIME",
      capabilities: { ...DEFAULT_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<ComplianceRuntimeHealth> {
    const h = await this.delegate.health();
    return {
      ...h,
      provider: this.providerId,
    };
  }

  async openJob(input: OpenComplianceJobInput): Promise<OpenComplianceJobResult> {
    return this.delegate.openJob(input);
  }

  async closeJob(input: CloseComplianceJobInput): Promise<CloseComplianceJobResult> {
    return this.delegate.closeJob(input);
  }

  async submitRequest(input: SubmitComplianceRequestInput): Promise<SubmitComplianceRequestResult> {
    return this.delegate.submitRequest(input);
  }

  async registerFinding(
    input: RegisterComplianceFindingInput,
  ): Promise<RegisterComplianceFindingResult> {
    return this.delegate.registerFinding(input);
  }

  async getResult(input: GetComplianceResultInput): Promise<GetComplianceResultResult> {
    return this.delegate.getResult(input);
  }

  async stats(input?: ComplianceStatsInput): Promise<ComplianceStatsResult> {
    return this.delegate.stats(input);
  }
}

// Convenience para obter as canonical capabilities sem duplicar a definição.
export { DEFAULT_COMPLIANCE_RUNTIME_VERSION, toCanonicalComplianceCapabilities };

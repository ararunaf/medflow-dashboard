/**
 * RealTissAuditRuntimeAdapter — provider "real-tiss" do Audit Runtime.
 *
 * F3-CAP-10: ativação do provider real sem alterar Port, Runtime, Pipeline,
 * Queue, Worker, Scheduler, Retry, Dead Letter, Observability, Foundations ou Composition Root.
 *
 * Reutiliza integralmente DefaultAuditRuntimeAdapter para lifecycle, retry,
 * observability (shape-check), telemetry, statistics, health, capabilities,
 * providerInfo, AbortSignal e AuditRuntimeStore.
 *
 * NÃO implementa: assinatura digital, criptografia, SHA-256, cadeia de custódia,
 * Key Vault, HSM, SIEM, ICP-Brasil, Security Runtime, Completed, transmissão externa.
 */
import type { AuditRuntimePort } from "../ports/audit-runtime-port";
import type { AuditRuntimeStore } from "../store";
import {
  DEFAULT_AUDIT_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalAuditCapabilities,
} from "../ports/capabilities";
import {
  DEFAULT_AUDIT_RUNTIME_VERSION,
  DefaultAuditRuntimeAdapter,
  type DefaultAuditRuntimeAdapterOptions,
} from "./default-audit-runtime-adapter";
import type {
  AuditRuntimeCapabilities,
  AuditRuntimeEnterpriseDeps,
  AuditRuntimeHealth,
  AuditRuntimeInfo,
  AuditRuntimeProviderId,
  AuditRuntimeProviderMetadata,
  AuditStatsInput,
  AuditStatsResult,
  CloseAuditJobInput,
  CloseAuditJobResult,
  GetAuditResultInput,
  GetAuditResultResult,
  OpenAuditJobInput,
  OpenAuditJobResult,
  RegisterAuditFindingInput,
  RegisterAuditFindingResult,
  SubmitAuditRequestInput,
  SubmitAuditRequestResult,
} from "../ports/types";

export const REALTISS_AUDIT_RUNTIME_ADAPTER_ID = "real-tiss-audit-runtime";
export const REALTISS_AUDIT_RUNTIME_VERSION = "1.0.0";

export const REALTISS_AUDIT_IDENTITY: AuditRuntimeProviderMetadata = {
  name: "RealTiss Audit Runtime",
  version: REALTISS_AUDIT_RUNTIME_VERSION,
  vendor: "real-tiss",
  layer: "Foundation",
  vendorAgnostic: false,
  description:
    "RealTiss structural audit runtime adapter — reuses DefaultAuditRuntimeAdapter lifecycle, retry, telemetry, statistics and store. No real audit, no security, no Completed.",
};

export type RealTissAuditRuntimeAdapterOptions = Omit<
  DefaultAuditRuntimeAdapterOptions,
  "provider"
> & {
  /** Provider confirmado (sempre "real-tiss"); preservado para compatibilidade com factory. */
  provider?: Extract<AuditRuntimeProviderId, "real-tiss">;
};

/**
 * RealTiss Audit Runtime — delega todos os métodos operacionais ao
 * DefaultAuditRuntimeAdapter e expõe identidade própria de provider.
 */
export class RealTissAuditRuntimeAdapter implements AuditRuntimePort {
  readonly providerId: Extract<AuditRuntimeProviderId, "real-tiss"> = "real-tiss";

  private readonly delegate: DefaultAuditRuntimeAdapter;
  private readonly metadata: AuditRuntimeProviderMetadata;
  private readonly healthy: boolean;

  constructor(options: RealTissAuditRuntimeAdapterOptions = {}) {
    this.metadata = REALTISS_AUDIT_IDENTITY;
    this.healthy = options.healthy ?? true;

    this.delegate = new DefaultAuditRuntimeAdapter({
      provider: "enterprise",
      healthy: this.healthy,
      message:
        options.message ??
        `${this.providerId} Audit Runtime ready (structural only — real provider active).`,
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
  getStore(): AuditRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): AuditRuntimeCapabilities {
    const caps = this.delegate.capabilities();
    return {
      ...caps,
      provider: this.providerId,
      adapterId: REALTISS_AUDIT_RUNTIME_ADAPTER_ID,
    };
  }

  providerInfo(): AuditRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "AUDIT_RUNTIME",
      capabilities: { ...DEFAULT_AUDIT_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<AuditRuntimeHealth> {
    const h = await this.delegate.health();
    return {
      ...h,
      provider: this.providerId,
    };
  }

  async openJob(input: OpenAuditJobInput): Promise<OpenAuditJobResult> {
    return this.delegate.openJob(input);
  }

  async closeJob(input: CloseAuditJobInput): Promise<CloseAuditJobResult> {
    return this.delegate.closeJob(input);
  }

  async submitRequest(input: SubmitAuditRequestInput): Promise<SubmitAuditRequestResult> {
    return this.delegate.submitRequest(input);
  }

  async registerFinding(input: RegisterAuditFindingInput): Promise<RegisterAuditFindingResult> {
    return this.delegate.registerFinding(input);
  }

  async getResult(input: GetAuditResultInput): Promise<GetAuditResultResult> {
    return this.delegate.getResult(input);
  }

  async stats(input?: AuditStatsInput): Promise<AuditStatsResult> {
    return this.delegate.stats(input);
  }
}

// Convenience para obter as canonical capabilities sem duplicar a definição.
export { DEFAULT_AUDIT_RUNTIME_VERSION, toCanonicalAuditCapabilities };

/**
 * MockAuditRuntimeAdapter — F3-CAP-10.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem auditoria real. Sem IA. Sem regras TISS/operadoras.
 *
 * Delega sempre ao Default (mesmo sem enterpriseDeps).
 */
import {
  DEFAULT_MOCK_AUDIT_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalAuditCapabilities,
} from "../ports/capabilities";
import type { AuditRuntimePort } from "../ports/audit-runtime-port";
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
import type { AuditRuntimeStore } from "../store";
import { InMemoryAuditRuntimeStore } from "../store";
import { DefaultAuditRuntimeAdapter } from "./default-audit-runtime-adapter";

export const MOCK_AUDIT_RUNTIME_ADAPTER_ID = "mock-deterministic-audit-runtime";
export const DEFAULT_MOCK_AUDIT_RUNTIME_VERSION = "1.0.0";

export type MockAuditRuntimeAdapterOptions = {
  provider?: Extract<AuditRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: AuditRuntimeStore;
  enterpriseDeps?: AuditRuntimeEnterpriseDeps;
  now?: () => string;
};

function mockMetadata(
  providerId: Extract<AuditRuntimeProviderId, "mock" | "test">,
): AuditRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test Audit Runtime" : "Mock Audit Runtime",
    version: DEFAULT_MOCK_AUDIT_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description: "Deterministic in-process Audit Runtime mock — no network, no real audit.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico (simulated:true).
 */
export class MockAuditRuntimeAdapter implements AuditRuntimePort {
  readonly providerId: Extract<AuditRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: AuditRuntimeProviderMetadata;
  private readonly delegate: DefaultAuditRuntimeAdapter;

  constructor(options: MockAuditRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} Audit Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultAuditRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store ?? new InMemoryAuditRuntimeStore(),
      enterpriseDeps: options.enterpriseDeps,
      now: options.now,
    });
  }

  getStore(): AuditRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): AuditRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_AUDIT_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsOpenJob: true,
      supportsCloseJob: true,
      supportsSubmitRequest: true,
      supportsRegisterFinding: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalAudit: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
      usesAIOrchestrationRuntimePort: true,
      usesValidationRuntimePort: true,
      usesDocumentExtractionRuntimePort: true,
      usesDocumentClassificationRuntimePort: true,
      usesOCRRuntimePort: true,
      usesIntelligentCaptureRuntimePort: true,
      usesScannerRuntimePort: true,
      usesWatchFolderRuntimePort: true,
      usesUploadRuntimePort: true,
      usesPersistentQueueRuntimePort: true,
      usesWorkerRuntimePort: true,
      usesSchedulerRuntimePort: true,
      usesObservabilityRuntimePort: true,
      usesScalabilityRuntimePort: true,
      runtimeReady: true,
      auditEngineImplemented: false,
      businessRulesImplemented: false,
      tissAuditImplemented: false,
      operatorAuditImplemented: false,
      automaticAuditImplemented: false,
      auditSuggestionsImplemented: false,
      auditJustificationImplemented: false,
      auditScoreImplemented: false,
      complianceImplemented: false,
      automaticCorrectionImplemented: false,
      engine: { ...DEFAULT_MOCK_AUDIT_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toCanonicalAuditCapabilities(DEFAULT_MOCK_AUDIT_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): AuditRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "AUDIT_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_AUDIT_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<AuditRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async openJob(input: OpenAuditJobInput): Promise<OpenAuditJobResult> {
    const result = await this.delegate.openJob(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async closeJob(input: CloseAuditJobInput): Promise<CloseAuditJobResult> {
    const result = await this.delegate.closeJob(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async submitRequest(input: SubmitAuditRequestInput): Promise<SubmitAuditRequestResult> {
    const result = await this.delegate.submitRequest(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async registerFinding(input: RegisterAuditFindingInput): Promise<RegisterAuditFindingResult> {
    const result = await this.delegate.registerFinding(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getResult(input: GetAuditResultInput): Promise<GetAuditResultResult> {
    const result = await this.delegate.getResult(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: AuditStatsInput): Promise<AuditStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}

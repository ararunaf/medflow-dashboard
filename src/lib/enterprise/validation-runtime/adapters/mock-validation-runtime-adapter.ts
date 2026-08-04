/**
 * MockValidationRuntimeAdapter — F3-CAP-08.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem validação real. Sem auditoria/IA/ML/LLM/TISS/operadoras.
 *
 * Delega sempre ao Default (mesmo sem enterpriseDeps).
 */
import {
  DEFAULT_MOCK_VALIDATION_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalValidationCapabilities,
} from "../ports/capabilities";
import type { ValidationRuntimePort } from "../ports/validation-runtime-port";
import type {
  CloseValidationJobInput,
  CloseValidationJobResult,
  GetValidationResultInput,
  GetValidationResultResult,
  OpenValidationJobInput,
  OpenValidationJobResult,
  RegisterValidationDocumentInput,
  RegisterValidationDocumentResult,
  SubmitValidationRequestInput,
  SubmitValidationRequestResult,
  ValidationRuntimeCapabilities,
  ValidationRuntimeEnterpriseDeps,
  ValidationRuntimeHealth,
  ValidationRuntimeInfo,
  ValidationRuntimeProviderId,
  ValidationRuntimeProviderMetadata,
  ValidationStatsInput,
  ValidationStatsResult,
} from "../ports/types";
import type { ValidationRuntimeStore } from "../store";
import { InMemoryValidationRuntimeStore } from "../store";
import { DefaultValidationRuntimeAdapter } from "./default-validation-runtime-adapter";

export const MOCK_VALIDATION_RUNTIME_ADAPTER_ID = "mock-deterministic-validation-runtime";
export const DEFAULT_MOCK_VALIDATION_RUNTIME_VERSION = "1.0.0";

export type MockValidationRuntimeAdapterOptions = {
  provider?: Extract<ValidationRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: ValidationRuntimeStore;
  enterpriseDeps?: ValidationRuntimeEnterpriseDeps;
  now?: () => string;
};

function mockMetadata(
  providerId: Extract<ValidationRuntimeProviderId, "mock" | "test">,
): ValidationRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test Validation Runtime" : "Mock Validation Runtime",
    version: DEFAULT_MOCK_VALIDATION_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process Validation Runtime mock — no network, no real validation.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico (simulated:true).
 */
export class MockValidationRuntimeAdapter implements ValidationRuntimePort {
  readonly providerId: Extract<ValidationRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: ValidationRuntimeProviderMetadata;
  private readonly delegate: DefaultValidationRuntimeAdapter;

  constructor(options: MockValidationRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ?? `${this.providerId} Validation Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultValidationRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store ?? new InMemoryValidationRuntimeStore(),
      enterpriseDeps: options.enterpriseDeps,
      now: options.now,
    });
  }

  getStore(): ValidationRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): ValidationRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_VALIDATION_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsOpenJob: true,
      supportsCloseJob: true,
      supportsSubmitRequest: true,
      supportsRegisterDocument: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalValidation: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
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
      fieldValidationImplemented: false,
      documentValidationImplemented: false,
      templateValidationImplemented: false,
      operatorValidationImplemented: false,
      tissValidationImplemented: false,
      confidenceValidationImplemented: false,
      qualityValidationImplemented: false,
      mandatoryFieldValidationImplemented: false,
      crossFieldValidationImplemented: false,
      businessRuleValidationImplemented: false,
      automaticApprovalImplemented: false,
      automaticRejectionImplemented: false,
      engine: { ...DEFAULT_MOCK_VALIDATION_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toCanonicalValidationCapabilities(
        DEFAULT_MOCK_VALIDATION_RUNTIME_ENGINE_CAPABILITIES,
      ),
    };
  }

  providerInfo(): ValidationRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "VALIDATION_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_VALIDATION_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<ValidationRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async openJob(input: OpenValidationJobInput): Promise<OpenValidationJobResult> {
    const result = await this.delegate.openJob(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async closeJob(input: CloseValidationJobInput): Promise<CloseValidationJobResult> {
    const result = await this.delegate.closeJob(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async submitRequest(input: SubmitValidationRequestInput): Promise<SubmitValidationRequestResult> {
    const result = await this.delegate.submitRequest(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async registerDocument(
    input: RegisterValidationDocumentInput,
  ): Promise<RegisterValidationDocumentResult> {
    const result = await this.delegate.registerDocument(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getResult(input: GetValidationResultInput): Promise<GetValidationResultResult> {
    const result = await this.delegate.getResult(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: ValidationStatsInput): Promise<ValidationStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}

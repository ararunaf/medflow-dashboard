/**
 * MockDocumentExtractionRuntimeAdapter — F3-CAP-07.
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem extração real. Sem OCR/IA/ML/LLM/Regex/Template Matching.
 *
 * Delega sempre ao Default (mesmo sem enterpriseDeps).
 */
import {
  DEFAULT_MOCK_DOCUMENT_EXTRACTION_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalExtractionCapabilities,
} from "../ports/capabilities";
import type { DocumentExtractionRuntimePort } from "../ports/document-extraction-runtime-port";
import type {
  CloseExtractionJobInput,
  CloseExtractionJobResult,
  DocumentExtractionRuntimeCapabilities,
  DocumentExtractionRuntimeEnterpriseDeps,
  DocumentExtractionRuntimeHealth,
  DocumentExtractionRuntimeInfo,
  DocumentExtractionRuntimeProviderId,
  DocumentExtractionRuntimeProviderMetadata,
  ExtractionStatsInput,
  ExtractionStatsResult,
  GetExtractionResultInput,
  GetExtractionResultResult,
  OpenExtractionJobInput,
  OpenExtractionJobResult,
  RegisterExtractionDocumentInput,
  RegisterExtractionDocumentResult,
  SubmitExtractionRequestInput,
  SubmitExtractionRequestResult,
} from "../ports/types";
import type { DocumentExtractionRuntimeStore } from "../store";
import { InMemoryDocumentExtractionRuntimeStore } from "../store";
import { DefaultDocumentExtractionRuntimeAdapter } from "./default-document-extraction-runtime-adapter";

export const MOCK_DOCUMENT_EXTRACTION_RUNTIME_ADAPTER_ID =
  "mock-deterministic-document-extraction-runtime";
export const DEFAULT_MOCK_DOCUMENT_EXTRACTION_RUNTIME_VERSION = "1.0.0";

export type MockDocumentExtractionRuntimeAdapterOptions = {
  provider?: Extract<DocumentExtractionRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: DocumentExtractionRuntimeStore;
  enterpriseDeps?: DocumentExtractionRuntimeEnterpriseDeps;
  now?: () => string;
};

function mockMetadata(
  providerId: Extract<DocumentExtractionRuntimeProviderId, "mock" | "test">,
): DocumentExtractionRuntimeProviderMetadata {
  return {
    name:
      providerId === "test"
        ? "Test Document Extraction Runtime"
        : "Mock Document Extraction Runtime",
    version: DEFAULT_MOCK_DOCUMENT_EXTRACTION_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process Document Extraction Runtime mock — no network, no real extraction.",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico (simulated:true).
 */
export class MockDocumentExtractionRuntimeAdapter implements DocumentExtractionRuntimePort {
  readonly providerId: Extract<DocumentExtractionRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: DocumentExtractionRuntimeProviderMetadata;
  private readonly delegate: DefaultDocumentExtractionRuntimeAdapter;

  constructor(options: MockDocumentExtractionRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ?? `${this.providerId} Document Extraction Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);

    this.delegate = new DefaultDocumentExtractionRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store ?? new InMemoryDocumentExtractionRuntimeStore(),
      enterpriseDeps: options.enterpriseDeps,
      now: options.now,
    });
  }

  getStore(): DocumentExtractionRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): DocumentExtractionRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_DOCUMENT_EXTRACTION_RUNTIME_ADAPTER_ID,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsOpenJob: true,
      supportsCloseJob: true,
      supportsSubmitRequest: true,
      supportsRegisterDocument: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalExtraction: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
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
      fieldExtractionImplemented: false,
      structuredExtractionImplemented: false,
      medicalGuideExtractionImplemented: false,
      tableExtractionImplemented: false,
      templateExtractionImplemented: false,
      automaticMappingImplemented: false,
      confidenceScoreImplemented: false,
      barcodeExtractionImplemented: false,
      qrExtractionImplemented: false,
      pipelineSelectionImplemented: false,
      engine: { ...DEFAULT_MOCK_DOCUMENT_EXTRACTION_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toCanonicalExtractionCapabilities(
        DEFAULT_MOCK_DOCUMENT_EXTRACTION_RUNTIME_ENGINE_CAPABILITIES,
      ),
    };
  }

  providerInfo(): DocumentExtractionRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "DOCUMENT_EXTRACTION_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_DOCUMENT_EXTRACTION_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<DocumentExtractionRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      runtimeReady: true,
    };
  }

  async openJob(input: OpenExtractionJobInput): Promise<OpenExtractionJobResult> {
    const result = await this.delegate.openJob(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async closeJob(input: CloseExtractionJobInput): Promise<CloseExtractionJobResult> {
    const result = await this.delegate.closeJob(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async submitRequest(input: SubmitExtractionRequestInput): Promise<SubmitExtractionRequestResult> {
    const result = await this.delegate.submitRequest(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async registerDocument(
    input: RegisterExtractionDocumentInput,
  ): Promise<RegisterExtractionDocumentResult> {
    const result = await this.delegate.registerDocument(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getResult(input: GetExtractionResultInput): Promise<GetExtractionResultResult> {
    const result = await this.delegate.getResult(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: ExtractionStatsInput): Promise<ExtractionStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }
}

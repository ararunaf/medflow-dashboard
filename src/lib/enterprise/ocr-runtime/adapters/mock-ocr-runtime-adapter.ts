/**
 * MockOCRRuntimeAdapter — F3-CAP-05 (+ DIP-03 preservado).
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem OCR real. Sem Tesseract/Azure/Google/AWS/ABBYY/PaddleOCR.
 *
 * Delega sempre ao Default (mesmo sem enterpriseDeps — DefaultOCRRuntimeAdapter
 * aceita deps opcionais). Quando enterpriseDeps.getOrchestratorPort +
 * getOCRProviderPort estão presentes, process()/coordinateOcr() coordenam via
 * Orchestrator + OCR Provider Adapter (mesma cadeia do default).
 */
import {
  DEFAULT_MOCK_OCR_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalOCRCapabilities,
} from "../ports/capabilities";
import type { OCRRuntimePort } from "../ports/ocr-runtime-port";
import type {
  CloseOCRJobInput,
  CloseOCRJobResult,
  CoordinateOCRInput,
  CoordinateOCRResult,
  GetOCRResultInput,
  GetOCRResultResult,
  GetOCRRuntimeSessionInput,
  GetOCRRuntimeSessionResult,
  ListOCRProviderReferencesResult,
  ListOCRRuntimeSessionsInput,
  ListOCRRuntimeSessionsResult,
  OCRRuntimeCapabilities,
  OCRRuntimeEnterpriseDeps,
  OCRRuntimeHealth,
  OCRRuntimeInfo,
  OCRRuntimeProviderId,
  OCRRuntimeProviderMetadata,
  OCRStatsInput,
  OCRStatsResult,
  OpenOCRJobInput,
  OpenOCRJobResult,
  ProcessOCRInput,
  ProcessOCRResult,
  RegisterOCRDocumentInput,
  RegisterOCRDocumentResult,
  SubmitOCRRequestInput,
  SubmitOCRRequestResult,
} from "../ports/types";
import type { OCRRuntimeStore } from "../store";
import { InMemoryOCRRuntimeStore } from "../store";
import { DefaultOCRRuntimeAdapter } from "./default-ocr-runtime-adapter";

export const MOCK_OCR_RUNTIME_ADAPTER_ID = "mock-deterministic-ocr-runtime";
export const DEFAULT_MOCK_OCR_RUNTIME_VERSION = "1.0.0";

export type MockOCRRuntimeAdapterOptions = {
  provider?: Extract<OCRRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: OCRRuntimeStore;
  enterpriseDeps?: OCRRuntimeEnterpriseDeps;
  createSessionId?: () => string;
  now?: () => string;
};

function mockMetadata(
  providerId: Extract<OCRRuntimeProviderId, "mock" | "test">,
): OCRRuntimeProviderMetadata {
  return {
    name: providerId === "test" ? "Test OCR Runtime" : "Mock OCR Runtime",
    version: DEFAULT_MOCK_OCR_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process OCR Runtime mock — no network, no real OCR engine (Tesseract/Azure/Google/AWS/ABBYY/PaddleOCR).",
  };
}

/**
 * Mock adapter — delega ao Default em modo canônico (simulated:true).
 */
export class MockOCRRuntimeAdapter implements OCRRuntimePort {
  readonly providerId: Extract<OCRRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: OCRRuntimeProviderMetadata;
  private readonly delegate: DefaultOCRRuntimeAdapter;
  private readonly hasOcrProviderDeps: boolean;

  constructor(options: MockOCRRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} OCR Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);
    this.hasOcrProviderDeps = typeof options.enterpriseDeps?.getOCRProviderPort === "function";

    this.delegate = new DefaultOCRRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: options.store ?? new InMemoryOCRRuntimeStore(),
      enterpriseDeps: options.enterpriseDeps,
      createSessionId: options.createSessionId,
      now: options.now,
    });
  }

  getStore(): OCRRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): OCRRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_OCR_RUNTIME_ADAPTER_ID,
      supportsCoordinateOcr: true,
      supportsProcess: true,
      supportsGetSession: true,
      supportsListSessions: true,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsProviderReferences: true,
      usesEnterpriseRuntimePorts: this.hasOcrProviderDeps,
      usesCanonicalExecutionOrchestrator: this.hasOcrProviderDeps,
      usesOCRProviderAdapter: this.hasOcrProviderDeps,
      usesCaptureEngineRuntime: this.hasOcrProviderDeps,
      supportsPdf: false,
      supportsImage: false,
      supportsBatch: false,
      supportsStreaming: false,
      supportsHandwriting: false,
      supportsTables: false,
      supportsForms: false,
      supportsConfidenceScore: false,
      implementsRealOcr: this.hasOcrProviderDeps,
      implementsAzure: false,
      implementsGoogleVision: false,
      implementsAwsTextract: false,
      implementsTesseract: false,
      implementsAi: false,
      implementsClassification: false,
      implementsXml: false,
      implementsTiss: false,
      // F3-CAP-05 — operações estruturais (sempre disponíveis, sem deps).
      supportsOpenJob: true,
      supportsCloseJob: true,
      supportsSubmitRequest: true,
      supportsRegisterDocument: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalOcr: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
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
      ocrEngineImplemented: false,
      pdfOcrImplemented: false,
      imageOcrImplemented: false,
      documentRecognitionImplemented: false,
      textExtractionImplemented: false,
      barcodeRecognitionImplemented: false,
      qrRecognitionImplemented: false,
      layoutAnalysisImplemented: false,
      tableRecognitionImplemented: false,
      handwritingRecognitionImplemented: false,
      multiEngineImplemented: false,
      confidenceScoreImplemented: false,
      languageDetectionImplemented: false,
      engine: { ...DEFAULT_MOCK_OCR_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toCanonicalOCRCapabilities(DEFAULT_MOCK_OCR_RUNTIME_ENGINE_CAPABILITIES),
    };
  }

  providerInfo(): OCRRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "OCR_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_OCR_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<OCRRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      realOcrAvailable: false,
      runtimeReady: true,
    };
  }

  // ---------------------------------------------------------------------
  // F3-CAP-05 — operações estruturais (delega ao Default; simulated:true).
  // ---------------------------------------------------------------------

  async openJob(input: OpenOCRJobInput): Promise<OpenOCRJobResult> {
    const result = await this.delegate.openJob(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async closeJob(input: CloseOCRJobInput): Promise<CloseOCRJobResult> {
    const result = await this.delegate.closeJob(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async submitRequest(input: SubmitOCRRequestInput): Promise<SubmitOCRRequestResult> {
    const result = await this.delegate.submitRequest(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async registerDocument(input: RegisterOCRDocumentInput): Promise<RegisterOCRDocumentResult> {
    const result = await this.delegate.registerDocument(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getResult(input: GetOCRResultInput): Promise<GetOCRResultResult> {
    const result = await this.delegate.getResult(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: OCRStatsInput): Promise<OCRStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  // ---------------------------------------------------------------------
  // DIP-03 / OCR-01 — coordenação e execução real preservadas (delegate).
  // ---------------------------------------------------------------------

  async process(input: ProcessOCRInput): Promise<ProcessOCRResult> {
    return this.delegate.process(input);
  }

  async coordinateOcr(input: CoordinateOCRInput): Promise<CoordinateOCRResult> {
    return this.delegate.coordinateOcr(input);
  }

  async getSession(input: GetOCRRuntimeSessionInput): Promise<GetOCRRuntimeSessionResult> {
    return this.delegate.getSession(input);
  }

  async listSessions(
    input: ListOCRRuntimeSessionsInput = {},
  ): Promise<ListOCRRuntimeSessionsResult> {
    return this.delegate.listSessions(input);
  }

  async listProviderReferences(): Promise<ListOCRProviderReferencesResult> {
    return this.delegate.listProviderReferences();
  }
}

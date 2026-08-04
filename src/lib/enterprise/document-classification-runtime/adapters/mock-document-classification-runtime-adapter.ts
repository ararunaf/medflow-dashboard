/**
 * MockDocumentClassificationRuntimeAdapter — F3-CAP-06 (+ DIP-04 / CLASS-01 preservado).
 *
 * Implementação totalmente determinística in-process.
 * Sem HTTP. Sem classificação real. Sem IA/LLM/ML/embeddings.
 *
 * Operações estruturais (F3-CAP-06) sempre delegam ao Default (mesmo sem
 * enterpriseDeps — DefaultDocumentClassificationRuntimeAdapter aceita deps
 * opcionais). Quando enterpriseDeps.getOrchestratorPort + getOCRRuntimePort +
 * getDocumentClassificationProviderPort estão presentes, coordinateClassification()/
 * classify() coordenam via a mesma cadeia do default; sem deps, operam apenas
 * no store in-memory (fallback determinístico — sem classificação real).
 */
import { createDocumentClassificationRuntimeSessionId } from "../ports/identity";
import type { DocumentClassificationRuntimePort } from "../ports/document-classification-runtime-port";
import type { CanonicalDocumentClassificationSession } from "../ports/models";
import {
  DEFAULT_MOCK_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES,
  toCanonicalClassificationCapabilities,
} from "../ports/capabilities";
import type {
  ClassificationStatsInput,
  ClassificationStatsResult,
  ClassifyDocumentInput,
  ClassifyDocumentResult,
  CloseClassificationJobInput,
  CloseClassificationJobResult,
  CoordinateClassificationInput,
  CoordinateClassificationResult,
  DocumentClassificationRuntimeCapabilities,
  DocumentClassificationRuntimeEnterpriseDeps,
  DocumentClassificationRuntimeHealth,
  DocumentClassificationRuntimeInfo,
  DocumentClassificationRuntimeProviderId,
  DocumentClassificationRuntimeProviderMetadata,
  GetClassificationResultInput,
  GetClassificationResultResult,
  GetDocumentClassificationRuntimeSessionInput,
  GetDocumentClassificationRuntimeSessionResult,
  ListDocumentClassificationProviderReferencesResult,
  ListDocumentClassificationRuntimeSessionsInput,
  ListDocumentClassificationRuntimeSessionsResult,
  OpenClassificationJobInput,
  OpenClassificationJobResult,
  RegisterClassificationDocumentInput,
  RegisterClassificationDocumentResult,
  SubmitClassificationRequestInput,
  SubmitClassificationRequestResult,
} from "../ports/types";
import { STRUCTURAL_DOCUMENT_CLASSIFICATION_PROVIDER_REFERENCES } from "../ports/types";
import type { DocumentClassificationRuntimeStore } from "../store";
import { InMemoryDocumentClassificationRuntimeStore } from "../store";
import {
  DefaultDocumentClassificationRuntimeAdapter,
  STRUCTURAL_CLASSIFICATION_PROVIDER_ADAPTER_ID,
} from "./default-document-classification-runtime-adapter";

export const MOCK_DOCUMENT_CLASSIFICATION_RUNTIME_ADAPTER_ID =
  "mock-deterministic-document-classification-runtime";
export const DEFAULT_MOCK_DOCUMENT_CLASSIFICATION_RUNTIME_VERSION = "1.0.0";

export type MockDocumentClassificationRuntimeAdapterOptions = {
  provider?: Extract<DocumentClassificationRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: DocumentClassificationRuntimeStore;
  enterpriseDeps?: DocumentClassificationRuntimeEnterpriseDeps;
  createSessionId?: () => string;
  now?: () => string;
};

function mockMetadata(
  providerId: Extract<DocumentClassificationRuntimeProviderId, "mock" | "test">,
): DocumentClassificationRuntimeProviderMetadata {
  return {
    name:
      providerId === "test"
        ? "Test Document Classification Runtime"
        : "Mock Document Classification Runtime",
    version: DEFAULT_MOCK_DOCUMENT_CLASSIFICATION_RUNTIME_VERSION,
    vendor: "medicflow-enterprise",
    layer: "Foundation",
    vendorAgnostic: true,
    description:
      "Deterministic in-process Document Classification Runtime mock — no network, no real classification (no AI/ML/LLM).",
  };
}

/**
 * Mock adapter — delega operações estruturais ao Default (F3-CAP-06);
 * coordenação/execução (DIP-04/CLASS-01) delega quando enterpriseDeps
 * presentes, ou usa fallback store-only determinístico quando ausentes.
 */
export class MockDocumentClassificationRuntimeAdapter implements DocumentClassificationRuntimePort {
  readonly providerId: Extract<DocumentClassificationRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly providerMetadata: DocumentClassificationRuntimeProviderMetadata;
  private readonly store: DocumentClassificationRuntimeStore;
  private readonly delegate: DefaultDocumentClassificationRuntimeAdapter;
  private readonly createSessionId: () => string;
  private readonly now?: () => string;
  private readonly hasClassificationChainDeps: boolean;

  constructor(options: MockDocumentClassificationRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ??
      `${this.providerId} Document Classification Runtime ready (deterministic).`;
    this.providerMetadata = mockMetadata(this.providerId);
    this.store = options.store ?? new InMemoryDocumentClassificationRuntimeStore();
    this.createSessionId = options.createSessionId ?? createDocumentClassificationRuntimeSessionId;
    this.now = options.now;
    this.hasClassificationChainDeps =
      typeof options.enterpriseDeps?.getOrchestratorPort === "function" &&
      typeof options.enterpriseDeps?.getOCRRuntimePort === "function" &&
      typeof options.enterpriseDeps?.getDocumentClassificationProviderPort === "function";

    this.delegate = new DefaultDocumentClassificationRuntimeAdapter({
      provider: "default",
      healthy: this.healthy,
      message: this.message,
      store: this.store,
      enterpriseDeps: options.enterpriseDeps,
      createSessionId: this.createSessionId,
      now: this.now,
    });
  }

  getStore(): DocumentClassificationRuntimeStore {
    return this.store;
  }

  capabilities(): DocumentClassificationRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_DOCUMENT_CLASSIFICATION_RUNTIME_ADAPTER_ID,
      supportsCoordinateClassification: true,
      supportsClassify: true,
      supportsGetSession: true,
      supportsListSessions: true,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsProviderReferences: true,
      usesEnterpriseRuntimePorts: this.hasClassificationChainDeps,
      usesCanonicalExecutionOrchestrator: this.hasClassificationChainDeps,
      usesOCRRuntime: this.hasClassificationChainDeps,
      usesCaptureEngineRuntime: this.hasClassificationChainDeps,
      usesDocumentClassificationProviderAdapter: this.hasClassificationChainDeps,
      supportsMedicalGuideClassification: this.hasClassificationChainDeps,
      supportsInvoiceClassification: this.hasClassificationChainDeps,
      supportsContractClassification: false,
      supportsBatchClassification: false,
      supportsConfidenceScore: this.hasClassificationChainDeps,
      supportsMultiLabelClassification: false,
      supportsCustomModels: false,
      supportsRuleBasedClassification: this.hasClassificationChainDeps,
      implementsRealClassification: this.hasClassificationChainDeps,
      implementsAi: false,
      implementsMachineLearning: false,
      implementsRuleEngine: false,
      implementsEmbeddings: false,
      implementsLlm: false,
      implementsOcrForClassification: false,
      // F3-CAP-06 — operações estruturais (sempre disponíveis, sem deps).
      supportsOpenJob: true,
      supportsCloseJob: true,
      supportsSubmitRequest: true,
      supportsRegisterDocument: true,
      supportsGetResult: true,
      supportsStats: true,
      supportsCanonicalClassification: true,
      supportsTimeout: true,
      supportsRetry: true,
      supportsCancellation: true,
      supportsTelemetry: true,
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
      classificationImplemented: false,
      documentRecognitionImplemented: false,
      templateRecognitionImplemented: false,
      medicalGuideRecognitionImplemented: false,
      documentCategoryImplemented: false,
      automaticRoutingImplemented: false,
      confidenceScoreImplemented: false,
      multiClassifierImplemented: false,
      layoutClassificationImplemented: false,
      semanticClassificationImplemented: false,
      engine: { ...DEFAULT_MOCK_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES },
      canonical: toCanonicalClassificationCapabilities(
        DEFAULT_MOCK_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES,
      ),
    };
  }

  providerInfo(): DocumentClassificationRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.providerMetadata,
      status: this.healthy ? "ready" : "unhealthy",
      providerType: "DOCUMENT_CLASSIFICATION_RUNTIME",
      capabilities: { ...DEFAULT_MOCK_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES },
    };
  }

  async health(): Promise<DocumentClassificationRuntimeHealth> {
    const health = await this.delegate.health();
    return {
      ...health,
      provider: this.providerId,
      message: this.message,
      realClassificationAvailable: false,
      runtimeReady: true,
    };
  }

  // ---------------------------------------------------------------------
  // F3-CAP-06 — operações estruturais (delega ao Default; simulated:true).
  // ---------------------------------------------------------------------

  async openJob(input: OpenClassificationJobInput): Promise<OpenClassificationJobResult> {
    const result = await this.delegate.openJob(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async closeJob(input: CloseClassificationJobInput): Promise<CloseClassificationJobResult> {
    const result = await this.delegate.closeJob(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async submitRequest(
    input: SubmitClassificationRequestInput,
  ): Promise<SubmitClassificationRequestResult> {
    const result = await this.delegate.submitRequest(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async registerDocument(
    input: RegisterClassificationDocumentInput,
  ): Promise<RegisterClassificationDocumentResult> {
    const result = await this.delegate.registerDocument(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async getResult(input: GetClassificationResultInput): Promise<GetClassificationResultResult> {
    const result = await this.delegate.getResult(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  async stats(input?: ClassificationStatsInput): Promise<ClassificationStatsResult> {
    const result = await this.delegate.stats(input);
    return { ...result, provider: this.providerId, simulated: true };
  }

  // ---------------------------------------------------------------------
  // DIP-04 / CLASS-01 — coordenação e execução real preservadas.
  // Com enterpriseDeps completos: delega ao Default (mesma cadeia).
  // Sem enterpriseDeps: fallback determinístico store-only (sem classificação real).
  // ---------------------------------------------------------------------

  async coordinateClassification(
    input: CoordinateClassificationInput,
  ): Promise<CoordinateClassificationResult> {
    if (this.hasClassificationChainDeps) {
      return this.delegate.coordinateClassification(input);
    }

    if (!input.identity?.documentId || !input.metadata?.sessionId) {
      return {
        kind: "canonical-document-classification-result",
        ok: false,
        message: "identity.documentId e metadata.sessionId são obrigatórios.",
        code: "INVALID_INPUT",
        realClassificationExecuted: false,
      };
    }

    const stamp = this.now?.() ?? new Date().toISOString();
    const runtimeSessionId = this.createSessionId();
    const session: CanonicalDocumentClassificationSession = {
      kind: "canonical-document-classification-session",
      runtimeSessionId,
      status: "coordinated",
      request: input,
      executionId: `mock-exec-${runtimeSessionId}`,
      providerReferenceId: "mock",
      classificationProviderAdapterId: STRUCTURAL_CLASSIFICATION_PROVIDER_ADAPTER_ID,
      createdAt: stamp,
      updatedAt: stamp,
      message:
        "Mock classification coordinated (store-only; no Enterprise Ports; no real classification).",
      code: "MOCK_COORDINATED",
      realClassificationExecuted: false,
    };
    this.store.setSession(session);
    return {
      kind: "canonical-document-classification-result",
      ok: true,
      runtimeSessionId,
      session,
      executionId: session.executionId,
      providerReferenceId: "mock",
      message: session.message,
      code: session.code,
      realClassificationExecuted: false,
    };
  }

  async classify(input: ClassifyDocumentInput): Promise<ClassifyDocumentResult> {
    if (this.hasClassificationChainDeps) {
      return this.delegate.classify(input);
    }
    return {
      kind: "canonical-document-classification-result",
      ok: false,
      message: "Mock store-only adapter não executa classify() sem enterpriseDeps.",
      code: "CLASSIFY_UNSUPPORTED",
      realClassificationExecuted: false,
    };
  }

  async getSession(
    input: GetDocumentClassificationRuntimeSessionInput,
  ): Promise<GetDocumentClassificationRuntimeSessionResult> {
    return this.delegate.getSession(input);
  }

  async listSessions(
    input: ListDocumentClassificationRuntimeSessionsInput = {},
  ): Promise<ListDocumentClassificationRuntimeSessionsResult> {
    return this.delegate.listSessions(input);
  }

  async listProviderReferences(): Promise<ListDocumentClassificationProviderReferencesResult> {
    return { ok: true, references: STRUCTURAL_DOCUMENT_CLASSIFICATION_PROVIDER_REFERENCES };
  }
}

/**
 * MockOCRRuntimeAdapter — DIP-03.
 *
 * Voltado para testes e homologação.
 * Quando enterpriseDeps estão presentes, usa Orchestrator + OCR Provider Adapter
 * (mesma cadeia do default). Sem deps, opera somente no store in-memory
 * para isolamento de contrato — sem OCR real e sem implementação paralela de produto.
 */
import { createOCRRuntimeSessionId } from "../ports/identity";
import type { OCRRuntimePort } from "../ports/ocr-runtime-port";
import type { CanonicalOCRSession } from "../ports/models";
import type {
  CoordinateOCRInput,
  CoordinateOCRResult,
  GetOCRRuntimeSessionInput,
  GetOCRRuntimeSessionResult,
  ListOCRProviderReferencesResult,
  ListOCRRuntimeSessionsInput,
  ListOCRRuntimeSessionsResult,
  OCRRuntimeCapabilities,
  OCRRuntimeEnterpriseDeps,
  OCRRuntimeHealth,
  OCRRuntimeProviderId,
} from "../ports/types";
import { STRUCTURAL_OCR_PROVIDER_REFERENCES } from "../ports/types";
import { InMemoryOCRRuntimeStore, type OCRRuntimeStore } from "../store";
import { DefaultOCRRuntimeAdapter } from "./default-ocr-runtime-adapter";

export const MOCK_OCR_RUNTIME_ADAPTER_ID = "mock-in-memory";

export type MockOCRRuntimeAdapterOptions = {
  provider?: Extract<OCRRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: OCRRuntimeStore;
  enterpriseDeps?: OCRRuntimeEnterpriseDeps;
  createSessionId?: () => string;
  now?: () => string;
};

export class MockOCRRuntimeAdapter implements OCRRuntimePort {
  readonly providerId: Extract<OCRRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: OCRRuntimeStore;
  private readonly createSessionId: () => string;
  private readonly now?: () => string;
  private readonly delegate: DefaultOCRRuntimeAdapter | undefined;

  constructor(options: MockOCRRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} ocr-runtime ready (no real OCR).`;
    this.store = options.store ?? new InMemoryOCRRuntimeStore();
    this.createSessionId = options.createSessionId ?? createOCRRuntimeSessionId;
    this.now = options.now;

    if (options.enterpriseDeps) {
      this.delegate = new DefaultOCRRuntimeAdapter({
        enterpriseDeps: options.enterpriseDeps,
        store: this.store,
        createSessionId: this.createSessionId,
        now: this.now,
        ping: async () => ({ ok: this.healthy, message: this.message }),
      });
    }
  }

  capabilities(): OCRRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_OCR_RUNTIME_ADAPTER_ID,
      supportsCoordinateOcr: true,
      supportsGetSession: true,
      supportsListSessions: true,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsProviderReferences: true,
      usesEnterpriseRuntimePorts: Boolean(this.delegate),
      usesCanonicalExecutionOrchestrator: Boolean(this.delegate),
      usesOCRProviderAdapter: Boolean(this.delegate),
      usesCaptureEngineRuntime: Boolean(this.delegate),
      supportsPdf: false,
      supportsImage: false,
      supportsBatch: false,
      supportsStreaming: false,
      supportsHandwriting: false,
      supportsTables: false,
      supportsForms: false,
      supportsConfidenceScore: false,
      implementsRealOcr: false,
      implementsAzure: false,
      implementsGoogleVision: false,
      implementsAwsTextract: false,
      implementsTesseract: false,
      implementsAi: false,
      implementsClassification: false,
      implementsXml: false,
      implementsTiss: false,
    };
  }

  async health(): Promise<OCRRuntimeHealth> {
    if (this.delegate) {
      const health = await this.delegate.health();
      return { ...health, provider: this.providerId, realOcrAvailable: false };
    }
    return {
      ok: this.healthy,
      provider: this.providerId,
      message: this.message,
      realOcrAvailable: false,
    };
  }

  async coordinateOcr(input: CoordinateOCRInput): Promise<CoordinateOCRResult> {
    if (this.delegate) {
      return this.delegate.coordinateOcr(input);
    }

    if (!input.identity?.documentId || !input.metadata?.sessionId) {
      return {
        kind: "canonical-ocr-result",
        ok: false,
        message: "identity.documentId e metadata.sessionId são obrigatórios.",
        code: "INVALID_INPUT",
        realOcrExecuted: false,
      };
    }

    const stamp = this.now?.() ?? new Date().toISOString();
    const runtimeSessionId = this.createSessionId();
    const session: CanonicalOCRSession = {
      kind: "canonical-ocr-session",
      runtimeSessionId,
      status: "coordinated",
      request: input,
      executionId: `mock-exec-${runtimeSessionId}`,
      providerReferenceId: "mock",
      ocrProviderAdapterId: MOCK_OCR_RUNTIME_ADAPTER_ID,
      createdAt: stamp,
      updatedAt: stamp,
      message: "Mock OCR coordinated (store-only; no Enterprise Ports; no real OCR).",
      code: "MOCK_COORDINATED",
      realOcrExecuted: false,
    };
    this.store.setSession(session);
    return {
      kind: "canonical-ocr-result",
      ok: true,
      runtimeSessionId,
      session,
      executionId: session.executionId,
      providerReferenceId: "mock",
      message: session.message,
      code: session.code,
      realOcrExecuted: false,
    };
  }

  async getSession(input: GetOCRRuntimeSessionInput): Promise<GetOCRRuntimeSessionResult> {
    if (this.delegate) return this.delegate.getSession(input);
    const session = this.store.getSession(input.runtimeSessionId);
    if (!session) return { ok: false, message: "not found", code: "not_found" };
    return { ok: true, session };
  }

  async listSessions(
    input: ListOCRRuntimeSessionsInput = {},
  ): Promise<ListOCRRuntimeSessionsResult> {
    if (this.delegate) return this.delegate.listSessions(input);
    const sessions = this.store.listSessions().filter((session) => {
      if (input.status != null && session.status !== input.status) return false;
      if (input.documentId != null && session.request.identity.documentId !== input.documentId) {
        return false;
      }
      if (input.sessionId != null && session.request.metadata.sessionId !== input.sessionId) {
        return false;
      }
      if (input.idPrefix != null && !session.runtimeSessionId.startsWith(input.idPrefix)) {
        return false;
      }
      if (
        input.captureRuntimeSessionId != null &&
        session.request.reference?.captureRuntimeSessionId !== input.captureRuntimeSessionId
      ) {
        return false;
      }
      return true;
    });
    return { ok: true, sessions };
  }

  async listProviderReferences(): Promise<ListOCRProviderReferencesResult> {
    if (this.delegate) return this.delegate.listProviderReferences();
    return { ok: true, references: STRUCTURAL_OCR_PROVIDER_REFERENCES };
  }
}

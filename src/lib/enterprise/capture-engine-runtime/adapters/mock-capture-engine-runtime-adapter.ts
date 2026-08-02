/**
 * MockCaptureEngineRuntimeAdapter — DIP-02.
 *
 * Voltado para testes e homologação.
 * Quando enterpriseDeps estão presentes, usa Orchestrator + DocumentIntakeRuntime
 * (mesma cadeia do default). Sem deps, opera somente no store in-memory
 * para isolamento de contrato — sem implementação funcional paralela de produto.
 */
import { createCaptureRuntimeSessionId } from "../ports/identity";
import type { CaptureEngineRuntimePort } from "../ports/capture-engine-runtime-port";
import type { CanonicalCaptureSession } from "../ports/models";
import type {
  CaptureEngineRuntimeCapabilities,
  CaptureEngineRuntimeEnterpriseDeps,
  CaptureEngineRuntimeHealth,
  CaptureEngineRuntimeProviderId,
  GetCaptureRuntimeSessionInput,
  GetCaptureRuntimeSessionResult,
  ListCaptureRuntimeSessionsInput,
  ListCaptureRuntimeSessionsResult,
  RegisterCaptureInput,
  RegisterCaptureResult,
} from "../ports/types";
import { InMemoryCaptureEngineRuntimeStore, type CaptureEngineRuntimeStore } from "../store";
import { DefaultCaptureEngineRuntimeAdapter } from "./default-capture-engine-runtime-adapter";

export const MOCK_CAPTURE_ENGINE_RUNTIME_ADAPTER_ID = "mock-in-memory";

export type MockCaptureEngineRuntimeAdapterOptions = {
  provider?: Extract<CaptureEngineRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: CaptureEngineRuntimeStore;
  enterpriseDeps?: CaptureEngineRuntimeEnterpriseDeps;
  createSessionId?: () => string;
  now?: () => string;
};

export class MockCaptureEngineRuntimeAdapter implements CaptureEngineRuntimePort {
  readonly providerId: Extract<CaptureEngineRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: CaptureEngineRuntimeStore;
  private readonly createSessionId: () => string;
  private readonly now?: () => string;
  private readonly delegate: DefaultCaptureEngineRuntimeAdapter | undefined;

  constructor(options: MockCaptureEngineRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} capture-engine-runtime ready.`;
    this.store = options.store ?? new InMemoryCaptureEngineRuntimeStore();
    this.createSessionId = options.createSessionId ?? createCaptureRuntimeSessionId;
    this.now = options.now;

    if (options.enterpriseDeps) {
      this.delegate = new DefaultCaptureEngineRuntimeAdapter({
        enterpriseDeps: options.enterpriseDeps,
        store: this.store,
        createSessionId: this.createSessionId,
        now: this.now,
        ping: async () => ({ ok: this.healthy, message: this.message }),
      });
    }
  }

  capabilities(): CaptureEngineRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_CAPTURE_ENGINE_RUNTIME_ADAPTER_ID,
      supportsRegisterCapture: true,
      supportsGetSession: true,
      supportsListSessions: true,
      supportsHealth: true,
      supportsCapabilities: true,
      usesEnterpriseRuntimePorts: Boolean(this.delegate),
      usesCanonicalExecutionOrchestrator: Boolean(this.delegate),
      usesDocumentIntakeRuntime: Boolean(this.delegate),
      usesDocumentIntakePort: Boolean(this.delegate),
      usesOCRRuntime: Boolean(this.delegate),
      usesDocumentClassificationRuntime: Boolean(this.delegate),
      usesStorageManagerRuntime: Boolean(this.delegate),
      usesDocumentSearchRuntime: Boolean(this.delegate),
      implementsOcr: false,
      implementsAi: false,
      implementsXml: false,
      implementsTiss: false,
      implementsParser: false,
      implementsClassification: false,
      implementsWorkflow: false,
      implementsRuleEngine: false,
      implementsStorageManager: false,
      implementsVersioning: false,
      implementsSearch: false,
    };
  }

  async health(): Promise<CaptureEngineRuntimeHealth> {
    if (this.delegate) {
      const health = await this.delegate.health();
      return { ...health, provider: this.providerId };
    }
    return {
      ok: this.healthy,
      provider: this.providerId,
      message: this.message,
    };
  }

  async registerCapture(input: RegisterCaptureInput): Promise<RegisterCaptureResult> {
    if (this.delegate) {
      return this.delegate.registerCapture(input);
    }

    // Contrato isolado (sem Ports) — apenas store; não substitui o fluxo de produto.
    if (!input.identity?.documentId || !input.metadata?.sessionId) {
      return {
        kind: "canonical-capture-result",
        ok: false,
        message: "identity.documentId e metadata.sessionId são obrigatórios.",
        code: "INVALID_INPUT",
      };
    }

    const stamp = this.now?.() ?? new Date().toISOString();
    const runtimeSessionId = this.createSessionId();
    const session: CanonicalCaptureSession = {
      kind: "canonical-capture-session",
      runtimeSessionId,
      status: "registered",
      request: input,
      intakeId: `mock-intake-${runtimeSessionId}`,
      executionId: `mock-exec-${runtimeSessionId}`,
      intakeRuntimeSessionId: `mock-intake-runtime-${runtimeSessionId}`,
      createdAt: stamp,
      updatedAt: stamp,
      message: "Mock capture registered (store-only; no Enterprise Ports).",
      code: "MOCK_REGISTERED",
    };
    this.store.setSession(session);
    return {
      kind: "canonical-capture-result",
      ok: true,
      runtimeSessionId,
      session,
      intakeId: session.intakeId,
      executionId: session.executionId,
      intakeRuntimeSessionId: session.intakeRuntimeSessionId,
      message: session.message,
      code: session.code,
    };
  }

  async getSession(input: GetCaptureRuntimeSessionInput): Promise<GetCaptureRuntimeSessionResult> {
    if (this.delegate) return this.delegate.getSession(input);
    const session = this.store.getSession(input.runtimeSessionId);
    if (!session) return { ok: false, message: "not found", code: "not_found" };
    return { ok: true, session };
  }

  async listSessions(
    input: ListCaptureRuntimeSessionsInput = {},
  ): Promise<ListCaptureRuntimeSessionsResult> {
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
      return true;
    });
    return { ok: true, sessions };
  }
}

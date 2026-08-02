/**
 * MockDocumentIntakeRuntimeAdapter — DIP-01.
 *
 * Voltado para testes e homologação.
 * Quando enterpriseDeps estão presentes, usa Orchestrator + DocumentIntakePort
 * (mesma cadeia do default). Sem deps, opera somente no store in-memory
 * para isolamento de contrato — sem implementação funcional paralela de produto.
 */
import { createRuntimeSessionId } from "../ports/identity";
import type { DocumentIntakeRuntimePort } from "../ports/document-intake-runtime-port";
import type { CanonicalDocumentIntakeSession } from "../ports/models";
import type {
  DocumentIntakeRuntimeCapabilities,
  DocumentIntakeRuntimeEnterpriseDeps,
  DocumentIntakeRuntimeHealth,
  DocumentIntakeRuntimeProviderId,
  GetIntakeRuntimeSessionInput,
  GetIntakeRuntimeSessionResult,
  ListIntakeRuntimeSessionsInput,
  ListIntakeRuntimeSessionsResult,
  RegisterIntakeInput,
  RegisterIntakeResult,
} from "../ports/types";
import { InMemoryDocumentIntakeRuntimeStore, type DocumentIntakeRuntimeStore } from "../store";
import { DefaultDocumentIntakeRuntimeAdapter } from "./default-document-intake-runtime-adapter";

export const MOCK_DOCUMENT_INTAKE_RUNTIME_ADAPTER_ID = "mock-in-memory";

export type MockDocumentIntakeRuntimeAdapterOptions = {
  provider?: Extract<DocumentIntakeRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: DocumentIntakeRuntimeStore;
  enterpriseDeps?: DocumentIntakeRuntimeEnterpriseDeps;
  createSessionId?: () => string;
  now?: () => string;
};

export class MockDocumentIntakeRuntimeAdapter implements DocumentIntakeRuntimePort {
  readonly providerId: Extract<DocumentIntakeRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: DocumentIntakeRuntimeStore;
  private readonly createSessionId: () => string;
  private readonly now?: () => string;
  private readonly delegate: DefaultDocumentIntakeRuntimeAdapter | undefined;

  constructor(options: MockDocumentIntakeRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message = options.message ?? `${this.providerId} document-intake-runtime ready.`;
    this.store = options.store ?? new InMemoryDocumentIntakeRuntimeStore();
    this.createSessionId = options.createSessionId ?? createRuntimeSessionId;
    this.now = options.now;

    if (options.enterpriseDeps) {
      this.delegate = new DefaultDocumentIntakeRuntimeAdapter({
        enterpriseDeps: options.enterpriseDeps,
        store: this.store,
        createSessionId: this.createSessionId,
        now: this.now,
        ping: async () => ({ ok: this.healthy, message: this.message }),
      });
    }
  }

  capabilities(): DocumentIntakeRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_DOCUMENT_INTAKE_RUNTIME_ADAPTER_ID,
      supportsRegisterIntake: true,
      supportsGetSession: true,
      supportsListSessions: true,
      supportsHealth: true,
      supportsCapabilities: true,
      usesEnterpriseRuntimePorts: Boolean(this.delegate),
      usesCanonicalExecutionOrchestrator: Boolean(this.delegate),
      usesDocumentIntakePort: Boolean(this.delegate),
      implementsOcr: false,
      implementsAi: false,
      implementsXml: false,
      implementsTiss: false,
      implementsParser: false,
      implementsClassification: false,
      implementsWorkflow: false,
      implementsRuleEngine: false,
    };
  }

  async health(): Promise<DocumentIntakeRuntimeHealth> {
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

  async registerIntake(input: RegisterIntakeInput): Promise<RegisterIntakeResult> {
    if (this.delegate) {
      return this.delegate.registerIntake(input);
    }

    // Contrato isolado (sem Ports) — apenas store; não substitui o fluxo de produto.
    if (!input.identity?.documentId || !input.metadata?.sessionId) {
      return {
        kind: "canonical-document-intake-result",
        ok: false,
        message: "identity.documentId e metadata.sessionId são obrigatórios.",
        code: "INVALID_INPUT",
      };
    }

    const stamp = this.now?.() ?? new Date().toISOString();
    const runtimeSessionId = this.createSessionId();
    const session: CanonicalDocumentIntakeSession = {
      kind: "canonical-document-intake-session",
      runtimeSessionId,
      status: "registered",
      request: input,
      intakeId: `mock-intake-${runtimeSessionId}`,
      executionId: `mock-exec-${runtimeSessionId}`,
      createdAt: stamp,
      updatedAt: stamp,
      message: "Mock session registered (store-only; no Enterprise Ports).",
      code: "MOCK_REGISTERED",
    };
    this.store.setSession(session);
    return {
      kind: "canonical-document-intake-result",
      ok: true,
      runtimeSessionId,
      session,
      intakeId: session.intakeId,
      executionId: session.executionId,
      message: session.message,
      code: session.code,
    };
  }

  async getSession(input: GetIntakeRuntimeSessionInput): Promise<GetIntakeRuntimeSessionResult> {
    if (this.delegate) return this.delegate.getSession(input);
    const session = this.store.getSession(input.runtimeSessionId);
    if (!session) return { ok: false, message: "not found", code: "not_found" };
    return { ok: true, session };
  }

  async listSessions(
    input: ListIntakeRuntimeSessionsInput = {},
  ): Promise<ListIntakeRuntimeSessionsResult> {
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

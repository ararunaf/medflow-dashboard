/**
 * MockAIProviderRuntimeAdapter — ARCH-02 / DIP-07.
 *
 * Voltado para testes e homologação.
 * Quando enterpriseDeps estão presentes, usa Orchestrator + AIProviderPort
 * (mesma cadeia do default). Sem deps, opera somente no store in-memory.
 */
import type { AIRequest, AIResponse } from "../../ai-provider/ports/types";
import { createAIProviderRuntimeSessionId } from "../ports/identity";
import type { AIProviderRuntimePort } from "../ports/ai-provider-runtime-port";
import type { CanonicalAIInvocationSession } from "../ports/models";
import type {
  CoordinateAIInvocationInput,
  CoordinateAIInvocationResult,
  GetAIProviderRuntimeSessionInput,
  GetAIProviderRuntimeSessionResult,
  ListAIProviderReferencesResult,
  ListAIProviderRuntimeSessionsInput,
  ListAIProviderRuntimeSessionsResult,
  AIProviderRuntimeCapabilities,
  AIProviderRuntimeEnterpriseDeps,
  AIProviderRuntimeHealth,
  AIProviderRuntimeProviderId,
} from "../ports/types";
import { STRUCTURAL_AI_PROVIDER_REFERENCES } from "../ports/types";
import { InMemoryAIProviderRuntimeStore, type AIProviderRuntimeStore } from "../store";
import { DefaultAIProviderRuntimeAdapter } from "./default-ai-provider-runtime-adapter";

export const MOCK_AI_PROVIDER_RUNTIME_ADAPTER_ID = "mock-in-memory";

export type MockAIProviderRuntimeAdapterOptions = {
  provider?: Extract<AIProviderRuntimeProviderId, "mock" | "test">;
  healthy?: boolean;
  message?: string;
  store?: AIProviderRuntimeStore;
  enterpriseDeps?: AIProviderRuntimeEnterpriseDeps;
  createSessionId?: () => string;
  now?: () => string;
};

export class MockAIProviderRuntimeAdapter implements AIProviderRuntimePort {
  readonly providerId: Extract<AIProviderRuntimeProviderId, "mock" | "test">;

  private readonly healthy: boolean;
  private readonly message: string;
  private readonly store: AIProviderRuntimeStore;
  private readonly createSessionId: () => string;
  private readonly now?: () => string;
  private readonly delegate: DefaultAIProviderRuntimeAdapter | undefined;

  constructor(options: MockAIProviderRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "mock";
    this.healthy = options.healthy ?? true;
    this.message =
      options.message ?? `${this.providerId} ai-provider-runtime ready (via AIProviderPort).`;
    this.store = options.store ?? new InMemoryAIProviderRuntimeStore();
    this.createSessionId = options.createSessionId ?? createAIProviderRuntimeSessionId;
    this.now = options.now;

    if (options.enterpriseDeps) {
      this.delegate = new DefaultAIProviderRuntimeAdapter({
        enterpriseDeps: options.enterpriseDeps,
        store: this.store,
        createSessionId: this.createSessionId,
        now: this.now,
        ping: async () => ({ ok: this.healthy, message: this.message }),
      });
    }
  }

  capabilities(): AIProviderRuntimeCapabilities {
    return {
      provider: this.providerId,
      adapterId: MOCK_AI_PROVIDER_RUNTIME_ADAPTER_ID,
      supportsInvoke: true,
      supportsGetSession: true,
      supportsListSessions: true,
      supportsHealth: true,
      supportsCapabilities: true,
      supportsProviderReferences: true,
      usesEnterpriseRuntimePorts: Boolean(this.delegate),
      usesCanonicalExecutionOrchestrator: Boolean(this.delegate),
      usesAIProviderPort: Boolean(this.delegate),
    };
  }

  async health(): Promise<AIProviderRuntimeHealth> {
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

  async invoke(request: AIRequest): Promise<AIResponse> {
    if (this.delegate) {
      return this.delegate.invoke(request);
    }
    return {
      ok: true,
      requestId: request.requestId,
      provider: "mock",
      model: request.model ?? "mock",
      content: `MOCK:ai-provider-runtime:${request.prompt ?? request.messages?.[0]?.content ?? ""}`,
      simulated: true,
      message: "Mock AI Provider Runtime invoke (store-only; no Enterprise Ports).",
    };
  }

  async coordinateInvocation(
    input: CoordinateAIInvocationInput,
  ): Promise<CoordinateAIInvocationResult> {
    if (this.delegate) {
      return this.delegate.coordinateInvocation(input);
    }

    const stamp = this.now?.() ?? new Date().toISOString();
    const runtimeSessionId = this.createSessionId();
    const session: CanonicalAIInvocationSession = {
      kind: "canonical-ai-invocation-session",
      runtimeSessionId,
      status: "completed",
      request: input,
      executionId: `mock-exec-${runtimeSessionId}`,
      providerReferenceId: input.providerReferenceId ?? "mock",
      aiProviderAdapterId: MOCK_AI_PROVIDER_RUNTIME_ADAPTER_ID,
      createdAt: stamp,
      updatedAt: stamp,
      message: "Mock AI coordinated (store-only; no Enterprise Ports).",
      code: "MOCK_COORDINATED",
      invokedViaAIProviderPort: true,
    };
    this.store.setSession(session);
    return {
      kind: "canonical-ai-invocation-result",
      ok: true,
      runtimeSessionId,
      session,
      executionId: session.executionId,
      providerReferenceId: session.providerReferenceId,
      message: session.message,
      code: session.code,
      invokedViaAIProviderPort: true,
    };
  }

  async getSession(
    input: GetAIProviderRuntimeSessionInput,
  ): Promise<GetAIProviderRuntimeSessionResult> {
    if (this.delegate) return this.delegate.getSession(input);
    const session = this.store.getSession(input.runtimeSessionId);
    if (!session) return { ok: false, message: "not found", code: "not_found" };
    return { ok: true, session };
  }

  async listSessions(
    input: ListAIProviderRuntimeSessionsInput = {},
  ): Promise<ListAIProviderRuntimeSessionsResult> {
    if (this.delegate) return this.delegate.listSessions(input);
    const sessions = this.store.listSessions().filter((session) => {
      if (input.status != null && session.status !== input.status) return false;
      if (input.idPrefix != null && !session.runtimeSessionId.startsWith(input.idPrefix)) {
        return false;
      }
      if (
        input.correlationId != null &&
        session.request?.metadata?.correlationId !== input.correlationId &&
        session.request?.identity?.correlationId !== input.correlationId
      ) {
        return false;
      }
      return true;
    });
    return { ok: true, sessions };
  }

  async listProviderReferences(): Promise<ListAIProviderReferencesResult> {
    if (this.delegate) return this.delegate.listProviderReferences();
    return { ok: true, references: STRUCTURAL_AI_PROVIDER_REFERENCES };
  }
}

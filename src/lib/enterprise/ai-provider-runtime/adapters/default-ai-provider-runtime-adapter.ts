/**
 * DefaultAIProviderRuntimeAdapter — adapter default (ARCH-02 / DIP-07).
 *
 * Utiliza exclusivamente Ports Enterprise injetados:
 *   Canonical Execution Orchestrator → AIProviderPort → Adapter → Provider
 *
 * NÃO chama OpenAI/HTTP diretamente. Todo acesso a LLM passa por AIProviderPort.
 */
import type { AIRequest, AIResponse } from "../../ai-provider/ports/types";
import { createAIProviderRuntimeSessionId } from "../ports/identity";
import type { AIProviderRuntimePort } from "../ports/ai-provider-runtime-port";
import type { CanonicalAIInvocationSession } from "../ports/models";
import type {
  CanonicalAIProviderReferenceId,
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
} from "../ports/types";
import {
  STRUCTURAL_AI_PROVIDER_REFERENCES,
  resolveStructuralAIProviderReference,
} from "../ports/types";

function toProviderReferenceId(providerId: string): CanonicalAIProviderReferenceId {
  switch (providerId) {
    case "openai":
    case "azure-openai":
    case "gemini":
    case "claude":
    case "ollama":
    case "lm-studio":
    case "mock":
      return providerId;
    case "test":
      return "mock";
    default:
      return "openai";
  }
}
import { InMemoryAIProviderRuntimeStore, type AIProviderRuntimeStore } from "../store";

export const DEFAULT_AI_PROVIDER_RUNTIME_ADAPTER_ID = "default-enterprise-bridge";

export type DefaultAIProviderRuntimeAdapterOptions = {
  enterpriseDeps: AIProviderRuntimeEnterpriseDeps;
  store?: AIProviderRuntimeStore;
  ping?: () => Promise<{ ok: boolean; message?: string }>;
  createSessionId?: () => string;
  now?: () => string;
};

function nowIso(now?: () => string): string {
  return now?.() ?? new Date().toISOString();
}

function foundationCapabilities(): AIProviderRuntimeCapabilities {
  return {
    provider: "default",
    adapterId: DEFAULT_AI_PROVIDER_RUNTIME_ADAPTER_ID,
    supportsInvoke: true,
    supportsGetSession: true,
    supportsListSessions: true,
    supportsHealth: true,
    supportsCapabilities: true,
    supportsProviderReferences: true,
    usesEnterpriseRuntimePorts: true,
    usesCanonicalExecutionOrchestrator: true,
    usesAIProviderPort: true,
  };
}

export class DefaultAIProviderRuntimeAdapter implements AIProviderRuntimePort {
  readonly providerId = "default" as const;

  private readonly enterpriseDeps: AIProviderRuntimeEnterpriseDeps;
  private readonly store: AIProviderRuntimeStore;
  private readonly ping?: () => Promise<{ ok: boolean; message?: string }>;
  private readonly createSessionId: () => string;
  private readonly now?: () => string;

  constructor(options: DefaultAIProviderRuntimeAdapterOptions) {
    if (!options.enterpriseDeps) {
      throw new Error(
        "DefaultAIProviderRuntimeAdapter exige enterpriseDeps " +
          "(Orchestrator + AIProviderPort). Bypass / implementação paralela é proibida.",
      );
    }
    this.enterpriseDeps = options.enterpriseDeps;
    this.store = options.store ?? new InMemoryAIProviderRuntimeStore();
    this.ping = options.ping;
    this.createSessionId = options.createSessionId ?? createAIProviderRuntimeSessionId;
    this.now = options.now;
  }

  capabilities(): AIProviderRuntimeCapabilities {
    return foundationCapabilities();
  }

  async health(): Promise<AIProviderRuntimeHealth> {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    if (this.ping) {
      const probe = await this.ping();
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      return {
        ok: probe.ok,
        provider: "default",
        latencyMs: Math.max(0, Math.round(end - start)),
        message: probe.message ?? (probe.ok ? "probe ok" : "probe falhou"),
      };
    }

    const storeHealth = this.store.health();
    const [orchestratorHealth, aiProviderHealth] = await Promise.all([
      this.enterpriseDeps.getOrchestratorPort().health(),
      this.enterpriseDeps.getAIProviderPort().health(),
    ]);
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    const ok = storeHealth.ok && orchestratorHealth.ok && aiProviderHealth.ok;

    return {
      ok,
      provider: "default",
      latencyMs: Math.max(0, Math.round(end - start)),
      enterpriseOrchestratorOk: orchestratorHealth.ok,
      aiProviderAdapterOk: aiProviderHealth.ok,
      message: ok
        ? "AI Provider Runtime pronto (Orchestrator + AIProviderPort — sem bypass)."
        : "AI Provider Runtime degradado — ver Ports Enterprise.",
    };
  }

  async invoke(request: AIRequest): Promise<AIResponse> {
    const stamp = nowIso(this.now);
    const runtimeSessionId = this.createSessionId();
    const aiProvider = this.enterpriseDeps.getAIProviderPort();
    const providerCaps = aiProvider.capabilities();

    let session: CanonicalAIInvocationSession = {
      kind: "canonical-ai-invocation-session",
      runtimeSessionId,
      status: "pending",
      request: {
        kind: "canonical-ai-invocation-request",
        identity: {
          kind: "canonical-ai-invocation-identity",
          requestId: request.requestId,
          correlationId: request.context?.correlationId,
        },
        metadata: {
          kind: "canonical-ai-invocation-metadata",
          correlationId: request.context?.correlationId,
          tenantRef: request.context?.tenantId,
          channel: "ai-provider-runtime",
          tags: ["arch-02", "dip-07", "ai-provider-runtime"],
        },
        providerReferenceId: toProviderReferenceId(aiProvider.providerId),
        structuralNotes: "ARCH-02: invoke via AIProviderPort (no direct provider access).",
      },
      providerReferenceId: toProviderReferenceId(aiProvider.providerId),
      aiProviderAdapterId: providerCaps.adapterId,
      createdAt: stamp,
      updatedAt: stamp,
      invokedViaAIProviderPort: true,
    };
    this.store.setSession(session);

    try {
      session = { ...session, status: "invoking", updatedAt: nowIso(this.now) };
      this.store.setSession(session);

      try {
        const orchestrator = this.enterpriseDeps.getOrchestratorPort();
        const execution = await orchestrator.startExecution({
          correlationId: request.context?.correlationId,
          tenantRef: request.context?.tenantId,
          channel: "ai-provider-runtime",
          tags: ["arch-02", "dip-07", "ai-provider-runtime"],
          customAttributes: {
            source: "ai-provider-runtime-invoke",
            requestId: request.requestId ?? null,
            providerId: aiProvider.providerId,
            adapterId: providerCaps.adapterId,
          },
          structuralNotes:
            "ARCH-02: AI invocation coordinated via AI Provider Runtime → AIProviderPort.",
        });
        if (execution.ok) {
          session = {
            ...session,
            executionId: execution.context?.executionId,
            updatedAt: nowIso(this.now),
          };
          this.store.setSession(session);
        }
      } catch {
        // Tracking estrutural best-effort — não bloqueia o caminho do produto.
      }

      const response = await aiProvider.invoke(request);

      session = {
        ...session,
        status: response.ok ? "completed" : "failed",
        updatedAt: nowIso(this.now),
        message: response.message,
        code: response.ok ? "INVOKED" : "INVOKE_FAILED",
        errors: response.ok ? undefined : [response.message ?? "INVOKE_FAILED"],
        invokedViaAIProviderPort: true,
      };
      this.store.setSession(session);

      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      session = {
        ...session,
        status: "failed",
        updatedAt: nowIso(this.now),
        message,
        code: "RUNTIME_BRIDGE_ERROR",
        errors: [message],
        invokedViaAIProviderPort: true,
      };
      this.store.setSession(session);
      return {
        ok: false,
        requestId: request.requestId,
        provider: aiProvider.providerId,
        simulated: false,
        message,
      };
    }
  }

  async coordinateInvocation(
    input: CoordinateAIInvocationInput,
  ): Promise<CoordinateAIInvocationResult> {
    const stamp = nowIso(this.now);
    const runtimeSessionId = this.createSessionId();
    const providerReference = resolveStructuralAIProviderReference(input.providerReferenceId);

    let session: CanonicalAIInvocationSession = {
      kind: "canonical-ai-invocation-session",
      runtimeSessionId,
      status: "pending",
      request: input,
      providerReferenceId: providerReference.providerReferenceId,
      createdAt: stamp,
      updatedAt: stamp,
      invokedViaAIProviderPort: true,
    };
    this.store.setSession(session);

    try {
      session = { ...session, status: "invoking", updatedAt: nowIso(this.now) };
      this.store.setSession(session);

      const orchestrator = this.enterpriseDeps.getOrchestratorPort();
      const execution = await orchestrator.startExecution({
        correlationId: input.metadata?.correlationId ?? input.identity?.correlationId,
        tenantRef: input.metadata?.tenantRef,
        channel: input.metadata?.channel ?? "ai-provider-runtime",
        tags: ["arch-02", "dip-07", ...(input.metadata?.tags ?? [])],
        customAttributes: {
          source: "ai-provider-runtime-coordinate",
          providerReferenceId: providerReference.providerReferenceId,
          ...(input.metadata?.customAttributes ?? {}),
        },
        structuralNotes:
          input.structuralNotes ?? "ARCH-02: AI coordinated structurally via AI Provider Runtime.",
      });

      if (!execution.ok) {
        session = {
          ...session,
          status: "failed",
          executionId: execution.context?.executionId,
          updatedAt: nowIso(this.now),
          message: execution.message ?? "Orchestrator startExecution falhou.",
          code: execution.code ?? "ORCHESTRATOR_FAILED",
          errors: [execution.message ?? "ORCHESTRATOR_FAILED"],
          invokedViaAIProviderPort: true,
        };
        this.store.setSession(session);
        return {
          kind: "canonical-ai-invocation-result",
          ok: false,
          runtimeSessionId,
          session,
          executionId: execution.context?.executionId,
          providerReferenceId: providerReference.providerReferenceId,
          message: session.message,
          code: session.code,
          invokedViaAIProviderPort: true,
        };
      }

      const aiProvider = this.enterpriseDeps.getAIProviderPort();
      const providerCaps = aiProvider.capabilities();
      const providerHealth = await aiProvider.health();

      if (!providerHealth.ok) {
        session = {
          ...session,
          status: "failed",
          executionId: execution.context?.executionId,
          aiProviderAdapterId: providerCaps.adapterId,
          updatedAt: nowIso(this.now),
          message: providerHealth.message ?? "AIProviderPort health falhou.",
          code: "AI_PROVIDER_ADAPTER_UNHEALTHY",
          errors: [providerHealth.message ?? "AI_PROVIDER_ADAPTER_UNHEALTHY"],
          invokedViaAIProviderPort: true,
        };
        this.store.setSession(session);
        return {
          kind: "canonical-ai-invocation-result",
          ok: false,
          runtimeSessionId,
          session,
          executionId: execution.context?.executionId,
          providerReferenceId: providerReference.providerReferenceId,
          message: session.message,
          code: session.code,
          invokedViaAIProviderPort: true,
        };
      }

      session = {
        ...session,
        status: "completed",
        executionId: execution.context?.executionId,
        aiProviderAdapterId: providerCaps.adapterId,
        updatedAt: nowIso(this.now),
        message:
          "AI coordinated via AI Provider Runtime (Orchestrator + AIProviderPort — no bypass).",
        code: "COORDINATED",
        invokedViaAIProviderPort: true,
      };
      this.store.setSession(session);

      return {
        kind: "canonical-ai-invocation-result",
        ok: true,
        runtimeSessionId,
        session,
        executionId: execution.context?.executionId,
        providerReferenceId: providerReference.providerReferenceId,
        message: session.message,
        code: session.code,
        invokedViaAIProviderPort: true,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      session = {
        ...session,
        status: "failed",
        updatedAt: nowIso(this.now),
        message,
        code: "RUNTIME_BRIDGE_ERROR",
        errors: [message],
        invokedViaAIProviderPort: true,
      };
      this.store.setSession(session);
      return {
        kind: "canonical-ai-invocation-result",
        ok: false,
        runtimeSessionId,
        session,
        message,
        code: "RUNTIME_BRIDGE_ERROR",
        invokedViaAIProviderPort: true,
      };
    }
  }

  async getSession(
    input: GetAIProviderRuntimeSessionInput,
  ): Promise<GetAIProviderRuntimeSessionResult> {
    const session = this.store.getSession(input.runtimeSessionId);
    if (!session) {
      return { ok: false, message: "not found", code: "not_found" };
    }
    return { ok: true, session };
  }

  async listSessions(
    input: ListAIProviderRuntimeSessionsInput = {},
  ): Promise<ListAIProviderRuntimeSessionsResult> {
    const sessions = this.store.listSessions().filter((session) => matchesList(session, input));
    return { ok: true, sessions };
  }

  async listProviderReferences(): Promise<ListAIProviderReferencesResult> {
    return { ok: true, references: STRUCTURAL_AI_PROVIDER_REFERENCES };
  }
}

function matchesList(
  session: CanonicalAIInvocationSession,
  input: ListAIProviderRuntimeSessionsInput,
): boolean {
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
}

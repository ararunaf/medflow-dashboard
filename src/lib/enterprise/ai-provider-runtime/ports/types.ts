/**
 * Tipos vendor-agnósticos do AI Provider Runtime — ARCH-02 / DIP-07.
 *
 * Arquitetura obrigatória:
 *   Produto → Enterprise Runtime → AIProviderRuntimePort
 *     → Canonical Execution Orchestrator → AIProviderPort → Adapter → Provider
 */
import type { CanonicalExecutionOrchestratorPort } from "../../canonical-execution-orchestrator/ports/canonical-execution-orchestrator-port";
import type { AIProviderPort } from "../../ai-provider/ports/ai-provider-port";
import type { AIRequest, AIResponse } from "../../ai-provider/ports/types";
import type {
  CanonicalAIInvocationRequest,
  CanonicalAIInvocationResult,
  CanonicalAIInvocationSession,
  CanonicalAIProviderReference,
  CanonicalAIProviderReferenceId,
  AIProviderRuntimeSessionStatus,
} from "./models";

export type {
  CanonicalAIInvocationIdentity,
  CanonicalAIInvocationMetadata,
  CanonicalAIInvocationRequest,
  CanonicalAIInvocationResult,
  CanonicalAIInvocationSession,
  CanonicalAIProviderReference,
  CanonicalAIProviderReferenceId,
  AIProviderRuntimeSessionStatus,
} from "./models";

export type { AIRequest, AIResponse };

/** Provedores / mecanismos do AI Provider Runtime (adapters do Port — não vendors). */
export type AIProviderRuntimeProviderId = "default" | "mock" | "test";

/** Resultado de health check. */
export type AIProviderRuntimeHealth = {
  ok: boolean;
  provider: AIProviderRuntimeProviderId;
  latencyMs?: number;
  message?: string;
  enterpriseOrchestratorOk?: boolean;
  aiProviderAdapterOk?: boolean;
};

/**
 * Capacidades declaradas pelo adapter (Port level).
 */
export type AIProviderRuntimeCapabilities = {
  provider: AIProviderRuntimeProviderId;
  adapterId: string;
  supportsInvoke: boolean;
  supportsGetSession: boolean;
  supportsListSessions: boolean;
  supportsHealth: boolean;
  supportsCapabilities: boolean;
  supportsProviderReferences: boolean;
  usesEnterpriseRuntimePorts: boolean;
  usesCanonicalExecutionOrchestrator: boolean;
  usesAIProviderPort: boolean;
};

/**
 * Dependências Enterprise injetadas no adapter default.
 * Evita implementação paralela e ciclo de import com o composition root.
 */
export type AIProviderRuntimeEnterpriseDeps = {
  getOrchestratorPort(): CanonicalExecutionOrchestratorPort;
  /** AIProviderPort oficial — único caminho para Adapters / Providers. */
  getAIProviderPort(): AIProviderPort;
};

export type GetAIProviderRuntimeSessionInput = {
  runtimeSessionId: string;
};

export type GetAIProviderRuntimeSessionResult = {
  ok: boolean;
  session?: CanonicalAIInvocationSession;
  message?: string;
  code?: string;
};

export type ListAIProviderRuntimeSessionsInput = {
  status?: AIProviderRuntimeSessionStatus;
  idPrefix?: string;
  correlationId?: string;
};

export type ListAIProviderRuntimeSessionsResult = {
  ok: boolean;
  sessions: readonly CanonicalAIInvocationSession[];
  message?: string;
  code?: string;
};

export type ListAIProviderReferencesResult = {
  ok: boolean;
  references: readonly CanonicalAIProviderReference[];
};

export type CoordinateAIInvocationInput = CanonicalAIInvocationRequest;
export type CoordinateAIInvocationResult = CanonicalAIInvocationResult;

/** Opções de resolução do AIProviderRuntimePort. */
export type AIProviderRuntimeProviderOptions = {
  provider?: AIProviderRuntimeProviderId;
  enterpriseDeps?: AIProviderRuntimeEnterpriseDeps;
};

/** Catálogo estrutural de providers (OpenAI ready; demais referência). */
export const STRUCTURAL_AI_PROVIDER_REFERENCES: readonly CanonicalAIProviderReference[] = [
  {
    kind: "canonical-ai-provider-reference",
    providerReferenceId: "openai",
    displayName: "OpenAI",
    vendor: "OpenAI",
    status: "ready",
    connected: true,
  },
  {
    kind: "canonical-ai-provider-reference",
    providerReferenceId: "azure-openai",
    displayName: "Azure OpenAI",
    vendor: "Microsoft",
    status: "structural-reference-only",
    connected: false,
  },
  {
    kind: "canonical-ai-provider-reference",
    providerReferenceId: "gemini",
    displayName: "Google Gemini",
    vendor: "Google",
    status: "structural-reference-only",
    connected: false,
  },
  {
    kind: "canonical-ai-provider-reference",
    providerReferenceId: "claude",
    displayName: "Anthropic Claude",
    vendor: "Anthropic",
    status: "structural-reference-only",
    connected: false,
  },
  {
    kind: "canonical-ai-provider-reference",
    providerReferenceId: "ollama",
    displayName: "Ollama",
    vendor: "Ollama",
    status: "structural-reference-only",
    connected: false,
  },
  {
    kind: "canonical-ai-provider-reference",
    providerReferenceId: "lm-studio",
    displayName: "LM Studio",
    vendor: "LM Studio",
    status: "structural-reference-only",
    connected: false,
  },
  {
    kind: "canonical-ai-provider-reference",
    providerReferenceId: "mock",
    displayName: "Mock AI Provider (EPC-07)",
    vendor: "MedicFlow Enterprise",
    status: "ready",
    connected: true,
  },
] as const;

export function resolveStructuralAIProviderReference(
  id?: CanonicalAIProviderReferenceId,
): CanonicalAIProviderReference {
  const found = STRUCTURAL_AI_PROVIDER_REFERENCES.find((ref) => ref.providerReferenceId === id);
  return (
    found ?? STRUCTURAL_AI_PROVIDER_REFERENCES.find((ref) => ref.providerReferenceId === "openai")!
  );
}

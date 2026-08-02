/**
 * Modelos canônicos do AI Provider Runtime — ARCH-02 / DIP-07.
 *
 * Coordenação estrutural de invocações de IA via Ports oficiais.
 * Sem prompts de produto. Sem regras de negócio.
 */

/** Status estrutural da sessão de invocação no Runtime. */
export type AIProviderRuntimeSessionStatus = "pending" | "invoking" | "completed" | "failed";

/** Identidade canônica opaca da invocação. */
export type CanonicalAIInvocationIdentity = {
  kind: "canonical-ai-invocation-identity";
  requestId?: string;
  correlationId?: string;
};

/** Metadados canônicos estruturais da sessão. */
export type CanonicalAIInvocationMetadata = {
  kind: "canonical-ai-invocation-metadata";
  sessionId?: string;
  tenantRef?: string;
  correlationId?: string;
  channel?: string;
  tags?: readonly string[];
  customAttributes?: Readonly<Record<string, string | number | boolean | null>>;
};

/** Referência estrutural a provider de IA. */
export type CanonicalAIProviderReferenceId =
  | "openai"
  | "azure-openai"
  | "gemini"
  | "claude"
  | "ollama"
  | "lm-studio"
  | "mock";

export type CanonicalAIProviderReference = {
  kind: "canonical-ai-provider-reference";
  providerReferenceId: CanonicalAIProviderReferenceId;
  displayName: string;
  vendor: string;
  status: "ready" | "structural-reference-only";
  connected: boolean;
};

/** Request canônico de invocação (envelope estrutural). */
export type CanonicalAIInvocationRequest = {
  kind: "canonical-ai-invocation-request";
  identity?: CanonicalAIInvocationIdentity;
  metadata?: CanonicalAIInvocationMetadata;
  providerReferenceId?: CanonicalAIProviderReferenceId;
  structuralNotes?: string;
};

/** Sessão canônica de invocação no Runtime. */
export type CanonicalAIInvocationSession = {
  kind: "canonical-ai-invocation-session";
  runtimeSessionId: string;
  status: AIProviderRuntimeSessionStatus;
  request?: CanonicalAIInvocationRequest;
  executionId?: string;
  providerReferenceId?: CanonicalAIProviderReferenceId;
  aiProviderAdapterId?: string;
  createdAt: string;
  updatedAt: string;
  message?: string;
  code?: string;
  errors?: readonly string[];
  invokedViaAIProviderPort: true;
};

/** Resultado canônico de invocação coordenada. */
export type CanonicalAIInvocationResult = {
  kind: "canonical-ai-invocation-result";
  ok: boolean;
  runtimeSessionId?: string;
  session?: CanonicalAIInvocationSession;
  executionId?: string;
  providerReferenceId?: CanonicalAIProviderReferenceId;
  message?: string;
  code?: string;
  invokedViaAIProviderPort: true;
};

/**
 * OpenAI AI Provider Adapter — ARCH-02 / EPC-07.
 *
 * Único ponto autorizado de chamada HTTP à API OpenAI (chat.completions).
 * Application / produto NÃO devem chamar api.openai.com diretamente.
 *
 * Fluxo oficial:
 *   Produto → Enterprise Runtime → AI Provider Runtime
 *     → AIProviderPort → OpenAIAIProviderAdapter → OpenAI
 */
import type { AICapabilityId } from "../ports/capabilities";
import type { AIProviderPort } from "../ports/ai-provider-port";
import type {
  AIConfigurationValidation,
  AIProviderCapabilities,
  AIProviderHealth,
  AIProviderInfo,
  AIRequest,
  AIResponse,
} from "../ports/types";

export const OPENAI_AI_PROVIDER_ADAPTER_ID = "openai-chat-completions";

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";

const CAPABILITIES: readonly AICapabilityId[] = [
  "text-generation",
  "structured-output",
  "vision",
  "streaming",
  "embeddings",
  "tool-calling",
  "json-mode",
];

type OpenAiChatResponse = {
  model?: string;
  choices?: Array<{
    finish_reason?: string;
    message?: {
      role?: string;
      content?: string | null;
      tool_calls?: Array<{
        id: string;
        type?: string;
        function?: { name?: string; arguments?: string };
      }>;
    };
  }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  error?: { message?: string };
};

type OpenAiChatInput = {
  messages?: unknown[];
  tools?: unknown[];
  tool_choice?: unknown;
};

type OpenAiEmbeddingsInput = {
  input?: string | readonly string[];
};

type OpenAiEmbeddingsResponse = {
  model?: string;
  data?: Array<{ embedding?: number[]; index?: number }>;
  usage?: { prompt_tokens?: number; total_tokens?: number };
  error?: { message?: string };
};

function resolveOpenAiApiKey(): string | null {
  const fromEnv =
    (typeof process !== "undefined" && process.env && process.env.MEDFLOW_OPENAI_API_KEY) ||
    (typeof process !== "undefined" && process.env && process.env.OPENAI_API_KEY);
  return typeof fromEnv === "string" && fromEnv.length > 0 ? fromEnv : null;
}

function resolveDefaultModel(): string {
  const m =
    (typeof process !== "undefined" && process.env && process.env.MEDFLOW_OPENAI_MODEL) ||
    "gpt-4o-mini";
  return typeof m === "string" && m.length > 0 ? m : "gpt-4o-mini";
}

function resolveEmbeddingModel(): string {
  const m =
    (typeof process !== "undefined" &&
      process.env &&
      process.env.MEDFLOW_OPENAI_EMBEDDING_MODEL) ||
    "text-embedding-3-small";
  return typeof m === "string" && m.length > 0 ? m : "text-embedding-3-small";
}

function buildMessages(request: AIRequest, opaque: OpenAiChatInput | undefined): unknown[] {
  if (Array.isArray(opaque?.messages) && opaque.messages.length > 0) {
    return opaque.messages;
  }
  if (request.messages && request.messages.length > 0) {
    return request.messages.map((message) => ({
      role: message.role,
      content: message.content,
      ...(message.name ? { name: message.name } : {}),
    }));
  }
  if (typeof request.prompt === "string" && request.prompt.length > 0) {
    return [{ role: "user", content: request.prompt }];
  }
  return [];
}

export class OpenAIAIProviderAdapter implements AIProviderPort {
  readonly providerId = "openai" as const;

  capabilities(): AIProviderCapabilities {
    return {
      provider: "openai",
      adapterId: OPENAI_AI_PROVIDER_ADAPTER_ID,
      capabilities: CAPABILITIES,
      modalities: ["text", "image", "embedding"],
      supportsStreaming: true,
      supportsStructuredOutput: true,
      supportsVision: true,
      supportsEmbeddings: true,
      supportsToolCalling: true,
      supportsJsonMode: true,
    };
  }

  providerInfo(): AIProviderInfo {
    return {
      providerId: "openai",
      metadata: {
        name: "OpenAI",
        version: "1.0.0",
        vendor: "openai",
        description:
          "Official OpenAI chat.completions adapter — sole authorized HTTP path (ARCH-02).",
      },
      status: "ready",
      modalities: ["text", "image", "embedding"],
      capabilities: CAPABILITIES,
    };
  }

  supports(capability: AICapabilityId): boolean {
    return CAPABILITIES.includes(capability);
  }

  async health(): Promise<AIProviderHealth> {
    const apiKey = resolveOpenAiApiKey();
    return {
      ok: true,
      provider: "openai",
      latencyMs: 0,
      status: "ready",
      message: apiKey
        ? "OpenAI adapter ready (API key present)."
        : "OpenAI adapter ready (API key absent — invoke will fail until configured).",
    };
  }

  async validateConfiguration(): Promise<AIConfigurationValidation> {
    const apiKey = resolveOpenAiApiKey();
    if (!apiKey) {
      return {
        ok: false,
        provider: "openai",
        errors: [
          "IA operacional não configurada: defina MEDFLOW_OPENAI_API_KEY (ou OPENAI_API_KEY) no ambiente do servidor.",
        ],
        warnings: [],
        message: "API key ausente.",
      };
    }
    return {
      ok: true,
      provider: "openai",
      errors: [],
      warnings: [],
      message: "Configuração OpenAI válida (chave presente).",
    };
  }

  async invoke(request: AIRequest): Promise<AIResponse> {
    const apiKey = resolveOpenAiApiKey();
    if (!apiKey) {
      return {
        ok: false,
        requestId: request.requestId,
        provider: "openai",
        model: request.model ?? resolveDefaultModel(),
        simulated: false,
        metadata: this.providerInfo().metadata,
        message:
          "IA operacional não configurada: defina MEDFLOW_OPENAI_API_KEY (ou OPENAI_API_KEY) no ambiente do servidor.",
      };
    }

    if (request.capability === "embeddings") {
      return this.invokeEmbeddings(request, apiKey);
    }

    const opaque =
      request.input && typeof request.input === "object"
        ? (request.input as OpenAiChatInput)
        : undefined;
    const messages = buildMessages(request, opaque);
    if (messages.length === 0) {
      return {
        ok: false,
        requestId: request.requestId,
        provider: "openai",
        model: request.model ?? resolveDefaultModel(),
        simulated: false,
        metadata: this.providerInfo().metadata,
        message: "AIRequest sem messages/prompt para chat.completions.",
      };
    }

    const model = request.model ?? resolveDefaultModel();
    const body: Record<string, unknown> = {
      model,
      messages,
    };
    if (typeof request.temperature === "number") {
      body.temperature = request.temperature;
    }
    if (typeof request.maxTokens === "number") {
      body.max_tokens = request.maxTokens;
    }
    if (opaque?.tools != null) {
      body.tools = opaque.tools;
    }
    if (opaque?.tool_choice != null) {
      body.tool_choice = opaque.tool_choice;
    }
    if (request.responseFormat === "json") {
      body.response_format = { type: "json_object" };
    }

    try {
      const res = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const raw = (await res.json()) as OpenAiChatResponse;
      if (!res.ok) {
        const msg = raw.error?.message ?? `OpenAI HTTP ${res.status}`;
        return {
          ok: false,
          requestId: request.requestId,
          provider: "openai",
          model,
          simulated: false,
          metadata: this.providerInfo().metadata,
          message: `Falha ao chamar o modelo: ${msg}`,
        };
      }

      const choice = raw.choices?.[0];
      const assistantMessage = choice?.message;
      const content = assistantMessage?.content?.trim() ?? "";
      const toolCalls = assistantMessage?.tool_calls;

      return {
        ok: true,
        requestId: request.requestId,
        provider: "openai",
        model: raw.model ?? model,
        content: content.length > 0 ? content : undefined,
        simulated: false,
        usage: raw.usage
          ? {
              promptTokens: raw.usage.prompt_tokens,
              completionTokens: raw.usage.completion_tokens,
              totalTokens: raw.usage.total_tokens,
            }
          : undefined,
        metadata: this.providerInfo().metadata,
        data: {
          finishReason: choice?.finish_reason,
          toolCalls: toolCalls ?? [],
          assistantContent: assistantMessage?.content ?? null,
          rawMessage: assistantMessage,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        requestId: request.requestId,
        provider: "openai",
        model,
        simulated: false,
        metadata: this.providerInfo().metadata,
        message: `Falha ao chamar o modelo: ${message}`,
      };
    }
  }

  private async invokeEmbeddings(request: AIRequest, apiKey: string): Promise<AIResponse> {
    const opaque =
      request.input && typeof request.input === "object"
        ? (request.input as OpenAiEmbeddingsInput)
        : undefined;
    const input = opaque?.input ?? request.prompt;
    const model = request.model ?? resolveEmbeddingModel();

    if (
      input === undefined ||
      (typeof input === "string" && input.length === 0) ||
      (Array.isArray(input) && input.length === 0)
    ) {
      return {
        ok: false,
        requestId: request.requestId,
        provider: "openai",
        model,
        simulated: false,
        metadata: this.providerInfo().metadata,
        message: "AIRequest sem input/prompt para embeddings.",
      };
    }

    try {
      const res = await fetch(OPENAI_EMBEDDINGS_URL, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ model, input }),
      });

      const raw = (await res.json()) as OpenAiEmbeddingsResponse;
      if (!res.ok) {
        const msg = raw.error?.message ?? `OpenAI HTTP ${res.status}`;
        return {
          ok: false,
          requestId: request.requestId,
          provider: "openai",
          model,
          simulated: false,
          metadata: this.providerInfo().metadata,
          message: `Falha ao chamar o modelo: ${msg}`,
        };
      }

      const rows = [...(raw.data ?? [])].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
      const vectors = rows.map((row) => row.embedding ?? []);
      const dimensions = vectors[0]?.length ?? 0;
      const isBatch = Array.isArray(input);

      return {
        ok: true,
        requestId: request.requestId,
        provider: "openai",
        model: raw.model ?? model,
        simulated: false,
        usage: raw.usage
          ? {
              promptTokens: raw.usage.prompt_tokens,
              totalTokens: raw.usage.total_tokens,
            }
          : undefined,
        metadata: this.providerInfo().metadata,
        data: isBatch
          ? { vectors, dimensions }
          : { vector: vectors[0] ?? [], dimensions },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        requestId: request.requestId,
        provider: "openai",
        model,
        simulated: false,
        metadata: this.providerInfo().metadata,
        message: `Falha ao chamar o modelo: ${message}`,
      };
    }
  }
}

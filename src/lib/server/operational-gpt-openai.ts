/**
 * Bridge produto → Enterprise Foundation para copiloto operacional (ARCH-02).
 *
 * NÃO chama OpenAI/HTTP diretamente.
 * Fluxo obrigatório:
 *   Produto → Enterprise Runtime → AI Provider Runtime
 *     → AIProviderPort → Adapter → Provider → OpenAI
 */
import { DomainError } from "@/lib/domain/operations/errors";
import { getEnterpriseRuntime } from "@/lib/enterprise/runtime";
import type { AIRequest, AIResponse } from "@/lib/enterprise/ai-provider";
import { isOperationalGptToolName } from "@/lib/operations/copilot-gpt/operational-gpt-tool-registry";
import {
  OPERATIONAL_GPT_MAX_TOOL_CALLS_PER_REQUEST,
  OPERATIONAL_GPT_MAX_TOOL_ROUNDS,
} from "@/lib/operations/copilot-gpt/operational-gpt-tool-safety";

type OpenAiToolCall = {
  id: string;
  type?: string;
  function?: { name?: string; arguments?: string };
};

type OpenAiChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: OpenAiToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

type UsageShape = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

function mergeUsage(
  acc: UsageShape | undefined,
  next: UsageShape | undefined,
): UsageShape | undefined {
  if (!next) return acc;
  if (!acc) return next;
  return {
    prompt_tokens: (acc.prompt_tokens ?? 0) + (next.prompt_tokens ?? 0),
    completion_tokens: (acc.completion_tokens ?? 0) + (next.completion_tokens ?? 0),
    total_tokens: (acc.total_tokens ?? 0) + (next.total_tokens ?? 0),
  };
}

function mapUsage(usage: AIResponse["usage"] | undefined): UsageShape | undefined {
  if (!usage) return undefined;
  return {
    prompt_tokens: usage.promptTokens,
    completion_tokens: usage.completionTokens,
    total_tokens: usage.totalTokens,
  };
}

export function resolveOperationalOpenAiModel(): string {
  const m =
    (typeof process !== "undefined" && process.env && process.env.MEDFLOW_OPENAI_MODEL) ||
    "gpt-4o-mini";
  return typeof m === "string" && m.length > 0 ? m : "gpt-4o-mini";
}

async function invokeViaEnterprise(request: AIRequest): Promise<AIResponse> {
  return getEnterpriseRuntime().getAIProviderRuntimePort().invoke(request);
}

function extractToolCalls(response: AIResponse): OpenAiToolCall[] {
  const data = response.data;
  if (!data || typeof data !== "object") return [];
  const toolCalls = (data as { toolCalls?: OpenAiToolCall[] }).toolCalls;
  return Array.isArray(toolCalls) ? toolCalls : [];
}

function extractAssistantContent(response: AIResponse): string | null {
  const data = response.data;
  if (data && typeof data === "object" && "assistantContent" in data) {
    const value = (data as { assistantContent?: string | null }).assistantContent;
    if (value === null) return null;
    if (typeof value === "string") return value;
  }
  return response.content ?? null;
}

export async function completeOperationalCopilotChat(input: {
  system: string;
  user: string;
}): Promise<{ text: string; model: string; usage: UsageShape | undefined }> {
  const model = resolveOperationalOpenAiModel();
  const response = await invokeViaEnterprise({
    model,
    temperature: 0.35,
    maxTokens: 900,
    capability: "text-generation",
    messages: [
      { role: "system", content: input.system },
      { role: "user", content: input.user },
    ],
  });

  if (!response.ok) {
    throw new DomainError("internal_error", response.message ?? "Falha ao chamar o modelo.");
  }

  const text = response.content?.trim() ?? "";
  if (!text) {
    throw new DomainError("internal_error", "Resposta vazia do modelo.");
  }
  return { text, model: response.model ?? model, usage: mapUsage(response.usage) };
}

export async function completeOperationalCopilotChatWithTools(input: {
  system: string;
  user: string;
  tools: unknown[];
  runTool: (name: string, argumentsJson: string) => Promise<string>;
}): Promise<{
  text: string;
  model: string;
  usage: UsageShape | undefined;
  toolCallCount: number;
  toolRounds: number;
}> {
  const model = resolveOperationalOpenAiModel();

  const messages: OpenAiChatMessage[] = [
    { role: "system", content: input.system },
    { role: "user", content: input.user },
  ];

  let usageAcc: UsageShape | undefined;
  let lastModel = model;
  let toolCallCount = 0;

  for (let round = 0; round < OPERATIONAL_GPT_MAX_TOOL_ROUNDS; round++) {
    const forceNoTools = toolCallCount >= OPERATIONAL_GPT_MAX_TOOL_CALLS_PER_REQUEST;
    const response = await invokeViaEnterprise({
      model,
      temperature: 0.3,
      maxTokens: 1100,
      capability: "tool-calling",
      input: {
        messages,
        tools: input.tools,
        tool_choice: forceNoTools ? "none" : "auto",
      },
    });

    if (!response.ok) {
      throw new DomainError("internal_error", response.message ?? "Falha ao chamar o modelo.");
    }

    usageAcc = mergeUsage(usageAcc, mapUsage(response.usage));
    lastModel = response.model ?? model;

    const assistantContent = extractAssistantContent(response);
    const text = assistantContent?.trim() ?? "";
    const toolCalls = extractToolCalls(response);

    if (!forceNoTools && toolCalls.length > 0) {
      messages.push({
        role: "assistant",
        content: assistantContent,
        tool_calls: toolCalls,
      });

      for (const tc of toolCalls) {
        const name = tc.function?.name ?? "";
        const argsJson = tc.function?.arguments ?? "{}";
        toolCallCount += 1;

        if (toolCallCount > OPERATIONAL_GPT_MAX_TOOL_CALLS_PER_REQUEST) {
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify({
              ok: false,
              error:
                "Limite de tool calls por pergunta atingido; responda com o que já foi obtido.",
            }),
          });
          continue;
        }

        if (!isOperationalGptToolName(name)) {
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify({ ok: false, error: `Tool desconhecida: ${name}` }),
          });
          continue;
        }

        const content = await input.runTool(name, argsJson);
        messages.push({ role: "tool", tool_call_id: tc.id, content });
      }

      continue;
    }

    if (text) {
      return {
        text,
        model: lastModel,
        usage: usageAcc,
        toolCallCount,
        toolRounds: round + 1,
      };
    }

    throw new DomainError("internal_error", "Resposta vazia do modelo (sem texto útil).");
  }

  throw new DomainError(
    "internal_error",
    "Limite de rodadas de tool calling atingido sem resposta textual final.",
  );
}

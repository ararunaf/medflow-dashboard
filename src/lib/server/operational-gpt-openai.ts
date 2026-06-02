/**
 * Cliente HTTP mínimo para OpenAI (sem SDK) — somente leitura / chat completion.
 * Server-only: mantém a chave fora do bundle do browser.
 */
import { DomainError } from "@/lib/domain/operations/errors";
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

type OpenAiChatResponse = {
  model?: string;
  choices?: Array<{
    finish_reason?: string;
    message?: {
      role?: string;
      content?: string | null;
      tool_calls?: OpenAiToolCall[];
    };
  }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  error?: { message?: string };
};

function mergeUsage(
  acc: OpenAiChatResponse["usage"] | undefined,
  next: OpenAiChatResponse["usage"] | undefined,
): OpenAiChatResponse["usage"] | undefined {
  if (!next) return acc;
  if (!acc) return next;
  return {
    prompt_tokens: (acc.prompt_tokens ?? 0) + (next.prompt_tokens ?? 0),
    completion_tokens: (acc.completion_tokens ?? 0) + (next.completion_tokens ?? 0),
    total_tokens: (acc.total_tokens ?? 0) + (next.total_tokens ?? 0),
  };
}

function resolveOpenAiApiKey(): string | null {
  const fromEnv =
    (typeof process !== "undefined" && process.env && process.env.MEDFLOW_OPENAI_API_KEY) ||
    (typeof process !== "undefined" && process.env && process.env.OPENAI_API_KEY);
  return typeof fromEnv === "string" && fromEnv.length > 0 ? fromEnv : null;
}

export function resolveOperationalOpenAiModel(): string {
  const m =
    (typeof process !== "undefined" && process.env && process.env.MEDFLOW_OPENAI_MODEL) ||
    "gpt-4o-mini";
  return typeof m === "string" && m.length > 0 ? m : "gpt-4o-mini";
}

export async function completeOperationalCopilotChat(input: {
  system: string;
  user: string;
}): Promise<{ text: string; model: string; usage: OpenAiChatResponse["usage"] }> {
  const apiKey = resolveOpenAiApiKey();
  if (!apiKey) {
    throw new DomainError(
      "internal_error",
      "IA operacional não configurada: defina MEDFLOW_OPENAI_API_KEY (ou OPENAI_API_KEY) no ambiente do servidor.",
    );
  }
  const model = resolveOperationalOpenAiModel();

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      max_tokens: 900,
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
    }),
  });

  const raw = (await res.json()) as OpenAiChatResponse;
  if (!res.ok) {
    const msg = raw.error?.message ?? `OpenAI HTTP ${res.status}`;
    throw new DomainError("internal_error", `Falha ao chamar o modelo: ${msg}`);
  }
  const text = raw.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) {
    throw new DomainError("internal_error", "Resposta vazia do modelo.");
  }
  return { text, model: raw.model ?? model, usage: raw.usage };
}

export async function completeOperationalCopilotChatWithTools(input: {
  system: string;
  user: string;
  tools: unknown[];
  runTool: (name: string, argumentsJson: string) => Promise<string>;
}): Promise<{
  text: string;
  model: string;
  usage: OpenAiChatResponse["usage"];
  toolCallCount: number;
  toolRounds: number;
}> {
  const apiKey = resolveOpenAiApiKey();
  if (!apiKey) {
    throw new DomainError(
      "internal_error",
      "IA operacional não configurada: defina MEDFLOW_OPENAI_API_KEY (ou OPENAI_API_KEY) no ambiente do servidor.",
    );
  }
  const model = resolveOperationalOpenAiModel();

  const messages: OpenAiChatMessage[] = [
    { role: "system", content: input.system },
    { role: "user", content: input.user },
  ];

  let usageAcc: OpenAiChatResponse["usage"] | undefined;
  let lastModel = model;
  let toolCallCount = 0;

  for (let round = 0; round < OPERATIONAL_GPT_MAX_TOOL_ROUNDS; round++) {
    const forceNoTools = toolCallCount >= OPERATIONAL_GPT_MAX_TOOL_CALLS_PER_REQUEST;
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 1100,
        messages,
        tools: input.tools,
        tool_choice: forceNoTools ? "none" : "auto",
      }),
    });

    const raw = (await res.json()) as OpenAiChatResponse;
    if (!res.ok) {
      const msg = raw.error?.message ?? `OpenAI HTTP ${res.status}`;
      throw new DomainError("internal_error", `Falha ao chamar o modelo: ${msg}`);
    }

    usageAcc = mergeUsage(usageAcc, raw.usage);
    lastModel = raw.model ?? model;

    const msg = raw.choices?.[0]?.message;
    const text = msg?.content?.trim() ?? "";

    if (!forceNoTools && msg?.tool_calls?.length) {
      messages.push({
        role: "assistant",
        content: msg.content ?? null,
        tool_calls: msg.tool_calls,
      });

      for (const tc of msg.tool_calls) {
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

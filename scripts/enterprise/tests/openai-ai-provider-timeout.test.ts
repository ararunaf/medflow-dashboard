/**
 * Timeout do OpenAIAIProviderAdapter — antes desta correção, chat.completions
 * e embeddings usavam `fetch()` puro sem AbortController/timeoutMs: uma
 * chamada travada na OpenAI travava o job do worker de captura
 * indefinidamente (sem teto), diferente do OCR (que já tinha timeout).
 */
import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { OpenAIAIProviderAdapter } from "../../../src/lib/enterprise/ai-provider/adapters/openai-ai-provider-adapter.ts";

async function withFakeFetch<T>(impl: typeof fetch, run: () => Promise<T>): Promise<T> {
  const original = globalThis.fetch;
  globalThis.fetch = impl;
  try {
    return await run();
  } finally {
    globalThis.fetch = original;
  }
}

/** fetch que nunca resolve por conta própria — só rejeita se o AbortSignal disparar. */
function hangingFetchHonoringAbort(): typeof fetch {
  return ((_url: string, init?: RequestInit) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        const err = new Error("This operation was aborted");
        err.name = "AbortError";
        reject(err);
      });
    })) as unknown as typeof fetch;
}

describe("OpenAIAIProviderAdapter — timeout de rede", () => {
  it("chat.completions travada é abortada após o timeout e retorna erro claro", async () => {
    process.env.MEDFLOW_OPENAI_API_KEY = "sk-test-fake";
    mock.timers.enable({ apis: ["setTimeout"] });
    try {
      const port = new OpenAIAIProviderAdapter();
      const pending = withFakeFetch(hangingFetchHonoringAbort(), () =>
        port.invoke({ prompt: "oi", capability: "text-generation" }),
      );
      mock.timers.tick(30_000);
      const response = await pending;

      assert.equal(response.ok, false);
      assert.match(response.message ?? "", /Timeout ao chamar a OpenAI após 30000ms/);
    } finally {
      mock.timers.reset();
      delete process.env.MEDFLOW_OPENAI_API_KEY;
    }
  });

  it("embeddings travada é abortada após o timeout e retorna erro claro", async () => {
    process.env.MEDFLOW_OPENAI_API_KEY = "sk-test-fake";
    mock.timers.enable({ apis: ["setTimeout"] });
    try {
      const port = new OpenAIAIProviderAdapter();
      const pending = withFakeFetch(hangingFetchHonoringAbort(), () =>
        port.invoke({ capability: "embeddings", input: { input: "x" } }),
      );
      mock.timers.tick(30_000);
      const response = await pending;

      assert.equal(response.ok, false);
      assert.match(response.message ?? "", /Timeout ao chamar a OpenAI após 30000ms/);
    } finally {
      mock.timers.reset();
      delete process.env.MEDFLOW_OPENAI_API_KEY;
    }
  });
});

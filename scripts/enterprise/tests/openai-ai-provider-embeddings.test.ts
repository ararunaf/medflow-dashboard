/**
 * F2-S1 — extensão de embeddings reais do OpenAIAIProviderAdapter.
 *
 * ai-provider-engine.test.ts (EPC-07) testa o contrato do Port sem tocar
 * rede. Aqui testamos especificamente o novo caminho HTTP real
 * (/v1/embeddings) com fetch mockado — sem isso, o parsing da resposta da
 * OpenAI e o roteamento por capability nunca seriam exercitados.
 */
import { describe, it } from "node:test";
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

describe("OpenAIAIProviderAdapter — embeddings reais (F2-S1)", () => {
  it("chama /v1/embeddings com model e input corretos e retorna vector único para string simples", async () => {
    process.env.MEDFLOW_OPENAI_API_KEY = "sk-test-fake";
    let capturedUrl: string | undefined;
    let capturedBody: { model?: string; input?: unknown } = {};
    const fakeFetch = (async (url: string, init?: RequestInit) => {
      capturedUrl = url;
      capturedBody = JSON.parse(String(init?.body));
      return {
        ok: true,
        json: async () => ({
          model: "text-embedding-3-small",
          data: [{ embedding: [0.1, 0.2, 0.3], index: 0 }],
          usage: { prompt_tokens: 5, total_tokens: 5 },
        }),
      } as Response;
    }) as typeof fetch;

    const port = new OpenAIAIProviderAdapter();
    const response = await withFakeFetch(fakeFetch, () =>
      port.invoke({ capability: "embeddings", input: { input: "cláusula de carência" } }),
    );

    assert.equal(capturedUrl, "https://api.openai.com/v1/embeddings");
    assert.equal(capturedBody.model, "text-embedding-3-small");
    assert.equal(capturedBody.input, "cláusula de carência");
    assert.equal(response.ok, true);
    assert.deepEqual((response.data as { vector: number[] }).vector, [0.1, 0.2, 0.3]);
    assert.equal((response.data as { dimensions: number }).dimensions, 3);
    assert.equal(response.usage?.totalTokens, 5);
    delete process.env.MEDFLOW_OPENAI_API_KEY;
  });

  it("retorna vectors (plural) para input em lote, reordenados pelo index da API", async () => {
    process.env.MEDFLOW_OPENAI_API_KEY = "sk-test-fake";
    const fakeFetch = (async () =>
      ({
        ok: true,
        json: async () => ({
          model: "text-embedding-3-small",
          data: [
            { embedding: [1, 1], index: 1 },
            { embedding: [0, 0], index: 0 },
          ],
        }),
      }) as Response) as typeof fetch;

    const port = new OpenAIAIProviderAdapter();
    const response = await withFakeFetch(fakeFetch, () =>
      port.invoke({ capability: "embeddings", input: { input: ["a", "b"] } }),
    );
    assert.deepEqual((response.data as { vectors: number[][] }).vectors, [
      [0, 0],
      [1, 1],
    ]);
    delete process.env.MEDFLOW_OPENAI_API_KEY;
  });

  it("propaga mensagem de erro estruturada da API em falha HTTP", async () => {
    process.env.MEDFLOW_OPENAI_API_KEY = "sk-test-fake";
    const fakeFetch = (async () =>
      ({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: "Invalid API key" } }),
      }) as Response) as typeof fetch;

    const port = new OpenAIAIProviderAdapter();
    const response = await withFakeFetch(fakeFetch, () =>
      port.invoke({ capability: "embeddings", input: { input: "x" } }),
    );
    assert.equal(response.ok, false);
    assert.match(response.message ?? "", /Invalid API key/);
    delete process.env.MEDFLOW_OPENAI_API_KEY;
  });

  it("retorna erro sem chamar fetch quando a API key está ausente", async () => {
    const originalKey = process.env.MEDFLOW_OPENAI_API_KEY;
    const originalFallback = process.env.OPENAI_API_KEY;
    delete process.env.MEDFLOW_OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    let called = false;
    const fakeFetch = (async () => {
      called = true;
      throw new Error("não deveria chamar fetch sem API key");
    }) as unknown as typeof fetch;

    const port = new OpenAIAIProviderAdapter();
    const response = await withFakeFetch(fakeFetch, () =>
      port.invoke({ capability: "embeddings", input: { input: "x" } }),
    );
    assert.equal(response.ok, false);
    assert.equal(called, false);
    if (originalKey) process.env.MEDFLOW_OPENAI_API_KEY = originalKey;
    if (originalFallback) process.env.OPENAI_API_KEY = originalFallback;
  });

  it("usa MEDFLOW_OPENAI_EMBEDDING_MODEL quando definido, senão text-embedding-3-small", async () => {
    process.env.MEDFLOW_OPENAI_API_KEY = "sk-test-fake";
    let capturedModel: string | undefined;
    const fakeFetch = (async (_url: string, init?: RequestInit) => {
      capturedModel = JSON.parse(String(init?.body)).model;
      return { ok: true, json: async () => ({ data: [{ embedding: [1], index: 0 }] }) } as Response;
    }) as typeof fetch;

    const port = new OpenAIAIProviderAdapter();
    await withFakeFetch(fakeFetch, () => port.invoke({ capability: "embeddings", input: { input: "x" } }));
    assert.equal(capturedModel, "text-embedding-3-small");

    process.env.MEDFLOW_OPENAI_EMBEDDING_MODEL = "text-embedding-3-large";
    await withFakeFetch(fakeFetch, () => port.invoke({ capability: "embeddings", input: { input: "x" } }));
    assert.equal(capturedModel, "text-embedding-3-large");

    delete process.env.MEDFLOW_OPENAI_API_KEY;
    delete process.env.MEDFLOW_OPENAI_EMBEDDING_MODEL;
  });

  it("não regride chat.completions — capability distinta continua indo para /v1/chat/completions", async () => {
    process.env.MEDFLOW_OPENAI_API_KEY = "sk-test-fake";
    let capturedUrl: string | undefined;
    const fakeFetch = (async (url: string) => {
      capturedUrl = url;
      return {
        ok: true,
        json: async () => ({ model: "gpt-4o-mini", choices: [{ message: { content: "oi" } }] }),
      } as Response;
    }) as typeof fetch;

    const port = new OpenAIAIProviderAdapter();
    const response = await withFakeFetch(fakeFetch, () => port.invoke({ prompt: "oi", capability: "text-generation" }));
    assert.equal(capturedUrl, "https://api.openai.com/v1/chat/completions");
    assert.equal(response.content, "oi");
    delete process.env.MEDFLOW_OPENAI_API_KEY;
  });

  it("retorna erro quando não há input nem prompt para embeddings", async () => {
    process.env.MEDFLOW_OPENAI_API_KEY = "sk-test-fake";
    const fakeFetch = (async () => {
      throw new Error("não deveria chamar fetch sem input");
    }) as unknown as typeof fetch;

    const port = new OpenAIAIProviderAdapter();
    const response = await withFakeFetch(fakeFetch, () => port.invoke({ capability: "embeddings" }));
    assert.equal(response.ok, false);
    assert.match(response.message ?? "", /sem input\/prompt/);
    delete process.env.MEDFLOW_OPENAI_API_KEY;
  });
});

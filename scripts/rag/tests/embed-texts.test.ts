import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { embedQuery, embedTexts } from "../../../src/lib/rag/embed-texts.ts";
import type { AIProviderPort } from "../../../src/lib/enterprise/ai-provider/ports/ai-provider-port.ts";
import type {
  AIConfigurationValidation,
  AIProviderCapabilities,
  AIProviderHealth,
  AIProviderInfo,
  AIRequest,
  AIResponse,
} from "../../../src/lib/enterprise/ai-provider/ports/types.ts";

/**
 * Fake determinístico de AIProviderPort para testar batching/erro de
 * embed-texts.ts sem rede — mesmo espírito de "fixtures sintéticas em vez
 * de mocks de rede" já usado nos demais testes do projeto.
 */
class FakeEmbeddingProvider implements AIProviderPort {
  readonly providerId = "test" as const;
  calls: AIRequest[] = [];

  constructor(private readonly respond: (request: AIRequest) => AIResponse) {}

  async invoke(request: AIRequest): Promise<AIResponse> {
    this.calls.push(request);
    return this.respond(request);
  }
  async health(): Promise<AIProviderHealth> {
    return { ok: true, provider: this.providerId };
  }
  capabilities(): AIProviderCapabilities {
    return {
      provider: this.providerId,
      adapterId: "fake-embeddings",
      capabilities: ["embeddings"],
      modalities: ["embedding"],
      supportsStreaming: false,
      supportsStructuredOutput: false,
      supportsVision: false,
      supportsEmbeddings: true,
      supportsToolCalling: false,
      supportsJsonMode: false,
    };
  }
  providerInfo(): AIProviderInfo {
    return {
      providerId: this.providerId,
      metadata: { name: "Fake", version: "1.0.0", vendor: "test" },
      status: "ready",
      modalities: ["embedding"],
      capabilities: ["embeddings"],
    };
  }
  supports(): boolean {
    return true;
  }
  async validateConfiguration(): Promise<AIConfigurationValidation> {
    return { ok: true, provider: this.providerId, errors: [], warnings: [] };
  }
}

function deterministicVector(seed: string): number[] {
  return [seed.length, seed.charCodeAt(0) ?? 0];
}

describe("embedTexts — F2-S1", () => {
  it("retorna vazio sem chamar o provider quando não há textos", async () => {
    let called = false;
    const port = new FakeEmbeddingProvider(() => {
      called = true;
      return { ok: true, provider: "test", data: { vectors: [] } };
    });
    const result = await embedTexts(port, []);
    assert.deepEqual(result, { vectors: [], model: "" });
    assert.equal(called, false);
  });

  it("gera um vetor por texto em uma única chamada quando cabe no lote", async () => {
    const port = new FakeEmbeddingProvider((request) => {
      const input = (request.input as { input: string[] }).input;
      return {
        ok: true,
        provider: "test",
        model: "text-embedding-3-small",
        data: { vectors: input.map(deterministicVector) },
      };
    });
    const texts = ["cláusula A", "cláusula B", "cláusula C"];
    const result = await embedTexts(port, texts, { batchSize: 64 });
    assert.equal(port.calls.length, 1);
    assert.equal(result.vectors.length, 3);
    assert.deepEqual(result.vectors[0], deterministicVector("cláusula A"));
    assert.equal(result.model, "text-embedding-3-small");
  });

  it("divide em múltiplos lotes respeitando batchSize e preserva a ordem", async () => {
    const port = new FakeEmbeddingProvider((request) => {
      const input = (request.input as { input: string[] }).input;
      return { ok: true, provider: "test", model: "m", data: { vectors: input.map(deterministicVector) } };
    });
    const texts = ["a", "bb", "ccc", "dddd", "eeeee"];
    const result = await embedTexts(port, texts, { batchSize: 2 });
    assert.equal(port.calls.length, 3); // 2 + 2 + 1
    assert.deepEqual(result.vectors, texts.map(deterministicVector));
  });

  it("lança erro quando o provider retorna ok=false", async () => {
    const port = new FakeEmbeddingProvider(() => ({
      ok: false,
      provider: "test",
      message: "chave inválida",
    }));
    await assert.rejects(() => embedTexts(port, ["x"]), /chave inválida/);
  });

  it("lança erro quando a quantidade de vetores retornados não bate com o lote enviado", async () => {
    const port = new FakeEmbeddingProvider(() => ({
      ok: true,
      provider: "test",
      data: { vectors: [[0, 0]] },
    }));
    await assert.rejects(() => embedTexts(port, ["x", "y"]), /inconsistente/);
  });
});

describe("embedQuery — F2-S1", () => {
  it("retorna o vetor único da consulta", async () => {
    const port = new FakeEmbeddingProvider((request) => {
      const input = (request.input as { input: string }).input;
      return { ok: true, provider: "test", data: { vector: deterministicVector(input) } };
    });
    const vector = await embedQuery(port, "prazo de carência");
    assert.deepEqual(vector, deterministicVector("prazo de carência"));
  });

  it("lança erro quando o provider falha", async () => {
    const port = new FakeEmbeddingProvider(() => ({ ok: false, provider: "test", message: "timeout" }));
    await assert.rejects(() => embedQuery(port, "x"), /timeout/);
  });

  it("lança erro quando a resposta não traz vetor", async () => {
    const port = new FakeEmbeddingProvider(() => ({ ok: true, provider: "test", data: {} }));
    await assert.rejects(() => embedQuery(port, "x"), /sem vetor/);
  });
});

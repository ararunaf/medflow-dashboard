#!/usr/bin/env node
/**
 * EPC-07 — AI Provider Ports Foundation
 * Prova Application → AIProviderPort → Adapter → Factory → Registry
 * sem tocar produto, sem HTTP, sem chaves de API.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  AI_CAPABILITIES,
  AI_CAPABILITY_CATALOG,
  AIProviderFactory,
  AIProviderRegistry,
  BUILTIN_AI_PROVIDER_COUNT,
  ClaudeAIProviderAdapter,
  createAIProviderFactory,
  createAIProviderPort,
  createDefaultAIProviderRegistry,
  DefaultMockAIProvider,
  GeminiAIProviderAdapter,
  getAIProviderFactory,
  getAIProviderHealthSummary,
  isKnownCapability,
  listCapabilities,
  LMStudioAIProviderAdapter,
  MOCK_AI_PROVIDER_ADAPTER_ID,
  MockAIProviderAdapter,
  OllamaAIProviderAdapter,
  OpenAIAIProviderAdapter,
  AzureOpenAIAIProviderAdapter,
  type AIProviderPort,
  type AIRequest,
} from "../../../src/lib/enterprise/ai-provider/index.ts";

const VENDOR_STUBS = ["openai", "azure-openai", "gemini", "claude", "ollama", "lm-studio"] as const;

describe("EPC-07 AIProviderPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: AIProviderPort = new MockAIProviderAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.status, "ready");

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_AI_PROVIDER_ADAPTER_ID);
    assert.equal(caps.supportsStructuredOutput, true);
    assert.ok(caps.capabilities.includes("text-generation"));
  });

  it("DefaultMockAIProvider é alias do MockAIProviderAdapter", () => {
    assert.equal(DefaultMockAIProvider, MockAIProviderAdapter);
    const port = new DefaultMockAIProvider({ provider: "mock" });
    assert.equal(port.providerId, "mock");
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createAIProviderPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("default createAIProviderPort resolve mock", async () => {
    const port = createAIProviderPort();
    assert.equal(port.providerId, "mock");
    const validation = await port.validateConfiguration();
    assert.equal(validation.ok, true);
    assert.equal(validation.errors.length, 0);
  });

  it("invoke mock é determinístico e simulado", async () => {
    const port = new MockAIProviderAdapter();
    const request: AIRequest = {
      requestId: "req-1",
      prompt: "hello enterprise",
      capability: "text-generation",
    };
    const first = await port.invoke(request);
    const second = await port.invoke(request);
    assert.equal(first.ok, true);
    assert.equal(first.simulated, true);
    assert.equal(first.content, second.content);
    assert.match(first.content ?? "", /^MOCK:text-generation:/);
  });

  it("invoke mock structured/json é determinístico", async () => {
    const port = new MockAIProviderAdapter();
    const response = await port.invoke({
      prompt: "payload",
      responseFormat: "json",
      capability: "json-mode",
    });
    assert.equal(response.ok, true);
    assert.equal(response.simulated, true);
    assert.ok(response.data);
    assert.equal(typeof response.content, "string");
  });

  it("invoke mock embeddings retorna vetor determinístico", async () => {
    const port = new MockAIProviderAdapter();
    const response = await port.invoke({
      prompt: "vectorize",
      capability: "embeddings",
    });
    assert.equal(response.ok, true);
    assert.deepEqual(response.data, {
      vector: [0.1, 0.2, 0.3, 0.4],
      dimensions: 4,
    });
  });

  it("supports / providerInfo / capabilities são coerentes", () => {
    const port = new MockAIProviderAdapter();
    assert.equal(port.supports("tool-calling"), true);
    assert.equal(port.supports("text-generation"), true);

    const info = port.providerInfo();
    assert.equal(info.providerId, "mock");
    assert.equal(info.status, "ready");
    assert.ok(info.capabilities.length >= 8);
    assert.ok(info.modalities.includes("text"));
  });

  it("catálogo de capabilities genéricas está completo e sem domínio clínico", () => {
    assert.equal(AI_CAPABILITIES.length, 8);
    assert.equal(AI_CAPABILITY_CATALOG.length, 8);
    assert.equal(isKnownCapability("text-generation"), true);
    assert.equal(isKnownCapability("tiss"), false);
    assert.equal(isKnownCapability("ocr-clinical"), false);

    const ids = listCapabilities().map((c) => c.id);
    for (const id of AI_CAPABILITIES) {
      assert.ok(ids.includes(id));
    }

    const blob = JSON.stringify(AI_CAPABILITY_CATALOG).toLowerCase();
    assert.equal(blob.includes("tiss"), false);
    assert.equal(blob.includes("paciente"), false);
    assert.equal(blob.includes("operadora"), false);
    assert.equal(blob.includes("glosa"), false);
  });

  it("todos os stubs vendor implementam o Port sem rede", async () => {
    const adapters: AIProviderPort[] = [
      new OpenAIAIProviderAdapter(),
      new AzureOpenAIAIProviderAdapter(),
      new GeminiAIProviderAdapter(),
      new ClaudeAIProviderAdapter(),
      new OllamaAIProviderAdapter(),
      new LMStudioAIProviderAdapter(),
    ];

    assert.equal(adapters.length, 6);

    for (const port of adapters) {
      const health = await port.health();
      assert.equal(health.ok, false);
      assert.equal(health.status, "stub");
      assert.match(health.message ?? "", /sem chamadas reais/i);

      const invoke = await port.invoke({ prompt: "must not leave process" });
      assert.equal(invoke.ok, false);
      assert.equal(invoke.simulated, true);
      assert.match(invoke.message ?? "", /bloqueado|stub/i);

      const validation = await port.validateConfiguration();
      assert.equal(validation.ok, false);
      assert.ok(validation.errors.length > 0);
      assert.ok(port.capabilities().adapterId.includes("stub"));
    }
  });

  it("factory instancia providers registrados sem lógica de negócio", () => {
    const factory = createAIProviderFactory();
    for (const id of ["mock", "test", ...VENDOR_STUBS] as const) {
      const port = factory.create({ provider: id });
      assert.equal(port.providerId, id);
    }
  });

  it("factory falha explicitamente para provider não registrado", () => {
    const registry = new AIProviderRegistry([]);
    const factory = new AIProviderFactory({ registry });
    assert.throws(() => factory.create({ provider: "mock" }), /não está registrado/i);
  });

  it("registry registra nome, versão, capacidades, modalidades e status", () => {
    const registry = createDefaultAIProviderRegistry();
    assert.equal(registry.snapshot().count, BUILTIN_AI_PROVIDER_COUNT);
    assert.equal(BUILTIN_AI_PROVIDER_COUNT, 8);

    const mock = registry.get("mock");
    assert.ok(mock);
    assert.equal(mock.name, "Default Mock AI Provider");
    assert.ok(mock.version.length > 0);
    assert.ok(mock.capabilities.includes("text-generation"));
    assert.ok(mock.modalities.includes("text"));
    assert.equal(mock.status, "ready");

    const stubs = registry.listByStatus("stub");
    assert.equal(stubs.length, 6);
    assert.equal(registry.supports("openai", "embeddings"), true);
    assert.equal(registry.supports("claude", "embeddings"), false);
  });

  it("getAIProviderFactory compartilha registry builtin", () => {
    const factory = getAIProviderFactory();
    assert.equal(factory.getRegistry().snapshot().count, BUILTIN_AI_PROVIDER_COUNT);
  });

  it("PoC Application resume health via Port apenas", async () => {
    const port = createAIProviderPort({ provider: "mock" });
    const summary = await getAIProviderHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.info.metadata.vendor, "medicflow-enterprise");
  });

  it("contrato não vaza conceitos clínicos nos tipos públicos do mock", async () => {
    const port = createAIProviderPort({ provider: "mock" });
    const response = await port.invoke({
      prompt: "generic",
      context: { correlationId: "c-1", attributes: { opaque: true } },
    });
    const serialized = JSON.stringify({
      caps: port.capabilities(),
      info: port.providerInfo(),
      response,
    }).toLowerCase();

    for (const forbidden of [
      "tiss",
      "paciente",
      "operadora",
      "contrato",
      "guia",
      "glosa",
      "auditoria",
      "openai.com",
      "api_key",
      "apikey",
    ]) {
      assert.equal(serialized.includes(forbidden), false, `vazamento: ${forbidden}`);
    }
  });
});

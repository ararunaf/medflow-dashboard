#!/usr/bin/env node
/**
 * EPC-16 — AI Orchestrator Foundation
 * Prova Application → AIOrchestratorPort → Adapter → Store → EPC-07 sem tocar produto.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  AIProviderRegistry,
  BUILTIN_AI_PROVIDER_COUNT,
  createDefaultAIProviderRegistry,
} from "../../../src/lib/enterprise/ai-provider/index.ts";
import {
  AI_SELECTION_POLICIES,
  AI_SELECTION_POLICY_CATALOG,
  DEFAULT_AI_ORCHESTRATOR_ADAPTER_ID,
  DEFAULT_AI_ORCHESTRATOR_STORE_ID,
  DefaultAIOrchestratorAdapter,
  DefaultAIOrchestratorStore,
  DefaultMockAIOrchestrator,
  MockAIOrchestratorAdapter,
  createAIOrchestratorFactory,
  createAIOrchestratorPort,
  createOrchestrationRequestId,
  getAIOrchestratorHealthSummary,
  getSelectionPolicy,
  isKnownSelectionPolicy,
  listSelectionPolicies,
  resetOrchestrationRequestIdSequence,
  selectProviderDeterministic,
  type AIOrchestrationRequest,
  type AIOrchestratorPort,
} from "../../../src/lib/enterprise/ai-orchestrator/index.ts";

describe("EPC-16 AIOrchestratorPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: AIOrchestratorPort = new MockAIOrchestratorAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.availableProviderCount, BUILTIN_AI_PROVIDER_COUNT);
    assert.equal(health.storedSelectionCount, 0);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsSelectProvider, true);
    assert.equal(caps.supportsGetProvider, true);
    assert.equal(caps.supportsListAvailableProviders, true);
    assert.equal(caps.supportsMultipleProviders, true);
    assert.equal(caps.supportsSelectionPolicies, true);
    assert.equal(caps.usesAiProviderFramework, true);
    assert.equal(caps.supportsFutureAiAuditor, true);
    assert.equal(caps.supportsFutureOcr, true);
    assert.equal(caps.supportsFutureWorkflow, true);
    assert.equal(caps.supportsFutureRuleEngine, true);
    assert.equal(caps.supportsFutureContractFoundation, true);
    assert.equal(caps.supportsFutureDocumentProcessing, true);
  });

  it("DefaultMockAIOrchestrator é alias do Mock", () => {
    assert.equal(DefaultMockAIOrchestrator, MockAIOrchestratorAdapter);
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createAIOrchestratorPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default adapter usa store + registry EPC-07 e declara capacidades", async () => {
    const store = new DefaultAIOrchestratorStore();
    const registry = createDefaultAIProviderRegistry();
    const port: AIOrchestratorPort = new DefaultAIOrchestratorAdapter({ store, registry });

    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_AI_ORCHESTRATOR_ADAPTER_ID);
    assert.equal(caps.usesAiProviderFramework, true);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
    assert.equal(health.availableProviderCount, BUILTIN_AI_PROVIDER_COUNT);
    assert.match(health.message ?? "", /ready|pronto/i);
  });

  it("Default adapter usa ping opcional sem IA", async () => {
    const port = new DefaultAIOrchestratorAdapter({
      store: new DefaultAIOrchestratorStore(),
      registry: createDefaultAIProviderRegistry(),
      ping: async () => ({ ok: true, message: "orchestrator probe custom" }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "orchestrator probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultAIOrchestratorAdapter", () => {
    const defaultPort = createAIOrchestratorPort();
    assert.equal(defaultPort.providerId, "default");
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createAIOrchestratorFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createAIOrchestratorPort({ provider: "mock" });
    const summary = await getAIOrchestratorHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });
});

describe("EPC-16 selection via AI Provider Framework", () => {
  it("listAvailableProviders usa Registry EPC-07", async () => {
    const port = new MockAIOrchestratorAdapter();
    const listed = await port.listAvailableProviders();
    assert.equal(listed.ok, true);
    assert.equal(listed.providers.length, BUILTIN_AI_PROVIDER_COUNT);

    const readyOnly = await port.listAvailableProviders({ status: "ready", includeStubs: false });
    assert.equal(readyOnly.ok, true);
    assert.ok(readyOnly.providers.every((p) => p.status === "ready"));
    assert.ok(readyOnly.providers.some((p) => p.providerId === "mock"));
  });

  it("getProvider retorna registration do Registry", async () => {
    const port = new MockAIOrchestratorAdapter();
    const got = await port.getProvider({ providerId: "mock" });
    assert.equal(got.ok, true);
    assert.equal(got.provider?.providerId, "mock");
    assert.equal(got.provider?.adapterId, "mock-deterministic");

    const missing = await port.getProvider({ providerId: "openai" });
    assert.equal(missing.ok, true);
    assert.equal(missing.provider?.status, "stub");
  });

  it("selectProvider escolhe preferred quando disponível (FIRST_AVAILABLE)", async () => {
    resetOrchestrationRequestIdSequence();
    const port = new MockAIOrchestratorAdapter({
      createId: () => "aio-fixed-1",
    });

    const request: AIOrchestrationRequest = {
      requestId: "aio-fixed-1",
      taskType: "generic-text",
      priority: "normal",
      preferredProviders: ["ollama", "mock"],
      fallbackProviders: ["openai"],
      requestedCapabilities: ["text-generation"],
      selectionPolicy: "FIRST_AVAILABLE",
      configurationReference: { id: "cfg-1", kind: "ai-orchestrator" },
      metadataReference: { id: "meta-1", kind: "schema", namespace: "enterprise.core" },
      tags: ["foundation"],
      customAttributes: { channel: "orchestrator" },
    };

    const result = await port.selectProvider(request);
    assert.equal(result.ok, true);
    assert.equal(result.requestId, "aio-fixed-1");
    assert.equal(result.selectedProvider, "ollama");
    assert.equal(result.executionPolicy, "FIRST_AVAILABLE");
    assert.ok(result.capabilitiesMatched?.includes("text-generation"));
    assert.match(result.selectionReason ?? "", /first_available/);
    assert.equal(result.code, "selected");
    assert.match(result.message ?? "", /no AI execution/i);

    const store = (port as MockAIOrchestratorAdapter).getStore();
    assert.equal(store.count(), 1);
    assert.equal(store.getSelection("aio-fixed-1")?.result.selectedProvider, "ollama");
  });

  it("selectProvider usa fallback quando preferred não casa capabilities", async () => {
    const port = new MockAIOrchestratorAdapter({ createId: () => "aio-fb-1" });

    const result = await port.selectProvider({
      requestId: "aio-fb-1",
      preferredProviders: ["ollama"],
      fallbackProviders: ["gemini"],
      requestedCapabilities: ["vision"],
    });

    assert.equal(result.ok, true);
    // ollama não declara vision; gemini (stub) declara
    assert.equal(result.selectedProvider, "gemini");
  });

  it("selectProvider falha deterministicamente quando nenhum Provider casa", async () => {
    const blank = new AIProviderRegistry([]);
    const port = new MockAIOrchestratorAdapter({
      registry: blank,
      createId: () => "aio-empty-1",
    });

    const result = await port.selectProvider({
      requestId: "aio-empty-1",
      preferredProviders: ["mock"],
    });

    assert.equal(result.ok, false);
    assert.equal(result.code, "no_provider");
    assert.equal(blank.list().length, 0);
  });

  it("políticas não-FIRST_AVAILABLE são estruturais (resolvidas como FIRST_AVAILABLE)", async () => {
    const port = new MockAIOrchestratorAdapter({ createId: () => "aio-pol-1" });
    const result = await port.selectProvider({
      requestId: "aio-pol-1",
      preferredProviders: ["mock"],
      selectionPolicy: "LOWEST_COST",
    });

    assert.equal(result.ok, true);
    assert.equal(result.selectedProvider, "mock");
    assert.equal(result.executionPolicy, "LOWEST_COST");
    assert.match(result.selectionReason ?? "", /foundation_resolves_as_first_available/);
  });

  it("selectProviderDeterministic é puro e não invoca IA", () => {
    const registry = createDefaultAIProviderRegistry();
    const result = selectProviderDeterministic(
      registry,
      { preferredProviders: ["mock"], requestId: "pure-1" },
      () => "pure-1",
    );
    assert.equal(result.ok, true);
    assert.equal(result.selectedProvider, "mock");
  });

  it("Default adapter selectProvider persiste no store", async () => {
    const store = new DefaultAIOrchestratorStore();
    assert.equal(store.storeId, DEFAULT_AI_ORCHESTRATOR_STORE_ID);
    const port = new DefaultAIOrchestratorAdapter({
      store,
      registry: createDefaultAIProviderRegistry(),
      createId: () => "aio-def-1",
    });

    const result = await port.selectProvider({
      requestId: "aio-def-1",
      preferredProviders: ["mock"],
    });
    assert.equal(result.ok, true);
    assert.equal(store.count(), 1);
    assert.equal(store.listSelections().length, 1);
    assert.equal(store.removeSelection("aio-def-1"), true);
    assert.equal(store.count(), 0);
  });
});

describe("EPC-16 selection policies (estrutural)", () => {
  it("catálogo contém as 5 políticas da sprint", () => {
    assert.equal(AI_SELECTION_POLICIES.length, 5);
    assert.deepEqual(
      [...AI_SELECTION_POLICIES],
      ["FIRST_AVAILABLE", "HIGHEST_PRIORITY", "BEST_CAPABILITIES", "LOWEST_COST", "CUSTOM"],
    );
    assert.equal(AI_SELECTION_POLICY_CATALOG.length, 5);
    assert.equal(listSelectionPolicies().length, 5);
    assert.equal(isKnownSelectionPolicy("FIRST_AVAILABLE"), true);
    assert.equal(isKnownSelectionPolicy("UNKNOWN"), false);
    assert.equal(getSelectionPolicy("FIRST_AVAILABLE")?.implementedInFoundation, true);
    assert.equal(getSelectionPolicy("CUSTOM")?.implementedInFoundation, false);
  });
});

describe("EPC-16 identity helpers", () => {
  it("createOrchestrationRequestId é determinístico por sequência", () => {
    resetOrchestrationRequestIdSequence();
    assert.equal(createOrchestrationRequestId(), "aio-req-1");
    assert.equal(createOrchestrationRequestId(), "aio-req-2");
    resetOrchestrationRequestIdSequence();
    assert.equal(createOrchestrationRequestId(), "aio-req-1");
  });
});

describe("EPC-16 isolation guarantees", () => {
  it("Orchestrator não exporta invoke/HTTP/auditoria", async () => {
    const port = createAIOrchestratorPort({ provider: "mock" });
    const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(port));
    assert.equal(typeof (port as { invoke?: unknown }).invoke, "undefined");
    assert.ok(keys.includes("selectProvider"));
    assert.ok(keys.includes("health"));
    assert.ok(keys.includes("capabilities"));

    const listed = await port.listAvailableProviders({ capability: "embeddings" });
    assert.ok(listed.providers.every((p) => p.capabilities.includes("embeddings")));
  });
});

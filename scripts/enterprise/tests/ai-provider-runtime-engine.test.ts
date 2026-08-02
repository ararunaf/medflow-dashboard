#!/usr/bin/env node
/**
 * ARCH-02 / DIP-07 — AI Provider Runtime Foundation
 * Prova: Runtime → Port → Adapter → Store → Factory → Provider
 *         + Enterprise Runtime + Orchestrator + AIProviderPort
 *         + ausência de bypass HTTP fora do Adapter oficial
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_AI_PROVIDER_RUNTIME_ADAPTER_ID,
  DefaultAIProviderRuntimeAdapter,
  IN_MEMORY_AI_PROVIDER_RUNTIME_STORE_ID,
  InMemoryAIProviderRuntimeStore,
  MOCK_AI_PROVIDER_RUNTIME_ADAPTER_ID,
  MockAIProviderRuntimeAdapter,
  AIProviderRuntimeFactory,
  STRUCTURAL_AI_PROVIDER_REFERENCES,
  createAIProviderRuntimeFactory,
  createAIProviderRuntimePort,
  createAIProviderRuntimeSessionId,
  getAIProviderRuntimeHealthSummary,
  resetAllAIProviderRuntimeIdSequences,
  type AIProviderRuntimePort,
} from "../../../src/lib/enterprise/ai-provider-runtime/index.ts";
import { createAIProviderPort } from "../../../src/lib/enterprise/ai-provider/index.ts";
import { createCanonicalExecutionOrchestratorPort } from "../../../src/lib/enterprise/canonical-execution-orchestrator/index.ts";
import {
  createEnterpriseRuntime,
  resetEnterpriseRuntimeForTests,
} from "../../../src/lib/enterprise/runtime/index.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../../..");

describe("ARCH-02 AI Provider Runtime", () => {
  it("default adapter exige enterpriseDeps", () => {
    assert.throws(
      () =>
        new DefaultAIProviderRuntimeAdapter({
          // @ts-expect-error — enterpriseDeps obrigatório
          enterpriseDeps: undefined,
        }),
      /enterpriseDeps/i,
    );
  });

  it("factory default falha sem enterpriseDeps", () => {
    const factory = createAIProviderRuntimeFactory();
    assert.throws(() => factory.create({ provider: "default" }), /enterpriseDeps/i);
  });

  it("mock adapter health/capabilities/invoke sem deps", async () => {
    resetAllAIProviderRuntimeIdSequences();
    const port: AIProviderRuntimePort = new MockAIProviderRuntimeAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");
    assert.equal(port.capabilities().adapterId, MOCK_AI_PROVIDER_RUNTIME_ADAPTER_ID);
    assert.equal(port.capabilities().supportsInvoke, true);

    const health = await port.health();
    assert.equal(health.ok, true);

    const response = await port.invoke({ prompt: "hello", capability: "text-generation" });
    assert.equal(response.ok, true);
    assert.equal(response.simulated, true);
    assert.match(response.content ?? "", /MOCK:ai-provider-runtime/);
  });

  it("default adapter invoca exclusivamente via AIProviderPort", async () => {
    resetAllAIProviderRuntimeIdSequences();
    const orchestrator = createCanonicalExecutionOrchestratorPort({ provider: "mock" });
    const aiProvider = createAIProviderPort({ provider: "mock" });
    const port = createAIProviderRuntimePort({
      provider: "default",
      enterpriseDeps: {
        getOrchestratorPort: () => orchestrator,
        getAIProviderPort: () => aiProvider,
      },
    });

    assert.equal(port.providerId, "default");
    assert.equal(port.capabilities().adapterId, DEFAULT_AI_PROVIDER_RUNTIME_ADAPTER_ID);
    assert.equal(port.capabilities().usesAIProviderPort, true);
    assert.equal(port.capabilities().usesCanonicalExecutionOrchestrator, true);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.aiProviderAdapterOk, true);

    const response = await port.invoke({
      requestId: "req-arch-02",
      prompt: "enterprise path",
      capability: "text-generation",
    });
    assert.equal(response.ok, true);
    assert.equal(response.provider, "mock");
    assert.equal(response.simulated, true);

    const sessions = await port.listSessions();
    assert.equal(sessions.ok, true);
    assert.equal(sessions.sessions.length, 1);
    assert.equal(sessions.sessions[0]?.invokedViaAIProviderPort, true);
    assert.equal(sessions.sessions[0]?.status, "completed");
  });

  it("coordinateInvocation registra sessão via Orchestrator + AIProviderPort", async () => {
    resetAllAIProviderRuntimeIdSequences();
    const store = new InMemoryAIProviderRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_AI_PROVIDER_RUNTIME_STORE_ID);

    const port = new DefaultAIProviderRuntimeAdapter({
      enterpriseDeps: {
        getOrchestratorPort: () => createCanonicalExecutionOrchestratorPort({ provider: "mock" }),
        getAIProviderPort: () => createAIProviderPort({ provider: "mock" }),
      },
      store,
    });

    const result = await port.coordinateInvocation({
      kind: "canonical-ai-invocation-request",
      providerReferenceId: "mock",
      metadata: {
        kind: "canonical-ai-invocation-metadata",
        correlationId: "corr-ai-02",
        channel: "test",
      },
    });

    assert.equal(result.ok, true);
    assert.ok(result.runtimeSessionId);
    assert.equal(result.invokedViaAIProviderPort, true);
    assert.equal(result.session?.status, "completed");
  });

  it("Enterprise Runtime expõe AI Provider Runtime como ponto único", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const aiRuntime = runtime.getAIProviderRuntimePort();
    const aiProvider = runtime.getAIProviderPort();

    assert.equal(aiProvider.providerId, "openai");
    assert.equal(aiRuntime.providerId, "default");

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.aiProviderRuntimeOk, true);
    assert.equal(health.aiProviderOk, true);

    const summary = await getAIProviderRuntimeHealthSummary(aiRuntime);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.capabilities.usesAIProviderPort, true);

    resetEnterpriseRuntimeForTests();
  });

  it("catálogo estrutural inclui OpenAI ready", async () => {
    const factory = new AIProviderRuntimeFactory();
    const port = factory.create({ provider: "mock" });
    const refs = await port.listProviderReferences();
    assert.equal(refs.ok, true);
    assert.equal(refs.references.length, STRUCTURAL_AI_PROVIDER_REFERENCES.length);
    const openai = refs.references.find((r) => r.providerReferenceId === "openai");
    assert.ok(openai);
    assert.equal(openai.status, "ready");
    assert.equal(openai.connected, true);
  });

  it("session id é determinístico no processo", () => {
    resetAllAIProviderRuntimeIdSequences();
    assert.equal(createAIProviderRuntimeSessionId(), "dip-ai-session-1");
    assert.equal(createAIProviderRuntimeSessionId(), "dip-ai-session-2");
  });

  it("operational-gpt-openai não contém fetch/api.openai.com (sem bypass)", () => {
    const bridge = readFileSync(
      join(repoRoot, "src/lib/server/operational-gpt-openai.ts"),
      "utf8",
    );
    assert.equal(bridge.includes("api.openai.com"), false);
    assert.equal(/\bfetch\s*\(/.test(bridge), false);
    assert.match(bridge, /getEnterpriseRuntime/);
    assert.match(bridge, /getAIProviderRuntimePort/);
  });

  it("único fetch a api.openai.com está no Adapter OpenAI oficial", () => {
    const adapter = readFileSync(
      join(repoRoot, "src/lib/enterprise/ai-provider/adapters/openai-ai-provider-adapter.ts"),
      "utf8",
    );
    assert.match(adapter, /api\.openai\.com\/v1\/chat\/completions/);
    assert.match(adapter, /\bfetch\s*\(/);
  });
});

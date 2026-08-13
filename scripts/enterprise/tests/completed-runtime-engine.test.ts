#!/usr/bin/env node
/**
 * A10-02 — Enterprise Completed Runtime Foundation
 * Prova: Application → CompletedRuntimePort → Adapter → Factory → Registry → Store
 *         + openJob / closeJob / submitRequest / registerFinding / getResult / stats
 *         + contrato CompletedContext (DocumentClassificationContext +
 *           DocumentExtractionResult + ValidationResult + AIOrchestrationContext)
 *         + ausência de completedoria real / IA / OpenAI / Azure OpenAI / Gemini /
 *           Claude / ML / regras TISS / regras de operadoras / justificativas /
 *           correções / aprovação/rejeição automáticas / persistência
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  COMPLETED_RUNTIME_IDENTITY,
  CompletedRuntimeFactory,
  CompletedRuntimeProvider,
  CompletedRuntimeRegistry,
  BUILTIN_COMPLETED_RUNTIME_PROVIDER_COUNT,
  DEFAULT_COMPLETED_RUNTIME_ADAPTER_ID,
  DEFAULT_COMPLETED_RUNTIME_ENGINE_CAPABILITIES,
  DefaultCompletedRuntimeAdapter,
  EnterpriseCompletedRuntimeAdapter,
  IN_MEMORY_COMPLETED_RUNTIME_STORE_ID,
  InMemoryCompletedRuntimeStore,
  MOCK_COMPLETED_RUNTIME_ADAPTER_ID,
  MockCompletedRuntimeAdapter,
  TEST_COMPLETED_RUNTIME_ADAPTER_ID,
  REALTISS_COMPLETED_RUNTIME_ADAPTER_ID,
  REALTISS_COMPLETED_RUNTIME_VERSION,
  RealTissCompletedRuntimeAdapter,
  TestCompletedRuntimeAdapter,
  createDefaultCompletedRuntimeRegistry,
  createDisabledCompletedTypeContract,
  createCompletedRuntimeFactory,
  createCompletedRuntimePort,
  getCompletedRuntimeFactory,
  getCompletedRuntimePort,
  resetAllCompletedRuntimeIdSequences,
  type CompletedContext,
  type CompletedRuntimePort,
  type CompletedTypeKind,
} from "../../../src/lib/enterprise/completed-runtime/index.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../../..");

function collectTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...collectTsFiles(full));
    else if (entry.endsWith(".ts")) out.push(full);
  }
  return out;
}

function assertStructuralFlagsFalse(obj: Record<string, unknown>) {
  const flags = [
    "completedEngineImplemented",
    "businessRulesImplemented",
    "tissCompletedImplemented",
    "operatorCompletedImplemented",
    "automaticCompletedImplemented",
    "completedSuggestionsImplemented",
    "completedJustificationImplemented",
    "completedScoreImplemented",
    "complianceImplemented",
    "automaticCorrectionImplemented",
  ];
  for (const flag of flags) {
    assert.equal(obj[flag], false, `${flag} deveria ser false`);
  }
}

function sampleCompletedContext(overrides: Partial<CompletedContext> = {}): CompletedContext {
  const technical = {
    ...createDisabledCompletedTypeContract("technical", "Technical Completed"),
    completedType: "technical" as const,
    structuralRole: "technical-completed" as const,
  };
  return {
    kind: "canonical-completed-context",
    structuralNotes: "A10-02 structural only",
    completedTypes: [technical],
    ...overrides,
  };
}

describe("A10-02 CompletedRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy sem completedoria real", async () => {
    const port: CompletedRuntimePort = new MockCompletedRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.runtimeReady, true);
    assertStructuralFlagsFalse(health as unknown as Record<string, unknown>);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_COMPLETED_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsOpenJob, true);
    assert.equal(caps.supportsCloseJob, true);
    assert.equal(caps.supportsSubmitRequest, true);
    assert.equal(caps.supportsRegisterFinding, true);
    assert.equal(caps.supportsGetResult, true);
    assert.equal(caps.supportsStats, true);
    assert.equal(caps.runtimeReady, true);
    assertStructuralFlagsFalse(caps as unknown as Record<string, unknown>);
  });

  it("DefaultCompletedRuntimeAdapter é o adapter enterprise oficial (enterpriseDeps opcional)", () => {
    assert.equal(EnterpriseCompletedRuntimeAdapter, DefaultCompletedRuntimeAdapter);
    const port = new DefaultCompletedRuntimeAdapter({ provider: "enterprise" });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_COMPLETED_RUNTIME_ADAPTER_ID);
  });

  it("RealTissCompletedRuntimeAdapter respeita o Port, providerId real-tiss e delega ao Default", async () => {
    const port: CompletedRuntimePort = new RealTissCompletedRuntimeAdapter({ provider: "real-tiss" });
    assert.equal(port.providerId, "real-tiss");
    assert.equal(port.capabilities().adapterId, REALTISS_COMPLETED_RUNTIME_ADAPTER_ID);
    assert.equal(port.capabilities().provider, "real-tiss");
    assert.equal(port.providerInfo().providerId, "real-tiss");
    assert.equal(port.providerInfo().metadata.vendor, "real-tiss");
    assert.equal(port.providerInfo().metadata.version, REALTISS_COMPLETED_RUNTIME_VERSION);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "real-tiss");
    assert.equal(health.runtimeReady, true);
    assertStructuralFlagsFalse(health as unknown as Record<string, unknown>);

    const opened = await port.openJob({});
    assert.equal(opened.ok, true);
    assert.equal(opened.job?.status, "job-open");
  });

  it("identity declara Enterprise Completed Runtime Foundation vendor-agnostic", () => {
    assert.equal(COMPLETED_RUNTIME_IDENTITY.name, "Enterprise Completed Runtime");
    assert.equal(COMPLETED_RUNTIME_IDENTITY.layer, "Foundation");
    assert.ok(COMPLETED_RUNTIME_IDENTITY.version);
    assert.equal(COMPLETED_RUNTIME_IDENTITY.vendorAgnostic, true);
    const info = createCompletedRuntimePort().providerInfo();
    assert.equal(info.metadata.vendorAgnostic, true);
    assert.equal(info.metadata.layer, "Foundation");
    assert.equal(info.providerType, "COMPLETED_RUNTIME");
  });

  it("provider default resolve enterprise via getCompletedRuntimePort/Provider", () => {
    const port = createCompletedRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(getCompletedRuntimePort().providerId, "enterprise");
    assert.equal(CompletedRuntimeProvider.create().providerId, "enterprise");
    assert.equal(CompletedRuntimeProvider.get().providerId, "enterprise");
    assert.ok(CompletedRuntimeProvider.getFactory() instanceof CompletedRuntimeFactory);
  });

  it("factory resolve mock / test / default / enterprise / real-tiss", () => {
    const factory = createCompletedRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(factory.create({ provider: "real-tiss" }).providerId, "real-tiss");
    assert.equal(
      getCompletedRuntimeFactory().getRegistry().list().length,
      BUILTIN_COMPLETED_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("registry registra mock / test / default / enterprise / real-tiss", () => {
    const registry = createDefaultCompletedRuntimeRegistry();
    assert.ok(registry instanceof CompletedRuntimeRegistry);
    assert.equal(registry.has("mock"), true);
    assert.equal(registry.has("test"), true);
    assert.equal(registry.has("default"), true);
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.has("real-tiss"), true);
    assert.equal(registry.snapshot().count, BUILTIN_COMPLETED_RUNTIME_PROVIDER_COUNT);
    assert.equal(registry.get("enterprise")?.capabilities.completedEngineImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.tissCompletedImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.automaticCorrectionImplemented, false);
    assert.equal(registry.get("real-tiss")?.vendor, "real-tiss");
    assert.equal(registry.get("real-tiss")?.adapterId, REALTISS_COMPLETED_RUNTIME_ADAPTER_ID);
    assert.equal(registry.get("real-tiss")?.version, REALTISS_COMPLETED_RUNTIME_VERSION);
  });

  it("openJob → submitRequest → registerFinding → getResult → closeJob → stats (sem completedoria real)", async () => {
    resetAllCompletedRuntimeIdSequences();
    const completedContext = sampleCompletedContext();
    const port = createCompletedRuntimePort({ provider: "enterprise" });

    const opened = await port.openJob({
      correlationId: "corr-a10-02",
      completedContext,
    });
    assert.equal(opened.ok, true);
    assert.equal(opened.job?.status, "job-open");
    assert.equal(opened.result?.runtimeReady, true);
    assert.equal(opened.job?.completedContext?.kind, "canonical-completed-context");
    assertStructuralFlagsFalse(opened.result as unknown as Record<string, unknown>);
    const jobId = opened.job!.jobId;

    const submitted = await port.submitRequest({
      jobId,
      findingId: "finding-a10-02",
      completedContext,
    });
    assert.equal(submitted.ok, true);
    assert.equal(submitted.request?.status, "submitted");
    assert.equal(submitted.request?.jobId, jobId);
    const requestId = submitted.request!.requestId;

    const registered = await port.registerFinding({
      jobId,
      requestId,
      findingId: "finding-a10-02",
      completedType: "technical" as CompletedTypeKind,
      completedContext,
    });
    assert.equal(registered.ok, true);
    assert.equal(registered.finding?.status, "registered");
    assert.equal(registered.finding?.completedType, "technical");
    assert.equal(registered.finding?.completedEngineImplemented, false);

    const result = await port.getResult({ jobId, requestId });
    assert.equal(result.ok, true);
    assert.equal(result.result?.runtimeReady, true);
    assert.equal(result.result?.completedEngineImplemented, false);
    assert.equal(result.result?.automaticCompletedImplemented, false);

    const closed = await port.closeJob({ jobId });
    assert.equal(closed.ok, true);
    assert.equal(closed.job?.status, "job-closed");

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "canonical-completed-statistics");
    assert.ok((stats.statistics?.totalJobs ?? 0) >= 1);
    assert.ok((stats.statistics?.totalRequests ?? 0) >= 1);
    assert.ok((stats.statistics?.totalFindings ?? 0) >= 1);
    assert.equal(stats.statistics?.completedEngineImplementedCount, 0);
    assert.equal(stats.statistics?.tissCompletedImplementedCount, 0);
    assert.equal(stats.statistics?.automaticCorrectionImplementedCount, 0);
  });

  it("InMemory store persiste jobs/requests/findings/results (A10-02)", async () => {
    const store = new InMemoryCompletedRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_COMPLETED_RUNTIME_STORE_ID);
    assert.equal(store.health().ok, true);

    const port = new DefaultCompletedRuntimeAdapter({
      provider: "enterprise",
      store,
    });
    await port.openJob({ jobId: "job-store-1" });
    await port.submitRequest({ jobId: "job-store-1", requestId: "req-store-1" });
    await port.registerFinding({ findingId: "finding-store-1", jobId: "job-store-1" });
    assert.equal(store.jobCount(), 1);
    assert.equal(store.requestCount(), 1);
    assert.equal(store.findingCount(), 1);

    const statistics = store.statistics();
    assert.equal(statistics.kind, "canonical-completed-statistics");
    assert.equal(statistics.openJobs, 1);
    assert.equal(statistics.closedJobs, 0);
  });

  it("retry recupera falha transitória em operação estrutural", async () => {
    const port = new DefaultCompletedRuntimeAdapter({
      provider: "enterprise",
      failAttempts: 1,
      defaultRetryCount: 1,
      defaultRetryBackoffMs: 1,
    });
    const result = await port.openJob({});
    assert.equal(result.ok, true);
    assert.ok((result.telemetry?.attempts ?? 0) >= 2);
  });

  it("AbortSignal cancela operação estrutural", async () => {
    const port = createCompletedRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.openJob({ signal: controller.signal });
    assert.equal(result.ok, false);
    assert.equal(result.code, "COMPLETED_RUNTIME_CANCELLED");
    assert.equal(result.telemetry.cancelled, true);
  });

  it("TestCompletedRuntimeAdapter expõe providerId test", async () => {
    const port: CompletedRuntimePort = new TestCompletedRuntimeAdapter();
    assert.equal(port.providerId, "test");
    assert.equal(port.capabilities().adapterId, TEST_COMPLETED_RUNTIME_ADAPTER_ID);
    assert.equal((await port.health()).ok, true);
  });

  it("capabilities engine declara todas as flags completed* = false", () => {
    assert.equal(DEFAULT_COMPLETED_RUNTIME_ENGINE_CAPABILITIES.completedEngineImplemented, false);
    assert.equal(DEFAULT_COMPLETED_RUNTIME_ENGINE_CAPABILITIES.businessRulesImplemented, false);
    assert.equal(DEFAULT_COMPLETED_RUNTIME_ENGINE_CAPABILITIES.tissCompletedImplemented, false);
    assert.equal(DEFAULT_COMPLETED_RUNTIME_ENGINE_CAPABILITIES.operatorCompletedImplemented, false);
    assert.equal(DEFAULT_COMPLETED_RUNTIME_ENGINE_CAPABILITIES.automaticCompletedImplemented, false);
    assert.equal(DEFAULT_COMPLETED_RUNTIME_ENGINE_CAPABILITIES.completedSuggestionsImplemented, false);
    assert.equal(DEFAULT_COMPLETED_RUNTIME_ENGINE_CAPABILITIES.completedJustificationImplemented, false);
    assert.equal(DEFAULT_COMPLETED_RUNTIME_ENGINE_CAPABILITIES.completedScoreImplemented, false);
    assert.equal(DEFAULT_COMPLETED_RUNTIME_ENGINE_CAPABILITIES.complianceImplemented, false);
    assert.equal(DEFAULT_COMPLETED_RUNTIME_ENGINE_CAPABILITIES.automaticCorrectionImplemented, false);
  });

  it("módulo não importa OpenAI/Azure/Gemini/Claude/HTTP/ML/DB funcional", () => {
    const moduleRoot = join(repoRoot, "src/lib/enterprise/completed-runtime");
    const files = collectTsFiles(moduleRoot);
    assert.ok(files.length > 0);
    const forbidden = [
      /from ["']openai/i,
      /from ["']@openai/i,
      /from ["']@azure\/openai/i,
      /from ["']anthropic/i,
      /from ["']@anthropic/i,
      /from ["']@google\/generative-ai/i,
      /from ["']ollama/i,
      /langchain/i,
      /@tensorflow\//i,
      /@huggingface\//i,
      /\.predict\s*\(/,
      /createEmbedding\s*\(/i,
      /fetch\s*\(/,
      /https?:\/\//,
      /from ["']axios["']/,
      /new\s+FormData\s*\(/,
      /fs\.readFile/i,
      /createReadStream\s*\(/,
      /from ["']@supabase/i,
      /CREATE TABLE/i,
    ];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        assert.equal(pattern.test(source), false, `${file} bateu em ${pattern}`);
      }
    }
  });

  it("ECS-01 pastas obrigatórias existem", () => {
    const base = join(repoRoot, "src/lib/enterprise/completed-runtime");
    for (const folder of [
      "ports",
      "providers",
      "factory",
      "registry",
      "adapters",
      "store",
    ]) {
      assert.equal(statSync(join(base, folder)).isDirectory(), true);
    }
    assert.equal(statSync(join(base, "index.ts")).isFile(), true);
  });
});

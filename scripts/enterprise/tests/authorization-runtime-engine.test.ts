#!/usr/bin/env node
/**
 * S3-02 — Enterprise Authorization Runtime Foundation
 * Prova: Application → AuthorizationRuntimePort → Adapter → Factory → Registry → Store
 *         + openJob / closeJob / submitRequest / registerFinding / getResult / stats
 *         + ausência de identidade real / criptografia / assinatura digital /
 *           cadeia de custódia / Key Vault / HSM / SIEM / OpenTelemetry / LGPD /
 *           autenticação / autorização / persistência
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AUTHORIZATION_RUNTIME_IDENTITY,
  AuthorizationRuntimeFactory,
  AuthorizationRuntimeProvider,
  AuthorizationRuntimeRegistry,
  BUILTIN_AUTHORIZATION_RUNTIME_PROVIDER_COUNT,
  DEFAULT_AUTHORIZATION_RUNTIME_ADAPTER_ID,
  DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES,
  DefaultAuthorizationRuntimeAdapter,
  EnterpriseAuthorizationRuntimeAdapter,
  IN_MEMORY_AUTHORIZATION_RUNTIME_STORE_ID,
  InMemoryAuthorizationRuntimeStore,
  MOCK_AUTHORIZATION_RUNTIME_ADAPTER_ID,
  MockAuthorizationRuntimeAdapter,
  TEST_AUTHORIZATION_RUNTIME_ADAPTER_ID,
  REALTISS_AUTHORIZATION_RUNTIME_ADAPTER_ID,
  REALTISS_AUTHORIZATION_RUNTIME_VERSION,
  RealTissAuthorizationRuntimeAdapter,
  TestAuthorizationRuntimeAdapter,
  createDefaultAuthorizationRuntimeRegistry,
  createDisabledAuthorizationTypeContract,
  createAuthorizationRuntimeFactory,
  createAuthorizationRuntimePort,
  getAuthorizationRuntimeFactory,
  getAuthorizationRuntimePort,
  resetAllAuthorizationRuntimeIdSequences,
  type AuthorizationContext,
  type AuthorizationRuntimePort,
  type AuthorizationTypeKind,
} from "../../../src/lib/enterprise/authorization-runtime/index.ts";

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
    "authorizationEngineImplemented",
    "businessRulesImplemented",
    "tissAuthorizationImplemented",
    "operatorAuthorizationImplemented",
    "automaticAuthorizationImplemented",
    "authorizationSuggestionsImplemented",
    "authorizationJustificationImplemented",
    "authorizationScoreImplemented",
    "complianceImplemented",
    "automaticCorrectionImplemented",
  ];
  for (const flag of flags) {
    assert.equal(obj[flag], false, `${flag} deveria ser false`);
  }
}

function sampleAuthorizationContext(overrides: Partial<AuthorizationContext> = {}): AuthorizationContext {
  const technical = {
    ...createDisabledAuthorizationTypeContract("technical", "Technical Authorization"),
    authorizationType: "technical" as const,
    structuralRole: "technical-authorization" as const,
  };
  return {
    kind: "canonical-authorization-context",
    structuralNotes: "S3-02 structural only",
    authorizationTypes: [technical],
    ...overrides,
  };
}

describe("S3-02 AuthorizationRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy sem identidade real", async () => {
    const port: AuthorizationRuntimePort = new MockAuthorizationRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.runtimeReady, true);
    assertStructuralFlagsFalse(health as unknown as Record<string, unknown>);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_AUTHORIZATION_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsOpenJob, true);
    assert.equal(caps.supportsCloseJob, true);
    assert.equal(caps.supportsSubmitRequest, true);
    assert.equal(caps.supportsRegisterFinding, true);
    assert.equal(caps.supportsGetResult, true);
    assert.equal(caps.supportsStats, true);
    assert.equal(caps.runtimeReady, true);
    assertStructuralFlagsFalse(caps as unknown as Record<string, unknown>);
  });

  it("DefaultAuthorizationRuntimeAdapter é o adapter enterprise oficial (enterpriseDeps opcional)", () => {
    assert.equal(EnterpriseAuthorizationRuntimeAdapter, DefaultAuthorizationRuntimeAdapter);
    const port = new DefaultAuthorizationRuntimeAdapter({ provider: "enterprise" });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_AUTHORIZATION_RUNTIME_ADAPTER_ID);
  });

  it("RealTissAuthorizationRuntimeAdapter respeita o Port, providerId real-tiss e delega ao Default", async () => {
    const port: AuthorizationRuntimePort = new RealTissAuthorizationRuntimeAdapter({ provider: "real-tiss" });
    assert.equal(port.providerId, "real-tiss");
    assert.equal(port.capabilities().adapterId, REALTISS_AUTHORIZATION_RUNTIME_ADAPTER_ID);
    assert.equal(port.capabilities().provider, "real-tiss");
    assert.equal(port.providerInfo().providerId, "real-tiss");
    assert.equal(port.providerInfo().metadata.vendor, "real-tiss");
    assert.equal(port.providerInfo().metadata.version, REALTISS_AUTHORIZATION_RUNTIME_VERSION);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "real-tiss");
    assert.equal(health.runtimeReady, true);
    assertStructuralFlagsFalse(health as unknown as Record<string, unknown>);

    const opened = await port.openJob({});
    assert.equal(opened.ok, true);
    assert.equal(opened.job?.status, "job-open");
  });

  it("authorization declara Enterprise Authorization Runtime Foundation vendor-agnostic", () => {
    assert.equal(AUTHORIZATION_RUNTIME_IDENTITY.name, "Enterprise Authorization Runtime");
    assert.equal(AUTHORIZATION_RUNTIME_IDENTITY.layer, "Foundation");
    assert.ok(AUTHORIZATION_RUNTIME_IDENTITY.version);
    assert.equal(AUTHORIZATION_RUNTIME_IDENTITY.vendorAgnostic, true);
    const info = createAuthorizationRuntimePort().providerInfo();
    assert.equal(info.metadata.vendorAgnostic, true);
    assert.equal(info.metadata.layer, "Foundation");
    assert.equal(info.providerType, "AUTHORIZATION_RUNTIME");
  });

  it("provider default resolve enterprise via getAuthorizationRuntimePort/Provider", () => {
    const port = createAuthorizationRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(getAuthorizationRuntimePort().providerId, "enterprise");
    assert.equal(AuthorizationRuntimeProvider.create().providerId, "enterprise");
    assert.equal(AuthorizationRuntimeProvider.get().providerId, "enterprise");
    assert.ok(AuthorizationRuntimeProvider.getFactory() instanceof AuthorizationRuntimeFactory);
  });

  it("factory resolve mock / test / default / enterprise / real-tiss", () => {
    const factory = createAuthorizationRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(factory.create({ provider: "real-tiss" }).providerId, "real-tiss");
    assert.equal(
      getAuthorizationRuntimeFactory().getRegistry().list().length,
      BUILTIN_AUTHORIZATION_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("registry registra mock / test / default / enterprise / real-tiss", () => {
    const registry = createDefaultAuthorizationRuntimeRegistry();
    assert.ok(registry instanceof AuthorizationRuntimeRegistry);
    assert.equal(registry.has("mock"), true);
    assert.equal(registry.has("test"), true);
    assert.equal(registry.has("default"), true);
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.has("real-tiss"), true);
    assert.equal(registry.snapshot().count, BUILTIN_AUTHORIZATION_RUNTIME_PROVIDER_COUNT);
    assert.equal(registry.get("enterprise")?.capabilities.authorizationEngineImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.tissAuthorizationImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.automaticCorrectionImplemented, false);
    assert.equal(registry.get("real-tiss")?.vendor, "real-tiss");
    assert.equal(registry.get("real-tiss")?.adapterId, REALTISS_AUTHORIZATION_RUNTIME_ADAPTER_ID);
    assert.equal(registry.get("real-tiss")?.version, REALTISS_AUTHORIZATION_RUNTIME_VERSION);
  });

  it("openJob → submitRequest → registerFinding → getResult → closeJob → stats (sem identidade real)", async () => {
    resetAllAuthorizationRuntimeIdSequences();
    const authorizationContext = sampleAuthorizationContext();
    const port = createAuthorizationRuntimePort({ provider: "enterprise" });

    const opened = await port.openJob({
      correlationId: "corr-s1-02",
      authorizationContext,
    });
    assert.equal(opened.ok, true);
    assert.equal(opened.job?.status, "job-open");
    assert.equal(opened.result?.runtimeReady, true);
    assert.equal(opened.job?.authorizationContext?.kind, "canonical-authorization-context");
    assertStructuralFlagsFalse(opened.result as unknown as Record<string, unknown>);
    const jobId = opened.job!.jobId;

    const submitted = await port.submitRequest({
      jobId,
      findingId: "finding-s1-02",
      authorizationContext,
    });
    assert.equal(submitted.ok, true);
    assert.equal(submitted.request?.status, "submitted");
    assert.equal(submitted.request?.jobId, jobId);
    const requestId = submitted.request!.requestId;

    const registered = await port.registerFinding({
      jobId,
      requestId,
      findingId: "finding-s1-02",
      authorizationType: "technical" as AuthorizationTypeKind,
      authorizationContext,
    });
    assert.equal(registered.ok, true);
    assert.equal(registered.finding?.status, "registered");
    assert.equal(registered.finding?.authorizationType, "technical");
    assert.equal(registered.finding?.authorizationEngineImplemented, false);

    const result = await port.getResult({ jobId, requestId });
    assert.equal(result.ok, true);
    assert.equal(result.result?.runtimeReady, true);
    assert.equal(result.result?.authorizationEngineImplemented, false);
    assert.equal(result.result?.automaticAuthorizationImplemented, false);

    const closed = await port.closeJob({ jobId });
    assert.equal(closed.ok, true);
    assert.equal(closed.job?.status, "job-closed");

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "canonical-authorization-statistics");
    assert.ok((stats.statistics?.totalJobs ?? 0) >= 1);
    assert.ok((stats.statistics?.totalRequests ?? 0) >= 1);
    assert.ok((stats.statistics?.totalFindings ?? 0) >= 1);
    assert.equal(stats.statistics?.authorizationEngineImplementedCount, 0);
    assert.equal(stats.statistics?.tissAuthorizationImplementedCount, 0);
    assert.equal(stats.statistics?.automaticCorrectionImplementedCount, 0);
  });

  it("InMemory store persiste jobs/requests/findings/results (S3-02)", async () => {
    const store = new InMemoryAuthorizationRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_AUTHORIZATION_RUNTIME_STORE_ID);
    assert.equal(store.health().ok, true);

    const port = new DefaultAuthorizationRuntimeAdapter({
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
    assert.equal(statistics.kind, "canonical-authorization-statistics");
    assert.equal(statistics.openJobs, 1);
    assert.equal(statistics.closedJobs, 0);
  });

  it("retry recupera falha transitória em operação estrutural", async () => {
    const port = new DefaultAuthorizationRuntimeAdapter({
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
    const port = createAuthorizationRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.openJob({ signal: controller.signal });
    assert.equal(result.ok, false);
    assert.equal(result.code, "AUTHORIZATION_RUNTIME_CANCELLED");
    assert.equal(result.telemetry.cancelled, true);
  });

  it("TestAuthorizationRuntimeAdapter expõe providerId test", async () => {
    const port: AuthorizationRuntimePort = new TestAuthorizationRuntimeAdapter();
    assert.equal(port.providerId, "test");
    assert.equal(port.capabilities().adapterId, TEST_AUTHORIZATION_RUNTIME_ADAPTER_ID);
    assert.equal((await port.health()).ok, true);
  });

  it("capabilities engine declara todas as flags authorization* = false", () => {
    assert.equal(DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES.authorizationEngineImplemented, false);
    assert.equal(DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES.businessRulesImplemented, false);
    assert.equal(DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES.tissAuthorizationImplemented, false);
    assert.equal(DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES.operatorAuthorizationImplemented, false);
    assert.equal(DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES.automaticAuthorizationImplemented, false);
    assert.equal(DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES.authorizationSuggestionsImplemented, false);
    assert.equal(DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES.authorizationJustificationImplemented, false);
    assert.equal(DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES.authorizationScoreImplemented, false);
    assert.equal(DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES.complianceImplemented, false);
    assert.equal(DEFAULT_AUTHORIZATION_RUNTIME_ENGINE_CAPABILITIES.automaticCorrectionImplemented, false);
  });

  it("módulo não importa OpenAI/Azure/crypto/HSM/SIEM/OpenTelemetry/HTTP/DB/Supabase", () => {
    const moduleRoot = join(repoRoot, "src/lib/enterprise/authorization-runtime");
    const files = collectTsFiles(moduleRoot);
    assert.ok(files.length > 0);
    const forbidden = [
      /from ["']openai/i,
      /from ["']@openai/i,
      /from ["']@azure/i,
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
      /from ["']crypto["']/i,
      /from ["']node:crypto["']/i,
      /from ["']crypto-js["']/i,
      /from ["']jsonwebtoken["']/i,
      /from ["']bcrypt["']/i,
      /from ["']hsm/i,
      /from ["']@azure\/keyvault/i,
      /from ["']@opentelemetry/i,
      /from ["'][^"']*siem/i,
    ];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        assert.equal(pattern.test(source), false, `${file} bateu em ${pattern}`);
      }
    }
  });

  it("ECS-01 pastas obrigatórias existem", () => {
    const base = join(repoRoot, "src/lib/enterprise/authorization-runtime");
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

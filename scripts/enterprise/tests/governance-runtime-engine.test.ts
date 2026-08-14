#!/usr/bin/env node
/**
 * S6-02 — Enterprise Governance Runtime Foundation
 * Prova: Application → GovernanceRuntimePort → Adapter → Factory → Registry → Store
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
  GOVERNANCE_RUNTIME_IDENTITY,
  GovernanceRuntimeFactory,
  GovernanceRuntimeProvider,
  GovernanceRuntimeRegistry,
  BUILTIN_GOVERNANCE_RUNTIME_PROVIDER_COUNT,
  DEFAULT_GOVERNANCE_RUNTIME_ADAPTER_ID,
  DEFAULT_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES,
  DefaultGovernanceRuntimeAdapter,
  EnterpriseGovernanceRuntimeAdapter,
  IN_MEMORY_GOVERNANCE_RUNTIME_STORE_ID,
  InMemoryGovernanceRuntimeStore,
  MOCK_GOVERNANCE_RUNTIME_ADAPTER_ID,
  MockGovernanceRuntimeAdapter,
  TEST_GOVERNANCE_RUNTIME_ADAPTER_ID,
  REALTISS_GOVERNANCE_RUNTIME_ADAPTER_ID,
  REALTISS_GOVERNANCE_RUNTIME_VERSION,
  RealTissGovernanceRuntimeAdapter,
  TestGovernanceRuntimeAdapter,
  createDefaultGovernanceRuntimeRegistry,
  createDisabledGovernanceTypeContract,
  createGovernanceRuntimeFactory,
  createGovernanceRuntimePort,
  getGovernanceRuntimeFactory,
  getGovernanceRuntimePort,
  resetAllGovernanceRuntimeIdSequences,
  type GovernanceContext,
  type GovernanceRuntimePort,
  type GovernanceTypeKind,
} from "../../../src/lib/enterprise/governance-runtime/index.ts";

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
    "governanceEngineImplemented",
    "lgpdImplemented",
    "privacyImplemented",
    "dataClassificationImplemented",
    "consentManagementImplemented",
    "auditGovernanceImplemented",
    "retentionImplemented",
    "chainOfCustodyImplemented",
    "digitalSignatureImplemented",
    "encryptionImplemented",
    "hsmImplemented",
    "keyVaultImplemented",
    "siemImplemented",
    "openTelemetryImplemented",
    "automaticGovernanceImplemented",
  ];
  for (const flag of flags) {
    assert.equal(obj[flag], false, `${flag} deveria ser false`);
  }
}

function sampleGovernanceContext(overrides: Partial<GovernanceContext> = {}): GovernanceContext {
  const technical = {
    ...createDisabledGovernanceTypeContract("technical", "Technical Governance"),
    governanceType: "technical" as const,
    structuralRole: "technical-governance" as const,
  };
  return {
    kind: "canonical-governance-context",
    structuralNotes: "S6-02 structural only",
    governanceTypes: [technical],
    ...overrides,
  };
}

describe("S6-02 GovernanceRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy sem identidade real", async () => {
    const port: GovernanceRuntimePort = new MockGovernanceRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.runtimeReady, true);
    assertStructuralFlagsFalse(health as unknown as Record<string, unknown>);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_GOVERNANCE_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsOpenJob, true);
    assert.equal(caps.supportsCloseJob, true);
    assert.equal(caps.supportsSubmitRequest, true);
    assert.equal(caps.supportsRegisterFinding, true);
    assert.equal(caps.supportsGetResult, true);
    assert.equal(caps.supportsStats, true);
    assert.equal(caps.runtimeReady, true);
    assertStructuralFlagsFalse(caps as unknown as Record<string, unknown>);
  });

  it("DefaultGovernanceRuntimeAdapter é o adapter enterprise oficial (enterpriseDeps opcional)", () => {
    assert.equal(EnterpriseGovernanceRuntimeAdapter, DefaultGovernanceRuntimeAdapter);
    const port = new DefaultGovernanceRuntimeAdapter({ provider: "enterprise" });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_GOVERNANCE_RUNTIME_ADAPTER_ID);
  });

  it("RealTissGovernanceRuntimeAdapter respeita o Port, providerId real-tiss e delega ao Default", async () => {
    const port: GovernanceRuntimePort = new RealTissGovernanceRuntimeAdapter({ provider: "real-tiss" });
    assert.equal(port.providerId, "real-tiss");
    assert.equal(port.capabilities().adapterId, REALTISS_GOVERNANCE_RUNTIME_ADAPTER_ID);
    assert.equal(port.capabilities().provider, "real-tiss");
    assert.equal(port.providerInfo().providerId, "real-tiss");
    assert.equal(port.providerInfo().metadata.vendor, "real-tiss");
    assert.equal(port.providerInfo().metadata.version, REALTISS_GOVERNANCE_RUNTIME_VERSION);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "real-tiss");
    assert.equal(health.runtimeReady, true);
    assertStructuralFlagsFalse(health as unknown as Record<string, unknown>);

    const opened = await port.openJob({});
    assert.equal(opened.ok, true);
    assert.equal(opened.job?.status, "job-open");
  });

  it("governance declara Enterprise Governance Runtime Foundation vendor-agnostic", () => {
    assert.equal(GOVERNANCE_RUNTIME_IDENTITY.name, "Enterprise Governance Runtime");
    assert.equal(GOVERNANCE_RUNTIME_IDENTITY.layer, "Foundation");
    assert.ok(GOVERNANCE_RUNTIME_IDENTITY.version);
    assert.equal(GOVERNANCE_RUNTIME_IDENTITY.vendorAgnostic, true);
    const info = createGovernanceRuntimePort().providerInfo();
    assert.equal(info.metadata.vendorAgnostic, true);
    assert.equal(info.metadata.layer, "Foundation");
    assert.equal(info.providerType, "GOVERNANCE_RUNTIME");
  });

  it("provider default resolve enterprise via getGovernanceRuntimePort/Provider", () => {
    const port = createGovernanceRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(getGovernanceRuntimePort().providerId, "enterprise");
    assert.equal(GovernanceRuntimeProvider.create().providerId, "enterprise");
    assert.equal(GovernanceRuntimeProvider.get().providerId, "enterprise");
    assert.ok(GovernanceRuntimeProvider.getFactory() instanceof GovernanceRuntimeFactory);
  });

  it("factory resolve mock / test / default / enterprise / real-tiss", () => {
    const factory = createGovernanceRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(factory.create({ provider: "real-tiss" }).providerId, "real-tiss");
    assert.equal(
      getGovernanceRuntimeFactory().getRegistry().list().length,
      BUILTIN_GOVERNANCE_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("registry registra mock / test / default / enterprise / real-tiss", () => {
    const registry = createDefaultGovernanceRuntimeRegistry();
    assert.ok(registry instanceof GovernanceRuntimeRegistry);
    assert.equal(registry.has("mock"), true);
    assert.equal(registry.has("test"), true);
    assert.equal(registry.has("default"), true);
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.has("real-tiss"), true);
    assert.equal(registry.snapshot().count, BUILTIN_GOVERNANCE_RUNTIME_PROVIDER_COUNT);
    assert.equal(registry.get("enterprise")?.capabilities.governanceEngineImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.tissGovernanceImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.automaticCorrectionImplemented, false);
    assert.equal(registry.get("real-tiss")?.vendor, "real-tiss");
    assert.equal(registry.get("real-tiss")?.adapterId, REALTISS_GOVERNANCE_RUNTIME_ADAPTER_ID);
    assert.equal(registry.get("real-tiss")?.version, REALTISS_GOVERNANCE_RUNTIME_VERSION);
  });

  it("openJob → submitRequest → registerFinding → getResult → closeJob → stats (sem identidade real)", async () => {
    resetAllGovernanceRuntimeIdSequences();
    const governanceContext = sampleGovernanceContext();
    const port = createGovernanceRuntimePort({ provider: "enterprise" });

    const opened = await port.openJob({
      correlationId: "corr-s6-02",
      governanceContext,
    });
    assert.equal(opened.ok, true);
    assert.equal(opened.job?.status, "job-open");
    assert.equal(opened.result?.runtimeReady, true);
    assert.equal(opened.job?.governanceContext?.kind, "canonical-governance-context");
    assertStructuralFlagsFalse(opened.result as unknown as Record<string, unknown>);
    const jobId = opened.job!.jobId;

    const submitted = await port.submitRequest({
      jobId,
      findingId: "finding-s6-02",
      governanceContext,
    });
    assert.equal(submitted.ok, true);
    assert.equal(submitted.request?.status, "submitted");
    assert.equal(submitted.request?.jobId, jobId);
    const requestId = submitted.request!.requestId;

    const registered = await port.registerFinding({
      jobId,
      requestId,
      findingId: "finding-s6-02",
      governanceType: "technical" as GovernanceTypeKind,
      governanceContext,
    });
    assert.equal(registered.ok, true);
    assert.equal(registered.finding?.status, "registered");
    assert.equal(registered.finding?.governanceType, "technical");
    assert.equal(registered.finding?.governanceEngineImplemented, false);

    const result = await port.getResult({ jobId, requestId });
    assert.equal(result.ok, true);
    assert.equal(result.result?.runtimeReady, true);
    assert.equal(result.result?.governanceEngineImplemented, false);
    assert.equal(result.result?.automaticGovernanceImplemented, false);

    const closed = await port.closeJob({ jobId });
    assert.equal(closed.ok, true);
    assert.equal(closed.job?.status, "job-closed");

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "canonical-governance-statistics");
    assert.ok((stats.statistics?.totalJobs ?? 0) >= 1);
    assert.ok((stats.statistics?.totalRequests ?? 0) >= 1);
    assert.ok((stats.statistics?.totalFindings ?? 0) >= 1);
    assert.equal(stats.statistics?.governanceEngineImplementedCount, 0);
    assert.equal(stats.statistics?.tissGovernanceImplementedCount, 0);
    assert.equal(stats.statistics?.automaticCorrectionImplementedCount, 0);
  });

  it("InMemory store persiste jobs/requests/findings/results (S6-02)", async () => {
    const store = new InMemoryGovernanceRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_GOVERNANCE_RUNTIME_STORE_ID);
    assert.equal(store.health().ok, true);

    const port = new DefaultGovernanceRuntimeAdapter({
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
    assert.equal(statistics.kind, "canonical-governance-statistics");
    assert.equal(statistics.openJobs, 1);
    assert.equal(statistics.closedJobs, 0);
  });

  it("retry recupera falha transitória em operação estrutural", async () => {
    const port = new DefaultGovernanceRuntimeAdapter({
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
    const port = createGovernanceRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.openJob({ signal: controller.signal });
    assert.equal(result.ok, false);
    assert.equal(result.code, "GOVERNANCE_RUNTIME_CANCELLED");
    assert.equal(result.telemetry.cancelled, true);
  });

  it("TestGovernanceRuntimeAdapter expõe providerId test", async () => {
    const port: GovernanceRuntimePort = new TestGovernanceRuntimeAdapter();
    assert.equal(port.providerId, "test");
    assert.equal(port.capabilities().adapterId, TEST_GOVERNANCE_RUNTIME_ADAPTER_ID);
    assert.equal((await port.health()).ok, true);
  });

  it("capabilities engine declara todas as flags governance* = false", () => {
    assert.equal(DEFAULT_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES.governanceEngineImplemented, false);
    assert.equal(DEFAULT_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES.businessRulesImplemented, false);
    assert.equal(DEFAULT_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES.tissGovernanceImplemented, false);
    assert.equal(DEFAULT_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES.operatorGovernanceImplemented, false);
    assert.equal(DEFAULT_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES.automaticGovernanceImplemented, false);
    assert.equal(DEFAULT_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES.governanceSuggestionsImplemented, false);
    assert.equal(DEFAULT_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES.governanceJustificationImplemented, false);
    assert.equal(DEFAULT_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES.governanceScoreImplemented, false);
    assert.equal(DEFAULT_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES.governanceImplemented, false);
    assert.equal(DEFAULT_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES.automaticCorrectionImplemented, false);
  });

  it("módulo não importa OpenAI/Azure/crypto/HSM/SIEM/OpenTelemetry/HTTP/DB/Supabase", () => {
    const moduleRoot = join(repoRoot, "src/lib/enterprise/governance-runtime");
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
    const base = join(repoRoot, "src/lib/enterprise/governance-runtime");
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

  it("GovernanceRuntimePort possui exatamente 9 métodos", () => {
    const port = createGovernanceRuntimePort({ provider: "enterprise" });
    const methods = [
      "openJob",
      "closeJob",
      "submitRequest",
      "registerFinding",
      "getResult",
      "stats",
      "health",
      "capabilities",
      "providerInfo",
    ];
    assert.equal(Object.keys(port).filter((k) => methods.includes(k)).length, 0);
    for (const m of methods) {
      assert.equal(typeof (port as unknown as Record<string, unknown>)[m], "function", m);
    }
  });
});

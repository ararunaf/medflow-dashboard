#!/usr/bin/env node
/**
 * S5-02 — Enterprise Compliance Runtime Foundation
 * Prova: Application → ComplianceRuntimePort → Adapter → Factory → Registry → Store
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
  COMPLIANCE_RUNTIME_IDENTITY,
  ComplianceRuntimeFactory,
  ComplianceRuntimeProvider,
  ComplianceRuntimeRegistry,
  BUILTIN_COMPLIANCE_RUNTIME_PROVIDER_COUNT,
  DEFAULT_COMPLIANCE_RUNTIME_ADAPTER_ID,
  DEFAULT_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES,
  DefaultComplianceRuntimeAdapter,
  EnterpriseComplianceRuntimeAdapter,
  IN_MEMORY_COMPLIANCE_RUNTIME_STORE_ID,
  InMemoryComplianceRuntimeStore,
  MOCK_COMPLIANCE_RUNTIME_ADAPTER_ID,
  MockComplianceRuntimeAdapter,
  TEST_COMPLIANCE_RUNTIME_ADAPTER_ID,
  REALTISS_COMPLIANCE_RUNTIME_ADAPTER_ID,
  REALTISS_COMPLIANCE_RUNTIME_VERSION,
  RealTissComplianceRuntimeAdapter,
  TestComplianceRuntimeAdapter,
  createDefaultComplianceRuntimeRegistry,
  createDisabledComplianceTypeContract,
  createComplianceRuntimeFactory,
  createComplianceRuntimePort,
  getComplianceRuntimeFactory,
  getComplianceRuntimePort,
  resetAllComplianceRuntimeIdSequences,
  type ComplianceContext,
  type ComplianceRuntimePort,
  type ComplianceTypeKind,
} from "../../../src/lib/enterprise/compliance-runtime/index.ts";

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
    "complianceEngineImplemented",
    "lgpdImplemented",
    "privacyImplemented",
    "dataClassificationImplemented",
    "consentManagementImplemented",
    "auditComplianceImplemented",
    "retentionImplemented",
    "chainOfCustodyImplemented",
    "digitalSignatureImplemented",
    "encryptionImplemented",
    "hsmImplemented",
    "keyVaultImplemented",
    "siemImplemented",
    "openTelemetryImplemented",
    "automaticComplianceImplemented",
  ];
  for (const flag of flags) {
    assert.equal(obj[flag], false, `${flag} deveria ser false`);
  }
}

function sampleComplianceContext(overrides: Partial<ComplianceContext> = {}): ComplianceContext {
  const technical = {
    ...createDisabledComplianceTypeContract("technical", "Technical Compliance"),
    complianceType: "technical" as const,
    structuralRole: "technical-compliance" as const,
  };
  return {
    kind: "canonical-compliance-context",
    structuralNotes: "S5-02 structural only",
    complianceTypes: [technical],
    ...overrides,
  };
}

describe("S5-02 ComplianceRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy sem identidade real", async () => {
    const port: ComplianceRuntimePort = new MockComplianceRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.runtimeReady, true);
    assertStructuralFlagsFalse(health as unknown as Record<string, unknown>);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_COMPLIANCE_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsOpenJob, true);
    assert.equal(caps.supportsCloseJob, true);
    assert.equal(caps.supportsSubmitRequest, true);
    assert.equal(caps.supportsRegisterFinding, true);
    assert.equal(caps.supportsGetResult, true);
    assert.equal(caps.supportsStats, true);
    assert.equal(caps.runtimeReady, true);
    assertStructuralFlagsFalse(caps as unknown as Record<string, unknown>);
  });

  it("DefaultComplianceRuntimeAdapter é o adapter enterprise oficial (enterpriseDeps opcional)", () => {
    assert.equal(EnterpriseComplianceRuntimeAdapter, DefaultComplianceRuntimeAdapter);
    const port = new DefaultComplianceRuntimeAdapter({ provider: "enterprise" });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_COMPLIANCE_RUNTIME_ADAPTER_ID);
  });

  it("RealTissComplianceRuntimeAdapter respeita o Port, providerId real-tiss e delega ao Default", async () => {
    const port: ComplianceRuntimePort = new RealTissComplianceRuntimeAdapter({ provider: "real-tiss" });
    assert.equal(port.providerId, "real-tiss");
    assert.equal(port.capabilities().adapterId, REALTISS_COMPLIANCE_RUNTIME_ADAPTER_ID);
    assert.equal(port.capabilities().provider, "real-tiss");
    assert.equal(port.providerInfo().providerId, "real-tiss");
    assert.equal(port.providerInfo().metadata.vendor, "real-tiss");
    assert.equal(port.providerInfo().metadata.version, REALTISS_COMPLIANCE_RUNTIME_VERSION);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "real-tiss");
    assert.equal(health.runtimeReady, true);
    assertStructuralFlagsFalse(health as unknown as Record<string, unknown>);

    const opened = await port.openJob({});
    assert.equal(opened.ok, true);
    assert.equal(opened.job?.status, "job-open");
  });

  it("compliance declara Enterprise Compliance Runtime Foundation vendor-agnostic", () => {
    assert.equal(COMPLIANCE_RUNTIME_IDENTITY.name, "Enterprise Compliance Runtime");
    assert.equal(COMPLIANCE_RUNTIME_IDENTITY.layer, "Foundation");
    assert.ok(COMPLIANCE_RUNTIME_IDENTITY.version);
    assert.equal(COMPLIANCE_RUNTIME_IDENTITY.vendorAgnostic, true);
    const info = createComplianceRuntimePort().providerInfo();
    assert.equal(info.metadata.vendorAgnostic, true);
    assert.equal(info.metadata.layer, "Foundation");
    assert.equal(info.providerType, "COMPLIANCE_RUNTIME");
  });

  it("provider default resolve enterprise via getComplianceRuntimePort/Provider", () => {
    const port = createComplianceRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(getComplianceRuntimePort().providerId, "enterprise");
    assert.equal(ComplianceRuntimeProvider.create().providerId, "enterprise");
    assert.equal(ComplianceRuntimeProvider.get().providerId, "enterprise");
    assert.ok(ComplianceRuntimeProvider.getFactory() instanceof ComplianceRuntimeFactory);
  });

  it("factory resolve mock / test / default / enterprise / real-tiss", () => {
    const factory = createComplianceRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(factory.create({ provider: "real-tiss" }).providerId, "real-tiss");
    assert.equal(
      getComplianceRuntimeFactory().getRegistry().list().length,
      BUILTIN_COMPLIANCE_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("registry registra mock / test / default / enterprise / real-tiss", () => {
    const registry = createDefaultComplianceRuntimeRegistry();
    assert.ok(registry instanceof ComplianceRuntimeRegistry);
    assert.equal(registry.has("mock"), true);
    assert.equal(registry.has("test"), true);
    assert.equal(registry.has("default"), true);
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.has("real-tiss"), true);
    assert.equal(registry.snapshot().count, BUILTIN_COMPLIANCE_RUNTIME_PROVIDER_COUNT);
    assert.equal(registry.get("enterprise")?.capabilities.complianceEngineImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.tissComplianceImplemented, false);
    assert.equal(registry.get("enterprise")?.capabilities.automaticCorrectionImplemented, false);
    assert.equal(registry.get("real-tiss")?.vendor, "real-tiss");
    assert.equal(registry.get("real-tiss")?.adapterId, REALTISS_COMPLIANCE_RUNTIME_ADAPTER_ID);
    assert.equal(registry.get("real-tiss")?.version, REALTISS_COMPLIANCE_RUNTIME_VERSION);
  });

  it("openJob → submitRequest → registerFinding → getResult → closeJob → stats (sem identidade real)", async () => {
    resetAllComplianceRuntimeIdSequences();
    const complianceContext = sampleComplianceContext();
    const port = createComplianceRuntimePort({ provider: "enterprise" });

    const opened = await port.openJob({
      correlationId: "corr-s1-02",
      complianceContext,
    });
    assert.equal(opened.ok, true);
    assert.equal(opened.job?.status, "job-open");
    assert.equal(opened.result?.runtimeReady, true);
    assert.equal(opened.job?.complianceContext?.kind, "canonical-compliance-context");
    assertStructuralFlagsFalse(opened.result as unknown as Record<string, unknown>);
    const jobId = opened.job!.jobId;

    const submitted = await port.submitRequest({
      jobId,
      findingId: "finding-s1-02",
      complianceContext,
    });
    assert.equal(submitted.ok, true);
    assert.equal(submitted.request?.status, "submitted");
    assert.equal(submitted.request?.jobId, jobId);
    const requestId = submitted.request!.requestId;

    const registered = await port.registerFinding({
      jobId,
      requestId,
      findingId: "finding-s1-02",
      complianceType: "technical" as ComplianceTypeKind,
      complianceContext,
    });
    assert.equal(registered.ok, true);
    assert.equal(registered.finding?.status, "registered");
    assert.equal(registered.finding?.complianceType, "technical");
    assert.equal(registered.finding?.complianceEngineImplemented, false);

    const result = await port.getResult({ jobId, requestId });
    assert.equal(result.ok, true);
    assert.equal(result.result?.runtimeReady, true);
    assert.equal(result.result?.complianceEngineImplemented, false);
    assert.equal(result.result?.automaticComplianceImplemented, false);

    const closed = await port.closeJob({ jobId });
    assert.equal(closed.ok, true);
    assert.equal(closed.job?.status, "job-closed");

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "canonical-compliance-statistics");
    assert.ok((stats.statistics?.totalJobs ?? 0) >= 1);
    assert.ok((stats.statistics?.totalRequests ?? 0) >= 1);
    assert.ok((stats.statistics?.totalFindings ?? 0) >= 1);
    assert.equal(stats.statistics?.complianceEngineImplementedCount, 0);
    assert.equal(stats.statistics?.tissComplianceImplementedCount, 0);
    assert.equal(stats.statistics?.automaticCorrectionImplementedCount, 0);
  });

  it("InMemory store persiste jobs/requests/findings/results (S5-02)", async () => {
    const store = new InMemoryComplianceRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_COMPLIANCE_RUNTIME_STORE_ID);
    assert.equal(store.health().ok, true);

    const port = new DefaultComplianceRuntimeAdapter({
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
    assert.equal(statistics.kind, "canonical-compliance-statistics");
    assert.equal(statistics.openJobs, 1);
    assert.equal(statistics.closedJobs, 0);
  });

  it("retry recupera falha transitória em operação estrutural", async () => {
    const port = new DefaultComplianceRuntimeAdapter({
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
    const port = createComplianceRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.openJob({ signal: controller.signal });
    assert.equal(result.ok, false);
    assert.equal(result.code, "COMPLIANCE_RUNTIME_CANCELLED");
    assert.equal(result.telemetry.cancelled, true);
  });

  it("TestComplianceRuntimeAdapter expõe providerId test", async () => {
    const port: ComplianceRuntimePort = new TestComplianceRuntimeAdapter();
    assert.equal(port.providerId, "test");
    assert.equal(port.capabilities().adapterId, TEST_COMPLIANCE_RUNTIME_ADAPTER_ID);
    assert.equal((await port.health()).ok, true);
  });

  it("capabilities engine declara todas as flags compliance* = false", () => {
    assert.equal(DEFAULT_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES.complianceEngineImplemented, false);
    assert.equal(DEFAULT_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES.businessRulesImplemented, false);
    assert.equal(DEFAULT_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES.tissComplianceImplemented, false);
    assert.equal(DEFAULT_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES.operatorComplianceImplemented, false);
    assert.equal(DEFAULT_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES.automaticComplianceImplemented, false);
    assert.equal(DEFAULT_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES.complianceSuggestionsImplemented, false);
    assert.equal(DEFAULT_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES.complianceJustificationImplemented, false);
    assert.equal(DEFAULT_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES.complianceScoreImplemented, false);
    assert.equal(DEFAULT_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES.complianceImplemented, false);
    assert.equal(DEFAULT_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES.automaticCorrectionImplemented, false);
  });

  it("módulo não importa OpenAI/Azure/crypto/HSM/SIEM/OpenTelemetry/HTTP/DB/Supabase", () => {
    const moduleRoot = join(repoRoot, "src/lib/enterprise/compliance-runtime");
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
    const base = join(repoRoot, "src/lib/enterprise/compliance-runtime");
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

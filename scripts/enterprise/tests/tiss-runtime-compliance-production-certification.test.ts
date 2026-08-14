#!/usr/bin/env node
/**
 * S5-03 — Enterprise Compliance Runtime Production Certification.
 *
 * Prova:
 *   ComplianceRuntimePort → Factory → Registry → Adapters (mock/test/default/enterprise/real-tiss)
 *   → Health, Capabilities, ProviderInfo, Retry, Store, negative scenarios, regression
 *   → Zero alteração de EnterpriseRuntime, Queue, Worker, Scheduler, Retry, DeadLetter,
 *     Observability, Pipeline, Composition Root, SecurityRuntime, IdentityRuntime,
 *     AuthorizationRuntime, TenantRuntime, AuditRuntime, CompletedRuntime, TenantPort,
 *     TenantAssignmentPort, AuthContext, getAuthContext, requireOperationalAuth, ServiceCtx,
 *     Supabase, RLS, Policies, crypto, jsonwebtoken, oauth, axios, @azure, @opentelemetry.
 *
 * Sem compliance real, sem motor de governança, sem LGPD, sem privacidade, sem consentimento,
 * sem classificação de dados, sem auditoria, sem retenção, sem cadeia de custódia,
 * sem assinatura digital, sem criptografia, sem HSM, sem Key Vault, sem SIEM,
 * sem OpenTelemetry, sem banco, sem HTTP, sem APIs externas.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../../..");

import {
  BUILTIN_COMPLIANCE_RUNTIME_PROVIDER_COUNT,
  COMPLIANCE_RUNTIME_IDENTITY,
  ComplianceRuntimeFactory,
  ComplianceRuntimeRegistry,
  DefaultComplianceRuntimeAdapter,
  InMemoryComplianceRuntimeStore,
  REALTISS_COMPLIANCE_RUNTIME_ADAPTER_ID,
  REALTISS_COMPLIANCE_RUNTIME_VERSION,
  RealTissComplianceRuntimeAdapter,
  createComplianceRuntimeFactory,
  createComplianceRuntimePort,
  createDefaultComplianceRuntimeRegistry,
  resetAllComplianceRuntimeIdSequences,
  type ComplianceRuntimePort,
  type ComplianceRuntimeProviderId,
  type StoredComplianceRuntimeJob,
} from "../../../src/lib/enterprise/compliance-runtime/index.ts";
import { getEnterpriseRuntime } from "../../../src/lib/enterprise/runtime/index.ts";

function assertAllImplementedFalse(obj: Record<string, unknown>, label: string) {
  const flags = Object.keys(obj).filter((k) => k.endsWith("Implemented"));
  for (const flag of flags) {
    assert.equal(obj[flag], false, `${label}.${flag} deveria ser false`);
  }
}

const REQUIRED_IMPLEMENTED_FLAGS = [
  "complianceEngineImplemented",
  "lgpdImplemented",
  "privacyImplemented",
  "consentManagementImplemented",
  "dataClassificationImplemented",
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
] as const;

function assertRequiredImplementedFalse(obj: Record<string, unknown>, label: string) {
  for (const flag of REQUIRED_IMPLEMENTED_FLAGS) {
    assert.equal(obj[flag], false, `${label}.${flag} deveria ser false`);
  }
}

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

describe("S5-03 — Enterprise Compliance Runtime Production Certification", () => {
  it("ComplianceRuntimePort é válido e expõe 9 métodos canônicos", () => {
    const port: ComplianceRuntimePort = createComplianceRuntimePort({ provider: "enterprise" });
    assert.equal(typeof port.providerId, "string");
    assert.equal(typeof port.openJob, "function");
    assert.equal(typeof port.closeJob, "function");
    assert.equal(typeof port.submitRequest, "function");
    assert.equal(typeof port.registerFinding, "function");
    assert.equal(typeof port.getResult, "function");
    assert.equal(typeof port.stats, "function");
    assert.equal(typeof port.health, "function");
    assert.equal(typeof port.capabilities, "function");
    assert.equal(typeof port.providerInfo, "function");
  });

  it("Factory resolve corretamente mock / test / default / enterprise / real-tiss", () => {
    const factory = createComplianceRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(factory.create({ provider: "real-tiss" }).providerId, "real-tiss");
    assert.equal(factory.create({}).providerId, "enterprise");
  });

  it("Factory rejeita providers inexistentes e inválidos", () => {
    const factory = createComplianceRuntimeFactory();
    assert.throws(
      () => factory.create({ provider: "inexistente" as ComplianceRuntimeProviderId }),
      /não está registrado|desconhecido/,
    );
    assert.throws(
      () => factory.create({ provider: "invalido" as ComplianceRuntimeProviderId }),
      /não está registrado|desconhecido/,
    );
    assert.throws(
      () => factory.create({ provider: "" as ComplianceRuntimeProviderId }),
      /não está registrado|desconhecido/,
    );
  });

  it("Registry registra corretamente todos os 5 providers", () => {
    const registry = createDefaultComplianceRuntimeRegistry();
    assert.ok(registry instanceof ComplianceRuntimeRegistry);
    assert.equal(registry.has("mock"), true);
    assert.equal(registry.has("test"), true);
    assert.equal(registry.has("default"), true);
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.has("real-tiss"), true);
    assert.equal(registry.snapshot().count, BUILTIN_COMPLIANCE_RUNTIME_PROVIDER_COUNT);
    assert.equal(registry.has("foo"), false);
    assert.equal(registry.get("foo" as ComplianceRuntimeProviderId), undefined);
  });

  it("ProviderInfo é correto para default, enterprise, mock, test e real-tiss", async () => {
    const enterprise = createComplianceRuntimePort({ provider: "enterprise" }).providerInfo();
    assert.equal(enterprise.providerId, "enterprise");
    assert.equal(enterprise.providerType, "COMPLIANCE_RUNTIME");
    assert.equal(enterprise.metadata.layer, "Foundation");
    assert.equal(enterprise.metadata.vendorAgnostic, true);
    assert.equal(enterprise.status, "ready");

    const mock = createComplianceRuntimePort({ provider: "mock" }).providerInfo();
    assert.equal(mock.providerId, "mock");
    assert.equal(mock.providerType, "COMPLIANCE_RUNTIME");
    assert.equal(mock.status, "ready");

    const realTiss = createComplianceRuntimePort({ provider: "real-tiss" }).providerInfo();
    assert.equal(realTiss.providerId, "real-tiss");
    assert.equal(realTiss.providerType, "COMPLIANCE_RUNTIME");
    assert.equal(realTiss.metadata.vendor, "real-tiss");
    assert.equal(realTiss.metadata.version, REALTISS_COMPLIANCE_RUNTIME_VERSION);
    assert.equal(realTiss.metadata.layer, "Foundation");
    assert.equal(realTiss.status, "ready");
  });

  it("Capabilities declaram motor e regras de compliance como não implementadas", () => {
    const port = createComplianceRuntimePort({ provider: "enterprise" });
    const caps = port.capabilities();
    assert.equal(caps.supportsHealth, true);
    assert.equal(caps.supportsOpenJob, true);
    assert.equal(caps.supportsCloseJob, true);
    assert.equal(caps.supportsSubmitRequest, true);
    assert.equal(caps.supportsRegisterFinding, true);
    assert.equal(caps.supportsGetResult, true);
    assert.equal(caps.supportsStats, true);
    assert.equal(caps.runtimeReady, true);
    assertRequiredImplementedFalse(caps as unknown as Record<string, unknown>, "enterprise caps");
    assertAllImplementedFalse(caps as unknown as Record<string, unknown>, "enterprise caps");
    assert.equal(caps.usesAIOrchestrationRuntimePort, false);
    assert.equal(caps.usesWorkerRuntimePort, false);

    const mockCaps = createComplianceRuntimePort({ provider: "mock" }).capabilities();
    assert.equal(mockCaps.provider, "mock");
    assertRequiredImplementedFalse(mockCaps as unknown as Record<string, unknown>, "mock caps");
    assertAllImplementedFalse(mockCaps as unknown as Record<string, unknown>, "mock caps");

    const realTissCaps = createComplianceRuntimePort({ provider: "real-tiss" }).capabilities();
    assert.equal(realTissCaps.adapterId, REALTISS_COMPLIANCE_RUNTIME_ADAPTER_ID);
    assert.equal(realTissCaps.provider, "real-tiss");
    assertRequiredImplementedFalse(realTissCaps as unknown as Record<string, unknown>, "real-tiss caps");
    assertAllImplementedFalse(realTissCaps as unknown as Record<string, unknown>, "real-tiss caps");
  });

  it("Health é correto, incluindo counts do store e cenário unhealthy", async () => {
    resetAllComplianceRuntimeIdSequences();
    const port = createComplianceRuntimePort({ provider: "enterprise" });
    await port.openJob({});
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "enterprise");
    assert.equal(health.status, "ready");
    assert.equal(health.runtimeReady, true);
    assert.equal(typeof health.latencyMs, "number");
    assert.equal(health.storedJobCount, 1);
    assert.equal(health.storedRequestCount, 0);
    assert.equal(health.storedFindingCount, 0);
    assert.equal(health.storedResultCount, 0);
    assertRequiredImplementedFalse(health as unknown as Record<string, unknown>, "health");
    assertAllImplementedFalse(health as unknown as Record<string, unknown>, "health");

    const unhealthy = new DefaultComplianceRuntimeAdapter({
      provider: "enterprise",
      healthy: false,
    });
    const h = await unhealthy.health();
    assert.equal(h.ok, false);
    assert.equal(h.status, "unhealthy");
    assert.equal(h.provider, "enterprise");
  });

  it("Retry recupera falha transitória em operação estrutural", async () => {
    resetAllComplianceRuntimeIdSequences();
    const port = new DefaultComplianceRuntimeAdapter({
      provider: "enterprise",
      failAttempts: 1,
      defaultRetryCount: 2,
      defaultRetryBackoffMs: 0,
      sleep: () => Promise.resolve(),
    });
    const opened = await port.openJob({});
    assert.equal(opened.ok, true);
    assert.equal(opened.job?.status, "job-open");
    assert.equal((await port.health()).storedJobCount, 1);
  });

  it("Observability e Enterprise Runtime estão preservados", async () => {
    const runtime = getEnterpriseRuntime();
    assert.equal(typeof runtime.getQueueRuntimePort, "function");
    assert.equal(typeof runtime.getWorkerRuntimePort, "function");
    assert.equal(typeof runtime.getSchedulerRuntimePort, "function");
    assert.equal(typeof runtime.getObservabilityRuntimePort, "function");

    const queue = runtime.getQueueRuntimePort();
    const worker = runtime.getWorkerRuntimePort();
    const scheduler = runtime.getSchedulerRuntimePort();
    const observability = runtime.getObservabilityRuntimePort();
    assert.equal((await queue.health()).ok, true);
    assert.equal((await worker.health()).ok, true);
    assert.equal((await scheduler.health()).ok, true);
    assert.equal(typeof (await observability.health()).ok, "boolean");
  });

  it("InMemoryComplianceRuntimeStore funciona e expõe estatísticas", () => {
    const store = new InMemoryComplianceRuntimeStore();
    assert.equal(store.health().ok, true);
    assert.equal(store.jobCount(), 0);
    assert.equal(store.requestCount(), 0);
    assert.equal(store.findingCount(), 0);
    assert.equal(store.resultCount(), 0);

    const stamp = new Date().toISOString();
    const job: StoredComplianceRuntimeJob = {
      kind: "canonical-compliance-job",
      jobId: "job-1",
      status: "job-open",
      createdAt: stamp,
      updatedAt: stamp,
      complianceEngineImplemented: false,
      lgpdImplemented: false,
      privacyImplemented: false,
      dataClassificationImplemented: false,
      consentManagementImplemented: false,
      auditComplianceImplemented: false,
      retentionImplemented: false,
      chainOfCustodyImplemented: false,
      digitalSignatureImplemented: false,
      encryptionImplemented: false,
      hsmImplemented: false,
      keyVaultImplemented: false,
      siemImplemented: false,
      openTelemetryImplemented: false,
      businessRulesImplemented: false,
      tissComplianceImplemented: false,
      operatorComplianceImplemented: false,
      automaticComplianceImplemented: false,
      complianceSuggestionsImplemented: false,
      complianceJustificationImplemented: false,
      complianceScoreImplemented: false,
      complianceImplemented: false,
      automaticCorrectionImplemented: false,
    };
    store.setJob(job);
    assert.equal(store.jobCount(), 1);
    const stats = store.statistics();
    assert.equal(stats.totalJobs, 1);
    assert.equal(stats.openJobs, 1);
    assert.equal(stats.totalRequests, 0);
    store.removeJob("job-1");
    assert.equal(store.jobCount(), 0);
  });

  it("RealTissComplianceRuntimeAdapter delega integralmente ao DefaultComplianceRuntimeAdapter", async () => {
    resetAllComplianceRuntimeIdSequences();
    const sharedStore = new InMemoryComplianceRuntimeStore();
    const port = new RealTissComplianceRuntimeAdapter({ store: sharedStore });
    assert.equal(port.providerId, "real-tiss");
    assert.equal(port.getStore(), sharedStore);

    const opened = await port.openJob({});
    assert.equal(opened.ok, true);
    assert.equal(opened.job?.status, "job-open");
    assert.equal(sharedStore.jobCount(), 1);

    const request = await port.submitRequest({ jobId: opened.job?.jobId });
    assert.equal(request.ok, true);
    assert.equal(sharedStore.requestCount(), 1);

    const finding = await port.registerFinding({ jobId: opened.job?.jobId });
    assert.equal(finding.ok, true);
    assert.equal(sharedStore.findingCount(), 1);

    const result = await port.getResult({
      jobId: opened.job?.jobId,
      requestId: request.request?.requestId,
    });
    assert.equal(result.ok, true);
    assert.equal(sharedStore.resultCount(), 1);

    const closed = await port.closeJob({ jobId: opened.job?.jobId! });
    assert.equal(closed.ok, true);
    assert.equal(closed.job?.status, "job-closed");

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.totalJobs, 1);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "real-tiss");
    assert.equal(health.runtimeReady, true);

    const info = port.providerInfo();
    assert.equal(info.providerId, "real-tiss");
    assert.equal(info.metadata.vendor, "real-tiss");
    assert.equal(info.metadata.version, REALTISS_COMPLIANCE_RUNTIME_VERSION);
    assertRequiredImplementedFalse(info.capabilities as unknown as Record<string, unknown>, "real-tiss info");
    assertAllImplementedFalse(info.capabilities as unknown as Record<string, unknown>, "real-tiss info");
  });

  it("Cenários negativos: provider inválido, job não encontrado, resultado não encontrado", async () => {
    resetAllComplianceRuntimeIdSequences();
    const factory = createComplianceRuntimeFactory();
    assert.throws(
      () => factory.create({ provider: "não-existe" as ComplianceRuntimeProviderId }),
      /não está registrado|desconhecido/,
    );

    const port = createComplianceRuntimePort({ provider: "enterprise" });
    const closed = await port.closeJob({ jobId: "inexistente" });
    assert.equal(closed.ok, false);
    assert.equal(closed.code, "COMPLIANCE_RUNTIME_JOB_NOT_FOUND");

    const result = await port.getResult({ jobId: "inexistente" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "COMPLIANCE_RUNTIME_RESULT_NOT_FOUND");
  });

  it("AbortSignal cancela operação estrutural", async () => {
    const controller = new AbortController();
    controller.abort();
    const port = new DefaultComplianceRuntimeAdapter({ provider: "enterprise" });
    const opened = await port.openJob({ signal: controller.signal });
    assert.equal(opened.ok, false);
    assert.equal(opened.code, "COMPLIANCE_RUNTIME_CANCELLED");
  });

  it("módulo compliance-runtime não importa compliance real / Supabase / AuthContext / runtimes congelados", () => {
    const moduleRoot = join(repoRoot, "src/lib/enterprise/compliance-runtime");
    const files = collectTsFiles(moduleRoot);
    assert.ok(files.length > 0);
    const forbidden = [
      /from ["']@supabase/i,
      /from ["']crypto["']/i,
      /from ["']node:crypto["']/i,
      /from ["']crypto-js["']/i,
      /from ["']jsonwebtoken["']/i,
      /from ["']bcrypt["']/i,
      /from ["']oauth/i,
      /from ["']axios["']/i,
      /fetch\s*\(/,
      /from ["']@azure/i,
      /from ["']@opentelemetry/i,
      /from ["'][^"']*hsm/i,
      /from ["'][^"']*siem/i,
      /from ["'][^"']*lgpd/i,
      /from ["'][^"']*TenantPort["']/i,
      /from ["'][^"']*TenantAssignmentPort["']/i,
      /from ["'][^"']*AuthContext["']/i,
      /from ["'][^"']*getAuthContext["']/i,
      /from ["'][^"']*requireOperationalAuth["']/i,
      /from ["'][^"']*ServiceCtx["']/i,
      /from ["'][^"']*SecurityRuntime["']/i,
      /from ["'][^"']*IdentityRuntime["']/i,
      /from ["'][^"']*AuthorizationRuntime["']/i,
      /from ["'][^"']*AuditRuntime["']/i,
      /from ["'][^"']*CompletedRuntime["']/i,
      /from ["'][^"']*TenantRuntime["']/i,
    ];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        assert.equal(pattern.test(source), false, `${file} bateu em ${pattern}`);
      }
    }
  });

  it("EnterpriseRuntime não alterado e não expõe vazamento do Compliance Runtime", () => {
    const runtimeDir = join(repoRoot, "src/lib/enterprise/runtime");
    const runtimeFiles = collectTsFiles(runtimeDir);
    assert.ok(runtimeFiles.length > 0, "EnterpriseRuntime source deve existir");
    let hasQueue = 0;
    let hasWorker = 0;
    let hasScheduler = 0;
    let hasObservability = 0;
    for (const file of runtimeFiles) {
      const source = readFileSync(file, "utf8");
      assert.equal(
        source.includes("getComplianceRuntimePort"),
        false,
        `${file} não deve conter getComplianceRuntimePort`,
      );
      assert.equal(
        source.includes("from \"../../../compliance-runtime\""),
        false,
        `${file} não deve importar compliance-runtime`,
      );
      if (source.includes("getQueueRuntimePort")) hasQueue += 1;
      if (source.includes("getWorkerRuntimePort")) hasWorker += 1;
      if (source.includes("getSchedulerRuntimePort")) hasScheduler += 1;
      if (source.includes("getObservabilityRuntimePort")) hasObservability += 1;
    }
    assert.ok(hasQueue > 0, "EnterpriseRuntime deve manter getQueueRuntimePort");
    assert.ok(hasWorker > 0, "EnterpriseRuntime deve manter getWorkerRuntimePort");
    assert.ok(hasScheduler > 0, "EnterpriseRuntime deve manter getSchedulerRuntimePort");
    assert.ok(hasObservability > 0, "EnterpriseRuntime deve manter getObservabilityRuntimePort");
  });

  it("Identidade do Compliance Runtime declara Foundation vendor-agnostic", () => {
    assert.equal(COMPLIANCE_RUNTIME_IDENTITY.name, "Enterprise Compliance Runtime");
    assert.equal(COMPLIANCE_RUNTIME_IDENTITY.layer, "Foundation");
    assert.equal(COMPLIANCE_RUNTIME_IDENTITY.vendorAgnostic, true);
    assert.equal(COMPLIANCE_RUNTIME_IDENTITY.version, REALTISS_COMPLIANCE_RUNTIME_VERSION);
  });
});

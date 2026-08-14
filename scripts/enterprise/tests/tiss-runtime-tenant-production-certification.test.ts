#!/usr/bin/env node
/**
 * S4-03 — Enterprise Tenant Runtime Production Certification.
 *
 * Prova:
 *   TenantRuntimePort → Factory → Registry → Adapters (mock/test/default/enterprise/real-tiss)
 *   → Health, Capabilities, ProviderInfo, Retry, Store, negative scenarios, regression
 *   → Zero alteração de EnterpriseRuntime, Queue, Worker, Scheduler, Retry, DeadLetter,
 *     Observability, Pipeline, Composition Root, SecurityRuntime, IdentityRuntime,
 *     AuthorizationRuntime, AuditRuntime, CompletedRuntime, TenantPort, TenantAssignmentPort,
 *     AuthContext, getAuthContext, requireOperationalAuth, ServiceCtx, Supabase, RLS,
 *     tenant-settings-service, tenant-branding-service.
 *
 * Sem tenant management real, sem provisioning, sem routing, sem lifecycle, sem branding,
 * sem settings, sem onboarding, sem hierarchy, sem ownership, sem cache, sem middleware,
 * sem validation, sem resolution, sem assignment, sem isolation, sem business rules,
 * sem Supabase, sem criptografia, sem banco, sem HTTP, sem APIs externas.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../../..");

import {
  BUILTIN_TENANT_RUNTIME_PROVIDER_COUNT,
  DefaultTenantRuntimeAdapter,
  InMemoryTenantRuntimeStore,
  RealTissTenantRuntimeAdapter,
  REALTISS_TENANT_RUNTIME_ADAPTER_ID,
  REALTISS_TENANT_RUNTIME_VERSION,
  TENANT_RUNTIME_IDENTITY,
  TenantRuntimeFactory,
  TenantRuntimeRegistry,
  createDefaultTenantRuntimeRegistry,
  createTenantRuntimeFactory,
  createTenantRuntimePort,
  resetAllTenantRuntimeIdSequences,
  type TenantRuntimePort,
  type TenantRuntimeProviderId,
} from "../../../src/lib/enterprise/tenant-runtime/index.ts";
import { getEnterpriseRuntime } from "../../../src/lib/enterprise/runtime/index.ts";

const STRUCTURAL_FLAGS = [
  "tenantEngineImplemented",
  "businessRulesImplemented",
  "tissTenantImplemented",
  "operatorTenantImplemented",
  "automaticTenantImplemented",
  "tenantSuggestionsImplemented",
  "tenantJustificationImplemented",
  "tenantScoreImplemented",
  "complianceImplemented",
  "automaticCorrectionImplemented",
] as const;

function assertStructuralFlagsFalse(obj: Record<string, unknown>, label: string) {
  for (const flag of STRUCTURAL_FLAGS) {
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

describe("S4-03 — Enterprise Tenant Runtime Production Certification", () => {
  it("TenantRuntimePort é válido e expõe 9 métodos canônicos", () => {
    const port: TenantRuntimePort = createTenantRuntimePort({ provider: "enterprise" });
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
    const factory = createTenantRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(factory.create({ provider: "real-tiss" }).providerId, "real-tiss");
    assert.equal(factory.create({}).providerId, "enterprise");
  });

  it("Factory rejeita providers inexistentes e inválidos", () => {
    const factory = createTenantRuntimeFactory();
    assert.throws(
      () => factory.create({ provider: "inexistente" as TenantRuntimeProviderId }),
      /não está registrado|desconhecido/,
    );
    assert.throws(
      () => factory.create({ provider: "invalido" as TenantRuntimeProviderId }),
      /não está registrado|desconhecido/,
    );
    assert.throws(
      () => factory.create({ provider: "" as TenantRuntimeProviderId }),
      /não está registrado|desconhecido/,
    );
  });

  it("Registry registra corretamente todos os 5 providers", () => {
    const registry = createDefaultTenantRuntimeRegistry();
    assert.ok(registry instanceof TenantRuntimeRegistry);
    assert.equal(registry.has("mock"), true);
    assert.equal(registry.has("test"), true);
    assert.equal(registry.has("default"), true);
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.has("real-tiss"), true);
    assert.equal(registry.snapshot().count, BUILTIN_TENANT_RUNTIME_PROVIDER_COUNT);
    assert.equal(registry.has("foo"), false);
    assert.equal(registry.get("foo" as TenantRuntimeProviderId), undefined);
  });

  it("ProviderInfo é correto para default, enterprise, mock, test e real-tiss", async () => {
    const enterprise = createTenantRuntimePort({ provider: "enterprise" }).providerInfo();
    assert.equal(enterprise.providerId, "enterprise");
    assert.equal(enterprise.providerType, "TENANT_RUNTIME");
    assert.equal(enterprise.metadata.layer, "Foundation");
    assert.equal(enterprise.metadata.vendorAgnostic, true);
    assert.equal(enterprise.status, "ready");

    const mock = createTenantRuntimePort({ provider: "mock" }).providerInfo();
    assert.equal(mock.providerId, "mock");
    assert.equal(mock.providerType, "TENANT_RUNTIME");
    assert.equal(mock.status, "ready");

    const realTiss = createTenantRuntimePort({ provider: "real-tiss" }).providerInfo();
    assert.equal(realTiss.providerId, "real-tiss");
    assert.equal(realTiss.providerType, "TENANT_RUNTIME");
    assert.equal(realTiss.metadata.vendor, "real-tiss");
    assert.equal(realTiss.metadata.version, REALTISS_TENANT_RUNTIME_VERSION);
    assert.equal(realTiss.metadata.layer, "Foundation");
    assert.equal(realTiss.status, "ready");
  });

  it("Capabilities declaram engine e regras de tenant como não implementadas", () => {
    const port = createTenantRuntimePort({ provider: "enterprise" });
    const caps = port.capabilities();
    assert.equal(caps.supportsHealth, true);
    assert.equal(caps.supportsOpenJob, true);
    assert.equal(caps.supportsCloseJob, true);
    assert.equal(caps.supportsSubmitRequest, true);
    assert.equal(caps.supportsRegisterFinding, true);
    assert.equal(caps.supportsGetResult, true);
    assert.equal(caps.supportsStats, true);
    assert.equal(caps.runtimeReady, true);
    assertStructuralFlagsFalse(caps as unknown as Record<string, unknown>, "enterprise caps");
    assert.equal(caps.usesAIOrchestrationRuntimePort, false);
    assert.equal(caps.usesWorkerRuntimePort, false);

    const mockCaps = createTenantRuntimePort({ provider: "mock" }).capabilities();
    assert.equal(mockCaps.provider, "mock");
    assertStructuralFlagsFalse(mockCaps as unknown as Record<string, unknown>, "mock caps");

    const realTissCaps = createTenantRuntimePort({ provider: "real-tiss" }).capabilities();
    assert.equal(realTissCaps.adapterId, REALTISS_TENANT_RUNTIME_ADAPTER_ID);
    assert.equal(realTissCaps.provider, "real-tiss");
    assertStructuralFlagsFalse(realTissCaps as unknown as Record<string, unknown>, "real-tiss caps");
  });

  it("Health é correto, incluindo counts do store e cenário unhealthy", async () => {
    resetAllTenantRuntimeIdSequences();
    const port = createTenantRuntimePort({ provider: "enterprise" });
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
    assertStructuralFlagsFalse(health as unknown as Record<string, unknown>, "health");

    const unhealthy = new DefaultTenantRuntimeAdapter({
      provider: "enterprise",
      healthy: false,
    });
    const h = await unhealthy.health();
    assert.equal(h.ok, false);
    assert.equal(h.status, "unhealthy");
    assert.equal(h.provider, "enterprise");
  });

  it("Retry recupera falha transitória em operação estrutural", async () => {
    resetAllTenantRuntimeIdSequences();
    const port = new DefaultTenantRuntimeAdapter({
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
    assert.equal(
      typeof (runtime as Record<string, unknown>).getTenantRuntimePort,
      "undefined",
      "EnterpriseRuntime não deve expor getTenantRuntimePort",
    );

    const queue = runtime.getQueueRuntimePort();
    const worker = runtime.getWorkerRuntimePort();
    const scheduler = runtime.getSchedulerRuntimePort();
    const observability = runtime.getObservabilityRuntimePort();
    assert.equal((await queue.health()).ok, true);
    assert.equal((await worker.health()).ok, true);
    assert.equal((await scheduler.health()).ok, true);
    assert.equal(typeof (await observability.health()).ok, "boolean");
  });

  it("InMemoryTenantRuntimeStore funciona e expõe estatísticas", () => {
    const store = new InMemoryTenantRuntimeStore();
    assert.equal(store.health().ok, true);
    assert.equal(store.jobCount(), 0);
    assert.equal(store.requestCount(), 0);
    assert.equal(store.findingCount(), 0);
    assert.equal(store.resultCount(), 0);

    store.setJob({
      kind: "canonical-tenant-job",
      jobId: "job-1",
      status: "job-open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tenantEngineImplemented: false,
      businessRulesImplemented: false,
      tissTenantImplemented: false,
      operatorTenantImplemented: false,
      automaticTenantImplemented: false,
      tenantSuggestionsImplemented: false,
      tenantJustificationImplemented: false,
      tenantScoreImplemented: false,
      complianceImplemented: false,
      automaticCorrectionImplemented: false,
    });
    assert.equal(store.jobCount(), 1);
    const stats = store.statistics();
    assert.equal(stats.totalJobs, 1);
    assert.equal(stats.openJobs, 1);
    assert.equal(stats.totalRequests, 0);
    store.removeJob("job-1");
    assert.equal(store.jobCount(), 0);
  });

  it("RealTissTenantRuntimeAdapter delega integralmente ao DefaultTenantRuntimeAdapter", async () => {
    resetAllTenantRuntimeIdSequences();
    const sharedStore = new InMemoryTenantRuntimeStore();
    const port = new RealTissTenantRuntimeAdapter({ store: sharedStore });
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
    assert.equal(info.metadata.version, REALTISS_TENANT_RUNTIME_VERSION);
    assertStructuralFlagsFalse(info.capabilities as unknown as Record<string, unknown>, "real-tiss info");
  });

  it("Cenários negativos: provider inválido, job não encontrado, resultado não encontrado", async () => {
    resetAllTenantRuntimeIdSequences();
    const factory = createTenantRuntimeFactory();
    assert.throws(
      () => factory.create({ provider: "não-existe" as TenantRuntimeProviderId }),
      /não está registrado|desconhecido/,
    );

    const port = createTenantRuntimePort({ provider: "enterprise" });
    const closed = await port.closeJob({ jobId: "inexistente" });
    assert.equal(closed.ok, false);
    assert.equal(closed.code, "TENANT_RUNTIME_JOB_NOT_FOUND");

    const result = await port.getResult({ jobId: "inexistente" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TENANT_RUNTIME_RESULT_NOT_FOUND");
  });

  it("AbortSignal cancela operação estrutural", async () => {
    const controller = new AbortController();
    controller.abort();
    const port = new DefaultTenantRuntimeAdapter({ provider: "enterprise" });
    const opened = await port.openJob({ signal: controller.signal });
    assert.equal(opened.ok, false);
    assert.equal(opened.code, "TENANT_RUNTIME_CANCELLED");
  });

  it("módulo tenant-runtime não importa tenant real / Supabase / AuthContext / tenant-services", () => {
    const moduleRoot = join(repoRoot, "src/lib/enterprise/tenant-runtime");
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
      /from ["'][^"']*tenant-settings-service["']/i,
      /from ["'][^"']*tenant-branding-service["']/i,
    ];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        assert.equal(pattern.test(source), false, `${file} bateu em ${pattern}`);
      }
    }
  });

  it("EnterpriseRuntime source não contém getTenantRuntimePort nem vazamento do Tenant Runtime", () => {
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
        source.includes("getTenantRuntimePort"),
        false,
        `${file} não deve conter getTenantRuntimePort`,
      );
      assert.equal(
        source.includes("from \"../../../tenant-runtime\""),
        false,
        `${file} não deve importar tenant-runtime`,
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

  it("Identidade do Tenant Runtime declara Foundation vendor-agnostic", () => {
    assert.equal(TENANT_RUNTIME_IDENTITY.name, "Enterprise Tenant Runtime");
    assert.equal(TENANT_RUNTIME_IDENTITY.layer, "Foundation");
    assert.equal(TENANT_RUNTIME_IDENTITY.vendorAgnostic, true);
    assert.equal(TENANT_RUNTIME_IDENTITY.version, REALTISS_TENANT_RUNTIME_VERSION);
  });
});

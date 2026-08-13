#!/usr/bin/env node
/**
 * S2-03 — Identity & Authentication Production Certification.
 *
 * Prova:
 *   IdentityRuntimePort → Factory → Registry → Adapters (mock/test/default/enterprise/real-tiss)
 *   → Health, Capabilities, ProviderInfo, Retry, Store, negative scenarios, regression
 *   → Zero alteração de EnterpriseRuntime, Queue, Worker, Scheduler, Retry, DeadLetter,
 *     Observability, Pipeline, Composition Root, Supabase Auth, RBAC, Session Validation, AuthContext.
 *
 * Sem login, logout, OAuth, SAML, MFA, JWT, session, refresh token, cookies, Supabase Auth,
 * criptografia, banco, HTTP, APIs externas.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../../..");

import {
  BUILTIN_IDENTITY_RUNTIME_PROVIDER_COUNT,
  DefaultIdentityRuntimeAdapter,
  InMemoryIdentityRuntimeStore,
  RealTissIdentityRuntimeAdapter,
  REALTISS_IDENTITY_RUNTIME_ADAPTER_ID,
  REALTISS_IDENTITY_RUNTIME_VERSION,
  IDENTITY_RUNTIME_IDENTITY,
  IdentityRuntimeFactory,
  IdentityRuntimeRegistry,
  createDefaultIdentityRuntimeRegistry,
  createIdentityRuntimeFactory,
  createIdentityRuntimePort,
  resetAllIdentityRuntimeIdSequences,
  type IdentityRuntimePort,
  type IdentityRuntimeProviderId,
} from "../../../src/lib/enterprise/identity-runtime/index.ts";
import { getEnterpriseRuntime } from "../../../src/lib/enterprise/runtime/index.ts";

const STRUCTURAL_FLAGS = [
  "identityEngineImplemented",
  "businessRulesImplemented",
  "tissIdentityImplemented",
  "operatorIdentityImplemented",
  "automaticIdentityImplemented",
  "identitySuggestionsImplemented",
  "identityJustificationImplemented",
  "identityScoreImplemented",
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

describe("S2-03 — Identity & Authentication Production Certification", () => {
  it("IdentityRuntimePort é válido e expõe 9 métodos canônicos", () => {
    const port: IdentityRuntimePort = createIdentityRuntimePort({ provider: "enterprise" });
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
    const factory = createIdentityRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(factory.create({ provider: "real-tiss" }).providerId, "real-tiss");
    assert.equal(factory.create({}).providerId, "enterprise");
  });

  it("Factory rejeita providers inexistentes e inválidos", () => {
    const factory = createIdentityRuntimeFactory();
    assert.throws(
      () => factory.create({ provider: "inexistente" as IdentityRuntimeProviderId }),
      /não está registrado|desconhecido/,
    );
    assert.throws(
      () => factory.create({ provider: "invalido" as IdentityRuntimeProviderId }),
      /não está registrado|desconhecido/,
    );
    assert.throws(
      () => factory.create({ provider: "" as IdentityRuntimeProviderId }),
      /não está registrado|desconhecido/,
    );
  });

  it("Registry registra corretamente todos os 5 providers", () => {
    const registry = createDefaultIdentityRuntimeRegistry();
    assert.ok(registry instanceof IdentityRuntimeRegistry);
    assert.equal(registry.has("mock"), true);
    assert.equal(registry.has("test"), true);
    assert.equal(registry.has("default"), true);
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.has("real-tiss"), true);
    assert.equal(registry.snapshot().count, BUILTIN_IDENTITY_RUNTIME_PROVIDER_COUNT);
    assert.equal(registry.has("foo"), false);
    assert.equal(registry.get("foo" as IdentityRuntimeProviderId), undefined);
  });

  it("ProviderInfo é correto para default, enterprise, mock, test e real-tiss", async () => {
    const enterprise = createIdentityRuntimePort({ provider: "enterprise" }).providerInfo();
    assert.equal(enterprise.providerId, "enterprise");
    assert.equal(enterprise.providerType, "IDENTITY_RUNTIME");
    assert.equal(enterprise.metadata.layer, "Foundation");
    assert.equal(enterprise.metadata.vendorAgnostic, true);
    assert.equal(enterprise.status, "ready");

    const mock = createIdentityRuntimePort({ provider: "mock" }).providerInfo();
    assert.equal(mock.providerId, "mock");
    assert.equal(mock.providerType, "IDENTITY_RUNTIME");
    assert.equal(mock.status, "ready");

    const realTiss = createIdentityRuntimePort({ provider: "real-tiss" }).providerInfo();
    assert.equal(realTiss.providerId, "real-tiss");
    assert.equal(realTiss.providerType, "IDENTITY_RUNTIME");
    assert.equal(realTiss.metadata.vendor, "real-tiss");
    assert.equal(realTiss.metadata.version, REALTISS_IDENTITY_RUNTIME_VERSION);
    assert.equal(realTiss.metadata.layer, "Foundation");
    assert.equal(realTiss.status, "ready");
  });

  it("Capabilities declaram engine e regras de identidade como não implementadas", () => {
    const port = createIdentityRuntimePort({ provider: "enterprise" });
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
    assert.equal(caps.usesQueueRuntimePort, undefined);

    const mockCaps = createIdentityRuntimePort({ provider: "mock" }).capabilities();
    assert.equal(mockCaps.adapterId, "mock-deterministic-identity-runtime");
    assertStructuralFlagsFalse(mockCaps as unknown as Record<string, unknown>, "mock caps");

    const realTissCaps = createIdentityRuntimePort({ provider: "real-tiss" }).capabilities();
    assert.equal(realTissCaps.adapterId, REALTISS_IDENTITY_RUNTIME_ADAPTER_ID);
    assert.equal(realTissCaps.provider, "real-tiss");
    assertStructuralFlagsFalse(realTissCaps as unknown as Record<string, unknown>, "real-tiss caps");
  });

  it("Health é correto, incluindo counts do store e cenário unhealthy", async () => {
    resetAllIdentityRuntimeIdSequences();
    const port = createIdentityRuntimePort({ provider: "enterprise" });
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

    const unhealthy = new DefaultIdentityRuntimeAdapter({
      provider: "enterprise",
      healthy: false,
    });
    const h = await unhealthy.health();
    assert.equal(h.ok, false);
    assert.equal(h.status, "unhealthy");
    assert.equal(h.provider, "enterprise");
  });

  it("Retry recupera falha transitória em operação estrutural", async () => {
    resetAllIdentityRuntimeIdSequences();
    const port = new DefaultIdentityRuntimeAdapter({
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
      typeof (runtime as Record<string, unknown>).getIdentityRuntimePort,
      "undefined",
      "EnterpriseRuntime não deve expor getIdentityRuntimePort",
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

  it("InMemoryIdentityRuntimeStore funciona e expõe estatísticas", () => {
    const store = new InMemoryIdentityRuntimeStore();
    assert.equal(store.health().ok, true);
    assert.equal(store.jobCount(), 0);
    assert.equal(store.requestCount(), 0);
    assert.equal(store.findingCount(), 0);
    assert.equal(store.resultCount(), 0);

    store.setJob({
      kind: "canonical-identity-job",
      jobId: "job-1",
      status: "job-open",
      identityEngineImplemented: false,
      businessRulesImplemented: false,
      tissIdentityImplemented: false,
      operatorIdentityImplemented: false,
      automaticIdentityImplemented: false,
      identitySuggestionsImplemented: false,
      identityJustificationImplemented: false,
      identityScoreImplemented: false,
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

  it("RealTissIdentityRuntimeAdapter delega integralmente ao DefaultIdentityRuntimeAdapter", async () => {
    resetAllIdentityRuntimeIdSequences();
    const sharedStore = new InMemoryIdentityRuntimeStore();
    const port = new RealTissIdentityRuntimeAdapter({ store: sharedStore });
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

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "real-tiss");
    assert.equal(health.runtimeReady, true);
    assert.equal(health.storedJobCount, 1);

    const info = port.providerInfo();
    assert.equal(info.providerId, "real-tiss");
    assert.equal(info.metadata.vendor, "real-tiss");
    assert.equal(info.metadata.version, REALTISS_IDENTITY_RUNTIME_VERSION);
    assertStructuralFlagsFalse(info.capabilities as unknown as Record<string, unknown>, "real-tiss info");
  });

  it("Cenários negativos: provider inválido, job não encontrado, resultado não encontrado", async () => {
    resetAllIdentityRuntimeIdSequences();
    const factory = createIdentityRuntimeFactory();
    assert.throws(
      () => factory.create({ provider: "não-existe" as IdentityRuntimeProviderId }),
      /não está registrado|desconhecido/,
    );

    const port = createIdentityRuntimePort({ provider: "enterprise" });
    const closed = await port.closeJob({ jobId: "inexistente" });
    assert.equal(closed.ok, false);
    assert.equal(closed.code, "IDENTITY_RUNTIME_JOB_NOT_FOUND");

    const result = await port.getResult({ jobId: "inexistente" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "IDENTITY_RUNTIME_RESULT_NOT_FOUND");
  });

  it("AbortSignal cancela operação estrutural", async () => {
    const controller = new AbortController();
    controller.abort();
    const port = new DefaultIdentityRuntimeAdapter({ provider: "enterprise" });
    const opened = await port.openJob({ signal: controller.signal });
    assert.equal(opened.ok, false);
    assert.equal(opened.code, "IDENTITY_RUNTIME_CANCELLED");
  });

  it("módulo identity-runtime não importa autenticação real / JWT / OAuth / MFA / Supabase / HTTP", () => {
    const moduleRoot = join(repoRoot, "src/lib/enterprise/identity-runtime");
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
      /from ["'][^"']*lgpd/i,
      /from ["']passport/i,
      /from ["']@auth0/i,
      /supabase\.auth/,
      /signInWithPassword/,
      /signOut\s*\(/,
      /signOut\(/,
      /oauth/i,
      /mfa/i,
    ];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        assert.equal(pattern.test(source), false, `${file} bateu em ${pattern}`);
      }
    }
  });

  it("EnterpriseRuntime source não contém getIdentityRuntimePort nem vazamento do Identity Runtime", () => {
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
        source.includes("getIdentityRuntimePort"),
        false,
        `${file} não deve conter getIdentityRuntimePort`,
      );
      assert.equal(
        source.includes("from \"../../../identity-runtime\""),
        false,
        `${file} não deve importar identity-runtime`,
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

  it("Identity do Identity Runtime declara Foundation vendor-agnostic", () => {
    assert.equal(IDENTITY_RUNTIME_IDENTITY.name, "Enterprise Identity Runtime");
    assert.equal(IDENTITY_RUNTIME_IDENTITY.layer, "Foundation");
    assert.equal(IDENTITY_RUNTIME_IDENTITY.vendorAgnostic, true);
    assert.equal(IDENTITY_RUNTIME_IDENTITY.version, REALTISS_IDENTITY_RUNTIME_VERSION);
  });
});

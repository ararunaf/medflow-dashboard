#!/usr/bin/env node
/**
 * S3-03 — Authorization & Access Control Production Certification.
 *
 * Prova:
 *   AuthorizationRuntimePort → Factory → Registry → Adapters (mock/test/default/enterprise/real-tiss)
 *   → Health, Capabilities, ProviderInfo, Retry, Store, negative scenarios, regression
 *   → Zero alteração de EnterpriseRuntime, Queue, Worker, Scheduler, Retry, DeadLetter,
 *     Observability, Pipeline, Composition Root, Supabase Auth, RBAC, RLS, AuthContext.
 *
 * Sem autorização real, RBAC, ABAC, OAuth, JWT, SAML, MFA, Supabase Auth, RLS,
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
  AUTHORIZATION_RUNTIME_IDENTITY,
  AuthorizationRuntimeRegistry,
  BUILTIN_AUTHORIZATION_RUNTIME_PROVIDER_COUNT,
  DefaultAuthorizationRuntimeAdapter,
  InMemoryAuthorizationRuntimeStore,
  RealTissAuthorizationRuntimeAdapter,
  REALTISS_AUTHORIZATION_RUNTIME_ADAPTER_ID,
  REALTISS_AUTHORIZATION_RUNTIME_VERSION,
  createDefaultAuthorizationRuntimeRegistry,
  createAuthorizationRuntimeFactory,
  createAuthorizationRuntimePort,
  resetAllAuthorizationRuntimeIdSequences,
  type AuthorizationRuntimePort,
  type AuthorizationRuntimeProviderId,
} from "../../../src/lib/enterprise/authorization-runtime/index.ts";
import { getEnterpriseRuntime } from "../../../src/lib/enterprise/runtime/index.ts";

const STRUCTURAL_FLAGS = [
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

describe("S3-03 — Authorization & Access Control Production Certification", () => {
  it("AuthorizationRuntimePort é válido e expõe 9 métodos canônicos", () => {
    const port: AuthorizationRuntimePort = createAuthorizationRuntimePort({ provider: "enterprise" });
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
    const factory = createAuthorizationRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(factory.create({ provider: "real-tiss" }).providerId, "real-tiss");
    assert.equal(factory.create({}).providerId, "enterprise");
  });

  it("Factory rejeita providers inexistentes e inválidos", () => {
    const factory = createAuthorizationRuntimeFactory();
    assert.throws(
      () => factory.create({ provider: "inexistente" as AuthorizationRuntimeProviderId }),
      /não está registrado|desconhecido/,
    );
    assert.throws(
      () => factory.create({ provider: "invalido" as AuthorizationRuntimeProviderId }),
      /não está registrado|desconhecido/,
    );
    assert.throws(
      () => factory.create({ provider: "" as AuthorizationRuntimeProviderId }),
      /não está registrado|desconhecido/,
    );
  });

  it("Registry registra corretamente todos os 5 providers", () => {
    const registry = createDefaultAuthorizationRuntimeRegistry();
    assert.ok(registry instanceof AuthorizationRuntimeRegistry);
    assert.equal(registry.has("mock"), true);
    assert.equal(registry.has("test"), true);
    assert.equal(registry.has("default"), true);
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.has("real-tiss"), true);
    assert.equal(registry.snapshot().count, BUILTIN_AUTHORIZATION_RUNTIME_PROVIDER_COUNT);
    assert.equal(registry.has("foo"), false);
    assert.equal(registry.get("foo" as AuthorizationRuntimeProviderId), undefined);
  });

  it("ProviderInfo é correto para default, enterprise, mock, test e real-tiss", async () => {
    const enterprise = createAuthorizationRuntimePort({ provider: "enterprise" }).providerInfo();
    assert.equal(enterprise.providerId, "enterprise");
    assert.equal(enterprise.providerType, "AUTHORIZATION_RUNTIME");
    assert.equal(enterprise.metadata.layer, "Foundation");
    assert.equal(enterprise.metadata.vendorAgnostic, true);
    assert.equal(enterprise.status, "ready");

    const mock = createAuthorizationRuntimePort({ provider: "mock" }).providerInfo();
    assert.equal(mock.providerId, "mock");
    assert.equal(mock.providerType, "AUTHORIZATION_RUNTIME");
    assert.equal(mock.status, "ready");

    const realTiss = createAuthorizationRuntimePort({ provider: "real-tiss" }).providerInfo();
    assert.equal(realTiss.providerId, "real-tiss");
    assert.equal(realTiss.providerType, "AUTHORIZATION_RUNTIME");
    assert.equal(realTiss.metadata.vendor, "real-tiss");
    assert.equal(realTiss.metadata.version, REALTISS_AUTHORIZATION_RUNTIME_VERSION);
    assert.equal(realTiss.metadata.layer, "Foundation");
    assert.equal(realTiss.status, "ready");
  });

  it("Capabilities declaram engine e regras de autorização como não implementadas", () => {
    const port = createAuthorizationRuntimePort({ provider: "enterprise" });
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

    const mockCaps = createAuthorizationRuntimePort({ provider: "mock" }).capabilities();
    assert.equal(mockCaps.adapterId, "mock-deterministic-authorization-runtime");
    assertStructuralFlagsFalse(mockCaps as unknown as Record<string, unknown>, "mock caps");

    const realTissCaps = createAuthorizationRuntimePort({ provider: "real-tiss" }).capabilities();
    assert.equal(realTissCaps.adapterId, REALTISS_AUTHORIZATION_RUNTIME_ADAPTER_ID);
    assert.equal(realTissCaps.provider, "real-tiss");
    assertStructuralFlagsFalse(realTissCaps as unknown as Record<string, unknown>, "real-tiss caps");
  });

  it("Health é correto, incluindo counts do store e cenário unhealthy", async () => {
    resetAllAuthorizationRuntimeIdSequences();
    const port = createAuthorizationRuntimePort({ provider: "enterprise" });
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

    const unhealthy = new DefaultAuthorizationRuntimeAdapter({
      provider: "enterprise",
      healthy: false,
    });
    const h = await unhealthy.health();
    assert.equal(h.ok, false);
    assert.equal(h.status, "unhealthy");
    assert.equal(h.provider, "enterprise");
  });

  it("Retry recupera falha transitória em operação estrutural", async () => {
    resetAllAuthorizationRuntimeIdSequences();
    const port = new DefaultAuthorizationRuntimeAdapter({
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

  it("InMemoryAuthorizationRuntimeStore funciona e expõe estatísticas", async () => {
    const store = new InMemoryAuthorizationRuntimeStore();
    assert.equal(store.health().ok, true);
    assert.equal(store.jobCount(), 0);
    assert.equal(store.requestCount(), 0);
    assert.equal(store.findingCount(), 0);
    assert.equal(store.resultCount(), 0);

    const port = new DefaultAuthorizationRuntimeAdapter({
      provider: "enterprise",
      store,
    });
    const opened = await port.openJob({});
    assert.equal(opened.ok, true);
    assert.equal(store.jobCount(), 1);

    const submitted = await port.submitRequest({ jobId: opened.job?.jobId });
    assert.equal(submitted.ok, true);
    assert.equal(store.requestCount(), 1);

    const finding = await port.registerFinding({
      jobId: opened.job?.jobId,
      requestId: submitted.request?.requestId,
      findingId: "finding-1",
      authorizationType: "technical",
    });
    assert.equal(finding.ok, true);
    assert.equal(store.findingCount(), 1);

    const stats = store.statistics();
    assert.equal(stats.kind, "canonical-authorization-statistics");
    assert.equal(stats.totalJobs, 1);
    assert.equal(stats.openJobs, 1);
    assert.equal(stats.closedJobs, 0);
    assert.equal(stats.totalRequests, 1);
    assert.equal(stats.totalFindings, 1);
    store.removeJob(opened.job!.jobId);
    assert.equal(store.jobCount(), 0);
  });

  it("RealTissAuthorizationRuntimeAdapter delega integralmente ao DefaultAuthorizationRuntimeAdapter", async () => {
    resetAllAuthorizationRuntimeIdSequences();
    const sharedStore = new InMemoryAuthorizationRuntimeStore();
    const port = new RealTissAuthorizationRuntimeAdapter({ store: sharedStore });
    assert.equal(port.providerId, "real-tiss");
    assert.equal(port.getStore(), sharedStore);

    const opened = await port.openJob({});
    assert.equal(opened.ok, true);
    assert.equal(opened.job?.status, "job-open");
    assert.equal(sharedStore.jobCount(), 1);

    const request = await port.submitRequest({ jobId: opened.job?.jobId });
    assert.equal(request.ok, true);
    assert.equal(sharedStore.requestCount(), 1);

    const finding = await port.registerFinding({
      jobId: opened.job?.jobId,
      requestId: request.request?.requestId,
      findingId: "finding-1",
      authorizationType: "technical",
    });
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
    assert.equal(info.metadata.version, REALTISS_AUTHORIZATION_RUNTIME_VERSION);
    assertStructuralFlagsFalse(info.capabilities as unknown as Record<string, unknown>, "real-tiss info");
  });

  it("Cenários negativos: provider inválido, job não encontrado, resultado não encontrado", async () => {
    resetAllAuthorizationRuntimeIdSequences();
    const factory = createAuthorizationRuntimeFactory();
    assert.throws(
      () => factory.create({ provider: "não-existe" as AuthorizationRuntimeProviderId }),
      /não está registrado|desconhecido/,
    );

    const port = createAuthorizationRuntimePort({ provider: "enterprise" });
    const closed = await port.closeJob({ jobId: "inexistente" });
    assert.equal(closed.ok, false);
    assert.equal(closed.code, "AUTHORIZATION_RUNTIME_JOB_NOT_FOUND");

    const result = await port.getResult({ jobId: "inexistente" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "AUTHORIZATION_RUNTIME_RESULT_NOT_FOUND");
  });

  it("AbortSignal cancela operação estrutural", async () => {
    const controller = new AbortController();
    controller.abort();
    const port = new DefaultAuthorizationRuntimeAdapter({ provider: "enterprise" });
    const opened = await port.openJob({ signal: controller.signal });
    assert.equal(opened.ok, false);
    assert.equal(opened.code, "AUTHORIZATION_RUNTIME_CANCELLED");
  });

  it("módulo authorization-runtime não importa autorização real / JWT / OAuth / MFA / Supabase / HTTP", () => {
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

  it("módulo authorization-runtime não contém operações reais de autorização nem integrações proibidas", () => {
    const moduleRoot = join(repoRoot, "src/lib/enterprise/authorization-runtime");
    const files = collectTsFiles(moduleRoot);
    assert.ok(files.length > 0);
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      assert.equal(source.includes("assertCan("), false, `${file} não deve conter assertCan(`);
      assert.equal(source.includes("can("), false, `${file} não deve conter can(`);
      assert.equal(source.includes("requireOperationalAuth("), false, `${file} não deve conter requireOperationalAuth(`);
      assert.equal(source.includes("getAuthContext("), false, `${file} não deve conter getAuthContext(`);
      assert.equal(source.includes("evaluateRouteGuard("), false, `${file} não deve conter evaluateRouteGuard(`);
      assert.equal(source.includes("supabase.auth"), false, `${file} não deve conter supabase.auth`);
      assert.equal(source.includes("RLS"), false, `${file} não deve conter RLS`);
      assert.equal(source.includes('from "../security-runtime"'), false, `${file} não deve importar security-runtime`);
      assert.equal(source.includes('from "../identity-runtime"'), false, `${file} não deve importar identity-runtime`);
      assert.equal(source.includes('from "../audit-runtime"'), false, `${file} não deve importar audit-runtime`);
      assert.equal(source.includes('from "../completed-runtime"'), false, `${file} não deve importar completed-runtime`);
    }
  });

  it("Identity do Authorization Runtime declara Foundation vendor-agnostic", () => {
    assert.equal(AUTHORIZATION_RUNTIME_IDENTITY.name, "Enterprise Authorization Runtime");
    assert.equal(AUTHORIZATION_RUNTIME_IDENTITY.layer, "Foundation");
    assert.equal(AUTHORIZATION_RUNTIME_IDENTITY.vendorAgnostic, true);
    assert.equal(AUTHORIZATION_RUNTIME_IDENTITY.version, REALTISS_AUTHORIZATION_RUNTIME_VERSION);
  });
});

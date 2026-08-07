#!/usr/bin/env node
/**
 * TISS-01 — Enterprise TISS Provider
 * Prova: Application ? TISSProviderPort ? Adapter ? Factory ? Registry
 *         + TISS Runtime + Enterprise Runtime
 *         + CanonicalTISSResult / CanonicalTISSMetadata / Profile/Provider refs
 *         + timeout / retry / cancelamento / erros
 *         + ausência de bypass / lógica específica de operadora/contrato/tenant
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_TISS_PROVIDER_COUNT,
  DEFAULT_TISS_PROVIDER_ADAPTER_ID,
  DEFAULT_TISS_PROVIDER_CAPABILITIES,
  DefaultTISSProviderAdapter,
  EnterpriseTISSProviderAdapter,
  MOCK_TISS_PROVIDER_ADAPTER_ID,
  MockTISSProviderAdapter,
  TISSProviderFactory,
  TISSProviderRegistry,
  createDefaultTISSProviderRegistry,
  createTISSProviderFactory,
  createTISSProviderPort,
  getTISSProviderFactory,
  getTISSProviderHealthSummary,
  type TISSProviderPort,
} from "../../../src/lib/enterprise/tiss-provider/index.ts";
import { createTISSRuntimePort } from "../../../src/lib/enterprise/tiss-runtime/index.ts";
import { createQueueRuntimePort } from "../../../src/lib/enterprise/queue-runtime/index.ts";
import { createSchedulerRuntimePort } from "../../../src/lib/enterprise/scheduler-runtime/index.ts";
import { createWorkerRuntimePort } from "../../../src/lib/enterprise/worker-runtime/index.ts";
import { createPersistentQueueRuntimePort } from "../../../src/lib/enterprise/persistent-queue-runtime/index.ts";
import { createObservabilityRuntimePort } from "../../../src/lib/enterprise/observability-runtime/index.ts";
import { createScalabilityRuntimePort } from "../../../src/lib/enterprise/scalability-runtime/index.ts";
import type { TISSRuntimePort } from "../../../src/lib/enterprise/tiss-runtime/ports/tiss-runtime-port.ts";
import { createCanonicalExecutionOrchestratorPort } from "../../../src/lib/enterprise/canonical-execution-orchestrator/index.ts";
import { createTISSCatalogPort } from "../../../src/lib/enterprise/tiss-catalog/index.ts";
import { createRulePackEnginePort } from "../../../src/lib/enterprise/rule-pack-engine/index.ts";
import { createXMLGenerationRuntimePort } from "../../../src/lib/enterprise/xml-generation-runtime/index.ts";
import { createXMLSerializerRuntimePort } from "../../../src/lib/enterprise/xml-serializer-runtime/index.ts";
import { createXMLSchemaRuntimePort } from "../../../src/lib/enterprise/xml-schema-runtime/index.ts";
import { createXMLValidationRuntimePort } from "../../../src/lib/enterprise/xml-validation-runtime/index.ts";
import { createXSDRuntimePort } from "../../../src/lib/enterprise/xsd-runtime/index.ts";
import { createNamespaceRuntimePort } from "../../../src/lib/enterprise/namespace-runtime/index.ts";
import { createXMLRuntimePort } from "../../../src/lib/enterprise/xml-runtime/index.ts";
import {
  createEnterpriseRuntime,
  resetEnterpriseRuntimeForTests,
} from "../../../src/lib/enterprise/runtime/index.ts";
import { createOCRProviderPort } from "../../../src/lib/enterprise/ocr-provider/index.ts";

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

function sampleRequest(
  overrides: Partial<Parameters<TISSProviderPort["process"]>[0]> = {},
): Parameters<TISSProviderPort["process"]>[0] {
  return {
    kind: "canonical-tiss-request",
    mode: "structural-process",
    metadata: {
      kind: "canonical-tiss-metadata",
      sessionId: "sess-tiss-01",
      tenantRef: "tenant-structural",
      correlationId: "corr-tiss-01",
      channel: "enterprise-test",
      documentId: "doc-tiss-01",
    },
    documentId: "doc-tiss-01",
    ...overrides,
  };
}

describe("TISS-01 TISSProviderPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: TISSProviderPort = new MockTISSProviderAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.status, "ready");

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_TISS_PROVIDER_ADAPTER_ID);
    assert.equal(caps.supportsCanonicalResult, true);
    assert.equal(caps.implementsRealXml, false);
    assert.equal(caps.implementsOperatorDispatch, false);
  });

  it("DefaultTISSProviderAdapter é o adapter enterprise oficial", () => {
    assert.equal(EnterpriseTISSProviderAdapter, DefaultTISSProviderAdapter);
    const port = new DefaultTISSProviderAdapter({ provider: "enterprise" });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_TISS_PROVIDER_ADAPTER_ID);
  });

  it("createTISSProviderPort default resolve enterprise", async () => {
    const port = createTISSProviderPort();
    assert.equal(port.providerId, "enterprise");
    const validation = await port.validateConfiguration();
    assert.equal(validation.ok, true);
    assert.equal(validation.errors.length, 0);
  });

  it("test / default / mock são resolvidos pelo factory", async () => {
    assert.equal(createTISSProviderPort({ provider: "test" }).providerId, "test");
    assert.equal(createTISSProviderPort({ provider: "default" }).providerId, "default");
    assert.equal(createTISSProviderPort({ provider: "mock" }).providerId, "mock");
    assert.equal((await createTISSProviderPort({ provider: "mock" }).health()).ok, true);
  });

  it("process retorna CanonicalTISSResult estrutural (realTissExecuted=false)", async () => {
    const port = createTISSProviderPort({ provider: "enterprise" });
    const result = await port.process(sampleRequest());

    assert.equal(result.ok, true);
    assert.equal(result.kind, "canonical-tiss-result");
    assert.equal(result.realTissExecuted, false);
    assert.equal(result.provider, "enterprise");
    assert.equal(result.code, "TISS_STRUCTURAL_OK");
    assert.ok(result.providerReference);
    assert.equal(result.providerReference?.kind, "canonical-tiss-provider-reference");
    assert.equal(result.telemetry.cancelled, false);
    assert.ok(Array.isArray(result.logs));
  });

  it("resolve-profile e resolve-provider retornam referências canônicas opacas", async () => {
    const port = createTISSProviderPort({ provider: "enterprise" });

    const profile = await port.process(
      sampleRequest({
        mode: "resolve-profile",
        metadata: {
          kind: "canonical-tiss-metadata",
          sessionId: "sess-profile",
          profileRef: "profile-opaque-1",
        },
      }),
    );
    assert.equal(profile.ok, true);
    assert.equal(profile.profileReference?.kind, "canonical-tiss-profile-reference");
    assert.equal(profile.profileReference?.profileRef, "profile-opaque-1");

    const provider = await port.process(sampleRequest({ mode: "resolve-provider" }));
    assert.equal(provider.ok, true);
    assert.equal(provider.providerReference?.kind, "canonical-tiss-provider-reference");
    assert.equal(provider.providerReference?.providerRef, "enterprise");
  });

  it("timeout é implementado e retorna TISS_TIMEOUT", async () => {
    const port = new DefaultTISSProviderAdapter({
      provider: "enterprise",
      defaultTimeoutMs: 20,
      defaultRetryCount: 0,
    });
    const result = await port.process(
      sampleRequest({
        timeoutMs: 20,
        retryCount: 0,
        attributes: { forceDelayMs: 200 },
      }),
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_TIMEOUT");
  });

  it("retry recupera falha transitória", async () => {
    const port = new DefaultTISSProviderAdapter({
      provider: "enterprise",
      failAttempts: 1,
      defaultRetryCount: 2,
      defaultRetryBackoffMs: 1,
    });
    const result = await port.process(sampleRequest({ retryCount: 2 }));
    assert.equal(result.ok, true);
    assert.ok(result.telemetry.attempts >= 2);
  });

  it("cancelamento via AbortSignal retorna TISS_CANCELLED", async () => {
    const port = new DefaultTISSProviderAdapter({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.process(sampleRequest({ signal: controller.signal }));
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_CANCELLED");
    assert.equal(result.telemetry.cancelled, true);
  });

  it("tratamento de erro para provider unhealthy", async () => {
    const port = new DefaultTISSProviderAdapter({
      provider: "enterprise",
      healthy: false,
    });
    const result = await port.process(sampleRequest());
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_UNHEALTHY");
  });

  it("Registry e Factory seguem ECS-01 (sem fallback silencioso)", () => {
    const registry = createDefaultTISSProviderRegistry();
    assert.ok(registry instanceof TISSProviderRegistry);
    assert.equal(registry.snapshot().count, BUILTIN_TISS_PROVIDER_COUNT);
    assert.equal(registry.has("enterprise"), true);

    const factory = createTISSProviderFactory({ registry });
    assert.ok(factory instanceof TISSProviderFactory);
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");

    assert.throws(
      () =>
        factory.create({
          // @ts-expect-error — provider inválido
          provider: "unimed-xml",
        }),
      /não está registrado|desconhecido/,
    );

    assert.equal(getTISSProviderFactory().getRegistry().has("mock"), true);
    assert.equal(DEFAULT_TISS_PROVIDER_CAPABILITIES.supportsStructuralProcess, true);
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createTISSProviderPort({ provider: "enterprise" });
    const summary = await getTISSProviderHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.info.providerType, "TISS");
    assert.equal(summary.capabilities.implementsRealXml, false);
  });
});

describe("TISS-01 cadeia Enterprise / TISS Runtime / Provider", () => {
  it("Enterprise Runtime expõe TISS Provider + TISS Runtime", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    assert.equal(runtime.getTISSProviderPort().providerId, "enterprise");
    assert.equal(runtime.getTISSRuntimePort().providerId, "default");
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesTISSProviderPort, true);

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.tissProviderOk, true);
    assert.equal(health.tissRuntimeOk, true);
    assert.equal(health.orchestratorOk, true);
  });

  it("fluxo: Runtime ? TISS Runtime ? ProviderPort ? Canonical Result", async () => {
    const orchestrator = createCanonicalExecutionOrchestratorPort({ provider: "mock" });
    const tissProvider = createTISSProviderPort({ provider: "enterprise" });
    const tissCatalog = createTISSCatalogPort({ provider: "enterprise" });
    const rulePackEngine = createRulePackEnginePort({
      provider: "enterprise",
      enterpriseDeps: { getTISSCatalogPort: () => tissCatalog },
    });
    const xmlGenerationRuntime = createXMLGenerationRuntimePort({ provider: "enterprise" });
    const xmlSerializerRuntime = createXMLSerializerRuntimePort({ provider: "enterprise" });
    const xmlSchemaRuntime = createXMLSchemaRuntimePort({ provider: "enterprise" });
    const xmlValidationRuntime = createXMLValidationRuntimePort({ provider: "enterprise" });
    const xsdRuntime = createXSDRuntimePort({ provider: "enterprise" });
    const namespaceRuntime = createNamespaceRuntimePort({ provider: "enterprise" });
    const queueRuntime = createQueueRuntimePort({ provider: "enterprise" });
    const workerRuntime = createWorkerRuntimePort({
      provider: "enterprise",
      enterpriseDeps: {
        getQueueRuntimePort: () => queueRuntime,
      },
    });
    const schedulerRuntime = createSchedulerRuntimePort({
      provider: "enterprise",
      enterpriseDeps: {
        getQueueRuntimePort: () => queueRuntime,
        getWorkerRuntimePort: () => workerRuntime,
      },
    });
    const persistentQueueRuntime = createPersistentQueueRuntimePort({
      provider: "enterprise",
      enterpriseDeps: {
        getQueueRuntimePort: () => queueRuntime,
        getWorkerRuntimePort: () => workerRuntime,
        getSchedulerRuntimePort: () => schedulerRuntime,
      },
    });
    const xmlRuntime = createXMLRuntimePort({
      provider: "enterprise",
      enterpriseDeps: {
        getTISSCatalogPort: () => tissCatalog,
        getRulePackEnginePort: () => rulePackEngine,
        getXMLGenerationRuntimePort: () => xmlGenerationRuntime,
      },
    });
    const tissRuntime = createTISSRuntimePort({
      provider: "default",
      enterpriseDeps: {
        getOrchestratorPort: () => orchestrator,
        getTISSProviderPort: () => tissProvider,
        getTISSCatalogPort: () => tissCatalog,
        getRulePackEnginePort: () => rulePackEngine,
        getXMLRuntimePort: () => xmlRuntime,
        getXMLGenerationRuntimePort: () => xmlGenerationRuntime,
        getXMLSerializerRuntimePort: () => xmlSerializerRuntime,
        getXMLSchemaRuntimePort: () => xmlSchemaRuntime,
        getXMLValidationRuntimePort: () => xmlValidationRuntime,
        getXSDRuntimePort: () => xsdRuntime,
        getNamespaceRuntimePort: () => namespaceRuntime,
        getQueueRuntimePort: () => queueRuntime,
        getWorkerRuntimePort: () => workerRuntime,
        getSchedulerRuntimePort: () => schedulerRuntime,
        getPersistentQueueRuntimePort: () => persistentQueueRuntime,
        getObservabilityRuntimePort: () =>
          createObservabilityRuntimePort({
            provider: "mock",
            enterpriseDeps: {
              getQueueRuntimePort: () => queueRuntime,
              getWorkerRuntimePort: () => workerRuntime,
              getSchedulerRuntimePort: () => schedulerRuntime,
              getPersistentQueueRuntimePort: () => persistentQueueRuntime,
              getTISSRuntimePort: () =>
                ({
                  providerId: "mock",
                  health: async () => ({ ok: true, provider: "mock" }),
                  capabilities: () => ({
                    provider: "mock",
                    adapterId: "stub",
                    supportsProcess: true,
                    supportsGetSession: true,
                    supportsListSessions: true,
                    supportsHealth: true,
                    supportsCapabilities: true,
                    usesEnterpriseRuntimePorts: true,
                    usesCanonicalExecutionOrchestrator: true,
                    usesTISSProviderPort: true,
                    usesTISSCatalogPort: true,
                    usesRulePackEnginePort: true,
                    usesXMLRuntimePort: true,
                    usesXMLGenerationRuntimePort: true,
                    usesXMLSerializerRuntimePort: true,
                    usesXMLSchemaRuntimePort: true,
                    usesXMLValidationRuntimePort: true,
                    usesXSDRuntimePort: true,
                    usesNamespaceRuntimePort: true,
                    usesQueueRuntimePort: true,
                    usesWorkerRuntimePort: true,
                    usesSchedulerRuntimePort: true,
                    usesPersistentQueueRuntimePort: true,
                    usesObservabilityRuntimePort: true,
                    implementsRealXml: false,
                    implementsOperatorDispatch: false,
                  }),
                  process: async () => ({ ok: true }),
                  getSession: async () => ({ ok: false }),
                  listSessions: async () => ({ ok: true, sessions: [] }),
                }) as TISSRuntimePort,
            },
          }),
        getScalabilityRuntimePort: () => createScalabilityRuntimePort({ provider: "mock" }),
      },
    });

    const result = await tissRuntime.process(sampleRequest());
    assert.equal(result.kind, "canonical-tiss-result");
    assert.equal(result.ok, true);
    assert.equal(result.realTissExecuted, false);
    assert.ok(result.runtimeSessionId);
    assert.ok(result.telemetry);

    const session = await tissRuntime.getSession({
      runtimeSessionId: result.runtimeSessionId!,
    });
    assert.equal(session.ok, true);
    assert.equal(session.session?.status, "coordinated");
    assert.equal(session.session?.processedViaTISSProviderPort, true);
    assert.equal(session.session?.realTissExecuted, false);
  });

  it("Enterprise Runtime permanece ponto único; Capture desacoplado de TISS real", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
      tissProviderPort: createTISSProviderPort({ provider: "enterprise" }),
    });

    assert.equal(runtime.getTISSProviderPort().capabilities().implementsOperatorDispatch, false);
    assert.equal(runtime.getTISSRuntimePort().capabilities().implementsRealXml, false);

    const register = await runtime.registerCaptureDocumentIntake({
      sessionId: "sess-tiss-01-capture",
      documentId: "doc-tiss-01-capture",
      storagePath: "tenant/sess-tiss-01-capture/original.pdf",
      tenantRef: "tenant-1",
      correlationId: "corr-tiss-01",
      channel: "file_upload",
    });
    assert.equal(register.ok, true);

    const tissResult = await runtime.getTISSRuntimePort().process(
      sampleRequest({
        metadata: {
          kind: "canonical-tiss-metadata",
          sessionId: "sess-tiss-01-capture",
          documentId: "doc-tiss-01-capture",
        },
      }),
    );
    assert.equal(tissResult.ok, true);
    assert.equal(tissResult.realTissExecuted, false);
  });
});

describe("TISS-01 auditoria — sem bypass / sem lógica de operadora", () => {
  it("módulo tiss-provider não contém backends / operadoras / XML dispatch", () => {
    const moduleDir = join(repoRoot, "src/lib/enterprise/tiss-provider");
    const files = collectTsFiles(moduleDir);
    assert.ok(files.length > 0);

    const forbidden = [
      /from ["']@supabase/i,
      /storage\.from\s*\(/,
      /from ["']node:fs["']/,
      /from ["']fs["']/,
      /createClient\s*\(/,
      /operadora\s*===/i,
      /operadora\s*==/i,
      /tenant\s*===/i,
      /cliente\s*===/i,
      /contrato\s*===/i,
      /unimed/i,
      /hapvida/i,
      /bradesco/i,
      /amil/i,
      /sulamerica/i,
      /cassi/i,
      /\bcaixa\b/i,
    ];

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      const codeWithoutComments = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
      for (const pattern of forbidden) {
        assert.equal(
          pattern.test(codeWithoutComments),
          false,
          `Padrão proibido ${pattern} em ${file}`,
        );
      }
    }
  });

  it("módulo tiss-runtime usa exclusivamente TISSProviderPort", () => {
    const runtimeAdapter = readFileSync(
      join(repoRoot, "src/lib/enterprise/tiss-runtime/adapters/default-tiss-runtime-adapter.ts"),
      "utf8",
    );
    assert.match(runtimeAdapter, /getTISSProviderPort/);
    assert.match(runtimeAdapter, /\.process\(/);
    assert.equal(/DefaultTISSProviderAdapter/.test(runtimeAdapter), false);
    assert.equal(/createTISSProviderPort/.test(runtimeAdapter), false);

    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.match(enterpriseRuntime, /createTISSProviderPort/);
    assert.match(enterpriseRuntime, /createTISSRuntimePort/);
    assert.match(enterpriseRuntime, /getTISSProviderPort/);
    assert.match(enterpriseRuntime, /getTISSRuntimePort/);
  });

  it("não existe if/switch por operadora/tenant/cliente/contrato no tiss-provider", () => {
    const moduleDir = join(repoRoot, "src/lib/enterprise/tiss-provider");
    for (const file of collectTsFiles(moduleDir)) {
      const source = readFileSync(file, "utf8");
      const codeWithoutComments = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
      assert.equal(
        /if\s*\(\s*operadora/i.test(codeWithoutComments),
        false,
        `if(operadora) em ${file}`,
      );
      assert.equal(
        /switch\s*\(\s*operadora/i.test(codeWithoutComments),
        false,
        `switch(operadora) em ${file}`,
      );
      assert.equal(
        /if\s*\(\s*tenant\s*==/i.test(codeWithoutComments),
        false,
        `if(tenant==) em ${file}`,
      );
      assert.equal(/if\s*\(\s*cliente/i.test(codeWithoutComments), false, `if(cliente) em ${file}`);
    }
  });
});

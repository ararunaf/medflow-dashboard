#!/usr/bin/env node
/**
 * TISS-05 — Enterprise XML Generation Runtime
 * Prova: Application → XMLGenerationRuntimePort → Adapter → Factory → Registry → Store
 *         + XML Runtime + TISS Runtime + Enterprise Runtime
 *         + Modelos Canônicos / Canonical XML Request / Canonical XML Result
 *         + generate / health / capabilities
 *         + ausência de geração XML real / bypass / lógica específica
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_XML_GENERATION_RUNTIME_PROVIDER_COUNT,
  DEFAULT_XML_GENERATION_ADAPTER_ID,
  DEFAULT_XML_GENERATION_RUNTIME_CAPABILITIES,
  DefaultXMLGenerationAdapter,
  EnterpriseXMLGenerationAdapter,
  IN_MEMORY_XML_GENERATION_RUNTIME_STORE_ID,
  InMemoryXMLGenerationRuntimeStore,
  MOCK_XML_GENERATION_ADAPTER_ID,
  MockXMLGenerationAdapter,
  XMLGenerationRuntimeFactory,
  XMLGenerationRuntimeProvider,
  XMLGenerationRuntimeRegistry,
  createDefaultXMLGenerationRuntimeRegistry,
  createXMLGenerationRuntimeFactory,
  createXMLGenerationRuntimePort,
  getXMLGenerationRuntimeFactory,
  getXMLGenerationRuntimeHealthSummary,
  type XMLGenerationRuntimePort,
} from "../../../src/lib/enterprise/xml-generation-runtime/index.ts";
import { createTISSCatalogPort } from "../../../src/lib/enterprise/tiss-catalog/index.ts";
import { createRulePackEnginePort } from "../../../src/lib/enterprise/rule-pack-engine/index.ts";
import { createXMLRuntimePort } from "../../../src/lib/enterprise/xml-runtime/index.ts";
import { createXMLSerializerRuntimePort } from "../../../src/lib/enterprise/xml-serializer-runtime/index.ts";
import { createXMLSchemaRuntimePort } from "../../../src/lib/enterprise/xml-schema-runtime/index.ts";
import { createXMLValidationRuntimePort } from "../../../src/lib/enterprise/xml-validation-runtime/index.ts";
import { createXSDRuntimePort } from "../../../src/lib/enterprise/xsd-runtime/index.ts";
import { createNamespaceRuntimePort } from "../../../src/lib/enterprise/namespace-runtime/index.ts";
import { createTISSRuntimePort } from "../../../src/lib/enterprise/tiss-runtime/index.ts";
import { createQueueRuntimePort } from "../../../src/lib/enterprise/queue-runtime/index.ts";
import { createSchedulerRuntimePort } from "../../../src/lib/enterprise/scheduler-runtime/index.ts";
import { createWorkerRuntimePort } from "../../../src/lib/enterprise/worker-runtime/index.ts";
import { createPersistentQueueRuntimePort } from "../../../src/lib/enterprise/persistent-queue-runtime/index.ts";
import { createObservabilityRuntimePort } from "../../../src/lib/enterprise/observability-runtime/index.ts";
import { createScalabilityRuntimePort } from "../../../src/lib/enterprise/scalability-runtime/index.ts";
import type { TISSRuntimePort } from "../../../src/lib/enterprise/tiss-runtime/ports/tiss-runtime-port.ts";
import { createCanonicalExecutionOrchestratorPort } from "../../../src/lib/enterprise/canonical-execution-orchestrator/index.ts";
import { createTISSProviderPort } from "../../../src/lib/enterprise/tiss-provider/index.ts";
import {
  createEnterpriseRuntime,
  resetEnterpriseRuntimeForTests,
} from "../../../src/lib/enterprise/runtime/index.ts";

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

describe("TISS-05 XMLGenerationRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: XMLGenerationRuntimePort = new MockXMLGenerationAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.status, "ready");
    assert.equal(health.kind, "canonical-xml-generation-provider-health");

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_XML_GENERATION_ADAPTER_ID);
    assert.equal(caps.supportsCanonicalStructure, true);
    assert.equal(caps.implementsRealXml, false);
    assert.equal(caps.implementsOperatorDispatch, false);
    assert.equal(caps.knowsOperatorOrCooperative, false);
    assert.equal(caps.knowsContract, false);
    assert.equal(caps.knowsTenant, false);
    assert.equal(caps.canonical.kind, "canonical-xml-generation-provider-capabilities");
    assert.equal(caps.canonical.implementsRealXml, false);
  });

  it("DefaultXMLGenerationAdapter é o adapter enterprise oficial", () => {
    assert.equal(EnterpriseXMLGenerationAdapter, DefaultXMLGenerationAdapter);
    const port = new DefaultXMLGenerationAdapter({
      provider: "enterprise",
    });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_XML_GENERATION_ADAPTER_ID);
  });

  it("createXMLGenerationRuntimePort / Provider default resolve enterprise", async () => {
    const port = createXMLGenerationRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(XMLGenerationRuntimeProvider.create().providerId, "enterprise");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("test / default / mock são resolvidos pelo factory", async () => {
    assert.equal(createXMLGenerationRuntimePort({ provider: "test" }).providerId, "test");
    assert.equal(createXMLGenerationRuntimePort({ provider: "default" }).providerId, "default");
    assert.equal(createXMLGenerationRuntimePort({ provider: "mock" }).providerId, "mock");
    assert.equal((await createXMLGenerationRuntimePort({ provider: "mock" }).health()).ok, true);
  });

  it("Canonical XML Request / Result / Structure via Port (sem XML real)", async () => {
    const port = createXMLGenerationRuntimePort({ provider: "enterprise" });

    const generated = await port.generate({
      generationId: "xml-gen-tiss-05",
      documentId: "doc-tiss-05",
      catalogId: "catalog-1",
      catalogConsumed: true,
      rulePackExecutionId: "rpe-1",
      rulePackCode: "base-structural",
      rulePackConsumed: true,
      request: {
        kind: "canonical-xml-generation-request",
        generationId: "xml-gen-tiss-05",
        documentId: "doc-tiss-05",
        catalogId: "catalog-1",
        catalogConsumed: true,
        rulePackExecutionId: "rpe-1",
        rulePackCode: "base-structural",
        rulePackConsumed: true,
        metadata: {
          kind: "canonical-xml-metadata",
          sessionId: "sess-xml-05",
          channel: "enterprise-test",
        },
        structuralNotes: "TISS-05 canonical structure only.",
      },
    });

    assert.equal(generated.ok, true);
    assert.equal(generated.result?.kind, "canonical-xml-generation-result");
    assert.equal(generated.result?.realXmlGenerated, false);
    assert.equal(generated.structure?.kind, "canonical-xml-structure");
    assert.equal(generated.structure?.root, "CanonicalXML");
    assert.equal(generated.structure?.realXmlGenerated, false);
    assert.ok((generated.structure?.nodes.length ?? 0) > 0);
    assert.equal(generated.telemetry.cancelled, false);

    const resultJson = JSON.stringify(generated.result);
    assert.equal(/<\?xml/i.test(resultJson), false);
    assert.equal(/<ansTISS/i.test(resultJson), false);
    assert.equal(/DOMParser|XMLSerializer|XMLWriter/.test(resultJson), false);
    assert.equal(/unimed|hapvida|bradesco/i.test(resultJson), false);

    const listed = await port.listResults();
    assert.equal(listed.ok, true);
    assert.ok(listed.results.length >= 1);
    assert.equal(listed.statistics?.kind, "canonical-xml-generation-statistics");
    assert.equal(listed.statistics?.realXmlGeneratedCount, 0);

    const loaded = await port.getResult({
      resultId: generated.result!.resultId,
    });
    assert.equal(loaded.ok, true);
    assert.equal(loaded.result?.resultId, generated.result?.resultId);
    assert.equal(loaded.result?.realXmlGenerated, false);
  });

  it("InMemoryXMLGenerationRuntimeStore é o store oficial", () => {
    const store = new InMemoryXMLGenerationRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_XML_GENERATION_RUNTIME_STORE_ID);
    assert.equal(store.resultCount(), 0);
    assert.equal(store.health().ok, true);
    assert.equal(store.statistics().realXmlGeneratedCount, 0);
  });

  it("retry recupera falha transitória", async () => {
    const port = new DefaultXMLGenerationAdapter({
      provider: "enterprise",
      failAttempts: 1,
      defaultRetryCount: 2,
      defaultRetryBackoffMs: 1,
    });
    const result = await port.generate({
      documentId: "doc-retry",
      retryCount: 2,
    });
    assert.equal(result.ok, true);
    assert.ok(result.telemetry.attempts >= 2);
  });

  it("cancelamento via AbortSignal retorna XML_GENERATION_RUNTIME_CANCELLED", async () => {
    const port = new DefaultXMLGenerationAdapter({
      provider: "enterprise",
    });
    const controller = new AbortController();
    controller.abort();
    const result = await port.generate({ signal: controller.signal });
    assert.equal(result.ok, false);
    assert.equal(result.code, "XML_GENERATION_RUNTIME_CANCELLED");
    assert.equal(result.telemetry.cancelled, true);
  });

  it("Registry e Factory seguem ECS-01 (sem fallback silencioso)", () => {
    const registry = createDefaultXMLGenerationRuntimeRegistry();
    assert.ok(registry instanceof XMLGenerationRuntimeRegistry);
    assert.equal(registry.snapshot().count, BUILTIN_XML_GENERATION_RUNTIME_PROVIDER_COUNT);
    assert.equal(registry.has("enterprise"), true);

    const factory = createXMLGenerationRuntimeFactory({ registry });
    assert.ok(factory instanceof XMLGenerationRuntimeFactory);
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");

    assert.throws(
      () =>
        factory.create({
          // @ts-expect-error — provider inválido
          provider: "unimed-xml-gen",
        }),
      /não está registrado|desconhecido/,
    );

    assert.equal(getXMLGenerationRuntimeFactory().getRegistry().has("mock"), true);
    assert.equal(DEFAULT_XML_GENERATION_RUNTIME_CAPABILITIES.implementsRealXml, false);
    assert.equal(DEFAULT_XML_GENERATION_RUNTIME_CAPABILITIES.supportsCanonicalStructure, true);
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createXMLGenerationRuntimePort({ provider: "enterprise" });
    const summary = await getXMLGenerationRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.info.providerType, "XML_GENERATION_RUNTIME");
    assert.equal(summary.capabilities.implementsRealXml, false);
  });
});

describe("TISS-05 cadeia Enterprise / TISS Runtime / XML Runtime / XML Generation Runtime", () => {
  it("Enterprise Runtime expõe XML Generation Runtime + XML Runtime + TISS Runtime", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    assert.equal(runtime.getXMLGenerationRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getXMLRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getRulePackEnginePort().providerId, "enterprise");
    assert.equal(runtime.getTISSCatalogPort().providerId, "enterprise");
    assert.equal(runtime.getTISSRuntimePort().providerId, "default");
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesXMLGenerationRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesXMLRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().implementsRealXml, false);

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.xmlGenerationRuntimeOk, true);
    assert.equal(health.xmlRuntimeOk, true);
    assert.equal(health.rulePackEngineOk, true);
    assert.equal(health.tissCatalogOk, true);
    assert.equal(health.tissRuntimeOk, true);
  });

  it("fluxo oficial: TISS Runtime → XMLRuntimePort → XMLGenerationRuntimePort → Canonical Result", async () => {
    const orchestrator = createCanonicalExecutionOrchestratorPort({ provider: "mock" });
    const tissProvider = createTISSProviderPort({ provider: "enterprise" });
    const catalog = createTISSCatalogPort({ provider: "enterprise" });
    const rulePackEngine = createRulePackEnginePort({
      provider: "enterprise",
      enterpriseDeps: { getTISSCatalogPort: () => catalog },
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
        getTISSCatalogPort: () => catalog,
        getRulePackEnginePort: () => rulePackEngine,
        getXMLGenerationRuntimePort: () => xmlGenerationRuntime,
      },
    });
    const tissRuntime = createTISSRuntimePort({
      provider: "default",
      enterpriseDeps: {
        getOrchestratorPort: () => orchestrator,
        getTISSProviderPort: () => tissProvider,
        getTISSCatalogPort: () => catalog,
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

    const result = await tissRuntime.process({
      kind: "canonical-tiss-request",
      mode: "structural-process",
      metadata: {
        kind: "canonical-tiss-metadata",
        sessionId: "sess-tiss-05",
        correlationId: "corr-tiss-05",
      },
    });

    assert.equal(result.ok, true);
    assert.ok(result.runtimeSessionId);
    assert.equal(result.realTissExecuted, false);

    const session = await tissRuntime.getSession({
      runtimeSessionId: result.runtimeSessionId!,
    });
    assert.equal(session.ok, true);
    assert.equal(session.session?.processedViaXMLRuntimePort, true);
    assert.equal(session.session?.processedViaXMLGenerationRuntimePort, true);
    assert.ok(session.session?.xmlGenerationId);
    assert.ok(session.session?.xmlGenerationResultId);

    const generation = await xmlRuntime.getGeneration({
      generationId: session.session!.xmlGenerationId!,
    });
    assert.equal(generation.ok, true);
    assert.equal(generation.generation?.realXmlGenerated, false);
    assert.equal(generation.generation?.xmlGenerationRuntimeConsumed, true);
    assert.equal(generation.generation?.canonicalStructure?.kind, "canonical-xml-structure");

    const genResult = await xmlGenerationRuntime.getResult({
      resultId: session.session!.xmlGenerationResultId!,
    });
    assert.equal(genResult.ok, true);
    assert.equal(genResult.result?.realXmlGenerated, false);
    assert.equal(genResult.result?.structure?.root, "CanonicalXML");
  });

  it("XML Runtime consome exclusivamente XMLGenerationRuntimePort (sem adapter paralelo)", async () => {
    const adapterSource = readFileSync(
      join(repoRoot, "src/lib/enterprise/xml-runtime/adapters/default-xml-runtime-adapter.ts"),
      "utf8",
    );
    assert.match(adapterSource, /getXMLGenerationRuntimePort/);
    assert.match(adapterSource, /canonical-xml-generation-request/);
    assert.equal(/new DefaultXMLGenerationAdapter/.test(adapterSource), false);
    assert.equal(/InMemoryXMLGenerationRuntimeStore/.test(adapterSource), false);
    assert.equal(/ansTISS/i.test(adapterSource), false);
    assert.equal(/DOMParser|XMLSerializer|XMLWriter|createElementNS/.test(adapterSource), false);
  });
});

describe("TISS-05 auditoria — sem bypass / sem lógica específica / sem XML real", () => {
  it("módulo xml-generation-runtime não contém backends / operadoras / XML dispatch real", () => {
    const moduleDir = join(repoRoot, "src/lib/enterprise/xml-generation-runtime");
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
      /TUSS_CATALOG/,
      /tuss_procedures/,
      /DOMParser/,
      /XMLSerializer/,
      /XMLWriter/,
      /createElementNS/,
      /<\?xml/,
      /ansTISS/i,
      /xml-export-service/,
    ];

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        assert.equal(pattern.test(source), false, `Forbidden pattern ${pattern} in ${file}`);
      }
    }
  });

  it("Enterprise Runtime wiring inclui createXMLGenerationRuntimePort", () => {
    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.match(enterpriseRuntime, /createXMLGenerationRuntimePort/);
    assert.match(enterpriseRuntime, /getXMLGenerationRuntimePort/);
    assert.match(enterpriseRuntime, /xmlGenerationRuntimeOk/);
  });

  it("TISS Runtime wiring inclui getXMLGenerationRuntimePort", () => {
    const tissAdapter = readFileSync(
      join(repoRoot, "src/lib/enterprise/tiss-runtime/adapters/default-tiss-runtime-adapter.ts"),
      "utf8",
    );
    assert.match(tissAdapter, /getXMLGenerationRuntimePort/);
    assert.match(tissAdapter, /usesXMLGenerationRuntimePort/);
    assert.match(tissAdapter, /processedViaXMLGenerationRuntimePort/);
    assert.equal(/new DefaultXMLGenerationAdapter/.test(tissAdapter), false);
  });

  it("realXmlGenerated permanece false em toda a cadeia", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const xmlGen = runtime.getXMLGenerationRuntimePort();
    const generated = await xmlGen.generate({ documentId: "doc-flag" });
    assert.equal(generated.result?.realXmlGenerated, false);
    assert.equal(generated.structure?.realXmlGenerated, false);

    const xmlRuntime = runtime.getXMLRuntimePort();
    const xmlGenerated = await xmlRuntime.generate({ documentId: "doc-flag-2" });
    assert.equal(xmlGenerated.result?.realXmlGenerated, false);
    assert.equal(xmlGenerated.generation?.realXmlGenerated, false);
    assert.equal(xmlGenerated.result?.xmlGenerationRuntimeConsumed, true);
  });
});

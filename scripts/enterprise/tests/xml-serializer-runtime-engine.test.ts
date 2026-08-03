#!/usr/bin/env node
/**
 * TISS-06 — Enterprise XML Serializer Runtime
 * Prova: Application → XMLSerializerRuntimePort → Adapter → Factory → Registry → Store
 *         + XML Generation Runtime + XML Runtime + TISS Runtime + Enterprise Runtime
 *         + Canonical XML Serialize Request / Result / String
 *         + serialize / health / capabilities
 *         + ausência de XML TISS/ANS real / bypass / lógica específica
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_XML_SERIALIZER_RUNTIME_PROVIDER_COUNT,
  DEFAULT_XML_SERIALIZER_ADAPTER_ID,
  DEFAULT_XML_SERIALIZER_RUNTIME_CAPABILITIES,
  DefaultXMLSerializerAdapter,
  EnterpriseXMLSerializerAdapter,
  IN_MEMORY_XML_SERIALIZER_RUNTIME_STORE_ID,
  InMemoryXMLSerializerRuntimeStore,
  MOCK_XML_SERIALIZER_ADAPTER_ID,
  MockXMLSerializerAdapter,
  XMLSerializerRuntimeFactory,
  XMLSerializerRuntimeProvider,
  XMLSerializerRuntimeRegistry,
  createDefaultXMLSerializerRuntimeRegistry,
  createXMLSerializerRuntimeFactory,
  createXMLSerializerRuntimePort,
  getXMLSerializerRuntimeFactory,
  getXMLSerializerRuntimeHealthSummary,
  type XMLSerializerRuntimePort,
} from "../../../src/lib/enterprise/xml-serializer-runtime/index.ts";
import { createXMLSchemaRuntimePort } from "../../../src/lib/enterprise/xml-schema-runtime/index.ts";
import { createXMLValidationRuntimePort } from "../../../src/lib/enterprise/xml-validation-runtime/index.ts";
import { createXSDRuntimePort } from "../../../src/lib/enterprise/xsd-runtime/index.ts";
import { createNamespaceRuntimePort } from "../../../src/lib/enterprise/namespace-runtime/index.ts";
import { createXMLGenerationRuntimePort } from "../../../src/lib/enterprise/xml-generation-runtime/index.ts";
import { createTISSCatalogPort } from "../../../src/lib/enterprise/tiss-catalog/index.ts";
import { createRulePackEnginePort } from "../../../src/lib/enterprise/rule-pack-engine/index.ts";
import { createXMLRuntimePort } from "../../../src/lib/enterprise/xml-runtime/index.ts";
import { createTISSRuntimePort } from "../../../src/lib/enterprise/tiss-runtime/index.ts";
import { createQueueRuntimePort } from '../../../src/lib/enterprise/queue-runtime/index.ts';
import { createSchedulerRuntimePort } from "../../../src/lib/enterprise/scheduler-runtime/index.ts";
import { createWorkerRuntimePort } from "../../../src/lib/enterprise/worker-runtime/index.ts";
import { createPersistentQueueRuntimePort } from "../../../src/lib/enterprise/persistent-queue-runtime/index.ts";
import { createObservabilityRuntimePort } from "../../../src/lib/enterprise/observability-runtime/index.ts";
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

describe("TISS-06 XMLSerializerRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: XMLSerializerRuntimePort = new MockXMLSerializerAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.status, "ready");
    assert.equal(health.kind, "canonical-xml-serializer-provider-health");

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_XML_SERIALIZER_ADAPTER_ID);
    assert.equal(caps.supportsCanonicalXmlString, true);
    assert.equal(caps.implementsRealTissXml, false);
    assert.equal(caps.implementsRealAnsXml, false);
    assert.equal(caps.implementsOperatorDispatch, false);
    assert.equal(caps.knowsOperatorOrCooperative, false);
    assert.equal(caps.knowsContract, false);
    assert.equal(caps.knowsTenant, false);
    assert.equal(caps.knowsTissPattern, false);
    assert.equal(caps.canonical.kind, "canonical-xml-serializer-provider-capabilities");
    assert.equal(caps.canonical.implementsRealTissXml, false);
    assert.equal(caps.canonical.implementsRealAnsXml, false);
  });

  it("DefaultXMLSerializerAdapter é o adapter enterprise oficial", () => {
    assert.equal(EnterpriseXMLSerializerAdapter, DefaultXMLSerializerAdapter);
    const port = new DefaultXMLSerializerAdapter({
      provider: "enterprise",
    });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_XML_SERIALIZER_ADAPTER_ID);
  });

  it("createXMLSerializerRuntimePort / Provider default resolve enterprise", async () => {
    const port = createXMLSerializerRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(XMLSerializerRuntimeProvider.create().providerId, "enterprise");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("test / default / mock são resolvidos pelo factory", async () => {
    assert.equal(createXMLSerializerRuntimePort({ provider: "test" }).providerId, "test");
    assert.equal(createXMLSerializerRuntimePort({ provider: "default" }).providerId, "default");
    assert.equal(createXMLSerializerRuntimePort({ provider: "mock" }).providerId, "mock");
    assert.equal((await createXMLSerializerRuntimePort({ provider: "mock" }).health()).ok, true);
  });

  it("Canonical XML Serialize Request / Result / String via Port (sem TISS/ANS)", async () => {
    const generation = createXMLGenerationRuntimePort({ provider: "enterprise" });
    const generated = await generation.generate({
      generationId: "xml-gen-tiss-06",
      documentId: "doc-tiss-06",
      catalogId: "catalog-1",
      catalogConsumed: true,
      rulePackExecutionId: "rpe-1",
      rulePackCode: "base-structural",
      rulePackConsumed: true,
    });
    assert.equal(generated.ok, true);
    assert.ok(generated.structure);

    const port = createXMLSerializerRuntimePort({ provider: "enterprise" });
    const serialized = await port.serialize({
      generationId: "xml-gen-tiss-06",
      generationResultId: generated.result?.resultId,
      documentId: "doc-tiss-06",
      structure: generated.structure,
      request: {
        kind: "canonical-xml-serialize-request",
        generationId: "xml-gen-tiss-06",
        generationResultId: generated.result?.resultId,
        documentId: "doc-tiss-06",
        structure: generated.structure,
        metadata: {
          kind: "canonical-xml-serializer-metadata",
          sessionId: "sess-xml-06",
          channel: "enterprise-test",
        },
        structuralNotes: "TISS-06 canonical XML string only.",
      },
    });

    assert.equal(serialized.ok, true);
    assert.equal(serialized.result?.kind, "canonical-xml-serialize-result");
    assert.equal(serialized.result?.realTissXmlGenerated, false);
    assert.equal(serialized.result?.realAnsXmlGenerated, false);
    assert.ok(serialized.canonicalXml);
    assert.match(serialized.canonicalXml!, /<CanonicalXML>/);
    assert.match(serialized.canonicalXml!, /<RealTissXmlGenerated>false<\/RealTissXmlGenerated>/);
    assert.match(serialized.canonicalXml!, /<RealAnsXmlGenerated>false<\/RealAnsXmlGenerated>/);
    assert.equal(/ansTISS/i.test(serialized.canonicalXml!), false);
    assert.equal(/xmlns:/i.test(serialized.canonicalXml!), false);
    assert.equal(/unimed|hapvida|bradesco/i.test(serialized.canonicalXml!), false);
    assert.equal(serialized.telemetry.cancelled, false);

    const listed = await port.listResults();
    assert.equal(listed.ok, true);
    assert.ok(listed.results.length >= 1);
    assert.equal(listed.statistics?.kind, "canonical-xml-serializer-statistics");
    assert.equal(listed.statistics?.realTissXmlGeneratedCount, 0);
    assert.equal(listed.statistics?.realAnsXmlGeneratedCount, 0);

    const loaded = await port.getResult({
      resultId: serialized.result!.resultId,
    });
    assert.equal(loaded.ok, true);
    assert.equal(loaded.result?.resultId, serialized.result?.resultId);
    assert.equal(loaded.result?.realTissXmlGenerated, false);
    assert.equal(loaded.result?.realAnsXmlGenerated, false);
  });

  it("InMemoryXMLSerializerRuntimeStore é o store oficial", () => {
    const store = new InMemoryXMLSerializerRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_XML_SERIALIZER_RUNTIME_STORE_ID);
    assert.equal(store.resultCount(), 0);
    assert.equal(store.health().ok, true);
    assert.equal(store.statistics().realTissXmlGeneratedCount, 0);
    assert.equal(store.statistics().realAnsXmlGeneratedCount, 0);
  });

  it("retry recupera falha transitória", async () => {
    const port = new DefaultXMLSerializerAdapter({
      provider: "enterprise",
      failAttempts: 1,
      defaultRetryCount: 2,
      defaultRetryBackoffMs: 1,
    });
    const result = await port.serialize({
      documentId: "doc-retry",
      retryCount: 2,
    });
    assert.equal(result.ok, true);
    assert.ok(result.telemetry.attempts >= 2);
  });

  it("cancelamento via AbortSignal retorna XML_SERIALIZER_RUNTIME_CANCELLED", async () => {
    const port = new DefaultXMLSerializerAdapter({
      provider: "enterprise",
    });
    const controller = new AbortController();
    controller.abort();
    const result = await port.serialize({ signal: controller.signal });
    assert.equal(result.ok, false);
    assert.equal(result.code, "XML_SERIALIZER_RUNTIME_CANCELLED");
    assert.equal(result.telemetry.cancelled, true);
  });

  it("Registry e Factory seguem ECS-01 (sem fallback silencioso)", () => {
    const registry = createDefaultXMLSerializerRuntimeRegistry();
    assert.ok(registry instanceof XMLSerializerRuntimeRegistry);
    assert.equal(registry.snapshot().count, BUILTIN_XML_SERIALIZER_RUNTIME_PROVIDER_COUNT);
    assert.equal(registry.has("enterprise"), true);

    const factory = createXMLSerializerRuntimeFactory({ registry });
    assert.ok(factory instanceof XMLSerializerRuntimeFactory);
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");

    assert.throws(
      () =>
        factory.create({
          // @ts-expect-error — provider inválido
          provider: "unimed-xml-ser",
        }),
      /não está registrado|desconhecido/,
    );

    assert.equal(getXMLSerializerRuntimeFactory().getRegistry().has("mock"), true);
    assert.equal(DEFAULT_XML_SERIALIZER_RUNTIME_CAPABILITIES.implementsRealTissXml, false);
    assert.equal(DEFAULT_XML_SERIALIZER_RUNTIME_CAPABILITIES.implementsRealAnsXml, false);
    assert.equal(DEFAULT_XML_SERIALIZER_RUNTIME_CAPABILITIES.supportsCanonicalXmlString, true);
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createXMLSerializerRuntimePort({ provider: "enterprise" });
    const summary = await getXMLSerializerRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.info.providerType, "XML_SERIALIZER_RUNTIME");
    assert.equal(summary.capabilities.implementsRealTissXml, false);
    assert.equal(summary.capabilities.implementsRealAnsXml, false);
  });
});

describe("TISS-06 cadeia Enterprise / TISS / XML Runtime / Generation / Serializer", () => {
  it("Enterprise Runtime expõe XML Serializer Runtime + cadeia XML", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    assert.equal(runtime.getXMLSerializerRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getXMLGenerationRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getXMLRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getTISSRuntimePort().providerId, "default");
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesXMLSerializerRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesXMLGenerationRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesXMLRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().implementsRealXml, false);

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.xmlSerializerRuntimeOk, true);
    assert.equal(health.xmlGenerationRuntimeOk, true);
    assert.equal(health.xmlRuntimeOk, true);
    assert.equal(health.tissRuntimeOk, true);
  });

  it("fluxo oficial: TISS → XMLRuntime → XMLGeneration → XMLSerializer → Canonical XML String", async () => {
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
                  capabilities: () =>
                    ({
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
      },
    });

    const result = await tissRuntime.process({
      kind: "canonical-tiss-request",
      mode: "structural-process",
      metadata: {
        kind: "canonical-tiss-metadata",
        sessionId: "sess-tiss-06",
        correlationId: "corr-tiss-06",
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
    assert.equal(session.session?.processedViaXMLSerializerRuntimePort, true);
    assert.ok(session.session?.xmlGenerationId);
    assert.ok(session.session?.xmlGenerationResultId);
    assert.ok(session.session?.xmlSerializeResultId);

    const genResult = await xmlGenerationRuntime.getResult({
      resultId: session.session!.xmlGenerationResultId!,
    });
    assert.equal(genResult.ok, true);
    assert.equal(genResult.result?.realXmlGenerated, false);
    assert.equal(genResult.result?.structure?.root, "CanonicalXML");

    const serResult = await xmlSerializerRuntime.getResult({
      resultId: session.session!.xmlSerializeResultId!,
    });
    assert.equal(serResult.ok, true);
    assert.equal(serResult.result?.realTissXmlGenerated, false);
    assert.equal(serResult.result?.realAnsXmlGenerated, false);
    assert.ok(serResult.result?.canonicalXml);
    assert.match(serResult.result!.canonicalXml!, /<CanonicalXML>/);
    assert.equal(/ansTISS/i.test(serResult.result!.canonicalXml!), false);
  });

  it("TISS Runtime consome exclusivamente XMLSerializerRuntimePort (sem adapter paralelo)", async () => {
    const adapterSource = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/tiss-runtime/adapters/default-tiss-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(adapterSource, /getXMLSerializerRuntimePort/);
    assert.match(adapterSource, /canonical-xml-serialize-request/);
    assert.equal(/new DefaultXMLSerializerAdapter/.test(adapterSource), false);
    assert.equal(/InMemoryXMLSerializerRuntimeStore/.test(adapterSource), false);
    assert.equal(/ansTISS/i.test(adapterSource), false);
  });
});

describe("TISS-06 auditoria — sem bypass / sem lógica específica / sem XML TISS/ANS", () => {
  it("módulo xml-serializer-runtime não contém backends / operadoras / XML TISS/ANS real", () => {
    const moduleDir = join(repoRoot, "src/lib/enterprise/xml-serializer-runtime");
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
      /XMLWriter/,
      /createElementNS/,
      /ansTISS/i,
      /xmlns:ans/i,
      /xml-export-service/,
      /\.xsd["']/,
      /SOAP/i,
    ];

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        assert.equal(
          pattern.test(source),
          false,
          `Forbidden pattern ${pattern} in ${file}`,
        );
      }
      // Browser DOM XMLSerializer API must not be used (class name in our adapters is OK).
      assert.equal(
        /\bnew\s+XMLSerializer\s*\(/.test(source),
        false,
        `Browser XMLSerializer API used in ${file}`,
      );
    }
  });

  it("Enterprise Runtime wiring inclui createXMLSerializerRuntimePort", () => {
    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.match(enterpriseRuntime, /createXMLSerializerRuntimePort/);
    assert.match(enterpriseRuntime, /getXMLSerializerRuntimePort/);
    assert.match(enterpriseRuntime, /xmlSerializerRuntimeOk/);
  });

  it("TISS Runtime wiring inclui getXMLSerializerRuntimePort", () => {
    const tissAdapter = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/tiss-runtime/adapters/default-tiss-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(tissAdapter, /getXMLSerializerRuntimePort/);
    assert.match(tissAdapter, /usesXMLSerializerRuntimePort/);
    assert.match(tissAdapter, /processedViaXMLSerializerRuntimePort/);
    assert.equal(/new DefaultXMLSerializerAdapter/.test(tissAdapter), false);
  });

  it("XML Generation / XML Runtime modules não importam Serializer (auditoria XMLSerializer preservada)", () => {
    for (const moduleName of ["xml-generation-runtime", "xml-runtime"]) {
      const moduleDir = join(repoRoot, "src/lib/enterprise", moduleName);
      for (const file of collectTsFiles(moduleDir)) {
        const source = readFileSync(file, "utf8");
        assert.equal(
          /xml-serializer-runtime/.test(source),
          false,
          `${file} must not import xml-serializer-runtime`,
        );
      }
    }
  });

  it("realTissXmlGenerated / realAnsXmlGenerated permanecem false na cadeia", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const serializer = runtime.getXMLSerializerRuntimePort();
    const generation = runtime.getXMLGenerationRuntimePort();
    const generated = await generation.generate({ documentId: "doc-flag-ser" });
    const serialized = await serializer.serialize({
      documentId: "doc-flag-ser",
      structure: generated.structure,
      generationResultId: generated.result?.resultId,
    });
    assert.equal(serialized.result?.realTissXmlGenerated, false);
    assert.equal(serialized.result?.realAnsXmlGenerated, false);

    const tiss = runtime.getTISSRuntimePort();
    const processed = await tiss.process({
      kind: "canonical-tiss-request",
      mode: "structural-process",
      metadata: {
        kind: "canonical-tiss-metadata",
        sessionId: "sess-flag-06",
      },
    });
    assert.equal(processed.ok, true);
    const session = await tiss.getSession({
      runtimeSessionId: processed.runtimeSessionId!,
    });
    assert.equal(session.session?.processedViaXMLSerializerRuntimePort, true);
    const ser = await serializer.getResult({
      resultId: session.session!.xmlSerializeResultId!,
    });
    assert.equal(ser.result?.realTissXmlGenerated, false);
    assert.equal(ser.result?.realAnsXmlGenerated, false);
  });
});

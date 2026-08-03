#!/usr/bin/env node
/**
 * TISS-09 — Enterprise XSD Runtime
 * Prova: Application → XSDRuntimePort → Adapter → Factory → Registry → Store
 *         + XML Validation Runtime + XML Schema Runtime + XML Serializer Runtime
 *         + XML Generation Runtime + XML Runtime
 *         + TISS Runtime + Enterprise Runtime
 *         + Canonical XSD Runtime Request / Result
 *         + prepare / health / capabilities
 *         + ausência de XSD oficial / validação real / XML TISS/ANS / bypass
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_XSD_RUNTIME_PROVIDER_COUNT,
  DEFAULT_XSD_RUNTIME_ADAPTER_ID,
  DEFAULT_XSD_RUNTIME_CAPABILITIES,
  DefaultXSDRuntimeAdapter,
  EnterpriseXSDRuntimeAdapter,
  IN_MEMORY_XSD_RUNTIME_STORE_ID,
  InMemoryXSDRuntimeStore,
  MOCK_XSD_RUNTIME_ADAPTER_ID,
  MockXSDRuntimeAdapter,
  XSDRuntimeFactory,
  XSDRuntimeProvider,
  XSDRuntimeRegistry,
  createDefaultXSDRuntimeRegistry,
  createXSDRuntimeFactory,
  createXSDRuntimePort,
  getXSDRuntimeFactory,
  getXSDRuntimeHealthSummary,
  type XSDRuntimePort,
} from "../../../src/lib/enterprise/xsd-runtime/index.ts";
import { createNamespaceRuntimePort } from "../../../src/lib/enterprise/namespace-runtime/index.ts";
import { createXMLValidationRuntimePort } from "../../../src/lib/enterprise/xml-validation-runtime/index.ts";
import { createXMLSchemaRuntimePort } from "../../../src/lib/enterprise/xml-schema-runtime/index.ts";
import { createXMLSerializerRuntimePort } from "../../../src/lib/enterprise/xml-serializer-runtime/index.ts";
import { createXMLGenerationRuntimePort } from "../../../src/lib/enterprise/xml-generation-runtime/index.ts";
import { createTISSCatalogPort } from "../../../src/lib/enterprise/tiss-catalog/index.ts";
import { createRulePackEnginePort } from "../../../src/lib/enterprise/rule-pack-engine/index.ts";
import { createXMLRuntimePort } from "../../../src/lib/enterprise/xml-runtime/index.ts";
import { createTISSRuntimePort } from "../../../src/lib/enterprise/tiss-runtime/index.ts";
import { createQueueRuntimePort } from '../../../src/lib/enterprise/queue-runtime/index.ts';
import { createSchedulerRuntimePort } from "../../../src/lib/enterprise/scheduler-runtime/index.ts";
import { createWorkerRuntimePort } from "../../../src/lib/enterprise/worker-runtime/index.ts";
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

describe("TISS-09 XSDRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: XSDRuntimePort = new MockXSDRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.status, "ready");
    assert.equal(health.kind, "canonical-xsd-health");
    assert.equal(health.runtimeReady, true);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_XSD_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsCanonicalXsd, true);
    assert.equal(caps.runtimeReady, true);
    assert.equal(caps.officialXsdLoaded, false);
    assert.equal(caps.realXsdLoaded, false);
    assert.equal(caps.realValidationAvailable, false);
    assert.equal(caps.officialNamespacesLoaded, false);
    assert.equal(caps.officialSchemasLoaded, false);
    assert.equal(caps.schemaParsingEnabled, false);
    assert.equal(caps.schemaValidationEnabled, false);
    assert.equal(caps.implementsOfficialXsd, false);
    assert.equal(caps.implementsXsdValidation, false);
    assert.equal(caps.implementsRealXmlValidation, false);
    assert.equal(caps.implementsOperatorDispatch, false);
    assert.equal(caps.knowsOperatorOrCooperative, false);
    assert.equal(caps.knowsContract, false);
    assert.equal(caps.knowsTenant, false);
    assert.equal(caps.knowsTissPattern, false);
    assert.equal(caps.canonical.kind, "canonical-xsd-capabilities");
    assert.equal(caps.canonical.runtimeReady, true);
    assert.equal(caps.canonical.officialXsdLoaded, false);
  });

  it("DefaultXSDRuntimeAdapter é o adapter enterprise oficial", () => {
    assert.equal(EnterpriseXSDRuntimeAdapter, DefaultXSDRuntimeAdapter);
    const port = new DefaultXSDRuntimeAdapter({
      provider: "enterprise",
    });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_XSD_RUNTIME_ADAPTER_ID);
  });

  it("provider default resolve enterprise", () => {
    const port = createXSDRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(XSDRuntimeProvider.create().providerId, "enterprise");
  });

  it("factory resolve mock / test / default / enterprise", () => {
    const factory = createXSDRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(
      getXSDRuntimeFactory().getRegistry().list().length,
      BUILTIN_XSD_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("prepare → get → list com flags estruturais obrigatórias", async () => {
    const validation = createXMLValidationRuntimePort({ provider: "enterprise" });
    const schema = createXMLSchemaRuntimePort({ provider: "enterprise" });
    const serializer = createXMLSerializerRuntimePort({ provider: "enterprise" });
    const serialized = await serializer.serialize({ documentId: "doc-xsd-01" });
    const registered = await schema.register({
      documentId: "doc-xsd-01",
      serializeResultId: serialized.result?.resultId,
    });
    const validated = await validation.validate({
      documentId: "doc-xsd-01",
      schemaResultId: registered.result?.resultId,
      serializeResultId: serialized.result?.resultId,
    });

    const port = createXSDRuntimePort({ provider: "enterprise" });
    const prepared = await port.prepare({
      documentId: "doc-xsd-01",
      validationResultId: validated.result?.resultId,
      schemaResultId: registered.result?.resultId,
      serializeResultId: serialized.result?.resultId,
      request: {
        kind: "canonical-xsd-runtime-request",
        name: "Foundation XSD",
        structuralNotes: "TISS-09 structural only",
      },
    });

    assert.equal(prepared.ok, true);
    assert.ok(prepared.result?.resultId);
    assert.equal(prepared.result?.officialXsdLoaded, false);
    assert.equal(prepared.result?.realXsdLoaded, false);
    assert.equal(prepared.result?.realValidationAvailable, false);
    assert.equal(prepared.result?.officialNamespacesLoaded, false);
    assert.equal(prepared.result?.officialSchemasLoaded, false);
    assert.equal(prepared.result?.schemaParsingEnabled, false);
    assert.equal(prepared.result?.schemaValidationEnabled, false);
    assert.equal(prepared.result?.runtimeReady, true);
    assert.equal(prepared.result?.status, "prepared");
    assert.equal(prepared.result?.schema?.kind, "canonical-xsd-schema");

    const loaded = await port.getResult({ resultId: prepared.result!.resultId });
    assert.equal(loaded.ok, true);
    assert.equal(loaded.result?.resultId, prepared.result!.resultId);

    const listed = await port.listResults();
    assert.equal(listed.ok, true);
    assert.ok(listed.results.length >= 1);
    assert.equal(listed.statistics?.officialXsdLoadedCount, 0);
    assert.equal(listed.statistics?.realXsdLoadedCount, 0);
    assert.equal(listed.statistics?.realValidationAvailableCount, 0);
  });

  it("InMemory store oficial e estatísticas zeradas para XSD real", () => {
    const store = new InMemoryXSDRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_XSD_RUNTIME_STORE_ID);
    const stats = store.statistics();
    assert.equal(stats.kind, "canonical-xsd-statistics");
    assert.equal(stats.officialXsdLoadedCount, 0);
    assert.equal(stats.realXsdLoadedCount, 0);
    assert.equal(stats.officialNamespacesLoadedCount, 0);
    assert.equal(stats.schemaParsingEnabledCount, 0);
    assert.equal(DEFAULT_XSD_RUNTIME_CAPABILITIES.runtimeReady, true);
    assert.equal(DEFAULT_XSD_RUNTIME_CAPABILITIES.officialXsdLoaded, false);
  });

  it("retry recupera falha transitória", async () => {
    const port = new DefaultXSDRuntimeAdapter({
      provider: "enterprise",
      failAttempts: 1,
      defaultRetryCount: 1,
      defaultRetryBackoffMs: 1,
    });
    const result = await port.prepare({ documentId: "doc-retry" });
    assert.equal(result.ok, true);
    assert.ok((result.telemetry?.attempts ?? 0) >= 2);
  });

  it("AbortSignal cancela operação", async () => {
    const port = createXSDRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.prepare({
      documentId: "doc-abort",
      signal: controller.signal,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "XSD_RUNTIME_CANCELLED");
  });

  it("registry/factory sem fallback silencioso", () => {
    const registry = createDefaultXSDRuntimeRegistry();
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.snapshot().count, BUILTIN_XSD_RUNTIME_PROVIDER_COUNT);
    assert.ok(registry instanceof XSDRuntimeRegistry);

    const factory = new XSDRuntimeFactory({ registry });
    assert.throws(() => factory.create({ provider: "unknown" as never }), /não está registrado/);
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createXSDRuntimePort({ provider: "enterprise" });
    const summary = await getXSDRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.info.providerType, "XSD_RUNTIME");
    assert.equal(summary.capabilities.runtimeReady, true);
    assert.equal(summary.capabilities.officialXsdLoaded, false);
    assert.equal(summary.capabilities.realValidationAvailable, false);
  });
});

describe("TISS-09 cadeia Enterprise / TISS / XML / Generation / Serializer / Schema / Validation / XSD", () => {
  it("Enterprise Runtime expõe XSD Runtime + cadeia XML", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    assert.equal(runtime.getXSDRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getXMLValidationRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getXMLSchemaRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getXMLSerializerRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getXMLGenerationRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getXMLRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getTISSRuntimePort().providerId, "default");
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesXSDRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesXMLValidationRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesXMLSchemaRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesXMLSerializerRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesXMLGenerationRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesXMLRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().implementsRealXml, false);

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.xsdRuntimeOk, true);
    assert.equal(health.xmlValidationRuntimeOk, true);
    assert.equal(health.xmlSchemaRuntimeOk, true);
    assert.equal(health.xmlSerializerRuntimeOk, true);
    assert.equal(health.xmlGenerationRuntimeOk, true);
    assert.equal(health.xmlRuntimeOk, true);
    assert.equal(health.tissRuntimeOk, true);
  });

  it("fluxo oficial: TISS → XML → Generation → Serializer → Schema → Validation → XSD", async () => {
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
      },
    });

    const result = await tissRuntime.process({
      kind: "canonical-tiss-request",
      mode: "structural-process",
      metadata: {
        kind: "canonical-tiss-metadata",
        sessionId: "sess-tiss-09",
        correlationId: "corr-tiss-09",
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
    assert.equal(session.session?.processedViaXMLSchemaRuntimePort, true);
    assert.equal(session.session?.processedViaXMLValidationRuntimePort, true);
    assert.equal(session.session?.processedViaXSDRuntimePort, true);
    assert.ok(session.session?.xmlGenerationId);
    assert.ok(session.session?.xmlGenerationResultId);
    assert.ok(session.session?.xmlSerializeResultId);
    assert.ok(session.session?.xmlSchemaResultId);
    assert.ok(session.session?.xmlValidationResultId);
    assert.ok(session.session?.xsdResultId);

    const xsdResult = await xsdRuntime.getResult({
      resultId: session.session!.xsdResultId!,
    });
    assert.equal(xsdResult.ok, true);
    assert.equal(xsdResult.result?.officialXsdLoaded, false);
    assert.equal(xsdResult.result?.realXsdLoaded, false);
    assert.equal(xsdResult.result?.realValidationAvailable, false);
    assert.equal(xsdResult.result?.officialNamespacesLoaded, false);
    assert.equal(xsdResult.result?.officialSchemasLoaded, false);
    assert.equal(xsdResult.result?.schemaParsingEnabled, false);
    assert.equal(xsdResult.result?.schemaValidationEnabled, false);
    assert.equal(xsdResult.result?.runtimeReady, true);
  });

  it("TISS Runtime consome exclusivamente XSDRuntimePort (sem adapter paralelo)", async () => {
    const adapterSource = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/tiss-runtime/adapters/default-tiss-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(adapterSource, /getXSDRuntimePort/);
    assert.match(adapterSource, /canonical-xsd-runtime-request/);
    assert.equal(/new DefaultXSDRuntimeAdapter/.test(adapterSource), false);
    assert.equal(/InMemoryXSDRuntimeStore/.test(adapterSource), false);
    assert.equal(/ansTISS/i.test(adapterSource), false);
    assert.equal(/\.xsd["']/.test(adapterSource), false);
  });
});

describe("TISS-09 auditoria — sem bypass / sem XSD oficial / sem validação real / sem XML TISS/ANS", () => {
  it("módulo xsd-runtime não contém backends / operadoras / XSD oficial / validação real", () => {
    const moduleDir = join(repoRoot, "src/lib/enterprise/xsd-runtime");
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
      /xsd-validator/i,
      /libxml/i,
      /xmllint/i,
      /fast-xml-parser/i,
      /xml2js/i,
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
    }
  });

  it("Enterprise Runtime wiring inclui createXSDRuntimePort", () => {
    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.match(enterpriseRuntime, /createXSDRuntimePort/);
    assert.match(enterpriseRuntime, /getXSDRuntimePort/);
    assert.match(enterpriseRuntime, /xsdRuntimeOk/);
  });

  it("TISS Runtime wiring inclui getXSDRuntimePort", () => {
    const tissAdapter = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/tiss-runtime/adapters/default-tiss-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(tissAdapter, /getXSDRuntimePort/);
    assert.match(tissAdapter, /usesXSDRuntimePort/);
    assert.match(tissAdapter, /processedViaXSDRuntimePort/);
    assert.equal(/new DefaultXSDRuntimeAdapter/.test(tissAdapter), false);
  });

  it("XML Runtime / Generation / Serializer / Schema / Validation modules não importam XSD Runtime", () => {
    for (const moduleName of [
      "xml-runtime",
      "xml-generation-runtime",
      "xml-serializer-runtime",
      "xml-schema-runtime",
      "xml-validation-runtime",
    ]) {
      const moduleDir = join(repoRoot, "src/lib/enterprise", moduleName);
      for (const file of collectTsFiles(moduleDir)) {
        const source = readFileSync(file, "utf8");
        assert.equal(
          /xsd-runtime/.test(source),
          false,
          `${file} must not import xsd-runtime`,
        );
      }
    }
  });

  it("flags de fundação permanecem estruturais na cadeia", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const xsd = runtime.getXSDRuntimePort();
    const validation = runtime.getXMLValidationRuntimePort();
    const schema = runtime.getXMLSchemaRuntimePort();
    const serializer = runtime.getXMLSerializerRuntimePort();
    const serialized = await serializer.serialize({ documentId: "doc-flag-xsd" });
    const registered = await schema.register({
      documentId: "doc-flag-xsd",
      serializeResultId: serialized.result?.resultId,
    });
    const validated = await validation.validate({
      documentId: "doc-flag-xsd",
      schemaResultId: registered.result?.resultId,
      serializeResultId: serialized.result?.resultId,
    });
    const prepared = await xsd.prepare({
      documentId: "doc-flag-xsd",
      validationResultId: validated.result?.resultId,
      schemaResultId: registered.result?.resultId,
      serializeResultId: serialized.result?.resultId,
    });
    assert.equal(prepared.result?.officialXsdLoaded, false);
    assert.equal(prepared.result?.realXsdLoaded, false);
    assert.equal(prepared.result?.realValidationAvailable, false);
    assert.equal(prepared.result?.runtimeReady, true);

    const tiss = runtime.getTISSRuntimePort();
    const processed = await tiss.process({
      kind: "canonical-tiss-request",
      mode: "structural-process",
      metadata: {
        kind: "canonical-tiss-metadata",
        sessionId: "sess-flag-09",
      },
    });
    assert.equal(processed.ok, true);
    const session = await tiss.getSession({
      runtimeSessionId: processed.runtimeSessionId!,
    });
    assert.equal(session.session?.processedViaXSDRuntimePort, true);
    const xsdLoaded = await xsd.getResult({
      resultId: session.session!.xsdResultId!,
    });
    assert.equal(xsdLoaded.result?.officialXsdLoaded, false);
    assert.equal(xsdLoaded.result?.realXsdLoaded, false);
    assert.equal(xsdLoaded.result?.realValidationAvailable, false);
    assert.equal(xsdLoaded.result?.officialNamespacesLoaded, false);
    assert.equal(xsdLoaded.result?.officialSchemasLoaded, false);
    assert.equal(xsdLoaded.result?.schemaParsingEnabled, false);
    assert.equal(xsdLoaded.result?.schemaValidationEnabled, false);
    assert.equal(xsdLoaded.result?.runtimeReady, true);
  });
});

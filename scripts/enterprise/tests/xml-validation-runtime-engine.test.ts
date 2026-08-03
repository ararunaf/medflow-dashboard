#!/usr/bin/env node
/**
 * TISS-08 — Enterprise XML Validation Runtime
 * Prova: Application → XMLValidationRuntimePort → Adapter → Factory → Registry → Store
 *         + XML Schema Runtime + XML Serializer Runtime + XML Generation Runtime + XML Runtime
 *         + TISS Runtime + Enterprise Runtime
 *         + Canonical XML Validation Request / Result
 *         + validate / health / capabilities
 *         + ausência de XSD oficial / validação real / XML TISS/ANS / bypass
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_XML_VALIDATION_RUNTIME_PROVIDER_COUNT,
  DEFAULT_XML_VALIDATION_ADAPTER_ID,
  DEFAULT_XML_VALIDATION_RUNTIME_CAPABILITIES,
  DefaultXMLValidationAdapter,
  EnterpriseXMLValidationAdapter,
  IN_MEMORY_XML_VALIDATION_RUNTIME_STORE_ID,
  InMemoryXMLValidationRuntimeStore,
  MOCK_XML_VALIDATION_ADAPTER_ID,
  MockXMLValidationAdapter,
  XMLValidationRuntimeFactory,
  XMLValidationRuntimeProvider,
  XMLValidationRuntimeRegistry,
  createDefaultXMLValidationRuntimeRegistry,
  createXMLValidationRuntimeFactory,
  createXMLValidationRuntimePort,
  getXMLValidationRuntimeFactory,
  getXMLValidationRuntimeHealthSummary,
  type XMLValidationRuntimePort,
} from "../../../src/lib/enterprise/xml-validation-runtime/index.ts";
import { createXSDRuntimePort } from "../../../src/lib/enterprise/xsd-runtime/index.ts";
import { createNamespaceRuntimePort } from "../../../src/lib/enterprise/namespace-runtime/index.ts";
import { createXMLSchemaRuntimePort } from "../../../src/lib/enterprise/xml-schema-runtime/index.ts";
import { createXMLSerializerRuntimePort } from "../../../src/lib/enterprise/xml-serializer-runtime/index.ts";
import { createXMLGenerationRuntimePort } from "../../../src/lib/enterprise/xml-generation-runtime/index.ts";
import { createTISSCatalogPort } from "../../../src/lib/enterprise/tiss-catalog/index.ts";
import { createRulePackEnginePort } from "../../../src/lib/enterprise/rule-pack-engine/index.ts";
import { createXMLRuntimePort } from "../../../src/lib/enterprise/xml-runtime/index.ts";
import { createTISSRuntimePort } from "../../../src/lib/enterprise/tiss-runtime/index.ts";
import { createQueueRuntimePort } from '../../../src/lib/enterprise/queue-runtime/index.ts';
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

describe("TISS-08 XMLValidationRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: XMLValidationRuntimePort = new MockXMLValidationAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.status, "ready");
    assert.equal(health.kind, "canonical-xml-validation-health");
    assert.equal(health.validationEngineReady, true);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_XML_VALIDATION_ADAPTER_ID);
    assert.equal(caps.supportsCanonicalValidation, true);
    assert.equal(caps.validationEngineReady, true);
    assert.equal(caps.implementsOfficialXsd, false);
    assert.equal(caps.implementsXsdValidation, false);
    assert.equal(caps.implementsRealXmlValidation, false);
    assert.equal(caps.implementsOfficialTissValidation, false);
    assert.equal(caps.implementsOfficialAnsValidation, false);
    assert.equal(caps.implementsOperatorDispatch, false);
    assert.equal(caps.knowsOperatorOrCooperative, false);
    assert.equal(caps.knowsContract, false);
    assert.equal(caps.knowsTenant, false);
    assert.equal(caps.knowsTissPattern, false);
    assert.equal(caps.canonical.kind, "canonical-xml-validation-capabilities");
    assert.equal(caps.canonical.validationEngineReady, true);
    assert.equal(caps.canonical.implementsOfficialXsd, false);
  });

  it("DefaultXMLValidationAdapter é o adapter enterprise oficial", () => {
    assert.equal(EnterpriseXMLValidationAdapter, DefaultXMLValidationAdapter);
    const port = new DefaultXMLValidationAdapter({
      provider: "enterprise",
    });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_XML_VALIDATION_ADAPTER_ID);
  });

  it("provider default resolve enterprise", () => {
    const port = createXMLValidationRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(XMLValidationRuntimeProvider.create().providerId, "enterprise");
  });

  it("factory resolve mock / test / default / enterprise", () => {
    const factory = createXMLValidationRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(getXMLValidationRuntimeFactory().getRegistry().list().length, BUILTIN_XML_VALIDATION_RUNTIME_PROVIDER_COUNT);
  });

  it("validate → get → list com flags estruturais obrigatórias", async () => {
    const schema = createXMLSchemaRuntimePort({ provider: "enterprise" });
    const serializer = createXMLSerializerRuntimePort({ provider: "enterprise" });
    const serialized = await serializer.serialize({ documentId: "doc-val-01" });
    const registered = await schema.register({
      documentId: "doc-val-01",
      serializeResultId: serialized.result?.resultId,
    });

    const port = createXMLValidationRuntimePort({ provider: "enterprise" });
    const validated = await port.validate({
      documentId: "doc-val-01",
      schemaResultId: registered.result?.resultId,
      serializeResultId: serialized.result?.resultId,
      request: {
        kind: "canonical-xml-validation-request",
        name: "Foundation Validation",
        structuralNotes: "TISS-08 structural only",
      },
    });

    assert.equal(validated.ok, true);
    assert.ok(validated.result?.resultId);
    assert.equal(validated.result?.validationExecuted, false);
    assert.equal(validated.result?.realValidationPerformed, false);
    assert.equal(validated.result?.officialXsdLoaded, false);
    assert.equal(validated.result?.officialAnsValidation, false);
    assert.equal(validated.result?.officialTissValidation, false);
    assert.equal(validated.result?.validationRulesLoaded, false);
    assert.equal(validated.result?.validationEngineReady, true);
    assert.equal(validated.result?.issues.length, 0);
    assert.equal(validated.result?.summary?.issueCount, 0);
    assert.equal(validated.result?.status, "validated");

    const loaded = await port.getResult({ resultId: validated.result!.resultId });
    assert.equal(loaded.ok, true);
    assert.equal(loaded.result?.resultId, validated.result!.resultId);

    const listed = await port.listResults();
    assert.equal(listed.ok, true);
    assert.ok(listed.results.length >= 1);
    assert.equal(listed.statistics?.validationExecutedCount, 0);
    assert.equal(listed.statistics?.realValidationPerformedCount, 0);
    assert.equal(listed.statistics?.officialXsdLoadedCount, 0);
  });

  it("InMemory store oficial e estatísticas zeradas para validação real", () => {
    const store = new InMemoryXMLValidationRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_XML_VALIDATION_RUNTIME_STORE_ID);
    const stats = store.statistics();
    assert.equal(stats.kind, "canonical-xml-validation-statistics");
    assert.equal(stats.validationExecutedCount, 0);
    assert.equal(stats.officialAnsValidationCount, 0);
    assert.equal(stats.officialTissValidationCount, 0);
    assert.equal(DEFAULT_XML_VALIDATION_RUNTIME_CAPABILITIES.validationEngineReady, true);
  });

  it("retry recupera falha transitória", async () => {
    const port = new DefaultXMLValidationAdapter({
      provider: "enterprise",
      failAttempts: 1,
      defaultRetryCount: 1,
      defaultRetryBackoffMs: 1,
    });
    const result = await port.validate({ documentId: "doc-retry" });
    assert.equal(result.ok, true);
    assert.ok((result.telemetry?.attempts ?? 0) >= 2);
  });

  it("AbortSignal cancela operação", async () => {
    const port = createXMLValidationRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.validate({
      documentId: "doc-abort",
      signal: controller.signal,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "XML_VALIDATION_RUNTIME_CANCELLED");
  });

  it("registry/factory sem fallback silencioso", () => {
    const registry = createDefaultXMLValidationRuntimeRegistry();
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.snapshot().count, BUILTIN_XML_VALIDATION_RUNTIME_PROVIDER_COUNT);
    assert.ok(registry instanceof XMLValidationRuntimeRegistry);

    const factory = new XMLValidationRuntimeFactory({ registry });
    assert.throws(() => factory.create({ provider: "unknown" as never }), /não está registrado/);
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createXMLValidationRuntimePort({ provider: "enterprise" });
    const summary = await getXMLValidationRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.info.providerType, "XML_VALIDATION_RUNTIME");
    assert.equal(summary.capabilities.validationEngineReady, true);
    assert.equal(summary.capabilities.implementsOfficialXsd, false);
    assert.equal(summary.capabilities.implementsXsdValidation, false);
  });
});

describe("TISS-08 cadeia Enterprise / TISS / XML / Generation / Serializer / Schema / Validation", () => {
  it("Enterprise Runtime expõe XML Validation Runtime + cadeia XML", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    assert.equal(runtime.getXMLValidationRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getXMLSchemaRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getXMLSerializerRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getXMLGenerationRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getXMLRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getTISSRuntimePort().providerId, "default");
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesXMLValidationRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesXMLSchemaRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesXMLSerializerRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesXMLGenerationRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesXMLRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().implementsRealXml, false);

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.xmlValidationRuntimeOk, true);
    assert.equal(health.xmlSchemaRuntimeOk, true);
    assert.equal(health.xmlSerializerRuntimeOk, true);
    assert.equal(health.xmlGenerationRuntimeOk, true);
    assert.equal(health.xmlRuntimeOk, true);
    assert.equal(health.tissRuntimeOk, true);
  });

  it("fluxo oficial: TISS → XML → Generation → Serializer → Schema → Validation", async () => {
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
      },
    });

    const result = await tissRuntime.process({
      kind: "canonical-tiss-request",
      mode: "structural-process",
      metadata: {
        kind: "canonical-tiss-metadata",
        sessionId: "sess-tiss-08",
        correlationId: "corr-tiss-08",
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
    assert.ok(session.session?.xmlGenerationId);
    assert.ok(session.session?.xmlGenerationResultId);
    assert.ok(session.session?.xmlSerializeResultId);
    assert.ok(session.session?.xmlSchemaResultId);
    assert.ok(session.session?.xmlValidationResultId);

    const valResult = await xmlValidationRuntime.getResult({
      resultId: session.session!.xmlValidationResultId!,
    });
    assert.equal(valResult.ok, true);
    assert.equal(valResult.result?.validationExecuted, false);
    assert.equal(valResult.result?.realValidationPerformed, false);
    assert.equal(valResult.result?.officialXsdLoaded, false);
    assert.equal(valResult.result?.officialAnsValidation, false);
    assert.equal(valResult.result?.officialTissValidation, false);
    assert.equal(valResult.result?.validationRulesLoaded, false);
    assert.equal(valResult.result?.validationEngineReady, true);
  });

  it("TISS Runtime consome exclusivamente XMLValidationRuntimePort (sem adapter paralelo)", async () => {
    const adapterSource = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/tiss-runtime/adapters/default-tiss-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(adapterSource, /getXMLValidationRuntimePort/);
    assert.match(adapterSource, /canonical-xml-validation-request/);
    assert.equal(/new DefaultXMLValidationAdapter/.test(adapterSource), false);
    assert.equal(/InMemoryXMLValidationRuntimeStore/.test(adapterSource), false);
    assert.equal(/ansTISS/i.test(adapterSource), false);
    assert.equal(/\.xsd["']/.test(adapterSource), false);
  });
});

describe("TISS-08 auditoria — sem bypass / sem XSD / sem validação real / sem XML TISS/ANS", () => {
  it("módulo xml-validation-runtime não contém backends / operadoras / XSD oficial / validação real", () => {
    const moduleDir = join(repoRoot, "src/lib/enterprise/xml-validation-runtime");
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
      /XSDSchema/i,
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

  it("Enterprise Runtime wiring inclui createXMLValidationRuntimePort", () => {
    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.match(enterpriseRuntime, /createXMLValidationRuntimePort/);
    assert.match(enterpriseRuntime, /getXMLValidationRuntimePort/);
    assert.match(enterpriseRuntime, /xmlValidationRuntimeOk/);
  });

  it("TISS Runtime wiring inclui getXMLValidationRuntimePort", () => {
    const tissAdapter = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/tiss-runtime/adapters/default-tiss-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(tissAdapter, /getXMLValidationRuntimePort/);
    assert.match(tissAdapter, /usesXMLValidationRuntimePort/);
    assert.match(tissAdapter, /processedViaXMLValidationRuntimePort/);
    assert.equal(/new DefaultXMLValidationAdapter/.test(tissAdapter), false);
  });

  it("XML Runtime / Generation / Serializer / Schema modules não importam Validation Runtime", () => {
    for (const moduleName of [
      "xml-runtime",
      "xml-generation-runtime",
      "xml-serializer-runtime",
      "xml-schema-runtime",
    ]) {
      const moduleDir = join(repoRoot, "src/lib/enterprise", moduleName);
      for (const file of collectTsFiles(moduleDir)) {
        const source = readFileSync(file, "utf8");
        assert.equal(
          /xml-validation-runtime/.test(source),
          false,
          `${file} must not import xml-validation-runtime`,
        );
      }
    }
  });

  it("flags de fundação permanecem estruturais na cadeia", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const validation = runtime.getXMLValidationRuntimePort();
    const schema = runtime.getXMLSchemaRuntimePort();
    const serializer = runtime.getXMLSerializerRuntimePort();
    const serialized = await serializer.serialize({ documentId: "doc-flag-val" });
    const registered = await schema.register({
      documentId: "doc-flag-val",
      serializeResultId: serialized.result?.resultId,
    });
    const validated = await validation.validate({
      documentId: "doc-flag-val",
      schemaResultId: registered.result?.resultId,
      serializeResultId: serialized.result?.resultId,
    });
    assert.equal(validated.result?.validationExecuted, false);
    assert.equal(validated.result?.realValidationPerformed, false);
    assert.equal(validated.result?.officialXsdLoaded, false);
    assert.equal(validated.result?.validationEngineReady, true);

    const tiss = runtime.getTISSRuntimePort();
    const processed = await tiss.process({
      kind: "canonical-tiss-request",
      mode: "structural-process",
      metadata: {
        kind: "canonical-tiss-metadata",
        sessionId: "sess-flag-08",
      },
    });
    assert.equal(processed.ok, true);
    const session = await tiss.getSession({
      runtimeSessionId: processed.runtimeSessionId!,
    });
    assert.equal(session.session?.processedViaXMLValidationRuntimePort, true);
    const val = await validation.getResult({
      resultId: session.session!.xmlValidationResultId!,
    });
    assert.equal(val.result?.validationExecuted, false);
    assert.equal(val.result?.realValidationPerformed, false);
    assert.equal(val.result?.officialXsdLoaded, false);
    assert.equal(val.result?.officialAnsValidation, false);
    assert.equal(val.result?.officialTissValidation, false);
    assert.equal(val.result?.validationRulesLoaded, false);
    assert.equal(val.result?.validationEngineReady, true);
  });
});

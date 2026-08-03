#!/usr/bin/env node
/**
 * TISS-07 — Enterprise XML Schema Runtime
 * Prova: Application → XMLSchemaRuntimePort → Adapter → Factory → Registry → Store
 *         + XML Serializer Runtime + XML Generation Runtime + XML Runtime
 *         + TISS Runtime + Enterprise Runtime
 *         + Canonical XML Schema Request / Result
 *         + register / health / capabilities
 *         + ausência de XSD oficial / validação / XML TISS/ANS / bypass
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_XML_SCHEMA_RUNTIME_PROVIDER_COUNT,
  DEFAULT_XML_SCHEMA_ADAPTER_ID,
  DEFAULT_XML_SCHEMA_RUNTIME_CAPABILITIES,
  DefaultXMLSchemaAdapter,
  EnterpriseXMLSchemaAdapter,
  IN_MEMORY_XML_SCHEMA_RUNTIME_STORE_ID,
  InMemoryXMLSchemaRuntimeStore,
  MOCK_XML_SCHEMA_ADAPTER_ID,
  MockXMLSchemaAdapter,
  XMLSchemaRuntimeFactory,
  XMLSchemaRuntimeProvider,
  XMLSchemaRuntimeRegistry,
  createDefaultXMLSchemaRuntimeRegistry,
  createXMLSchemaRuntimeFactory,
  createXMLSchemaRuntimePort,
  getXMLSchemaRuntimeFactory,
  getXMLSchemaRuntimeHealthSummary,
  type XMLSchemaRuntimePort,
} from "../../../src/lib/enterprise/xml-schema-runtime/index.ts";
import { createXMLValidationRuntimePort } from "../../../src/lib/enterprise/xml-validation-runtime/index.ts";
import { createXMLSerializerRuntimePort } from "../../../src/lib/enterprise/xml-serializer-runtime/index.ts";
import { createXMLGenerationRuntimePort } from "../../../src/lib/enterprise/xml-generation-runtime/index.ts";
import { createTISSCatalogPort } from "../../../src/lib/enterprise/tiss-catalog/index.ts";
import { createRulePackEnginePort } from "../../../src/lib/enterprise/rule-pack-engine/index.ts";
import { createXMLRuntimePort } from "../../../src/lib/enterprise/xml-runtime/index.ts";
import { createTISSRuntimePort } from "../../../src/lib/enterprise/tiss-runtime/index.ts";
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

describe("TISS-07 XMLSchemaRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: XMLSchemaRuntimePort = new MockXMLSchemaAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.status, "ready");
    assert.equal(health.kind, "canonical-xml-schema-health");

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_XML_SCHEMA_ADAPTER_ID);
    assert.equal(caps.supportsCanonicalSchema, true);
    assert.equal(caps.implementsOfficialXsd, false);
    assert.equal(caps.implementsXsdValidation, false);
    assert.equal(caps.implementsRealTissXml, false);
    assert.equal(caps.implementsRealAnsXml, false);
    assert.equal(caps.implementsOperatorDispatch, false);
    assert.equal(caps.knowsOperatorOrCooperative, false);
    assert.equal(caps.knowsContract, false);
    assert.equal(caps.knowsTenant, false);
    assert.equal(caps.knowsTissPattern, false);
    assert.equal(caps.canonical.kind, "canonical-xml-schema-capabilities");
    assert.equal(caps.canonical.implementsOfficialXsd, false);
    assert.equal(caps.canonical.implementsXsdValidation, false);
  });

  it("DefaultXMLSchemaAdapter é o adapter enterprise oficial", () => {
    assert.equal(EnterpriseXMLSchemaAdapter, DefaultXMLSchemaAdapter);
    const port = new DefaultXMLSchemaAdapter({
      provider: "enterprise",
    });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_XML_SCHEMA_ADAPTER_ID);
  });

  it("createXMLSchemaRuntimePort / Provider default resolve enterprise", async () => {
    const port = createXMLSchemaRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(XMLSchemaRuntimeProvider.create().providerId, "enterprise");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("test / default / mock são resolvidos pelo factory", async () => {
    assert.equal(createXMLSchemaRuntimePort({ provider: "test" }).providerId, "test");
    assert.equal(createXMLSchemaRuntimePort({ provider: "default" }).providerId, "default");
    assert.equal(createXMLSchemaRuntimePort({ provider: "mock" }).providerId, "mock");
    assert.equal((await createXMLSchemaRuntimePort({ provider: "mock" }).health()).ok, true);
  });

  it("Canonical XML Schema Request / Result via Port (sem XSD / sem TISS/ANS)", async () => {
    const serializer = createXMLSerializerRuntimePort({ provider: "enterprise" });
    const serialized = await serializer.serialize({
      documentId: "doc-tiss-07",
      generationId: "xml-gen-tiss-07",
    });
    assert.equal(serialized.ok, true);

    const port = createXMLSchemaRuntimePort({ provider: "enterprise" });
    const registered = await port.register({
      serializeResultId: serialized.result?.resultId,
      generationResultId: serialized.result?.generationResultId,
      documentId: "doc-tiss-07",
      request: {
        kind: "canonical-xml-schema-request",
        serializeResultId: serialized.result?.resultId,
        documentId: "doc-tiss-07",
        metadata: {
          kind: "canonical-xml-schema-metadata",
          sessionId: "sess-xml-07",
          channel: "enterprise-test",
        },
        structuralNotes: "TISS-07 canonical XML schema only.",
      },
    });

    assert.equal(registered.ok, true);
    assert.equal(registered.result?.kind, "canonical-xml-schema-result");
    assert.equal(registered.result?.officialXsdLoaded, false);
    assert.equal(registered.result?.xsdValidationPerformed, false);
    assert.equal(registered.result?.realTissXmlValidated, false);
    assert.equal(registered.result?.realAnsXmlValidated, false);
    assert.equal(registered.schema?.kind, "canonical-xml-schema");
    assert.equal(registered.schema?.implementsOfficialXsd, false);
    assert.equal(registered.schema?.implementsAnsSchema, false);
    assert.equal(registered.schema?.implementsTissSchema, false);
    assert.equal(registered.telemetry.cancelled, false);

    const listed = await port.listResults();
    assert.equal(listed.ok, true);
    assert.ok(listed.results.length >= 1);
    assert.equal(listed.statistics?.kind, "canonical-xml-schema-statistics");
    assert.equal(listed.statistics?.officialXsdLoadedCount, 0);
    assert.equal(listed.statistics?.xsdValidationPerformedCount, 0);

    const loaded = await port.getResult({
      resultId: registered.result!.resultId,
    });
    assert.equal(loaded.ok, true);
    assert.equal(loaded.result?.resultId, registered.result?.resultId);
    assert.equal(loaded.result?.officialXsdLoaded, false);
    assert.equal(loaded.result?.xsdValidationPerformed, false);
  });

  it("InMemoryXMLSchemaRuntimeStore é o store oficial", () => {
    const store = new InMemoryXMLSchemaRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_XML_SCHEMA_RUNTIME_STORE_ID);
    assert.equal(store.resultCount(), 0);
    assert.equal(store.health().ok, true);
    assert.equal(store.statistics().officialXsdLoadedCount, 0);
    assert.equal(store.statistics().xsdValidationPerformedCount, 0);
  });

  it("retry recupera falha transitória", async () => {
    const port = new DefaultXMLSchemaAdapter({
      provider: "enterprise",
      failAttempts: 1,
      defaultRetryCount: 2,
      defaultRetryBackoffMs: 1,
    });
    const result = await port.register({
      documentId: "doc-retry",
      retryCount: 2,
    });
    assert.equal(result.ok, true);
    assert.ok(result.telemetry.attempts >= 2);
  });

  it("cancelamento via AbortSignal retorna XML_SCHEMA_RUNTIME_CANCELLED", async () => {
    const port = new DefaultXMLSchemaAdapter({
      provider: "enterprise",
    });
    const controller = new AbortController();
    controller.abort();
    const result = await port.register({ signal: controller.signal });
    assert.equal(result.ok, false);
    assert.equal(result.code, "XML_SCHEMA_RUNTIME_CANCELLED");
    assert.equal(result.telemetry.cancelled, true);
  });

  it("Registry e Factory seguem ECS-01 (sem fallback silencioso)", () => {
    const registry = createDefaultXMLSchemaRuntimeRegistry();
    assert.ok(registry instanceof XMLSchemaRuntimeRegistry);
    assert.equal(registry.snapshot().count, BUILTIN_XML_SCHEMA_RUNTIME_PROVIDER_COUNT);
    assert.equal(registry.has("enterprise"), true);

    const factory = createXMLSchemaRuntimeFactory({ registry });
    assert.ok(factory instanceof XMLSchemaRuntimeFactory);
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");

    assert.throws(
      () =>
        factory.create({
          // @ts-expect-error — provider inválido
          provider: "ans-xsd-schema",
        }),
      /não está registrado|desconhecido/,
    );

    assert.equal(getXMLSchemaRuntimeFactory().getRegistry().has("mock"), true);
    assert.equal(DEFAULT_XML_SCHEMA_RUNTIME_CAPABILITIES.implementsOfficialXsd, false);
    assert.equal(DEFAULT_XML_SCHEMA_RUNTIME_CAPABILITIES.implementsXsdValidation, false);
    assert.equal(DEFAULT_XML_SCHEMA_RUNTIME_CAPABILITIES.supportsCanonicalSchema, true);
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createXMLSchemaRuntimePort({ provider: "enterprise" });
    const summary = await getXMLSchemaRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.info.providerType, "XML_SCHEMA_RUNTIME");
    assert.equal(summary.capabilities.implementsOfficialXsd, false);
    assert.equal(summary.capabilities.implementsXsdValidation, false);
  });
});

describe("TISS-07 cadeia Enterprise / TISS / XML / Generation / Serializer / Schema", () => {
  it("Enterprise Runtime expõe XML Schema Runtime + cadeia XML", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    assert.equal(runtime.getXMLSchemaRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getXMLSerializerRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getXMLGenerationRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getXMLRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getTISSRuntimePort().providerId, "default");
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesXMLSchemaRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesXMLSerializerRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesXMLGenerationRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesXMLRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().implementsRealXml, false);

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.xmlSchemaRuntimeOk, true);
    assert.equal(health.xmlSerializerRuntimeOk, true);
    assert.equal(health.xmlGenerationRuntimeOk, true);
    assert.equal(health.xmlRuntimeOk, true);
    assert.equal(health.tissRuntimeOk, true);
  });

  it("fluxo oficial: TISS → XML → Generation → Serializer → Schema → Canonical Schema", async () => {
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
      },
    });

    const result = await tissRuntime.process({
      kind: "canonical-tiss-request",
      mode: "structural-process",
      metadata: {
        kind: "canonical-tiss-metadata",
        sessionId: "sess-tiss-07",
        correlationId: "corr-tiss-07",
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
    assert.ok(session.session?.xmlGenerationId);
    assert.ok(session.session?.xmlGenerationResultId);
    assert.ok(session.session?.xmlSerializeResultId);
    assert.ok(session.session?.xmlSchemaResultId);

    const serResult = await xmlSerializerRuntime.getResult({
      resultId: session.session!.xmlSerializeResultId!,
    });
    assert.equal(serResult.ok, true);
    assert.equal(serResult.result?.realTissXmlGenerated, false);

    const schResult = await xmlSchemaRuntime.getResult({
      resultId: session.session!.xmlSchemaResultId!,
    });
    assert.equal(schResult.ok, true);
    assert.equal(schResult.result?.officialXsdLoaded, false);
    assert.equal(schResult.result?.xsdValidationPerformed, false);
    assert.equal(schResult.result?.schema?.implementsOfficialXsd, false);
    assert.equal(schResult.result?.schema?.implementsAnsSchema, false);
    assert.equal(schResult.result?.schema?.implementsTissSchema, false);
  });

  it("TISS Runtime consome exclusivamente XMLSchemaRuntimePort (sem adapter paralelo)", async () => {
    const adapterSource = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/tiss-runtime/adapters/default-tiss-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(adapterSource, /getXMLSchemaRuntimePort/);
    assert.match(adapterSource, /canonical-xml-schema-request/);
    assert.equal(/new DefaultXMLSchemaAdapter/.test(adapterSource), false);
    assert.equal(/InMemoryXMLSchemaRuntimeStore/.test(adapterSource), false);
    assert.equal(/ansTISS/i.test(adapterSource), false);
    assert.equal(/\.xsd["']/.test(adapterSource), false);
  });
});

describe("TISS-07 auditoria — sem bypass / sem XSD / sem validação / sem XML TISS/ANS", () => {
  it("módulo xml-schema-runtime não contém backends / operadoras / XSD oficial / validação", () => {
    const moduleDir = join(repoRoot, "src/lib/enterprise/xml-schema-runtime");
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

  it("Enterprise Runtime wiring inclui createXMLSchemaRuntimePort", () => {
    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.match(enterpriseRuntime, /createXMLSchemaRuntimePort/);
    assert.match(enterpriseRuntime, /getXMLSchemaRuntimePort/);
    assert.match(enterpriseRuntime, /xmlSchemaRuntimeOk/);
  });

  it("TISS Runtime wiring inclui getXMLSchemaRuntimePort", () => {
    const tissAdapter = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/tiss-runtime/adapters/default-tiss-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(tissAdapter, /getXMLSchemaRuntimePort/);
    assert.match(tissAdapter, /usesXMLSchemaRuntimePort/);
    assert.match(tissAdapter, /processedViaXMLSchemaRuntimePort/);
    assert.equal(/new DefaultXMLSchemaAdapter/.test(tissAdapter), false);
  });

  it("XML Runtime / Generation / Serializer modules não importam Schema Runtime", () => {
    for (const moduleName of [
      "xml-runtime",
      "xml-generation-runtime",
      "xml-serializer-runtime",
    ]) {
      const moduleDir = join(repoRoot, "src/lib/enterprise", moduleName);
      for (const file of collectTsFiles(moduleDir)) {
        const source = readFileSync(file, "utf8");
        assert.equal(
          /xml-schema-runtime/.test(source),
          false,
          `${file} must not import xml-schema-runtime`,
        );
      }
    }
  });

  it("officialXsdLoaded / xsdValidationPerformed permanecem false na cadeia", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const schema = runtime.getXMLSchemaRuntimePort();
    const serializer = runtime.getXMLSerializerRuntimePort();
    const serialized = await serializer.serialize({ documentId: "doc-flag-sch" });
    const registered = await schema.register({
      documentId: "doc-flag-sch",
      serializeResultId: serialized.result?.resultId,
    });
    assert.equal(registered.result?.officialXsdLoaded, false);
    assert.equal(registered.result?.xsdValidationPerformed, false);

    const tiss = runtime.getTISSRuntimePort();
    const processed = await tiss.process({
      kind: "canonical-tiss-request",
      mode: "structural-process",
      metadata: {
        kind: "canonical-tiss-metadata",
        sessionId: "sess-flag-07",
      },
    });
    assert.equal(processed.ok, true);
    const session = await tiss.getSession({
      runtimeSessionId: processed.runtimeSessionId!,
    });
    assert.equal(session.session?.processedViaXMLSchemaRuntimePort, true);
    const sch = await schema.getResult({
      resultId: session.session!.xmlSchemaResultId!,
    });
    assert.equal(sch.result?.officialXsdLoaded, false);
    assert.equal(sch.result?.xsdValidationPerformed, false);
    assert.equal(sch.result?.realTissXmlValidated, false);
    assert.equal(sch.result?.realAnsXmlValidated, false);
  });
});

#!/usr/bin/env node
/**
 * TISS-10 — Enterprise Namespace Runtime
 * Prova: Application → NamespaceRuntimePort → Adapter → Factory → Registry → Store
 *         + XSD Runtime + XML Validation Runtime + XML Schema Runtime
 *         + XML Serializer Runtime + XML Generation Runtime + XML Runtime
 *         + TISS Runtime + Enterprise Runtime
 *         + Canonical Namespace Runtime Request / Result
 *         + prepare / health / capabilities
 *         + ausência de namespace oficial / ANS/TISS / XML TISS/ANS / bypass
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_NAMESPACE_RUNTIME_PROVIDER_COUNT,
  DEFAULT_NAMESPACE_RUNTIME_ADAPTER_ID,
  DEFAULT_NAMESPACE_RUNTIME_CAPABILITIES,
  DefaultNamespaceRuntimeAdapter,
  EnterpriseNamespaceRuntimeAdapter,
  IN_MEMORY_NAMESPACE_RUNTIME_STORE_ID,
  InMemoryNamespaceRuntimeStore,
  MOCK_NAMESPACE_RUNTIME_ADAPTER_ID,
  MockNamespaceRuntimeAdapter,
  NamespaceRuntimeFactory,
  NamespaceRuntimeProvider,
  NamespaceRuntimeRegistry,
  createDefaultNamespaceRuntimeRegistry,
  createNamespaceRuntimeFactory,
  createNamespaceRuntimePort,
  getNamespaceRuntimeFactory,
  getNamespaceRuntimeHealthSummary,
  type NamespaceRuntimePort,
} from "../../../src/lib/enterprise/namespace-runtime/index.ts";
import { createXSDRuntimePort } from "../../../src/lib/enterprise/xsd-runtime/index.ts";
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

describe("TISS-10 NamespaceRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: NamespaceRuntimePort = new MockNamespaceRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.status, "ready");
    assert.equal(health.kind, "canonical-namespace-health");
    assert.equal(health.runtimeReady, true);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_NAMESPACE_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsCanonicalNamespace, true);
    assert.equal(caps.runtimeReady, true);
    assert.equal(caps.officialNamespacesLoaded, false);
    assert.equal(caps.realNamespacesLoaded, false);
    assert.equal(caps.namespaceResolutionEnabled, false);
    assert.equal(caps.namespaceValidationEnabled, false);
    assert.equal(caps.officialAnsNamespacesLoaded, false);
    assert.equal(caps.officialTissNamespacesLoaded, false);
    assert.equal(caps.implementsOfficialNamespaces, false);
    assert.equal(caps.implementsNamespaceValidation, false);
    assert.equal(caps.implementsRealNamespaceResolution, false);
    assert.equal(caps.implementsOperatorDispatch, false);
    assert.equal(caps.knowsOperatorOrCooperative, false);
    assert.equal(caps.knowsContract, false);
    assert.equal(caps.knowsTenant, false);
    assert.equal(caps.knowsTissPattern, false);
    assert.equal(caps.canonical.kind, "canonical-namespace-capabilities");
    assert.equal(caps.canonical.runtimeReady, true);
    assert.equal(caps.canonical.officialNamespacesLoaded, false);
  });

  it("DefaultNamespaceRuntimeAdapter é o adapter enterprise oficial", () => {
    assert.equal(EnterpriseNamespaceRuntimeAdapter, DefaultNamespaceRuntimeAdapter);
    const port = new DefaultNamespaceRuntimeAdapter({
      provider: "enterprise",
    });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_NAMESPACE_RUNTIME_ADAPTER_ID);
  });

  it("provider default resolve enterprise", () => {
    const port = createNamespaceRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(NamespaceRuntimeProvider.create().providerId, "enterprise");
  });

  it("factory resolve mock / test / default / enterprise", () => {
    const factory = createNamespaceRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(
      getNamespaceRuntimeFactory().getRegistry().list().length,
      BUILTIN_NAMESPACE_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("prepare → get → list com flags estruturais obrigatórias", async () => {
    const xsd = createXSDRuntimePort({ provider: "enterprise" });
    const validation = createXMLValidationRuntimePort({ provider: "enterprise" });
    const schema = createXMLSchemaRuntimePort({ provider: "enterprise" });
    const serializer = createXMLSerializerRuntimePort({ provider: "enterprise" });
    const serialized = await serializer.serialize({ documentId: "doc-ns-01" });
    const registered = await schema.register({
      documentId: "doc-ns-01",
      serializeResultId: serialized.result?.resultId,
    });
    const validated = await validation.validate({
      documentId: "doc-ns-01",
      schemaResultId: registered.result?.resultId,
      serializeResultId: serialized.result?.resultId,
    });
    const preparedXsd = await xsd.prepare({
      documentId: "doc-ns-01",
      validationResultId: validated.result?.resultId,
      schemaResultId: registered.result?.resultId,
      serializeResultId: serialized.result?.resultId,
    });

    const port = createNamespaceRuntimePort({ provider: "enterprise" });
    const prepared = await port.prepare({
      documentId: "doc-ns-01",
      xsdResultId: preparedXsd.result?.resultId,
      validationResultId: validated.result?.resultId,
      schemaResultId: registered.result?.resultId,
      serializeResultId: serialized.result?.resultId,
      request: {
        kind: "canonical-namespace-runtime-request",
        name: "Foundation Namespace",
        structuralNotes: "TISS-10 structural only",
      },
    });

    assert.equal(prepared.ok, true);
    assert.ok(prepared.result?.resultId);
    assert.equal(prepared.result?.officialNamespacesLoaded, false);
    assert.equal(prepared.result?.realNamespacesLoaded, false);
    assert.equal(prepared.result?.namespaceResolutionEnabled, false);
    assert.equal(prepared.result?.namespaceValidationEnabled, false);
    assert.equal(prepared.result?.officialAnsNamespacesLoaded, false);
    assert.equal(prepared.result?.officialTissNamespacesLoaded, false);
    assert.equal(prepared.result?.runtimeReady, true);
    assert.equal(prepared.result?.status, "prepared");
    assert.equal(prepared.result?.definition?.kind, "canonical-namespace-definition");

    const loaded = await port.getResult({ resultId: prepared.result!.resultId });
    assert.equal(loaded.ok, true);
    assert.equal(loaded.result?.resultId, prepared.result!.resultId);

    const listed = await port.listResults();
    assert.equal(listed.ok, true);
    assert.ok(listed.results.length >= 1);
    assert.equal(listed.statistics?.officialNamespacesLoadedCount, 0);
    assert.equal(listed.statistics?.realNamespacesLoadedCount, 0);
    assert.equal(listed.statistics?.namespaceResolutionEnabledCount, 0);
    assert.equal(listed.statistics?.officialAnsNamespacesLoadedCount, 0);
    assert.equal(listed.statistics?.officialTissNamespacesLoadedCount, 0);
  });

  it("InMemory store oficial e estatísticas zeradas para namespace real", () => {
    const store = new InMemoryNamespaceRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_NAMESPACE_RUNTIME_STORE_ID);
    const stats = store.statistics();
    assert.equal(stats.kind, "canonical-namespace-statistics");
    assert.equal(stats.officialNamespacesLoadedCount, 0);
    assert.equal(stats.realNamespacesLoadedCount, 0);
    assert.equal(stats.officialAnsNamespacesLoadedCount, 0);
    assert.equal(stats.namespaceValidationEnabledCount, 0);
    assert.equal(DEFAULT_NAMESPACE_RUNTIME_CAPABILITIES.runtimeReady, true);
    assert.equal(DEFAULT_NAMESPACE_RUNTIME_CAPABILITIES.officialNamespacesLoaded, false);
  });

  it("retry recupera falha transitória", async () => {
    const port = new DefaultNamespaceRuntimeAdapter({
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
    const port = createNamespaceRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.prepare({
      documentId: "doc-abort",
      signal: controller.signal,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "NAMESPACE_RUNTIME_CANCELLED");
  });

  it("registry/factory sem fallback silencioso", () => {
    const registry = createDefaultNamespaceRuntimeRegistry();
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.snapshot().count, BUILTIN_NAMESPACE_RUNTIME_PROVIDER_COUNT);
    assert.ok(registry instanceof NamespaceRuntimeRegistry);

    const factory = new NamespaceRuntimeFactory({ registry });
    assert.throws(() => factory.create({ provider: "unknown" as never }), /não está registrado/);
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createNamespaceRuntimePort({ provider: "enterprise" });
    const summary = await getNamespaceRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.info.providerType, "NAMESPACE_RUNTIME");
    assert.equal(summary.capabilities.runtimeReady, true);
    assert.equal(summary.capabilities.officialNamespacesLoaded, false);
    assert.equal(summary.capabilities.namespaceResolutionEnabled, false);
  });
});

describe("TISS-10 cadeia Enterprise / TISS / XML / … / XSD / Namespace", () => {
  it("Enterprise Runtime expõe Namespace Runtime + cadeia XML/XSD", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    assert.equal(runtime.getNamespaceRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getXSDRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getXMLValidationRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getXMLSchemaRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getXMLSerializerRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getXMLGenerationRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getXMLRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getTISSRuntimePort().providerId, "default");
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesNamespaceRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesXSDRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesXMLValidationRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesXMLSchemaRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesXMLSerializerRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesXMLGenerationRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesXMLRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().implementsRealXml, false);

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.namespaceRuntimeOk, true);
    assert.equal(health.xsdRuntimeOk, true);
    assert.equal(health.xmlValidationRuntimeOk, true);
    assert.equal(health.xmlSchemaRuntimeOk, true);
    assert.equal(health.xmlSerializerRuntimeOk, true);
    assert.equal(health.xmlGenerationRuntimeOk, true);
    assert.equal(health.xmlRuntimeOk, true);
    assert.equal(health.tissRuntimeOk, true);
  });

  it("fluxo oficial: TISS → XML → … → Validation → XSD → Namespace", async () => {
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
        sessionId: "sess-tiss-10",
        correlationId: "corr-tiss-10",
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
    assert.equal(session.session?.processedViaNamespaceRuntimePort, true);
    assert.ok(session.session?.xmlGenerationId);
    assert.ok(session.session?.xmlGenerationResultId);
    assert.ok(session.session?.xmlSerializeResultId);
    assert.ok(session.session?.xmlSchemaResultId);
    assert.ok(session.session?.xmlValidationResultId);
    assert.ok(session.session?.xsdResultId);
    assert.ok(session.session?.namespaceResultId);

    const nsResult = await namespaceRuntime.getResult({
      resultId: session.session!.namespaceResultId!,
    });
    assert.equal(nsResult.ok, true);
    assert.equal(nsResult.result?.officialNamespacesLoaded, false);
    assert.equal(nsResult.result?.realNamespacesLoaded, false);
    assert.equal(nsResult.result?.namespaceResolutionEnabled, false);
    assert.equal(nsResult.result?.namespaceValidationEnabled, false);
    assert.equal(nsResult.result?.officialAnsNamespacesLoaded, false);
    assert.equal(nsResult.result?.officialTissNamespacesLoaded, false);
    assert.equal(nsResult.result?.runtimeReady, true);
  });

  it("TISS Runtime consome exclusivamente NamespaceRuntimePort (sem adapter paralelo)", async () => {
    const adapterSource = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/tiss-runtime/adapters/default-tiss-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(adapterSource, /getNamespaceRuntimePort/);
    assert.match(adapterSource, /canonical-namespace-runtime-request/);
    assert.equal(/new DefaultNamespaceRuntimeAdapter/.test(adapterSource), false);
    assert.equal(/InMemoryNamespaceRuntimeStore/.test(adapterSource), false);
    assert.equal(/ansTISS/i.test(adapterSource), false);
    assert.equal(/xmlns:ans/i.test(adapterSource), false);
  });
});

describe("TISS-10 auditoria — sem bypass / sem namespace oficial / sem XML TISS/ANS", () => {
  it("módulo namespace-runtime não contém backends / operadoras / namespaces oficiais", () => {
    const moduleDir = join(repoRoot, "src/lib/enterprise/namespace-runtime");
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

  it("Enterprise Runtime wiring inclui createNamespaceRuntimePort", () => {
    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.match(enterpriseRuntime, /createNamespaceRuntimePort/);
    assert.match(enterpriseRuntime, /getNamespaceRuntimePort/);
    assert.match(enterpriseRuntime, /namespaceRuntimeOk/);
  });

  it("TISS Runtime wiring inclui getNamespaceRuntimePort", () => {
    const tissAdapter = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/tiss-runtime/adapters/default-tiss-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(tissAdapter, /getNamespaceRuntimePort/);
    assert.match(tissAdapter, /usesNamespaceRuntimePort/);
    assert.match(tissAdapter, /processedViaNamespaceRuntimePort/);
    assert.equal(/new DefaultNamespaceRuntimeAdapter/.test(tissAdapter), false);
  });

  it("XML Runtime / Generation / Serializer / Schema / Validation / XSD modules não importam Namespace Runtime", () => {
    for (const moduleName of [
      "xml-runtime",
      "xml-generation-runtime",
      "xml-serializer-runtime",
      "xml-schema-runtime",
      "xml-validation-runtime",
      "xsd-runtime",
    ]) {
      const moduleDir = join(repoRoot, "src/lib/enterprise", moduleName);
      for (const file of collectTsFiles(moduleDir)) {
        const source = readFileSync(file, "utf8");
        assert.equal(
          /namespace-runtime/.test(source),
          false,
          `${file} must not import namespace-runtime`,
        );
      }
    }
  });

  it("flags de fundação permanecem estruturais na cadeia", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const ns = runtime.getNamespaceRuntimePort();
    const xsd = runtime.getXSDRuntimePort();
    const validation = runtime.getXMLValidationRuntimePort();
    const schema = runtime.getXMLSchemaRuntimePort();
    const serializer = runtime.getXMLSerializerRuntimePort();
    const serialized = await serializer.serialize({ documentId: "doc-flag-ns" });
    const registered = await schema.register({
      documentId: "doc-flag-ns",
      serializeResultId: serialized.result?.resultId,
    });
    const validated = await validation.validate({
      documentId: "doc-flag-ns",
      schemaResultId: registered.result?.resultId,
      serializeResultId: serialized.result?.resultId,
    });
    const preparedXsd = await xsd.prepare({
      documentId: "doc-flag-ns",
      validationResultId: validated.result?.resultId,
      schemaResultId: registered.result?.resultId,
      serializeResultId: serialized.result?.resultId,
    });
    const prepared = await ns.prepare({
      documentId: "doc-flag-ns",
      xsdResultId: preparedXsd.result?.resultId,
      validationResultId: validated.result?.resultId,
      schemaResultId: registered.result?.resultId,
      serializeResultId: serialized.result?.resultId,
    });
    assert.equal(prepared.result?.officialNamespacesLoaded, false);
    assert.equal(prepared.result?.realNamespacesLoaded, false);
    assert.equal(prepared.result?.namespaceResolutionEnabled, false);
    assert.equal(prepared.result?.runtimeReady, true);

    const tiss = runtime.getTISSRuntimePort();
    const processed = await tiss.process({
      kind: "canonical-tiss-request",
      mode: "structural-process",
      metadata: {
        kind: "canonical-tiss-metadata",
        sessionId: "sess-flag-10",
      },
    });
    assert.equal(processed.ok, true);
    const session = await tiss.getSession({
      runtimeSessionId: processed.runtimeSessionId!,
    });
    assert.equal(session.session?.processedViaNamespaceRuntimePort, true);
    assert.equal(session.session?.processedViaXSDRuntimePort, true);
    const nsLoaded = await ns.getResult({
      resultId: session.session!.namespaceResultId!,
    });
    assert.equal(nsLoaded.result?.officialNamespacesLoaded, false);
    assert.equal(nsLoaded.result?.realNamespacesLoaded, false);
    assert.equal(nsLoaded.result?.namespaceResolutionEnabled, false);
    assert.equal(nsLoaded.result?.namespaceValidationEnabled, false);
    assert.equal(nsLoaded.result?.officialAnsNamespacesLoaded, false);
    assert.equal(nsLoaded.result?.officialTissNamespacesLoaded, false);
    assert.equal(nsLoaded.result?.runtimeReady, true);
  });
});

#!/usr/bin/env node
/**
 * TISS-04 — Enterprise XML Runtime Foundation
 * Prova: Application → XMLRuntimePort → Adapter → Factory → Registry → Store
 *         + TISSCatalogPort + RulePackEnginePort (consumo exclusivo)
 *         + TISS Runtime + Enterprise Runtime
 *         + Modelos Canônicos / Resultado Canônico
 *         + generate / validate / cancel / health
 *         + ausência de geração XML real / bypass / lógica específica
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_XML_RUNTIME_PROVIDER_COUNT,
  DEFAULT_XML_RUNTIME_ADAPTER_ID,
  DEFAULT_XML_RUNTIME_CAPABILITIES,
  DefaultXMLRuntimeAdapter,
  EnterpriseXMLRuntimeAdapter,
  IN_MEMORY_XML_RUNTIME_STORE_ID,
  InMemoryXMLRuntimeStore,
  MOCK_XML_RUNTIME_ADAPTER_ID,
  MockXMLRuntimeAdapter,
  XMLRuntimeFactory,
  XMLRuntimeProvider,
  XMLRuntimeRegistry,
  createDefaultXMLRuntimeRegistry,
  createXMLRuntimeFactory,
  createXMLRuntimePort,
  getXMLRuntimeFactory,
  getXMLRuntimeHealthSummary,
  type XMLRuntimePort,
} from "../../../src/lib/enterprise/xml-runtime/index.ts";
import { createTISSCatalogPort } from "../../../src/lib/enterprise/tiss-catalog/index.ts";
import { createRulePackEnginePort } from "../../../src/lib/enterprise/rule-pack-engine/index.ts";
import { createXMLGenerationRuntimePort } from "../../../src/lib/enterprise/xml-generation-runtime/index.ts";
import { createXMLSerializerRuntimePort } from "../../../src/lib/enterprise/xml-serializer-runtime/index.ts";
import { createXMLSchemaRuntimePort } from "../../../src/lib/enterprise/xml-schema-runtime/index.ts";
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

function withEnterpriseDeps(portProvider: "enterprise" | "mock" = "enterprise") {
  const catalog = createTISSCatalogPort({ provider: portProvider });
  const rulePackEngine = createRulePackEnginePort({
    provider: portProvider,
    enterpriseDeps: { getTISSCatalogPort: () => catalog },
  });
  const xmlGenerationRuntime = createXMLGenerationRuntimePort({ provider: portProvider });
  return {
    catalog,
    rulePackEngine,
    xmlGenerationRuntime,
    enterpriseDeps: {
      getTISSCatalogPort: () => catalog,
      getRulePackEnginePort: () => rulePackEngine,
      getXMLGenerationRuntimePort: () => xmlGenerationRuntime,
    },
  };
}

describe("TISS-04 XMLRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const { enterpriseDeps } = withEnterpriseDeps("mock");
    const port: XMLRuntimePort = new MockXMLRuntimeAdapter({
      provider: "mock",
      enterpriseDeps,
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.status, "ready");
    assert.equal(health.kind, "canonical-xml-provider-health");
    assert.equal(health.tissCatalogOk, true);
    assert.equal(health.rulePackEngineOk, true);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_XML_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsCanonicalResult, true);
    assert.equal(caps.consumesTISSCatalogPort, true);
    assert.equal(caps.consumesRulePackEnginePort, true);
    assert.equal(caps.consumesXMLGenerationRuntimePort, true);
    assert.equal(caps.implementsRealXml, false);
    assert.equal(caps.implementsOperatorDispatch, false);
    assert.equal(caps.knowsOperatorOrCooperative, false);
    assert.equal(caps.knowsContract, false);
    assert.equal(caps.knowsTenant, false);
    assert.equal(caps.canonical.kind, "canonical-xml-provider-capabilities");
    assert.equal(caps.canonical.implementsRealXml, false);
  });

  it("DefaultXMLRuntimeAdapter é o adapter enterprise oficial", () => {
    assert.equal(EnterpriseXMLRuntimeAdapter, DefaultXMLRuntimeAdapter);
    const { enterpriseDeps } = withEnterpriseDeps();
    const port = new DefaultXMLRuntimeAdapter({
      provider: "enterprise",
      enterpriseDeps,
    });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_XML_RUNTIME_ADAPTER_ID);
  });

  it("createXMLRuntimePort / XMLRuntimeProvider default resolve enterprise", async () => {
    const port = createXMLRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(XMLRuntimeProvider.create().providerId, "enterprise");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("test / default / mock são resolvidos pelo factory", async () => {
    assert.equal(createXMLRuntimePort({ provider: "test" }).providerId, "test");
    assert.equal(createXMLRuntimePort({ provider: "default" }).providerId, "default");
    assert.equal(createXMLRuntimePort({ provider: "mock" }).providerId, "mock");
    assert.equal((await createXMLRuntimePort({ provider: "mock" }).health()).ok, true);
  });

  it("modelos canônicos e resultado canônico via Port (sem XML real)", async () => {
    const { enterpriseDeps } = withEnterpriseDeps();
    const port = createXMLRuntimePort({ provider: "enterprise", enterpriseDeps });

    const generated = await port.generate({
      documentId: "doc-tiss-04",
      request: {
        kind: "canonical-xml-request",
        documentId: "doc-tiss-04",
        metadata: {
          kind: "canonical-xml-metadata",
          sessionId: "sess-xml-04",
          channel: "enterprise-test",
        },
        configuration: {
          kind: "canonical-xml-runtime-configuration",
          mode: "foundation",
        },
      },
    });

    assert.equal(generated.ok, true);
    assert.equal(generated.generation?.kind, "canonical-xml-generation");
    assert.equal(generated.result?.kind, "canonical-xml-result");
    assert.equal(generated.result?.realXmlGenerated, false);
    assert.equal(generated.generation?.realXmlGenerated, false);
    assert.equal(generated.result?.catalogConsumed, true);
    assert.equal(generated.result?.rulePackConsumed, true);
    assert.equal(generated.result?.xmlGenerationRuntimeConsumed, true);
    assert.equal(generated.result?.canonicalStructure?.kind, "canonical-xml-structure");
    assert.equal(generated.result?.canonicalStructure?.realXmlGenerated, false);
    assert.equal(generated.telemetry.cancelled, false);

    // Sem payload XML real no resultado canônico.
    const resultJson = JSON.stringify(generated.result);
    assert.equal(/<\?xml/i.test(resultJson), false);
    assert.equal(/<ansTISS/i.test(resultJson), false);
    assert.equal(/DOMParser|XMLSerializer|XMLWriter/.test(resultJson), false);

    const validated = await port.validate({
      generationId: generated.generation!.generationId,
    });
    assert.equal(validated.ok, true);
    assert.equal(validated.valid, true);
    assert.equal(validated.result?.status, "validated");

    const listed = await port.listGenerations();
    assert.equal(listed.ok, true);
    assert.ok(listed.generations.length >= 1);
    assert.equal(listed.statistics?.kind, "canonical-xml-statistics");
    assert.equal(listed.statistics?.realXmlGeneratedCount, 0);

    const loaded = await port.getGeneration({
      generationId: generated.generation!.generationId,
    });
    assert.equal(loaded.ok, true);
    assert.equal(loaded.generation?.generationId, generated.generation?.generationId);
  });

  it("InMemoryXMLRuntimeStore é o XML Store oficial", () => {
    const store = new InMemoryXMLRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_XML_RUNTIME_STORE_ID);
    assert.equal(store.generationCount(), 0);
    assert.equal(store.health().ok, true);
    assert.equal(store.statistics().realXmlGeneratedCount, 0);
  });

  it("retry recupera falha transitória", async () => {
    const { enterpriseDeps } = withEnterpriseDeps();
    const port = new DefaultXMLRuntimeAdapter({
      provider: "enterprise",
      enterpriseDeps,
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

  it("cancelamento via AbortSignal retorna XML_RUNTIME_CANCELLED", async () => {
    const { enterpriseDeps } = withEnterpriseDeps();
    const port = new DefaultXMLRuntimeAdapter({
      provider: "enterprise",
      enterpriseDeps,
    });
    const controller = new AbortController();
    controller.abort();
    const result = await port.generate({ signal: controller.signal });
    assert.equal(result.ok, false);
    assert.equal(result.code, "XML_RUNTIME_CANCELLED");
    assert.equal(result.telemetry.cancelled, true);
  });

  it("cancel() marca geração canônica como cancelled", async () => {
    const { enterpriseDeps } = withEnterpriseDeps();
    const port = createXMLRuntimePort({ provider: "enterprise", enterpriseDeps });
    const generated = await port.generate({ documentId: "doc-cancel" });
    assert.equal(generated.ok, true);

    const cancelled = await port.cancel({
      generationId: generated.generation!.generationId,
    });
    assert.equal(cancelled.ok, true);
    assert.equal(cancelled.generation?.status, "cancelled");
    assert.equal(cancelled.generation?.realXmlGenerated, false);
  });

  it("Registry e Factory seguem ECS-01 (sem fallback silencioso)", () => {
    const registry = createDefaultXMLRuntimeRegistry();
    assert.ok(registry instanceof XMLRuntimeRegistry);
    assert.equal(registry.snapshot().count, BUILTIN_XML_RUNTIME_PROVIDER_COUNT);
    assert.equal(registry.has("enterprise"), true);

    const factory = createXMLRuntimeFactory({ registry });
    assert.ok(factory instanceof XMLRuntimeFactory);
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");

    assert.throws(
      () =>
        factory.create({
          // @ts-expect-error — provider inválido
          provider: "unimed-xml",
        }),
      /não está registrado|desconhecido/,
    );

    assert.equal(getXMLRuntimeFactory().getRegistry().has("mock"), true);
    assert.equal(DEFAULT_XML_RUNTIME_CAPABILITIES.consumesTISSCatalogPort, true);
    assert.equal(DEFAULT_XML_RUNTIME_CAPABILITIES.consumesRulePackEnginePort, true);
    assert.equal(DEFAULT_XML_RUNTIME_CAPABILITIES.implementsRealXml, false);
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createXMLRuntimePort({ provider: "enterprise" });
    const summary = await getXMLRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.info.providerType, "XML_RUNTIME");
    assert.equal(summary.capabilities.implementsRealXml, false);
  });

  it("exige TISSCatalogPort + RulePackEnginePort + XMLGenerationRuntimePort — sem bypass", () => {
    assert.throws(
      () =>
        new DefaultXMLRuntimeAdapter({
          provider: "enterprise",
          // @ts-expect-error — deps obrigatórias
          enterpriseDeps: {},
        }),
      /getTISSCatalogPort|getRulePackEnginePort|getXMLGenerationRuntimePort/,
    );
  });
});

describe("TISS-04 cadeia Enterprise / TISS Runtime / XML Runtime", () => {
  it("Enterprise Runtime expõe XML Runtime + Rule Pack + Catalog + TISS Runtime", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    assert.equal(runtime.getXMLRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getRulePackEnginePort().providerId, "enterprise");
    assert.equal(runtime.getTISSCatalogPort().providerId, "enterprise");
    assert.equal(runtime.getTISSProviderPort().providerId, "enterprise");
    assert.equal(runtime.getTISSRuntimePort().providerId, "default");
    assert.equal(runtime.getXMLGenerationRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesXMLRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesXMLGenerationRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesRulePackEnginePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesTISSCatalogPort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().implementsRealXml, false);

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.xmlRuntimeOk, true);
    assert.equal(health.xmlGenerationRuntimeOk, true);
    assert.equal(health.rulePackEngineOk, true);
    assert.equal(health.tissCatalogOk, true);
    assert.equal(health.tissProviderOk, true);
    assert.equal(health.tissRuntimeOk, true);
  });

  it("fluxo: Runtime → TISS Runtime → XMLRuntimePort → XMLGenerationRuntimePort → Canonical Result (sem XML real)", async () => {
    const orchestrator = createCanonicalExecutionOrchestratorPort({ provider: "mock" });
    const tissProvider = createTISSProviderPort({ provider: "enterprise" });
    const { catalog, rulePackEngine, xmlGenerationRuntime, enterpriseDeps } = withEnterpriseDeps();
    const xmlSerializerRuntime = createXMLSerializerRuntimePort({ provider: "enterprise" });
    const xmlSchemaRuntime = createXMLSchemaRuntimePort({ provider: "enterprise" });
    const xmlRuntime = createXMLRuntimePort({
      provider: "enterprise",
      enterpriseDeps,
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
      },
    });

    const result = await tissRuntime.process({
      kind: "canonical-tiss-request",
      mode: "structural-process",
      metadata: {
        kind: "canonical-tiss-metadata",
        sessionId: "sess-tiss-04",
        correlationId: "corr-tiss-04",
      },
    });

    assert.equal(result.ok, true);
    assert.ok(result.runtimeSessionId);
    assert.equal(result.realTissExecuted, false);

    const session = await tissRuntime.getSession({
      runtimeSessionId: result.runtimeSessionId!,
    });
    assert.equal(session.ok, true);
    assert.equal(session.session?.processedViaTISSCatalogPort, true);
    assert.equal(session.session?.processedViaRulePackEnginePort, true);
    assert.equal(session.session?.processedViaXMLRuntimePort, true);
    assert.equal(session.session?.processedViaXMLGenerationRuntimePort, true);
    assert.ok(session.session?.xmlGenerationId);
    assert.ok(session.session?.xmlGenerationResultId);
    assert.equal(session.session?.realTissExecuted, false);

    const generation = await xmlRuntime.getGeneration({
      generationId: session.session!.xmlGenerationId!,
    });
    assert.equal(generation.ok, true);
    assert.equal(generation.generation?.realXmlGenerated, false);
    assert.equal(generation.generation?.xmlGenerationRuntimeConsumed, true);
    assert.equal(generation.generation?.canonicalStructure?.root, "CanonicalXML");
  });

  it("consumo exclusivo via Catalog + RulePackEngine + XMLGenerationRuntime Ports (não acessa stores)", async () => {
    const adapterSource = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/xml-runtime/adapters/default-xml-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(adapterSource, /getTISSCatalogPort/);
    assert.match(adapterSource, /getRulePackEnginePort/);
    assert.match(adapterSource, /getXMLGenerationRuntimePort/);
    assert.match(adapterSource, /\.getCatalog\(/);
    assert.match(adapterSource, /\.executePack\(/);
    assert.equal(/InMemoryTISSCatalog/.test(adapterSource), false);
    assert.equal(/InMemoryRulePackEngineStore/.test(adapterSource), false);
    assert.equal(/InMemoryXMLGenerationRuntimeStore/.test(adapterSource), false);
    assert.equal(/new DefaultTISSCatalogAdapter/.test(adapterSource), false);
    assert.equal(/new DefaultRulePackEngineAdapter/.test(adapterSource), false);
    assert.equal(/new DefaultXMLGenerationAdapter/.test(adapterSource), false);
    assert.equal(/TUSS_CATALOG/.test(adapterSource), false);
    assert.equal(/tuss_procedures/.test(adapterSource), false);
    assert.equal(/DOMParser|XMLSerializer|XMLWriter|createElementNS/.test(adapterSource), false);
  });
});

describe("TISS-04 auditoria — sem bypass / sem lógica de operadora/contrato/tenant / sem XML real", () => {
  it("módulo xml-runtime não contém backends / operadoras / XML dispatch real", () => {
    const moduleDir = join(repoRoot, "src/lib/enterprise/xml-runtime");
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

  it("não existe if/switch por operadora/versão/contrato/tenant no xml-runtime", () => {
    const moduleDir = join(repoRoot, "src/lib/enterprise/xml-runtime");
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
        /if\s*\(\s*vers[aã]o/i.test(codeWithoutComments),
        false,
        `if(versao) em ${file}`,
      );
      assert.equal(
        /switch\s*\(\s*vers[aã]o/i.test(codeWithoutComments),
        false,
        `switch(versao) em ${file}`,
      );
      assert.equal(
        /if\s*\(\s*contrato/i.test(codeWithoutComments),
        false,
        `if(contrato) em ${file}`,
      );
      assert.equal(/if\s*\(\s*tenant/i.test(codeWithoutComments), false, `if(tenant) em ${file}`);
    }
  });

  it("Enterprise Runtime / TISS Runtime usam exclusivamente XMLRuntimePort", () => {
    const runtimeAdapter = readFileSync(
      join(repoRoot, "src/lib/enterprise/tiss-runtime/adapters/default-tiss-runtime-adapter.ts"),
      "utf8",
    );
    assert.match(runtimeAdapter, /getXMLRuntimePort/);
    assert.match(runtimeAdapter, /\.generate\(/);
    assert.equal(/InMemoryXMLRuntimeStore/.test(runtimeAdapter), false);
    assert.equal(/new DefaultXMLRuntimeAdapter/.test(runtimeAdapter), false);
    assert.equal(/createXMLRuntimePort/.test(runtimeAdapter), false);

    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.match(enterpriseRuntime, /createXMLRuntimePort/);
    assert.match(enterpriseRuntime, /getXMLRuntimePort/);
  });

  it("não existe XMLRuntime paralelo fora de xml-runtime", () => {
    const enterpriseRoot = join(repoRoot, "src/lib/enterprise");
    const offenders: string[] = [];
    for (const file of collectTsFiles(enterpriseRoot)) {
      if (file.includes(`${join("xml-runtime")}`)) continue;
      const source = readFileSync(file, "utf8");
      if (/class\s+DefaultXMLRuntimeAdapter\b/.test(source)) offenders.push(file);
      if (/class\s+InMemoryXMLRuntimeStore\b/.test(source)) offenders.push(file);
      if (/interface\s+XMLRuntimePort\b/.test(source) && !file.includes("xml-runtime")) {
        offenders.push(file);
      }
    }
    assert.deepEqual(offenders, []);
  });

  it("produto Capture não importa xml-runtime store/adapters diretamente", () => {
    const captureRoot = join(repoRoot, "src/lib/capture");
    if (!statSync(captureRoot, { throwIfNoEntry: false })?.isDirectory()) return;
    for (const file of collectTsFiles(captureRoot)) {
      const source = readFileSync(file, "utf8");
      assert.equal(
        /from ["'].*xml-runtime\/(store|adapters)/.test(source),
        false,
        `bypass store/adapter em ${file}`,
      );
      assert.equal(
        /InMemoryXMLRuntimeStore|DefaultXMLRuntimeAdapter/.test(source),
        false,
        `acesso direto em ${file}`,
      );
    }
  });
});

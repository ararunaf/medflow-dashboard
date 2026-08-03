#!/usr/bin/env node
/**
 * TISS-02 — Enterprise TISS Canonical Catalog
 * Prova: Application → TISSCatalogPort → Adapter → Factory → Registry → Store
 *         + TISS Runtime + Enterprise Runtime
 *         + Modelos Canônicos / Catálogo
 *         + timeout / retry / cancelamento / erros
 *         + ausência de bypass / lógica específica de operadora/versão
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_TISS_CATALOG_PROVIDER_COUNT,
  DEFAULT_TISS_CATALOG_ADAPTER_ID,
  DEFAULT_TISS_CATALOG_CAPABILITIES,
  DEFAULT_TISS_CATALOG_ID,
  DefaultTISSCatalogAdapter,
  EnterpriseTISSCatalogAdapter,
  IN_MEMORY_TISS_CATALOG_STORE_ID,
  InMemoryTISSCatalog,
  MOCK_TISS_CATALOG_ADAPTER_ID,
  MockTISSCatalogAdapter,
  TISSCatalogFactory,
  TISSCatalogProvider,
  TISSCatalogRegistry,
  createDefaultTISSCatalogRegistry,
  createTISSCatalogFactory,
  createTISSCatalogPort,
  getTISSCatalogFactory,
  getTISSCatalogHealthSummary,
  type TISSCatalogPort,
} from "../../../src/lib/enterprise/tiss-catalog/index.ts";
import { createTISSRuntimePort } from "../../../src/lib/enterprise/tiss-runtime/index.ts";
import { createCanonicalExecutionOrchestratorPort } from "../../../src/lib/enterprise/canonical-execution-orchestrator/index.ts";
import { createTISSProviderPort } from "../../../src/lib/enterprise/tiss-provider/index.ts";
import { createRulePackEnginePort } from "../../../src/lib/enterprise/rule-pack-engine/index.ts";
import { createXMLRuntimePort } from "../../../src/lib/enterprise/xml-runtime/index.ts";
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

describe("TISS-02 TISSCatalogPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: TISSCatalogPort = new MockTISSCatalogAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.status, "ready");
    assert.ok((health.storedEntryCount ?? 0) > 0);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_TISS_CATALOG_ADAPTER_ID);
    assert.equal(caps.supportsCanonicalCatalog, true);
    assert.equal(caps.implementsRealXml, false);
    assert.equal(caps.implementsOperatorDispatch, false);
    assert.equal(caps.knowsOperatorOrCooperative, false);
  });

  it("DefaultTISSCatalogAdapter é o adapter enterprise oficial", () => {
    assert.equal(EnterpriseTISSCatalogAdapter, DefaultTISSCatalogAdapter);
    const port = new DefaultTISSCatalogAdapter({ provider: "enterprise" });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_TISS_CATALOG_ADAPTER_ID);
  });

  it("createTISSCatalogPort / TISSCatalogProvider default resolve enterprise", async () => {
    const port = createTISSCatalogPort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(TISSCatalogProvider.create().providerId, "enterprise");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("test / default / mock são resolvidos pelo factory", async () => {
    assert.equal(createTISSCatalogPort({ provider: "test" }).providerId, "test");
    assert.equal(createTISSCatalogPort({ provider: "default" }).providerId, "default");
    assert.equal(createTISSCatalogPort({ provider: "mock" }).providerId, "mock");
    assert.equal((await createTISSCatalogPort({ provider: "mock" }).health()).ok, true);
  });

  it("modelos canônicos e catálogo mínimo estão disponíveis via Port", async () => {
    const port = createTISSCatalogPort({ provider: "enterprise" });
    const catalog = await port.getCatalog();

    assert.equal(catalog.ok, true);
    assert.equal(catalog.catalog?.kind, "canonical-tiss-catalog");
    assert.equal(catalog.catalog?.catalogId, DEFAULT_TISS_CATALOG_ID);
    assert.ok((catalog.catalog?.versions.length ?? 0) >= 1);
    assert.ok((catalog.catalog?.guideTypes.length ?? 0) >= 1);
    assert.ok((catalog.catalog?.domains.length ?? 0) >= 1);
    assert.ok((catalog.catalog?.profiles.length ?? 0) >= 1);
    assert.ok((catalog.catalog?.procedureTypes.length ?? 0) >= 1);
    assert.ok((catalog.catalog?.procedureGroups.length ?? 0) >= 1);
    assert.ok((catalog.catalog?.vocabulary.length ?? 0) >= 1);
    assert.equal(catalog.catalog?.metadata?.kind, "canonical-tiss-catalog-metadata");
    assert.equal(catalog.catalog?.statistics.kind, "canonical-tiss-catalog-statistics");
    assert.equal(catalog.telemetry.cancelled, false);

    const version = await port.getVersion({ code: "tiss-4.01.00" });
    assert.equal(version.ok, true);
    assert.equal(version.entry?.kind, "canonical-tiss-version");

    const guide = await port.getGuideType({ code: "guia-consulta" });
    assert.equal(guide.ok, true);
    assert.equal(guide.entry?.kind, "canonical-tiss-guide-type");

    const profile = await port.getProfile({ code: "profile-structural-default" });
    assert.equal(profile.ok, true);
    assert.equal(profile.entry?.kind, "canonical-tiss-catalog-profile");

    const stats = await port.getStatistics();
    assert.equal(stats.ok, true);
    assert.ok((stats.statistics?.totalEntries ?? 0) > 0);
  });

  it("InMemoryTISSCatalog é o Catalog Store oficial", () => {
    const store = new InMemoryTISSCatalog();
    assert.equal(store.storeId, IN_MEMORY_TISS_CATALOG_STORE_ID);
    assert.equal(store.catalogId, DEFAULT_TISS_CATALOG_ID);
    assert.ok(store.entryCount() > 0);
    assert.equal(store.health().ok, true);
  });

  it("timeout é implementado e retorna TISS_CATALOG_TIMEOUT", async () => {
    const port = new DefaultTISSCatalogAdapter({
      provider: "enterprise",
      defaultTimeoutMs: 20,
      defaultRetryCount: 0,
    });
    const result = await port.getCatalog({
      timeoutMs: 20,
      retryCount: 0,
      attributes: { forceDelayMs: 200 },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_CATALOG_TIMEOUT");
  });

  it("retry recupera falha transitória", async () => {
    const port = new DefaultTISSCatalogAdapter({
      provider: "enterprise",
      failAttempts: 1,
      defaultRetryCount: 2,
      defaultRetryBackoffMs: 1,
    });
    const result = await port.getCatalog({ retryCount: 2 });
    assert.equal(result.ok, true);
    assert.ok(result.telemetry.attempts >= 2);
  });

  it("cancelamento via AbortSignal retorna TISS_CATALOG_CANCELLED", async () => {
    const port = new DefaultTISSCatalogAdapter({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.getCatalog({ signal: controller.signal });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_CATALOG_CANCELLED");
    assert.equal(result.telemetry.cancelled, true);
  });

  it("tratamento de erro para catalog unhealthy / not found", async () => {
    const unhealthy = new DefaultTISSCatalogAdapter({
      provider: "enterprise",
      healthy: false,
    });
    const unhealthyResult = await unhealthy.getCatalog();
    assert.equal(unhealthyResult.ok, false);
    assert.equal(unhealthyResult.code, "TISS_CATALOG_UNHEALTHY");

    const port = createTISSCatalogPort({ provider: "enterprise" });
    const missing = await port.getVersion({ code: "does-not-exist" });
    assert.equal(missing.ok, false);
    assert.equal(missing.code, "TISS_CATALOG_NOT_FOUND");
  });

  it("Registry e Factory seguem ECS-01 (sem fallback silencioso)", () => {
    const registry = createDefaultTISSCatalogRegistry();
    assert.ok(registry instanceof TISSCatalogRegistry);
    assert.equal(registry.snapshot().count, BUILTIN_TISS_CATALOG_PROVIDER_COUNT);
    assert.equal(registry.has("enterprise"), true);

    const factory = createTISSCatalogFactory({ registry });
    assert.ok(factory instanceof TISSCatalogFactory);
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");

    assert.throws(
      () =>
        factory.create({
          // @ts-expect-error — provider inválido
          provider: "unimed-catalog",
        }),
      /não está registrado|desconhecido/,
    );

    assert.equal(getTISSCatalogFactory().getRegistry().has("mock"), true);
    assert.equal(DEFAULT_TISS_CATALOG_CAPABILITIES.supportsCanonicalCatalog, true);
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createTISSCatalogPort({ provider: "enterprise" });
    const summary = await getTISSCatalogHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.info.providerType, "TISS_CATALOG");
    assert.equal(summary.capabilities.implementsRealXml, false);
  });
});

describe("TISS-02 cadeia Enterprise / TISS Runtime / Catalog", () => {
  it("Enterprise Runtime expõe TISS Catalog + Runtime + Provider", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    assert.equal(runtime.getTISSCatalogPort().providerId, "enterprise");
    assert.equal(runtime.getTISSProviderPort().providerId, "enterprise");
    assert.equal(runtime.getTISSRuntimePort().providerId, "default");
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesTISSCatalogPort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesTISSProviderPort, true);

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.tissCatalogOk, true);
    assert.equal(health.tissProviderOk, true);
    assert.equal(health.tissRuntimeOk, true);
  });

  it("fluxo: Runtime → TISS Runtime → TISSCatalogPort → Canonical Catalog", async () => {
    const orchestrator = createCanonicalExecutionOrchestratorPort({ provider: "mock" });
    const tissProvider = createTISSProviderPort({ provider: "enterprise" });
    const tissCatalog = createTISSCatalogPort({ provider: "enterprise" });
    const rulePackEngine = createRulePackEnginePort({
      provider: "enterprise",
      enterpriseDeps: { getTISSCatalogPort: () => tissCatalog },
    });
    const xmlRuntime = createXMLRuntimePort({
      provider: "enterprise",
      enterpriseDeps: {
        getTISSCatalogPort: () => tissCatalog,
        getRulePackEnginePort: () => rulePackEngine,
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
      },
    });

    const result = await tissRuntime.process({
      kind: "canonical-tiss-request",
      mode: "structural-process",
      metadata: {
        kind: "canonical-tiss-metadata",
        sessionId: "sess-tiss-02",
        correlationId: "corr-tiss-02",
      },
    });

    assert.equal(result.ok, true);
    assert.ok(result.runtimeSessionId);

    const session = await tissRuntime.getSession({
      runtimeSessionId: result.runtimeSessionId!,
    });
    assert.equal(session.ok, true);
    assert.equal(session.session?.processedViaTISSCatalogPort, true);
    assert.equal(session.session?.tissCatalogId, DEFAULT_TISS_CATALOG_ID);
    assert.equal(session.session?.processedViaTISSProviderPort, true);
  });
});

describe("TISS-02 auditoria — sem bypass / sem lógica de operadora/versão", () => {
  it("módulo tiss-catalog não contém backends / operadoras / XML dispatch", () => {
    const moduleDir = join(repoRoot, "src/lib/enterprise/tiss-catalog");
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

  it("não existe if/switch por operadora/versão no tiss-catalog", () => {
    const moduleDir = join(repoRoot, "src/lib/enterprise/tiss-catalog");
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
    }
  });

  it("Enterprise Runtime / TISS Runtime usam exclusivamente TISSCatalogPort", () => {
    const runtimeAdapter = readFileSync(
      join(repoRoot, "src/lib/enterprise/tiss-runtime/adapters/default-tiss-runtime-adapter.ts"),
      "utf8",
    );
    assert.match(runtimeAdapter, /getTISSCatalogPort/);
    assert.match(runtimeAdapter, /\.getCatalog\(/);
    assert.equal(/InMemoryTISSCatalog/.test(runtimeAdapter), false);
    assert.equal(/new DefaultTISSCatalogAdapter/.test(runtimeAdapter), false);
    assert.equal(/createTISSCatalogPort/.test(runtimeAdapter), false);

    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.match(enterpriseRuntime, /createTISSCatalogPort/);
    assert.match(enterpriseRuntime, /getTISSCatalogPort/);
  });

  it("não existe catálogo paralelo TISSCatalog fora de tiss-catalog", () => {
    const enterpriseRoot = join(repoRoot, "src/lib/enterprise");
    const offenders: string[] = [];
    for (const file of collectTsFiles(enterpriseRoot)) {
      if (file.includes(`${join("tiss-catalog")}`)) continue;
      const source = readFileSync(file, "utf8");
      if (/class\s+CanonicalTISSCatalog\b/.test(source)) offenders.push(file);
      if (/class\s+InMemoryTISSCatalog\b/.test(source)) offenders.push(file);
    }
    assert.deepEqual(offenders, []);
  });
});

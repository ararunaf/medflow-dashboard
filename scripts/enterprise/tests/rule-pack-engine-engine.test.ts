#!/usr/bin/env node
/**
 * TISS-03 — Enterprise Rule Pack Engine
 * Prova: Application → RulePackEnginePort → Adapter → Factory → Registry → Store
 *         + TISSCatalogPort (consumo exclusivo)
 *         + TISS Runtime + Enterprise Runtime
 *         + Modelos Canônicos / Resultado Canônico
 *         + timeout / retry / cancelamento / erros
 *         + ausência de bypass / lógica específica de operadora/contrato/tenant
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_RULE_PACK_ENGINE_PROVIDER_COUNT,
  DEFAULT_RULE_PACK_ENGINE_ADAPTER_ID,
  DEFAULT_RULE_PACK_ENGINE_CAPABILITIES,
  DEFAULT_STRUCTURAL_RULE_PACK_CODE,
  DefaultRulePackEngineAdapter,
  EnterpriseRulePackEngineAdapter,
  IN_MEMORY_RULE_PACK_ENGINE_STORE_ID,
  InMemoryRulePackEngineStore,
  MOCK_RULE_PACK_ENGINE_ADAPTER_ID,
  MockRulePackEngineAdapter,
  RulePackEngineFactory,
  RulePackEngineProvider,
  RulePackEngineRegistry,
  createDefaultRulePackEngineRegistry,
  createRulePackEngineFactory,
  createRulePackEnginePort,
  getRulePackEngineFactory,
  getRulePackEngineHealthSummary,
  type RulePackEnginePort,
} from "../../../src/lib/enterprise/rule-pack-engine/index.ts";
import { createTISSCatalogPort } from "../../../src/lib/enterprise/tiss-catalog/index.ts";
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

function withCatalogDeps(portProvider: "enterprise" | "mock" = "enterprise") {
  const catalog = createTISSCatalogPort({ provider: portProvider });
  return {
    catalog,
    enterpriseDeps: { getTISSCatalogPort: () => catalog },
  };
}

describe("TISS-03 RulePackEnginePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const { enterpriseDeps } = withCatalogDeps("mock");
    const port: RulePackEnginePort = new MockRulePackEngineAdapter({
      provider: "mock",
      enterpriseDeps,
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.status, "ready");
    assert.ok((health.storedPackCount ?? 0) > 0);
    assert.equal(health.tissCatalogOk, true);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_RULE_PACK_ENGINE_ADAPTER_ID);
    assert.equal(caps.supportsCanonicalResult, true);
    assert.equal(caps.consumesTISSCatalogPort, true);
    assert.equal(caps.implementsRealXml, false);
    assert.equal(caps.implementsOperatorDispatch, false);
    assert.equal(caps.knowsOperatorOrCooperative, false);
    assert.equal(caps.knowsContract, false);
    assert.equal(caps.knowsTenant, false);
  });

  it("DefaultRulePackEngineAdapter é o adapter enterprise oficial", () => {
    assert.equal(EnterpriseRulePackEngineAdapter, DefaultRulePackEngineAdapter);
    const { enterpriseDeps } = withCatalogDeps();
    const port = new DefaultRulePackEngineAdapter({
      provider: "enterprise",
      enterpriseDeps,
    });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_RULE_PACK_ENGINE_ADAPTER_ID);
  });

  it("createRulePackEnginePort / RulePackEngineProvider default resolve enterprise", async () => {
    const port = createRulePackEnginePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(RulePackEngineProvider.create().providerId, "enterprise");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("test / default / mock são resolvidos pelo factory", async () => {
    assert.equal(createRulePackEnginePort({ provider: "test" }).providerId, "test");
    assert.equal(createRulePackEnginePort({ provider: "default" }).providerId, "default");
    assert.equal(createRulePackEnginePort({ provider: "mock" }).providerId, "mock");
    assert.equal((await createRulePackEnginePort({ provider: "mock" }).health()).ok, true);
  });

  it("modelos canônicos e resultado canônico via Port", async () => {
    const { enterpriseDeps } = withCatalogDeps();
    const port = createRulePackEnginePort({ provider: "enterprise", enterpriseDeps });

    const loaded = await port.loadPack({ code: DEFAULT_STRUCTURAL_RULE_PACK_CODE });
    assert.equal(loaded.ok, true);
    assert.equal(loaded.pack?.kind, "canonical-rule-pack");
    assert.ok((loaded.pack?.rules.length ?? 0) >= 1);
    assert.equal(loaded.pack?.rules[0]?.kind, "canonical-rule");
    assert.equal(loaded.pack?.rules[0]?.conditions[0]?.kind, "canonical-rule-condition");
    assert.equal(loaded.pack?.rules[0]?.actions[0]?.kind, "canonical-rule-action");

    const interpreted = await port.interpretPack({ code: DEFAULT_STRUCTURAL_RULE_PACK_CODE });
    assert.equal(interpreted.ok, true);
    assert.equal(interpreted.catalogConsumed, true);
    assert.ok((interpreted.resolvedCatalogCodes?.length ?? 0) >= 1);

    const executed = await port.executePack({ code: DEFAULT_STRUCTURAL_RULE_PACK_CODE });
    assert.equal(executed.ok, true);
    assert.equal(executed.result?.kind, "canonical-rule-execution-result");
    assert.equal(executed.execution?.kind, "canonical-rule-execution");
    assert.equal(executed.result?.catalogConsumed, true);
    assert.ok((executed.result?.rulesEvaluated ?? 0) >= 1);
    assert.ok((executed.result?.rulesMatched ?? 0) >= 1);
    assert.ok((executed.result?.findings.length ?? 0) >= 1);
    assert.equal(executed.telemetry.cancelled, false);

    const listed = await port.listPacks();
    assert.equal(listed.ok, true);
    assert.ok(listed.packs.length >= 1);

    const execution = await port.getExecution({
      executionId: executed.execution!.executionId,
    });
    assert.equal(execution.ok, true);
    assert.equal(execution.execution?.executionId, executed.execution?.executionId);
  });

  it("InMemoryRulePackEngineStore é o Rule Pack Store oficial", () => {
    const store = new InMemoryRulePackEngineStore();
    assert.equal(store.storeId, IN_MEMORY_RULE_PACK_ENGINE_STORE_ID);
    assert.ok(store.packCount() > 0);
    assert.equal(store.health().ok, true);
  });

  it("timeout é implementado e retorna RULE_PACK_ENGINE_TIMEOUT", async () => {
    const { enterpriseDeps } = withCatalogDeps();
    const port = new DefaultRulePackEngineAdapter({
      provider: "enterprise",
      enterpriseDeps,
      defaultTimeoutMs: 20,
      defaultRetryCount: 0,
    });
    const result = await port.loadPack({
      timeoutMs: 20,
      retryCount: 0,
      attributes: { forceDelayMs: 200 },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "RULE_PACK_ENGINE_TIMEOUT");
  });

  it("retry recupera falha transitória", async () => {
    const { enterpriseDeps } = withCatalogDeps();
    const port = new DefaultRulePackEngineAdapter({
      provider: "enterprise",
      enterpriseDeps,
      failAttempts: 1,
      defaultRetryCount: 2,
      defaultRetryBackoffMs: 1,
    });
    const result = await port.loadPack({
      code: DEFAULT_STRUCTURAL_RULE_PACK_CODE,
      retryCount: 2,
    });
    assert.equal(result.ok, true);
    assert.ok(result.telemetry.attempts >= 2);
  });

  it("cancelamento via AbortSignal retorna RULE_PACK_ENGINE_CANCELLED", async () => {
    const { enterpriseDeps } = withCatalogDeps();
    const port = new DefaultRulePackEngineAdapter({
      provider: "enterprise",
      enterpriseDeps,
    });
    const controller = new AbortController();
    controller.abort();
    const result = await port.executePack({ signal: controller.signal });
    assert.equal(result.ok, false);
    assert.equal(result.code, "RULE_PACK_ENGINE_CANCELLED");
    assert.equal(result.telemetry.cancelled, true);
  });

  it("tratamento de erro para engine unhealthy / not found", async () => {
    const { enterpriseDeps } = withCatalogDeps();
    const unhealthy = new DefaultRulePackEngineAdapter({
      provider: "enterprise",
      healthy: false,
      enterpriseDeps,
    });
    const unhealthyResult = await unhealthy.loadPack({
      code: DEFAULT_STRUCTURAL_RULE_PACK_CODE,
    });
    assert.equal(unhealthyResult.ok, false);
    assert.equal(unhealthyResult.code, "RULE_PACK_ENGINE_UNHEALTHY");

    const port = createRulePackEnginePort({ provider: "enterprise", enterpriseDeps });
    const missing = await port.loadPack({ code: "does-not-exist" });
    assert.equal(missing.ok, false);
    assert.equal(missing.code, "RULE_PACK_ENGINE_NOT_FOUND");
  });

  it("Registry e Factory seguem ECS-01 (sem fallback silencioso)", () => {
    const registry = createDefaultRulePackEngineRegistry();
    assert.ok(registry instanceof RulePackEngineRegistry);
    assert.equal(registry.snapshot().count, BUILTIN_RULE_PACK_ENGINE_PROVIDER_COUNT);
    assert.equal(registry.has("enterprise"), true);

    const factory = createRulePackEngineFactory({ registry });
    assert.ok(factory instanceof RulePackEngineFactory);
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");

    assert.throws(
      () =>
        factory.create({
          // @ts-expect-error — provider inválido
          provider: "unimed-rule-pack",
        }),
      /não está registrado|desconhecido/,
    );

    assert.equal(getRulePackEngineFactory().getRegistry().has("mock"), true);
    assert.equal(DEFAULT_RULE_PACK_ENGINE_CAPABILITIES.consumesTISSCatalogPort, true);
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createRulePackEnginePort({ provider: "enterprise" });
    const summary = await getRulePackEngineHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.info.providerType, "RULE_PACK_ENGINE");
    assert.equal(summary.capabilities.implementsRealXml, false);
  });

  it("exige TISSCatalogPort — sem bypass", () => {
    assert.throws(
      () =>
        new DefaultRulePackEngineAdapter({
          provider: "enterprise",
          // @ts-expect-error — deps obrigatórias
          enterpriseDeps: {},
        }),
      /getTISSCatalogPort/,
    );
  });
});

describe("TISS-03 cadeia Enterprise / TISS Runtime / Rule Pack Engine", () => {
  it("Enterprise Runtime expõe Rule Pack Engine + Catalog + Runtime", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    assert.equal(runtime.getRulePackEnginePort().providerId, "enterprise");
    assert.equal(runtime.getTISSCatalogPort().providerId, "enterprise");
    assert.equal(runtime.getTISSProviderPort().providerId, "enterprise");
    assert.equal(runtime.getTISSRuntimePort().providerId, "default");
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesRulePackEnginePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesTISSCatalogPort, true);

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.rulePackEngineOk, true);
    assert.equal(health.tissCatalogOk, true);
    assert.equal(health.tissProviderOk, true);
    assert.equal(health.tissRuntimeOk, true);
  });

  it("fluxo: Runtime → TISS Runtime → RulePackEnginePort → Canonical Result", async () => {
    const orchestrator = createCanonicalExecutionOrchestratorPort({ provider: "mock" });
    const tissProvider = createTISSProviderPort({ provider: "enterprise" });
    const tissCatalog = createTISSCatalogPort({ provider: "enterprise" });
    const rulePackEngine = createRulePackEnginePort({
      provider: "enterprise",
      enterpriseDeps: { getTISSCatalogPort: () => tissCatalog },
    });
    const tissRuntime = createTISSRuntimePort({
      provider: "default",
      enterpriseDeps: {
        getOrchestratorPort: () => orchestrator,
        getTISSProviderPort: () => tissProvider,
        getTISSCatalogPort: () => tissCatalog,
        getRulePackEnginePort: () => rulePackEngine,
      },
    });

    const result = await tissRuntime.process({
      kind: "canonical-tiss-request",
      mode: "structural-process",
      metadata: {
        kind: "canonical-tiss-metadata",
        sessionId: "sess-tiss-03",
        correlationId: "corr-tiss-03",
      },
    });

    assert.equal(result.ok, true);
    assert.ok(result.runtimeSessionId);

    const session = await tissRuntime.getSession({
      runtimeSessionId: result.runtimeSessionId!,
    });
    assert.equal(session.ok, true);
    assert.equal(session.session?.processedViaTISSCatalogPort, true);
    assert.equal(session.session?.processedViaRulePackEnginePort, true);
    assert.equal(session.session?.rulePackCode, DEFAULT_STRUCTURAL_RULE_PACK_CODE);
    assert.ok(session.session?.rulePackExecutionId);
  });

  it("consumo exclusivo via TISSCatalogPort (não acessa Catalog Store)", async () => {
    const { enterpriseDeps, catalog } = withCatalogDeps();
    const port = new DefaultRulePackEngineAdapter({
      provider: "enterprise",
      enterpriseDeps,
    });
    const executed = await port.executePack({ code: DEFAULT_STRUCTURAL_RULE_PACK_CODE });
    assert.equal(executed.ok, true);
    assert.equal(executed.result?.catalogConsumed, true);

    const adapterSource = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/rule-pack-engine/adapters/default-rule-pack-engine-adapter.ts",
      ),
      "utf8",
    );
    assert.match(adapterSource, /getTISSCatalogPort/);
    assert.match(adapterSource, /\.getCatalog\(/);
    assert.equal(/InMemoryTISSCatalog/.test(adapterSource), false);
    assert.equal(/new DefaultTISSCatalogAdapter/.test(adapterSource), false);
    assert.equal(/TUSS_CATALOG/.test(adapterSource), false);
    assert.equal(/tuss_procedures/.test(adapterSource), false);

    // Catalog Port permanece a única fonte — health do catalog ok.
    assert.equal((await catalog.health()).ok, true);
  });
});

describe("TISS-03 auditoria — sem bypass / sem lógica de operadora/contrato/tenant", () => {
  it("módulo rule-pack-engine não contém backends / operadoras / XML dispatch", () => {
    const moduleDir = join(repoRoot, "src/lib/enterprise/rule-pack-engine");
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

  it("não existe if/switch por operadora/versão/contrato/tenant no rule-pack-engine", () => {
    const moduleDir = join(repoRoot, "src/lib/enterprise/rule-pack-engine");
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

  it("Enterprise Runtime / TISS Runtime usam exclusivamente RulePackEnginePort", () => {
    const runtimeAdapter = readFileSync(
      join(repoRoot, "src/lib/enterprise/tiss-runtime/adapters/default-tiss-runtime-adapter.ts"),
      "utf8",
    );
    assert.match(runtimeAdapter, /getRulePackEnginePort/);
    assert.match(runtimeAdapter, /\.executePack\(/);
    assert.equal(/InMemoryRulePackEngineStore/.test(runtimeAdapter), false);
    assert.equal(/new DefaultRulePackEngineAdapter/.test(runtimeAdapter), false);
    assert.equal(/createRulePackEnginePort/.test(runtimeAdapter), false);

    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.match(enterpriseRuntime, /createRulePackEnginePort/);
    assert.match(enterpriseRuntime, /getRulePackEnginePort/);
  });

  it("não existe RulePackEngine paralelo fora de rule-pack-engine", () => {
    const enterpriseRoot = join(repoRoot, "src/lib/enterprise");
    const offenders: string[] = [];
    for (const file of collectTsFiles(enterpriseRoot)) {
      if (file.includes(`${join("rule-pack-engine")}`)) continue;
      const source = readFileSync(file, "utf8");
      if (/class\s+DefaultRulePackEngineAdapter\b/.test(source)) offenders.push(file);
      if (/class\s+InMemoryRulePackEngineStore\b/.test(source)) offenders.push(file);
      if (/interface\s+RulePackEnginePort\b/.test(source)) offenders.push(file);
    }
    assert.deepEqual(offenders, []);
  });
});

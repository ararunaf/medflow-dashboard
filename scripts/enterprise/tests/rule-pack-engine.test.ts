#!/usr/bin/env node
/**
 * EPC-09 — Rule Pack Management Foundation
 * Prova Application → RulePackPort → Adapter → Store sem tocar produto.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  areRequiredDependenciesPresent,
  createPackId,
  createRulePackFactory,
  createRulePackPort,
  DEFAULT_RULE_PACK_ADAPTER_ID,
  DefaultRulePackAdapter,
  DefaultRulePackStore,
  defineDependency,
  defineVersionChain,
  dependsOn,
  getDependencyCount,
  getRulePackHealthSummary,
  getVersionInfo,
  hasLifecycle,
  hasVersionChain,
  listDependencyPackIds,
  MockRulePackAdapter,
  partitionDependencies,
  withVersionInfo,
  type RulePack,
  type RulePackPort,
} from "../../../src/lib/enterprise/rule-pack/index.ts";

function samplePack(overrides: Partial<RulePack> & { name?: string } = {}): Omit<
  RulePack,
  "packId" | "createdAt" | "updatedAt" | "status" | "version"
> & {
  packId?: string;
  status?: RulePack["status"];
  version?: string;
  name: string;
} {
  return {
    name: "core-foundation",
    description: "Generic rule pack container",
    version: "1.0.0",
    previousVersion: undefined,
    nextVersion: "1.1.0",
    compatibility: "backward",
    lifecycle: "draft",
    priority: "medium",
    author: "enterprise-platform",
    ruleReferences: [
      { ruleId: "rule-opaque-1", ruleNamespace: "enterprise.core", ruleVersion: "1" },
      { ruleName: "validate-structure", ruleNamespace: "enterprise.core" },
    ],
    metadataReference: { id: "meta-1", kind: "schema", namespace: "enterprise.core" },
    dependencies: [defineDependency("pack-base", { version: "1.0.0", optional: false })],
    tags: ["foundation", "generic"],
    capabilities: ["grouping", "versioning"],
    customAttributes: { channel: "api", batch: 3 },
    ...overrides,
    name: overrides.name ?? "core-foundation",
  };
}

describe("EPC-09 RulePackPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: RulePackPort = new MockRulePackAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsCreatePack, true);
    assert.equal(caps.supportsGetPack, true);
    assert.equal(caps.supportsListPacks, true);
    assert.equal(caps.supportsEnablePack, true);
    assert.equal(caps.supportsDisablePack, true);
    assert.equal(caps.supportsVersioning, true);
    assert.equal(caps.supportsDependencies, true);
    assert.equal(caps.supportsRuleReferences, true);
    assert.equal(caps.supportsMetadataReference, true);
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createRulePackPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default adapter usa store in-process e declara capacidades", async () => {
    const store = new DefaultRulePackStore();
    const port: RulePackPort = new DefaultRulePackAdapter({ store });

    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_RULE_PACK_ADAPTER_ID);
    assert.equal(caps.supportsCreatePack, true);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
    assert.match(health.message ?? "", /ready|pronto/i);
  });

  it("Default adapter usa ping opcional sem alterar contrato", async () => {
    const port = new DefaultRulePackAdapter({
      store: new DefaultRulePackStore(),
      ping: async () => ({ ok: true, message: "rule-pack probe custom" }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "rule-pack probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultRulePackAdapter; futuros falham explicitamente", () => {
    const defaultPort = createRulePackPort();
    assert.equal(defaultPort.providerId, "default");

    assert.throws(() => createRulePackPort({ provider: "database" }), /ainda não implementado/i);
    assert.throws(() => createRulePackPort({ provider: "remote" }), /ainda não implementado/i);
    assert.throws(() => createRulePackPort({ provider: "registry" }), /ainda não implementado/i);
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createRulePackFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createRulePackPort({ provider: "mock" });
    const summary = await getRulePackHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("createPack/getPack/listPacks funcionam no Mock", async () => {
    const port = new MockRulePackAdapter({
      createId: () => "pack-fixed-1",
      now: () => "2026-07-31T12:00:00.000Z",
    });

    const created = await port.createPack({ pack: samplePack() });
    assert.equal(created.ok, true);
    assert.equal(created.packId, "pack-fixed-1");
    assert.equal(created.pack?.name, "core-foundation");
    assert.equal(created.pack?.status, "draft");
    assert.equal(created.pack?.version, "1.0.0");
    assert.equal(created.pack?.createdAt, "2026-07-31T12:00:00.000Z");

    const got = await port.getPack({ packId: "pack-fixed-1" });
    assert.equal(got.ok, true);
    assert.equal(got.pack?.packId, "pack-fixed-1");
    assert.equal(got.pack?.ruleReferences?.length, 2);

    const listed = await port.listPacks({ tag: "foundation" });
    assert.equal(listed.ok, true);
    assert.equal(listed.packs.length, 1);

    const missing = await port.getPack({ packId: "missing" });
    assert.equal(missing.ok, false);
    assert.equal(missing.code, "not_found");
  });

  it("enablePack/disablePack alteram status sem lógica de negócio", async () => {
    const port = new DefaultRulePackAdapter({
      store: new DefaultRulePackStore(),
      createId: () => "pack-toggle-1",
      now: () => "2026-07-31T15:00:00.000Z",
    });

    await port.createPack({ pack: samplePack({ packId: "pack-toggle-1" }) });

    const enabled = await port.enablePack({ packId: "pack-toggle-1" });
    assert.equal(enabled.ok, true);
    assert.equal(enabled.pack?.status, "enabled");
    assert.equal(enabled.code, "enabled");

    const disabled = await port.disablePack({ packId: "pack-toggle-1" });
    assert.equal(disabled.ok, true);
    assert.equal(disabled.pack?.status, "disabled");
    assert.equal(disabled.code, "disabled");

    const notFound = await port.enablePack({ packId: "nope" });
    assert.equal(notFound.ok, false);
    assert.equal(notFound.code, "not_found");
  });

  it("modelo suporta versionamento (previous/next/compatibility/lifecycle)", async () => {
    const port = new MockRulePackAdapter({ createId: () => "pack-ver-1" });
    const chain = defineVersionChain({
      version: "2.0.0",
      previousVersion: "1.0.0",
      nextVersion: "2.1.0",
      compatibility: "breaking",
      lifecycle: "published",
    });

    const created = await port.createPack({
      pack: samplePack({
        ...chain,
        name: "versioned-pack",
      }),
    });

    assert.equal(created.pack?.version, "2.0.0");
    assert.equal(created.pack?.previousVersion, "1.0.0");
    assert.equal(created.pack?.nextVersion, "2.1.0");
    assert.equal(created.pack?.compatibility, "breaking");
    assert.equal(created.pack?.lifecycle, "published");

    const info = getVersionInfo(created.pack!);
    assert.equal(info.version, "2.0.0");
    assert.equal(hasVersionChain(created.pack!), true);
    assert.equal(hasLifecycle(created.pack!), true);

    const bumped = withVersionInfo(created.pack!, {
      version: "2.1.0",
      previousVersion: "2.0.0",
      lifecycle: "deprecated",
    });
    assert.equal(bumped.version, "2.1.0");
    assert.equal(bumped.previousVersion, "2.0.0");
    assert.equal(bumped.lifecycle, "deprecated");
  });

  it("modelo suporta dependências entre packs (sem resolução automática)", async () => {
    const port = new MockRulePackAdapter();

    await port.createPack({
      pack: samplePack({
        packId: "pack-base",
        name: "base-pack",
        dependencies: [],
      }),
    });

    const dep = defineDependency("pack-base", { version: "1.0.0", kind: "requires" });
    const created = await port.createPack({
      pack: samplePack({
        packId: "pack-a",
        name: "dependent-pack",
        dependencies: [dep, defineDependency("pack-optional", { optional: true })],
      }),
    });

    assert.equal(dependsOn(created.pack!, "pack-base"), true);
    assert.equal(getDependencyCount(created.pack!), 2);
    assert.deepEqual(listDependencyPackIds(created.pack!), ["pack-base", "pack-optional"]);

    const parts = partitionDependencies(created.pack!);
    assert.equal(parts.required.length, 1);
    assert.equal(parts.optional.length, 1);

    // Infra only: presence check by id set — does NOT load or resolve packs.
    assert.equal(areRequiredDependenciesPresent(created.pack!, ["pack-base", "pack-a"]), true);
    assert.equal(areRequiredDependenciesPresent(created.pack!, ["pack-a"]), false);

    const listed = await port.listPacks({ dependsOn: "pack-base" });
    assert.equal(listed.packs.length, 1);
    assert.equal(listed.packs[0]?.packId, "pack-a");
  });

  it("createPackId gera id genérico", () => {
    const id = createPackId();
    assert.equal(typeof id, "string");
    assert.ok(id.length > 0);
  });

  it("modelo não contém conhecimento clínico / TISS / contratual", async () => {
    const port = new MockRulePackAdapter({ createId: () => "pack-clean-1" });
    const created = await port.createPack({ pack: samplePack() });
    const asRecord = created.pack as unknown as Record<string, unknown>;

    assert.equal(asRecord.patientId, undefined);
    assert.equal(asRecord.operadora, undefined);
    assert.equal(asRecord.cooperativa, undefined);
    assert.equal(asRecord.contrato, undefined);
    assert.equal(asRecord.tiss, undefined);
    assert.equal(asRecord.guia, undefined);
    assert.equal(asRecord.clinical, undefined);
    assert.equal(asRecord.auditoria, undefined);

    const json = JSON.stringify(created.pack);
    assert.equal(/tiss|operadora|paciente|contrato|guia|clínic/i.test(json), false);
  });

  it("Default store seed e listFilters funcionam", async () => {
    const seeded: RulePack = {
      packId: "seed-1",
      name: "seeded",
      version: "1",
      status: "enabled",
      priority: "high",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      author: "seeder",
      tags: ["seed"],
      lifecycle: "published",
    };
    const store = new DefaultRulePackStore({ packs: [seeded] });
    const port = new DefaultRulePackAdapter({ store });

    const byAuthor = await port.listPacks({ author: "seeder" });
    assert.equal(byAuthor.packs.length, 1);

    const byLifecycle = await port.listPacks({ lifecycle: "published" });
    assert.equal(byLifecycle.packs.length, 1);

    const byPriority = await port.listPacks({ priority: "high" });
    assert.equal(byPriority.packs.length, 1);

    const byPrefix = await port.listPacks({ namePrefix: "seed" });
    assert.equal(byPrefix.packs.length, 1);
  });
});

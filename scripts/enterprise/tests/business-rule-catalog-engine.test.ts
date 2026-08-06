/**
 * E-01 — Business Rule Catalog functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  BusinessRuleCatalog,
  createBusinessEnginePort,
  DEFAULT_BUSINESS_ENGINE_CAPABILITIES,
  E01_BUSINESS_ENGINE_CAPABILITIES,
  InMemoryBusinessRuleCatalogStore,
  MockBusinessEngineAdapter,
} from "../../../src/lib/enterprise/business-engine";
import { DefaultBusinessEngineAdapter } from "../../../src/lib/enterprise/business-engine/adapters/default-business-engine-adapter";
import { businessEngineRegistry } from "../../../src/lib/enterprise/business-engine/registry/business-engine-registry";
import type { CanonicalBusinessRule } from "../../../src/lib/enterprise/business-engine/ports";

function makeRule(
  ruleId = "rule-01",
  name = "Test Rule",
  tags: string[] = ["demo"],
): CanonicalBusinessRule {
  return {
    kind: "canonical-business-rule",
    ruleId,
    name,
    version: "1.0.0",
    description: "test rule",
    conditions: [
      { kind: "canonical-business-rule-condition", field: "amount", operator: "gte", value: 0 },
    ],
    actions: [{ kind: "canonical-business-rule-action", type: "allow" }],
    tags,
  };
}

describe("E-01 Business Rule Catalog — functional cases", () => {
  it("registra e recupera regra no catálogo", () => {
    const catalog = new BusinessRuleCatalog(new InMemoryBusinessRuleCatalogStore());
    const rule = makeRule();
    const result = catalog.register(rule);
    assert.equal(result.ok, true);
    assert.equal(result.ruleId, rule.ruleId);
    const found = catalog.find(rule.ruleId);
    assert.equal(found.ok, true);
    assert.equal(found.rule?.ruleId, rule.ruleId);
  });

  it("rejeita regra sem ruleId", () => {
    const catalog = new BusinessRuleCatalog(new InMemoryBusinessRuleCatalogStore());
    const rule = { ...makeRule(), ruleId: "" };
    const result = catalog.register(rule);
    assert.equal(result.ok, false);
  });

  it("lista regras por tag", () => {
    const catalog = new BusinessRuleCatalog(new InMemoryBusinessRuleCatalogStore());
    catalog.register(makeRule("r1", "A", ["a"]));
    catalog.register(makeRule("r2", "B", ["b"]));
    const list = catalog.list("a");
    assert.equal(list.length, 1);
    assert.equal(list[0]?.ruleId, "r1");
  });

  it("produz estatísticas do catálogo", () => {
    const catalog = new BusinessRuleCatalog(new InMemoryBusinessRuleCatalogStore());
    catalog.register(makeRule("r1", "A", ["a"]));
    const stats = catalog.stats();
    assert.equal(stats.totalRules, 1);
    assert.equal(stats.ruleIds[0], "r1");
  });

  it("DefaultBusinessEngineAdapter implementa o Port", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, E01_BUSINESS_ENGINE_CAPABILITIES);
    const rule = makeRule();
    const reg = await adapter.registerRule({ rule });
    assert.equal(reg.ok, true);
    const list = await adapter.listRules({});
    assert.equal(list.total, 1);
    const found = await adapter.findRule({ ruleId: rule.ruleId });
    assert.equal(found.ok, true);
    const health = await adapter.health();
    assert.equal(health.ok, true);
    assert.equal(health.businessRuleCatalogOk, true);
  });

  it("MockBusinessEngineAdapter implementa o Port", async () => {
    const adapter = new MockBusinessEngineAdapter();
    assert.equal(adapter.providerId, "mock-enterprise-business-engine");
    const health = await adapter.health();
    assert.equal(health.ok, true);
  });

  it("createBusinessEnginePort resolve default", async () => {
    const port = createBusinessEnginePort({ provider: "default" });
    const identity = port.identity();
    assert.equal(identity.provider, "default");
    const caps = port.getCapabilities();
    assert.equal(caps.businessRuleCatalogImplemented, true);
    assert.equal(caps.businessRuleExecutionImplemented, false);
  });

  it("registry resolve default e mock sem fallback silencioso", () => {
    assert.ok(businessEngineRegistry.has("default"));
    assert.ok(businessEngineRegistry.has("mock"));
    assert.equal(
      businessEngineRegistry.resolve("default").providerId,
      "default-enterprise-business-engine",
    );
    assert.equal(
      businessEngineRegistry.resolve("mock").providerId,
      "mock-enterprise-business-engine",
    );
    assert.throws(() => businessEngineRegistry.resolve("unknown" as never));
  });
});

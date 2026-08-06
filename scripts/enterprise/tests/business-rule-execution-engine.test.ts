/**
 * E-02 — Business Rule Execution functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  BusinessRuleCatalog,
  BusinessRuleExecutionEngine,
  E05_BUSINESS_ENGINE_CAPABILITIES,
  InMemoryBusinessRuleCatalogStore,
} from "../../../src/lib/enterprise/business-engine";
import { DefaultBusinessEngineAdapter } from "../../../src/lib/enterprise/business-engine/adapters/default-business-engine-adapter";
import type { CanonicalBusinessRule } from "../../../src/lib/enterprise/business-engine/ports";

function makeRule(
  ruleId = "rule-01",
  name = "Test Rule",
  conditions: {
    field: string;
    operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains";
    value: unknown;
  }[] = [],
  actions: {
    type: "allow" | "deny" | "set-value" | "log";
    target?: string;
    value?: unknown;
    message?: string;
  }[] = [{ type: "allow" }],
): CanonicalBusinessRule {
  return {
    kind: "canonical-business-rule",
    ruleId,
    name,
    version: "1.0.0",
    conditions: conditions.map((c) => ({ kind: "canonical-business-rule-condition", ...c })),
    actions: actions.map((a) => ({ kind: "canonical-business-rule-action", ...a })),
  };
}

describe("E-02 Business Rule Execution — functional cases", () => {
  it("executa regra que casa com fatos", () => {
    const catalog = new BusinessRuleCatalog(new InMemoryBusinessRuleCatalogStore());
    const rule = makeRule(
      "r1",
      "Check amount",
      [{ field: "amount", operator: "gte", value: 100 }],
      [{ type: "allow" }],
    );
    catalog.register(rule);
    const engine = new BusinessRuleExecutionEngine();
    const result = engine.execute(rule, { amount: 150 });
    assert.equal(result.ok, true);
    assert.equal(result.matched, true);
    assert.equal(result.ruleId, "r1");
  });

  it("rejeita quando condição não casa", () => {
    const rule = makeRule(
      "r2",
      "Check amount",
      [{ field: "amount", operator: "gte", value: 100 }],
      [{ type: "allow" }],
    );
    const engine = new BusinessRuleExecutionEngine();
    const result = engine.execute(rule, { amount: 50 });
    assert.equal(result.ok, true);
    assert.equal(result.matched, false);
  });

  it("aplica ação set-value", () => {
    const rule = makeRule(
      "r3",
      "Set status",
      [{ field: "amount", operator: "gte", value: 100 }],
      [{ type: "set-value", target: "status", value: "approved" }],
    );
    const engine = new BusinessRuleExecutionEngine();
    const result = engine.execute(rule, { amount: 200 });
    assert.equal(result.matched, true);
    assert.equal(result.output?.status, "approved");
  });

  it("retorna ok false quando ação é deny", () => {
    const rule = makeRule(
      "r4",
      "Deny",
      [{ field: "amount", operator: "lt", value: 0 }],
      [{ type: "deny" }],
    );
    const engine = new BusinessRuleExecutionEngine();
    const result = engine.execute(rule, { amount: -1 });
    assert.equal(result.ok, false);
    assert.equal(result.matched, true);
  });

  it("Port executa regra via BusinessRuleCatalog", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, E05_BUSINESS_ENGINE_CAPABILITIES);
    assert.equal(caps.businessTransactionImplemented, true);
    assert.equal(caps.businessWorkflowImplemented, true);
    assert.equal(caps.businessProcessOrchestrationImplemented, true);
    const rule = makeRule(
      "r5",
      "Port test",
      [{ field: "amount", operator: "gte", value: 10 }],
      [{ type: "allow" }],
    );
    await adapter.registerRule({ rule });
    const result = await adapter.executeRule({ ruleId: "r5", facts: { amount: 20 } });
    assert.equal(result.ok, true);
    assert.equal(result.matched, true);
    assert.equal(result.ruleId, "r5");
  });

  it("Port retorna erro ao executar regra inexistente", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const result = await adapter.executeRule({ ruleId: "missing", facts: {} });
    assert.equal(result.ok, false);
    assert.equal(result.matched, false);
    assert.equal(result.code, "BUSINESS_RULE_EXECUTION_NOT_FOUND");
  });

  it("reutiliza BusinessRuleCatalog sem duplicação", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const rule = makeRule(
      "r6",
      "Reuse test",
      [{ field: "x", operator: "eq", value: 1 }],
      [{ type: "allow" }],
    );
    const reg = await adapter.registerRule({ rule });
    assert.equal(reg.ok, true);
    const list = await adapter.listRules({});
    assert.equal(list.total, 1);
    const exec = await adapter.executeRule({ ruleId: "r6", facts: { x: 1 } });
    assert.equal(exec.ok, true);
    assert.equal(exec.matched, true);
  });
});

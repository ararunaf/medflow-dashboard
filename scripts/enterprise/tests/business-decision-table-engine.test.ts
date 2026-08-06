/**
 * E-06 — Business Decision Table functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  BusinessDecisionTableEngine,
  BusinessRuleCatalog,
  E06_BUSINESS_ENGINE_CAPABILITIES,
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

describe("E-06 Business Decision Table — functional cases", () => {
  it("registra e recupera Decision Table", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const table = {
      kind: "canonical-business-decision-table" as const,
      tableId: "dt-001",
      name: "Eligibility Table",
      rows: ["rule-a", "rule-b"],
    };
    const registered = await adapter.registerDecisionTable({ table });
    assert.equal(registered.ok, true);
    const found = await adapter.findDecisionTable({ tableId: "dt-001" });
    assert.ok(found);
    assert.equal(found?.tableId, "dt-001");
  });

  it("executa Decision Table com First Match", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, E06_BUSINESS_ENGINE_CAPABILITIES);

    const ruleA = makeRule(
      "rule-a",
      "A",
      [{ field: "age", operator: "gte", value: 18 }],
      [{ type: "set-value", target: "eligible", value: true }],
    );
    const ruleB = makeRule(
      "rule-b",
      "B",
      [{ field: "age", operator: "lt", value: 18 }],
      [{ type: "set-value", target: "eligible", value: false }],
    );

    await adapter.registerRule({ rule: ruleA });
    await adapter.registerRule({ rule: ruleB });
    const table = {
      kind: "canonical-business-decision-table" as const,
      tableId: "dt-002",
      name: "Eligibility",
      rows: ["rule-a", "rule-b"],
    };
    await adapter.registerDecisionTable({ table });

    const result = await adapter.executeDecisionTable({
      tableId: "dt-002",
      facts: { age: 25 },
    });

    assert.equal(result.ok, true);
    assert.equal(result.matched, true);
    assert.equal(result.ruleId, "rule-a");
    assert.equal(result.output?.eligible, true);
  });

  it("nenhuma linha compatível retorna not matched", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const rule = makeRule(
      "rule-only",
      "Only",
      [{ field: "x", operator: "eq", value: 1 }],
      [{ type: "allow" }],
    );
    await adapter.registerRule({ rule });
    const table = {
      kind: "canonical-business-decision-table" as const,
      tableId: "dt-003",
      name: "No Match",
      rows: ["rule-only"],
    };
    await adapter.registerDecisionTable({ table });

    const result = await adapter.executeDecisionTable({
      tableId: "dt-003",
      facts: { x: 2 },
    });

    assert.equal(result.ok, true);
    assert.equal(result.matched, false);
    assert.equal(result.code, "BUSINESS_DECISION_TABLE_NOT_MATCHED");
  });

  it("reutiliza BusinessRuleExecutionEngine e BusinessRuleCatalog", () => {
    const catalog = new BusinessRuleCatalog(new InMemoryBusinessRuleCatalogStore());
    const rule = makeRule(
      "engine-rule",
      "Engine Rule",
      [{ field: "x", operator: "eq", value: 1 }],
      [{ type: "set-value", target: "y", value: 2 }],
    );
    catalog.register(rule);
    const engine = new BusinessDecisionTableEngine(catalog);
    const table = {
      kind: "canonical-business-decision-table" as const,
      tableId: "dt-pure",
      name: "Pure",
      rows: ["engine-rule"],
    };
    engine.register(table);
    const result = engine.execute("dt-pure", { x: 1 });
    assert.equal(result.ok, true);
    assert.equal(result.matched, true);
    assert.equal(result.output?.y, 2);
  });

  it("Port expõe capability corretamente", () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.equal(caps.businessDecisionTableImplemented, true);
    assert.equal(caps.businessRuleCatalogImplemented, true);
    assert.equal(caps.businessRuleExecutionImplemented, true);
    assert.equal(caps.businessTransactionImplemented, true);
    assert.equal(caps.businessWorkflowImplemented, true);
    assert.equal(caps.businessProcessOrchestrationImplemented, true);
    assert.equal(caps.businessEventLogImplemented, false);
    assert.equal(caps.businessAuditTrailImplemented, false);
    assert.equal(caps.businessReportImplemented, false);
    assert.equal(caps.businessEngineImplemented, false);
  });
});

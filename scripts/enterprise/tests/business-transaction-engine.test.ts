/**
 * E-03 — Business Transaction functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  BusinessTransactionEngine,
  E06_BUSINESS_ENGINE_CAPABILITIES,
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

describe("E-03 Business Transaction — functional cases", () => {
  it("executa transação com múltiplos passos", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, E06_BUSINESS_ENGINE_CAPABILITIES);
    assert.equal(caps.businessWorkflowImplemented, true);
    assert.equal(caps.businessProcessOrchestrationImplemented, true);
    assert.equal(caps.businessDecisionTableImplemented, true);

    const rule1 = makeRule(
      "tx-step-1",
      "Step 1",
      [{ field: "amount", operator: "gte", value: 100 }],
      [{ type: "set-value", target: "status", value: "pre-approved" }],
    );
    const rule2 = makeRule(
      "tx-step-2",
      "Step 2",
      [{ field: "status", operator: "eq", value: "pre-approved" }],
      [{ type: "set-value", target: "status", value: "approved" }],
    );

    await adapter.registerRule({ rule: rule1 });
    await adapter.registerRule({ rule: rule2 });

    const result = await adapter.executeTransaction({
      transactionId: "tx-001",
      steps: [
        {
          kind: "canonical-business-transaction-step",
          stepId: "s1",
          ruleId: "tx-step-1",
          facts: { amount: 200 },
        },
        {
          kind: "canonical-business-transaction-step",
          stepId: "s2",
          ruleId: "tx-step-2",
          facts: { status: "pre-approved" },
        },
      ],
    });

    assert.equal(result.ok, true);
    assert.equal(result.committed, true);
    assert.equal(result.stepResults.length, 2);
    assert.equal(result.output.status, "approved");
  });

  it("interrompe e não confirma quando passo falha", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const rule1 = makeRule(
      "fail-step",
      "Fail step",
      [{ field: "amount", operator: "lt", value: 0 }],
      [{ type: "deny" }],
    );
    const rule2 = makeRule("never-runs", "Never runs", [], [{ type: "allow" }]);

    await adapter.registerRule({ rule: rule1 });
    await adapter.registerRule({ rule: rule2 });

    const result = await adapter.executeTransaction({
      transactionId: "tx-002",
      steps: [
        {
          kind: "canonical-business-transaction-step",
          stepId: "s1",
          ruleId: "fail-step",
          facts: { amount: -1 },
        },
        {
          kind: "canonical-business-transaction-step",
          stepId: "s2",
          ruleId: "never-runs",
          facts: {},
        },
      ],
    });

    assert.equal(result.ok, false);
    assert.equal(result.committed, false);
    assert.equal(result.stepResults.length, 1);
    assert.equal(result.code, "BUSINESS_TRANSACTION_ROLLED_BACK");
  });

  it("retorna erro ao referenciar regra inexistente na transação", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    await assert.rejects(
      adapter.executeTransaction({
        transactionId: "tx-003",
        steps: [
          {
            kind: "canonical-business-transaction-step",
            stepId: "s1",
            ruleId: "missing",
            facts: {},
          },
        ],
      }),
    );
  });

  it("engine puro executa transação sequencial", () => {
    const engine = new BusinessTransactionEngine();
    const rule = makeRule(
      "r1",
      "Set",
      [{ field: "x", operator: "eq", value: 1 }],
      [{ type: "set-value", target: "y", value: 2 }],
    );
    const result = engine.execute({
      transactionId: "tx-pure",
      steps: [
        { stepId: "s1", rule, facts: { x: 1 } },
        { stepId: "s2", rule, facts: { x: 1 } },
      ],
    });
    assert.equal(result.ok, true);
    assert.equal(result.committed, true);
    assert.equal(result.stepResults.length, 2);
    assert.equal(result.output.y, 2);
  });

  it("reutiliza BusinessRuleExecutionEngine e BusinessRuleCatalog", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const rule = makeRule(
      "reused",
      "Reused",
      [{ field: "x", operator: "eq", value: 1 }],
      [{ type: "allow" }],
    );
    await adapter.registerRule({ rule });
    const exec = await adapter.executeRule({ ruleId: "reused", facts: { x: 1 } });
    assert.equal(exec.ok, true);
    const tx = await adapter.executeTransaction({
      transactionId: "tx-reuse",
      steps: [
        {
          kind: "canonical-business-transaction-step",
          stepId: "s1",
          ruleId: "reused",
          facts: { x: 1 },
        },
      ],
    });
    assert.equal(tx.ok, true);
    assert.equal(tx.committed, true);
  });
});

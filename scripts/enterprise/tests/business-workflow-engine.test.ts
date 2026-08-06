/**
 * E-04 — Business Workflow functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  BusinessWorkflowEngine,
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

describe("E-04 Business Workflow — functional cases", () => {
  it("executa workflow com múltiplos estágios", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, E06_BUSINESS_ENGINE_CAPABILITIES);

    const rule1 = makeRule(
      "wf-rule-1",
      "Stage 1",
      [{ field: "x", operator: "eq", value: 1 }],
      [{ type: "set-value", target: "y", value: 2 }],
    );
    const rule2 = makeRule(
      "wf-rule-2",
      "Stage 2",
      [{ field: "y", operator: "eq", value: 2 }],
      [{ type: "set-value", target: "z", value: 3 }],
    );

    await adapter.registerRule({ rule: rule1 });
    await adapter.registerRule({ rule: rule2 });

    const result = await adapter.executeWorkflow({
      workflowId: "wf-001",
      stages: [
        {
          kind: "canonical-business-workflow-stage",
          stageId: "stage-1",
          transactionId: "tx-1",
          steps: [
            {
              kind: "canonical-business-transaction-step",
              stepId: "s1",
              ruleId: "wf-rule-1",
              facts: { x: 1 },
            },
          ],
        },
        {
          kind: "canonical-business-workflow-stage",
          stageId: "stage-2",
          transactionId: "tx-2",
          steps: [
            {
              kind: "canonical-business-transaction-step",
              stepId: "s2",
              ruleId: "wf-rule-2",
              facts: { y: 2 },
            },
          ],
        },
      ],
    });

    assert.equal(result.ok, true);
    assert.equal(result.completed, true);
    assert.equal(result.stageResults.length, 2);
    assert.equal(result.output.y, 2);
    assert.equal(result.output.z, 3);
  });

  it("interrompe workflow quando estágio falha", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const rule1 = makeRule(
      "wf-fail",
      "Fail",
      [{ field: "x", operator: "lt", value: 0 }],
      [{ type: "deny" }],
    );
    const rule2 = makeRule("wf-never", "Never", [], [{ type: "allow" }]);

    await adapter.registerRule({ rule: rule1 });
    await adapter.registerRule({ rule: rule2 });

    const result = await adapter.executeWorkflow({
      workflowId: "wf-002",
      stages: [
        {
          kind: "canonical-business-workflow-stage",
          stageId: "stage-1",
          transactionId: "tx-1",
          steps: [
            {
              kind: "canonical-business-transaction-step",
              stepId: "s1",
              ruleId: "wf-fail",
              facts: { x: -1 },
            },
          ],
        },
        {
          kind: "canonical-business-workflow-stage",
          stageId: "stage-2",
          transactionId: "tx-2",
          steps: [
            {
              kind: "canonical-business-transaction-step",
              stepId: "s2",
              ruleId: "wf-never",
              facts: {},
            },
          ],
        },
      ],
    });

    assert.equal(result.ok, false);
    assert.equal(result.completed, false);
    assert.equal(result.stageResults.length, 1);
    assert.equal(result.code, "BUSINESS_WORKFLOW_STOPPED");
  });

  it("engine puro executa workflow sem tocar no catálogo", () => {
    const engine = new BusinessWorkflowEngine();
    const rule = makeRule(
      "wf-pure",
      "Pure",
      [{ field: "x", operator: "eq", value: 1 }],
      [{ type: "set-value", target: "y", value: 2 }],
    );
    const result = engine.execute({
      workflowId: "wf-pure",
      stages: [
        {
          stageId: "stage-1",
          transactionId: "tx-1",
          steps: [{ stepId: "s1", rule, facts: { x: 1 } }],
        },
      ],
    });
    assert.equal(result.ok, true);
    assert.equal(result.completed, true);
    assert.equal(result.output.y, 2);
  });

  it("reutiliza BusinessTransactionEngine", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const rule = makeRule(
      "wf-reuse",
      "Reuse",
      [{ field: "x", operator: "eq", value: 1 }],
      [{ type: "allow" }],
    );
    await adapter.registerRule({ rule });

    const tx = await adapter.executeTransaction({
      transactionId: "tx-reuse",
      steps: [
        {
          kind: "canonical-business-transaction-step",
          stepId: "s1",
          ruleId: "wf-reuse",
          facts: { x: 1 },
        },
      ],
    });
    assert.equal(tx.ok, true);

    const wf = await adapter.executeWorkflow({
      workflowId: "wf-reuse",
      stages: [
        {
          kind: "canonical-business-workflow-stage",
          stageId: "stage-1",
          transactionId: "tx-reuse",
          steps: [
            {
              kind: "canonical-business-transaction-step",
              stepId: "s1",
              ruleId: "wf-reuse",
              facts: { x: 1 },
            },
          ],
        },
      ],
    });
    assert.equal(wf.ok, true);
    assert.equal(wf.completed, true);
  });

  it("port rejeita workflow com regra inexistente", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    await assert.rejects(
      adapter.executeWorkflow({
        workflowId: "wf-missing",
        stages: [
          {
            kind: "canonical-business-workflow-stage",
            stageId: "stage-1",
            transactionId: "tx-missing",
            steps: [
              {
                kind: "canonical-business-transaction-step",
                stepId: "s1",
                ruleId: "missing",
                facts: {},
              },
            ],
          },
        ],
      }),
    );
  });
});

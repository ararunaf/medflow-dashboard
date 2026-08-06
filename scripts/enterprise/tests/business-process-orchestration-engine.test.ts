/**
 * E-05 — Business Process Orchestration functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  BusinessProcessOrchestrationEngine,
  E07_BUSINESS_ENGINE_CAPABILITIES,
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

describe("E-05 Business Process Orchestration — functional cases", () => {
  it("executa orquestração com múltiplos workflows", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, E07_BUSINESS_ENGINE_CAPABILITIES);

    const rule1 = makeRule(
      "proc-rule-1",
      "Set A",
      [{ field: "x", operator: "eq", value: 1 }],
      [{ type: "set-value", target: "a", value: 1 }],
    );
    const rule2 = makeRule(
      "proc-rule-2",
      "Set B",
      [{ field: "a", operator: "eq", value: 1 }],
      [{ type: "set-value", target: "b", value: 2 }],
    );

    await adapter.registerRule({ rule: rule1 });
    await adapter.registerRule({ rule: rule2 });

    const result = await adapter.executeProcessOrchestration({
      orchestrationId: "orch-001",
      processes: [
        {
          kind: "canonical-business-process",
          processId: "p1",
          workflows: [
            {
              kind: "canonical-business-process-workflow",
              workflowId: "wf-1",
              stages: [
                {
                  kind: "canonical-business-workflow-stage",
                  stageId: "s1",
                  transactionId: "tx-1",
                  steps: [
                    {
                      kind: "canonical-business-transaction-step",
                      stepId: "step-1",
                      ruleId: "proc-rule-1",
                      facts: { x: 1 },
                    },
                  ],
                },
              ],
            },
            {
              kind: "canonical-business-process-workflow",
              workflowId: "wf-2",
              stages: [
                {
                  kind: "canonical-business-workflow-stage",
                  stageId: "s2",
                  transactionId: "tx-2",
                  steps: [
                    {
                      kind: "canonical-business-transaction-step",
                      stepId: "step-2",
                      ruleId: "proc-rule-2",
                      facts: { a: 1 },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    assert.equal(result.ok, true);
    assert.equal(result.completed, true);
    assert.equal(result.processResults.length, 2);
    assert.equal(result.output.a, 1);
    assert.equal(result.output.b, 2);
  });

  it("interrompe orquestração quando workflow falha", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const failRule = makeRule(
      "proc-fail",
      "Fail",
      [{ field: "x", operator: "lt", value: 0 }],
      [{ type: "deny" }],
    );
    const neverRule = makeRule("proc-never", "Never", [], [{ type: "allow" }]);

    await adapter.registerRule({ rule: failRule });
    await adapter.registerRule({ rule: neverRule });

    const result = await adapter.executeProcessOrchestration({
      orchestrationId: "orch-002",
      processes: [
        {
          kind: "canonical-business-process",
          processId: "p1",
          workflows: [
            {
              kind: "canonical-business-process-workflow",
              workflowId: "wf-1",
              stages: [
                {
                  kind: "canonical-business-workflow-stage",
                  stageId: "s1",
                  transactionId: "tx-1",
                  steps: [
                    {
                      kind: "canonical-business-transaction-step",
                      stepId: "step-1",
                      ruleId: "proc-fail",
                      facts: { x: -1 },
                    },
                  ],
                },
              ],
            },
            {
              kind: "canonical-business-process-workflow",
              workflowId: "wf-2",
              stages: [
                {
                  kind: "canonical-business-workflow-stage",
                  stageId: "s2",
                  transactionId: "tx-2",
                  steps: [
                    {
                      kind: "canonical-business-transaction-step",
                      stepId: "step-2",
                      ruleId: "proc-never",
                      facts: {},
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    assert.equal(result.ok, false);
    assert.equal(result.completed, false);
    assert.equal(result.processResults.length, 1);
    assert.equal(result.code, "BUSINESS_PROCESS_ORCHESTRATION_STOPPED");
  });

  it("engine puro executa orquestração sem tocar no catálogo", () => {
    const engine = new BusinessProcessOrchestrationEngine();
    const rule = makeRule(
      "pure-rule",
      "Set",
      [{ field: "x", operator: "eq", value: 1 }],
      [{ type: "set-value", target: "y", value: 2 }],
    );
    const result = engine.execute({
      orchestrationId: "pure-orch",
      processes: [
        {
          processId: "p1",
          workflows: [
            {
              workflowId: "wf-1",
              stages: [
                {
                  stageId: "s1",
                  transactionId: "tx-1",
                  steps: [{ stepId: "step-1", rule, facts: { x: 1 } }],
                },
              ],
            },
          ],
        },
      ],
    });
    assert.equal(result.ok, true);
    assert.equal(result.completed, true);
    assert.equal(result.output.y, 2);
  });

  it("reutiliza BusinessWorkflowEngine", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const rule = makeRule(
      "orch-reuse",
      "Reuse",
      [{ field: "x", operator: "eq", value: 1 }],
      [{ type: "allow" }],
    );
    await adapter.registerRule({ rule });

    const wf = await adapter.executeWorkflow({
      workflowId: "wf-reuse",
      stages: [
        {
          kind: "canonical-business-workflow-stage",
          stageId: "s1",
          transactionId: "tx-reuse",
          steps: [
            {
              kind: "canonical-business-transaction-step",
              stepId: "step-1",
              ruleId: "orch-reuse",
              facts: { x: 1 },
            },
          ],
        },
      ],
    });
    assert.equal(wf.ok, true);

    const orch = await adapter.executeProcessOrchestration({
      orchestrationId: "orch-reuse",
      processes: [
        {
          kind: "canonical-business-process",
          processId: "p1",
          workflows: [
            {
              kind: "canonical-business-process-workflow",
              workflowId: "wf-reuse",
              stages: [
                {
                  kind: "canonical-business-workflow-stage",
                  stageId: "s1",
                  transactionId: "tx-reuse",
                  steps: [
                    {
                      kind: "canonical-business-transaction-step",
                      stepId: "step-1",
                      ruleId: "orch-reuse",
                      facts: { x: 1 },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
    assert.equal(orch.ok, true);
    assert.equal(orch.completed, true);
  });

  it("port rejeita orquestração com regra inexistente", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    await assert.rejects(
      adapter.executeProcessOrchestration({
        orchestrationId: "orch-missing",
        processes: [
          {
            kind: "canonical-business-process",
            processId: "p1",
            workflows: [
              {
                kind: "canonical-business-process-workflow",
                workflowId: "wf-missing",
                stages: [
                  {
                    kind: "canonical-business-workflow-stage",
                    stageId: "s1",
                    transactionId: "tx-missing",
                    steps: [
                      {
                        kind: "canonical-business-transaction-step",
                        stepId: "step-1",
                        ruleId: "missing",
                        facts: {},
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
    );
  });
});

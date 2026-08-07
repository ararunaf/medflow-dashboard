/**
 * E-10 — Generic Business Engine functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  DefaultBusinessEngineAdapter,
  E10_BUSINESS_ENGINE_CAPABILITIES,
  GenericBusinessEngine,
} from "../../../src/lib/enterprise/business-engine";

describe("E-10 Generic Business Engine — functional cases", () => {
  it("instancia GenericBusinessEngine", () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const generic = adapter.getGenericBusinessEngine();
    assert.ok(generic);
    assert.ok(generic.ruleCatalog);
    assert.ok(generic.ruleExecution);
    assert.ok(generic.transaction);
    assert.ok(generic.workflow);
    assert.ok(generic.processOrchestration);
    assert.ok(generic.decisionTable);
    assert.ok(generic.eventLog);
    assert.ok(generic.auditTrail);
    assert.ok(generic.businessReport);
  });

  it("executa Rule Catalog", () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const generic = adapter.getGenericBusinessEngine();
    const result = generic.ruleCatalog.register({
      kind: "canonical-business-rule",
      ruleId: "r-1",
      name: "rule one",
      version: "1.0.0",
      conditions: [{ kind: "canonical-business-rule-condition", operator: "eq", field: "x", value: 1 }],
      actions: [{ kind: "canonical-business-rule-action", type: "allow" }],
    });
    assert.equal(result.ok, true);
    assert.equal(generic.ruleCatalog.stats().totalRules, 1);
  });

  it("executa Rule Execution", () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const generic = adapter.getGenericBusinessEngine();
    generic.ruleCatalog.register({
      kind: "canonical-business-rule",
      ruleId: "r-2",
      name: "rule two",
      conditions: [{ kind: "canonical-business-rule-condition", operator: "eq", field: "x", value: 1 }],
      actions: [{ kind: "canonical-business-rule-action", type: "allow" }],
    });
    const result = generic.ruleExecution.execute(generic.ruleCatalog.find("r-2").rule!, { x: 1 });
    assert.equal(result.matched, true);
  });

  it("executa Transaction", () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const generic = adapter.getGenericBusinessEngine();
    generic.ruleCatalog.register({
      kind: "canonical-business-rule",
      ruleId: "r-3",
      name: "rule three",
      conditions: [{ kind: "canonical-business-rule-condition", operator: "eq", field: "x", value: 1 }],
      actions: [{ kind: "canonical-business-rule-action", type: "allow" }],
    });
    const result = generic.transaction.execute({
      transactionId: "tx-1",
      steps: [{ stepId: "s-1", rule: generic.ruleCatalog.find("r-3").rule!, facts: { x: 1 } }],
    });
    assert.equal(result.committed, true);
  });

  it("executa Workflow", () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const generic = adapter.getGenericBusinessEngine();
    generic.ruleCatalog.register({
      kind: "canonical-business-rule",
      ruleId: "r-4",
      name: "rule four",
      conditions: [{ kind: "canonical-business-rule-condition", operator: "eq", field: "x", value: 1 }],
      actions: [{ kind: "canonical-business-rule-action", type: "allow" }],
    });
    const result = generic.workflow.execute({
      workflowId: "wf-1",
      stages: [
        {
          stageId: "st-1",
          transactionId: "tx-2",
          steps: [{ stepId: "s-1", rule: generic.ruleCatalog.find("r-4").rule!, facts: { x: 1 } }],
        },
      ],
    });
    assert.equal(result.completed, true);
  });

  it("executa Process Orchestration", () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const generic = adapter.getGenericBusinessEngine();
    generic.ruleCatalog.register({
      kind: "canonical-business-rule",
      ruleId: "r-5",
      name: "rule five",
      conditions: [{ kind: "canonical-business-rule-condition", operator: "eq", field: "x", value: 1 }],
      actions: [{ kind: "canonical-business-rule-action", type: "allow" }],
    });
    const result = generic.processOrchestration.execute({
      orchestrationId: "orch-1",
      processes: [
        {
          processId: "p-1",
          workflows: [
            {
              workflowId: "wf-2",
              stages: [
                {
                  stageId: "st-1",
                  transactionId: "tx-3",
                  steps: [
                    { stepId: "s-1", rule: generic.ruleCatalog.find("r-5").rule!, facts: { x: 1 } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
    assert.equal(result.completed, true);
  });

  it("executa Decision Table", () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const generic = adapter.getGenericBusinessEngine();
    generic.ruleCatalog.register({
      kind: "canonical-business-rule",
      ruleId: "r-6",
      name: "rule six",
      conditions: [{ kind: "canonical-business-rule-condition", operator: "eq", field: "x", value: 1 }],
      actions: [{ kind: "canonical-business-rule-action", type: "allow" }],
    });
    generic.decisionTable.register({
      kind: "canonical-business-decision-table",
      tableId: "dt-1",
      name: "table one",
      rows: ["r-6"],
    });
    const result = generic.decisionTable.execute("dt-1", { x: 1 });
    assert.equal(result.matched, true);
  });

  it("consulta Event Log", () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const generic = adapter.getGenericBusinessEngine();
    generic.eventLog.register({
      kind: "canonical-business-event",
      eventId: "evt-1",
      eventType: "rule-executed",
      timestamp: 1_000_000_000,
      correlationId: "c-1",
      transactionId: "t-1",
      payload: {},
    });
    assert.equal(generic.eventLog.listByType("rule-executed").length, 1);
  });

  it("consulta Audit Trail", () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const generic = adapter.getGenericBusinessEngine();
    generic.eventLog.register({
      kind: "canonical-business-event",
      eventId: "evt-2",
      eventType: "rule-executed",
      timestamp: 1_000_000_000,
      correlationId: "c-2",
      transactionId: "t-2",
      payload: {},
    });
    generic.auditTrail.create("audit-2", "c-2", "t-2");
    const trail = generic.auditTrail.findByTransactionId("t-2");
    assert.ok(trail);
    assert.equal(trail!.entries.length, 1);
  });

  it("gera Business Report", () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const generic = adapter.getGenericBusinessEngine();
    generic.ruleCatalog.register({
      kind: "canonical-business-rule",
      ruleId: "r-7",
      name: "rule seven",
      conditions: [{ kind: "canonical-business-rule-condition", operator: "eq", field: "x", value: 1 }],
      actions: [{ kind: "canonical-business-rule-action", type: "allow" }],
    });
    const report = generic.businessReport.generate("report-7");
    assert.equal(report.summary.totalRules, 1);
  });

  it("Port expõe capability corretamente", () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, E10_BUSINESS_ENGINE_CAPABILITIES);
    assert.equal(caps.businessEngineImplemented, true);
    assert.equal(caps.businessRuleCatalogImplemented, true);
    assert.equal(caps.businessRuleExecutionImplemented, true);
    assert.equal(caps.businessTransactionImplemented, true);
    assert.equal(caps.businessWorkflowImplemented, true);
    assert.equal(caps.businessProcessOrchestrationImplemented, true);
    assert.equal(caps.businessDecisionTableImplemented, true);
    assert.equal(caps.businessEventLogImplemented, true);
    assert.equal(caps.businessAuditTrailImplemented, true);
    assert.equal(caps.businessReportImplemented, true);
  });
});



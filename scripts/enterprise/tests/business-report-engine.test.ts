/**
 * E-09 — Business Report functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  BusinessAuditTrailEngine,
  BusinessEventLogEngine,
  BusinessReportEngine,
  BusinessRuleCatalog,
  BusinessDecisionTableEngine,
  E10_BUSINESS_ENGINE_CAPABILITIES,
} from "../../../src/lib/enterprise/business-engine";
import { DefaultBusinessEngineAdapter } from "../../../src/lib/enterprise/business-engine/adapters/default-business-engine-adapter";
import type { CanonicalBusinessEvent } from "../../../src/lib/enterprise/business-engine/ports";

function makeEvent(
  eventId: string,
  eventType: string,
  timestamp: number,
  correlationId: string,
  transactionId: string,
  payload: Record<string, unknown> = {},
): CanonicalBusinessEvent {
  return {
    kind: "canonical-business-event",
    eventId,
    eventType,
    timestamp,
    correlationId,
    transactionId,
    payload,
  };
}

describe("E-09 Business Report — functional cases", () => {
  it("gera relatório consolidado", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    await adapter.registerRule({
      rule: {
        kind: "canonical-business-rule",
        ruleId: "r-1",
        name: "rule one",
        condition: { operator: "eq", field: "x", value: 1 },
        actions: [{ kind: "allow" }],
      },
    });
    await adapter.registerEvent({
      event: makeEvent("evt-1", "rule-executed", 1_000_000_000, "corr-1", "tx-1"),
    });
    await adapter.createAuditTrail({
      auditId: "audit-1",
      correlationId: "corr-1",
      transactionId: "tx-1",
    });
    const result = await adapter.generateReport({ reportId: "report-1", scope: {} });
    assert.equal(result.ok, true);
    assert.equal(result.report?.reportId, "report-1");
    assert.equal(result.report?.summary.totalRules, 1);
    assert.equal(result.report?.summary.totalEvents, 1);
    assert.equal(result.report?.summary.totalAuditTrailEntries, 1);
  });

  it("consolida estatísticas", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    await adapter.registerEvent({
      event: makeEvent("evt-a", "rule-executed", 1_000_000_000, "c-2", "t-2"),
    });
    await adapter.registerEvent({
      event: makeEvent("evt-b", "rule-executed", 1_000_000_100, "c-2", "t-2"),
    });
    await adapter.registerEvent({
      event: makeEvent("evt-c", "transaction-committed", 1_000_000_200, "c-2", "t-2"),
    });
    const result = await adapter.generateReport({ reportId: "report-2", scope: {} });
    assert.equal(result.report?.summary["rule-executed"], 2);
    assert.equal(result.report?.summary["transaction-committed"], 1);
  });

  it("reutiliza BusinessAuditTrailEngine e BusinessEventLogEngine", () => {
    const eventLog = new BusinessEventLogEngine();
    eventLog.register(makeEvent("evt-1", "rule-executed", 1_000_000_000, "c-3", "t-3"));
    eventLog.register(makeEvent("evt-2", "rule-executed", 1_000_000_100, "c-3", "t-3"));

    const auditTrail = new BusinessAuditTrailEngine(eventLog);
    auditTrail.create("audit-3", "c-3", "t-3");

    const catalog = new BusinessRuleCatalog();
    const decisionTable = new BusinessDecisionTableEngine(catalog);

    const report = new BusinessReportEngine(eventLog, auditTrail, catalog, decisionTable);
    const result = report.generate("report-3");

    assert.equal(result.summary.totalEvents, 2);
    assert.equal(result.summary.totalAuditTrailEntries, 2);
  });

  it("relatório vazio permanece válido", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const result = await adapter.generateReport({ reportId: "empty-report" });
    assert.ok(result.ok);
    assert.equal(result.report?.summary.totalRules, 0);
    assert.equal(result.report?.summary.totalEvents, 0);
    assert.equal(result.report?.summary.totalAuditTrailEntries, 0);
    assert.equal(result.report?.summary.totalDecisionTables, 0);
  });

  it("filtra por escopo correlationId e transactionId", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    await adapter.registerEvent({
      event: makeEvent("evt-x", "rule-executed", 1_000_000_000, "c-4", "t-4"),
    });
    await adapter.registerEvent({
      event: makeEvent("evt-y", "rule-executed", 1_000_000_100, "c-5", "t-5"),
    });
    const result = await adapter.generateReport({
      reportId: "scoped-report",
      scope: { correlationId: "c-4", transactionId: "t-4" },
    });
    assert.equal(result.report?.summary.totalEvents, 1);
    assert.equal(result.report?.summary["rule-executed"], 1);
  });

  it("Port expõe capability corretamente", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, E10_BUSINESS_ENGINE_CAPABILITIES);
    assert.equal(caps.businessReportImplemented, true);
    assert.equal(caps.businessAuditTrailImplemented, true);
    assert.equal(caps.businessEventLogImplemented, true);
    assert.equal(caps.businessDecisionTableImplemented, true);
    assert.equal(caps.businessRuleCatalogImplemented, true);
    assert.equal(caps.businessRuleExecutionImplemented, true);
    assert.equal(caps.businessTransactionImplemented, true);
    assert.equal(caps.businessWorkflowImplemented, true);
    assert.equal(caps.businessProcessOrchestrationImplemented, true);
    assert.equal(caps.businessEngineImplemented, true);
  });
});

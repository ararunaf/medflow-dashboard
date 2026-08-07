/**
 * E-08 — Business Audit Trail functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  BusinessAuditTrailEngine,
  BusinessEventLogEngine,
  E09_BUSINESS_ENGINE_CAPABILITIES,
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

describe("E-08 Business Audit Trail — functional cases", () => {
  it("cria Audit Trail", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    await adapter.registerEvent({
      event: makeEvent("evt-1", "rule-executed", 1_000_000_000, "corr-1", "tx-1"),
    });
    const result = await adapter.createAuditTrail({
      auditId: "audit-1",
      correlationId: "corr-1",
      transactionId: "tx-1",
    });
    assert.equal(result.ok, true);
  });

  it("recupera por correlationId", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    await adapter.registerEvent({
      event: makeEvent("evt-2", "rule-executed", 1_000_000_100, "corr-2", "tx-2"),
    });
    await adapter.createAuditTrail({
      auditId: "audit-2",
      correlationId: "corr-2",
      transactionId: "tx-2",
    });
    const trail = await adapter.findAuditTrailByCorrelationId({ correlationId: "corr-2" });
    assert.ok(trail);
    assert.equal(trail?.auditId, "audit-2");
    assert.equal(trail?.entries.length, 1);
  });

  it("recupera por transactionId", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    await adapter.registerEvent({
      event: makeEvent("evt-3", "transaction-committed", 1_000_000_200, "corr-3", "tx-3"),
    });
    await adapter.createAuditTrail({
      auditId: "audit-3",
      correlationId: "corr-3",
      transactionId: "tx-3",
    });
    const trail = await adapter.findAuditTrailByTransactionId({ transactionId: "tx-3" });
    assert.ok(trail);
    assert.equal(trail?.entries[0].eventType, "transaction-committed");
  });

  it("preserva ordem cronológica", () => {
    const eventLog = new BusinessEventLogEngine();
    eventLog.register(makeEvent("evt-a", "step", 1_000_000_300, "c", "t"));
    eventLog.register(makeEvent("evt-b", "step", 1_000_000_100, "c", "t"));
    eventLog.register(makeEvent("evt-c", "step", 1_000_000_200, "c", "t"));

    const audit = new BusinessAuditTrailEngine(eventLog);
    audit.create("audit-c", "c", "t");
    const trail = audit.findByCorrelationId("c");
    assert.equal(trail?.entries[0].eventId, "evt-b");
    assert.equal(trail?.entries[1].eventId, "evt-c");
    assert.equal(trail?.entries[2].eventId, "evt-a");
  });

  it("reutiliza BusinessEventLogEngine", () => {
    const eventLog = new BusinessEventLogEngine();
    eventLog.register(makeEvent("evt-r", "step", 1_000_000_000, "c-r", "t-r"));
    const audit = new BusinessAuditTrailEngine(eventLog);
    audit.create("audit-r", "c-r", "t-r");
    const trail = audit.findByTransactionId("t-r");
    assert.equal(trail?.entries.length, 1);
    assert.equal(trail?.entries[0].eventId, "evt-r");
  });

  it("Port expõe capability corretamente", () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, E09_BUSINESS_ENGINE_CAPABILITIES);
    assert.equal(caps.businessAuditTrailImplemented, true);
    assert.equal(caps.businessReportImplemented, true);
    assert.equal(caps.businessEventLogImplemented, true);
    assert.equal(caps.businessDecisionTableImplemented, true);
    assert.equal(caps.businessProcessOrchestrationImplemented, true);
    assert.equal(caps.businessWorkflowImplemented, true);
    assert.equal(caps.businessTransactionImplemented, true);
    assert.equal(caps.businessRuleExecutionImplemented, true);
    assert.equal(caps.businessRuleCatalogImplemented, true);
    assert.equal(caps.businessEngineImplemented, false);
  });
});

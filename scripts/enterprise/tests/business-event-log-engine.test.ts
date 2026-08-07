/**
 * E-07 — Business Event Log functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  BusinessEventLogEngine,
  E08_BUSINESS_ENGINE_CAPABILITIES,
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

describe("E-07 Business Event Log — functional cases", () => {
  it("registra evento", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const event = makeEvent("evt-001", "rule-executed", 1_000_000_000, "corr-1", "tx-1");
    const result = await adapter.registerEvent({ event });
    assert.equal(result.ok, true);
  });

  it("recupera evento por eventId", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const event = makeEvent("evt-002", "rule-executed", 1_000_000_100, "corr-1", "tx-1");
    await adapter.registerEvent({ event });
    const found = await adapter.findEvent({ eventId: "evt-002" });
    assert.ok(found);
    assert.equal(found?.eventId, "evt-002");
  });

  it("lista eventos por tipo", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    await adapter.registerEvent({
      event: makeEvent("evt-003", "rule-executed", 1_000_000_200, "corr-1", "tx-1"),
    });
    await adapter.registerEvent({
      event: makeEvent("evt-004", "transaction-committed", 1_000_000_300, "corr-1", "tx-2"),
    });
    const ruleEvents = await adapter.listEventsByType({ eventType: "rule-executed" });
    assert.equal(ruleEvents.ok, true);
    assert.equal(ruleEvents.events.length, 1);
    assert.equal(ruleEvents.events[0].eventId, "evt-003");
  });

  it("lista eventos por correlationId e transactionId", async () => {
    const adapter = new DefaultBusinessEngineAdapter();
    await adapter.registerEvent({
      event: makeEvent("evt-005", "rule-executed", 1_000_000_400, "corr-2", "tx-3"),
    });
    await adapter.registerEvent({
      event: makeEvent("evt-006", "rule-executed", 1_000_000_500, "corr-2", "tx-3"),
    });
    await adapter.registerEvent({
      event: makeEvent("evt-007", "rule-executed", 1_000_000_600, "corr-3", "tx-4"),
    });

    const byCorrelation = await adapter.listEventsByCorrelationId({ correlationId: "corr-2" });
    assert.equal(byCorrelation.events.length, 2);

    const byTransaction = await adapter.listEventsByTransactionId({ transactionId: "tx-3" });
    assert.equal(byTransaction.events.length, 2);
  });

  it("mantém ordem cronológica", async () => {
    const engine = new BusinessEventLogEngine();
    const outOfOrder: CanonicalBusinessEvent[] = [
      makeEvent("evt-a", "step", 1_000_000_300, "c", "t"),
      makeEvent("evt-b", "step", 1_000_000_100, "c", "t"),
      makeEvent("evt-c", "step", 1_000_000_200, "c", "t"),
    ];
    for (const event of outOfOrder) {
      engine.register(event);
    }
    const all = engine.all();
    assert.equal(all[0].eventId, "evt-b");
    assert.equal(all[1].eventId, "evt-c");
    assert.equal(all[2].eventId, "evt-a");
  });

  it("Port expõe capability corretamente", () => {
    const adapter = new DefaultBusinessEngineAdapter();
    const caps = adapter.getCapabilities();
    assert.deepStrictEqual(caps, E08_BUSINESS_ENGINE_CAPABILITIES);
    assert.equal(caps.businessEventLogImplemented, true);
    assert.equal(caps.businessAuditTrailImplemented, true);
    assert.equal(caps.businessRuleCatalogImplemented, true);
    assert.equal(caps.businessRuleExecutionImplemented, true);
    assert.equal(caps.businessTransactionImplemented, true);
    assert.equal(caps.businessWorkflowImplemented, true);
    assert.equal(caps.businessProcessOrchestrationImplemented, true);
    assert.equal(caps.businessDecisionTableImplemented, true);
    assert.equal(caps.businessReportImplemented, false);
    assert.equal(caps.businessEngineImplemented, false);
  });
});

/**
 * H-01 — TISS Communication Engine functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  H01_TISS_INTEGRATION_CAPABILITIES,
  TissCommunicationEngine,
} from "../../../src/lib/enterprise/tiss-integration-engine/communication";

const CAPABILITY_KEYS = [
  "tissCommunicationImplemented",
  "tissSoapImplemented",
  "tissAuthenticationImplemented",
  "tissSubmissionImplemented",
  "tissBatchImplemented",
  "tissReturnProcessingImplemented",
  "tissStatusTrackingImplemented",
  "tissRetryImplemented",
  "tissAuditImplemented",
  "tissIntegrationEngineImplemented",
] as const;

function channelFixture(channelId: string, operatorId: string) {
  return {
    kind: "tiss-communication-channel" as const,
    channelId,
    operatorId,
    operatorName: `Operator ${operatorId}`,
    name: `Channel ${channelId}`,
    protocol: "https" as const,
    endpoint: `https://${operatorId}.example.com/tiss`,
    tags: ["tiss", "communication"],
  };
}

describe("H-01 TISS Communication Engine — functional cases", () => {
  it("registra canal de comunicação TISS", async () => {
    const engine = new TissCommunicationEngine();
    const result = engine.registerChannel(channelFixture("ch-1", "op-1"));
    assert.equal(result.ok, true);
    assert.equal(result.channelId, "ch-1");
    assert.equal(result.code, "TISS_COMMUNICATION_CHANNEL_REGISTERED");
  });

  it("rejeita canal sem id", async () => {
    const engine = new TissCommunicationEngine();
    const result = engine.registerChannel({
      ...channelFixture("ch-1", "op-1"),
      channelId: "",
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_COMMUNICATION_INVALID_CHANNEL_ID");
  });

  it("rejeita canal sem operadora", async () => {
    const engine = new TissCommunicationEngine();
    const result = engine.registerChannel({
      ...channelFixture("ch-1", "op-1"),
      operatorId: "",
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_COMMUNICATION_INVALID_OPERATOR_ID");
  });

  it("rejeita canal sem nome", async () => {
    const engine = new TissCommunicationEngine();
    const result = engine.registerChannel({
      ...channelFixture("ch-1", "op-1"),
      name: "",
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_COMMUNICATION_INVALID_NAME");
  });

  it("encontra canal registrado", async () => {
    const engine = new TissCommunicationEngine();
    engine.registerChannel(channelFixture("ch-1", "op-1"));
    const found = engine.findChannel("ch-1");
    assert.ok(found);
    assert.equal(found?.channelId, "ch-1");
    assert.equal(found?.operatorId, "op-1");
  });

  it("lista canais por operadora", async () => {
    const engine = new TissCommunicationEngine();
    engine.registerChannel(channelFixture("ch-1", "op-1"));
    engine.registerChannel(channelFixture("ch-2", "op-1"));
    engine.registerChannel(channelFixture("ch-3", "op-2"));
    const result = engine.listChannels("op-1");
    assert.equal(result.length, 2);
    assert.ok(result.every((c) => c.operatorId === "op-1"));
  });

  it("gera estatísticas de canais", async () => {
    const engine = new TissCommunicationEngine();
    engine.registerChannel(channelFixture("ch-1", "op-1"));
    engine.registerChannel(channelFixture("ch-2", "op-2"));
    const stats = engine.stats();
    assert.equal(stats.totalChannels, 2);
    assert.equal(stats.operatorIds.length, 2);
    assert.equal(stats.channelIds.length, 2);
  });

  it("apenas tissCommunicationImplemented está ativa", async () => {
    const capabilities = H01_TISS_INTEGRATION_CAPABILITIES;
    assert.equal(capabilities.tissCommunicationImplemented, true);
    for (const key of CAPABILITY_KEYS) {
      if (key !== "tissCommunicationImplemented") {
        assert.equal(capabilities[key], false, `${key} deve permanecer false`);
      }
    }
  });

  it("engine expõe capabilities corretas", async () => {
    const engine = new TissCommunicationEngine();
    const capabilities = engine.getCapabilities();
    assert.equal(capabilities.tissCommunicationImplemented, true);
    assert.equal(capabilities.tissSoapImplemented, false);
    assert.equal(capabilities.tissIntegrationEngineImplemented, false);
  });
});

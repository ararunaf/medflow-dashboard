/**
 * H-02 — TISS SOAP Engine functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  H02_TISS_INTEGRATION_CAPABILITIES,
  TissCommunicationEngine,
  TissSoapEngine,
} from "../../../src/lib/enterprise/tiss-integration-engine";

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

function endpointFixture(endpointId: string, channelId: string) {
  return {
    kind: "tiss-soap-endpoint" as const,
    endpointId,
    channelId,
    name: `SOAP ${endpointId}`,
    endpoint: `https://operator.example.com/tiss/${endpointId}`,
    soapVersion: "1.2" as const,
  };
}

describe("H-02 TISS SOAP Engine — functional cases", () => {
  it("registra endpoint SOAP vinculado a canal existente", async () => {
    const communication = new TissCommunicationEngine();
    communication.registerChannel(channelFixture("ch-1", "op-1"));
    const engine = new TissSoapEngine(communication);
    const result = engine.registerSoapEndpoint(endpointFixture("ep-1", "ch-1"));
    assert.equal(result.ok, true);
    assert.equal(result.endpointId, "ep-1");
    assert.equal(result.code, "TISS_SOAP_ENDPOINT_REGISTERED");
  });

  it("rejeita endpoint sem id", async () => {
    const engine = new TissSoapEngine();
    const result = engine.registerSoapEndpoint({
      ...endpointFixture("ep-1", "ch-1"),
      endpointId: "",
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_SOAP_INVALID_ENDPOINT_ID");
  });

  it("rejeita endpoint sem canal", async () => {
    const engine = new TissSoapEngine();
    const result = engine.registerSoapEndpoint(endpointFixture("ep-1", "ch-1"));
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_SOAP_CHANNEL_NOT_FOUND");
  });

  it("rejeita endpoint sem nome", async () => {
    const engine = new TissSoapEngine();
    const result = engine.registerSoapEndpoint({
      ...endpointFixture("ep-1", "ch-1"),
      name: "",
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_SOAP_INVALID_NAME");
  });

  it("rejeita endpoint sem endpoint URL", async () => {
    const engine = new TissSoapEngine();
    const result = engine.registerSoapEndpoint({
      ...endpointFixture("ep-1", "ch-1"),
      endpoint: "",
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_SOAP_INVALID_ENDPOINT");
  });

  it("encontra endpoint SOAP registrado", async () => {
    const communication = new TissCommunicationEngine();
    communication.registerChannel(channelFixture("ch-1", "op-1"));
    const engine = new TissSoapEngine(communication);
    engine.registerSoapEndpoint(endpointFixture("ep-1", "ch-1"));
    const found = engine.findSoapEndpoint("ep-1");
    assert.ok(found);
    assert.equal(found?.endpointId, "ep-1");
  });

  it("lista endpoints por canal", async () => {
    const communication = new TissCommunicationEngine();
    communication.registerChannel(channelFixture("ch-1", "op-1"));
    communication.registerChannel(channelFixture("ch-2", "op-2"));
    const engine = new TissSoapEngine(communication);
    engine.registerSoapEndpoint(endpointFixture("ep-1", "ch-1"));
    engine.registerSoapEndpoint(endpointFixture("ep-2", "ch-1"));
    engine.registerSoapEndpoint(endpointFixture("ep-3", "ch-2"));
    const result = engine.listSoapEndpoints("ch-1");
    assert.equal(result.length, 2);
    assert.ok(result.every((e) => e.channelId === "ch-1"));
  });

  it("gera estatísticas de endpoints", async () => {
    const communication = new TissCommunicationEngine();
    communication.registerChannel(channelFixture("ch-1", "op-1"));
    communication.registerChannel(channelFixture("ch-2", "op-2"));
    const engine = new TissSoapEngine(communication);
    engine.registerSoapEndpoint(endpointFixture("ep-1", "ch-1"));
    engine.registerSoapEndpoint(endpointFixture("ep-2", "ch-2"));
    const stats = engine.stats();
    assert.equal(stats.totalEndpoints, 2);
    assert.equal(stats.channelIds.length, 2);
  });

  it("reutiliza TissCommunicationEngine", async () => {
    const communication = new TissCommunicationEngine();
    communication.registerChannel(channelFixture("ch-1", "op-1"));
    const engine = new TissSoapEngine(communication);
    const result = engine.registerSoapEndpoint(endpointFixture("ep-1", "ch-1"));
    assert.equal(result.ok, true);
    assert.ok(result.endpoint);
  });

  it("apenas tissCommunicationImplemented e tissSoapImplemented estão ativas", async () => {
    const capabilities = H02_TISS_INTEGRATION_CAPABILITIES;
    assert.equal(capabilities.tissCommunicationImplemented, true);
    assert.equal(capabilities.tissSoapImplemented, true);
    for (const key of CAPABILITY_KEYS) {
      if (key !== "tissCommunicationImplemented" && key !== "tissSoapImplemented") {
        assert.equal(capabilities[key], false, `${key} deve permanecer false`);
      }
    }
  });

  it("engine expõe capabilities H-02 corretas", async () => {
    const engine = new TissSoapEngine();
    const capabilities = engine.getCapabilities();
    assert.equal(capabilities.tissCommunicationImplemented, true);
    assert.equal(capabilities.tissSoapImplemented, true);
    assert.equal(capabilities.tissAuthenticationImplemented, false);
    assert.equal(capabilities.tissIntegrationEngineImplemented, false);
  });
});

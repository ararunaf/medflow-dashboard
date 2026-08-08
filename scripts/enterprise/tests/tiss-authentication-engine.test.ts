/**
 * H-03 — TISS Authentication Engine functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  H03_TISS_INTEGRATION_CAPABILITIES,
  TissAuthenticationEngine,
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

function credentialFixture(
  credentialId: string,
  channelId: string,
  endpointId?: string,
) {
  return {
    kind: "tiss-authentication-credential" as const,
    credentialId,
    channelId,
    endpointId,
    name: `Credential ${credentialId}`,
    credentialType: "username-password" as const,
    metadata: { username: "user" },
  };
}

describe("H-03 TISS Authentication Engine — functional cases", () => {
  it("registra credencial vinculada a canal e endpoint existentes", async () => {
    const communication = new TissCommunicationEngine();
    communication.registerChannel(channelFixture("ch-1", "op-1"));
    const soap = new TissSoapEngine(communication);
    soap.registerSoapEndpoint(endpointFixture("ep-1", "ch-1"));
    const engine = new TissAuthenticationEngine(communication, soap);
    const result = engine.registerCredential(credentialFixture("cred-1", "ch-1", "ep-1"));
    assert.equal(result.ok, true);
    assert.equal(result.credentialId, "cred-1");
    assert.equal(result.code, "TISS_AUTH_CREDENTIAL_REGISTERED");
  });

  it("registra credencial sem endpoint opcional vinculado a canal existente", async () => {
    const communication = new TissCommunicationEngine();
    communication.registerChannel(channelFixture("ch-1", "op-1"));
    const engine = new TissAuthenticationEngine(communication);
    const result = engine.registerCredential(credentialFixture("cred-2", "ch-1"));
    assert.equal(result.ok, true);
    assert.equal(result.credentialId, "cred-2");
  });

  it("rejeita credencial sem id", async () => {
    const engine = new TissAuthenticationEngine();
    const result = engine.registerCredential({
      ...credentialFixture("cred-1", "ch-1"),
      credentialId: "",
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_AUTH_INVALID_CREDENTIAL_ID");
  });

  it("rejeita credencial sem canal", async () => {
    const engine = new TissAuthenticationEngine();
    const result = engine.registerCredential({
      ...credentialFixture("cred-1", ""),
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_AUTH_INVALID_CHANNEL_ID");
  });

  it("rejeita credencial sem nome", async () => {
    const engine = new TissAuthenticationEngine();
    const result = engine.registerCredential({
      ...credentialFixture("cred-1", "ch-1"),
      name: "",
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_AUTH_INVALID_NAME");
  });

  it("rejeita credencial para canal inexistente", async () => {
    const engine = new TissAuthenticationEngine();
    const result = engine.registerCredential(credentialFixture("cred-1", "ch-1"));
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_AUTH_CHANNEL_NOT_FOUND");
  });

  it("rejeita credencial para endpoint inexistente", async () => {
    const communication = new TissCommunicationEngine();
    communication.registerChannel(channelFixture("ch-1", "op-1"));
    const engine = new TissAuthenticationEngine(communication);
    const result = engine.registerCredential(credentialFixture("cred-1", "ch-1", "ep-1"));
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_AUTH_ENDPOINT_NOT_FOUND");
  });

  it("encontra credencial registrada", async () => {
    const communication = new TissCommunicationEngine();
    communication.registerChannel(channelFixture("ch-1", "op-1"));
    const engine = new TissAuthenticationEngine(communication);
    engine.registerCredential(credentialFixture("cred-1", "ch-1"));
    const found = engine.findCredential("cred-1");
    assert.ok(found);
    assert.equal(found?.credentialId, "cred-1");
  });

  it("lista credenciais por canal", async () => {
    const communication = new TissCommunicationEngine();
    communication.registerChannel(channelFixture("ch-1", "op-1"));
    communication.registerChannel(channelFixture("ch-2", "op-2"));
    const engine = new TissAuthenticationEngine(communication);
    engine.registerCredential(credentialFixture("cred-1", "ch-1"));
    engine.registerCredential(credentialFixture("cred-2", "ch-1"));
    engine.registerCredential(credentialFixture("cred-3", "ch-2"));
    const result = engine.listCredentials("ch-1");
    assert.equal(result.length, 2);
    assert.ok(result.every((c) => c.channelId === "ch-1"));
  });

  it("gera estatísticas de credenciais", async () => {
    const communication = new TissCommunicationEngine();
    communication.registerChannel(channelFixture("ch-1", "op-1"));
    communication.registerChannel(channelFixture("ch-2", "op-2"));
    const engine = new TissAuthenticationEngine(communication);
    engine.registerCredential(credentialFixture("cred-1", "ch-1"));
    engine.registerCredential(credentialFixture("cred-2", "ch-2"));
    const stats = engine.stats();
    assert.equal(stats.totalCredentials, 2);
    assert.equal(stats.channelIds.length, 2);
    assert.equal(stats.credentialTypes[0], "username-password");
  });

  it("reutiliza TissCommunicationEngine e TissSoapEngine", async () => {
    const communication = new TissCommunicationEngine();
    communication.registerChannel(channelFixture("ch-1", "op-1"));
    const soap = new TissSoapEngine(communication);
    soap.registerSoapEndpoint(endpointFixture("ep-1", "ch-1"));
    const engine = new TissAuthenticationEngine(communication, soap);
    const result = engine.registerCredential(credentialFixture("cred-1", "ch-1", "ep-1"));
    assert.equal(result.ok, true);
    assert.ok(result.credential);
  });

  it("apenas tissCommunicationImplemented, tissSoapImplemented e tissAuthenticationImplemented estão ativas", async () => {
    const capabilities = H03_TISS_INTEGRATION_CAPABILITIES;
    assert.equal(capabilities.tissCommunicationImplemented, true);
    assert.equal(capabilities.tissSoapImplemented, true);
    assert.equal(capabilities.tissAuthenticationImplemented, true);
    for (const key of CAPABILITY_KEYS) {
      if (
        key !== "tissCommunicationImplemented" &&
        key !== "tissSoapImplemented" &&
        key !== "tissAuthenticationImplemented"
      ) {
        assert.equal(capabilities[key], false, `${key} deve permanecer false`);
      }
    }
  });

  it("engine expõe capabilities H-03 corretas", async () => {
    const engine = new TissAuthenticationEngine();
    const capabilities = engine.getCapabilities();
    assert.equal(capabilities.tissCommunicationImplemented, true);
    assert.equal(capabilities.tissSoapImplemented, true);
    assert.equal(capabilities.tissAuthenticationImplemented, true);
    assert.equal(capabilities.tissSubmissionImplemented, false);
  });
});

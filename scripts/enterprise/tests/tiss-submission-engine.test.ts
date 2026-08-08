/**
 * H-04 — TISS Submission Engine functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  H04_TISS_INTEGRATION_CAPABILITIES,
  TissAuthenticationEngine,
  TissCommunicationEngine,
  TissSoapEngine,
  TissSubmissionEngine,
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

function credentialFixture(credentialId: string, channelId: string, endpointId: string) {
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

function submissionFixture(submissionId: string, channelId: string, endpointId: string, credentialId: string) {
  return {
    kind: "tiss-submission" as const,
    submissionId,
    channelId,
    endpointId,
    credentialId,
    name: `Submission ${submissionId}`,
    submissionType: "individual" as const,
    metadata: { payload: "test" },
  };
}

function prepareDependencies() {
  const communication = new TissCommunicationEngine();
  communication.registerChannel(channelFixture("ch-1", "op-1"));
  const soap = new TissSoapEngine(communication);
  soap.registerSoapEndpoint(endpointFixture("ep-1", "ch-1"));
  const authentication = new TissAuthenticationEngine(communication, soap);
  authentication.registerCredential(credentialFixture("cred-1", "ch-1", "ep-1"));
  return { communication, soap, authentication };
}

describe("H-04 TISS Submission Engine — functional cases", () => {
  it("registra submissão vinculada a canal, endpoint e credencial existentes", async () => {
    const { communication, soap, authentication } = prepareDependencies();
    const engine = new TissSubmissionEngine(communication, soap, authentication);
    const result = engine.registerSubmission(submissionFixture("sub-1", "ch-1", "ep-1", "cred-1"));
    assert.equal(result.ok, true);
    assert.equal(result.submissionId, "sub-1");
    assert.equal(result.code, "TISS_SUBMISSION_REGISTERED");
  });

  it("rejeita submissão sem id", async () => {
    const { communication, soap, authentication } = prepareDependencies();
    const engine = new TissSubmissionEngine(communication, soap, authentication);
    const result = engine.registerSubmission({
      ...submissionFixture("sub-1", "ch-1", "ep-1", "cred-1"),
      submissionId: "",
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_SUBMISSION_INVALID_SUBMISSION_ID");
  });

  it("rejeita submissão sem canal", async () => {
    const { communication, soap, authentication } = prepareDependencies();
    const engine = new TissSubmissionEngine(communication, soap, authentication);
    const result = engine.registerSubmission({
      ...submissionFixture("sub-1", "ch-1", "ep-1", "cred-1"),
      channelId: "",
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_SUBMISSION_INVALID_CHANNEL_ID");
  });

  it("rejeita submissão sem endpoint", async () => {
    const { communication, soap, authentication } = prepareDependencies();
    const engine = new TissSubmissionEngine(communication, soap, authentication);
    const result = engine.registerSubmission({
      ...submissionFixture("sub-1", "ch-1", "ep-1", "cred-1"),
      endpointId: "",
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_SUBMISSION_INVALID_ENDPOINT_ID");
  });

  it("rejeita submissão sem credencial", async () => {
    const { communication, soap, authentication } = prepareDependencies();
    const engine = new TissSubmissionEngine(communication, soap, authentication);
    const result = engine.registerSubmission({
      ...submissionFixture("sub-1", "ch-1", "ep-1", "cred-1"),
      credentialId: "",
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_SUBMISSION_INVALID_CREDENTIAL_ID");
  });

  it("rejeita submissão sem nome", async () => {
    const { communication, soap, authentication } = prepareDependencies();
    const engine = new TissSubmissionEngine(communication, soap, authentication);
    const result = engine.registerSubmission({
      ...submissionFixture("sub-1", "ch-1", "ep-1", "cred-1"),
      name: "",
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_SUBMISSION_INVALID_NAME");
  });

  it("rejeita submissão para canal inexistente", async () => {
    const { communication, soap, authentication } = prepareDependencies();
    const engine = new TissSubmissionEngine(communication, soap, authentication);
    const result = engine.registerSubmission(submissionFixture("sub-1", "ch-2", "ep-1", "cred-1"));
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_SUBMISSION_CHANNEL_NOT_FOUND");
  });

  it("rejeita submissão para endpoint inexistente", async () => {
    const { communication, soap, authentication } = prepareDependencies();
    const engine = new TissSubmissionEngine(communication, soap, authentication);
    const result = engine.registerSubmission(submissionFixture("sub-1", "ch-1", "ep-2", "cred-1"));
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_SUBMISSION_ENDPOINT_NOT_FOUND");
  });

  it("rejeita submissão para credencial inexistente", async () => {
    const { communication, soap, authentication } = prepareDependencies();
    const engine = new TissSubmissionEngine(communication, soap, authentication);
    const result = engine.registerSubmission(submissionFixture("sub-1", "ch-1", "ep-1", "cred-2"));
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_SUBMISSION_CREDENTIAL_NOT_FOUND");
  });

  it("encontra submissão registrada", async () => {
    const { communication, soap, authentication } = prepareDependencies();
    const engine = new TissSubmissionEngine(communication, soap, authentication);
    engine.registerSubmission(submissionFixture("sub-1", "ch-1", "ep-1", "cred-1"));
    const found = engine.findSubmission("sub-1");
    assert.ok(found);
    assert.equal(found?.submissionId, "sub-1");
  });

  it("lista submissões por canal", async () => {
    const { communication, soap, authentication } = prepareDependencies();
    communication.registerChannel(channelFixture("ch-2", "op-2"));
    soap.registerSoapEndpoint(endpointFixture("ep-2", "ch-2"));
    authentication.registerCredential(credentialFixture("cred-2", "ch-2", "ep-2"));
    const engine = new TissSubmissionEngine(communication, soap, authentication);
    engine.registerSubmission(submissionFixture("sub-1", "ch-1", "ep-1", "cred-1"));
    engine.registerSubmission(submissionFixture("sub-2", "ch-1", "ep-1", "cred-1"));
    engine.registerSubmission(submissionFixture("sub-3", "ch-2", "ep-2", "cred-2"));
    const result = engine.listSubmissions("ch-1");
    assert.equal(result.length, 2);
    assert.ok(result.every((s) => s.channelId === "ch-1"));
  });

  it("gera estatísticas de submissões", async () => {
    const { communication, soap, authentication } = prepareDependencies();
    const engine = new TissSubmissionEngine(communication, soap, authentication);
    engine.registerSubmission(submissionFixture("sub-1", "ch-1", "ep-1", "cred-1"));
    const stats = engine.stats();
    assert.equal(stats.totalSubmissions, 1);
    assert.equal(stats.submissionTypes[0], "individual");
  });

  it("reutiliza TissCommunicationEngine, TissSoapEngine e TissAuthenticationEngine", async () => {
    const { communication, soap, authentication } = prepareDependencies();
    const engine = new TissSubmissionEngine(communication, soap, authentication);
    const result = engine.registerSubmission(submissionFixture("sub-1", "ch-1", "ep-1", "cred-1"));
    assert.equal(result.ok, true);
    assert.ok(result.submission);
  });

  it("apenas tissCommunicationImplemented, tissSoapImplemented, tissAuthenticationImplemented e tissSubmissionImplemented estão ativas", async () => {
    const capabilities = H04_TISS_INTEGRATION_CAPABILITIES;
    assert.equal(capabilities.tissCommunicationImplemented, true);
    assert.equal(capabilities.tissSoapImplemented, true);
    assert.equal(capabilities.tissAuthenticationImplemented, true);
    assert.equal(capabilities.tissSubmissionImplemented, true);
    for (const key of CAPABILITY_KEYS) {
      if (
        key !== "tissCommunicationImplemented" &&
        key !== "tissSoapImplemented" &&
        key !== "tissAuthenticationImplemented" &&
        key !== "tissSubmissionImplemented"
      ) {
        assert.equal(capabilities[key], false, `${key} deve permanecer false`);
      }
    }
  });

  it("engine expõe capabilities H-04 corretas", async () => {
    const engine = new TissSubmissionEngine();
    const capabilities = engine.getCapabilities();
    assert.equal(capabilities.tissCommunicationImplemented, true);
    assert.equal(capabilities.tissSoapImplemented, true);
    assert.equal(capabilities.tissAuthenticationImplemented, true);
    assert.equal(capabilities.tissSubmissionImplemented, true);
    assert.equal(capabilities.tissBatchImplemented, false);
  });
});

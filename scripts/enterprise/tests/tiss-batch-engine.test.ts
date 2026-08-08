/**
 * H-05 — TISS Batch Engine functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  H05_TISS_INTEGRATION_CAPABILITIES,
  TissAuthenticationEngine,
  TissBatchEngine,
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
  };
}

function batchFixture(batchId: string, submissionIds: string[]) {
  return {
    kind: "tiss-batch" as const,
    batchId,
    name: `Batch ${batchId}`,
    submissionIds,
  };
}

function prepareDependencies() {
  const communication = new TissCommunicationEngine();
  communication.registerChannel(channelFixture("ch-1", "op-1"));
  const soap = new TissSoapEngine(communication);
  soap.registerSoapEndpoint(endpointFixture("ep-1", "ch-1"));
  const authentication = new TissAuthenticationEngine(communication, soap);
  authentication.registerCredential(credentialFixture("cred-1", "ch-1", "ep-1"));
  const submission = new TissSubmissionEngine(communication, soap, authentication);
  submission.registerSubmission(submissionFixture("sub-1", "ch-1", "ep-1", "cred-1"));
  submission.registerSubmission(submissionFixture("sub-2", "ch-1", "ep-1", "cred-1"));
  return { communication, soap, authentication, submission };
}

describe("H-05 TISS Batch Engine — functional cases", () => {
  it("registra lote com submissões existentes", async () => {
    const { submission } = prepareDependencies();
    const engine = new TissBatchEngine(submission);
    const result = engine.registerBatch(batchFixture("batch-1", ["sub-1", "sub-2"]));
    assert.equal(result.ok, true);
    assert.equal(result.batchId, "batch-1");
    assert.equal(result.code, "TISS_BATCH_REGISTERED");
  });

  it("rejeita lote sem id", async () => {
    const { submission } = prepareDependencies();
    const engine = new TissBatchEngine(submission);
    const result = engine.registerBatch({ ...batchFixture("batch-1", ["sub-1"]), batchId: "" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_BATCH_INVALID_BATCH_ID");
  });

  it("rejeita lote sem nome", async () => {
    const { submission } = prepareDependencies();
    const engine = new TissBatchEngine(submission);
    const result = engine.registerBatch({ ...batchFixture("batch-1", ["sub-1"]), name: "" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_BATCH_INVALID_NAME");
  });

  it("rejeita lote sem submissões", async () => {
    const { submission } = prepareDependencies();
    const engine = new TissBatchEngine(submission);
    const result = engine.registerBatch(batchFixture("batch-1", []));
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_BATCH_EMPTY_SUBMISSIONS");
  });

  it("rejeita lote com submissão inexistente", async () => {
    const { submission } = prepareDependencies();
    const engine = new TissBatchEngine(submission);
    const result = engine.registerBatch(batchFixture("batch-1", ["sub-1", "sub-3"]));
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_BATCH_SUBMISSION_NOT_FOUND");
  });

  it("encontra lote registrado", async () => {
    const { submission } = prepareDependencies();
    const engine = new TissBatchEngine(submission);
    engine.registerBatch(batchFixture("batch-1", ["sub-1"]));
    const found = engine.findBatch("batch-1");
    assert.ok(found);
    assert.equal(found?.batchId, "batch-1");
  });

  it("lista lotes", async () => {
    const { submission } = prepareDependencies();
    const engine = new TissBatchEngine(submission);
    engine.registerBatch(batchFixture("batch-1", ["sub-1"]));
    engine.registerBatch(batchFixture("batch-2", ["sub-2"]));
    const result = engine.listBatches();
    assert.equal(result.length, 2);
  });

  it("gera estatísticas de lotes", async () => {
    const { submission } = prepareDependencies();
    const engine = new TissBatchEngine(submission);
    engine.registerBatch(batchFixture("batch-1", ["sub-1", "sub-2"]));
    const stats = engine.stats();
    assert.equal(stats.totalBatches, 1);
    assert.equal(stats.totalSubmissions, 2);
  });

  it("reutiliza TissSubmissionEngine", async () => {
    const { submission } = prepareDependencies();
    const engine = new TissBatchEngine(submission);
    const result = engine.registerBatch(batchFixture("batch-1", ["sub-1", "sub-2"]));
    assert.equal(result.ok, true);
    assert.ok(result.batch);
  });

  it("apenas tissBatchImplemented é a nova capability ativa", async () => {
    const capabilities = H05_TISS_INTEGRATION_CAPABILITIES;
    assert.equal(capabilities.tissCommunicationImplemented, true);
    assert.equal(capabilities.tissSoapImplemented, true);
    assert.equal(capabilities.tissAuthenticationImplemented, true);
    assert.equal(capabilities.tissSubmissionImplemented, true);
    assert.equal(capabilities.tissBatchImplemented, true);
    for (const key of CAPABILITY_KEYS) {
      if (key !== "tissBatchImplemented" && !capabilities[key]) continue;
      if (key === "tissBatchImplemented") {
        assert.equal(capabilities[key], true);
      } else if (key !== "tissCommunicationImplemented" && key !== "tissSoapImplemented" && key !== "tissAuthenticationImplemented" && key !== "tissSubmissionImplemented") {
        assert.equal(capabilities[key], false, `${key} deve permanecer false`);
      }
    }
  });

  it("engine expõe capabilities H-05 corretas", async () => {
    const engine = new TissBatchEngine();
    const capabilities = engine.getCapabilities();
    assert.equal(capabilities.tissSubmissionImplemented, true);
    assert.equal(capabilities.tissBatchImplemented, true);
    assert.equal(capabilities.tissReturnProcessingImplemented, false);
  });
});

/**
 * H-06 — TISS Return Processing Engine functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  H06_TISS_INTEGRATION_CAPABILITIES,
  TissAuthenticationEngine,
  TissBatchEngine,
  TissCommunicationEngine,
  TissReturnProcessingEngine,
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

type ReturnStatus = "accepted" | "rejected" | "pending-correction" | "warning";

function returnFixture(returnId: string, status: ReturnStatus, submissionId?: string, batchId?: string) {
  return {
    kind: "tiss-return" as const,
    returnId,
    submissionId,
    batchId,
    status,
    message: `Return ${returnId}`,
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
  const batch = new TissBatchEngine(submission);
  batch.registerBatch(batchFixture("batch-1", ["sub-1"]));
  return { submission, batch };
}

describe("H-06 TISS Return Processing Engine — functional cases", () => {
  it("processa retorno vinculado a submissão existente", async () => {
    const { submission, batch } = prepareDependencies();
    const engine = new TissReturnProcessingEngine(submission, batch);
    const result = engine.processReturn(returnFixture("ret-1", "accepted", "sub-1"));
    assert.equal(result.ok, true);
    assert.equal(result.returnId, "ret-1");
    assert.equal(result.code, "TISS_RETURN_PROCESSED");
  });

  it("processa retorno vinculado a lote existente", async () => {
    const { submission, batch } = prepareDependencies();
    const engine = new TissReturnProcessingEngine(submission, batch);
    const result = engine.processReturn(returnFixture("ret-1", "rejected", undefined, "batch-1"));
    assert.equal(result.ok, true);
    assert.equal(result.code, "TISS_RETURN_PROCESSED");
  });

  it("rejeita retorno sem id", async () => {
    const { submission, batch } = prepareDependencies();
    const engine = new TissReturnProcessingEngine(submission, batch);
    const result = engine.processReturn({ ...returnFixture("ret-1", "accepted", "sub-1"), returnId: "" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_RETURN_INVALID_ID");
  });

  it("rejeita retorno sem status", async () => {
    const { submission, batch } = prepareDependencies();
    const engine = new TissReturnProcessingEngine(submission, batch);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = engine.processReturn({ ...returnFixture("ret-1", "accepted", "sub-1"), status: "" as any });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_RETURN_INVALID_STATUS");
  });

  it("rejeita retorno sem referência", async () => {
    const { submission, batch } = prepareDependencies();
    const engine = new TissReturnProcessingEngine(submission, batch);
    const result = engine.processReturn(returnFixture("ret-1", "accepted", undefined, undefined));
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_RETURN_MISSING_REFERENCE");
  });

  it("rejeita retorno para submissão inexistente", async () => {
    const { submission, batch } = prepareDependencies();
    const engine = new TissReturnProcessingEngine(submission, batch);
    const result = engine.processReturn(returnFixture("ret-1", "accepted", "sub-2"));
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_RETURN_SUBMISSION_NOT_FOUND");
  });

  it("rejeita retorno para lote inexistente", async () => {
    const { submission, batch } = prepareDependencies();
    const engine = new TissReturnProcessingEngine(submission, batch);
    const result = engine.processReturn(returnFixture("ret-1", "accepted", undefined, "batch-2"));
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_RETURN_BATCH_NOT_FOUND");
  });

  it("encontra retorno processado", async () => {
    const { submission, batch } = prepareDependencies();
    const engine = new TissReturnProcessingEngine(submission, batch);
    engine.processReturn(returnFixture("ret-1", "accepted", "sub-1"));
    const found = engine.findReturn("ret-1");
    assert.ok(found);
    assert.equal(found?.returnId, "ret-1");
  });

  it("lista retornos processados", async () => {
    const { submission, batch } = prepareDependencies();
    const engine = new TissReturnProcessingEngine(submission, batch);
    engine.processReturn(returnFixture("ret-1", "accepted", "sub-1"));
    engine.processReturn(returnFixture("ret-2", "rejected", "sub-1"));
    const list = engine.listReturns();
    assert.equal(list.length, 2);
  });

  it("gera estatísticas por status", async () => {
    const { submission, batch } = prepareDependencies();
    const engine = new TissReturnProcessingEngine(submission, batch);
    engine.processReturn(returnFixture("ret-1", "accepted", "sub-1"));
    engine.processReturn(returnFixture("ret-2", "rejected", "sub-1"));
    const stats = engine.stats();
    assert.equal(stats.totalReturns, 2);
    assert.equal(stats.byStatus["accepted"], 1);
    assert.equal(stats.byStatus["rejected"], 1);
  });

  it("reutiliza TissSubmissionEngine e TissBatchEngine", async () => {
    const { submission, batch } = prepareDependencies();
    const engine = new TissReturnProcessingEngine(submission, batch);
    const result = engine.processReturn(returnFixture("ret-1", "accepted", "sub-1"));
    assert.equal(result.ok, true);
    assert.ok(result.return);
  });

  it("somente tissReturnProcessingImplemented é a nova capability ativa", async () => {
    const capabilities = H06_TISS_INTEGRATION_CAPABILITIES;
    assert.equal(capabilities.tissCommunicationImplemented, true);
    assert.equal(capabilities.tissSoapImplemented, true);
    assert.equal(capabilities.tissAuthenticationImplemented, true);
    assert.equal(capabilities.tissSubmissionImplemented, true);
    assert.equal(capabilities.tissBatchImplemented, true);
    assert.equal(capabilities.tissReturnProcessingImplemented, true);

    for (const key of CAPABILITY_KEYS) {
      if (
        key === "tissCommunicationImplemented" ||
        key === "tissSoapImplemented" ||
        key === "tissAuthenticationImplemented" ||
        key === "tissSubmissionImplemented" ||
        key === "tissBatchImplemented" ||
        key === "tissReturnProcessingImplemented"
      ) {
        assert.equal(capabilities[key], true, `${key} deve estar ativa`);
      } else {
        assert.equal(capabilities[key], false, `${key} deve permanecer false`);
      }
    }
  });
});

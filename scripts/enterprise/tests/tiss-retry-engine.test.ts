/**
 * H-08 — TISS Retry Engine functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  H08_TISS_INTEGRATION_CAPABILITIES,
  TissAuthenticationEngine,
  TissBatchEngine,
  TissCommunicationEngine,
  TissReturnProcessingEngine,
  TissRetryEngine,
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

function returnFixture(returnId: string, status: "accepted" | "rejected" | "pending-correction" | "warning", submissionId?: string, batchId?: string) {
  return {
    kind: "tiss-return" as const,
    returnId,
    submissionId,
    batchId,
    status,
    message: `Return ${returnId}`,
  };
}

function policyFixture(policyId: string): Parameters<TissRetryEngine["registerPolicy"]>[0] {
  return {
    kind: "tiss-retry-policy" as const,
    policyId,
    name: `Policy ${policyId}`,
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2,
    retryableStatuses: ["timeout", "500"],
  };
}

function attemptFixture(attemptId: string, entityType: "submission" | "batch" | "return", entityId: string, policyId: string, attemptNumber: number, status: string): Parameters<TissRetryEngine["scheduleAttempt"]>[0] {
  return {
    kind: "tiss-retry-attempt" as const,
    attemptId,
    entityType,
    entityId,
    policyId,
    attemptNumber,
    status,
    timestamp: Date.now(),
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
  const returns = new TissReturnProcessingEngine(submission, batch);
  returns.processReturn(returnFixture("ret-1", "accepted", "sub-1"));
  return { submission, batch, returns };
}

describe("H-08 TISS Retry Engine — functional cases", () => {
  it("registra política de retry", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissRetryEngine(submission, batch, returns);
    const result = engine.registerPolicy(policyFixture("policy-1"));
    assert.equal(result.ok, true);
    assert.equal(result.code, "TISS_RETRY_POLICY_REGISTERED");
    assert.ok(engine.findPolicy("policy-1"));
  });

  it("rejeita política sem id", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissRetryEngine(submission, batch, returns);
    const result = engine.registerPolicy({ ...policyFixture("policy-1"), policyId: "" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_RETRY_INVALID_POLICY_ID");
  });

  it("rejeita política com maxAttempts inválido", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissRetryEngine(submission, batch, returns);
    const result = engine.registerPolicy({ ...policyFixture("policy-1"), maxAttempts: 0 });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_RETRY_INVALID_MAX_ATTEMPTS");
  });

  it("rejeita política com backoff inválido", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissRetryEngine(submission, batch, returns);
    const result = engine.registerPolicy({ ...policyFixture("policy-1"), backoffMultiplier: 0.5 });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_RETRY_INVALID_BACKOFF");
  });

  it("agenda tentativa para submissão existente", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissRetryEngine(submission, batch, returns);
    engine.registerPolicy(policyFixture("policy-1"));
    const result = engine.scheduleAttempt(attemptFixture("att-1", "submission", "sub-1", "policy-1", 1, "timeout"));
    assert.equal(result.ok, true);
    assert.equal(result.code, "TISS_RETRY_ATTEMPT_SCHEDULED");
  });

  it("agenda tentativa para lote existente", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissRetryEngine(submission, batch, returns);
    engine.registerPolicy(policyFixture("policy-1"));
    const result = engine.scheduleAttempt(attemptFixture("att-1", "batch", "batch-1", "policy-1", 1, "timeout"));
    assert.equal(result.ok, true);
  });

  it("agenda tentativa para retorno existente", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissRetryEngine(submission, batch, returns);
    engine.registerPolicy(policyFixture("policy-1"));
    const result = engine.scheduleAttempt(attemptFixture("att-1", "return", "ret-1", "policy-1", 1, "timeout"));
    assert.equal(result.ok, true);
  });

  it("rejeita tentativa sem id", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissRetryEngine(submission, batch, returns);
    engine.registerPolicy(policyFixture("policy-1"));
    const result = engine.scheduleAttempt({ ...attemptFixture("att-1", "submission", "sub-1", "policy-1", 1, "timeout"), attemptId: "" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_RETRY_INVALID_ATTEMPT_ID");
  });

  it("rejeita tentativa para política inexistente", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissRetryEngine(submission, batch, returns);
    const result = engine.scheduleAttempt(attemptFixture("att-1", "submission", "sub-1", "policy-2", 1, "timeout"));
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_RETRY_POLICY_NOT_FOUND");
  });

  it("rejeita tentativa para submissão inexistente", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissRetryEngine(submission, batch, returns);
    engine.registerPolicy(policyFixture("policy-1"));
    const result = engine.scheduleAttempt(attemptFixture("att-1", "submission", "sub-2", "policy-1", 1, "timeout"));
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_RETRY_SUBMISSION_NOT_FOUND");
  });

  it("rejeita tentativa para lote inexistente", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissRetryEngine(submission, batch, returns);
    engine.registerPolicy(policyFixture("policy-1"));
    const result = engine.scheduleAttempt(attemptFixture("att-1", "batch", "batch-2", "policy-1", 1, "timeout"));
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_RETRY_BATCH_NOT_FOUND");
  });

  it("rejeita tentativa para retorno inexistente", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissRetryEngine(submission, batch, returns);
    engine.registerPolicy(policyFixture("policy-1"));
    const result = engine.scheduleAttempt(attemptFixture("att-1", "return", "ret-2", "policy-1", 1, "timeout"));
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_RETRY_RETURN_NOT_FOUND");
  });

  it("rejeita exceder maxAttempts", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissRetryEngine(submission, batch, returns);
    engine.registerPolicy(policyFixture("policy-1"));
    engine.scheduleAttempt(attemptFixture("att-1", "submission", "sub-1", "policy-1", 1, "timeout"));
    engine.scheduleAttempt(attemptFixture("att-2", "submission", "sub-1", "policy-1", 2, "timeout"));
    engine.scheduleAttempt(attemptFixture("att-3", "submission", "sub-1", "policy-1", 3, "timeout"));
    const result = engine.scheduleAttempt(attemptFixture("att-4", "submission", "sub-1", "policy-1", 4, "timeout"));
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_RETRY_MAX_ATTEMPTS_EXCEEDED");
  });

  it("rejeita attemptNumber não crescente", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissRetryEngine(submission, batch, returns);
    engine.registerPolicy(policyFixture("policy-1"));
    engine.scheduleAttempt(attemptFixture("att-1", "submission", "sub-1", "policy-1", 1, "timeout"));
    const result = engine.scheduleAttempt(attemptFixture("att-2", "submission", "sub-1", "policy-1", 1, "timeout"));
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_RETRY_INVALID_ATTEMPT_NUMBER");
  });

  it("consulta tentativas por entidade", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissRetryEngine(submission, batch, returns);
    engine.registerPolicy(policyFixture("policy-1"));
    engine.scheduleAttempt(attemptFixture("att-1", "submission", "sub-1", "policy-1", 1, "timeout"));
    engine.scheduleAttempt(attemptFixture("att-2", "submission", "sub-1", "policy-1", 2, "timeout"));
    const attempts = engine.attemptsForEntity("sub-1");
    assert.equal(attempts.length, 2);
  });

  it("calcula delay com backoff", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissRetryEngine(submission, batch, returns);
    engine.registerPolicy(policyFixture("policy-1"));
    assert.equal(engine.calculateDelayMs("policy-1", 1), 1000);
    assert.equal(engine.calculateDelayMs("policy-1", 2), 2000);
    assert.equal(engine.calculateDelayMs("policy-1", 3), 4000);
  });

  it("gera estatísticas de tentativas", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissRetryEngine(submission, batch, returns);
    engine.registerPolicy(policyFixture("policy-1"));
    engine.scheduleAttempt(attemptFixture("att-1", "submission", "sub-1", "policy-1", 1, "timeout"));
    engine.scheduleAttempt(attemptFixture("att-2", "submission", "sub-1", "policy-1", 2, "500"));
    const stats = engine.stats();
    assert.equal(stats.totalAttempts, 2);
    assert.equal(stats.byStatus["timeout"], 1);
    assert.equal(stats.byStatus["500"], 1);
    assert.equal(stats.byPolicy["policy-1"], 2);
  });

  it("somente tissRetryImplemented é a nova capability ativa", async () => {
    const capabilities = H08_TISS_INTEGRATION_CAPABILITIES;
    const active = [
      "tissCommunicationImplemented",
      "tissSoapImplemented",
      "tissAuthenticationImplemented",
      "tissSubmissionImplemented",
      "tissBatchImplemented",
      "tissReturnProcessingImplemented",
      "tissStatusTrackingImplemented",
      "tissRetryImplemented",
    ];
    const inactive = ["tissAuditImplemented", "tissIntegrationEngineImplemented"];

    for (const key of active) {
      assert.equal(capabilities[key as keyof typeof capabilities], true, `${key} deve estar ativa`);
    }
    for (const key of inactive) {
      assert.equal(capabilities[key as keyof typeof capabilities], false, `${key} deve permanecer false`);
    }
    for (const key of CAPABILITY_KEYS) {
      if (active.includes(key)) {
        assert.equal(capabilities[key], true, `${key} deve estar ativa`);
      } else {
        assert.equal(capabilities[key], false, `${key} deve permanecer false`);
      }
    }
  });
});

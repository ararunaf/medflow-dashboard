/**
 * H-07 — TISS Status Tracking Engine functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  H07_TISS_INTEGRATION_CAPABILITIES,
  TissAuthenticationEngine,
  TissBatchEngine,
  TissCommunicationEngine,
  TissReturnProcessingEngine,
  TissSoapEngine,
  TissStatusTrackingEngine,
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

function eventFixture(eventId: string, entityType: "submission" | "batch" | "return", entityId: string, status: string) {
  return {
    kind: "tiss-status-event" as const,
    eventId,
    entityType,
    entityId,
    status,
    message: `Event ${eventId}`,
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

describe("H-07 TISS Status Tracking Engine — functional cases", () => {
  it("rastreia status de submissão existente", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissStatusTrackingEngine(submission, batch, returns);
    const result = engine.track(eventFixture("evt-1", "submission", "sub-1", "sent"));
    assert.equal(result.ok, true);
    assert.equal(result.code, "TISS_STATUS_TRACKED");
  });

  it("rastreia status de lote existente", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissStatusTrackingEngine(submission, batch, returns);
    const result = engine.track(eventFixture("evt-1", "batch", "batch-1", "queued"));
    assert.equal(result.ok, true);
  });

  it("rastreia status de retorno existente", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissStatusTrackingEngine(submission, batch, returns);
    const result = engine.track(eventFixture("evt-1", "return", "ret-1", "processed"));
    assert.equal(result.ok, true);
  });

  it("rejeita evento sem id", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissStatusTrackingEngine(submission, batch, returns);
    const result = engine.track({ ...eventFixture("evt-1", "submission", "sub-1", "sent"), eventId: "" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_STATUS_INVALID_EVENT_ID");
  });

  it("rejeita evento sem entityId", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissStatusTrackingEngine(submission, batch, returns);
    const result = engine.track({ ...eventFixture("evt-1", "submission", "sub-1", "sent"), entityId: "" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_STATUS_INVALID_ENTITY_ID");
  });

  it("rejeita evento sem status", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissStatusTrackingEngine(submission, batch, returns);
    const result = engine.track({ ...eventFixture("evt-1", "submission", "sub-1", "sent"), status: "" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_STATUS_INVALID_STATUS");
  });

  it("rejeita evento para submissão inexistente", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissStatusTrackingEngine(submission, batch, returns);
    const result = engine.track(eventFixture("evt-1", "submission", "sub-2", "sent"));
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_STATUS_SUBMISSION_NOT_FOUND");
  });

  it("rejeita evento para lote inexistente", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissStatusTrackingEngine(submission, batch, returns);
    const result = engine.track(eventFixture("evt-1", "batch", "batch-2", "queued"));
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_STATUS_BATCH_NOT_FOUND");
  });

  it("rejeita evento para retorno inexistente", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissStatusTrackingEngine(submission, batch, returns);
    const result = engine.track(eventFixture("evt-1", "return", "ret-2", "processed"));
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_STATUS_RETURN_NOT_FOUND");
  });

  it("rejeita tipo de entidade inválido", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissStatusTrackingEngine(submission, batch, returns);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = engine.track({ ...eventFixture("evt-1", "submission" as any, "sub-1", "sent"), entityType: "invalid" as any });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_STATUS_INVALID_ENTITY_TYPE");
  });

  it("recupera histórico de eventos", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissStatusTrackingEngine(submission, batch, returns);
    engine.track(eventFixture("evt-1", "submission", "sub-1", "sent"));
    engine.track(eventFixture("evt-2", "submission", "sub-1", "delivered"));
    const history = engine.history("submission", "sub-1");
    assert.ok(history);
    assert.equal(history?.events.length, 2);
  });

  it("recupera evento mais recente", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissStatusTrackingEngine(submission, batch, returns);
    engine.track(eventFixture("evt-1", "submission", "sub-1", "sent"));
    engine.track(eventFixture("evt-2", "submission", "sub-1", "delivered"));
    const latest = engine.latest("submission", "sub-1");
    assert.equal(latest?.status, "delivered");
  });

  it("gera estatísticas de eventos", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissStatusTrackingEngine(submission, batch, returns);
    engine.track(eventFixture("evt-1", "submission", "sub-1", "sent"));
    engine.track(eventFixture("evt-2", "submission", "sub-1", "delivered"));
    const stats = engine.stats();
    assert.equal(stats.totalEvents, 2);
    assert.equal(stats.byStatus["sent"], 1);
    assert.equal(stats.byStatus["delivered"], 1);
  });

  it("reutiliza TissSubmissionEngine, TissBatchEngine e TissReturnProcessingEngine", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissStatusTrackingEngine(submission, batch, returns);
    const result = engine.track(eventFixture("evt-1", "submission", "sub-1", "sent"));
    assert.equal(result.ok, true);
    assert.ok(result.event);
  });

  it("somente tissStatusTrackingImplemented é a nova capability ativa", async () => {
    const capabilities = H07_TISS_INTEGRATION_CAPABILITIES;
    const active = [
      "tissCommunicationImplemented",
      "tissSoapImplemented",
      "tissAuthenticationImplemented",
      "tissSubmissionImplemented",
      "tissBatchImplemented",
      "tissReturnProcessingImplemented",
      "tissStatusTrackingImplemented",
    ];
    const inactive = ["tissRetryImplemented", "tissAuditImplemented", "tissIntegrationEngineImplemented"];

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

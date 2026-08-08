/**
 * H-09 — TISS Audit Engine functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  H09_TISS_INTEGRATION_CAPABILITIES,
  TissAuditEngine,
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

function auditFixture(
  auditId: string,
  entityType: "submission" | "batch" | "return" | "status" | "retry" | "policy",
  entityId: string,
  action: string,
  actor: string,
): Parameters<TissAuditEngine["record"]>[0] {
  return {
    kind: "tiss-audit-event" as const,
    auditId,
    entityType,
    entityId,
    action,
    actor,
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

describe("H-09 TISS Audit Engine — functional cases", () => {
  it("registra evento de auditoria para submissão", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissAuditEngine(submission, batch, returns);
    const result = engine.record(auditFixture("audit-1", "submission", "sub-1", "created", "system"));
    assert.equal(result.ok, true);
    assert.equal(result.code, "TISS_AUDIT_RECORDED");
    assert.ok(result.event);
  });

  it("registra evento de auditoria para lote", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissAuditEngine(submission, batch, returns);
    const result = engine.record(auditFixture("audit-1", "batch", "batch-1", "dispatched", "user-a"));
    assert.equal(result.ok, true);
  });

  it("registra evento de auditoria para retorno", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissAuditEngine(submission, batch, returns);
    const result = engine.record(auditFixture("audit-1", "return", "ret-1", "processed", "system"));
    assert.equal(result.ok, true);
  });

  it("registra evento de auditoria para status", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissAuditEngine(submission, batch, returns);
    const result = engine.record(auditFixture("audit-1", "status", "status-1", "updated", "system"));
    assert.equal(result.ok, true);
  });

  it("registra evento de auditoria para retry", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissAuditEngine(submission, batch, returns);
    const result = engine.record(auditFixture("audit-1", "retry", "retry-1", "attempted", "worker"));
    assert.equal(result.ok, true);
  });

  it("registra evento de auditoria para policy", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissAuditEngine(submission, batch, returns);
    const result = engine.record(auditFixture("audit-1", "policy", "policy-1", "registered", "admin"));
    assert.equal(result.ok, true);
  });

  it("rejeita evento sem auditId", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissAuditEngine(submission, batch, returns);
    const result = engine.record({ ...auditFixture("audit-1", "submission", "sub-1", "created", "system"), auditId: "" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_AUDIT_INVALID_AUDIT_ID");
  });

  it("rejeita evento sem entityId", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissAuditEngine(submission, batch, returns);
    const result = engine.record({ ...auditFixture("audit-1", "submission", "sub-1", "created", "system"), entityId: "" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_AUDIT_INVALID_ENTITY_ID");
  });

  it("rejeita evento sem action", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissAuditEngine(submission, batch, returns);
    const result = engine.record({ ...auditFixture("audit-1", "submission", "sub-1", "created", "system"), action: "" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_AUDIT_INVALID_ACTION");
  });

  it("rejeita evento sem actor", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissAuditEngine(submission, batch, returns);
    const result = engine.record({ ...auditFixture("audit-1", "submission", "sub-1", "created", "system"), actor: "" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_AUDIT_INVALID_ACTOR");
  });

  it("rejeita evento para submissão inexistente", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissAuditEngine(submission, batch, returns);
    const result = engine.record(auditFixture("audit-1", "submission", "sub-2", "created", "system"));
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_AUDIT_SUBMISSION_NOT_FOUND");
  });

  it("rejeita evento para lote inexistente", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissAuditEngine(submission, batch, returns);
    const result = engine.record(auditFixture("audit-1", "batch", "batch-2", "created", "system"));
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_AUDIT_BATCH_NOT_FOUND");
  });

  it("rejeita evento para retorno inexistente", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissAuditEngine(submission, batch, returns);
    const result = engine.record(auditFixture("audit-1", "return", "ret-2", "created", "system"));
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_AUDIT_RETURN_NOT_FOUND");
  });

  it("rejeita tipo de entidade inválido", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissAuditEngine(submission, batch, returns);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = engine.record({ ...auditFixture("audit-1", "submission" as any, "sub-1", "created", "system"), entityType: "invalid" as any });
    assert.equal(result.ok, false);
    assert.equal(result.code, "TISS_AUDIT_INVALID_ENTITY_TYPE");
  });

  it("gera relatório filtrado por entidade", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissAuditEngine(submission, batch, returns);
    engine.record(auditFixture("audit-1", "submission", "sub-1", "created", "system"));
    engine.record(auditFixture("audit-2", "submission", "sub-1", "updated", "system"));
    engine.record(auditFixture("audit-3", "batch", "batch-1", "dispatched", "user"));
    const report = engine.report({ entityType: "submission", entityId: "sub-1" });
    assert.equal(report.totalEvents, 2);
  });

  it("gera relatório filtrado por actor", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissAuditEngine(submission, batch, returns);
    engine.record(auditFixture("audit-1", "submission", "sub-1", "created", "system"));
    engine.record(auditFixture("audit-2", "batch", "batch-1", "dispatched", "user-a"));
    const report = engine.report({ actor: "user-a" });
    assert.equal(report.totalEvents, 1);
  });

  it("gera estatísticas de auditoria", async () => {
    const { submission, batch, returns } = prepareDependencies();
    const engine = new TissAuditEngine(submission, batch, returns);
    engine.record(auditFixture("audit-1", "submission", "sub-1", "created", "system"));
    engine.record(auditFixture("audit-2", "submission", "sub-1", "updated", "system"));
    engine.record(auditFixture("audit-3", "batch", "batch-1", "dispatched", "user"));
    const stats = engine.stats();
    assert.equal(stats.totalEvents, 3);
    assert.equal(stats.byAction["created"], 1);
    assert.equal(stats.byActor["system"], 2);
  });

  it("somente tissAuditImplemented é a nova capability ativa", async () => {
    const capabilities = H09_TISS_INTEGRATION_CAPABILITIES;
    const active = [
      "tissCommunicationImplemented",
      "tissSoapImplemented",
      "tissAuthenticationImplemented",
      "tissSubmissionImplemented",
      "tissBatchImplemented",
      "tissReturnProcessingImplemented",
      "tissStatusTrackingImplemented",
      "tissRetryImplemented",
      "tissAuditImplemented",
    ];
    const inactive = ["tissIntegrationEngineImplemented"];

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

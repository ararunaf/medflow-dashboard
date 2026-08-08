/**
 * H-10 — GenericTissIntegrationEngine functional tests.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  GenericTissIntegrationEngine,
  H10_TISS_INTEGRATION_CAPABILITIES,
  TissAuditEngine,
  TissAuthenticationEngine,
  TissBatchEngine,
  TissCommunicationEngine,
  TissReturnProcessingEngine,
  TissRetryEngine,
  TissSoapEngine,
  TissStatusTrackingEngine,
  TissSubmissionEngine,
} from "../../../src/lib/enterprise/tiss-integration-engine";

describe("H-10 GenericTissIntegrationEngine — pure facade", () => {
  it("expõe as nove engines anteriores por referência readonly", async () => {
    const engine = new GenericTissIntegrationEngine();
    assert.ok(engine.communication instanceof TissCommunicationEngine);
    assert.ok(engine.soap instanceof TissSoapEngine);
    assert.ok(engine.authentication instanceof TissAuthenticationEngine);
    assert.ok(engine.submission instanceof TissSubmissionEngine);
    assert.ok(engine.batch instanceof TissBatchEngine);
    assert.ok(engine.returnProcessing instanceof TissReturnProcessingEngine);
    assert.ok(engine.statusTracking instanceof TissStatusTrackingEngine);
    assert.ok(engine.retry instanceof TissRetryEngine);
    assert.ok(engine.audit instanceof TissAuditEngine);
  });

  it("aceita instâncias injetadas das engines", async () => {
    const communication = new TissCommunicationEngine();
    const soap = new TissSoapEngine(communication);
    const authentication = new TissAuthenticationEngine(communication, soap);
    const submission = new TissSubmissionEngine(communication, soap, authentication);
    const batch = new TissBatchEngine(submission);
    const returnProcessing = new TissReturnProcessingEngine(submission, batch);
    const statusTracking = new TissStatusTrackingEngine(
      communication,
      soap,
      authentication,
      submission,
      batch,
      returnProcessing,
    );
    const retry = new TissRetryEngine(
      communication,
      soap,
      authentication,
      submission,
      batch,
      returnProcessing,
      statusTracking,
    );
    const audit = new TissAuditEngine(submission, batch, returnProcessing);

    const engine = new GenericTissIntegrationEngine(
      communication,
      soap,
      authentication,
      submission,
      batch,
      returnProcessing,
      statusTracking,
      retry,
      audit,
    );

    assert.strictEqual(engine.communication, communication);
    assert.strictEqual(engine.soap, soap);
    assert.strictEqual(engine.authentication, authentication);
    assert.strictEqual(engine.submission, submission);
    assert.strictEqual(engine.batch, batch);
    assert.strictEqual(engine.returnProcessing, returnProcessing);
    assert.strictEqual(engine.statusTracking, statusTracking);
    assert.strictEqual(engine.retry, retry);
    assert.strictEqual(engine.audit, audit);
  });

  it("não expõe métodos de negócio próprios", async () => {
    const engine = new GenericTissIntegrationEngine();
    const ownMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(engine)).filter(
      (name) => name !== "constructor" && typeof (engine as Record<string, unknown>)[name] === "function",
    );
    assert.deepStrictEqual(ownMethods, ["getCapabilities"]);
  });

  it("getCapabilities retorna H10 com todas as capabilities ativas", async () => {
    const engine = new GenericTissIntegrationEngine();
    const capabilities = engine.getCapabilities();
    const expectedTrue = [
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
    for (const key of expectedTrue) {
      assert.equal(capabilities[key], true, `${key} deve estar ativo`);
    }
  });

  it("H10_TISS_INTEGRATION_CAPABILITIES declara somente tissIntegrationEngineImplemented como nova ativa", async () => {
    const capabilities = H10_TISS_INTEGRATION_CAPABILITIES;
    assert.equal(capabilities.tissCommunicationImplemented, true);
    assert.equal(capabilities.tissSoapImplemented, true);
    assert.equal(capabilities.tissAuthenticationImplemented, true);
    assert.equal(capabilities.tissSubmissionImplemented, true);
    assert.equal(capabilities.tissBatchImplemented, true);
    assert.equal(capabilities.tissReturnProcessingImplemented, true);
    assert.equal(capabilities.tissStatusTrackingImplemented, true);
    assert.equal(capabilities.tissRetryImplemented, true);
    assert.equal(capabilities.tissAuditImplemented, true);
    assert.equal(capabilities.tissIntegrationEngineImplemented, true);
  });
});

#!/usr/bin/env node
/**
 * A9-02 — Audit Real Activation.
 *
 * Prova:
 *   RealTissAuditRuntimeAdapter registrado como provider "real-tiss"
 *     → AuditRuntimeFactory / AuditRuntimeRegistry
 *     → createAuditRuntimePort({ provider: "real-tiss" })
 *     → getEnterpriseRuntime({ auditRuntimePort })
 *     → Pipeline PERSISTED → Worker → AuditRuntimePort → AUDITED
 *     → Completed NÃO executado
 *
 * Sem novo Port / Runtime / Pipeline / Queue / Worker / Scheduler / Retry / DLQ / Observability.
 */
process.env.MEDICFLOW_QUEUE_RUNTIME_BACKEND = "memory";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

import {
  ENTERPRISE_TISS_QUEUE_NAME,
  TISS_JOB_STATUS_AUDITED,
  TISS_JOB_STATUS_BATCH_CREATED,
  TISS_JOB_STATUS_ENRICHED,
  TISS_JOB_STATUS_OCR_COMPLETED,
  TISS_JOB_STATUS_PARSED,
  TISS_JOB_STATUS_PERSISTED,
  TISS_JOB_STATUS_PROTOCOL_SENT,
  TISS_JOB_STATUS_VALIDATED,
  TISS_JOB_STATUS_XML_GENERATED,
  processTissAuditJob,
  resetQueueRuntimeIdSequences,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
import { createOCRProviderPort } from "../../../src/lib/enterprise/ocr-provider/index.ts";
import {
  REALTISS_AUDIT_RUNTIME_ADAPTER_ID,
  createAuditRuntimePort,
} from "../../../src/lib/enterprise/audit-runtime/index.ts";
import {
  createEnterpriseRuntime,
  getEnterpriseRuntime,
  processTissBatchCreatedProtocolSent,
  processTissEnrichedXmlGenerated,
  processTissOcrParsed,
  processTissParsedValidated,
  processTissPersistedAudited,
  processTissProtocolSentPersisted,
  processTissReceivedOcr,
  processTissValidatedEnriched,
  processTissXmlGeneratedBatchCreated,
  registerTissReceivedJob,
  resetEnterpriseRuntimeForTests,
  setEnterpriseRuntimeForTests,
} from "../../../src/lib/enterprise/runtime/index.ts";

describe("A9-02 Audit Real Activation — PERSISTED → AUDITED com real-tiss", () => {
  it("factory + registry resolvem provider real-tiss", () => {
    const port = createAuditRuntimePort({ provider: "real-tiss" });
    assert.equal(port.providerId, "real-tiss");
    assert.equal(port.capabilities().adapterId, REALTISS_AUDIT_RUNTIME_ADAPTER_ID);
    assert.equal(port.capabilities().provider, "real-tiss");
    assert.equal(port.providerInfo().providerId, "real-tiss");
    assert.equal(port.providerInfo().metadata.vendor, "real-tiss");
  });

  it("processTissPersistedAudited evolui PERSISTED para AUDITED via AuditRuntimePort real-tiss", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const realTissAuditPort = createAuditRuntimePort({ provider: "real-tiss" });
    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-05a-real-tiss",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
      auditRuntimePort: realTissAuditPort,
    });
    setEnterpriseRuntimeForTests(runtime);

    assert.equal(runtime.getAuditRuntimePort().providerId, "real-tiss");
    assert.equal(
      runtime.getAuditRuntimePort().capabilities().adapterId,
      REALTISS_AUDIT_RUNTIME_ADAPTER_ID,
    );

    const registered = await registerTissReceivedJob({
      source: "document-intake",
      correlationId: "corr-tiss-05a-real-tiss",
      sessionId: "session-tiss-05a-real-tiss",
      documentId: "doc-tiss-05a-real-tiss",
      payloadRef: "storage://clinical-documents/doc-tiss-05a-real-tiss",
      jobId: "job-tiss-05a-real-tiss",
      channel: "capture-upload",
    });
    assert.equal(registered.ok, true);
    assert.equal(registered.job?.status, "RECEIVED");

    await processTissReceivedOcr({
      preferredProviderReference: "mock",
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    await processTissOcrParsed({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });
    await processTissParsedValidated({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });
    await processTissValidatedEnriched({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });
    await processTissEnrichedXmlGenerated({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });
    await processTissXmlGeneratedBatchCreated({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });
    await processTissBatchCreatedProtocolSent({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });

    const persistenceResult = await processTissProtocolSentPersisted({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(persistenceResult.ok, true);
    assert.equal(persistenceResult.job?.status, TISS_JOB_STATUS_PERSISTED);

    const auditResult = await processTissPersistedAudited({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(auditResult.ok, true);
    assert.equal(auditResult.entry, "getEnterpriseRuntime");
    assert.equal(auditResult.runtimeId, "test-tiss-05a-real-tiss");
    assert.equal(auditResult.audited, true);
    assert.equal(auditResult.completedExecuted, false);
    assert.equal(auditResult.persisted, true);
    assert.equal(auditResult.job?.status, TISS_JOB_STATUS_AUDITED);
    assert.equal(auditResult.job?.correlationId, "corr-tiss-05a-real-tiss");
    assert.ok(auditResult.job?.auditJobId);

    assert.equal(auditResult.infrastructure.queueRuntimePort, true);
    assert.equal(auditResult.infrastructure.workerRuntimePort, true);
    assert.equal(auditResult.infrastructure.schedulerRuntimePort, true);
    assert.equal(auditResult.infrastructure.observabilityRuntimePort, true);
    assert.equal(auditResult.infrastructure.auditRuntimePort, true);
    assert.equal(auditResult.infrastructure.retryInfrastructure, true);
    assert.equal(auditResult.infrastructure.deadLetterRuntime, true);

    const peeked = await runtime.getQueueRuntimePort().peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: auditResult.job!.jobId,
    });
    assert.equal(peeked.ok, true);
    assert.equal(peeked.queueMessage?.status, "enqueued");
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.tissJobStatus, TISS_JOB_STATUS_AUDITED);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.auditExecuted, true);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.completedExecuted, false);
  });

  it("processTissAuditJob valida Port real-tiss e reenfileira AUDITED", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-05a-real-tiss-job",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
      auditRuntimePort: createAuditRuntimePort({ provider: "real-tiss" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const enqueue = await runtime.getQueueRuntimePort().enqueue({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-real-tiss-persisted",
      metadata: {
        kind: "canonical-queue-metadata",
        source: "unit-test",
        tags: ["tiss-job", TISS_JOB_STATUS_PERSISTED],
        customAttributes: {
          status: TISS_JOB_STATUS_PERSISTED,
          tissJobStatus: TISS_JOB_STATUS_PERSISTED,
          persisted: true,
          audited: false,
          auditExecuted: false,
          completedExecuted: false,
          correlationId: "corr-job-real-tiss",
          previousJobId: "job-real-tiss-persisted",
        },
      },
    });
    assert.equal(enqueue.ok, true);
    assert.ok(enqueue.queueMessage);

    const result = await processTissAuditJob({
      getQueueRuntimePort: () => runtime.getQueueRuntimePort(),
      getAuditRuntimePort: () => runtime.getAuditRuntimePort(),
      message: enqueue.queueMessage!,
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
    });
    assert.equal(result.ok, true);
    assert.equal(result.audited, true);
    assert.equal(result.completedExecuted, false);
    assert.equal(result.settle, "ack");
    assert.equal(result.job?.status, TISS_JOB_STATUS_AUDITED);
    assert.equal(runtime.getAuditRuntimePort().providerId, "real-tiss");
  });
});

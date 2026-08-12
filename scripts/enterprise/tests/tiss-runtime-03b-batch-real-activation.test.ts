#!/usr/bin/env node
/**
 * A6-02 — TISS-RUNTIME-03B Batch Real Activation.
 *
 * Prova:
 *   - RealTissBatchRuntimeAdapter ativado via provider `real-tiss`.
 *   - Reutiliza DefaultBatchRuntimeAdapter para ciclo de vida, retry,
 *     observability, telemetry, health, capabilities, store.
 *   - BatchRuntimePort, QueueRuntimePort, WorkerRuntimePort, SchedulerRuntimePort,
 *     Retry, Dead Letter, ObservabilityRuntimePort reutilizados sem alteração.
 *   - Job XML_GENERATED → BATCH_CREATED com protocol/persistence/audit não executados.
 */
process.env.MEDICFLOW_QUEUE_RUNTIME_BACKEND = "memory";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ENTERPRISE_TISS_QUEUE_NAME,
  TISS_JOB_STATUS_BATCH_CREATED,
  TISS_JOB_STATUS_XML_GENERATED,
  processTissBatchJob,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
import { createOCRProviderPort } from "../../../src/lib/enterprise/ocr-provider/index.ts";
import {
  createBatchRuntimePort,
  RealTissBatchRuntimeAdapter,
  REAL_TISS_BATCH_RUNTIME_ADAPTER_ID,
  REAL_TISS_BATCH_RUNTIME_VERSION,
} from "../../../src/lib/enterprise/batch-runtime/index.ts";
import {
  createEnterpriseRuntime,
  resetEnterpriseRuntimeForTests,
  setEnterpriseRuntimeForTests,
  processTissEnrichedXmlGenerated,
  processTissOcrParsed,
  processTissParsedValidated,
  processTissReceivedOcr,
  processTissValidatedEnriched,
  processTissXmlGeneratedBatchCreated,
  registerTissReceivedJob,
} from "../../../src/lib/enterprise/runtime/index.ts";
import { resetQueueRuntimeIdSequences } from "../../../src/lib/enterprise/queue-runtime/index.ts";

describe("A6-02 — TISS-RUNTIME-03B Batch Real Activation", () => {
  it("1. RealTissBatchRuntimeAdapter resolve via provider real-tiss e implementa BatchRuntimePort", () => {
    const port = createBatchRuntimePort({ provider: "real-tiss" });
    assert.ok(port instanceof RealTissBatchRuntimeAdapter);
    assert.equal(port.providerId, "real-tiss");

    const caps = port.capabilities();
    assert.equal(caps.provider, "real-tiss");
    assert.equal(caps.adapterId, REAL_TISS_BATCH_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsPrepareBatch, true);
    assert.equal(caps.supportsGetBatch, true);
    assert.equal(caps.supportsCanonicalBatchManifest, true);
    assert.equal(caps.runtimeReady, true);
    assert.equal(caps.batchProcessingImplemented, false);

    const info = port.providerInfo();
    assert.equal(info.providerId, "real-tiss");
    assert.equal(info.metadata.version, REAL_TISS_BATCH_RUNTIME_VERSION);
    assert.equal(info.metadata.vendor, "medicflow-enterprise");
  });

  it("2. RealTissBatchRuntimeAdapter gera manifesto de lote real a partir de XML_GENERATED", async () => {
    const port = createBatchRuntimePort({ provider: "real-tiss" });

    const prepared = await port.prepareBatch({
      batchName: "TISS real batch activation",
      batchContext: {
        kind: "canonical-batch-context",
        batchId: "batch-tiss-real-02",
        contextId: "batch-tiss-real-02:ctx",
        correlationId: "corr-tiss-real-02",
        structuralNotes: "Real TISS batch from XML_GENERATED",
      },
      documents: [
        {
          kind: "canonical-batch-document",
          documentId: "doc-tiss-real-02",
          documentRef: "tiss://xml/doc-tiss-real-02",
          name: "TISS XML Guide",
          contentType: "text/xml",
          batchDocumentImplemented: false,
          batchProcessingImplemented: false,
        },
      ],
    });

    assert.equal(prepared.ok, true);
    assert.equal(prepared.provider, "real-tiss");
    assert.equal(prepared.batchProcessed, false);
    assert.ok(prepared.manifest?.batchId);
    assert.equal(prepared.manifest?.state, "READY_TO_SEND");
    assert.equal(prepared.manifest?.submissionStrategy, "tiss-ans-soap");
    assert.equal(prepared.manifest?.priority, "normal");
    assert.equal(prepared.manifest?.owner, "real-tiss");
    assert.ok(prepared.manifest?.tags?.includes("real-tiss"));
    assert.ok(prepared.manifest?.tags?.includes("tiss-batch"));

    const fetched = await port.getBatch({ batchId: prepared.manifest!.batchId! });
    assert.equal(fetched.ok, true);
    assert.equal(fetched.provider, "real-tiss");
    assert.equal(fetched.manifest?.batchId, prepared.manifest?.batchId);
    assert.equal(fetched.manifest?.state, "READY_TO_SEND");
  });

  it("3. End-to-end: XML_GENERATED → BATCH_CREATED via RealTissBatchRuntimeAdapter", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-03b-real",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
      batchRuntimePort: createBatchRuntimePort({ provider: "real-tiss" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const registered = await registerTissReceivedJob({
      source: "document-intake",
      correlationId: "corr-tiss-03b-real",
      sessionId: "session-tiss-03b-real",
      documentId: "doc-tiss-03b-real",
      payloadRef: "storage://clinical-documents/doc-tiss-03b-real",
      jobId: "job-tiss-03b-real",
      channel: "capture-upload",
    });
    assert.equal(registered.ok, true);

    await processTissReceivedOcr({
      preferredProviderReference: "mock",
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    await processTissOcrParsed({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });
    await processTissParsedValidated({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });
    await processTissValidatedEnriched({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });

    const xmlResult = await processTissEnrichedXmlGenerated({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(xmlResult.ok, true);
    assert.equal(xmlResult.job?.status, TISS_JOB_STATUS_XML_GENERATED);

    const batchResult = await processTissXmlGeneratedBatchCreated({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });

    assert.equal(batchResult.ok, true);
    assert.equal(batchResult.entry, "getEnterpriseRuntime");
    assert.equal(batchResult.runtimeId, "test-tiss-03b-real");
    assert.equal(batchResult.batchCreated, true);
    assert.equal(batchResult.protocolExecuted, false);
    assert.equal(batchResult.persistenceExecuted, false);
    assert.equal(batchResult.auditExecuted, false);
    assert.equal(batchResult.xmlGenerated, true);
    assert.equal(batchResult.enrichmentExecuted, true);
    assert.equal(batchResult.validationExecuted, true);
    assert.equal(batchResult.parserExecuted, true);
    assert.equal(batchResult.ocrExecuted, true);
    assert.ok(batchResult.job);
    assert.equal(batchResult.job!.status, TISS_JOB_STATUS_BATCH_CREATED);

    assert.equal(runtime.getBatchRuntimePort().providerId, "real-tiss");

    const peeked = await runtime.getQueueRuntimePort().peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: batchResult.job!.jobId,
    });
    assert.equal(peeked.ok, true);
    assert.equal(peeked.queueMessage?.status, "enqueued");
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.tissJobStatus, TISS_JOB_STATUS_BATCH_CREATED);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.batchCreated, true);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.batchExecuted, true);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.protocolExecuted, false);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.persistenceExecuted, false);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.auditExecuted, false);
    assert.notEqual(peeked.queueMessage?.metadata?.customAttributes?.completedExecuted, true);
  });

  it("4. Observability: health, providerInfo e capabilities reportam real-tiss", async () => {
    const port = createBatchRuntimePort({ provider: "real-tiss" });

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "real-tiss");
    assert.equal(health.runtimeReady, true);
    assert.equal(health.batchProcessingImplemented, false);

    const caps = port.capabilities();
    assert.equal(caps.provider, "real-tiss");
    assert.equal(caps.adapterId, REAL_TISS_BATCH_RUNTIME_ADAPTER_ID);

    const info = port.providerInfo();
    assert.equal(info.providerId, "real-tiss");
    assert.equal(info.status, "ready");
    assert.equal(info.providerType, "BATCH_RUNTIME");
  });

  it("5. Retry com transient failures funciona via DefaultBatchRuntimeAdapter subjacente", async () => {
    const port = new RealTissBatchRuntimeAdapter({
      provider: "real-tiss",
      failAttempts: 2,
      defaultRetryCount: 2,
      defaultRetryBackoffMs: 10,
    });

    const prepared = await port.prepareBatch({
      batchName: "TISS real batch with retry",
      batchContext: {
        kind: "canonical-batch-context",
        batchId: "batch-tiss-real-retry",
        contextId: "batch-tiss-real-retry:ctx",
        structuralNotes: "Real TISS batch with retry",
      },
    });

    assert.equal(prepared.ok, true);
    assert.ok(prepared.telemetry!.attempts > 1, `expected >1 attempts, got ${prepared.telemetry?.attempts}`);
    assert.equal(prepared.provider, "real-tiss");
  });

  it("6. Cancelamento via AbortSignal", async () => {
    const port = createBatchRuntimePort({ provider: "real-tiss" });

    const controller = new AbortController();
    controller.abort();

    const prepared = await port.prepareBatch({
      batchName: "TISS real batch cancelled",
      batchContext: {
        kind: "canonical-batch-context",
        batchId: "batch-tiss-real-cancel",
        contextId: "batch-tiss-real-cancel:ctx",
        structuralNotes: "Real TISS batch cancelled",
      },
      signal: controller.signal,
    });

    assert.equal(prepared.ok, false);
    assert.equal(prepared.provider, "real-tiss");
    assert.ok(prepared.code === "BATCH_RUNTIME_CANCELLED" || prepared.code?.includes("CANCELLED"));
  });
});

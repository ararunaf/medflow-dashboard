#!/usr/bin/env node
/**
 * A8-E2E-01 — Enterprise End-to-End Certification.
 *
 * Certifica o pipeline completo via getEnterpriseRuntime():
 *   RECEIVED → OCR → PARSED → VALIDATED → ENRICHED → XML_GENERATED →
 *   BATCH_CREATED → PROTOCOL_SENT → PERSISTED.
 *
 * NÃO executa Audit.
 * NÃO executa Completed.
 * NÃO altera arquitetura.
 * NÃO chama adapters concretos diretamente.
 */
process.env.MEDICFLOW_QUEUE_RUNTIME_BACKEND = "memory";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createEnterpriseRuntime,
  resetEnterpriseRuntimeForTests,
  setEnterpriseRuntimeForTests,
  processTissReceivedOcr,
  processTissOcrParsed,
  processTissParsedValidated,
  processTissValidatedEnriched,
  processTissEnrichedXmlGenerated,
  processTissXmlGeneratedBatchCreated,
  processTissBatchCreatedProtocolSent,
  processTissProtocolSentPersisted,
} from "../../../src/lib/enterprise/runtime/index.ts";
import {
  ENTERPRISE_TISS_QUEUE_NAME,
  enqueueTissReceivedJob,
  resetQueueRuntimeIdSequences,
  TISS_JOB_STATUS_RECEIVED,
  TISS_JOB_STATUS_OCR_COMPLETED,
  TISS_JOB_STATUS_PARSED,
  TISS_JOB_STATUS_VALIDATED,
  TISS_JOB_STATUS_ENRICHED,
  TISS_JOB_STATUS_XML_GENERATED,
  TISS_JOB_STATUS_BATCH_CREATED,
  TISS_JOB_STATUS_PROTOCOL_SENT,
  TISS_JOB_STATUS_PERSISTED,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
import { createOCRProviderPort } from "../../../src/lib/enterprise/ocr-provider/index.ts";
import { createDocumentExtractionRuntimePort } from "../../../src/lib/enterprise/document-extraction-runtime/index.ts";
import { createValidationRuntimePort } from "../../../src/lib/enterprise/validation-runtime/index.ts";
import { createAutoFillRuntimePort } from "../../../src/lib/enterprise/auto-fill-runtime/index.ts";
import { createXMLTISSRuntimePort } from "../../../src/lib/enterprise/xml-tiss-runtime/index.ts";
import { createBatchRuntimePort } from "../../../src/lib/enterprise/batch-runtime/index.ts";
import { createProtocolRuntimePort } from "../../../src/lib/enterprise/protocol-runtime/index.ts";
import { createPersistentQueueRuntimePort } from "../../../src/lib/enterprise/persistent-queue-runtime/index.ts";

describe("A8-E2E-01 — Enterprise End-to-End Certification (OCR → Persistence)", () => {
  it("1. Pipeline completo via getEnterpriseRuntime(), com metadados canônicos preservados", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const E2E_CORRELATION_ID = "corr-e2e-a8e2e";
    const E2E_SESSION_ID = "sess-e2e-a8e2e";
    const E2E_DOCUMENT_ID = "doc-e2e-a8e2e";
    const E2E_TENANT_ID = "tenant-e2e-a8e2e";
    const E2E_TRACE_ID = "trace-e2e-a8e2e";
    const E2E_PAYLOAD_REF = "storage://tiss/doc-e2e-a8e2e";
    const E2E_RUNTIME_ID = "rt-e2e-a8e2e";

    const rawOcrResult = {
      fullText: "Guia TISS de teste A8-E2E-01.",
      pages: [
        {
          pageNumber: 1,
          width: 612,
          height: 792,
          unit: "pt",
          rawText: "Guia TISS de teste A8-E2E-01.",
          lines: [],
          words: [],
        },
      ],
      averageConfidence: 0.95,
      provider: "mock",
      providerVersion: "1.0.0",
      processingTimeMs: 12,
      wordCount: 6,
      pageCount: 1,
      metadata: {},
    } as any;

    const runtime = createEnterpriseRuntime({
      runtimeId: E2E_RUNTIME_ID,
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
      documentExtractionRuntimePort: createDocumentExtractionRuntimePort({
        provider: "real-tiss",
        rawOcrResult,
      }),
      validationRuntimePort: createValidationRuntimePort({ provider: "real-tiss" }),
      autoFillRuntimePort: createAutoFillRuntimePort({ provider: "real-tiss" }),
      xmlTissRuntimePort: createXMLTISSRuntimePort({ provider: "real-tiss" }),
      batchRuntimePort: createBatchRuntimePort({ provider: "real-tiss" }),
      protocolRuntimePort: createProtocolRuntimePort({ provider: "real-tiss" }),
      persistentQueueRuntimePort: createPersistentQueueRuntimePort({ provider: "real-tiss" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const queue = runtime.getQueueRuntimePort();

    // 01A — Entrada do boletim via QueueRuntimePort
    const received = await enqueueTissReceivedJob({
      getQueueRuntimePort: () => queue,
      source: "e2e-intake",
      jobId: "job-e2e-received",
      correlationId: E2E_CORRELATION_ID,
      sessionId: E2E_SESSION_ID,
      documentId: E2E_DOCUMENT_ID,
      payloadRef: E2E_PAYLOAD_REF,
      channel: "tiss-e2e",
      metadata: {
        kind: "canonical-queue-metadata",
        sessionId: E2E_SESSION_ID,
        correlationId: E2E_CORRELATION_ID,
        source: "e2e-intake",
        tags: ["tiss-job", TISS_JOB_STATUS_RECEIVED],
        customAttributes: {
          tenantId: E2E_TENANT_ID,
          traceId: E2E_TRACE_ID,
        },
      },
    });
    console.log("[A8-E2E-01] RECEIVED enqueued:", received.ok, received.job?.jobId, received.job?.status);
    assert.equal(received.ok, true, "RECEIVED deve ser enfileirado");
    assert.equal(received.job?.status, TISS_JOB_STATUS_RECEIVED);
    assert.equal(received.job?.correlationId, E2E_CORRELATION_ID);

    const stage = async (
      runner: (opts: { workerName?: string; pollIntervalMs?: number; waitTimeoutMs?: number }) => Promise<{ ok: boolean; job?: { jobId: string; previousJobId: string; status: string } | null }>,
      workerName: string,
      status: string,
      previousJobId: string,
    ) => {
      const result = await runner({
        workerName,
        pollIntervalMs: 25,
        waitTimeoutMs: 5_000,
      });
      console.log(`[A8-E2E-01] ${status} result: ok=${result.ok} jobId=${result.job?.jobId} previousJobId=${result.job?.previousJobId} code=${(result as any).code} message=${(result as any).message}`);
      assert.equal(result.ok, true, `${status} deve concluir`);
      assert.equal(result.job?.status, status);
      assert.equal(result.job?.previousJobId, previousJobId);

      const peeked = await queue.peek({
        queueName: ENTERPRISE_TISS_QUEUE_NAME,
        messageId: result.job!.jobId,
      });
      assert.equal(peeked.ok, true, `${status} deve estar na fila`);
      assert.equal(peeked.queueMessage?.metadata?.correlationId, E2E_CORRELATION_ID, "correlationId preservado");
      assert.equal(peeked.queueMessage?.metadata?.sessionId, E2E_SESSION_ID, "sessionId preservado");
      assert.equal(peeked.queueMessage?.payloadRef, E2E_PAYLOAD_REF, "payloadRef preservado");
      assert.equal(peeked.queueMessage?.metadata?.customAttributes?.previousJobId, previousJobId, "previousJobId preservado");
      assert.equal(peeked.queueMessage?.metadata?.customAttributes?.documentId, E2E_DOCUMENT_ID, "documentId preservado");
      assert.equal(peeked.queueMessage?.metadata?.customAttributes?.status, status, `status=${status}`);
      assert.equal(peeked.queueMessage?.metadata?.customAttributes?.tissJobStatus, status, `tissJobStatus=${status}`);

      // Canonical Metadata Certification — campos presentes no metadado TISS
      const ca = peeked.queueMessage?.metadata?.customAttributes;
      assert.ok(ca, "customAttributes presente");
      if (status === TISS_JOB_STATUS_PERSISTED) {
        console.log(`[A8-E2E-01] ${status} customAttributes keys: ${Object.keys(ca ?? {}).join(", ")}`);
      }

      return result;
    };

    // OCR → PARSED
    const rOcr = await stage(processTissReceivedOcr, "e2e-ocr", TISS_JOB_STATUS_OCR_COMPLETED, "job-e2e-received");
    // Parser → VALIDATED
    const rParsed = await stage(processTissOcrParsed, "e2e-parser", TISS_JOB_STATUS_PARSED, rOcr.job!.jobId);
    // Validation → ENRICHED
    const rValidated = await stage(processTissParsedValidated, "e2e-validation", TISS_JOB_STATUS_VALIDATED, rParsed.job!.jobId);
    // Enrichment → XML_GENERATED
    const rEnriched = await stage(processTissValidatedEnriched, "e2e-enrichment", TISS_JOB_STATUS_ENRICHED, rValidated.job!.jobId);
    // XML → BATCH_CREATED
    const rXml = await stage(processTissEnrichedXmlGenerated, "e2e-xml", TISS_JOB_STATUS_XML_GENERATED, rEnriched.job!.jobId);
    // Batch → PROTOCOL_SENT
    const rBatch = await stage(processTissXmlGeneratedBatchCreated, "e2e-batch", TISS_JOB_STATUS_BATCH_CREATED, rXml.job!.jobId);
    // Protocol → PERSISTED
    const rProtocol = await stage(processTissBatchCreatedProtocolSent, "e2e-protocol", TISS_JOB_STATUS_PROTOCOL_SENT, rBatch.job!.jobId);
    // Persistence
    const rPersisted = await processTissProtocolSentPersisted({
      workerName: "e2e-persistence",
      pollIntervalMs: 25,
      waitTimeoutMs: 5_000,
    });
    console.log(`[A8-E2E-01] PERSISTED result: ok=${rPersisted.ok} jobId=${rPersisted.job?.jobId} previousJobId=${rPersisted.job?.previousJobId} code=${rPersisted.code} message=${rPersisted.message}`);
    assert.equal(rPersisted.ok, true, "PERSISTED deve concluir");
    assert.equal(rPersisted.job?.status, TISS_JOB_STATUS_PERSISTED);
    assert.equal(rPersisted.job?.previousJobId, rProtocol.job!.jobId);
    assert.equal(rPersisted.auditExecuted, false, "Audit NÃO executado");
    assert.equal(rPersisted.completedExecuted, false, "Completed NÃO executado");
    assert.equal(rPersisted.infrastructure.persistentQueueRuntimePort, true);
    assert.equal(rPersisted.infrastructure.queueRuntimePort, true);
    assert.equal(rPersisted.infrastructure.workerRuntimePort, true);
    assert.equal(rPersisted.infrastructure.schedulerRuntimePort, true);
    assert.equal(rPersisted.infrastructure.observabilityRuntimePort, true);
    assert.equal(rPersisted.infrastructure.retryInfrastructure, true);
    assert.equal(rPersisted.infrastructure.deadLetterRuntime, true);

    const finalPeek = await queue.peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: rPersisted.job!.jobId,
    });
    assert.equal(finalPeek.ok, true);
    assert.equal(finalPeek.queueMessage?.metadata?.correlationId, E2E_CORRELATION_ID);
    assert.equal(finalPeek.queueMessage?.metadata?.sessionId, E2E_SESSION_ID);
    assert.equal(finalPeek.queueMessage?.payloadRef, E2E_PAYLOAD_REF);
    assert.equal(finalPeek.queueMessage?.metadata?.customAttributes?.previousJobId, rProtocol.job!.jobId);
    assert.equal(finalPeek.queueMessage?.metadata?.customAttributes?.documentId, E2E_DOCUMENT_ID);
    assert.equal(finalPeek.queueMessage?.metadata?.customAttributes?.status, TISS_JOB_STATUS_PERSISTED);
    assert.equal(finalPeek.queueMessage?.metadata?.customAttributes?.tissJobStatus, TISS_JOB_STATUS_PERSISTED);
    assert.equal(finalPeek.queueMessage?.metadata?.customAttributes?.persistenceExecuted, true);
    assert.equal(finalPeek.queueMessage?.metadata?.customAttributes?.persisted, true);
    assert.equal(finalPeek.queueMessage?.metadata?.customAttributes?.auditExecuted, false);
    assert.equal(finalPeek.queueMessage?.metadata?.customAttributes?.completedExecuted, false);

    // Canonical Metadata Certification — verifica chaves presentes no PERSISTED
    const finalCa = finalPeek.queueMessage?.metadata?.customAttributes;
    const keys = Object.keys(finalCa ?? {});
    console.log(`[A8-E2E-01] Pipeline concluído. jobId=${rPersisted.job!.jobId}`);
    console.log(`[A8-E2E-01] Cadeia de previousJobId: ${[
      "job-e2e-received",
      rOcr.job!.jobId,
      rParsed.job!.jobId,
      rValidated.job!.jobId,
      rEnriched.job!.jobId,
      rXml.job!.jobId,
      rBatch.job!.jobId,
      rProtocol.job!.jobId,
      rPersisted.job!.jobId,
    ].join(" -> ")}`);
    console.log(`[A8-E2E-01] CustomAttributes keys no PERSISTED: ${keys.join(", ")}`);

    // Idempotência / sem duplicidade: jobIds únicos
    const jobIds = [
      "job-e2e-received",
      rOcr.job!.jobId,
      rParsed.job!.jobId,
      rValidated.job!.jobId,
      rEnriched.job!.jobId,
      rXml.job!.jobId,
      rBatch.job!.jobId,
      rProtocol.job!.jobId,
      rPersisted.job!.jobId,
    ];
    const unique = new Set(jobIds);
    assert.equal(unique.size, jobIds.length, "todos os jobIds devem ser únicos (sem duplicidade)");

    // Sem loops: previousJobId forma uma cadeia linear unívoca
    const previousChain = [rOcr.job!.previousJobId, rParsed.job!.previousJobId, rValidated.job!.previousJobId, rEnriched.job!.previousJobId, rXml.job!.previousJobId, rBatch.job!.previousJobId, rProtocol.job!.previousJobId, rPersisted.job!.previousJobId];
    const expectedPrevious = ["job-e2e-received", rOcr.job!.jobId, rParsed.job!.jobId, rValidated.job!.jobId, rEnriched.job!.jobId, rXml.job!.jobId, rBatch.job!.jobId, rProtocol.job!.jobId];
    assert.deepEqual(previousChain, expectedPrevious, "cadeia previousJobId deve ser linear");
  });
});

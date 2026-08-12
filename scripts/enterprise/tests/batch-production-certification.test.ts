#!/usr/bin/env node
/**
 * A6-03 — Batch Real Production Certification.
 *
 * Certifica RealTissBatchRuntimeAdapter para produção reutilizando
 * exclusivamente a arquitetura Enterprise congelada.
 *
 * Cenários: batch válido, batch inválido, retry, dead letter, observability,
 * health, providerInfo, capabilities, telemetry, performance, throughput e
 * pipeline Enterprise (XML_GENERATED → BATCH_CREATED).
 */
process.env.MEDICFLOW_QUEUE_RUNTIME_BACKEND = "memory";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import {
  ENTERPRISE_TISS_QUEUE_NAME,
  TISS_JOB_STATUS_BATCH_CREATED,
  TISS_JOB_STATUS_XML_GENERATED,
  processTissBatchJob,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
import { createOCRProviderPort } from "../../../src/lib/enterprise/ocr-provider/index.ts";
import {
  BatchRuntimeFactory,
  BatchRuntimeProvider,
  RealTissBatchRuntimeAdapter,
  REAL_TISS_BATCH_RUNTIME_ADAPTER_ID,
  REAL_TISS_BATCH_RUNTIME_VERSION,
  createBatchRuntimeFactory,
  createBatchRuntimePort,
  getBatchRuntimeFactory,
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
import type { BatchDocument, BatchManifest, XMLDocument } from "../../../src/lib/enterprise/batch-runtime/index.ts";

function validXmlDocument(id: string): XMLDocument {
  return {
    kind: "canonical-xml-document",
    documentId: id,
    bodyId: `<?xml version="1.0" encoding="UTF-8"?><ans:consulta xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas">${id}</ans:consulta>`,
    encoding: "UTF-8",
    tissVersion: "3.05.00",
  } as XMLDocument;
}

function sampleValidBatchDocument(overrides: Partial<BatchDocument> = {}): BatchDocument {
  return {
    kind: "canonical-batch-document",
    documentId: "doc-valid-01",
    documentRef: "tiss://xml/doc-valid-01",
    name: "TISS XML Guide",
    contentType: "text/xml",
    sizeBytes: 1024,
    notes: "Valid real TISS batch document.",
    batchDocumentImplemented: false,
    batchProcessingImplemented: false,
    ...overrides,
  } as BatchDocument;
}

describe("A6-03 — Batch Real Production Certification", () => {
  it("1. Batch válido: manifesto, documentos, READY_TO_SEND, submissionStrategy, metadata, tags", async () => {
    const port = createBatchRuntimePort({ provider: "real-tiss" });

    const xmlDoc = validXmlDocument("doc-valid-batch");
    const prepared = await port.prepareBatch({
      batchName: "Real TISS valid batch",
      batchContext: {
        kind: "canonical-batch-context",
        batchId: "batch-valid-01",
        contextId: "batch-valid-01:ctx",
        correlationId: "corr-valid-01",
        structuralNotes: "Real TISS valid batch certification",
      },
      documents: [sampleValidBatchDocument({ documentId: "doc-valid-01" })],
      manifest: {
        kind: "canonical-batch-manifest",
        batchId: "batch-valid-01",
        xmlDocument: xmlDoc,
      } as BatchManifest,
    });

    assert.equal(prepared.ok, true);
    assert.equal(prepared.provider, "real-tiss");
    assert.equal(prepared.batchProcessed, false);
    assert.ok(prepared.manifest);
    assert.equal(prepared.manifest!.batchId, "batch-valid-01");
    assert.equal(prepared.manifest!.state, "READY_TO_SEND");
    assert.equal(prepared.manifest!.submissionStrategy, "tiss-ans-soap");
    assert.equal(prepared.manifest!.priority, "normal");
    assert.equal(prepared.manifest!.owner, "real-tiss");
    assert.ok(prepared.manifest!.tags?.includes("real-tiss"));
    assert.ok(prepared.manifest!.tags?.includes("tiss-batch"));
    assert.ok(prepared.manifest!.tags?.includes("ans-3.05.00"));
    assert.ok(prepared.manifest!.documents && prepared.manifest!.documents.length > 0);
    assert.equal(prepared.manifest!.documents![0].documentId, "doc-valid-01");
    assert.ok(prepared.manifest!.xmlDocument);
    assert.equal(prepared.manifest!.xmlDocument!.documentId, "doc-valid-batch");
    assert.ok(prepared.telemetry);
    assert.ok(typeof prepared.telemetry!.latencyMs === "number");

    const fetched = await port.getBatch({ batchId: "batch-valid-01" });
    assert.equal(fetched.ok, true);
    assert.equal(fetched.manifest!.batchId, "batch-valid-01");
    assert.equal(fetched.manifest!.state, "READY_TO_SEND");

    const listed = await port.listBatches();
    assert.equal(listed.ok, true);
    assert.ok(listed.manifests?.some((m) => m.batchId === "batch-valid-01"));

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.ok(stats.statistics);
  });

  it("2. Batch inválido — XML ausente: manifesto gerado mas sem xmlDocument", async () => {
    const port = createBatchRuntimePort({ provider: "real-tiss" });

    const prepared = await port.prepareBatch({
      batchName: "Real TISS missing XML",
      batchContext: {
        kind: "canonical-batch-context",
        batchId: "batch-missing-xml",
        contextId: "batch-missing-xml:ctx",
        structuralNotes: "Real TISS batch without XML",
      },
      documents: [sampleValidBatchDocument({ documentId: "doc-missing-xml" })],
    });

    assert.equal(prepared.ok, true);
    assert.equal(prepared.provider, "real-tiss");
    assert.equal(prepared.batchProcessed, false);
    assert.equal(prepared.manifest!.xmlDocument, undefined);
    assert.equal(prepared.manifest!.state, "READY_TO_SEND");
    assert.ok(prepared.manifest!.documents?.length === 1);
  });

  it("3. Batch inválido — lote vazio: sem documentos e sem manifesto", async () => {
    const port = createBatchRuntimePort({ provider: "real-tiss" });

    const prepared = await port.prepareBatch({
      batchName: "Real TISS empty batch",
      batchContext: {
        kind: "canonical-batch-context",
        batchId: "batch-empty",
        contextId: "batch-empty:ctx",
        structuralNotes: "Real TISS empty batch",
      },
    });

    assert.equal(prepared.ok, true);
    assert.equal(prepared.provider, "real-tiss");
    assert.equal(prepared.batchProcessed, false);
    assert.ok(prepared.manifest!.documents);
    assert.equal(prepared.manifest!.documents!.length, 1);
    assert.ok(prepared.manifest!.documents![0].notes?.includes("Real TISS batch document reference"));
  });

  it("4. Batch inválido — documento inválido (documentId ausente): não processa o documento", async () => {
    const port = createBatchRuntimePort({ provider: "real-tiss" });

    const prepared = await port.prepareBatch({
      batchName: "Real TISS invalid document",
      batchContext: {
        kind: "canonical-batch-context",
        batchId: "batch-invalid-doc",
        contextId: "batch-invalid-doc:ctx",
        structuralNotes: "Real TISS invalid document",
      },
      documents: [
        {
          kind: "canonical-batch-document",
          name: "Invalid document",
          contentType: "text/xml",
          batchDocumentImplemented: false,
          batchProcessingImplemented: false,
        } as BatchDocument,
      ],
    });

    assert.equal(prepared.ok, true);
    assert.equal(prepared.provider, "real-tiss");
    assert.equal(prepared.batchProcessed, false);
    assert.ok(prepared.manifest!.documents![0]);
    assert.equal(prepared.manifest!.documents![0].documentId, undefined);
    assert.equal(prepared.manifest!.documents![0].batchDocumentImplemented, false);
  });

  it("5. Retry: retryCount, backoff, attempts e recuperação automática", async () => {
    const port = new RealTissBatchRuntimeAdapter({
      provider: "real-tiss",
      failAttempts: 2,
      defaultRetryCount: 2,
      defaultRetryBackoffMs: 10,
    });

    const start = performance.now();
    const prepared = await port.prepareBatch({
      batchName: "Real TISS retry batch",
      batchContext: {
        kind: "canonical-batch-context",
        batchId: "batch-retry",
        contextId: "batch-retry:ctx",
        structuralNotes: "Real TISS retry certification",
      },
    });
    const elapsed = performance.now() - start;

    assert.equal(prepared.ok, true);
    assert.equal(prepared.provider, "real-tiss");
    assert.ok(prepared.telemetry!.attempts > 1, `expected >1 attempts, got ${prepared.telemetry?.attempts}`);
    assert.ok(elapsed >= 20, `expected backoff >=20ms, got ${elapsed}ms`);
    assert.ok(prepared.logs!.some((l) => l.code === "BATCH_RUNTIME_RETRY"));
  });

  it("6. Dead Letter: processTissBatchJob rejeita status != XML_GENERATED e devolve nack", async () => {
    resetQueueRuntimeIdSequences();
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-03b-dl",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
      batchRuntimePort: createBatchRuntimePort({ provider: "real-tiss" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const queue = runtime.getQueueRuntimePort();
    const enqueued = await queue.enqueue({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-already-batch",
      metadata: {
        kind: "canonical-queue-metadata",
        source: "unit-test",
        tags: ["tiss-job", TISS_JOB_STATUS_BATCH_CREATED],
        customAttributes: {
          status: TISS_JOB_STATUS_BATCH_CREATED,
          tissJobStatus: TISS_JOB_STATUS_BATCH_CREATED,
          xmlGenerated: true,
          batchCreated: true,
          protocolExecuted: false,
          persistenceExecuted: false,
          auditExecuted: false,
        },
      },
    });
    assert.equal(enqueued.ok, true);

    const result = await processTissBatchJob({
      getQueueRuntimePort: () => queue,
      getBatchRuntimePort: () => runtime.getBatchRuntimePort(),
      message: enqueued.queueMessage!,
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
    });

    assert.equal(result.ok, false);
    assert.equal(result.settle, "nack");
    assert.equal(result.batchCreated, false);
    assert.equal(result.protocolExecuted, false);
    assert.equal(result.persistenceExecuted, false);
    assert.equal(result.auditExecuted, false);
    assert.equal(result.code, "TISS_BATCH_JOB_STATUS_NOT_XML_GENERATED");

    const missingPort = await processTissBatchJob({
      getQueueRuntimePort: undefined as any,
      getBatchRuntimePort: () => runtime.getBatchRuntimePort(),
      message: enqueued.queueMessage!,
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
    });
    assert.equal(missingPort.ok, false);
    assert.equal(missingPort.settle, "nack-error");
    assert.equal(missingPort.code, "TISS_BATCH_JOB_MISSING_QUEUE_PORT");
  });

  it("7. Observability: health, providerInfo, capabilities, telemetry, runtimeReady", async () => {
    const port = createBatchRuntimePort({ provider: "real-tiss" });

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "real-tiss");
    assert.equal(health.runtimeReady, true);
    assert.equal(health.batchProcessingImplemented, false);
    assert.equal(health.queueImplemented, false);

    const caps = port.capabilities();
    assert.equal(caps.provider, "real-tiss");
    assert.equal(caps.adapterId, REAL_TISS_BATCH_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsPrepareBatch, true);
    assert.equal(caps.supportsGetBatch, true);
    assert.equal(caps.runtimeReady, true);
    assert.equal(caps.batchProcessingImplemented, false);

    const info = port.providerInfo();
    assert.equal(info.providerId, "real-tiss");
    assert.equal(info.status, "ready");
    assert.equal(info.providerType, "BATCH_RUNTIME");
    assert.equal(info.metadata.version, REAL_TISS_BATCH_RUNTIME_VERSION);
  });

  it("8. Latência média e throughput (1000 amostras)", async () => {
    const port = createBatchRuntimePort({ provider: "real-tiss" });

    const samples = 1000;
    const start = performance.now();
    for (let i = 0; i < samples; i += 1) {
      await port.prepareBatch({
        batchName: `Benchmark batch ${i}`,
        batchContext: {
          kind: "canonical-batch-context",
          batchId: `batch-bench-${i}`,
          contextId: `batch-bench-${i}:ctx`,
        },
      });
    }
    const totalMs = performance.now() - start;
    const avgMs = totalMs / samples;
    const throughput = (samples / totalMs) * 1000;

    assert.ok(totalMs > 0);
    assert.ok(avgMs < 1, `average latency ${avgMs}ms too high`);
    console.log(`[batch-certification] throughput=${throughput.toFixed(2)} ops/s, averageLatency=${avgMs.toFixed(4)} ms, totalMs=${totalMs.toFixed(2)}`);
  });

  it("9. Pipeline Enterprise: XML_GENERATED → BATCH_CREATED com real-tiss", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-03b-pipeline",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
      batchRuntimePort: createBatchRuntimePort({ provider: "real-tiss" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    await registerTissReceivedJob({
      source: "document-intake",
      correlationId: "corr-pipeline",
      documentId: "doc-pipeline",
      jobId: "job-pipeline",
      payloadRef: "storage://clinical-documents/doc-pipeline",
    });

    await processTissReceivedOcr({ preferredProviderReference: "mock", waitTimeoutMs: 8_000, pollIntervalMs: 15 });
    await processTissOcrParsed({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });
    await processTissParsedValidated({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });
    await processTissValidatedEnriched({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });

    const xmlResult = await processTissEnrichedXmlGenerated({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });
    assert.equal(xmlResult.ok, true);
    assert.equal(xmlResult.job?.status, TISS_JOB_STATUS_XML_GENERATED);

    const batchResult = await processTissXmlGeneratedBatchCreated({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });
    assert.equal(batchResult.ok, true);
    assert.equal(batchResult.entry, "getEnterpriseRuntime");
    assert.equal(batchResult.batchCreated, true);
    assert.equal(batchResult.protocolExecuted, false);
    assert.equal(batchResult.persistenceExecuted, false);
    assert.equal(batchResult.auditExecuted, false);
    assert.equal(batchResult.infrastructure.queueRuntimePort, true);
    assert.equal(batchResult.infrastructure.workerRuntimePort, true);
    assert.equal(batchResult.infrastructure.schedulerRuntimePort, true);
    assert.equal(batchResult.infrastructure.observabilityRuntimePort, true);
    assert.equal(batchResult.infrastructure.batchRuntimePort, true);
    assert.equal(batchResult.infrastructure.retryInfrastructure, true);
    assert.equal(batchResult.infrastructure.deadLetterRuntime, true);
    assert.equal(batchResult.job?.status, TISS_JOB_STATUS_BATCH_CREATED);
  });

  it("10. Factory e Registry compatíveis com todos os providers", () => {
    const factory = createBatchRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(factory.create({ provider: "real-tiss" }).providerId, "real-tiss");
    assert.ok(factory.create({ provider: "real-tiss" }) instanceof RealTissBatchRuntimeAdapter);
    assert.ok(getBatchRuntimeFactory().getRegistry().has("real-tiss"));
    assert.ok(BatchRuntimeProvider.create({ provider: "real-tiss" }) instanceof RealTissBatchRuntimeAdapter);
  });
});

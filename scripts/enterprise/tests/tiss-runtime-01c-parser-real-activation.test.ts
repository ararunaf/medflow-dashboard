#!/usr/bin/env node
/**
 * TISS-RUNTIME-01C-A2 — Parser Real Activation.
 *
 * Prova:
 *   Job OCR_COMPLETED
 *     → getEnterpriseRuntime()
 *     → WorkerRuntimePort
 *     → DocumentExtractionRuntimePort (real-tiss)
 *     → RealTissDocumentExtractionRuntimeAdapter
 *     → TissParser.parse(rawOcrResult)
 *     → Job PARSED reenfileirado
 *     → Validation NÃO executada
 *
 * Nenhum Port / Runtime / Gateway / Pipeline / Foundation alterado além
 * do registro do adapter real na factory oficial (F3-CAP-07).
 */
process.env.MEDICFLOW_QUEUE_RUNTIME_BACKEND = "memory";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { RawOcrResult } from "../../../src/lib/capture/ocr/types/raw-ocr-result.ts";
import { createOCRProviderPort } from "../../../src/lib/enterprise/ocr-provider/index.ts";
import {
  ENTERPRISE_TISS_QUEUE_NAME,
  TISS_JOB_STATUS_OCR_COMPLETED,
  TISS_JOB_STATUS_PARSED,
  resetQueueRuntimeIdSequences,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
import {
  createDocumentExtractionRuntimePort,
  getDocumentExtractionRuntimeHealthSummary,
} from "../../../src/lib/enterprise/document-extraction-runtime/index.ts";
import {
  createEnterpriseRuntime,
  processTissOcrParsed,
  processTissReceivedOcr,
  registerTissReceivedJob,
  resetEnterpriseRuntimeForTests,
  setEnterpriseRuntimeForTests,
} from "../../../src/lib/enterprise/runtime/index.ts";

function buildSampleOcr(): RawOcrResult {
  const rawText = [
    "GUIA DE CONSULTA",
    "NOME DO BENEFICIARIO: JOAO DA SILVA",
    "NUMERO DA CARTEIRA: 123456789",
    "DATA DO ATENDIMENTO: 01/01/2024",
  ].join("\n");

  return {
    fullText: rawText,
    pages: [
      {
        pageNumber: 1,
        width: 800,
        height: 1000,
        unit: "px",
        rawText,
        lines: [
          {
            text: "GUIA DE CONSULTA",
            confidence: 0.99,
            coordinates: {
              boundingBox: { x: 200, y: 50, width: 400, height: 30 },
            },
            words: [
              { text: "GUIA", confidence: 0.99, coordinates: { boundingBox: { x: 200, y: 50, width: 80, height: 30 } } },
              { text: "DE", confidence: 0.99, coordinates: { boundingBox: { x: 290, y: 50, width: 40, height: 30 } } },
              { text: "CONSULTA", confidence: 0.99, coordinates: { boundingBox: { x: 340, y: 50, width: 120, height: 30 } } },
            ],
          },
          {
            text: "NOME DO BENEFICIARIO: JOAO DA SILVA",
            confidence: 0.95,
            coordinates: {
              boundingBox: { x: 50, y: 120, width: 500, height: 25 },
            },
            words: [
              { text: "NOME", confidence: 0.95, coordinates: { boundingBox: { x: 50, y: 120, width: 60, height: 25 } } },
              { text: "DO", confidence: 0.95, coordinates: { boundingBox: { x: 120, y: 120, width: 30, height: 25 } } },
              { text: "BENEFICIARIO:", confidence: 0.95, coordinates: { boundingBox: { x: 160, y: 120, width: 130, height: 25 } } },
              { text: "JOAO", confidence: 0.95, coordinates: { boundingBox: { x: 300, y: 120, width: 70, height: 25 } } },
              { text: "DA", confidence: 0.95, coordinates: { boundingBox: { x: 380, y: 120, width: 30, height: 25 } } },
              { text: "SILVA", confidence: 0.95, coordinates: { boundingBox: { x: 420, y: 120, width: 70, height: 25 } } },
            ],
          },
          {
            text: "NUMERO DA CARTEIRA: 123456789",
            confidence: 0.94,
            coordinates: {
              boundingBox: { x: 50, y: 160, width: 400, height: 25 },
            },
            words: [
              { text: "NUMERO", confidence: 0.94, coordinates: { boundingBox: { x: 50, y: 160, width: 80, height: 25 } } },
              { text: "DA", confidence: 0.94, coordinates: { boundingBox: { x: 140, y: 160, width: 30, height: 25 } } },
              { text: "CARTEIRA:", confidence: 0.94, coordinates: { boundingBox: { x: 180, y: 160, width: 100, height: 25 } } },
              { text: "123456789", confidence: 0.94, coordinates: { boundingBox: { x: 290, y: 160, width: 120, height: 25 } } },
            ],
          },
          {
            text: "DATA DO ATENDIMENTO: 01/01/2024",
            confidence: 0.93,
            coordinates: {
              boundingBox: { x: 50, y: 200, width: 400, height: 25 },
            },
            words: [
              { text: "DATA", confidence: 0.93, coordinates: { boundingBox: { x: 50, y: 200, width: 60, height: 25 } } },
              { text: "DO", confidence: 0.93, coordinates: { boundingBox: { x: 120, y: 200, width: 30, height: 25 } } },
              { text: "ATENDIMENTO:", confidence: 0.93, coordinates: { boundingBox: { x: 160, y: 200, width: 130, height: 25 } } },
              { text: "01/01/2024", confidence: 0.93, coordinates: { boundingBox: { x: 300, y: 200, width: 120, height: 25 } } },
            ],
          },
        ],
        words: [],
      },
    ],
    averageConfidence: 0.95,
    provider: "azure",
    providerVersion: "1.0.0",
    processingTimeMs: 120,
    wordCount: 16,
    pageCount: 1,
    metadata: {},
  };
}

describe("TISS-RUNTIME-01C-A2 — Parser Real Activation", () => {
  it("OCR_COMPLETED → Parser REAL → PARSED via DocumentExtractionRuntimePort", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const documentExtractionRuntimePort = createDocumentExtractionRuntimePort({
      provider: "real-tiss",
      rawOcrResult: buildSampleOcr(),
    });

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-01c-real",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
      documentExtractionRuntimePort,
    });
    setEnterpriseRuntimeForTests(runtime);

    const registered = await registerTissReceivedJob({
      source: "document-intake",
      correlationId: "corr-tiss-01c-real",
      sessionId: "session-tiss-01c-real",
      documentId: "doc-tiss-01c-real",
      payloadRef: "storage://clinical-documents/doc-tiss-01c-real",
      jobId: "job-tiss-01c-real",
      channel: "capture-upload",
    });
    assert.equal(registered.ok, true);
    assert.equal(registered.job?.status, "RECEIVED");

    const ocrResult = await processTissReceivedOcr({
      preferredProviderReference: "mock",
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(ocrResult.ok, true);
    assert.equal(ocrResult.ocrExecuted, true);
    assert.equal(ocrResult.parserExecuted, false);
    assert.equal(ocrResult.job?.status, TISS_JOB_STATUS_OCR_COMPLETED);

    const parserResult = await processTissOcrParsed({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(parserResult.ok, true);
    assert.equal(parserResult.entry, "getEnterpriseRuntime");
    assert.equal(parserResult.runtimeId, "test-tiss-01c-real");
    assert.equal(parserResult.parserExecuted, true);
    assert.equal(parserResult.validationExecuted, false);
    assert.equal(parserResult.ocrExecuted, true);
    assert.ok(parserResult.job);
    assert.equal(parserResult.job!.status, TISS_JOB_STATUS_PARSED);
    assert.equal(parserResult.job!.previousJobId, "job-tiss-01c-real:ocr-completed");
    assert.equal(parserResult.job!.queueName, ENTERPRISE_TISS_QUEUE_NAME);
    assert.equal(parserResult.job!.correlationId, "corr-tiss-01c-real");

    const peeked = await runtime.getQueueRuntimePort().peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-tiss-01c-real:ocr-completed:parsed",
    });
    assert.equal(peeked.ok, true);
    assert.equal(peeked.queueMessage?.messageId, "job-tiss-01c-real:ocr-completed:parsed");
    assert.equal(peeked.queueMessage?.status, "enqueued");
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.tissJobStatus, TISS_JOB_STATUS_PARSED);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.parserExecuted, true);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.validationExecuted, false);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.ocrExecuted, true);
  });

  it("DocumentExtractionRuntimePort real retorna fields estruturados do TissParser", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const port = createDocumentExtractionRuntimePort({
      provider: "real-tiss",
      rawOcrResult: buildSampleOcr(),
    });

    const opened = await port.openJob({
      jobId: "job-real-tiss-unit",
      requestId: "req-real-tiss-unit",
      metadata: {
        kind: "canonical-extraction-metadata",
        jobId: "job-real-tiss-unit",
        requestId: "req-real-tiss-unit",
        documentId: "doc-real-tiss-unit",
      },
    });
    assert.equal(opened.ok, true);

    const submitted = await port.submitRequest({
      jobId: "job-real-tiss-unit",
      requestId: "req-real-tiss-unit",
      documentId: "doc-real-tiss-unit",
      metadata: {
        kind: "canonical-extraction-metadata",
        jobId: "job-real-tiss-unit",
        requestId: "req-real-tiss-unit",
        documentId: "doc-real-tiss-unit",
      },
    });
    assert.equal(submitted.ok, true);

    const result = await port.getResult({ requestId: "req-real-tiss-unit" });
    assert.equal(result.ok, true);
    assert.equal(result.provider, "real-tiss");
    assert.ok(result.result);
    assert.ok(result.result!.fields);
    assert.ok(result.result!.fields!.length > 0);
    assert.equal(result.result!.status, "processed");
    assert.equal(result.result!.code, "REAL_TISS_PARSER_OK");
  });

  it("health do DocumentExtractionRuntimePort real reflete provider real-tiss", async () => {
    const port = createDocumentExtractionRuntimePort({
      provider: "real-tiss",
      rawOcrResult: buildSampleOcr(),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "real-tiss");
    assert.equal(health.runtimeReady, true);
  });

  it("observability através do Enterprise Runtime health", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const port = createDocumentExtractionRuntimePort({
      provider: "real-tiss",
      rawOcrResult: buildSampleOcr(),
    });

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-01c-real-obs",
      documentExtractionRuntimePort: port,
    });
    setEnterpriseRuntimeForTests(runtime);

    const runtimePort = runtime.getDocumentExtractionRuntimePort();
    const summary = await getDocumentExtractionRuntimeHealthSummary(runtimePort);
    assert.equal(summary.health.ok, true);
    assert.equal(summary.health.provider, "real-tiss");
    assert.equal(summary.info.providerId, "real-tiss");
  });
});

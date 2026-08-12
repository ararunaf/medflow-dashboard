#!/usr/bin/env node
/**
 * TISS-RUNTIME-02A-A3 — Validation Real Activation.
 *
 * Prova:
 *   Job PARSED
 *     → getEnterpriseRuntime()
 *     → WorkerRuntimePort
 *     → ValidationRuntimePort (real-tiss)
 *     → RealTissValidationRuntimeAdapter
 *     → Validação TISS real sobre DocumentExtractionResult
 *     → Job VALIDATED reenfileirado
 *     → Enrichment/Enriquecimento NÃO executado
 *
 * Sem alterar Port, Runtime, Gateway, Pipeline, Queue, Worker, Scheduler,
 * Retry, Dead Letter, Observability ou Foundations.
 */
process.env.MEDICFLOW_QUEUE_RUNTIME_BACKEND = "memory";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { RawOcrResult } from "../../../src/lib/capture/ocr/types/raw-ocr-result.ts";
import { createOCRProviderPort } from "../../../src/lib/enterprise/ocr-provider/index.ts";
import { createDocumentExtractionRuntimePort } from "../../../src/lib/enterprise/document-extraction-runtime/index.ts";
import { createValidationRuntimePort } from "../../../src/lib/enterprise/validation-runtime/index.ts";
import {
  ENTERPRISE_TISS_QUEUE_NAME,
  TISS_JOB_STATUS_OCR_COMPLETED,
  TISS_JOB_STATUS_PARSED,
  TISS_JOB_STATUS_VALIDATED,
  resetQueueRuntimeIdSequences,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
import {
  createEnterpriseRuntime,
  processTissOcrParsed,
  processTissParsedValidated,
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
              {
                text: "GUIA",
                confidence: 0.99,
                coordinates: { boundingBox: { x: 200, y: 50, width: 80, height: 30 } },
              },
              {
                text: "DE",
                confidence: 0.99,
                coordinates: { boundingBox: { x: 290, y: 50, width: 40, height: 30 } },
              },
              {
                text: "CONSULTA",
                confidence: 0.99,
                coordinates: { boundingBox: { x: 340, y: 50, width: 120, height: 30 } },
              },
            ],
          },
          {
            text: "NOME DO BENEFICIARIO: JOAO DA SILVA",
            confidence: 0.95,
            coordinates: {
              boundingBox: { x: 50, y: 120, width: 500, height: 25 },
            },
            words: [
              {
                text: "NOME",
                confidence: 0.95,
                coordinates: { boundingBox: { x: 50, y: 120, width: 60, height: 25 } },
              },
              {
                text: "DO",
                confidence: 0.95,
                coordinates: { boundingBox: { x: 120, y: 120, width: 30, height: 25 } },
              },
              {
                text: "BENEFICIARIO:",
                confidence: 0.95,
                coordinates: { boundingBox: { x: 160, y: 120, width: 130, height: 25 } },
              },
              {
                text: "JOAO",
                confidence: 0.95,
                coordinates: { boundingBox: { x: 300, y: 120, width: 70, height: 25 } },
              },
              {
                text: "DA",
                confidence: 0.95,
                coordinates: { boundingBox: { x: 380, y: 120, width: 30, height: 25 } },
              },
              {
                text: "SILVA",
                confidence: 0.95,
                coordinates: { boundingBox: { x: 420, y: 120, width: 70, height: 25 } },
              },
            ],
          },
          {
            text: "NUMERO DA CARTEIRA: 123456789",
            confidence: 0.94,
            coordinates: {
              boundingBox: { x: 50, y: 160, width: 400, height: 25 },
            },
            words: [
              {
                text: "NUMERO",
                confidence: 0.94,
                coordinates: { boundingBox: { x: 50, y: 160, width: 80, height: 25 } },
              },
              {
                text: "DA",
                confidence: 0.94,
                coordinates: { boundingBox: { x: 140, y: 160, width: 30, height: 25 } },
              },
              {
                text: "CARTEIRA:",
                confidence: 0.94,
                coordinates: { boundingBox: { x: 180, y: 160, width: 100, height: 25 } },
              },
              {
                text: "123456789",
                confidence: 0.94,
                coordinates: { boundingBox: { x: 290, y: 160, width: 120, height: 25 } },
              },
            ],
          },
          {
            text: "DATA DO ATENDIMENTO: 01/01/2024",
            confidence: 0.93,
            coordinates: {
              boundingBox: { x: 50, y: 200, width: 400, height: 25 },
            },
            words: [
              {
                text: "DATA",
                confidence: 0.93,
                coordinates: { boundingBox: { x: 50, y: 200, width: 60, height: 25 } },
              },
              {
                text: "DO",
                confidence: 0.93,
                coordinates: { boundingBox: { x: 120, y: 200, width: 30, height: 25 } },
              },
              {
                text: "ATENDIMENTO:",
                confidence: 0.93,
                coordinates: { boundingBox: { x: 160, y: 200, width: 130, height: 25 } },
              },
              {
                text: "01/01/2024",
                confidence: 0.93,
                coordinates: { boundingBox: { x: 300, y: 200, width: 120, height: 25 } },
              },
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

function buildMissingFieldOcr(): RawOcrResult {
  const rawText = [
    "GUIA DE CONSULTA",
    "NOME DO BENEFICIARIO: JOAO DA SILVA",
    // NUMERO DA CARTEIRA propositalmente ausente
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
            coordinates: { boundingBox: { x: 200, y: 50, width: 400, height: 30 } },
            words: [
              {
                text: "GUIA",
                confidence: 0.99,
                coordinates: { boundingBox: { x: 200, y: 50, width: 80, height: 30 } },
              },
              {
                text: "DE",
                confidence: 0.99,
                coordinates: { boundingBox: { x: 290, y: 50, width: 40, height: 30 } },
              },
              {
                text: "CONSULTA",
                confidence: 0.99,
                coordinates: { boundingBox: { x: 340, y: 50, width: 120, height: 30 } },
              },
            ],
          },
          {
            text: "NOME DO BENEFICIARIO: JOAO DA SILVA",
            confidence: 0.95,
            coordinates: { boundingBox: { x: 50, y: 120, width: 500, height: 25 } },
            words: [
              {
                text: "NOME",
                confidence: 0.95,
                coordinates: { boundingBox: { x: 50, y: 120, width: 60, height: 25 } },
              },
              {
                text: "DO",
                confidence: 0.95,
                coordinates: { boundingBox: { x: 120, y: 120, width: 30, height: 25 } },
              },
              {
                text: "BENEFICIARIO:",
                confidence: 0.95,
                coordinates: { boundingBox: { x: 160, y: 120, width: 130, height: 25 } },
              },
              {
                text: "JOAO",
                confidence: 0.95,
                coordinates: { boundingBox: { x: 300, y: 120, width: 70, height: 25 } },
              },
              {
                text: "DA",
                confidence: 0.95,
                coordinates: { boundingBox: { x: 380, y: 120, width: 30, height: 25 } },
              },
              {
                text: "SILVA",
                confidence: 0.95,
                coordinates: { boundingBox: { x: 420, y: 120, width: 70, height: 25 } },
              },
            ],
          },
          {
            text: "DATA DO ATENDIMENTO: 01/01/2024",
            confidence: 0.93,
            coordinates: { boundingBox: { x: 50, y: 200, width: 400, height: 25 } },
            words: [
              {
                text: "DATA",
                confidence: 0.93,
                coordinates: { boundingBox: { x: 50, y: 200, width: 60, height: 25 } },
              },
              {
                text: "DO",
                confidence: 0.93,
                coordinates: { boundingBox: { x: 120, y: 200, width: 30, height: 25 } },
              },
              {
                text: "ATENDIMENTO:",
                confidence: 0.93,
                coordinates: { boundingBox: { x: 160, y: 200, width: 130, height: 25 } },
              },
              {
                text: "01/01/2024",
                confidence: 0.93,
                coordinates: { boundingBox: { x: 300, y: 200, width: 120, height: 25 } },
              },
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
    wordCount: 12,
    pageCount: 1,
    metadata: {},
  };
}

function buildRuntime(rawOcrResult: RawOcrResult) {
  const documentExtractionRuntimePort = createDocumentExtractionRuntimePort({
    provider: "real-tiss",
    rawOcrResult,
  });

  const runtimeRef = { current: undefined as any };
  const validationRuntimePort = createValidationRuntimePort({
    provider: "real-tiss",
    enterpriseDeps: {
      getDocumentExtractionRuntimePort: () => runtimeRef.current.getDocumentExtractionRuntimePort(),
    },
  });

  const runtime = createEnterpriseRuntime({
    runtimeId: "test-tiss-02a-real",
    ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    documentExtractionRuntimePort,
    validationRuntimePort,
  });
  runtimeRef.current = runtime;

  return runtime;
}

describe("TISS-RUNTIME-02A-A3 — Validation Real Activation", () => {
  it("PARSED → RealTissValidationRuntimeAdapter → VALIDATED com validação real", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtime = buildRuntime(buildSampleOcr());
    setEnterpriseRuntimeForTests(runtime);

    const registered = await registerTissReceivedJob({
      source: "document-intake",
      correlationId: "corr-tiss-02a-real",
      sessionId: "session-tiss-02a-real",
      documentId: "doc-tiss-02a-real",
      payloadRef: "storage://clinical-documents/doc-tiss-02a-real",
      jobId: "job-tiss-02a-real",
      channel: "capture-upload",
    });
    assert.equal(registered.ok, true);

    const ocrResult = await processTissReceivedOcr({
      preferredProviderReference: "mock",
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(ocrResult.ok, true);
    assert.equal(ocrResult.job?.status, TISS_JOB_STATUS_OCR_COMPLETED);

    const parserResult = await processTissOcrParsed({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(parserResult.ok, true);
    assert.equal(parserResult.job?.status, TISS_JOB_STATUS_PARSED);

    const validationResult = await processTissParsedValidated({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(validationResult.ok, true);
    assert.equal(validationResult.entry, "getEnterpriseRuntime");
    assert.equal(validationResult.runtimeId, "test-tiss-02a-real");
    assert.equal(validationResult.validationExecuted, true);
    assert.equal(validationResult.enrichmentExecuted, false);
    assert.equal(validationResult.parserExecuted, true);
    assert.ok(validationResult.job);
    assert.equal(validationResult.job!.status, TISS_JOB_STATUS_VALIDATED);
    assert.equal(validationResult.job!.previousJobId, "job-tiss-02a-real:ocr-completed:parsed");
    assert.equal(validationResult.job!.correlationId, "corr-tiss-02a-real");

    const result = await runtime.getValidationRuntimePort().getResult({
      requestId: validationResult.job!.validationRuntimeRequestId,
    });
    assert.equal(result.ok, true);
    assert.equal(result.provider, "real-tiss");
    assert.ok(result.result);
    assert.ok(result.result!.status);
    assert.ok(result.result!.summary);
    assert.ok(result.result!.validationContext);

    const peeked = await runtime.getQueueRuntimePort().peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-tiss-02a-real:ocr-completed:parsed:validated",
    });
    assert.equal(peeked.ok, true);
    assert.equal(peeked.queueMessage?.status, "enqueued");
    assert.equal(
      peeked.queueMessage?.metadata?.customAttributes?.tissJobStatus,
      TISS_JOB_STATUS_VALIDATED,
    );
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.validationExecuted, true);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.enrichmentExecuted, false);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.xmlExecuted, false);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.batchExecuted, false);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.protocolExecuted, false);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.auditExecuted, false);
  });

  it("PARSED → VALIDATED com rejeição real quando campos estão ausentes", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtime = buildRuntime(buildMissingFieldOcr());
    setEnterpriseRuntimeForTests(runtime);

    await registerTissReceivedJob({
      source: "document-intake",
      correlationId: "corr-tiss-02a-reject",
      sessionId: "session-tiss-02a-reject",
      documentId: "doc-tiss-02a-reject",
      payloadRef: "storage://clinical-documents/doc-tiss-02a-reject",
      jobId: "job-tiss-02a-reject",
      channel: "capture-upload",
    });

    await processTissReceivedOcr({
      preferredProviderReference: "mock",
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });

    await processTissOcrParsed({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });

    const validationResult = await processTissParsedValidated({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(validationResult.ok, true);
    assert.equal(validationResult.job?.status, TISS_JOB_STATUS_VALIDATED);
    assert.equal(validationResult.validationExecuted, true);

    const result = await runtime.getValidationRuntimePort().getResult({
      requestId: validationResult.job!.validationRuntimeRequestId,
    });
    assert.equal(result.ok, true);
    assert.equal(result.provider, "real-tiss");
    assert.ok(result.result);
    assert.equal(result.result!.status, "rejected");
    assert.ok(result.result!.summary! && result.result!.summary!.errorCount > 0);
    assert.ok(result.result!.issues && result.result!.issues.length > 0);
  });
});

#!/usr/bin/env node
/**
 * A1-02 — Azure Document Intelligence OCR Real Activation.
 *
 * Prova:
 *   getEnterpriseRuntime() → OCRRuntimePort → OCRProviderPort
 *     → AzureDocumentIntelligenceAdapter → Texto extraído
 *
 *   Documento → getEnterpriseRuntime() → Worker → OCRRuntimePort → OCRProviderPort
 *     → Azure → OCR_COMPLETED na fila enterprise-tiss
 *
 * Não altera Runtime, Ports, Gateways, Pipeline nem Foundations.
 */
process.env.MEDICFLOW_QUEUE_RUNTIME_BACKEND = "memory";

import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  ENTERPRISE_TISS_QUEUE_NAME,
  resetQueueRuntimeIdSequences,
  TISS_JOB_STATUS_OCR_COMPLETED,
  TISS_JOB_STATUS_RECEIVED,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
import { AzureDocumentIntelligenceAdapter } from "../../../src/lib/enterprise/ocr-provider/adapters/index.ts";
import {
  createEnterpriseRuntime,
  getEnterpriseRuntime,
  processTissReceivedOcr,
  registerTissReceivedJob,
  resetEnterpriseRuntimeForTests,
  setEnterpriseRuntimeForTests,
} from "../../../src/lib/enterprise/runtime/index.ts";

const originalEnv = { ...process.env };

function setAzureEnv() {
  process.env.MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT =
    "https://test.cognitiveservices.azure.com";
  process.env.MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_KEY = "test-key";
}

function clearAzureEnv() {
  delete process.env.MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  delete process.env.MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_KEY;
  delete process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  delete process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;
}

function analyzeSucceededBody() {
  return {
    status: "succeeded",
    analyzeResult: {
      content: "Texto Azure OCR-01",
      pages: [
        {
          pageNumber: 1,
          width: 8.5,
          height: 11,
          unit: "inch",
          words: [
            { content: "Texto", confidence: 0.99, polygon: [0, 0, 10, 0, 10, 5, 0, 5] },
            { content: "Azure", confidence: 0.98, polygon: [12, 0, 22, 0, 22, 5, 12, 5] },
          ],
          lines: [{ content: "Texto Azure OCR-01", polygon: [0, 0, 22, 0, 22, 5, 0, 5] }],
        },
      ],
    },
  };
}

function mockAzureFetch(options?: { failAnalyzeTimes?: number }): typeof fetch {
  let analyzeFailures = options?.failAnalyzeTimes ?? 0;
  return async (input, init) => {
    const url = String(input);

    if (url.includes("/operations/")) {
      return new Response(JSON.stringify(analyzeSucceededBody()), { status: 200 });
    }

    if (url.includes(":analyze")) {
      if (analyzeFailures > 0) {
        analyzeFailures -= 1;
        return new Response(JSON.stringify({ error: { message: "Transient Azure failure" } }), {
          status: 500,
        });
      }
      return new Response(null, {
        status: 202,
        headers: { "operation-location": "https://test.cognitiveservices.azure.com/operations/1" },
      });
    }

    if (init?.method === "GET" || !init?.method) {
      return new Response(JSON.stringify({ modelId: "prebuilt-layout" }), { status: 200 });
    }

    return new Response("not found", { status: 404 });
  };
}

function resetState() {
  process.env = { ...originalEnv };
  process.env.MEDICFLOW_QUEUE_RUNTIME_BACKEND = "memory";
  resetEnterpriseRuntimeForTests();
  resetQueueRuntimeIdSequences();
}

function createMockAzureProvider(options?: { failAnalyzeTimes?: number }) {
  return new AzureDocumentIntelligenceAdapter({
    fetchFn: mockAzureFetch(options),
    pollIntervalMs: 1,
    maxPolls: 5,
    sleep: async () => undefined,
  });
}

async function enqueueReceived(jobId: string, runtimeId: string) {
  const registered = await registerTissReceivedJob({
    source: "document-intake",
    correlationId: `corr-${jobId}`,
    sessionId: `session-${jobId}`,
    documentId: `doc-${jobId}`,
    payloadRef: `storage://clinical-documents/${jobId}`,
    jobId,
    channel: "capture-upload",
  });
  assert.equal(registered.ok, true);
  assert.equal(registered.job?.status, TISS_JOB_STATUS_RECEIVED);
}

afterEach(() => {
  resetState();
});

describe("A1-02 Azure Document Intelligence OCR real activation", () => {
  it("OCRRuntimePort → OCRProviderPort → Azure extrai texto", async () => {
    setAzureEnv();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-ocr-real-direct",
      ocrProviderPort: createMockAzureProvider(),
    });
    setEnterpriseRuntimeForTests(runtime);
    assert.equal(getEnterpriseRuntime().runtimeId, runtime.runtimeId);

    const result = await getEnterpriseRuntime()
      .getOCRRuntimePort()
      .process({
        requestId: "req-ocr-real-01",
        fileBytes: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
        contentType: "application/pdf",
        documentId: "doc-ocr-real-01",
        preferredProviderReference: "azure",
        documentIdentityReference: { documentId: "doc-ocr-real-01", kind: "document" },
      });

    assert.equal(result.ok, true, result.message);
    assert.equal(result.realOcrExecuted, true);
    assert.equal(result.output?.structuredData?.extractedText, "Texto Azure OCR-01");
    assert.equal(result.processing?.status, "COMPLETED");
    assert.equal(result.processing?.customAttributes?.providerId, "azure");
  });

  it("TISS pipeline consome RECEIVED e produz OCR_COMPLETED com Azure", async () => {
    setAzureEnv();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-01b-real",
      ocrProviderPort: createMockAzureProvider(),
    });
    setEnterpriseRuntimeForTests(runtime);

    await enqueueReceived("job-tiss-01b-real", runtime.runtimeId);

    const result = await processTissReceivedOcr({
      workerName: "tiss-ocr-a1-02",
      fileBytes: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      contentType: "application/pdf",
      preferredProviderReference: "azure",
      pollIntervalMs: 5,
      waitTimeoutMs: 8_000,
    });

    assert.equal(result.ok, true, result.message);
    assert.equal(result.entry, "getEnterpriseRuntime");
    assert.equal(result.ocrExecuted, true);
    assert.equal(result.parserExecuted, false);
    assert.equal(result.job?.status, TISS_JOB_STATUS_OCR_COMPLETED);
    assert.ok(result.infrastructure?.queueRuntimePort);
    assert.ok(result.infrastructure?.workerRuntimePort);
    assert.ok(result.infrastructure?.ocrRuntimePort);
    assert.ok(result.infrastructure?.deadLetterRuntime);

    const peeked = await runtime.getQueueRuntimePort().peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-tiss-01b-real:ocr-completed",
    });
    assert.equal(peeked.ok, true);
    assert.equal(
      peeked.queueMessage?.metadata?.customAttributes?.tissJobStatus,
      TISS_JOB_STATUS_OCR_COMPLETED,
    );
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.ocrExecuted, true);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.parserExecuted, false);
  });

  it("falha de credenciais retorna nack (caminho Dead Letter)", async () => {
    clearAzureEnv();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-01b-dlq",
      ocrProviderPort: createMockAzureProvider(),
    });
    setEnterpriseRuntimeForTests(runtime);

    await enqueueReceived("job-tiss-01b-dlq", runtime.runtimeId);

    const result = await processTissReceivedOcr({
      workerName: "tiss-ocr-a1-02-dlq",
      fileBytes: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      contentType: "application/pdf",
      preferredProviderReference: "azure",
      pollIntervalMs: 5,
      waitTimeoutMs: 8_000,
    });

    assert.equal(result.ok, false);
    assert.equal(result.ocrExecuted, false);
    assert.equal(result.code, "TISS_OCR_JOB_OCR_FAILED");
    assert.ok(result.message?.includes("não configurado"));
  });

  it("retry recupera falha transitória da Azure no TISS pipeline", async () => {
    setAzureEnv();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-01b-retry",
      ocrProviderPort: createMockAzureProvider({ failAnalyzeTimes: 1 }),
    });
    setEnterpriseRuntimeForTests(runtime);

    await enqueueReceived("job-tiss-01b-retry", runtime.runtimeId);

    const result = await processTissReceivedOcr({
      workerName: "tiss-ocr-a1-02-retry",
      fileBytes: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      contentType: "application/pdf",
      preferredProviderReference: "azure",
      pollIntervalMs: 5,
      waitTimeoutMs: 8_000,
    });

    assert.equal(result.ok, true, result.message);
    assert.equal(result.ocrExecuted, true);
    assert.equal(result.job?.status, TISS_JOB_STATUS_OCR_COMPLETED);
  });
});

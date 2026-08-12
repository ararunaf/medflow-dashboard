#!/usr/bin/env node
/**
 * A2-03 — Parser Production Certification.
 *
 * Certifica o Parser real (RealTissDocumentExtractionRuntimeAdapter) para
 * produção sem alterar src/Runtime/Ports/Gateways/Pipeline/Foundations.
 *
 * Cenários:
 *   - documento simples
 *   - documento multipágina
 *   - documento incompleto
 *   - documento com campos ausentes
 *   - documento inválido
 *   - timeout / cancelamento
 *   - erro interno do parser
 *   - carga / latência / throughput
 *   - observability (health, telemetry)
 *   - ValidationRuntimePort NÃO executado
 */
process.env.MEDICFLOW_QUEUE_RUNTIME_BACKEND = "memory";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import type { RawOcrResult } from "../../../src/lib/capture/ocr/types/raw-ocr-result.ts";
import { createOCRProviderPort } from "../../../src/lib/enterprise/ocr-provider/index.ts";
import {
  ENTERPRISE_TISS_QUEUE_NAME,
  TISS_JOB_STATUS_OCR_COMPLETED,
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

function ocrLine(text: string, y: number): RawOcrResult["pages"][0]["lines"][0] {
  const words = text.split(/\s+/).map((w, i) => ({
    text: w,
    confidence: 0.95,
    coordinates: {
      boundingBox: { x: 10 + i * 60, y, width: 50, height: 20 },
    },
  }));
  return {
    text,
    confidence: 0.95,
    coordinates: {
      boundingBox: { x: 10, y, width: 500, height: 25 },
    },
    words,
  };
}

function buildOcr(title: string, lines: string[]): RawOcrResult {
  const rawText = lines.join("\n");
  return {
    fullText: rawText,
    pages: [
      {
        pageNumber: 1,
        width: 800,
        height: 1200,
        unit: "px",
        rawText,
        lines: lines.map((line, i) => ocrLine(line, 50 + i * 40)),
        words: [],
      },
    ],
    averageConfidence: 0.95,
    provider: "azure",
    providerVersion: "1.0.0",
    processingTimeMs: 100,
    wordCount: lines.length * 3,
    pageCount: 1,
    metadata: { title },
  };
}

function buildSimpleOcr(): RawOcrResult {
  return buildOcr("simples", [
    "GUIA DE CONSULTA",
    "NOME DO BENEFICIARIO: JOAO DA SILVA",
    "NUMERO DA CARTEIRA: 123456789",
    "DATA DO ATENDIMENTO: 01/01/2024",
    "CODIGO OPERADORA: 12345",
  ]);
}

function buildMultiPageOcr(): RawOcrResult {
  const page1 = buildOcr("multi-p1", [
    "GUIA DE CONSULTA",
    "NOME DO BENEFICIARIO: MARIA OLIVEIRA",
    "NUMERO DA CARTEIRA: 987654321",
  ]);
  const page2 = buildOcr("multi-p2", [
    "GUIA DE CONSULTA - CONTINUACAO",
    "DATA DO ATENDIMENTO: 15/06/2024",
    "CODIGO DO PRESTADOR: 54321",
  ]);
  return {
    ...page1,
    pages: [page1.pages[0]!, page2.pages[0]!],
    pageCount: 2,
    wordCount: 12,
    fullText: [page1.fullText, page2.fullText].join("\n---\n"),
  };
}

function buildIncompleteOcr(): RawOcrResult {
  return buildOcr("incompleto", [
    "GUIA DE CONSULTA",
    "NOME DO BENEFICIARIO: PEDRO SOUZA",
    // carteira e data ausentes propositalmente
  ]);
}

function buildMissingOcr(): RawOcrResult {
  return buildOcr("campos-ausentes", [
    "NOTA FISCAL",
    "PRODUTO: CONSULTA MEDICA",
    "VALOR: R$ 150,00",
    // nenhum campo TISS esperado
  ]);
}

function buildInvalidOcr(): unknown {
  return { fullText: "", metadata: {} } as unknown;
}

function buildSubmitInput(ocr: RawOcrResult, requestId: string) {
  return {
    jobId: `job-${requestId}`,
    requestId,
    documentId: `doc-${requestId}`,
    metadata: {
      kind: "canonical-extraction-metadata" as const,
      jobId: `job-${requestId}`,
      requestId,
      documentId: `doc-${requestId}`,
      customAttributes: {
        rawOcrResult: JSON.stringify(ocr),
      },
    },
  };
}

describe("A2-03 — Parser Production Certification", () => {
  it("documento simples produz fields, summary e status processed", async () => {
    const port = createDocumentExtractionRuntimePort({ provider: "real-tiss" });
    await port.openJob({ jobId: "job-simples", requestId: "req-simples" });
    await port.submitRequest(buildSubmitInput(buildSimpleOcr(), "req-simples"));
    const res = await port.getResult({ requestId: "req-simples" });
    assert.equal(res.ok, true);
    assert.equal(res.provider, "real-tiss");
    assert.equal(res.result?.status, "processed");
    assert.ok(res.result?.fields && res.result.fields.length > 0);
    assert.ok(res.result?.summary);
    assert.equal(res.result?.code, "REAL_TISS_PARSER_OK");
    assert.ok(res.telemetry && res.telemetry.attempts >= 1);
  });

  it("documento multipágina produz fields e summary", async () => {
    const port = createDocumentExtractionRuntimePort({ provider: "real-tiss" });
    await port.openJob({ jobId: "job-multi", requestId: "req-multi" });
    await port.submitRequest(buildSubmitInput(buildMultiPageOcr(), "req-multi"));
    const res = await port.getResult({ requestId: "req-multi" });
    assert.equal(res.ok, true);
    assert.equal(res.result?.status, "processed");
    assert.ok(res.result?.fields && res.result.fields.length > 0);
    assert.equal(res.result?.summary?.fieldCount, res.result!.fields!.length);
  });

  it("documento incompleto produz fields com status parcial", async () => {
    const port = createDocumentExtractionRuntimePort({ provider: "real-tiss" });
    await port.openJob({ jobId: "job-incompleto", requestId: "req-incompleto" });
    await port.submitRequest(buildSubmitInput(buildIncompleteOcr(), "req-incompleto"));
    const res = await port.getResult({ requestId: "req-incompleto" });
    assert.equal(res.ok, true);
    assert.equal(res.result?.status, "processed");
    assert.ok(res.result?.fields);
    // existem campos faltando
    assert.ok(res.result!.fields!.some((f) => f.status === "failed"));
  });

  it("documento com campos ausentes (não TISS) ainda produz estrutura canônica", async () => {
    const port = createDocumentExtractionRuntimePort({ provider: "real-tiss" });
    await port.openJob({ jobId: "job-missing", requestId: "req-missing" });
    await port.submitRequest(buildSubmitInput(buildMissingOcr(), "req-missing"));
    const res = await port.getResult({ requestId: "req-missing" });
    assert.equal(res.ok, true);
    assert.equal(res.result?.status, "processed");
    assert.ok(res.result?.fields);
  });

  it("documento inválido retorna ok=false com REAL_TISS_PARSER_FAILED", async () => {
    const port = createDocumentExtractionRuntimePort({
      provider: "real-tiss",
      rawOcrResult: buildInvalidOcr() as RawOcrResult,
    });
    await port.openJob({ jobId: "job-invalid", requestId: "req-invalid" });
    await port.submitRequest({
      jobId: "job-invalid",
      requestId: "req-invalid",
      documentId: "doc-invalid",
      metadata: {
        kind: "canonical-extraction-metadata",
        jobId: "job-invalid",
        requestId: "req-invalid",
        documentId: "doc-invalid",
      },
    });
    const res = await port.getResult({ requestId: "req-invalid" });
    assert.equal(res.ok, false);
    assert.equal(res.code, "REAL_TISS_PARSER_FAILED");
  });

  it("timeout / cancelamento retorna ok=false com telemetry.cancelled=true", async () => {
    const port = createDocumentExtractionRuntimePort({
      provider: "real-tiss",
      rawOcrResult: buildSimpleOcr(),
    });
    await port.openJob({ jobId: "job-cancel", requestId: "req-cancel" });
    await port.submitRequest({
      jobId: "job-cancel",
      requestId: "req-cancel",
      documentId: "doc-cancel",
      metadata: {
        kind: "canonical-extraction-metadata",
        jobId: "job-cancel",
        requestId: "req-cancel",
        documentId: "doc-cancel",
      },
    });
    const controller = new AbortController();
    controller.abort();
    const res = await port.getResult({
      requestId: "req-cancel",
      signal: controller.signal,
    });
    assert.equal(res.ok, false);
    assert.equal(res.telemetry?.cancelled, true);
  });

  it("erro interno do parser retorna ok=false e nack no pipeline", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const badParser = {
      parse: () => {
        throw new Error("parser inválido");
      },
      detectGuideType: () => ({
        guideType: "unknown" as const,
        confidence: 0,
        method: "unknown" as const,
        alternativeTypes: [],
      }),
    } as unknown as TissParser;

    const documentExtractionRuntimePort = createDocumentExtractionRuntimePort({
      provider: "real-tiss",
      rawOcrResult: buildSimpleOcr(),
      tissParser: badParser,
    });

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-02-error",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
      documentExtractionRuntimePort,
    });
    setEnterpriseRuntimeForTests(runtime);

    await registerTissReceivedJob({
      source: "document-intake",
      correlationId: "corr-tiss-02-error",
      sessionId: "session-tiss-02-error",
      documentId: "doc-tiss-02-error",
      payloadRef: "storage://clinical-documents/doc-tiss-02-error",
      jobId: "job-tiss-02-error",
      channel: "capture-upload",
    });

    const ocr = await processTissReceivedOcr({
      preferredProviderReference: "mock",
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(ocr.ok, true);
    assert.equal(ocr.job?.status, TISS_JOB_STATUS_OCR_COMPLETED);

    const parsed = await processTissOcrParsed({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(parsed.ok, false);
    assert.equal(parsed.parserExecuted, true);
    assert.equal(parsed.validationExecuted, false);
    assert.equal(parsed.infrastructure.deadLetterRuntime, true);
  });

  it("Retry: parser result expõe telemetry.attempts (retry herda do Default delegate)", async () => {
    const port = createDocumentExtractionRuntimePort({
      provider: "real-tiss",
      rawOcrResult: buildSimpleOcr(),
    });
    await port.openJob({ jobId: "job-retry", requestId: "req-retry" });
    await port.submitRequest({
      jobId: "job-retry",
      requestId: "req-retry",
      documentId: "doc-retry",
      metadata: {
        kind: "canonical-extraction-metadata",
        jobId: "job-retry",
        requestId: "req-retry",
        documentId: "doc-retry",
      },
    });
    const res = await port.getResult({ requestId: "req-retry" });
    assert.equal(res.ok, true);
    assert.ok(res.telemetry);
    assert.equal(res.telemetry?.attempts, 1);
    assert.equal(res.code, "REAL_TISS_PARSER_OK");
  });

  it("OCR_COMPLETED → Parser REAL → PARSED preserva correlationId e previousJobId", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const documentExtractionRuntimePort = createDocumentExtractionRuntimePort({
      provider: "real-tiss",
      rawOcrResult: buildSimpleOcr(),
    });

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-02-parsed",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
      documentExtractionRuntimePort,
    });
    setEnterpriseRuntimeForTests(runtime);

    const registered = await registerTissReceivedJob({
      source: "document-intake",
      correlationId: "corr-tiss-02-parsed",
      sessionId: "session-tiss-02-parsed",
      documentId: "doc-tiss-02-parsed",
      payloadRef: "storage://clinical-documents/doc-tiss-02-parsed",
      jobId: "job-tiss-02-parsed",
      channel: "capture-upload",
    });
    assert.equal(registered.ok, true);

    const ocr = await processTissReceivedOcr({
      preferredProviderReference: "mock",
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(ocr.ok, true);
    assert.equal(ocr.job?.status, TISS_JOB_STATUS_OCR_COMPLETED);

    const parsed = await processTissOcrParsed({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(parsed.ok, true);
    assert.equal(parsed.parserExecuted, true);
    assert.equal(parsed.validationExecuted, false);
    assert.equal(parsed.ocrExecuted, true);
    assert.equal(parsed.job?.status, "PARSED");
    assert.equal(parsed.job?.correlationId, "corr-tiss-02-parsed");
    assert.equal(parsed.job?.previousJobId, "job-tiss-02-parsed:ocr-completed");
  });

  it("carga: múltiplos PARSER consecutivos com latência e throughput", async () => {
    const port = createDocumentExtractionRuntimePort({
      provider: "real-tiss",
      rawOcrResult: buildSimpleOcr(),
    });
    await port.openJob({ jobId: "job-carga", requestId: "req-carga" });
    await port.submitRequest({
      jobId: "job-carga",
      requestId: "req-carga",
      documentId: "doc-carga",
      metadata: {
        kind: "canonical-extraction-metadata",
        jobId: "job-carga",
        requestId: "req-carga",
        documentId: "doc-carga",
      },
    });

    const runs = 20;
    const latencies: number[] = [];
    const start = performance.now();
    for (let i = 0; i < runs; i += 1) {
      const runStart = performance.now();
      const res = await port.getResult({ requestId: "req-carga" });
      const runEnd = performance.now();
      assert.equal(res.ok, true);
      latencies.push(runEnd - runStart);
    }
    const total = performance.now() - start;

    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const max = Math.max(...latencies);
    const min = Math.min(...latencies);
    const throughput = runs / (total / 1000);

    console.log("[PARSER-CERT] latência média (ms):", avg.toFixed(3));
    console.log("[PARSER-CERT] maior latência (ms):", max.toFixed(3));
    console.log("[PARSER-CERT] menor latência (ms):", min.toFixed(3));
    console.log("[PARSER-CERT] throughput (ops/s):", throughput.toFixed(2));

    assert.ok(avg > 0);
    assert.ok(max >= min);
    assert.ok(throughput > 0);
  });

  it("observability: health, capabilities e info do provider real-tiss", async () => {
    const port = createDocumentExtractionRuntimePort({
      provider: "real-tiss",
      rawOcrResult: buildSimpleOcr(),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "real-tiss");
    assert.equal(health.runtimeReady, true);

    const summary = await getDocumentExtractionRuntimeHealthSummary(port);
    assert.equal(summary.health.provider, "real-tiss");
    assert.equal(summary.info.providerId, "real-tiss");
    assert.equal(summary.capabilities.provider, "real-tiss");
  });
});

#!/usr/bin/env node
/**
 * A1-03 — Azure Document Intelligence OCR Production Certification.
 *
 * Certifica:
 *   - OCR em PDF 1 página, PDF multipágina, JPEG, PNG
 *   - texto, páginas, confiança, tempo de processamento
 *   - retry, timeout, 429, credencial/endpoint inválidos
 *   - carga (latência, throughput)
 *   - observability (health de runtime e provider)
 *
 * Não altera src/Runtime/Ports/Gateways/Pipeline/Foundations.
 */
process.env.MEDICFLOW_QUEUE_RUNTIME_BACKEND = "memory";

import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { AzureDocumentIntelligenceAdapter } from "../../../src/lib/enterprise/ocr-provider/adapters/index.ts";
import {
  createEnterpriseRuntime,
  getEnterpriseRuntime,
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

function buildAnalyzeResult(pages: number, withTable?: boolean) {
  const pageData = [];
  for (let i = 1; i <= pages; i++) {
    pageData.push({
      pageNumber: i,
      width: 8.5,
      height: 11,
      unit: "inch",
      words: [
        { content: "Página", confidence: 0.99, polygon: [0, 0, 20, 0, 20, 5, 0, 5] },
        { content: String(i), confidence: 0.98, polygon: [22, 0, 32, 0, 32, 5, 22, 5] },
      ],
      lines: [{ content: `Página ${i}`, polygon: [0, 0, 32, 0, 32, 5, 0, 5] }],
      ...(withTable && i === 1
        ? {
            tables: [
              {
                cells: [
                  { content: "Coluna A", rowIndex: 0, columnIndex: 0 },
                  { content: "Coluna B", rowIndex: 0, columnIndex: 1 },
                ],
              },
            ],
          }
        : {}),
    });
  }
  const fullText = pageData
    .map((p: { lines: { content: string }[] }) => p.lines[0].content)
    .join("\n\n");
  return {
    status: "succeeded",
    analyzeResult: {
      content: fullText,
      pages: pageData,
    },
  };
}

function mockAzureFetch(options?: {
  status?: "succeeded" | "running" | "unauthorized" | "notfound" | "rateLimited";
  pages?: number;
  withTable?: boolean;
  key?: string;
}): typeof fetch {
  let unauthorized = false;
  let rateLimited = options?.status === "rateLimited";
  const apiKey = options?.key ?? "test-key";

  return async (input, init) => {
    const url = String(input);

    if (
      init?.headers &&
      (init.headers as Record<string, string>)["Ocp-Apim-Subscription-Key"] !== apiKey
    ) {
      unauthorized = true;
    }

    if (unauthorized) {
      return new Response(
        JSON.stringify({ error: { message: "Access denied due to invalid subscription key." } }),
        {
          status: 401,
        },
      );
    }

    if (options?.status === "notfound" && url.includes(":analyze")) {
      return new Response(JSON.stringify({ error: { message: "Resource not found." } }), {
        status: 404,
      });
    }

    if (rateLimited) {
      rateLimited = false;
      return new Response(JSON.stringify({ error: { message: "Too many requests." } }), {
        status: 429,
      });
    }

    if (url.includes("/operations/")) {
      if (options?.status === "running") {
        return new Response(JSON.stringify({ status: "running" }), { status: 200 });
      }
      const pages = options?.pages ?? 1;
      return new Response(JSON.stringify(buildAnalyzeResult(pages, options?.withTable)), {
        status: 200,
      });
    }

    if (url.includes(":analyze")) {
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
}

function createRuntime(options?: {
  status?: "succeeded" | "running" | "unauthorized" | "notfound" | "rateLimited";
  pages?: number;
  withTable?: boolean;
  key?: string;
}) {
  const runtime = createEnterpriseRuntime({
    runtimeId: "test-ocr-prod-cert",
    ocrProviderPort: new AzureDocumentIntelligenceAdapter({
      fetchFn: mockAzureFetch(options),
      pollIntervalMs: 1,
      maxPolls: 5,
      sleep: async () => undefined,
    }),
  });
  setEnterpriseRuntimeForTests(runtime);
  return runtime;
}

function makeInput(contentType: string, requestId: string, extra?: Record<string, unknown>) {
  return {
    requestId,
    fileBytes: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
    contentType,
    documentId: `doc-${requestId}`,
    preferredProviderReference: "azure" as const,
    documentIdentityReference: { documentId: `doc-${requestId}`, kind: "document" as const },
    ...extra,
  };
}

afterEach(() => {
  resetState();
});

describe("A1-03 Azure OCR Production Certification", () => {
  it("OCR PDF 1 página extrai texto, confiança e tempo", async () => {
    setAzureEnv();
    createRuntime({ pages: 1 });

    const result = await getEnterpriseRuntime()
      .getOCRRuntimePort()
      .process(makeInput("application/pdf", "pdf-1p"));

    assert.equal(result.ok, true, result.message);
    assert.equal(result.realOcrExecuted, true);
    assert.equal(result.output?.structuredData?.extractedText, "Página 1");
    assert.equal(result.output?.structuredData?.pageCount, 1);
    assert.equal(typeof result.output?.structuredData?.averageConfidence, "number");
    assert.equal(result.output?.structuredData?.engine, "azure-document-intelligence");
    assert.ok(result.processing?.customAttributes?.telemetry?.latencyMs >= 0);
  });

  it("OCR PDF multipágina concatena texto e conta páginas", async () => {
    setAzureEnv();
    createRuntime({ pages: 3 });

    const result = await getEnterpriseRuntime()
      .getOCRRuntimePort()
      .process(makeInput("application/pdf", "pdf-3p"));

    assert.equal(result.ok, true);
    assert.equal(result.output?.structuredData?.pageCount, 3);
    assert.equal(result.output?.structuredData?.extractedText, "Página 1\n\nPágina 2\n\nPágina 3");
    assert.equal(result.output?.structuredData?.wordCount, 6);
  });

  it("OCR JPEG processa e extrai texto", async () => {
    setAzureEnv();
    createRuntime({ pages: 1 });

    const result = await getEnterpriseRuntime()
      .getOCRRuntimePort()
      .process(makeInput("image/jpeg", "jpeg-1"));

    assert.equal(result.ok, true);
    assert.equal(result.output?.structuredData?.extractedText, "Página 1");
  });

  it("OCR PNG processa e extrai texto", async () => {
    setAzureEnv();
    createRuntime({ pages: 1 });

    const result = await getEnterpriseRuntime()
      .getOCRRuntimePort()
      .process(makeInput("image/png", "png-1"));

    assert.equal(result.ok, true);
    assert.equal(result.output?.structuredData?.extractedText, "Página 1");
  });

  it("tabelas são suportadas pelo adapter (capability)", async () => {
    setAzureEnv();
    createRuntime({ pages: 1, withTable: true });

    const provider = getEnterpriseRuntime().getOCRProviderPort();
    assert.equal(provider.capabilities().ocr?.supportsTables, true);

    const result = await getEnterpriseRuntime()
      .getOCRRuntimePort()
      .process(makeInput("application/pdf", "table-1"));

    assert.equal(result.ok, true);
    assert.ok(result.output?.structuredData?.rawOcrResult);
  });

  it("credencial inválida retorna ok:false com mensagem de erro", async () => {
    setAzureEnv();
    createRuntime({ key: "invalid-key" });

    const result = await getEnterpriseRuntime()
      .getOCRRuntimePort()
      .process(makeInput("application/pdf", "bad-key"));

    assert.equal(result.ok, false);
    assert.match(result.message ?? "", /invalid subscription key|Access denied/i);
  });

  it("endpoint inválido retorna ok:false com mensagem de erro", async () => {
    setAzureEnv();
    createRuntime({ status: "notfound" });

    const result = await getEnterpriseRuntime()
      .getOCRRuntimePort()
      .process(makeInput("application/pdf", "bad-endpoint"));

    assert.equal(result.ok, false);
    assert.match(result.message ?? "", /not found|Falha/i);
  });

  it("timeout retorna ok:false sem sucesso", async () => {
    setAzureEnv();
    createRuntime({ status: "running" });

    const result = await getEnterpriseRuntime()
      .getOCRRuntimePort()
      .process({
        ...makeInput("application/pdf", "timeout"),
        timeoutMs: 1,
      });

    assert.equal(result.ok, false);
    assert.match(result.message ?? "", /Timeout|OCR timeout|timeout/i);
  });

  it("429 indisponibilidade é recuperado por retry", async () => {
    setAzureEnv();
    createRuntime({ status: "rateLimited" });

    const result = await getEnterpriseRuntime()
      .getOCRRuntimePort()
      .process(makeInput("application/pdf", "retry-429"));

    assert.equal(result.ok, true);
    assert.equal(result.output?.structuredData?.extractedText, "Página 1");
    assert.ok(
      result.processing?.customAttributes?.attempts &&
        result.processing.customAttributes.attempts > 1,
    );
  });

  it("carga: múltiplos OCR consecutivos com latência e throughput", async () => {
    setAzureEnv();
    createRuntime({ pages: 1 });

    const count = 10;
    const latencies: number[] = [];
    const start = Date.now();

    for (let i = 0; i < count; i++) {
      const t0 = Date.now();
      const result = await getEnterpriseRuntime()
        .getOCRRuntimePort()
        .process(makeInput("application/pdf", `load-${i}`));
      const t1 = Date.now();
      assert.equal(result.ok, true);
      latencies.push(t1 - t0);
    }

    const total = Date.now() - start;
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const min = Math.min(...latencies);
    const max = Math.max(...latencies);
    const throughput = (count / (total / 1000)).toFixed(2);

    console.log(
      `load: count=${count}, total=${total}ms, avg=${avg.toFixed(2)}ms, min=${min}ms, max=${max}ms, throughput=${throughput} ocr/s`,
    );

    assert.ok(avg >= 0);
    assert.ok(max < 1000, `max latency should be < 1000ms, got ${max}ms`);
    assert.ok(Number(throughput) > 0);
  });

  it("observability expõe health de runtime, provider e enterprise", async () => {
    setAzureEnv();
    createRuntime({ pages: 1 });

    const runtime = getEnterpriseRuntime();
    const providerHealth = await runtime.getOCRProviderPort().health();
    const runtimeHealth = await runtime.getOCRRuntimePort().health();
    const enterpriseHealth = await runtime.health();

    assert.equal(providerHealth.ok, true);
    assert.equal(providerHealth.provider, "azure");
    assert.equal(runtimeHealth.ok, true);
    assert.equal(enterpriseHealth.ok, true);
  });
});

#!/usr/bin/env node
/**
 * OCR-01 — Azure Document Intelligence Provider
 *
 * Prova:
 *   OCRProviderPort → AzureDocumentIntelligenceAdapter
 *   Enterprise Runtime → Capture Runtime → OCR Runtime → OCRProviderPort
 *   Orchestrator + retry + timeout + cancelamento + erro + Canonical OCR Result
 *   Ausência de dual-path / bypass HTTP fora do Adapter
 */
import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AZURE_DOCUMENT_INTELLIGENCE_ADAPTER_ID,
  AzureDocumentIntelligenceAdapter,
  createOCRProviderPort,
  resolveAzureDocumentIntelligenceConfig,
  type OCRProviderPort,
  type OCRProcessResult,
} from "../../../src/lib/enterprise/ocr-provider/index.ts";
import {
  createOCRRuntimePort,
  type CanonicalOCRResult,
} from "../../../src/lib/enterprise/ocr-runtime/index.ts";
import { createCanonicalExecutionOrchestratorPort } from "../../../src/lib/enterprise/canonical-execution-orchestrator/index.ts";
import {
  createEnterpriseRuntime,
  resetEnterpriseRuntimeForTests,
} from "../../../src/lib/enterprise/runtime/index.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../../..");

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  resetEnterpriseRuntimeForTests();
});

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

function mockAzureFetch(options?: {
  failAnalyzeTimes?: number;
  hangPoll?: boolean;
}): typeof fetch {
  let analyzeFailures = options?.failAnalyzeTimes ?? 0;
  return async (input, init) => {
    const url = String(input);
    if (url.includes(":analyze")) {
      if (analyzeFailures > 0) {
        analyzeFailures -= 1;
        return new Response(JSON.stringify({ error: { message: "transient" } }), { status: 500 });
      }
      return new Response(null, {
        status: 202,
        headers: { "operation-location": "https://test.cognitiveservices.azure.com/operations/1" },
      });
    }
    if (url.includes("/operations/")) {
      if (options?.hangPoll) {
        return new Response(JSON.stringify({ status: "running" }), { status: 200 });
      }
      return new Response(JSON.stringify(analyzeSucceededBody()), { status: 200 });
    }
    if (init?.method === "GET" || !init?.method) {
      return new Response(JSON.stringify({ modelId: "prebuilt-layout" }), { status: 200 });
    }
    return new Response("not found", { status: 404 });
  };
}

function assertCanonicalProcessResult(result: OCRProcessResult) {
  assert.equal(result.provider, "azure");
  assert.equal(result.processing.processorType, "OCR");
  assert.ok(result.output.outputId);
  assert.equal(typeof result.output.structuredData?.extractedText, "string");
  for (const key of Object.keys(result.output)) {
    assert.equal(
      ["ocrText", "ocrEngine", "boundingBoxes"].includes(key),
      false,
      `chave OCR específica proibida na raiz: ${key}`,
    );
  }
}

function assertCanonicalRuntimeResult(result: CanonicalOCRResult) {
  assert.equal(result.kind, "canonical-ocr-result");
  assert.equal(typeof result.ok, "boolean");
  if (result.ok && result.realOcrExecuted) {
    assert.ok(result.processing);
    assert.ok(result.output);
    assert.equal(result.processing?.processorType, "OCR");
  }
}

describe("OCR-01 AzureDocumentIntelligenceAdapter / OCRProviderPort", () => {
  it("factory resolve azure e adapter satisfaz OCRProviderPort", async () => {
    setAzureEnv();
    const port: OCRProviderPort = createOCRProviderPort({ provider: "azure" });
    assert.equal(port.providerId, "azure");
    assert.equal(port.capabilities().adapterId, AZURE_DOCUMENT_INTELLIGENCE_ADAPTER_ID);
    assert.equal(port.capabilities().supportsCanonicalProcessingOutput, true);

    const info = port.providerInfo();
    assert.equal(info.providerType, "OCR");
    assert.equal(info.providerId, "azure");

    const health = await port.health();
    assert.equal(health.provider, "azure");
  });

  it("validateConfiguration falha sem credenciais e passa com credenciais", async () => {
    clearAzureEnv();
    assert.equal(resolveAzureDocumentIntelligenceConfig(), null);
    const port = new AzureDocumentIntelligenceAdapter();
    const missing = await port.validateConfiguration();
    assert.equal(missing.ok, false);

    setAzureEnv();
    assert.ok(resolveAzureDocumentIntelligenceConfig());
    const ok = await port.validateConfiguration();
    assert.equal(ok.ok, true);
  });

  it("process retorna ProcessingOutput canônico via mocked Azure", async () => {
    setAzureEnv();
    const port = new AzureDocumentIntelligenceAdapter({
      fetchFn: mockAzureFetch(),
      pollIntervalMs: 1,
      maxPolls: 5,
      sleep: async () => undefined,
    });

    const result = await port.process({
      requestId: "req-ocr-01",
      contentType: "image/jpeg",
      language: "pt-BR",
      fileBytes: new Uint8Array([1, 2, 3]),
      documentIdentityReference: { documentId: "doc-1", kind: "document" },
    });

    assert.equal(result.ok, true);
    assert.equal(result.simulated, false);
    assertCanonicalProcessResult(result);
    assert.equal(result.output.structuredData?.extractedText, "Texto Azure OCR-01");
    assert.equal(result.processing.status, "COMPLETED");
    assert.ok(result.processing.customAttributes?.telemetry);
  });

  it("process empty document não chama Azure", async () => {
    setAzureEnv();
    const port = new AzureDocumentIntelligenceAdapter({
      fetchFn: async () => {
        throw new Error("fetch should not be called");
      },
    });
    const result = await port.process({
      contentType: "image/jpeg",
      fileBytes: new Uint8Array(0),
    });
    assert.equal(result.ok, true);
    assert.equal(result.output.structuredData?.emptyDocument, true);
  });

  it("retry configurável recupera falha transitória", async () => {
    setAzureEnv();
    const port = new AzureDocumentIntelligenceAdapter({
      fetchFn: mockAzureFetch({ failAnalyzeTimes: 1 }),
      pollIntervalMs: 1,
      maxPolls: 5,
      defaultRetryCount: 1,
      defaultRetryBackoffMs: 1,
      sleep: async () => undefined,
    });

    const result = await port.process({
      contentType: "image/jpeg",
      fileBytes: new Uint8Array([9]),
      retryCount: 1,
    });
    assert.equal(result.ok, true);
    assert.equal(result.processing.customAttributes?.attempts, 2);
  });

  it("timeout retorna erro canônico", async () => {
    setAzureEnv();
    const port = new AzureDocumentIntelligenceAdapter({
      fetchFn: mockAzureFetch({ hangPoll: true }),
      pollIntervalMs: 1,
      maxPolls: 2,
      defaultTimeoutMs: 5,
      sleep: async () => undefined,
    });

    const result = await port.process({
      contentType: "image/jpeg",
      fileBytes: new Uint8Array([1]),
      timeoutMs: 5,
      retryCount: 0,
    });
    assert.equal(result.ok, false);
    assert.match(result.message ?? "", /Timeout|timeout|OCR/i);
  });

  it("cancelamento via AbortSignal", async () => {
    setAzureEnv();
    const controller = new AbortController();
    controller.abort();
    const port = new AzureDocumentIntelligenceAdapter({
      fetchFn: mockAzureFetch(),
    });
    const result = await port.process({
      contentType: "image/jpeg",
      fileBytes: new Uint8Array([1]),
      signal: controller.signal,
    });
    assert.equal(result.ok, false);
    assert.match(result.message ?? "", /cancel/i);
  });

  it("erro de configuração retorna ok:false sem throw", async () => {
    clearAzureEnv();
    const port = new AzureDocumentIntelligenceAdapter({
      fetchFn: mockAzureFetch(),
    });
    const result = await port.process({
      contentType: "image/jpeg",
      fileBytes: new Uint8Array([1]),
    });
    assert.equal(result.ok, false);
    assert.match(result.message ?? "", /não configurado/i);
  });
});

describe("OCR-01 integração Enterprise / Capture / OCR Runtime / Orchestrator", () => {
  it("Enterprise Runtime wire azure como OCRProviderPort oficial", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    assert.equal(runtime.getOCRProviderPort().providerId, "azure");
    assert.equal(runtime.getOCRRuntimePort().capabilities().supportsProcess, true);
    assert.equal(runtime.getOCRRuntimePort().capabilities().implementsAzure, false);
    assert.equal(runtime.getCaptureEngineRuntimePort().capabilities().supportsProcessOcr, true);
    assert.equal(runtime.getCaptureEngineRuntimePort().capabilities().implementsOcr, false);
  });

  it("fluxo Capture → OCR Runtime → OCRProviderPort → Adapter", async () => {
    setAzureEnv();
    resetEnterpriseRuntimeForTests();
    const adapter = new AzureDocumentIntelligenceAdapter({
      fetchFn: mockAzureFetch(),
      pollIntervalMs: 1,
      maxPolls: 5,
      sleep: async () => undefined,
    });
    const runtime = createEnterpriseRuntime({
      runtimeId: "test",
      ocrProviderPort: adapter,
    });

    const result = await runtime.getCaptureEngineRuntimePort().processOcr({
      requestId: "cap-ocr-01",
      contentType: "image/jpeg",
      fileBytes: new Uint8Array([1, 2, 3]),
      sessionId: "sess-ocr-01",
      documentId: "doc-ocr-01",
      tenantRef: "tenant-1",
    });

    assertCanonicalRuntimeResult(result);
    assert.equal(result.ok, true);
    assert.equal(result.realOcrExecuted, true);
    assert.equal(result.output?.structuredData?.extractedText, "Texto Azure OCR-01");
    assert.ok(result.runtimeSessionId);
    assert.equal(result.session?.status, "completed");
  });

  it("OCR Runtime process usa exclusivamente OCRProviderPort", async () => {
    setAzureEnv();
    const orchestrator = createCanonicalExecutionOrchestratorPort({ provider: "mock" });
    const adapter = new AzureDocumentIntelligenceAdapter({
      fetchFn: mockAzureFetch(),
      pollIntervalMs: 1,
      maxPolls: 5,
      sleep: async () => undefined,
    });
    const port = createOCRRuntimePort({
      provider: "default",
      enterpriseDeps: {
        getOrchestratorPort: () => orchestrator,
        getOCRProviderPort: () => adapter,
      },
    });

    const result = await port.process({
      contentType: "application/pdf",
      fileBytes: new Uint8Array([1]),
      sessionId: "sess-rt",
      documentId: "doc-rt",
    });
    assert.equal(result.ok, true);
    assert.equal(result.kind, "canonical-ocr-result");
    assert.equal(result.processing?.processorType, "OCR");
  });

  it("coordinateOcr permanece coordenação sem bytes (sem OCR real)", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    const result = await runtime.getOCRRuntimePort().coordinateOcr({
      kind: "canonical-ocr-request",
      identity: { kind: "canonical-ocr-identity", documentId: "doc-coord" },
      metadata: { kind: "canonical-ocr-metadata", sessionId: "sess-coord" },
      configuration: {
        kind: "canonical-ocr-configuration",
        preferredProviderReference: "azure",
      },
    });
    assert.equal(result.ok, true);
    assert.equal(result.realOcrExecuted, false);
    assert.equal(result.session?.status, "coordinated");
  });
});

describe("OCR-01 auditoria dual-path / bypass Azure", () => {
  it("único fetch Azure autorizado está no AzureDocumentIntelligenceAdapter", () => {
    const adapterPath = join(
      repoRoot,
      "src/lib/enterprise/ocr-provider/adapters/azure-document-intelligence-adapter.ts",
    );
    const adapterSrc = readFileSync(adapterPath, "utf8");
    assert.match(adapterSrc, /documentintelligence/i);
    assert.match(adapterSrc, /fetchFn|fetch\(/);

    const productAzure = join(
      repoRoot,
      "src/lib/capture/ocr/providers/azure-document-intelligence-provider.ts",
    );
    const productSrc = readFileSync(productAzure, "utf8");
    assert.equal(/documentintelligence\/documentModels/i.test(productSrc), false);
    assert.equal(/Ocp-Apim-Subscription-Key/i.test(productSrc), false);
    assert.match(productSrc, /processCaptureOcrViaEnterprise|getEnterpriseRuntime|OCRProviderPort/);

    const ocrRuntimeDir = join(repoRoot, "src/lib/enterprise/ocr-runtime");
    const runtimeFiles: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (full.endsWith(".ts")) runtimeFiles.push(full);
      }
    };
    walk(ocrRuntimeDir);
    for (const file of runtimeFiles) {
      const src = readFileSync(file, "utf8");
      assert.equal(/documentintelligence\.azure\.com/i.test(src), false, file);
      assert.equal(/Ocp-Apim-Subscription-Key/i.test(src), false, file);
      assert.equal(/fetch\s*\(/.test(src), false, file);
    }
  });

  it("OCR Runtime chama OCRProviderPort.process (não Azure direto)", () => {
    const defaultAdapter = readFileSync(
      join(repoRoot, "src/lib/enterprise/ocr-runtime/adapters/default-ocr-runtime-adapter.ts"),
      "utf8",
    );
    assert.match(defaultAdapter, /ocrProvider\.process\s*\(/);
    assert.equal(/documentintelligence/i.test(defaultAdapter), false);
  });
});

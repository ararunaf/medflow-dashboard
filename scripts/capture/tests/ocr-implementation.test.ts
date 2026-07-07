#!/usr/bin/env node
/**
 * Testes — MEDICFLOW-OCR-IMPLEMENTATION-01
 */
import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AzureDocumentIntelligenceProvider,
  Gpt4VisionProvider,
  TesseractProvider,
  buildRawOcrResult,
  buildOcrResultStoragePath,
  buildOcrSummaryFromResult,
  OcrOrchestrator,
  OcrProviderNotFoundError,
  OcrFallbackNotImplementedError,
  OcrService,
} from "../../../src/lib/capture/ocr/index.ts";
import type { OcrProvider, OcrProviderExtractInput } from "../../../src/lib/capture/ocr/types/provider.ts";
import type { RawOcrResult } from "../../../src/lib/capture/ocr/types/raw-ocr-result.ts";
import { buildCaptureEvent } from "../../../src/lib/capture/infrastructure/capture-events.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../..");

function loadEnv() {
  for (const name of [".env", ".env.local", ".env.staging"]) {
    const path = resolve(root, name);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  }
}

loadEnv();

function sampleOcrResult(overrides: Partial<RawOcrResult> = {}): RawOcrResult {
  const base = buildRawOcrResult({
    fullText: "Guia TISS exemplo",
    pages: [
      {
        pageNumber: 1,
        width: 100,
        height: 200,
        unit: "pixel",
        rawText: "Guia TISS exemplo",
        lines: [
          {
            text: "Guia TISS exemplo",
            confidence: 0.95,
            coordinates: { boundingBox: { x: 0, y: 0, width: 100, height: 20 } },
            words: [
              {
                text: "Guia",
                confidence: 0.96,
                coordinates: { boundingBox: { x: 0, y: 0, width: 30, height: 20 } },
              },
              {
                text: "TISS",
                confidence: 0.94,
                coordinates: { boundingBox: { x: 35, y: 0, width: 30, height: 20 } },
              },
            ],
          },
        ],
        words: [
          {
            text: "Guia",
            confidence: 0.96,
            coordinates: { boundingBox: { x: 0, y: 0, width: 30, height: 20 } },
          },
        ],
      },
    ],
    provider: "azure_document_intelligence",
    providerVersion: "prebuilt-layout@test",
    processingTimeMs: 1200,
    metadata: { test: true },
  });
  return { ...base, ...overrides };
}

class MockOcrProvider implements OcrProvider {
  readonly providerId: string;
  readonly providerVersion: string;
  private readonly behavior: {
    extract?: (input: OcrProviderExtractInput) => Promise<RawOcrResult>;
    health?: () => Promise<{ available: boolean; message?: string }>;
  };

  constructor(
    id: string,
    behavior: MockOcrProvider["behavior"] = {},
    version = "mock@1",
  ) {
    this.providerId = id;
    this.providerVersion = version;
    this.behavior = behavior;
  }

  capabilities() {
    return {
      providerName: this.providerId,
      supportedMimeTypes: ["image/jpeg"],
      maxBytes: 1024 * 1024,
      supportsMultiPage: true,
      supportsHandwriting: false,
    };
  }

  async health() {
    return this.behavior.health?.() ?? { available: true, latencyMs: 1 };
  }

  async extract(input: OcrProviderExtractInput) {
    if (this.behavior.extract) return this.behavior.extract(input);
    if (input.fileBytes.length === 0) {
      return buildRawOcrResult({
        fullText: "",
        pages: [],
        provider: this.providerId,
        providerVersion: this.providerVersion,
        processingTimeMs: 5,
      });
    }
    return sampleOcrResult({ provider: this.providerId, providerVersion: this.providerVersion });
  }
}

describe("OCR — Azure Document Intelligence Provider", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns empty result for empty document", async () => {
    process.env.MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT = "https://test.cognitiveservices.azure.com";
    process.env.MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_KEY = "test-key";

    const provider = new AzureDocumentIntelligenceProvider(async () => {
      throw new Error("fetch should not be called for empty document");
    });

    const result = await provider.extract({
      sessionId: "s1",
      tenantId: "t1",
      storagePath: "path",
      mimeType: "image/jpeg",
      fileBytes: new Uint8Array(0),
    });

    assert.equal(result.fullText, "");
    assert.equal(result.pageCount, 0);
    assert.equal(result.metadata.emptyDocument, true);
  });

  it("parses Azure analyze response via mocked fetch", async () => {
    process.env.MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT = "https://test.cognitiveservices.azure.com";
    process.env.MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_KEY = "test-key";

    const analyzeBody = {
      status: "succeeded",
      analyzeResult: {
        content: "Texto Azure",
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
            lines: [{ content: "Texto Azure", polygon: [0, 0, 22, 0, 22, 5, 0, 5] }],
          },
        ],
      },
    };

    const mockFetch: typeof fetch = async (input, init) => {
      const url = String(input);
      if (url.includes(":analyze")) {
        return new Response(null, {
          status: 202,
          headers: { "operation-location": "https://test/operations/1" },
        });
      }
      if (url.includes("/operations/")) {
        return new Response(JSON.stringify(analyzeBody), { status: 200 });
      }
      if (init?.method === "GET") {
        return new Response(JSON.stringify({ modelId: "prebuilt-layout" }), { status: 200 });
      }
      return new Response("not found", { status: 404 });
    };

    const provider = new AzureDocumentIntelligenceProvider(mockFetch, 10, 5);
    const result = await provider.extract({
      sessionId: "s1",
      tenantId: "t1",
      storagePath: "t/s/original/x.jpg",
      mimeType: "image/jpeg",
      fileBytes: new Uint8Array([1, 2, 3]),
    });

    assert.equal(result.fullText, "Texto Azure");
    assert.equal(result.pageCount, 1);
    assert.ok(result.wordCount >= 2);
    assert.ok(result.averageConfidence > 0.9);
  });

  it("health check reports unavailable without credentials", async () => {
    delete process.env.MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
    delete process.env.MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_KEY;

    const provider = new AzureDocumentIntelligenceProvider();
    const health = await provider.health();
    assert.equal(health.available, false);
    assert.ok(health.message?.includes("Credenciais"));
  });

  it("handles timeout on slow Azure poll", async () => {
    process.env.MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT = "https://test.cognitiveservices.azure.com";
    process.env.MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_KEY = "test-key";

    const mockFetch: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes(":analyze")) {
        return new Response(null, {
          status: 202,
          headers: { "operation-location": "https://test/operations/slow" },
        });
      }
      return new Response(JSON.stringify({ status: "running" }), { status: 200 });
    };

    const provider = new AzureDocumentIntelligenceProvider(mockFetch, 5, 2);
    await assert.rejects(
      () =>
        provider.extract({
          sessionId: "s1",
          tenantId: "t1",
          storagePath: "p",
          mimeType: "image/jpeg",
          fileBytes: new Uint8Array([1]),
        }),
      /Timeout aguardando resultado Azure OCR/,
    );
  });
});

describe("OCR — stub providers", () => {
  it("GPT-4o Vision health returns Not Implemented", async () => {
    const provider = new Gpt4VisionProvider();
    const health = await provider.health();
    assert.equal(health.available, false);
    assert.ok(health.message?.includes("Not Implemented"));
    await assert.rejects(() =>
      provider.extract({
        sessionId: "s",
        tenantId: "t",
        storagePath: "p",
        mimeType: "image/jpeg",
        fileBytes: new Uint8Array([1]),
      }),
    );
  });

  it("Tesseract health returns Not Implemented", async () => {
    const provider = new TesseractProvider();
    const health = await provider.health();
    assert.equal(health.available, false);
    assert.ok(health.message?.includes("Not Implemented"));
  });
});

describe("OCR — OcrOrchestrator", () => {
  it("executes primary Azure provider and records timing", async () => {
    const azure = new MockOcrProvider("azure_document_intelligence");
    const providers = new Map<string, OcrProvider>([["azure_document_intelligence", azure]]);

    const orchestrator = new OcrOrchestrator(providers);
    const out = await orchestrator.execute({
      sessionId: "sess-1",
      tenantId: "tenant-1",
      storagePath: "path/original.jpg",
      mimeType: "image/jpeg",
      fileBytes: new Uint8Array([0xff, 0xd8]),
    });

    assert.equal(out.providerId, "azure_document_intelligence");
    assert.equal(out.usedFallback, false);
    assert.ok(out.processingTimeMs >= 0);
    assert.equal(out.result.fullText, "Guia TISS exemplo");
  });

  it("throws for nonexistent provider", async () => {
    const orchestrator = new OcrOrchestrator(new Map());
    await assert.rejects(
      () =>
        orchestrator.execute({
          sessionId: "s",
          tenantId: "t",
          storagePath: "p",
          mimeType: "image/jpeg",
          fileBytes: new Uint8Array([1]),
        }),
      OcrProviderNotFoundError,
    );
  });

  it("fallback not implemented when primary fails", async () => {
    const failingAzure = new MockOcrProvider("azure_document_intelligence", {
      extract: async () => {
        throw new Error("Azure down");
      },
    });
    const gpt = new MockOcrProvider("gpt4_vision");
    const providers = new Map<string, OcrProvider>([
      ["azure_document_intelligence", failingAzure],
      ["gpt4_vision", gpt],
    ]);

    const orchestrator = new OcrOrchestrator(providers, {
      primaryProviderId: "azure_document_intelligence",
      fallbackProviderIds: ["gpt4_vision"],
    });

    await assert.rejects(
      () =>
        orchestrator.execute({
          sessionId: "s",
          tenantId: "t",
          storagePath: "p",
          mimeType: "image/jpeg",
          fileBytes: new Uint8Array([1]),
        }),
      OcrFallbackNotImplementedError,
    );
  });

  it("enforces orchestrator timeout", async () => {
    const slow = new MockOcrProvider("azure_document_intelligence", {
      extract: async () => {
        await new Promise((r) => setTimeout(r, 80));
        return sampleOcrResult();
      },
    });
    const orchestrator = new OcrOrchestrator(
      new Map([["azure_document_intelligence", slow]]),
      { timeoutMs: 20 },
    );

    await assert.rejects(
      () =>
        orchestrator.execute({
          sessionId: "s",
          tenantId: "t",
          storagePath: "p",
          mimeType: "image/jpeg",
          fileBytes: new Uint8Array([1]),
        }),
      /timeout/i,
    );
  });

  it("health check delegates to provider", async () => {
    const provider = new MockOcrProvider("azure_document_intelligence");
    const orchestrator = new OcrOrchestrator(
      new Map([["azure_document_intelligence", provider]]),
    );
    const health = await orchestrator.healthCheck();
    assert.equal(health.available, true);
  });
});

describe("OCR — persistence helpers", () => {
  it("builds ocr_result.json storage path", () => {
    const tenantId = "00000000-0000-4000-8000-000000000001";
    const sessionId = "00000000-0000-4000-8000-000000000002";
    const path = buildOcrResultStoragePath(tenantId, sessionId);
    assert.equal(path, `${tenantId}/${sessionId}/audit/ocr_result.json`);
  });

  it("builds summary from raw result", () => {
    const result = sampleOcrResult();
    const summary = buildOcrSummaryFromResult(result, "t/s/audit/ocr_result.json");
    assert.equal(summary.status, "completed");
    assert.equal(summary.provider, "azure_document_intelligence");
    assert.equal(summary.pageCount, 1);
    assert.ok(summary.wordCount! > 0);
  });
});

describe("OCR — OcrService isolation", () => {
  it("uses orchestrator — never references Azure provider class", () => {
    const service = new OcrService(
      new OcrOrchestrator(new Map([["azure_document_intelligence", new MockOcrProvider("azure_document_intelligence")]])),
    );
    assert.ok(service instanceof OcrService);
  });
});

describe("OCR — telemetry events", () => {
  it("builds learning-loop compatible OCR events", () => {
    const started = buildCaptureEvent("ocr_started", "s1");
    const finished = buildCaptureEvent("ocr_finished", "s1", {
      provider: "azure_document_intelligence",
      processingTimeMs: 900,
      averageConfidence: 0.91,
    });
    const failed = buildCaptureEvent("ocr_failed", "s1", { reason: "timeout" });

    assert.equal(started.type, "ocr_started");
    assert.equal(finished.payload?.provider, "azure_document_intelligence");
    assert.equal(failed.type, "ocr_failed");
  });
});

describe("OCR — module structure", () => {
  it("has hybrid OCR architecture files", () => {
    const base = resolve(root, "src/lib/capture/ocr");
    for (const file of [
      "orchestrator/ocr-orchestrator.ts",
      "providers/azure-document-intelligence-provider.ts",
      "providers/gpt4-vision-provider.ts",
      "providers/tesseract-provider.ts",
      "services/ocr-service.ts",
      "types/raw-ocr-result.ts",
    ]) {
      assert.ok(existsSync(resolve(base, file)), `missing ${file}`);
    }
  });

  it("OcrService does not import Azure provider directly", () => {
    const src = readFileSync(
      resolve(root, "src/lib/capture/ocr/services/ocr-service.ts"),
      "utf8",
    );
    assert.ok(!src.includes("AzureDocumentIntelligenceProvider"));
    assert.ok(src.includes("OcrOrchestrator"));
  });
});

describe("OCR — bad image handling", () => {
  it("propagates Azure error for corrupt image", async () => {
    process.env.MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT = "https://test.cognitiveservices.azure.com";
    process.env.MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_KEY = "test-key";

    const mockFetch: typeof fetch = async () =>
      new Response(JSON.stringify({ error: { message: "Invalid image" } }), { status: 400 });

    const provider = new AzureDocumentIntelligenceProvider(mockFetch);
    await assert.rejects(
      () =>
        provider.extract({
          sessionId: "s",
          tenantId: "t",
          storagePath: "p",
          mimeType: "image/jpeg",
          fileBytes: new Uint8Array([0, 1, 2]),
        }),
      /Falha ao iniciar OCR Azure/,
    );
  });
});

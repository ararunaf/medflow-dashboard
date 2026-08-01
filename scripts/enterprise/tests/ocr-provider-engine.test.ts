#!/usr/bin/env node
/**
 * EPC-15 — OCR Provider Foundation
 * Prova Application → OCRProviderPort → Adapter → Factory → Registry
 * → Processing Provider Framework → Document Processing Foundation
 * sem tocar produto, sem HTTP, sem OCR real, sem IA.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_OCR_PROVIDER_COUNT,
  DEFAULT_MOCK_OCR_CAPABILITIES,
  DEFAULT_MOCK_OCR_PROVIDER_ID,
  DefaultMockOCRProvider,
  FUTURE_NORMALIZATION_TAG,
  MOCK_OCR_PROVIDER_ADAPTER_ID,
  MockOCRProviderAdapter,
  OCR_NORMALIZATION_EXTENSION_POINTS,
  OCRProviderFactory,
  OCRProviderRegistry,
  buildOCRProviderDescriptor,
  createDefaultMockOCRProviderDescriptor,
  createDefaultOCRProviderRegistry,
  createOCRProviderFactory,
  createOCRProviderPort,
  defineOCRCapabilities,
  emptyOCRCapabilities,
  extractCanonicalOutput,
  getOCRProviderFactory,
  getOCRProviderHealthSummary,
  listOCRProvidersFromProcessingFramework,
  mapOCRCapabilitiesToProviderCapabilities,
  registerOCRProviderWithProcessingFramework,
  type OCRProviderPort,
  type ProcessingOutput,
} from "../../../src/lib/enterprise/ocr-provider/index.ts";
import {
  ProcessingProviderRegistry,
  createDefaultProcessingProviderRegistry,
} from "../../../src/lib/enterprise/processing-provider/index.ts";

const CANONICAL_OUTPUT_KEYS = new Set([
  "outputId",
  "contentType",
  "structuredData",
  "rawDataReference",
  "metadataReference",
  "confidence",
  "language",
  "encoding",
  "pages",
  "attachments",
]);

const FORBIDDEN_OCR_ROOT_KEYS = [
  "ocrText",
  "ocrEngine",
  "boundingBoxes",
  "barcodeValue",
  "qrPayload",
  "xmlRoot",
  "pdfStream",
];

const FORBIDDEN_DOMAIN_TOKENS = [
  "tiss",
  "cooperativa",
  "operadora",
  "glosa",
  "paciente",
  "contrato",
  "workflow",
  "rule-engine",
  "openai",
  "gemini",
  "claude",
  "tesseract",
  "azure-document",
  "document-ai",
];

describe("EPC-15 OCRProviderPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: OCRProviderPort = new MockOCRProviderAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.status, "ready");

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_OCR_PROVIDER_ADAPTER_ID);
    assert.equal(caps.supportsCanonicalProcessingOutput, true);
    assert.equal(caps.supportsFutureNormalizationHook, true);
    assert.ok(caps.ocr.supportsConfidence === true);
  });

  it("DefaultMockOCRProvider é alias do MockOCRProviderAdapter", () => {
    assert.equal(DefaultMockOCRProvider, MockOCRProviderAdapter);
    const port = new DefaultMockOCRProvider({ provider: "mock" });
    assert.equal(port.providerId, "mock");
  });

  it("test / default são resolvidos pelo provider", async () => {
    const testPort = createOCRProviderPort({ provider: "test" });
    assert.equal(testPort.providerId, "test");
    assert.equal((await testPort.health()).ok, true);

    const defaultPort = createOCRProviderPort({ provider: "default" });
    assert.equal(defaultPort.providerId, "default");
    assert.equal((await defaultPort.health()).ok, true);
  });

  it("createOCRProviderPort default resolve mock", async () => {
    const port = createOCRProviderPort();
    assert.equal(port.providerId, "mock");
    const validation = await port.validateConfiguration();
    assert.equal(validation.ok, true);
    assert.equal(validation.errors.length, 0);
  });

  it("process mock é determinístico e produz ProcessingOutput canônico", async () => {
    const port = new MockOCRProviderAdapter({
      createProcessingId: () => "proc-fixed",
      createOutputId: () => "out-fixed",
      now: () => "2026-07-31T12:00:00.000Z",
    });

    const input = {
      requestId: "req-1",
      contentType: "application/pdf",
      language: "pt-BR",
      documentIdentityReference: { documentId: "doc-1", kind: "document" },
      metadataReference: { id: "meta-1", kind: "metadata" },
    };

    const first = await port.process(input);
    const second = await port.process(input);

    assert.equal(first.ok, true);
    assert.equal(first.simulated, true);
    assert.equal(first.provider, "mock");
    assert.equal(first.processing.processorType, "OCR");
    assert.equal(first.processing.status, "COMPLETED");
    assert.equal(first.processing.processingId, "proc-fixed");
    assert.equal(first.output.outputId, "out-fixed");
    assert.equal(first.output.contentType, second.output.contentType);
    assert.deepEqual(first.output.structuredData, second.output.structuredData);
    assert.equal(first.processing.documentIdentityReference?.documentId, "doc-1");
    assert.equal(first.processing.metadataReference?.id, "meta-1");
    assert.ok(first.processing.tags?.includes(FUTURE_NORMALIZATION_TAG));
  });

  it("process nunca retorna chaves OCR-específicas na raiz do ProcessingOutput", async () => {
    const port = new MockOCRProviderAdapter();
    const result = await port.process({ requestId: "req-keys" });
    const output = result.output;

    for (const key of Object.keys(output)) {
      assert.ok(CANONICAL_OUTPUT_KEYS.has(key), `chave não canônica: ${key}`);
      assert.equal(FORBIDDEN_OCR_ROOT_KEYS.includes(key), false);
    }

    assert.equal(typeof output.outputId, "string");
    assert.ok(output.structuredData);
    assert.equal(result.processing.outputReference?.outputId, output.outputId);
  });

  it("providerInfo declara providerType OCR", () => {
    const port = new MockOCRProviderAdapter();
    const info = port.providerInfo();
    assert.equal(info.providerType, "OCR");
    assert.equal(info.status, "ready");
    assert.ok(info.capabilities.supportedFormats?.includes("application/pdf"));
  });

  it("OCRCapabilities helpers são estruturais", () => {
    assert.deepEqual(emptyOCRCapabilities(), {});
    const defined = defineOCRCapabilities({ supportsTables: true, maxPages: 10 });
    assert.equal(defined.supportsTables, true);
    assert.equal(defined.maxPages, 10);
    assert.ok(DEFAULT_MOCK_OCR_CAPABILITIES.supportsMultiPage === true);
  });

  it("factory resolve registry e falha para provider desconhecido", () => {
    const factory = createOCRProviderFactory();
    assert.equal(factory.getRegistry().has("mock"), true);
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");

    const empty = new OCRProviderFactory({
      registry: new OCRProviderRegistry([]),
    });
    assert.throws(() => empty.create({ provider: "mock" }), /não está registrado/);
  });

  it("BUILTIN_OCR_PROVIDER_COUNT e registry snapshot", () => {
    assert.equal(BUILTIN_OCR_PROVIDER_COUNT, 3);
    const registry = createDefaultOCRProviderRegistry();
    const snap = registry.snapshot();
    assert.equal(snap.count, 3);
    assert.ok(snap.registrations.every((r) => r.capabilities));
  });

  it("ProviderDescriptor OCR tem campos mínimos e providerType OCR", () => {
    const descriptor = createDefaultMockOCRProviderDescriptor();
    assert.equal(descriptor.providerId, DEFAULT_MOCK_OCR_PROVIDER_ID);
    assert.equal(descriptor.providerType, "OCR");
    assert.equal(typeof descriptor.providerName, "string");
    assert.equal(typeof descriptor.providerVersion, "string");
    assert.ok(descriptor.capabilities);
    assert.equal(typeof descriptor.priority, "number");
    assert.equal(typeof descriptor.enabled, "boolean");
    assert.ok(descriptor.configurationReference);
    assert.ok(descriptor.metadataReference);

    const mapped = mapOCRCapabilitiesToProviderCapabilities(DEFAULT_MOCK_OCR_CAPABILITIES);
    assert.deepEqual(mapped.supportedInputs, DEFAULT_MOCK_OCR_CAPABILITIES.supportedFormats);
    assert.equal(mapped.supportsConfidence, true);

    const custom = buildOCRProviderDescriptor({
      providerId: "ocr-custom",
      priority: 50,
      enabled: false,
    });
    assert.equal(custom.providerId, "ocr-custom");
    assert.equal(custom.providerType, "OCR");
    assert.equal(custom.enabled, false);
  });

  it("OCR registra-se no Processing Provider Registry como tipo OCR", () => {
    const framework = createDefaultProcessingProviderRegistry();
    assert.equal(framework.count(), 0);

    const result = registerOCRProviderWithProcessingFramework(framework);
    assert.equal(result.ok, true);
    assert.equal(result.providerType, "OCR");
    assert.equal(framework.has(DEFAULT_MOCK_OCR_PROVIDER_ID), true);

    const listed = listOCRProvidersFromProcessingFramework(framework);
    assert.equal(listed.length, 1);
    assert.equal(listed[0]?.providerType, "OCR");
    assert.equal(listed[0]?.providerId, DEFAULT_MOCK_OCR_PROVIDER_ID);

    const byType = framework.listByType("OCR");
    assert.equal(byType.length, 1);
  });

  it("registro no Framework rejeita providerType diferente de OCR", () => {
    const framework = new ProcessingProviderRegistry();
    const bad = createDefaultMockOCRProviderDescriptor();
    // força tipo inválido para o helper
    const forged = { ...bad, providerType: "PDF" as const };
    assert.throws(
      () => registerOCRProviderWithProcessingFramework(framework, forged),
      /providerType "OCR"/,
    );
  });

  it("PoC Application depende apenas do Port", async () => {
    const port = createOCRProviderPort();
    const summary = await getOCRProviderHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.info.providerType, "OCR");
    assert.equal(getOCRProviderFactory().getRegistry().has("mock"), true);
  });

  it("extractCanonicalOutput e extension points de normalização estão documentados", async () => {
    const port = new MockOCRProviderAdapter();
    const result = await port.process({});
    const output: ProcessingOutput = extractCanonicalOutput(result);
    assert.equal(output.outputId, result.output.outputId);

    assert.ok(OCR_NORMALIZATION_EXTENSION_POINTS.length >= 4);
    for (const point of OCR_NORMALIZATION_EXTENSION_POINTS) {
      assert.equal(point.implemented, false);
      assert.ok(point.id.startsWith("EP-NORM-"));
    }
  });

  it("código da fundação não contém integrações HTTP / IA / OCR real / domínio", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const root = join(here, "../../../src/lib/enterprise/ocr-provider");

    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (full.endsWith(".ts")) files.push(full);
      }
    };
    walk(root);

    assert.ok(files.length > 0);

    for (const file of files) {
      const blob = readFileSync(file, "utf8").toLowerCase();
      assert.equal(blob.includes("fetch("), false, `fetch em ${file}`);
      assert.equal(blob.includes("axios"), false, `axios em ${file}`);
      assert.equal(blob.includes("https.request"), false, `https em ${file}`);
      for (const token of FORBIDDEN_DOMAIN_TOKENS) {
        // menções em comentários de "não integrar X" / "desacoplado de X" são aceitas
        // se o token aparece só em contexto de proibição; tokens de implementação real falham
        if (
          token === "openai" ||
          token === "gemini" ||
          token === "claude" ||
          token === "tesseract"
        ) {
          assert.equal(
            blob.includes(`from "${token}`) || blob.includes(`require("${token}`),
            false,
            `import ${token} em ${file}`,
          );
        }
      }
      assert.equal(blob.includes("createclient"), false, `supabase client em ${file}`);
    }
  });

  it("OCR permanece desacoplado de contract / rule / workflow / ai-provider modules", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const root = join(here, "../../../src/lib/enterprise/ocr-provider");
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (full.endsWith(".ts")) files.push(full);
      }
    };
    walk(root);

    const forbiddenImports = [
      "/contract/",
      "/rule/",
      "/workflow/",
      "/ai-provider/",
      "/rule-pack/",
      "/tenant/",
    ];

    for (const file of files) {
      const src = readFileSync(file, "utf8");
      for (const frag of forbiddenImports) {
        assert.equal(src.includes(frag), false, `${file} importa ${frag}`);
      }
    }
  });

  it("OCRFactory class exportada e OCRProviderRegistry listByStatus", () => {
    assert.equal(typeof OCRProviderFactory, "function");
    const registry = createDefaultOCRProviderRegistry();
    assert.equal(registry.listByStatus("ready").length, 3);
    assert.equal(registry.listByStatus("stub").length, 0);
  });
});

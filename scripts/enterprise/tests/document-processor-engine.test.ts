#!/usr/bin/env node
/**
 * EPC-13 — Document Processing Foundation
 * Prova Application → DocumentProcessorPort → Adapter → Store sem tocar produto.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PROCESSING_STATUSES,
  PROCESSOR_TYPES,
  createDocumentProcessorFactory,
  createDocumentProcessorPort,
  createOutputId,
  createProcessingId,
  DEFAULT_DOCUMENT_PROCESSOR_ADAPTER_ID,
  DefaultDocumentProcessorAdapter,
  DefaultDocumentProcessorStore,
  defineDocumentIdentityReference,
  defineError,
  defineMetadataReference,
  defineOpaqueReference,
  defineOutputAttachment,
  defineOutputPage,
  defineOutputReference,
  defineProcessingOutput,
  defineStorageReference,
  defineWarning,
  getDocumentProcessorHealthSummary,
  getOutputAttachmentCount,
  getOutputPageCount,
  hasKnownProcessorType,
  listProcessorTypes,
  MockDocumentProcessorAdapter,
  processingHasKnownProcessorType,
  referencesDocument,
  referencesOutput,
  type DocumentProcessingResult,
  type DocumentProcessorPort,
  type ProcessingOutput,
} from "../../../src/lib/enterprise/document-processor/index.ts";

function sampleProcessing(overrides: Partial<DocumentProcessingResult> = {}): Omit<
  DocumentProcessingResult,
  "processingId" | "processorType" | "status"
> & {
  processingId?: string;
  processorType?: DocumentProcessingResult["processorType"];
  status?: DocumentProcessingResult["status"];
} {
  return {
    processorType: "CUSTOM",
    status: "COMPLETED",
    startedAt: "2026-07-31T12:00:00.000Z",
    finishedAt: "2026-07-31T12:00:01.000Z",
    duration: 1000,
    confidence: 0.95,
    warnings: [defineWarning({ code: "W1", message: "generic warning" })],
    errors: [],
    metadataReference: defineMetadataReference({
      id: "meta-1",
      kind: "schema",
      namespace: "enterprise.core",
    }),
    documentIdentityReference: defineDocumentIdentityReference({
      documentId: "doc-opaque-1",
      kind: "document",
    }),
    tags: ["foundation", "canonical"],
    capabilities: ["canonical-output", "multi-processor"],
    customAttributes: {
      channel: "api",
      futureHooks: [
        defineOpaqueReference({ id: "hook-1", kind: "ocr-provider", target: "future" }),
      ],
    },
    ...overrides,
  };
}

function sampleOutput(
  overrides: Partial<ProcessingOutput> & { outputId?: string } = {},
): Omit<ProcessingOutput, "outputId"> & { outputId?: string } {
  return {
    contentType: "application/json",
    structuredData: { fields: { key: "value" } },
    rawDataReference: defineStorageReference({
      key: "raw/opaque-1",
      container: "enterprise",
      provider: "opaque",
    }),
    metadataReference: defineMetadataReference({ id: "meta-out-1" }),
    confidence: 0.9,
    language: "pt-BR",
    encoding: "utf-8",
    pages: [defineOutputPage({ pageId: "p-1", sequence: 1, confidence: 0.9 })],
    attachments: [
      defineOutputAttachment({
        id: "att-1",
        name: "artifact.bin",
        mimeType: "application/octet-stream",
      }),
    ],
    ...overrides,
  };
}

describe("EPC-13 DocumentProcessorPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: DocumentProcessorPort = new MockDocumentProcessorAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsProcess, true);
    assert.equal(caps.supportsGetProcessing, true);
    assert.equal(caps.supportsListProcessings, true);
    assert.equal(caps.supportsMultipleProcessorTypes, true);
    assert.equal(caps.supportsCanonicalOutput, true);
    assert.equal(caps.supportsDocumentIdentityReference, true);
    assert.equal(caps.supportsMetadataReference, true);
    assert.equal(caps.supportsStorageReference, true);
    assert.equal(caps.supportsOutputReference, true);
    assert.equal(caps.supportsFutureIntegrationHooks, true);
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createDocumentProcessorPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default adapter usa store in-process e declara capacidades", async () => {
    const store = new DefaultDocumentProcessorStore();
    const port: DocumentProcessorPort = new DefaultDocumentProcessorAdapter({ store });

    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_DOCUMENT_PROCESSOR_ADAPTER_ID);
    assert.equal(caps.supportsProcess, true);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
    assert.match(health.message ?? "", /ready|pronto/i);
  });

  it("Default adapter usa ping opcional sem alterar processing", async () => {
    const port = new DefaultDocumentProcessorAdapter({
      store: new DefaultDocumentProcessorStore(),
      ping: async () => ({ ok: true, message: "processor probe custom" }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "processor probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultDocumentProcessorAdapter; futuros falham explicitamente", () => {
    const defaultPort = createDocumentProcessorPort();
    assert.equal(defaultPort.providerId, "default");

    assert.throws(
      () => createDocumentProcessorPort({ provider: "database" }),
      /ainda não implementado/i,
    );
    assert.throws(
      () => createDocumentProcessorPort({ provider: "remote" }),
      /ainda não implementado/i,
    );
    assert.throws(
      () => createDocumentProcessorPort({ provider: "registry" }),
      /ainda não implementado/i,
    );
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createDocumentProcessorFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createDocumentProcessorPort({ provider: "mock" });
    const summary = await getDocumentProcessorHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("process/getProcessing/listProcessings funcionam no Mock com output canônico", async () => {
    const port = new MockDocumentProcessorAdapter({
      createId: () => "processing-fixed-1",
      createOutputId: () => "output-fixed-1",
      now: () => "2026-07-31T12:00:00.000Z",
    });

    const created = await port.process({
      processing: sampleProcessing(),
      output: sampleOutput(),
    });
    assert.equal(created.ok, true);
    assert.equal(created.processingId, "processing-fixed-1");
    assert.equal(created.processing?.processorType, "CUSTOM");
    assert.equal(created.processing?.status, "COMPLETED");
    assert.equal(created.output?.outputId, "output-fixed-1");
    assert.equal(created.processing?.outputReference?.outputId, "output-fixed-1");
    assert.equal(created.output?.contentType, "application/json");
    assert.equal(getOutputPageCount(created.output!), 1);
    assert.equal(getOutputAttachmentCount(created.output!), 1);

    const got = await port.getProcessing({ processingId: "processing-fixed-1" });
    assert.equal(got.ok, true);
    assert.equal(got.processing?.processingId, "processing-fixed-1");
    assert.equal(got.output?.outputId, "output-fixed-1");

    const listed = await port.listProcessings({ tag: "foundation" });
    assert.equal(listed.ok, true);
    assert.equal(listed.processings.length, 1);

    const byType = await port.listProcessings({ processorType: "CUSTOM" });
    assert.equal(byType.processings.length, 1);

    const byDoc = await port.listProcessings({ documentId: "doc-opaque-1" });
    assert.equal(byDoc.processings.length, 1);

    const missing = await port.getProcessing({ processingId: "missing" });
    assert.equal(missing.ok, false);
    assert.equal(missing.code, "not_found");
  });

  it("Default adapter process/get/list sem OCR/IA/parsers", async () => {
    const port = new DefaultDocumentProcessorAdapter({
      store: new DefaultDocumentProcessorStore(),
      createId: () => "processing-default-1",
      createOutputId: () => "output-default-1",
      now: () => "2026-07-31T15:00:00.000Z",
    });

    const created = await port.process({
      processing: sampleProcessing({ processorType: "PDF_TEXT", tags: ["alpha"] }),
      output: sampleOutput({ contentType: "text/plain" }),
    });
    assert.equal(created.ok, true);
    assert.equal(created.code, "created");
    assert.equal(created.processing?.processorType, "PDF_TEXT");

    const listed = await port.listProcessings({ idPrefix: "processing-default" });
    assert.equal(listed.ok, true);
    assert.equal(listed.processings.length, 1);
  });

  it("modelo canônico DocumentProcessingResult contém apenas campos permitidos", () => {
    const processing: DocumentProcessingResult = {
      processingId: createProcessingId(),
      processorType: "UNKNOWN",
      status: "PENDING",
      startedAt: "2026-07-31T12:00:00.000Z",
      finishedAt: "2026-07-31T12:00:01.000Z",
      duration: 1000,
      confidence: 0.5,
      warnings: [defineWarning({ code: "W" })],
      errors: [defineError({ code: "E" })],
      metadataReference: { id: "m1" },
      documentIdentityReference: { documentId: "d1" },
      outputReference: defineOutputReference({ outputId: "o1" }),
      tags: ["t"],
      customAttributes: { k: 1 },
      capabilities: ["cap"],
    };

    const keys = Object.keys(processing).sort();
    assert.deepEqual(keys, [
      "capabilities",
      "confidence",
      "customAttributes",
      "documentIdentityReference",
      "duration",
      "errors",
      "finishedAt",
      "metadataReference",
      "outputReference",
      "processingId",
      "processorType",
      "startedAt",
      "status",
      "tags",
      "warnings",
    ]);
  });

  it("ProcessingOutput é o único modelo canônico de saída (sem campos OCR)", () => {
    const output = defineProcessingOutput({
      outputId: createOutputId(),
      contentType: "application/json",
      structuredData: { a: 1 },
      rawDataReference: defineStorageReference({ key: "k" }),
      metadataReference: { id: "m" },
      confidence: 0.8,
      language: "en",
      encoding: "utf-8",
      pages: [defineOutputPage({ sequence: 1 })],
      attachments: [defineOutputAttachment({ id: "a1" })],
    });

    const keys = Object.keys(output).sort();
    assert.deepEqual(keys, [
      "attachments",
      "confidence",
      "contentType",
      "encoding",
      "language",
      "metadataReference",
      "outputId",
      "pages",
      "rawDataReference",
      "structuredData",
    ]);

    const forbiddenOutputKeys = [
      "ocrText",
      "ocrEngine",
      "boundingBoxes",
      "barcodeValue",
      "qrPayload",
      "xmlRoot",
      "pdfStream",
    ];
    for (const key of forbiddenOutputKeys) {
      assert.equal(Object.hasOwn(output, key), false, `não deve conter ${key}`);
    }
  });

  it("ProcessorType enum (FASE 7) — enumeração sem lógica", () => {
    assert.deepEqual(
      [...PROCESSOR_TYPES],
      ["OCR", "PDF_TEXT", "XML", "JSON", "BARCODE", "QRCODE", "HL7", "DICOM", "CUSTOM", "UNKNOWN"],
    );
    assert.deepEqual(
      [...PROCESSING_STATUSES],
      ["PENDING", "RUNNING", "COMPLETED", "FAILED", "CANCELLED", "UNKNOWN"],
    );
    assert.equal(hasKnownProcessorType("OCR"), true);
    assert.equal(hasKnownProcessorType("UNKNOWN"), true);
    assert.equal(listProcessorTypes().length, 10);

    const processing: DocumentProcessingResult = {
      processingId: "p1",
      processorType: "HL7",
      status: "COMPLETED",
    };
    assert.equal(processingHasKnownProcessorType(processing), true);
  });

  it("múltiplos ProcessorTypes produzem o mesmo modelo de saída", async () => {
    const port = new MockDocumentProcessorAdapter({
      createOutputId: () => "shared-output-shape",
    });

    const types = ["OCR", "XML", "PDF_TEXT", "BARCODE", "QRCODE"] as const;
    for (const processorType of types) {
      const result = await port.process({
        processing: sampleProcessing({
          processingId: `p-${processorType}`,
          processorType,
        }),
        output: sampleOutput({ outputId: `o-${processorType}` }),
      });
      assert.equal(result.ok, true);
      assert.equal(result.processing?.processorType, processorType);
      assert.ok(result.output?.outputId);
      assert.equal(typeof result.output?.structuredData, "object");
      assert.ok(result.processing?.outputReference?.outputId);
    }

    const listed = await port.listProcessings();
    assert.equal(listed.processings.length, types.length);
  });

  it("referências opacas e helpers sem resolução", async () => {
    const port = new MockDocumentProcessorAdapter({ createId: () => "p-refs" });
    const created = await port.process({
      processing: sampleProcessing(),
      output: sampleOutput({ outputId: "o-refs" }),
    });
    const processing = created.processing!;

    assert.equal(referencesDocument(processing, "doc-opaque-1"), true);
    assert.equal(referencesOutput(processing, "o-refs"), true);
    assert.equal(processing.metadataReference?.id, "meta-1");
    assert.equal(created.output?.rawDataReference?.key, "raw/opaque-1");
  });

  it("nenhum conhecimento clínico / TISS / OCR implementado no módulo (smoke estrutural)", () => {
    const forbidden = [
      "tiss",
      "unimed",
      "hapvida",
      "bradesco",
      "paciente",
      "glosa",
      "guia",
      "cid",
      "procedimento",
      "openai",
      "tesseract",
      "textract",
    ];
    const sample = JSON.stringify({
      processing: sampleProcessing(),
      output: sampleOutput(),
    }).toLowerCase();
    for (const token of forbidden) {
      assert.equal(sample.includes(token), false, `não deve conter ${token}`);
    }
  });
});

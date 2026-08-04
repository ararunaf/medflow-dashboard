#!/usr/bin/env node
/**
 * F3-CAP-05 — Enterprise OCR Runtime Foundation (+ DIP-03 / OCR-01 preservado)
 * Prova: Application → OCRRuntimePort → Adapter → Factory → Registry → Store
 *         + openJob / closeJob / submitRequest / registerDocument / getResult / stats
 *         + Enterprise Runtime + deps estruturais (ICR/Scanner/WatchFolder/Upload/
 *           PQR/Worker/Scheduler/Obs/Scalability)
 *         + coordenação/execução real DIP-03/OCR-01 preservada via Orchestrator +
 *           OCRProviderPort (Capture Engine Runtime não regride)
 *         + ausência de OCR real / Tesseract / Azure / Google Vision / AWS Textract /
 *           ABBYY / PaddleOCR / chamadas externas
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_OCR_RUNTIME_PROVIDER_COUNT,
  DEFAULT_OCR_RUNTIME_ADAPTER_ID,
  DEFAULT_OCR_RUNTIME_ENGINE_CAPABILITIES,
  DefaultOCRRuntimeAdapter,
  EnterpriseOCRRuntimeAdapter,
  IN_MEMORY_OCR_RUNTIME_STORE_ID,
  InMemoryOCRRuntimeStore,
  MOCK_OCR_RUNTIME_ADAPTER_ID,
  MockOCRRuntimeAdapter,
  OCR_RUNTIME_IDENTITY,
  OCRRuntimeFactory,
  OCRRuntimeProvider,
  OCRRuntimeRegistry,
  STRUCTURAL_OCR_PROVIDER_REFERENCES,
  createDefaultOCRRuntimeRegistry,
  createOCRRuntimeFactory,
  createOCRRuntimePort,
  createOCRRuntimeSessionId,
  getOCRRuntimeFactory,
  getOCRRuntimeHealthSummary,
  getOCRRuntimePort,
  resetAllOCRRuntimeIdSequences,
  type CanonicalOCRRequest,
  type OCRRuntimePort,
} from "../../../src/lib/enterprise/ocr-runtime/index.ts";
import { createOCRProviderPort } from "../../../src/lib/enterprise/ocr-provider/index.ts";
import { createCanonicalExecutionOrchestratorPort } from "../../../src/lib/enterprise/canonical-execution-orchestrator/index.ts";
import {
  createEnterpriseRuntime,
  resetEnterpriseRuntimeForTests,
} from "../../../src/lib/enterprise/runtime/index.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../../..");

function collectTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...collectTsFiles(full));
    else if (entry.endsWith(".ts")) out.push(full);
  }
  return out;
}

function sampleRequest(overrides: Partial<CanonicalOCRRequest> = {}): CanonicalOCRRequest {
  return {
    kind: "canonical-ocr-request",
    identity: {
      kind: "canonical-ocr-identity",
      documentId: "doc-dip-03",
      documentKind: "capture-document",
    },
    metadata: {
      kind: "canonical-ocr-metadata",
      sessionId: "sess-dip-03",
      tenantRef: "tenant-1",
      correlationId: "corr-dip-03",
      channel: "file_upload",
      tags: ["dip-03"],
    },
    reference: {
      kind: "canonical-ocr-reference",
      storageKey: "tenant/sess-dip-03/original.pdf",
      storageContainer: "clinical-documents",
      storageProvider: "product-capture",
      metadataId: "sess-dip-03",
      metadataNamespace: "product.capture",
      captureRuntimeSessionId: "dip-capture-session-1",
      providerReferenceId: "mock",
    },
    capabilities: {
      kind: "canonical-ocr-capabilities",
      supportsPdf: false,
      supportsImage: false,
      supportsBatch: false,
      supportsStreaming: false,
      supportsHandwriting: false,
      supportsTables: false,
      supportsForms: false,
      supportsConfidenceScore: false,
      declared: ["ocr-runtime"],
    },
    configuration: {
      kind: "canonical-ocr-configuration",
      preferredProviderReference: "mock",
      channel: "file_upload",
      priority: "NORMAL",
    },
    ...overrides,
  };
}

function enterpriseDeps() {
  const orchestratorPort = createCanonicalExecutionOrchestratorPort({ provider: "mock" });
  const ocrProviderPort = createOCRProviderPort({ provider: "mock" });
  return {
    orchestratorPort,
    ocrProviderPort,
    deps: {
      getOrchestratorPort: () => orchestratorPort,
      getOCRProviderPort: () => ocrProviderPort,
    },
  };
}

function assertRuntimeDecoupledFromVendors(caps: ReturnType<OCRRuntimePort["capabilities"]>) {
  /** Runtime permanece desacoplado — Azure só no OCRProviderPort Adapter. */
  assert.equal(caps.implementsAzure, false);
  assert.equal(caps.implementsGoogleVision, false);
  assert.equal(caps.implementsAwsTextract, false);
  assert.equal(caps.implementsTesseract, false);
  assert.equal(caps.implementsAi, false);
  assert.equal(caps.implementsClassification, false);
  assert.equal(caps.implementsXml, false);
  assert.equal(caps.implementsTiss, false);
}

function assertStructuralFlagsFalse(obj: Record<string, unknown>) {
  const flags = [
    "ocrEngineImplemented",
    "pdfOcrImplemented",
    "imageOcrImplemented",
    "documentRecognitionImplemented",
    "textExtractionImplemented",
    "barcodeRecognitionImplemented",
    "qrRecognitionImplemented",
    "layoutAnalysisImplemented",
    "tableRecognitionImplemented",
    "handwritingRecognitionImplemented",
    "multiEngineImplemented",
    "confidenceScoreImplemented",
    "languageDetectionImplemented",
  ];
  for (const flag of flags) {
    assert.equal(obj[flag], false, `${flag} deveria ser false`);
  }
}

describe("F3-CAP-05 OCRRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy sem OCR real", async () => {
    const port: OCRRuntimePort = new MockOCRRuntimeAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.realOcrAvailable, false);
    assert.equal(health.runtimeReady, true);
    assertStructuralFlagsFalse(health as unknown as Record<string, unknown>);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_OCR_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsCoordinateOcr, true);
    assert.equal(caps.supportsProcess, true);
    assert.equal(caps.supportsOpenJob, true);
    assert.equal(caps.supportsCloseJob, true);
    assert.equal(caps.supportsSubmitRequest, true);
    assert.equal(caps.supportsRegisterDocument, true);
    assert.equal(caps.supportsGetResult, true);
    assert.equal(caps.supportsStats, true);
    assert.equal(caps.runtimeReady, true);
    assertStructuralFlagsFalse(caps as unknown as Record<string, unknown>);
    assertRuntimeDecoupledFromVendors(caps);
  });

  it("DefaultOCRRuntimeAdapter é o adapter enterprise oficial (enterpriseDeps opcional)", () => {
    assert.equal(EnterpriseOCRRuntimeAdapter, DefaultOCRRuntimeAdapter);
    const port = new DefaultOCRRuntimeAdapter({ provider: "enterprise" });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_OCR_RUNTIME_ADAPTER_ID);
    assert.equal(port.capabilities().implementsRealOcr, false);
  });

  it("identity declara Enterprise OCR Runtime Foundation vendor-agnostic", () => {
    assert.equal(OCR_RUNTIME_IDENTITY.name, "Enterprise OCR Runtime");
    assert.equal(OCR_RUNTIME_IDENTITY.layer, "Foundation");
    assert.ok(OCR_RUNTIME_IDENTITY.version);
    assert.equal(OCR_RUNTIME_IDENTITY.vendorAgnostic, true);
    const info = createOCRRuntimePort().providerInfo();
    assert.equal(info.metadata.vendorAgnostic, true);
    assert.equal(info.metadata.layer, "Foundation");
    assert.equal(info.providerType, "OCR_RUNTIME");
  });

  it("provider default resolve enterprise via getOCRRuntimePort/OCRRuntimeProvider", () => {
    const port = createOCRRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(getOCRRuntimePort().providerId, "enterprise");
    assert.equal(OCRRuntimeProvider.create().providerId, "enterprise");
    assert.equal(OCRRuntimeProvider.get().providerId, "enterprise");
    assert.ok(OCRRuntimeProvider.getFactory() instanceof OCRRuntimeFactory);
  });

  it("factory resolve mock / test / default / enterprise", () => {
    const factory = createOCRRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(
      getOCRRuntimeFactory().getRegistry().list().length,
      BUILTIN_OCR_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("openJob → submitRequest → registerDocument → getResult → closeJob → stats (sem OCR real)", async () => {
    resetAllOCRRuntimeIdSequences();
    const port = createOCRRuntimePort({ provider: "enterprise" });

    const opened = await port.openJob({ correlationId: "corr-f3-cap-05" });
    assert.equal(opened.ok, true);
    assert.equal(opened.job?.status, "job-open");
    assert.equal(opened.result?.runtimeReady, true);
    assertStructuralFlagsFalse(opened.result as unknown as Record<string, unknown>);
    const jobId = opened.job!.jobId;

    const submitted = await port.submitRequest({ jobId, documentId: "doc-f3-cap-05" });
    assert.equal(submitted.ok, true);
    assert.equal(submitted.request?.status, "submitted");
    assert.equal(submitted.request?.jobId, jobId);
    const requestId = submitted.request!.requestId;

    const registered = await port.registerDocument({
      jobId,
      requestId,
      documentId: "doc-f3-cap-05",
    });
    assert.equal(registered.ok, true);
    assert.equal(registered.document?.status, "registered");
    assertStructuralFlagsFalse(registered.document as unknown as Record<string, unknown>);

    const result = await port.getResult({ jobId, requestId });
    assert.equal(result.ok, true);
    assert.equal(result.result?.runtimeReady, true);

    const closed = await port.closeJob({ jobId });
    assert.equal(closed.ok, true);
    assert.equal(closed.job?.status, "job-closed");

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "canonical-ocr-statistics");
    assert.ok((stats.statistics?.totalJobs ?? 0) >= 1);
    assert.ok((stats.statistics?.totalRequests ?? 0) >= 1);
    assert.ok((stats.statistics?.totalDocuments ?? 0) >= 1);
    assert.equal(stats.statistics?.ocrEngineImplementedCount, 0);
    assert.equal(stats.statistics?.textExtractionImplementedCount, 0);
  });

  it("InMemory store persiste sessões (DIP-03) e jobs/requests/documents (F3-CAP-05)", async () => {
    const store = new InMemoryOCRRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_OCR_RUNTIME_STORE_ID);
    assert.equal(store.health().ok, true);

    const stamp = new Date().toISOString();
    store.setSession({
      kind: "canonical-ocr-session",
      runtimeSessionId: "sess-store-1",
      status: "coordinated",
      request: sampleRequest(),
      createdAt: stamp,
      updatedAt: stamp,
      realOcrExecuted: false,
    });
    assert.equal(store.sessionCount(), 1);
    assert.equal(store.getSession("sess-store-1")?.status, "coordinated");
    assert.equal(store.removeSession("sess-store-1"), true);
    assert.equal(store.sessionCount(), 0);

    const port = new DefaultOCRRuntimeAdapter({ provider: "enterprise", store });
    await port.openJob({ jobId: "job-store-1" });
    await port.submitRequest({ jobId: "job-store-1", requestId: "req-store-1" });
    await port.registerDocument({ documentId: "doc-store-1", jobId: "job-store-1" });
    assert.equal(store.jobCount(), 1);
    assert.equal(store.requestCount(), 1);
    assert.equal(store.documentCount(), 1);

    const statistics = store.statistics();
    assert.equal(statistics.kind, "canonical-ocr-statistics");
    assert.equal(statistics.openJobs, 1);
    assert.equal(statistics.closedJobs, 0);
  });

  it("retry recupera falha transitória em operação estrutural", async () => {
    const port = new DefaultOCRRuntimeAdapter({
      provider: "enterprise",
      failAttempts: 1,
      defaultRetryCount: 1,
      defaultRetryBackoffMs: 1,
    });
    const result = await port.openJob({});
    assert.equal(result.ok, true);
    assert.ok((result.telemetry?.attempts ?? 0) >= 2);
  });

  it("AbortSignal cancela operação estrutural", async () => {
    const port = createOCRRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.openJob({ signal: controller.signal });
    assert.equal(result.ok, false);
    assert.equal(result.code, "OCR_RUNTIME_CANCELLED");
    assert.equal(result.telemetry?.cancelled, true);
  });

  it("registry/factory sem fallback silencioso", () => {
    const registry = createDefaultOCRRuntimeRegistry();
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.has("mock"), true);
    assert.equal(registry.has("test"), true);
    assert.equal(registry.has("default"), true);
    assert.equal(registry.snapshot().count, BUILTIN_OCR_RUNTIME_PROVIDER_COUNT);
    assert.ok(registry instanceof OCRRuntimeRegistry);

    const factory = new OCRRuntimeFactory({ registry });
    assert.throws(() => factory.create({ provider: "azure" as never }), /não está registrado/);
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createOCRRuntimePort({ provider: "mock" });
    const summary = await getOCRRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.health.realOcrAvailable, false);
    assert.equal(summary.capabilities.supportsCoordinateOcr, true);
    assert.equal(summary.capabilities.supportsOpenJob, true);
    assert.equal(summary.info.providerType, "OCR_RUNTIME");
    assertRuntimeDecoupledFromVendors(summary.capabilities);
  });

  it("lista referências estruturais de providers sem conexão", async () => {
    const port = createOCRRuntimePort({ provider: "mock" });
    const refs = await port.listProviderReferences();
    assert.equal(refs.ok, true);
    assert.equal(refs.references.length, STRUCTURAL_OCR_PROVIDER_REFERENCES.length);
    const ids = refs.references.map((r) => r.providerReferenceId).sort();
    assert.deepEqual(ids, ["aws-textract", "azure", "google-vision", "mock", "tesseract"]);
    for (const ref of refs.references) {
      assert.equal(ref.connected, false);
      if (ref.providerReferenceId === "azure") {
        assert.equal(ref.implementsRealOcr, true);
        assert.equal(ref.status, "available-via-ocr-provider-port");
      } else {
        assert.equal(ref.implementsRealOcr, false);
        assert.equal(ref.status, "structural-reference-only");
      }
    }
  });

  it("createOCRRuntimeSessionId é determinístico após reset", () => {
    resetAllOCRRuntimeIdSequences();
    assert.equal(createOCRRuntimeSessionId(), "dip-ocr-session-1");
    assert.equal(createOCRRuntimeSessionId(), "dip-ocr-session-2");
    resetAllOCRRuntimeIdSequences();
    assert.equal(createOCRRuntimeSessionId(), "dip-ocr-session-1");
  });

  it("DEFAULT_OCR_RUNTIME_ENGINE_CAPABILITIES declara flags estruturais zeradas", () => {
    assert.equal(DEFAULT_OCR_RUNTIME_ENGINE_CAPABILITIES.runtimeReady, true);
    assertStructuralFlagsFalse(
      DEFAULT_OCR_RUNTIME_ENGINE_CAPABILITIES as unknown as Record<string, unknown>,
    );
    assert.equal(DEFAULT_OCR_RUNTIME_ENGINE_CAPABILITIES.usesIntelligentCaptureRuntimePort, true);
    assert.equal(DEFAULT_OCR_RUNTIME_ENGINE_CAPABILITIES.usesScannerRuntimePort, true);
    assert.equal(DEFAULT_OCR_RUNTIME_ENGINE_CAPABILITIES.usesWatchFolderRuntimePort, true);
    assert.equal(DEFAULT_OCR_RUNTIME_ENGINE_CAPABILITIES.usesUploadRuntimePort, true);
    assert.equal(DEFAULT_OCR_RUNTIME_ENGINE_CAPABILITIES.usesPersistentQueueRuntimePort, true);
    assert.equal(DEFAULT_OCR_RUNTIME_ENGINE_CAPABILITIES.usesWorkerRuntimePort, true);
    assert.equal(DEFAULT_OCR_RUNTIME_ENGINE_CAPABILITIES.usesSchedulerRuntimePort, true);
    assert.equal(DEFAULT_OCR_RUNTIME_ENGINE_CAPABILITIES.usesObservabilityRuntimePort, true);
    assert.equal(DEFAULT_OCR_RUNTIME_ENGINE_CAPABILITIES.usesScalabilityRuntimePort, true);
  });
});

describe("DIP-03 / OCR-01 coordenação e execução real preservadas", () => {
  it("default adapter coordena via Orchestrator + OCR Provider Adapter", async () => {
    resetAllOCRRuntimeIdSequences();
    const { deps, orchestratorPort, ocrProviderPort } = enterpriseDeps();
    const port = new DefaultOCRRuntimeAdapter({ provider: "default", enterpriseDeps: deps });

    assert.equal(port.providerId, "default");
    assert.equal(port.capabilities().usesCanonicalExecutionOrchestrator, true);
    assert.equal(port.capabilities().usesOCRProviderAdapter, true);
    assert.equal(port.capabilities().supportsProcess, true);
    assert.equal(port.capabilities().implementsRealOcr, true);
    assertRuntimeDecoupledFromVendors(port.capabilities());

    const result = await port.coordinateOcr(sampleRequest());
    assert.equal(result.ok, true);
    assert.ok(result.runtimeSessionId);
    assert.ok(result.executionId);
    assert.equal(result.realOcrExecuted, false);
    assert.equal(result.session?.status, "coordinated");
    assert.equal(result.providerReferenceId, "mock");

    const storedExec = await orchestratorPort.getExecution({
      executionId: result.executionId!,
    });
    assert.equal(storedExec.ok, true);

    const providerHealth = await ocrProviderPort.health();
    assert.equal(providerHealth.ok, true);

    const session = await port.getSession({ runtimeSessionId: result.runtimeSessionId! });
    assert.equal(session.ok, true);
    assert.equal(session.session?.executionId, result.executionId);
  });

  it("coordinateOcr/process retornam OCR_RUNTIME_PROVIDER_DEPS_MISSING sem enterpriseDeps (CAP ops seguem funcionando)", async () => {
    const port = createOCRRuntimePort({ provider: "enterprise" });
    const coordinated = await port.coordinateOcr(sampleRequest());
    assert.equal(coordinated.ok, false);
    assert.equal(coordinated.code, "OCR_RUNTIME_PROVIDER_DEPS_MISSING");

    const processed = await port.process({
      documentId: "doc-no-deps",
      documentIdentityReference: { documentId: "doc-no-deps", kind: "document" },
    });
    assert.equal(processed.ok, false);
    assert.equal(processed.code, "OCR_RUNTIME_PROVIDER_DEPS_MISSING");

    const opened = await port.openJob({});
    assert.equal(opened.ok, true);
  });

  it("coordinateOcr rejeita input inválido", async () => {
    const { deps } = enterpriseDeps();
    const port = createOCRRuntimePort({ provider: "default", enterpriseDeps: deps });
    const result = await port.coordinateOcr(
      sampleRequest({
        identity: {
          kind: "canonical-ocr-identity",
          documentId: "",
        },
        metadata: {
          kind: "canonical-ocr-metadata",
          sessionId: "",
        },
      }),
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, "INVALID_INPUT");
    assert.equal(result.realOcrExecuted, false);
  });

  it("coordinateOcr não produz texto extraído nem páginas OCR", async () => {
    const { deps } = enterpriseDeps();
    const port = createOCRRuntimePort({ provider: "default", enterpriseDeps: deps });
    const result = await port.coordinateOcr(sampleRequest());
    assert.equal(result.ok, true);
    const sessionJson = JSON.stringify(result.session);
    assert.equal(/extractedText|ocrText|pages|blocks|words/i.test(sessionJson), false);
    assert.equal(result.realOcrExecuted, false);
  });
});

describe("F3-CAP-05 cadeia Enterprise / OCR Runtime", () => {
  it("Enterprise Runtime expõe OCRRuntimePort provider enterprise + health.ocrRuntimeOk", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const ocrRuntime = runtime.getOCRRuntimePort();
    assert.ok(ocrRuntime);
    assert.equal(ocrRuntime.providerId, "enterprise");

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.ocrRuntimeOk, true);
    assert.equal(health.captureEngineRuntimeOk, true);
    assert.equal(health.orchestratorOk, true);

    const ocrHealth = await ocrRuntime.health();
    assert.equal(typeof ocrHealth.realOcrAvailable, "boolean");
    assert.equal(ocrHealth.intelligentCaptureRuntimeOk, true);
    assert.equal(ocrHealth.scannerRuntimeOk, true);
    assert.equal(ocrHealth.watchFolderRuntimeOk, true);
    assert.equal(ocrHealth.uploadRuntimeOk, true);
    assert.equal(ocrHealth.persistentQueueRuntimeOk, true);
    assert.equal(ocrHealth.workerRuntimeOk, true);
    assert.equal(ocrHealth.schedulerRuntimeOk, true);
    assert.equal(ocrHealth.observabilityRuntimeOk, true);
    assert.equal(ocrHealth.scalabilityRuntimeOk, true);
    assert.equal(runtime.getOCRProviderPort().providerId, "azure");
  });

  it("OCR Runtime prepara deps estruturais sem consumo funcional (stats de peers inalterados)", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const ocrRuntime = runtime.getOCRRuntimePort();
    const scanner = runtime.getScannerRuntimePort();
    const upload = runtime.getUploadRuntimePort();

    const beforeScanner = await scanner.stats();
    const beforeUpload = await upload.stats();
    const beforeScannerCount = beforeScanner.statistics?.totalScanners ?? 0;
    const beforeUploadCount = beforeUpload.statistics?.totalUploads ?? 0;

    const opened = await ocrRuntime.openJob({ correlationId: "corr-no-consume" });
    assert.equal(opened.ok, true);

    const afterScanner = await scanner.stats();
    const afterUpload = await upload.stats();
    assert.equal(afterScanner.statistics?.totalScanners ?? 0, beforeScannerCount);
    assert.equal(afterUpload.statistics?.totalUploads ?? 0, beforeUploadCount);
  });

  it("fluxo de captura passa pelo OCR Runtime (coordenação sem bytes) — não regride Capture Engine", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });

    const result = await runtime.registerCaptureDocumentIntake({
      sessionId: "sess-arch-cap-05",
      documentId: "doc-arch-cap-05",
      storagePath: "tenant/sess-arch-cap-05/original.pdf",
      tenantRef: "tenant-1",
      correlationId: "corr-arch-cap-05",
      channel: "file_upload",
    });

    assert.equal(result.ok, true);
    assert.ok(result.intakeId);
    assert.ok(result.executionId);
    assert.ok(result.runtimeSessionId);
    assert.ok(result.ocrRuntimeSessionId);
    assert.ok(result.classificationRuntimeSessionId);

    const ocrSession = await runtime.getOCRRuntimePort().getSession({
      runtimeSessionId: result.ocrRuntimeSessionId!,
    });
    assert.equal(ocrSession.ok, true);
    assert.equal(ocrSession.session?.status, "coordinated");
    assert.equal(ocrSession.session?.realOcrExecuted, false);

    assert.equal(runtime.getOCRRuntimePort().capabilities().implementsRealOcr, true);
    assert.equal(runtime.getOCRRuntimePort().capabilities().implementsAzure, false);
    assert.equal(runtime.getCaptureEngineRuntimePort().capabilities().implementsOcr, false);
    assert.equal(runtime.getCaptureEngineRuntimePort().capabilities().usesOCRRuntime, true);
    assert.equal(runtime.getCaptureEngineRuntimePort().capabilities().supportsProcessOcr, true);
  });
});

describe("F3-CAP-05 ausência de OCR real / vendors no Runtime", () => {
  it("módulo OCR Runtime não referencia backends reais / SDKs externos", () => {
    const root = join(repoRoot, "src/lib/enterprise/ocr-runtime");
    const files = collectTsFiles(root);
    assert.ok(files.length > 0);

    const forbidden = [
      /documentintelligence\.azure\.com/i,
      /vision\.googleapis\.com/i,
      /textract\.(amazonaws|aws)/i,
      /tesseract\.js/i,
      /from ["']tesseract/i,
      /@azure\/ai-form-recognizer/i,
      /@google-cloud\/vision/i,
      /@aws-sdk\/client-textract/i,
      /from ["']paddleocr/i,
      /from ["']abbyy/i,
      /Ocp-Apim-Subscription-Key/i,
      /fetch\s*\(/,
      /from ["']axios["']/,
      /new\s+FormData\s*\(/,
      /fs\.readFile/i,
      /createReadStream\s*\(/,
    ];

    for (const file of files) {
      const src = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        assert.equal(pattern.test(src), false, `${file} matched ${pattern}`);
      }
    }

    const defaultAdapter = readFileSync(
      join(root, "adapters/default-ocr-runtime-adapter.ts"),
      "utf8",
    );
    assert.match(defaultAdapter, /ocrProvider\.process\s*\(/);
    assert.match(defaultAdapter, /OCRProviderPort/);

    const capabilitiesSrc = readFileSync(join(root, "ports/capabilities.ts"), "utf8");
    assert.match(capabilitiesSrc, /ocrEngineImplemented:\s*false/);
    assert.match(capabilitiesSrc, /pdfOcrImplemented:\s*false/);
    assert.match(capabilitiesSrc, /imageOcrImplemented:\s*false/);
    assert.match(capabilitiesSrc, /documentRecognitionImplemented:\s*false/);
    assert.match(capabilitiesSrc, /textExtractionImplemented:\s*false/);
    assert.match(capabilitiesSrc, /handwritingRecognitionImplemented:\s*false/);
    assert.match(capabilitiesSrc, /multiEngineImplemented:\s*false/);
    assert.match(capabilitiesSrc, /languageDetectionImplemented:\s*false/);
  });

  it("Enterprise Runtime wiring inclui createOCRRuntimePort provider enterprise + deps estruturais", () => {
    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.match(enterpriseRuntime, /createOCRRuntimePort/);
    assert.match(enterpriseRuntime, /provider:\s*"enterprise"/);
    assert.match(enterpriseRuntime, /getIntelligentCaptureRuntimePort:\s*\(\)\s*=>\s*this\.intelligentCaptureRuntimePort/);
    assert.match(enterpriseRuntime, /getScannerRuntimePort:\s*\(\)\s*=>\s*this\.scannerRuntimePort/);
    assert.match(enterpriseRuntime, /F3-CAP-05/);
  });

  it("sem Provider/Adapter/Factory/Registry paralelo", () => {
    const root = join(repoRoot, "src/lib/enterprise/ocr-runtime");
    const files = collectTsFiles(root).map((f) => f.replace(/\\/g, "/"));
    assert.ok(files.some((f) => f.endsWith("/providers/create-ocr-runtime-port.ts")));
    assert.ok(files.some((f) => f.endsWith("/factory/ocr-runtime-factory.ts")));
    assert.ok(files.some((f) => f.endsWith("/registry/ocr-runtime-registry.ts")));
    assert.equal(files.filter((f) => f.includes("/factory/")).length, 2);
    assert.equal(files.filter((f) => f.includes("/registry/")).length, 2);
    assert.equal(
      files.filter((f) => /adapters\/.*ocr-runtime-adapter\.ts$/.test(f)).length,
      2,
    );
  });

  it("produto não instancia Adapter OCR diretamente via Enterprise Runtime", () => {
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const keys = Object.keys(runtime);
    assert.ok(!keys.some((k) => /adapter/i.test(k)));
    assert.equal(typeof runtime.getOCRRuntimePort, "function");
    assert.equal(typeof runtime.getOCRProviderPort, "function");
    assert.equal(typeof runtime.registerCaptureDocumentIntake, "function");
  });
});

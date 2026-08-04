#!/usr/bin/env node
/**
 * F3-CAP-06 — Enterprise Document Classification Runtime Foundation (+ DIP-04 / CLASS-01 preservado)
 * Prova: Application → DocumentClassificationRuntimePort → Adapter → Factory → Registry → Store
 *         + openJob / closeJob / submitRequest / registerDocument / getResult / stats
 *         + Enterprise Runtime + deps estruturais (ICR/Scanner/WatchFolder/Upload/
 *           PQR/Worker/Scheduler/Obs/Scalability)
 *         + coordenação/execução real DIP-04/CLASS-01 preservada via Orchestrator +
 *           OCR Runtime + DocumentClassificationProviderPort (Capture Engine Runtime não regride)
 *         + ausência de classificação real / IA / ML / LLM / template matching /
 *           roteamento automático / visão computacional / chamadas externas
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_DOCUMENT_CLASSIFICATION_RUNTIME_PROVIDER_COUNT,
  DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ADAPTER_ID,
  DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES,
  DefaultDocumentClassificationRuntimeAdapter,
  DocumentClassificationRuntimeFactory,
  DocumentClassificationRuntimeProvider,
  DocumentClassificationRuntimeRegistry,
  EnterpriseDocumentClassificationRuntimeAdapter,
  IN_MEMORY_DOCUMENT_CLASSIFICATION_RUNTIME_STORE_ID,
  InMemoryDocumentClassificationRuntimeStore,
  MOCK_DOCUMENT_CLASSIFICATION_RUNTIME_ADAPTER_ID,
  MockDocumentClassificationRuntimeAdapter,
  DOCUMENT_CLASSIFICATION_RUNTIME_IDENTITY,
  STRUCTURAL_DOCUMENT_CLASSIFICATION_PROVIDER_REFERENCES,
  createDefaultDocumentClassificationRuntimeRegistry,
  createDocumentClassificationRuntimeFactory,
  createDocumentClassificationRuntimePort,
  createDocumentClassificationRuntimeSessionId,
  getDocumentClassificationRuntimeFactory,
  getDocumentClassificationRuntimeHealthSummary,
  getDocumentClassificationRuntimePort,
  resetAllDocumentClassificationRuntimeIdSequences,
  type CanonicalDocumentClassificationRequest,
  type DocumentClassificationRuntimePort,
} from "../../../src/lib/enterprise/document-classification-runtime/index.ts";
import { createDocumentClassificationProviderPort } from "../../../src/lib/enterprise/document-classification-provider/index.ts";
import { createOCRProviderPort } from "../../../src/lib/enterprise/ocr-provider/index.ts";
import { createOCRRuntimePort } from "../../../src/lib/enterprise/ocr-runtime/index.ts";
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

function sampleRequest(
  overrides: Partial<CanonicalDocumentClassificationRequest> = {},
): CanonicalDocumentClassificationRequest {
  return {
    kind: "canonical-document-classification-request",
    identity: {
      kind: "canonical-document-classification-identity",
      documentId: "doc-dip-04",
      documentKind: "capture-document",
    },
    metadata: {
      kind: "canonical-document-classification-metadata",
      sessionId: "sess-dip-04",
      tenantRef: "tenant-1",
      correlationId: "corr-dip-04",
      channel: "file_upload",
      tags: ["dip-04"],
    },
    reference: {
      kind: "canonical-document-classification-reference",
      storageKey: "tenant/sess-dip-04/original.pdf",
      storageContainer: "clinical-documents",
      storageProvider: "product-capture",
      metadataId: "sess-dip-04",
      metadataNamespace: "product.capture",
      captureRuntimeSessionId: "dip-capture-session-1",
      ocrRuntimeSessionId: "dip-ocr-session-1",
      providerReferenceId: "mock",
    },
    capabilities: {
      kind: "canonical-document-classification-capabilities",
      supportsMedicalGuideClassification: false,
      supportsInvoiceClassification: false,
      supportsContractClassification: false,
      supportsBatchClassification: false,
      supportsConfidenceScore: false,
      supportsMultiLabelClassification: false,
      supportsCustomModels: false,
      supportsRuleBasedClassification: false,
      declared: ["document-classification-runtime"],
    },
    configuration: {
      kind: "canonical-document-classification-configuration",
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
  const ocrRuntimePort = createOCRRuntimePort({
    provider: "default",
    enterpriseDeps: {
      getOrchestratorPort: () => orchestratorPort,
      getOCRProviderPort: () => ocrProviderPort,
    },
  });
  const documentClassificationProviderPort = createDocumentClassificationProviderPort({
    provider: "rule-based",
  });
  return {
    orchestratorPort,
    ocrRuntimePort,
    documentClassificationProviderPort,
    deps: {
      getOrchestratorPort: () => orchestratorPort,
      getOCRRuntimePort: () => ocrRuntimePort,
      getDocumentClassificationProviderPort: () => documentClassificationProviderPort,
    },
  };
}

function assertClass01ClassificationCapabilities(
  caps: ReturnType<DocumentClassificationRuntimePort["capabilities"]>,
) {
  assert.equal(caps.supportsRuleBasedClassification, true);
  assert.equal(caps.implementsRealClassification, true);
  assert.equal(caps.supportsClassify, true);
  assert.equal(caps.usesDocumentClassificationProviderAdapter, true);
  assert.equal(caps.implementsAi, false);
  assert.equal(caps.implementsMachineLearning, false);
  assert.equal(caps.implementsRuleEngine, false);
  assert.equal(caps.implementsEmbeddings, false);
  assert.equal(caps.implementsLlm, false);
  assert.equal(caps.implementsOcrForClassification, false);
}

function assertStructuralFlagsFalse(obj: Record<string, unknown>) {
  const flags = [
    "classificationImplemented",
    "documentRecognitionImplemented",
    "templateRecognitionImplemented",
    "medicalGuideRecognitionImplemented",
    "documentCategoryImplemented",
    "automaticRoutingImplemented",
    "confidenceScoreImplemented",
    "multiClassifierImplemented",
    "layoutClassificationImplemented",
    "semanticClassificationImplemented",
  ];
  for (const flag of flags) {
    assert.equal(obj[flag], false, `${flag} deveria ser false`);
  }
}

describe("F3-CAP-06 DocumentClassificationRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy sem classificação real", async () => {
    const port: DocumentClassificationRuntimePort = new MockDocumentClassificationRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.realClassificationAvailable, false);
    assert.equal(health.runtimeReady, true);
    assertStructuralFlagsFalse(health as unknown as Record<string, unknown>);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_DOCUMENT_CLASSIFICATION_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsCoordinateClassification, true);
    assert.equal(caps.implementsRealClassification, false);
    assert.equal(caps.implementsAi, false);
    assert.equal(caps.implementsLlm, false);
    assert.equal(caps.supportsOpenJob, true);
    assert.equal(caps.supportsCloseJob, true);
    assert.equal(caps.supportsSubmitRequest, true);
    assert.equal(caps.supportsRegisterDocument, true);
    assert.equal(caps.supportsGetResult, true);
    assert.equal(caps.supportsStats, true);
    assert.equal(caps.runtimeReady, true);
    assertStructuralFlagsFalse(caps as unknown as Record<string, unknown>);
  });

  it("DefaultDocumentClassificationRuntimeAdapter é o adapter enterprise oficial (enterpriseDeps opcional)", () => {
    assert.equal(
      EnterpriseDocumentClassificationRuntimeAdapter,
      DefaultDocumentClassificationRuntimeAdapter,
    );
    const port = new DefaultDocumentClassificationRuntimeAdapter({ provider: "enterprise" });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ADAPTER_ID);
    assert.equal(port.capabilities().implementsRealClassification, false);
  });

  it("identity declara Enterprise Document Classification Runtime Foundation vendor-agnostic", () => {
    assert.equal(
      DOCUMENT_CLASSIFICATION_RUNTIME_IDENTITY.name,
      "Enterprise Document Classification Runtime",
    );
    assert.equal(DOCUMENT_CLASSIFICATION_RUNTIME_IDENTITY.layer, "Foundation");
    assert.ok(DOCUMENT_CLASSIFICATION_RUNTIME_IDENTITY.version);
    assert.equal(DOCUMENT_CLASSIFICATION_RUNTIME_IDENTITY.vendorAgnostic, true);
    const info = createDocumentClassificationRuntimePort().providerInfo();
    assert.equal(info.metadata.vendorAgnostic, true);
    assert.equal(info.metadata.layer, "Foundation");
    assert.equal(info.providerType, "DOCUMENT_CLASSIFICATION_RUNTIME");
  });

  it("provider default resolve enterprise via getDocumentClassificationRuntimePort/Provider", () => {
    const port = createDocumentClassificationRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(getDocumentClassificationRuntimePort().providerId, "enterprise");
    assert.equal(DocumentClassificationRuntimeProvider.create().providerId, "enterprise");
    assert.equal(DocumentClassificationRuntimeProvider.get().providerId, "enterprise");
    assert.ok(
      DocumentClassificationRuntimeProvider.getFactory() instanceof
        DocumentClassificationRuntimeFactory,
    );
  });

  it("factory resolve mock / test / default / enterprise", () => {
    const factory = createDocumentClassificationRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(
      getDocumentClassificationRuntimeFactory().getRegistry().list().length,
      BUILTIN_DOCUMENT_CLASSIFICATION_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("openJob → submitRequest → registerDocument → getResult → closeJob → stats (sem classificação real)", async () => {
    resetAllDocumentClassificationRuntimeIdSequences();
    const port = createDocumentClassificationRuntimePort({ provider: "enterprise" });

    const opened = await port.openJob({ correlationId: "corr-f3-cap-06" });
    assert.equal(opened.ok, true);
    assert.equal(opened.job?.status, "job-open");
    assert.equal(opened.result?.runtimeReady, true);
    assertStructuralFlagsFalse(opened.result as unknown as Record<string, unknown>);
    const jobId = opened.job!.jobId;

    const submitted = await port.submitRequest({ jobId, documentId: "doc-f3-cap-06" });
    assert.equal(submitted.ok, true);
    assert.equal(submitted.request?.status, "submitted");
    assert.equal(submitted.request?.jobId, jobId);
    const requestId = submitted.request!.requestId;

    const registered = await port.registerDocument({
      jobId,
      requestId,
      documentId: "doc-f3-cap-06",
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
    assert.equal(stats.statistics?.kind, "canonical-classification-statistics");
    assert.ok((stats.statistics?.totalJobs ?? 0) >= 1);
    assert.ok((stats.statistics?.totalRequests ?? 0) >= 1);
    assert.ok((stats.statistics?.totalDocuments ?? 0) >= 1);
    assert.equal(stats.statistics?.classificationImplementedCount, 0);
    assert.equal(stats.statistics?.documentRecognitionImplementedCount, 0);
  });

  it("InMemory store persiste sessões (DIP-04) e jobs/requests/documents (F3-CAP-06)", async () => {
    const store = new InMemoryDocumentClassificationRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_DOCUMENT_CLASSIFICATION_RUNTIME_STORE_ID);
    assert.equal(store.health().ok, true);

    const stamp = new Date().toISOString();
    store.setSession({
      kind: "canonical-document-classification-session",
      runtimeSessionId: "sess-store-1",
      status: "coordinated",
      request: sampleRequest(),
      createdAt: stamp,
      updatedAt: stamp,
      realClassificationExecuted: false,
    });
    assert.equal(store.sessionCount(), 1);
    assert.equal(store.getSession("sess-store-1")?.status, "coordinated");
    assert.equal(store.removeSession("sess-store-1"), true);
    assert.equal(store.sessionCount(), 0);

    const port = new DefaultDocumentClassificationRuntimeAdapter({
      provider: "enterprise",
      store,
    });
    await port.openJob({ jobId: "job-store-1" });
    await port.submitRequest({ jobId: "job-store-1", requestId: "req-store-1" });
    await port.registerDocument({ documentId: "doc-store-1", jobId: "job-store-1" });
    assert.equal(store.jobCount(), 1);
    assert.equal(store.requestCount(), 1);
    assert.equal(store.documentCount(), 1);

    const statistics = store.statistics();
    assert.equal(statistics.kind, "canonical-classification-statistics");
    assert.equal(statistics.openJobs, 1);
    assert.equal(statistics.closedJobs, 0);
  });

  it("retry recupera falha transitória em operação estrutural", async () => {
    const port = new DefaultDocumentClassificationRuntimeAdapter({
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
    const port = createDocumentClassificationRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.openJob({ signal: controller.signal });
    assert.equal(result.ok, false);
    assert.equal(result.code, "CLASSIFICATION_RUNTIME_CANCELLED");
    assert.equal(result.telemetry?.cancelled, true);
  });

  it("registry/factory sem fallback silencioso", () => {
    const registry = createDefaultDocumentClassificationRuntimeRegistry();
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.has("mock"), true);
    assert.equal(registry.has("test"), true);
    assert.equal(registry.has("default"), true);
    assert.equal(registry.snapshot().count, BUILTIN_DOCUMENT_CLASSIFICATION_RUNTIME_PROVIDER_COUNT);
    assert.ok(registry instanceof DocumentClassificationRuntimeRegistry);

    const factory = new DocumentClassificationRuntimeFactory({ registry });
    assert.throws(
      () => factory.create({ provider: "ai-classifier" as never }),
      /não está registrado/,
    );
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createDocumentClassificationRuntimePort({ provider: "mock" });
    const summary = await getDocumentClassificationRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.health.realClassificationAvailable, false);
    assert.equal(summary.capabilities.supportsCoordinateClassification, true);
    assert.equal(summary.capabilities.supportsOpenJob, true);
    assert.equal(summary.info.providerType, "DOCUMENT_CLASSIFICATION_RUNTIME");
  });

  it("lista referências estruturais de Classification Providers sem conexão", async () => {
    const port = createDocumentClassificationRuntimePort({ provider: "mock" });
    const refs = await port.listProviderReferences();
    assert.equal(refs.ok, true);
    assert.equal(
      refs.references.length,
      STRUCTURAL_DOCUMENT_CLASSIFICATION_PROVIDER_REFERENCES.length,
    );
    const ids = refs.references.map((r) => r.providerReferenceId).sort();
    assert.deepEqual(ids, [
      "ai-classifier",
      "hybrid-classifier",
      "ml-classifier",
      "mock",
      "rule-based-classifier",
    ]);
    for (const ref of refs.references) {
      assert.equal(ref.connected, false);
      assert.equal(ref.implementsAi, false);
      assert.equal(ref.implementsMachineLearning, false);
      assert.equal(ref.implementsRuleEngine, false);
      if (ref.providerReferenceId === "rule-based-classifier") {
        assert.equal(ref.implementsRealClassification, true);
        assert.equal(ref.status, "available-via-document-classification-provider-port");
      } else {
        assert.equal(ref.implementsRealClassification, false);
        assert.equal(ref.status, "structural-reference-only");
      }
    }
  });

  it("createDocumentClassificationRuntimeSessionId é determinístico após reset", () => {
    resetAllDocumentClassificationRuntimeIdSequences();
    assert.equal(createDocumentClassificationRuntimeSessionId(), "dip-classification-session-1");
    assert.equal(createDocumentClassificationRuntimeSessionId(), "dip-classification-session-2");
    resetAllDocumentClassificationRuntimeIdSequences();
    assert.equal(createDocumentClassificationRuntimeSessionId(), "dip-classification-session-1");
  });

  it("DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES declara flags estruturais zeradas", () => {
    assert.equal(DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES.runtimeReady, true);
    assertStructuralFlagsFalse(
      DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES as unknown as Record<
        string,
        unknown
      >,
    );
    assert.equal(
      DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES.usesIntelligentCaptureRuntimePort,
      true,
    );
    assert.equal(
      DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES.usesScannerRuntimePort,
      true,
    );
    assert.equal(
      DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES.usesWatchFolderRuntimePort,
      true,
    );
    assert.equal(
      DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES.usesUploadRuntimePort,
      true,
    );
    assert.equal(
      DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES.usesPersistentQueueRuntimePort,
      true,
    );
    assert.equal(
      DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES.usesWorkerRuntimePort,
      true,
    );
    assert.equal(
      DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES.usesSchedulerRuntimePort,
      true,
    );
    assert.equal(
      DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES.usesObservabilityRuntimePort,
      true,
    );
    assert.equal(
      DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES.usesScalabilityRuntimePort,
      true,
    );
  });
});

describe("DIP-04 / CLASS-01 coordenação e execução real preservadas", () => {
  it("default adapter coordena via Orchestrator + OCR Runtime + Classification Provider Adapter", async () => {
    resetAllDocumentClassificationRuntimeIdSequences();
    const { deps, orchestratorPort, ocrRuntimePort } = enterpriseDeps();
    const port = new DefaultDocumentClassificationRuntimeAdapter({
      provider: "default",
      enterpriseDeps: deps,
    });

    assert.equal(port.providerId, "default");
    assert.equal(port.capabilities().usesCanonicalExecutionOrchestrator, true);
    assert.equal(port.capabilities().usesOCRRuntime, true);
    assert.equal(port.capabilities().usesDocumentClassificationProviderAdapter, true);
    assertClass01ClassificationCapabilities(port.capabilities());

    const result = await port.coordinateClassification(sampleRequest());
    assert.equal(result.ok, true);
    assert.ok(result.runtimeSessionId);
    assert.ok(result.executionId);
    assert.equal(result.realClassificationExecuted, false);
    assert.equal(result.session?.status, "coordinated");
    assert.equal(result.session?.realClassificationExecuted, false);
    assert.equal(result.providerReferenceId, "mock");

    const storedExec = await orchestratorPort.getExecution({
      executionId: result.executionId!,
    });
    assert.equal(storedExec.ok, true);

    const ocrHealth = await ocrRuntimePort.health();
    assert.equal(ocrHealth.ok, true);

    const session = await port.getSession({ runtimeSessionId: result.runtimeSessionId! });
    assert.equal(session.ok, true);
    assert.equal(session.session?.executionId, result.executionId);
  });

  it("coordinateClassification/classify retornam CLASSIFICATION_RUNTIME_PROVIDER_DEPS_MISSING sem enterpriseDeps (CAP ops seguem funcionando)", async () => {
    const port = createDocumentClassificationRuntimePort({ provider: "enterprise" });
    const coordinated = await port.coordinateClassification(sampleRequest());
    assert.equal(coordinated.ok, false);
    assert.equal(coordinated.code, "CLASSIFICATION_RUNTIME_PROVIDER_DEPS_MISSING");

    const classified = await port.classify({
      documentId: "doc-no-deps",
      sessionId: "sess-no-deps",
    });
    assert.equal(classified.ok, false);
    assert.equal(classified.code, "CLASSIFICATION_RUNTIME_PROVIDER_DEPS_MISSING");

    const opened = await port.openJob({});
    assert.equal(opened.ok, true);
  });

  it("coordinateClassification rejeita input inválido", async () => {
    const { deps } = enterpriseDeps();
    const port = createDocumentClassificationRuntimePort({
      provider: "default",
      enterpriseDeps: deps,
    });
    const result = await port.coordinateClassification(
      sampleRequest({
        identity: {
          kind: "canonical-document-classification-identity",
          documentId: "",
        },
        metadata: {
          kind: "canonical-document-classification-metadata",
          sessionId: "",
        },
      }),
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, "INVALID_INPUT");
    assert.equal(result.realClassificationExecuted, false);
  });

  it("classify() produz CanonicalDocumentClassificationResult via ProviderPort", async () => {
    const { deps } = enterpriseDeps();
    const port = createDocumentClassificationRuntimePort({
      provider: "default",
      enterpriseDeps: deps,
    });
    const result = await port.classify({
      ocrText: "Guia TISS — número da guia ANS 123456",
      documentId: "doc-class-01",
      sessionId: "sess-class-01",
    });
    assert.equal(result.ok, true);
    assert.equal(result.kind, "canonical-document-classification-result");
    assert.equal(result.realClassificationExecuted, true);
    assert.equal(result.documentType, "guia-tiss");
    assert.ok((result.confidence ?? 0) > 0);
    assert.ok((result.matchedRules?.length ?? 0) > 0);
    assert.ok(result.telemetry);
  });
});

describe("F3-CAP-06 cadeia Enterprise / Document Classification Runtime", () => {
  it("Enterprise Runtime expõe DocumentClassificationRuntimePort provider enterprise + health.documentClassificationRuntimeOk", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const classificationRuntime = runtime.getDocumentClassificationRuntimePort();
    assert.ok(classificationRuntime);
    assert.equal(classificationRuntime.providerId, "enterprise");

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.documentClassificationRuntimeOk, true);
    assert.equal(health.ocrRuntimeOk, true);
    assert.equal(health.captureEngineRuntimeOk, true);
    assert.equal(health.orchestratorOk, true);

    const classificationHealth = await classificationRuntime.health();
    assert.equal(classificationHealth.realClassificationAvailable, true);
    assert.equal(classificationHealth.intelligentCaptureRuntimeOk, true);
    assert.equal(classificationHealth.scannerRuntimeOk, true);
    assert.equal(classificationHealth.watchFolderRuntimeOk, true);
    assert.equal(classificationHealth.uploadRuntimeOk, true);
    assert.equal(classificationHealth.persistentQueueRuntimeOk, true);
    assert.equal(classificationHealth.workerRuntimeOk, true);
    assert.equal(classificationHealth.schedulerRuntimeOk, true);
    assert.equal(classificationHealth.observabilityRuntimeOk, true);
    assert.equal(classificationHealth.scalabilityRuntimeOk, true);
    assert.equal(health.documentClassificationProviderOk, true);
    assert.equal(runtime.getDocumentClassificationProviderPort().providerId, "rule-based");
  });

  it("Classification Runtime prepara deps estruturais sem consumo funcional (stats de peers inalterados)", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const classificationRuntime = runtime.getDocumentClassificationRuntimePort();
    const scanner = runtime.getScannerRuntimePort();
    const upload = runtime.getUploadRuntimePort();

    const beforeScanner = await scanner.stats();
    const beforeUpload = await upload.stats();
    const beforeScannerCount = beforeScanner.statistics?.totalScanners ?? 0;
    const beforeUploadCount = beforeUpload.statistics?.totalUploads ?? 0;

    const opened = await classificationRuntime.openJob({ correlationId: "corr-no-consume" });
    assert.equal(opened.ok, true);

    const afterScanner = await scanner.stats();
    const afterUpload = await upload.stats();
    assert.equal(afterScanner.statistics?.totalScanners ?? 0, beforeScannerCount);
    assert.equal(afterUpload.statistics?.totalUploads ?? 0, beforeUploadCount);
  });

  it("fluxo captura passa pelo Classification Runtime (coordenação; classify via ProviderPort) — não regride Capture Engine", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });

    const result = await runtime.registerCaptureDocumentIntake({
      sessionId: "sess-arch-dip-04",
      documentId: "doc-arch-dip-04",
      storagePath: "tenant/sess-arch-dip-04/original.pdf",
      tenantRef: "tenant-1",
      correlationId: "corr-arch-dip-04",
      channel: "file_upload",
    });

    assert.equal(result.ok, true);
    assert.ok(result.intakeId);
    assert.ok(result.executionId);
    assert.ok(result.runtimeSessionId);
    assert.ok(result.ocrRuntimeSessionId);
    assert.ok(result.classificationRuntimeSessionId);

    const captureSession = await runtime.getCaptureEngineRuntimePort().getSession({
      runtimeSessionId: result.runtimeSessionId!,
    });
    assert.equal(captureSession.ok, true);
    assert.equal(captureSession.session?.status, "registered");
    assert.equal(
      captureSession.session?.classificationRuntimeSessionId,
      result.classificationRuntimeSessionId,
    );

    const ocrSession = await runtime.getOCRRuntimePort().getSession({
      runtimeSessionId: result.ocrRuntimeSessionId!,
    });
    assert.equal(ocrSession.ok, true);
    assert.equal(ocrSession.session?.status, "coordinated");

    const classificationSession = await runtime.getDocumentClassificationRuntimePort().getSession({
      runtimeSessionId: result.classificationRuntimeSessionId!,
    });
    assert.equal(classificationSession.ok, true);
    assert.equal(classificationSession.session?.status, "coordinated");
    assert.equal(classificationSession.session?.realClassificationExecuted, false);

    const classificationExec = await runtime.getOrchestratorPort().getExecution({
      executionId: classificationSession.session!.executionId!,
    });
    assert.equal(classificationExec.ok, true);

    assert.equal(
      runtime.getDocumentClassificationRuntimePort().capabilities().implementsRealClassification,
      true,
    );
    assert.equal(
      runtime.getCaptureEngineRuntimePort().capabilities().implementsClassification,
      false,
    );
    assert.equal(
      runtime.getCaptureEngineRuntimePort().capabilities().usesDocumentClassificationRuntime,
      true,
    );
    assert.equal(runtime.getCaptureEngineRuntimePort().capabilities().usesOCRRuntime, true);
  });

  it("produto não instancia Adapter Classification diretamente via Enterprise Runtime", () => {
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const keys = Object.keys(runtime);
    assert.ok(!keys.some((k) => /adapter/i.test(k)));
    assert.equal(typeof runtime.getDocumentClassificationRuntimePort, "function");
    assert.equal(typeof runtime.getDocumentClassificationProviderPort, "function");
    assert.equal(typeof runtime.getOCRRuntimePort, "function");
    assert.equal(typeof runtime.getCaptureEngineRuntimePort, "function");
    assert.equal(typeof runtime.registerCaptureDocumentIntake, "function");
  });
});

describe("F3-CAP-06 ausência de classificação real / IA / ML / LLM no Runtime", () => {
  it("módulo Document Classification Runtime não referencia IA/ML/LLM/HTTP nem bypass de Provider", () => {
    const root = join(repoRoot, "src/lib/enterprise/document-classification-runtime");
    const files = collectTsFiles(root);
    assert.ok(files.length > 0);

    const forbidden = [
      /from ["']openai/i,
      /from ["']@openai/i,
      /from ["']anthropic/i,
      /from ["']@anthropic/i,
      /@tensorflow\//i,
      /@huggingface\//i,
      /langchain/i,
      /\.predict\s*\(/,
      /createEmbedding\s*\(/i,
      /documentintelligence\.azure\.com/i,
      /vision\.googleapis\.com/i,
      /textract\.(amazonaws|aws)/i,
      /tesseract\.js/i,
      /from ["']tesseract/i,
      /fetch\s*\(/,
      /https?:\/\//,
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
      join(root, "adapters/default-document-classification-runtime-adapter.ts"),
      "utf8",
    );
    assert.match(defaultAdapter, /classificationProvider\.classify\s*\(/);
    assert.match(defaultAdapter, /DocumentClassificationProviderPort/);

    const capabilitiesSrc = readFileSync(join(root, "ports/capabilities.ts"), "utf8");
    assert.match(capabilitiesSrc, /classificationImplemented:\s*false/);
    assert.match(capabilitiesSrc, /documentRecognitionImplemented:\s*false/);
    assert.match(capabilitiesSrc, /templateRecognitionImplemented:\s*false/);
    assert.match(capabilitiesSrc, /medicalGuideRecognitionImplemented:\s*false/);
    assert.match(capabilitiesSrc, /automaticRoutingImplemented:\s*false/);
    assert.match(capabilitiesSrc, /confidenceScoreImplemented:\s*false/);
    assert.match(capabilitiesSrc, /multiClassifierImplemented:\s*false/);
    assert.match(capabilitiesSrc, /layoutClassificationImplemented:\s*false/);
    assert.match(capabilitiesSrc, /semanticClassificationImplemented:\s*false/);
  });

  it("Enterprise Runtime wiring inclui createDocumentClassificationRuntimePort provider enterprise + deps estruturais", () => {
    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.match(enterpriseRuntime, /createDocumentClassificationRuntimePort/);
    assert.match(
      enterpriseRuntime,
      /getIntelligentCaptureRuntimePort:\s*\(\)\s*=>\s*this\.intelligentCaptureRuntimePort/,
    );
    assert.match(
      enterpriseRuntime,
      /getScannerRuntimePort:\s*\(\)\s*=>\s*this\.scannerRuntimePort/,
    );
    assert.match(enterpriseRuntime, /F3-CAP-06/);
  });

  it("sem Provider/Adapter/Factory/Registry paralelo", () => {
    const root = join(repoRoot, "src/lib/enterprise/document-classification-runtime");
    const files = collectTsFiles(root).map((f) => f.replace(/\\/g, "/"));
    assert.ok(
      files.some((f) => f.endsWith("/providers/create-document-classification-runtime-port.ts")),
    );
    assert.ok(files.some((f) => f.endsWith("/factory/document-classification-runtime-factory.ts")));
    assert.ok(
      files.some((f) => f.endsWith("/registry/document-classification-runtime-registry.ts")),
    );
    assert.equal(files.filter((f) => f.includes("/factory/")).length, 2);
    assert.equal(files.filter((f) => f.includes("/registry/")).length, 2);
    assert.equal(
      files.filter((f) => /adapters\/.*document-classification-runtime-adapter\.ts$/.test(f))
        .length,
      2,
    );
  });

  it("coordinateClassification não produz texto extraído nem páginas OCR", async () => {
    const { deps } = enterpriseDeps();
    const port = createDocumentClassificationRuntimePort({
      provider: "default",
      enterpriseDeps: deps,
    });
    const result = await port.coordinateClassification(sampleRequest());
    assert.equal(result.ok, true);
    const sessionJson = JSON.stringify(result.session);
    assert.equal(/extractedText|ocrText|pages|blocks|words/i.test(sessionJson), false);
    assert.equal(result.realClassificationExecuted, false);
  });
});

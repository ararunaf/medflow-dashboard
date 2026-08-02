#!/usr/bin/env node
/**
 * DIP-03 — OCR Runtime Foundation
 * Prova: Runtime → Port → Adapter → Store → Factory → Provider
 *         + Enterprise Runtime + Capture Runtime + Orchestrator
 *         + ausência de OCR real / chamadas externas / processamento
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_OCR_RUNTIME_ADAPTER_ID,
  DefaultOCRRuntimeAdapter,
  IN_MEMORY_OCR_RUNTIME_STORE_ID,
  InMemoryOCRRuntimeStore,
  MOCK_OCR_RUNTIME_ADAPTER_ID,
  MockOCRRuntimeAdapter,
  OCRRuntimeFactory,
  STRUCTURAL_OCR_PROVIDER_REFERENCES,
  createOCRRuntimeFactory,
  createOCRRuntimePort,
  createOCRRuntimeSessionId,
  getOCRRuntimeHealthSummary,
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

function assertNoRealOcrCapabilities(caps: ReturnType<OCRRuntimePort["capabilities"]>) {
  assert.equal(caps.supportsPdf, false);
  assert.equal(caps.supportsImage, false);
  assert.equal(caps.supportsBatch, false);
  assert.equal(caps.supportsStreaming, false);
  assert.equal(caps.supportsHandwriting, false);
  assert.equal(caps.supportsTables, false);
  assert.equal(caps.supportsForms, false);
  assert.equal(caps.supportsConfidenceScore, false);
  assert.equal(caps.implementsRealOcr, false);
  assert.equal(caps.implementsAzure, false);
  assert.equal(caps.implementsGoogleVision, false);
  assert.equal(caps.implementsAwsTextract, false);
  assert.equal(caps.implementsTesseract, false);
}

describe("DIP-03 OCRRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy sem OCR real", async () => {
    const port: OCRRuntimePort = new MockOCRRuntimeAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.realOcrAvailable, false);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_OCR_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsCoordinateOcr, true);
    assertNoRealOcrCapabilities(caps);
  });

  it("default adapter exige enterpriseDeps (sem implementação paralela)", () => {
    assert.throws(
      () =>
        // @ts-expect-error — enterpriseDeps obrigatório
        new DefaultOCRRuntimeAdapter({}),
      /enterpriseDeps/,
    );
  });

  it("default adapter coordena via Orchestrator + OCR Provider Adapter (sem process)", async () => {
    resetAllOCRRuntimeIdSequences();
    const { deps, orchestratorPort, ocrProviderPort } = enterpriseDeps();
    const port = new DefaultOCRRuntimeAdapter({ enterpriseDeps: deps });

    assert.equal(port.providerId, "default");
    assert.equal(port.capabilities().adapterId, DEFAULT_OCR_RUNTIME_ADAPTER_ID);
    assert.equal(port.capabilities().usesCanonicalExecutionOrchestrator, true);
    assert.equal(port.capabilities().usesOCRProviderAdapter, true);
    assertNoRealOcrCapabilities(port.capabilities());

    const result = await port.coordinateOcr(sampleRequest());
    assert.equal(result.ok, true);
    assert.ok(result.runtimeSessionId);
    assert.ok(result.executionId);
    assert.equal(result.realOcrExecuted, false);
    assert.equal(result.session?.status, "coordinated");
    assert.equal(result.session?.realOcrExecuted, false);
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

  it("InMemoryOCRRuntimeStore persiste sessões", () => {
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
    assert.equal(store.listSessions().length, 1);
    assert.equal(store.removeSession("sess-store-1"), true);
    assert.equal(store.sessionCount(), 0);
  });

  it("Factory e Provider resolvem default / mock / test", () => {
    const { deps } = enterpriseDeps();
    const factory = createOCRRuntimeFactory({ enterpriseDeps: deps });
    assert.ok(factory instanceof OCRRuntimeFactory);

    const defaultPort = factory.create({ provider: "default" });
    assert.equal(defaultPort.providerId, "default");

    const mockPort = createOCRRuntimePort({ provider: "mock" });
    assert.equal(mockPort.providerId, "mock");

    const testPort = createOCRRuntimePort({ provider: "test", enterpriseDeps: deps });
    assert.equal(testPort.providerId, "test");

    assert.throws(() => createOCRRuntimePort({ provider: "default" }), /enterpriseDeps/);
  });

  it("Provider desconhecido não existe — ids restritos a default|mock|test", () => {
    const factory = createOCRRuntimeFactory();
    assert.throws(
      () =>
        factory.create({
          // @ts-expect-error — provider inválido
          provider: "azure",
        }),
      /desconhecido|exige enterpriseDeps/,
    );
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createOCRRuntimePort({ provider: "mock" });
    const summary = await getOCRRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.health.realOcrAvailable, false);
    assert.equal(summary.capabilities.supportsCoordinateOcr, true);
    assertNoRealOcrCapabilities(summary.capabilities);
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

  it("createOCRRuntimeSessionId é determinístico após reset", () => {
    resetAllOCRRuntimeIdSequences();
    assert.equal(createOCRRuntimeSessionId(), "dip-ocr-session-1");
    assert.equal(createOCRRuntimeSessionId(), "dip-ocr-session-2");
    resetAllOCRRuntimeIdSequences();
    assert.equal(createOCRRuntimeSessionId(), "dip-ocr-session-1");
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
      assert.equal(ref.implementsRealOcr, false);
      assert.equal(ref.status, "structural-reference-only");
    }
  });
});

describe("DIP-03 integração Enterprise / Capture / Orchestrator", () => {
  it("Enterprise Runtime expõe OCRRuntimePort", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const ocrRuntime = runtime.getOCRRuntimePort();
    assert.ok(ocrRuntime);
    assert.equal(ocrRuntime.providerId, "default");

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.ocrRuntimeOk, true);
    assert.equal(health.captureEngineRuntimeOk, true);
    assert.equal(health.orchestratorOk, true);

    const ocrHealth = await ocrRuntime.health();
    assert.equal(ocrHealth.realOcrAvailable, false);
  });

  it("fluxo captura passa pelo OCR Runtime sem OCR real", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });

    const result = await runtime.registerCaptureDocumentIntake({
      sessionId: "sess-arch-dip-03",
      documentId: "doc-arch-dip-03",
      storagePath: "tenant/sess-arch-dip-03/original.pdf",
      tenantRef: "tenant-1",
      correlationId: "corr-arch-dip-03",
      channel: "file_upload",
    });

    assert.equal(result.ok, true);
    assert.ok(result.intakeId);
    assert.ok(result.executionId);
    assert.ok(result.runtimeSessionId);
    assert.ok(result.ocrRuntimeSessionId);

    const captureSession = await runtime.getCaptureEngineRuntimePort().getSession({
      runtimeSessionId: result.runtimeSessionId!,
    });
    assert.equal(captureSession.ok, true);
    assert.equal(captureSession.session?.status, "registered");
    assert.equal(captureSession.session?.ocrRuntimeSessionId, result.ocrRuntimeSessionId);

    const ocrSession = await runtime.getOCRRuntimePort().getSession({
      runtimeSessionId: result.ocrRuntimeSessionId!,
    });
    assert.equal(ocrSession.ok, true);
    assert.equal(ocrSession.session?.status, "coordinated");
    assert.equal(ocrSession.session?.realOcrExecuted, false);

    const ocrExec = await runtime.getOrchestratorPort().getExecution({
      executionId: ocrSession.session!.executionId!,
    });
    assert.equal(ocrExec.ok, true);

    assert.equal(runtime.getOCRRuntimePort().capabilities().implementsRealOcr, false);
    assert.equal(runtime.getCaptureEngineRuntimePort().capabilities().implementsOcr, false);
    assert.equal(runtime.getCaptureEngineRuntimePort().capabilities().usesOCRRuntime, true);
  });

  it("produto não instancia Adapter OCR diretamente", () => {
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const keys = Object.keys(runtime);
    assert.ok(!keys.some((k) => /adapter/i.test(k)));
    assert.equal(typeof runtime.getOCRRuntimePort, "function");
    assert.equal(typeof runtime.getCaptureEngineRuntimePort, "function");
    assert.equal(typeof runtime.registerCaptureDocumentIntake, "function");
  });
});

describe("DIP-03 ausência de OCR real / integrações externas", () => {
  it("fonte do módulo OCR Runtime não contém integrações externas nem process OCR", () => {
    const moduleDir = join(repoRoot, "src/lib/enterprise/ocr-runtime");
    const files = [
      "adapters/default-ocr-runtime-adapter.ts",
      "adapters/mock-ocr-runtime-adapter.ts",
      "factory/ocr-runtime-factory.ts",
      "providers/create-ocr-runtime-port.ts",
      "ports/ocr-runtime-port.ts",
      "ports/types.ts",
      "ports/models.ts",
      "index.ts",
    ];

    const forbidden = [
      /documentintelligence\.azure\.com/i,
      /vision\.googleapis\.com/i,
      /textract\.(amazonaws|aws)/i,
      /tesseract\.js/i,
      /from ["']tesseract/i,
      /@azure\/ai-form-recognizer/i,
      /@google-cloud\/vision/i,
      /@aws-sdk\/client-textract/i,
      /ocrProvider\.process\s*\(/,
      /getOCRProviderPort\(\)\s*\.process\s*\(/,
      /\.process\s*\(\s*\{/,
      /fetch\s*\(/,
      /https?:\/\//,
    ];

    for (const rel of files) {
      const source = readFileSync(join(moduleDir, rel), "utf8");
      for (const pattern of forbidden) {
        assert.equal(
          pattern.test(source),
          false,
          `Padrão proibido ${pattern} encontrado em ${rel}`,
        );
      }
    }

    const defaultAdapter = readFileSync(
      join(moduleDir, "adapters/default-ocr-runtime-adapter.ts"),
      "utf8",
    );
    assert.match(defaultAdapter, /health\/capabilities/);
    assert.match(defaultAdapter, /PROIBIDO:/);
    assert.equal(/ocrProvider\.process\s*\(/.test(defaultAdapter), false);
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

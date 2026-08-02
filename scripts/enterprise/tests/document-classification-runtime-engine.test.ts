#!/usr/bin/env node
/**
 * DIP-04 — Document Classification Runtime
 * Prova: Runtime → Port → Adapter → Store → Factory → Provider
 *         + Enterprise Runtime + Capture Runtime + OCR Runtime + Orchestrator
 *         + ausência de classificação real / IA / ML / chamadas externas
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ADAPTER_ID,
  DefaultDocumentClassificationRuntimeAdapter,
  IN_MEMORY_DOCUMENT_CLASSIFICATION_RUNTIME_STORE_ID,
  InMemoryDocumentClassificationRuntimeStore,
  MOCK_DOCUMENT_CLASSIFICATION_RUNTIME_ADAPTER_ID,
  MockDocumentClassificationRuntimeAdapter,
  DocumentClassificationRuntimeFactory,
  STRUCTURAL_DOCUMENT_CLASSIFICATION_PROVIDER_REFERENCES,
  createDocumentClassificationRuntimeFactory,
  createDocumentClassificationRuntimePort,
  createDocumentClassificationRuntimeSessionId,
  getDocumentClassificationRuntimeHealthSummary,
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

describe("DIP-04 DocumentClassificationRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy sem classificação real", async () => {
    const port: DocumentClassificationRuntimePort = new MockDocumentClassificationRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.realClassificationAvailable, false);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_DOCUMENT_CLASSIFICATION_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsCoordinateClassification, true);
    assert.equal(caps.implementsRealClassification, false);
    assert.equal(caps.implementsAi, false);
    assert.equal(caps.implementsLlm, false);
  });

  it("default adapter exige enterpriseDeps (sem implementação paralela)", () => {
    assert.throws(
      () =>
        // @ts-expect-error — enterpriseDeps obrigatório
        new DefaultDocumentClassificationRuntimeAdapter({}),
      /enterpriseDeps/,
    );
  });

  it("default adapter coordena via Orchestrator + OCR Runtime (sem classificação real)", async () => {
    resetAllDocumentClassificationRuntimeIdSequences();
    const { deps, orchestratorPort, ocrRuntimePort } = enterpriseDeps();
    const port = new DefaultDocumentClassificationRuntimeAdapter({ enterpriseDeps: deps });

    assert.equal(port.providerId, "default");
    assert.equal(port.capabilities().adapterId, DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ADAPTER_ID);
    assert.equal(port.capabilities().usesCanonicalExecutionOrchestrator, true);
    assert.equal(port.capabilities().usesOCRRuntime, true);
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

  it("InMemoryDocumentClassificationRuntimeStore persiste sessões", () => {
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
    assert.equal(store.listSessions().length, 1);
    assert.equal(store.removeSession("sess-store-1"), true);
    assert.equal(store.sessionCount(), 0);
  });

  it("Factory e Provider resolvem default / mock / test", () => {
    const { deps } = enterpriseDeps();
    const factory = createDocumentClassificationRuntimeFactory({ enterpriseDeps: deps });
    assert.ok(factory instanceof DocumentClassificationRuntimeFactory);

    const defaultPort = factory.create({ provider: "default" });
    assert.equal(defaultPort.providerId, "default");

    const mockPort = createDocumentClassificationRuntimePort({ provider: "mock" });
    assert.equal(mockPort.providerId, "mock");

    const testPort = createDocumentClassificationRuntimePort({
      provider: "test",
      enterpriseDeps: deps,
    });
    assert.equal(testPort.providerId, "test");

    assert.throws(
      () => createDocumentClassificationRuntimePort({ provider: "default" }),
      /enterpriseDeps/,
    );
  });

  it("Provider desconhecido não existe — ids restritos a default|mock|test", () => {
    const factory = createDocumentClassificationRuntimeFactory();
    assert.throws(
      () =>
        factory.create({
          // @ts-expect-error — provider inválido
          provider: "ai-classifier",
        }),
      /desconhecido|exige enterpriseDeps/,
    );
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createDocumentClassificationRuntimePort({ provider: "mock" });
    const summary = await getDocumentClassificationRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.health.realClassificationAvailable, false);
    assert.equal(summary.capabilities.supportsCoordinateClassification, true);
    assert.equal(summary.capabilities.implementsRealClassification, false);
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

  it("createDocumentClassificationRuntimeSessionId é determinístico após reset", () => {
    resetAllDocumentClassificationRuntimeIdSequences();
    assert.equal(createDocumentClassificationRuntimeSessionId(), "dip-classification-session-1");
    assert.equal(createDocumentClassificationRuntimeSessionId(), "dip-classification-session-2");
    resetAllDocumentClassificationRuntimeIdSequences();
    assert.equal(createDocumentClassificationRuntimeSessionId(), "dip-classification-session-1");
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
});

describe("DIP-04 integração Enterprise / Capture / OCR / Orchestrator", () => {
  it("Enterprise Runtime expõe DocumentClassificationRuntimePort", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const classificationRuntime = runtime.getDocumentClassificationRuntimePort();
    assert.ok(classificationRuntime);
    assert.equal(classificationRuntime.providerId, "default");

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.documentClassificationRuntimeOk, true);
    assert.equal(health.ocrRuntimeOk, true);
    assert.equal(health.captureEngineRuntimeOk, true);
    assert.equal(health.orchestratorOk, true);

    const classificationHealth = await classificationRuntime.health();
    assert.equal(classificationHealth.realClassificationAvailable, true);
    assert.equal(health.documentClassificationProviderOk, true);
    assert.equal(runtime.getDocumentClassificationProviderPort().providerId, "rule-based");
  });

  it("fluxo captura passa pelo Classification Runtime (coordenação; classify via ProviderPort)", async () => {
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

  it("produto não instancia Adapter Classification diretamente", () => {
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const keys = Object.keys(runtime);
    assert.ok(!keys.some((k) => /adapter/i.test(k)));
    assert.equal(typeof runtime.getDocumentClassificationRuntimePort, "function");
    assert.equal(typeof runtime.getOCRRuntimePort, "function");
    assert.equal(typeof runtime.getCaptureEngineRuntimePort, "function");
    assert.equal(typeof runtime.registerCaptureDocumentIntake, "function");
  });
});

describe("DIP-04 / CLASS-01 ausência de IA / ML / bypass no Classification Runtime", () => {
  it("fonte do módulo Classification Runtime não contém IA/ML/HTTP nem bypass de Provider", () => {
    const moduleDir = join(repoRoot, "src/lib/enterprise/document-classification-runtime");
    const files = [
      "adapters/default-document-classification-runtime-adapter.ts",
      "adapters/mock-document-classification-runtime-adapter.ts",
      "factory/document-classification-runtime-factory.ts",
      "providers/create-document-classification-runtime-port.ts",
      "ports/document-classification-runtime-port.ts",
      "ports/types.ts",
      "ports/models.ts",
      "index.ts",
    ];

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
      /fetch\s*\(/,
      /https?:\/\//,
      /documentintelligence\.azure\.com/i,
      /vision\.googleapis\.com/i,
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
      join(moduleDir, "adapters/default-document-classification-runtime-adapter.ts"),
      "utf8",
    );
    assert.match(defaultAdapter, /DocumentClassificationProviderPort/);
    assert.match(defaultAdapter, /classificationProvider\.classify/);
    assert.equal(/\.predict\s*\(/.test(defaultAdapter), false);
  });

  it("coordinateClassification não executa classify (realClassificationExecuted=false)", async () => {
    const { deps } = enterpriseDeps();
    const port = createDocumentClassificationRuntimePort({
      provider: "default",
      enterpriseDeps: deps,
    });
    const result = await port.coordinateClassification(sampleRequest());
    assert.equal(result.ok, true);
    assert.equal(result.realClassificationExecuted, false);
    assert.equal(result.session?.realClassificationExecuted, false);
    assert.equal(result.documentType, undefined);
    assert.equal(result.confidence, undefined);
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

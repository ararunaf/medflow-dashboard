#!/usr/bin/env node
/**
 * DIP-06 — Document Search Runtime
 * Prova: Runtime → Port → Adapter → Store → Factory → Provider
 *         + Enterprise Runtime + Capture Runtime + OCR Runtime
 *         + Document Classification Runtime + Storage Manager Runtime + Orchestrator
 *         + ausência de busca real / indexação / chamadas externas
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_DOCUMENT_SEARCH_RUNTIME_ADAPTER_ID,
  DefaultDocumentSearchRuntimeAdapter,
  IN_MEMORY_DOCUMENT_SEARCH_RUNTIME_STORE_ID,
  InMemoryDocumentSearchRuntimeStore,
  MOCK_DOCUMENT_SEARCH_RUNTIME_ADAPTER_ID,
  MockDocumentSearchRuntimeAdapter,
  DocumentSearchRuntimeFactory,
  STRUCTURAL_SEARCH_PROVIDER_REFERENCES,
  createDocumentSearchRuntimeFactory,
  createDocumentSearchRuntimePort,
  createDocumentSearchRuntimeSessionId,
  getDocumentSearchRuntimeHealthSummary,
  resetAllDocumentSearchRuntimeIdSequences,
  type CanonicalSearchRequest,
  type DocumentSearchRuntimePort,
} from "../../../src/lib/enterprise/document-search-runtime/index.ts";
import { createOCRProviderPort } from "../../../src/lib/enterprise/ocr-provider/index.ts";
import { createOCRRuntimePort } from "../../../src/lib/enterprise/ocr-runtime/index.ts";
import { createDocumentClassificationProviderPort } from "../../../src/lib/enterprise/document-classification-provider/index.ts";
import { createDocumentClassificationRuntimePort } from "../../../src/lib/enterprise/document-classification-runtime/index.ts";
import { createStorageManagerRuntimePort } from "../../../src/lib/enterprise/storage-manager-runtime/index.ts";
import { createStorageProviderPort } from "../../../src/lib/enterprise/storage-provider/index.ts";
import { createSearchProviderPort } from "../../../src/lib/enterprise/search-provider/index.ts";
import { createCanonicalExecutionOrchestratorPort } from "../../../src/lib/enterprise/canonical-execution-orchestrator/index.ts";
import {
  createEnterpriseRuntime,
  resetEnterpriseRuntimeForTests,
} from "../../../src/lib/enterprise/runtime/index.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../../..");

function sampleRequest(overrides: Partial<CanonicalSearchRequest> = {}): CanonicalSearchRequest {
  return {
    kind: "canonical-search-request",
    identity: {
      kind: "canonical-search-identity",
      documentId: "doc-dip-06",
      documentKind: "capture-document",
    },
    metadata: {
      kind: "canonical-search-metadata",
      sessionId: "sess-dip-06",
      tenantRef: "tenant-1",
      correlationId: "corr-dip-06",
      channel: "file_upload",
      tags: ["dip-06"],
    },
    reference: {
      kind: "canonical-search-reference",
      storageKey: "tenant/sess-dip-06/original.pdf",
      storageContainer: "clinical-documents",
      storageProvider: "product-capture",
      metadataId: "sess-dip-06",
      metadataNamespace: "product.capture",
      captureRuntimeSessionId: "dip-capture-session-1",
      ocrRuntimeSessionId: "dip-ocr-session-1",
      classificationRuntimeSessionId: "dip-classification-session-1",
      storageManagerRuntimeSessionId: "dip-storage-session-1",
      providerReferenceId: "mock-search",
    },
    capabilities: {
      kind: "canonical-search-capabilities",
      supportsKeywordSearch: false,
      supportsMetadataSearch: false,
      supportsFullTextSearch: false,
      supportsSemanticSearch: false,
      supportsVectorSearch: false,
      supportsBatchSearch: false,
      supportsRanking: false,
      supportsFacetedSearch: false,
      declared: ["document-search-runtime"],
    },
    configuration: {
      kind: "canonical-search-configuration",
      preferredProviderReference: "mock-search",
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
  const documentClassificationRuntimePort = createDocumentClassificationRuntimePort({
    provider: "default",
    enterpriseDeps: {
      getOrchestratorPort: () => orchestratorPort,
      getOCRRuntimePort: () => ocrRuntimePort,
      getDocumentClassificationProviderPort: () => documentClassificationProviderPort,
    },
  });
  const storageProviderPort = createStorageProviderPort({ provider: "mock" });
  const storageManagerRuntimePort = createStorageManagerRuntimePort({
    provider: "default",
    enterpriseDeps: {
      getOrchestratorPort: () => orchestratorPort,
      getDocumentClassificationRuntimePort: () => documentClassificationRuntimePort,
      getStorageProviderPort: () => storageProviderPort,
    },
  });
  const searchProviderPort = createSearchProviderPort({
    provider: "storage-backed",
    storageProviderPort,
  });
  return {
    orchestratorPort,
    ocrRuntimePort,
    documentClassificationRuntimePort,
    storageManagerRuntimePort,
    searchProviderPort,
    deps: {
      getOrchestratorPort: () => orchestratorPort,
      getStorageManagerRuntimePort: () => storageManagerRuntimePort,
      getSearchProviderPort: () => searchProviderPort,
    },
  };
}

function assertNoRealSearchCapabilities(
  caps: ReturnType<DocumentSearchRuntimePort["capabilities"]>,
) {
  assert.equal(caps.supportsKeywordSearch, false);
  assert.equal(caps.supportsMetadataSearch, false);
  assert.equal(caps.supportsFullTextSearch, false);
  assert.equal(caps.supportsSemanticSearch, false);
  assert.equal(caps.supportsVectorSearch, false);
  assert.equal(caps.supportsBatchSearch, false);
  assert.equal(caps.supportsRanking, false);
  assert.equal(caps.supportsFacetedSearch, false);
  assert.equal(caps.implementsRealSearch, false);
  assert.equal(caps.implementsIndexing, false);
  assert.equal(caps.implementsVectorSearch, false);
  assert.equal(caps.implementsEmbeddings, false);
  assert.equal(caps.implementsRAG, false);
  assert.equal(caps.implementsAI, false);
  assert.equal(caps.implementsExternalProviderCall, false);
}

describe("DIP-06 DocumentSearchRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy sem busca real", async () => {
    const port: DocumentSearchRuntimePort = new MockDocumentSearchRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.realSearchAvailable, false);
    assert.equal(health.realIndexingAvailable, false);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_DOCUMENT_SEARCH_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsCoordinateSearch, true);
    assertNoRealSearchCapabilities(caps);
  });

  it("default adapter exige enterpriseDeps (sem implementação paralela)", () => {
    assert.throws(
      () =>
        // @ts-expect-error — enterpriseDeps obrigatório
        new DefaultDocumentSearchRuntimeAdapter({}),
      /enterpriseDeps/,
    );
  });

  it("default adapter coordena via Orchestrator + Storage Manager + SearchProviderPort", async () => {
    resetAllDocumentSearchRuntimeIdSequences();
    const { deps, orchestratorPort, storageManagerRuntimePort } = enterpriseDeps();
    const port = new DefaultDocumentSearchRuntimeAdapter({ enterpriseDeps: deps });

    assert.equal(port.providerId, "default");
    assert.equal(port.capabilities().adapterId, DEFAULT_DOCUMENT_SEARCH_RUNTIME_ADAPTER_ID);
    assert.equal(port.capabilities().usesCanonicalExecutionOrchestrator, true);
    assert.equal(port.capabilities().usesStorageManagerRuntime, true);
    assert.equal(port.capabilities().usesDocumentClassificationRuntime, true);
    assert.equal(port.capabilities().usesOCRRuntime, true);
    assert.equal(port.capabilities().usesCaptureEngineRuntime, true);
    assert.equal(port.capabilities().usesSearchProviderAdapter, true);
    assert.equal(port.capabilities().implementsRealSearch, true);
    assert.equal(port.capabilities().supportsSearch, true);
    assert.equal(port.capabilities().implementsExternalProviderCall, false);
    assert.equal(port.capabilities().supportsSemanticSearch, false);
    assert.equal(port.capabilities().supportsVectorSearch, false);

    const result = await port.coordinateSearch(sampleRequest());
    assert.equal(result.ok, true);
    assert.ok(result.runtimeSessionId);
    assert.ok(result.executionId);
    assert.equal(result.realSearchExecuted, false);
    assert.equal(result.realIndexingExecuted, false);
    assert.equal(result.session?.status, "coordinated");
    assert.equal(result.session?.realSearchExecuted, false);
    assert.equal(result.session?.realIndexingExecuted, false);
    assert.equal(result.providerReferenceId, "mock-search");
    assert.ok(result.session?.searchProviderAdapterId);

    const storedExec = await orchestratorPort.getExecution({
      executionId: result.executionId!,
    });
    assert.equal(storedExec.ok, true);

    const storageHealth = await storageManagerRuntimePort.health();
    assert.equal(storageHealth.ok, true);

    const session = await port.getSession({ runtimeSessionId: result.runtimeSessionId! });
    assert.equal(session.ok, true);
    assert.equal(session.session?.executionId, result.executionId);
  });

  it("InMemoryDocumentSearchRuntimeStore persiste sessões", () => {
    const store = new InMemoryDocumentSearchRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_DOCUMENT_SEARCH_RUNTIME_STORE_ID);
    assert.equal(store.health().ok, true);

    const stamp = new Date().toISOString();
    store.setSession({
      kind: "canonical-search-session",
      runtimeSessionId: "sess-store-1",
      status: "coordinated",
      request: sampleRequest(),
      createdAt: stamp,
      updatedAt: stamp,
      realSearchExecuted: false,
      realIndexingExecuted: false,
    });
    assert.equal(store.sessionCount(), 1);
    assert.equal(store.getSession("sess-store-1")?.status, "coordinated");
    assert.equal(store.listSessions().length, 1);
    assert.equal(store.removeSession("sess-store-1"), true);
    assert.equal(store.sessionCount(), 0);
  });

  it("Factory e Provider resolvem default / mock / test", () => {
    const { deps } = enterpriseDeps();
    const factory = createDocumentSearchRuntimeFactory({ enterpriseDeps: deps });
    assert.ok(factory instanceof DocumentSearchRuntimeFactory);

    const defaultPort = factory.create({ provider: "default" });
    assert.equal(defaultPort.providerId, "default");

    const mockPort = createDocumentSearchRuntimePort({ provider: "mock" });
    assert.equal(mockPort.providerId, "mock");

    const testPort = createDocumentSearchRuntimePort({
      provider: "test",
      enterpriseDeps: deps,
    });
    assert.equal(testPort.providerId, "test");

    assert.throws(() => createDocumentSearchRuntimePort({ provider: "default" }), /enterpriseDeps/);
  });

  it("Provider desconhecido não existe — ids restritos a default|mock|test", () => {
    const factory = createDocumentSearchRuntimeFactory();
    assert.throws(
      () =>
        factory.create({
          // @ts-expect-error — provider inválido
          provider: "elasticsearch",
        }),
      /desconhecido|exige enterpriseDeps/,
    );
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createDocumentSearchRuntimePort({ provider: "mock" });
    const summary = await getDocumentSearchRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.health.realSearchAvailable, false);
    assert.equal(summary.health.realIndexingAvailable, false);
    assert.equal(summary.capabilities.supportsCoordinateSearch, true);
    assertNoRealSearchCapabilities(summary.capabilities);
  });

  it("coordinateSearch rejeita input inválido", async () => {
    const { deps } = enterpriseDeps();
    const port = createDocumentSearchRuntimePort({
      provider: "default",
      enterpriseDeps: deps,
    });
    const result = await port.coordinateSearch(
      sampleRequest({
        identity: {
          kind: "canonical-search-identity",
          documentId: "",
        },
        metadata: {
          kind: "canonical-search-metadata",
          sessionId: "",
        },
      }),
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, "INVALID_INPUT");
    assert.equal(result.realSearchExecuted, false);
    assert.equal(result.realIndexingExecuted, false);
  });

  it("createDocumentSearchRuntimeSessionId é determinístico após reset", () => {
    resetAllDocumentSearchRuntimeIdSequences();
    assert.equal(createDocumentSearchRuntimeSessionId(), "dip-search-session-1");
    assert.equal(createDocumentSearchRuntimeSessionId(), "dip-search-session-2");
    resetAllDocumentSearchRuntimeIdSequences();
    assert.equal(createDocumentSearchRuntimeSessionId(), "dip-search-session-1");
  });

  it("lista referências estruturais de Search Providers sem conexão", async () => {
    const port = createDocumentSearchRuntimePort({ provider: "mock" });
    const refs = await port.listProviderReferences();
    assert.equal(refs.ok, true);
    assert.equal(refs.references.length, STRUCTURAL_SEARCH_PROVIDER_REFERENCES.length);
    const ids = refs.references.map((r) => r.providerReferenceId).sort();
    assert.deepEqual(ids, [
      "azure-ai-search",
      "elasticsearch",
      "mock-search",
      "opensearch",
      "postgresql-fts",
      "vector-database",
    ]);
    for (const ref of refs.references) {
      assert.equal(ref.connected, false);
      assert.equal(ref.implementsRealSearch, false);
      assert.equal(ref.implementsIndexing, false);
      assert.equal(ref.implementsKeywordSearch, false);
      assert.equal(ref.implementsFullTextSearch, false);
      assert.equal(ref.implementsVectorSearch, false);
      assert.equal(ref.implementsSemanticSearch, false);
      assert.equal(ref.status, "structural-reference-only");
    }
  });
});

describe("DIP-06 integração Enterprise / Capture / OCR / Classification / Storage / Orchestrator", () => {
  it("Enterprise Runtime expõe DocumentSearchRuntimePort", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const documentSearchRuntime = runtime.getDocumentSearchRuntimePort();
    assert.ok(documentSearchRuntime);
    assert.equal(documentSearchRuntime.providerId, "default");

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.documentSearchRuntimeOk, true);
    assert.equal(health.storageManagerRuntimeOk, true);
    assert.equal(health.documentClassificationRuntimeOk, true);
    assert.equal(health.ocrRuntimeOk, true);
    assert.equal(health.captureEngineRuntimeOk, true);
    assert.equal(health.orchestratorOk, true);

    const searchHealth = await documentSearchRuntime.health();
    assert.equal(searchHealth.realSearchAvailable, true);
    assert.equal(searchHealth.realIndexingAvailable, true);
    assert.equal(health.searchProviderOk, true);
  });

  it("fluxo captura passa pelo Document Search Runtime (coordenação; busca via search())", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });

    const result = await runtime.registerCaptureDocumentIntake({
      sessionId: "sess-arch-dip-06",
      documentId: "doc-arch-dip-06",
      storagePath: "tenant/sess-arch-dip-06/original.pdf",
      tenantRef: "tenant-1",
      correlationId: "corr-arch-dip-06",
      channel: "file_upload",
    });

    assert.equal(result.ok, true);
    assert.ok(result.intakeId);
    assert.ok(result.executionId);
    assert.ok(result.runtimeSessionId);
    assert.ok(result.ocrRuntimeSessionId);
    assert.ok(result.classificationRuntimeSessionId);
    assert.ok(result.storageManagerRuntimeSessionId);
    assert.ok(result.documentSearchRuntimeSessionId);

    const captureSession = await runtime.getCaptureEngineRuntimePort().getSession({
      runtimeSessionId: result.runtimeSessionId!,
    });
    assert.equal(captureSession.ok, true);
    assert.equal(captureSession.session?.status, "registered");
    assert.equal(
      captureSession.session?.documentSearchRuntimeSessionId,
      result.documentSearchRuntimeSessionId,
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

    const storageSession = await runtime.getStorageManagerRuntimePort().getSession({
      runtimeSessionId: result.storageManagerRuntimeSessionId!,
    });
    assert.equal(storageSession.ok, true);
    assert.equal(storageSession.session?.status, "coordinated");
    assert.equal(storageSession.session?.realStorageExecuted, false);

    const searchSession = await runtime.getDocumentSearchRuntimePort().getSession({
      runtimeSessionId: result.documentSearchRuntimeSessionId!,
    });
    assert.equal(searchSession.ok, true);
    assert.equal(searchSession.session?.status, "coordinated");
    assert.equal(searchSession.session?.realSearchExecuted, false);
    assert.equal(searchSession.session?.realIndexingExecuted, false);

    const searchExec = await runtime.getOrchestratorPort().getExecution({
      executionId: searchSession.session!.executionId!,
    });
    assert.equal(searchExec.ok, true);

    assert.equal(runtime.getDocumentSearchRuntimePort().capabilities().implementsRealSearch, true);
    assert.equal(runtime.getCaptureEngineRuntimePort().capabilities().implementsSearch, false);
    assert.equal(
      runtime.getCaptureEngineRuntimePort().capabilities().usesDocumentSearchRuntime,
      true,
    );
    assert.equal(
      runtime.getCaptureEngineRuntimePort().capabilities().usesStorageManagerRuntime,
      true,
    );
    assert.equal(
      runtime.getCaptureEngineRuntimePort().capabilities().usesDocumentClassificationRuntime,
      true,
    );
    assert.equal(runtime.getCaptureEngineRuntimePort().capabilities().usesOCRRuntime, true);
  });

  it("produto não instancia Adapter Search diretamente", () => {
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const keys = Object.keys(runtime);
    assert.ok(!keys.some((k) => /adapter/i.test(k)));
    assert.equal(typeof runtime.getDocumentSearchRuntimePort, "function");
    assert.equal(typeof runtime.getStorageManagerRuntimePort, "function");
    assert.equal(typeof runtime.getDocumentClassificationRuntimePort, "function");
    assert.equal(typeof runtime.getOCRRuntimePort, "function");
    assert.equal(typeof runtime.getCaptureEngineRuntimePort, "function");
    assert.equal(typeof runtime.registerCaptureDocumentIntake, "function");
  });
});

describe("DIP-06 / SEARCH-01 — sem motores externos; busca só via SearchProviderPort", () => {
  it("fonte do módulo Document Search Runtime não contém motores externos nem HTTP", () => {
    const moduleDir = join(repoRoot, "src/lib/enterprise/document-search-runtime");
    const files = [
      "adapters/default-document-search-runtime-adapter.ts",
      "adapters/mock-document-search-runtime-adapter.ts",
      "factory/document-search-runtime-factory.ts",
      "providers/create-document-search-runtime-port.ts",
      "ports/document-search-runtime-port.ts",
      "ports/types.ts",
      "ports/models.ts",
      "index.ts",
    ];

    const forbidden = [
      /from ["']@elastic\/elasticsearch/i,
      /from ["']@opensearch-project\/opensearch/i,
      /from ["']@azure\/search-documents/i,
      /\.bulk\s*\(/,
      /createIndex\s*\(/,
      /vectorSearch\s*\(/i,
      /fetch\s*\(/,
      /https?:\/\//,
      /elasticsearch\.com/i,
      /opensearch\.org/i,
      /search\.windows\.net/i,
      /storage\.from\s*\(/,
      /from ["']@supabase/i,
    ];

    for (const rel of files) {
      const source = readFileSync(join(moduleDir, rel), "utf8");
      const codeWithoutComments = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
      for (const pattern of forbidden) {
        assert.equal(
          pattern.test(codeWithoutComments),
          false,
          `Padrão proibido ${pattern} encontrado em ${rel}`,
        );
      }
    }

    const defaultAdapter = readFileSync(
      join(moduleDir, "adapters/default-document-search-runtime-adapter.ts"),
      "utf8",
    );
    assert.match(defaultAdapter, /getSearchProviderPort/);
    assert.match(defaultAdapter, /searchProvider\.search/);
    assert.equal(/from ["']@elastic/.test(defaultAdapter), false);
    assert.equal(/createSearchProviderPort/.test(defaultAdapter), false);
  });

  it("coordinateSearch não produz hits, scores, embeddings nem índices", async () => {
    const { deps } = enterpriseDeps();
    const port = createDocumentSearchRuntimePort({
      provider: "default",
      enterpriseDeps: deps,
    });
    const result = await port.coordinateSearch(sampleRequest());
    assert.equal(result.ok, true);
    const sessionJson = JSON.stringify(result.session);
    assert.equal(/"hits"\s*:/i.test(sessionJson), false);
    assert.equal(/"score"\s*:/i.test(sessionJson), false);
    assert.equal(/"embedding"\s*:/i.test(sessionJson), false);
    assert.equal(/"vector"\s*:/i.test(sessionJson), false);
    assert.equal(/"indexedDocuments"\s*:/i.test(sessionJson), false);
    assert.equal(result.realSearchExecuted, false);
    assert.equal(result.realIndexingExecuted, false);
    assert.equal(result.session?.realSearchExecuted, false);
    assert.equal(result.session?.realIndexingExecuted, false);
  });
});

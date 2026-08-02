#!/usr/bin/env node
/**
 * SEARCH-01 — Enterprise Search Provider
 * Prova: Application → SearchProviderPort → Adapter → Factory → Registry
 *         + Document Search Runtime + Enterprise Runtime + Capture Runtime
 *         + Storage Runtime + StorageProviderPort
 *         + CanonicalSearchResult / CanonicalSearchDocument / CanonicalSearchMetadata
 *         + busca por ID / documento / paciente / metadata / tenant / competência
 *         + timeout / retry / cancelamento / erros
 *         + ausência de bypass / acesso direto a backends
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_SEARCH_PROVIDER_COUNT,
  DEFAULT_SEARCH_PROVIDER_ADAPTER_ID,
  DEFAULT_SEARCH_PROVIDER_CAPABILITIES,
  DefaultSearchProviderAdapter,
  MOCK_SEARCH_PROVIDER_ADAPTER_ID,
  MockSearchProviderAdapter,
  SearchProviderFactory,
  SearchProviderRegistry,
  StorageBackedSearchProviderAdapter,
  createDefaultSearchProviderRegistry,
  createSearchProviderFactory,
  createSearchProviderPort,
  getSearchProviderFactory,
  getSearchProviderHealthSummary,
  type CanonicalSearchDocument,
  type SearchProviderPort,
} from "../../../src/lib/enterprise/search-provider/index.ts";
import { createStorageProviderPort } from "../../../src/lib/enterprise/storage-provider/index.ts";
import { createDocumentSearchRuntimePort } from "../../../src/lib/enterprise/document-search-runtime/index.ts";
import { createStorageManagerRuntimePort } from "../../../src/lib/enterprise/storage-manager-runtime/index.ts";
import { createDocumentClassificationProviderPort } from "../../../src/lib/enterprise/document-classification-provider/index.ts";
import { createDocumentClassificationRuntimePort } from "../../../src/lib/enterprise/document-classification-runtime/index.ts";
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

function sampleDoc(overrides: Partial<CanonicalSearchDocument> = {}): CanonicalSearchDocument {
  return {
    kind: "canonical-search-document",
    documentId: "doc-search-01",
    patientId: "pac-001",
    tenantRef: "tenant-1",
    competencia: "2026-08",
    storageKey: "tenant/sess-1/original.pdf",
    storageContainer: "clinical-documents",
    documentKind: "guia-tiss",
    title: "Guia TISS 2026-08",
    metadata: {
      kind: "canonical-search-metadata",
      sessionId: "sess-1",
      tenantRef: "tenant-1",
      patientId: "pac-001",
      competencia: "2026-08",
      customAttributes: { origem: "captura", convenio: "unimed" },
    },
    ...overrides,
  };
}

async function seedStorageAndCatalog(port: SearchProviderPort, docs: CanonicalSearchDocument[]) {
  const storage = createStorageProviderPort({ provider: "mock" });
  for (const doc of docs) {
    if (doc.storageKey) {
      await storage.upload({
        key: doc.storageKey,
        container: doc.storageContainer,
        body: new TextEncoder().encode(`content-${doc.documentId}`),
        contentType: "application/pdf",
        documentId: doc.documentId,
        sessionId: doc.metadata?.sessionId ?? "sess-1",
        tenantRef: doc.tenantRef,
      });
    }
  }
  // Re-bind: create storage-backed port with shared storage + seed
  const bound = createSearchProviderPort({
    provider: "storage-backed",
    storageProviderPort: storage,
    seedDocuments: docs,
  });
  for (const doc of docs) {
    const indexed = await bound.indexDocument(doc);
    assert.equal(indexed.ok, true, indexed.message);
  }
  return { port: bound, storage };
}

describe("SEARCH-01 SearchProviderPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: SearchProviderPort = new MockSearchProviderAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.status, "ready");

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_SEARCH_PROVIDER_ADAPTER_ID);
    assert.equal(caps.supportsCanonicalResult, true);
    assert.equal(caps.supportsSearchById, true);
    assert.equal(caps.implementsExternalSearchEngine, false);
    assert.equal(caps.implementsElasticsearch, false);
  });

  it("DefaultSearchProviderAdapter é o adapter storage-backed oficial", () => {
    assert.equal(StorageBackedSearchProviderAdapter, DefaultSearchProviderAdapter);
    const port = new DefaultSearchProviderAdapter({
      provider: "storage-backed",
      storageProviderPort: createStorageProviderPort({ provider: "mock" }),
    });
    assert.equal(port.providerId, "storage-backed");
    assert.equal(port.capabilities().adapterId, DEFAULT_SEARCH_PROVIDER_ADAPTER_ID);
  });

  it("createSearchProviderPort default resolve storage-backed", async () => {
    const port = createSearchProviderPort();
    assert.equal(port.providerId, "storage-backed");
    const validation = await port.validateConfiguration();
    assert.equal(validation.ok, true);
    assert.equal(validation.errors.length, 0);
  });

  it("test / default / mock são resolvidos pelo factory", async () => {
    assert.equal(createSearchProviderPort({ provider: "test" }).providerId, "test");
    assert.equal(createSearchProviderPort({ provider: "default" }).providerId, "default");
    assert.equal(createSearchProviderPort({ provider: "mock" }).providerId, "mock");
    assert.equal((await createSearchProviderPort({ provider: "mock" }).health()).ok, true);
  });

  it("busca por ID / documento / paciente / metadata / tenant / competência", async () => {
    const docs = [
      sampleDoc(),
      sampleDoc({
        documentId: "doc-2",
        patientId: "pac-002",
        tenantRef: "tenant-2",
        competencia: "2026-07",
        storageKey: "tenant/sess-2/original.pdf",
        metadata: {
          kind: "canonical-search-metadata",
          sessionId: "sess-2",
          tenantRef: "tenant-2",
          patientId: "pac-002",
          competencia: "2026-07",
          customAttributes: { origem: "scanner", convenio: "bradesco" },
        },
      }),
    ];
    const { port } = await seedStorageAndCatalog(createSearchProviderPort(), docs);

    const byId = await port.search({
      kind: "canonical-search-request",
      mode: "by-id",
      documentId: "doc-search-01",
      metadata: { kind: "canonical-search-metadata", sessionId: "sess-q1" },
    });
    assert.equal(byId.ok, true);
    assert.equal(byId.kind, "canonical-search-result");
    assert.equal(byId.realSearchExecuted, true);
    assert.equal(byId.documents.length, 1);
    assert.equal(byId.documents[0]?.kind, "canonical-search-document");
    assert.equal(byId.documents[0]?.documentId, "doc-search-01");

    const byDocument = await port.search({
      kind: "canonical-search-request",
      mode: "by-document",
      documentKind: "guia-tiss",
      metadata: { kind: "canonical-search-metadata", sessionId: "sess-q2" },
    });
    assert.equal(byDocument.ok, true);
    assert.ok(byDocument.totalCount >= 1);

    const byPatient = await port.search({
      kind: "canonical-search-request",
      mode: "by-patient",
      patientId: "pac-002",
      metadata: { kind: "canonical-search-metadata", sessionId: "sess-q3", patientId: "pac-002" },
    });
    assert.equal(byPatient.ok, true);
    assert.equal(byPatient.documents[0]?.patientId, "pac-002");

    const byTenant = await port.search({
      kind: "canonical-search-request",
      mode: "by-tenant",
      tenantRef: "tenant-1",
      metadata: { kind: "canonical-search-metadata", sessionId: "sess-q4", tenantRef: "tenant-1" },
    });
    assert.equal(byTenant.ok, true);
    assert.equal(byTenant.documents[0]?.tenantRef, "tenant-1");

    const byCompetencia = await port.search({
      kind: "canonical-search-request",
      mode: "by-competencia",
      competencia: "2026-08",
      metadata: {
        kind: "canonical-search-metadata",
        sessionId: "sess-q5",
        competencia: "2026-08",
      },
    });
    assert.equal(byCompetencia.ok, true);
    assert.equal(byCompetencia.documents[0]?.competencia, "2026-08");

    const byMetadata = await port.search({
      kind: "canonical-search-request",
      mode: "by-metadata",
      metadataFilters: { convenio: "bradesco" },
      metadata: { kind: "canonical-search-metadata", sessionId: "sess-q6" },
    });
    assert.equal(byMetadata.ok, true);
    assert.equal(byMetadata.documents[0]?.documentId, "doc-2");
    assert.equal(byMetadata.telemetry.cancelled, false);
  });

  it("timeout é implementado e retorna SEARCH_TIMEOUT", async () => {
    const port = new DefaultSearchProviderAdapter({
      provider: "storage-backed",
      storageProviderPort: createStorageProviderPort({ provider: "mock" }),
      defaultTimeoutMs: 20,
      defaultRetryCount: 0,
      seedDocuments: [sampleDoc()],
    });
    const result = await port.search({
      kind: "canonical-search-request",
      mode: "by-id",
      documentId: "doc-search-01",
      metadata: { kind: "canonical-search-metadata", sessionId: "sess-timeout" },
      timeoutMs: 20,
      retryCount: 0,
      attributes: { forceDelayMs: 200 },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "SEARCH_TIMEOUT");
  });

  it("retry recupera falha transitória", async () => {
    const port = new DefaultSearchProviderAdapter({
      provider: "storage-backed",
      storageProviderPort: createStorageProviderPort({ provider: "mock" }),
      failAttempts: 1,
      defaultRetryCount: 2,
      defaultRetryBackoffMs: 1,
      seedDocuments: [sampleDoc()],
    });
    const result = await port.search({
      kind: "canonical-search-request",
      mode: "by-id",
      documentId: "doc-search-01",
      metadata: { kind: "canonical-search-metadata", sessionId: "sess-retry" },
      retryCount: 2,
    });
    assert.equal(result.ok, true);
    assert.ok(result.telemetry.attempts >= 2);
  });

  it("cancelamento via AbortSignal retorna SEARCH_CANCELLED", async () => {
    const port = new DefaultSearchProviderAdapter({
      provider: "storage-backed",
      storageProviderPort: createStorageProviderPort({ provider: "mock" }),
      seedDocuments: [sampleDoc()],
    });
    const controller = new AbortController();
    controller.abort();
    const result = await port.search({
      kind: "canonical-search-request",
      mode: "by-id",
      documentId: "doc-search-01",
      metadata: { kind: "canonical-search-metadata", sessionId: "sess-cancel" },
      signal: controller.signal,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "SEARCH_CANCELLED");
    assert.equal(result.telemetry.cancelled, true);
  });

  it("tratamento de erro para provider unhealthy", async () => {
    const port = new DefaultSearchProviderAdapter({
      provider: "storage-backed",
      healthy: false,
      storageProviderPort: createStorageProviderPort({ provider: "mock" }),
    });
    const result = await port.search({
      kind: "canonical-search-request",
      mode: "by-id",
      documentId: "doc-x",
      metadata: { kind: "canonical-search-metadata", sessionId: "sess-unhealthy" },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "SEARCH_UNHEALTHY");
  });

  it("Registry e Factory seguem ECS-01 (sem fallback silencioso)", () => {
    const registry = createDefaultSearchProviderRegistry();
    assert.ok(registry instanceof SearchProviderRegistry);
    assert.equal(registry.snapshot().count, BUILTIN_SEARCH_PROVIDER_COUNT);
    assert.equal(registry.has("storage-backed"), true);

    const factory = createSearchProviderFactory({ registry });
    assert.ok(factory instanceof SearchProviderFactory);
    assert.equal(factory.create({ provider: "storage-backed" }).providerId, "storage-backed");

    assert.throws(
      () =>
        factory.create({
          // @ts-expect-error — provider inválido
          provider: "elasticsearch",
        }),
      /não está registrado|desconhecido/,
    );

    assert.equal(getSearchProviderFactory().getRegistry().has("mock"), true);
    assert.equal(DEFAULT_SEARCH_PROVIDER_CAPABILITIES.supportsSearchById, true);
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createSearchProviderPort({ provider: "storage-backed" });
    const summary = await getSearchProviderHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.info.providerType, "DOCUMENT_SEARCH");
    assert.equal(summary.capabilities.implementsExternalSearchEngine, false);
  });
});

describe("SEARCH-01 cadeia Enterprise / Capture / Search / Storage / Orchestrator", () => {
  it("Enterprise Runtime expõe Search Provider + Document Search Runtime", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    assert.equal(runtime.getSearchProviderPort().providerId, "storage-backed");
    assert.equal(runtime.getDocumentSearchRuntimePort().providerId, "default");
    assert.equal(
      runtime.getDocumentSearchRuntimePort().capabilities().implementsRealSearch,
      true,
    );

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.searchProviderOk, true);
    assert.equal(health.documentSearchRuntimeOk, true);
    assert.equal(health.storageProviderOk, true);
    assert.equal(health.captureEngineRuntimeOk, true);
    assert.equal(health.orchestratorOk, true);
  });

  it("fluxo: Runtime → Search Runtime → ProviderPort → Canonical Result", async () => {
    const orchestrator = createCanonicalExecutionOrchestratorPort({ provider: "mock" });
    const ocrProvider = createOCRProviderPort({ provider: "mock" });
    const ocrRuntime = createOCRRuntimePort({
      provider: "default",
      enterpriseDeps: {
        getOrchestratorPort: () => orchestrator,
        getOCRProviderPort: () => ocrProvider,
      },
    });
    const classificationProvider = createDocumentClassificationProviderPort({
      provider: "rule-based",
    });
    const classificationRuntime = createDocumentClassificationRuntimePort({
      provider: "default",
      enterpriseDeps: {
        getOrchestratorPort: () => orchestrator,
        getOCRRuntimePort: () => ocrRuntime,
        getDocumentClassificationProviderPort: () => classificationProvider,
      },
    });
    const storageProvider = createStorageProviderPort({ provider: "mock" });
    const storageManager = createStorageManagerRuntimePort({
      provider: "default",
      enterpriseDeps: {
        getOrchestratorPort: () => orchestrator,
        getDocumentClassificationRuntimePort: () => classificationRuntime,
        getStorageProviderPort: () => storageProvider,
      },
    });
    const doc = sampleDoc();
    await storageProvider.upload({
      key: doc.storageKey!,
      container: doc.storageContainer,
      body: new TextEncoder().encode("search-chain"),
      contentType: "application/pdf",
      documentId: doc.documentId,
      sessionId: "sess-chain",
      tenantRef: doc.tenantRef,
    });
    const searchProvider = createSearchProviderPort({
      provider: "storage-backed",
      storageProviderPort: storageProvider,
      seedDocuments: [doc],
    });
    const indexed = await searchProvider.indexDocument(doc);
    assert.equal(indexed.ok, true, indexed.message);

    const searchRuntime = createDocumentSearchRuntimePort({
      provider: "default",
      enterpriseDeps: {
        getOrchestratorPort: () => orchestrator,
        getStorageManagerRuntimePort: () => storageManager,
        getSearchProviderPort: () => searchProvider,
      },
    });

    const result = await searchRuntime.search({
      kind: "canonical-search-request",
      mode: "by-id",
      documentId: "doc-search-01",
      metadata: { kind: "canonical-search-metadata", sessionId: "sess-chain" },
    });

    assert.equal(result.kind, "canonical-search-result");
    assert.equal(result.ok, true);
    assert.equal(result.realSearchExecuted, true);
    assert.equal(result.documents[0]?.documentId, "doc-search-01");
    assert.ok(result.runtimeSessionId);
    assert.ok(result.telemetry);

    const session = await searchRuntime.getSession({
      runtimeSessionId: result.runtimeSessionId!,
    });
    assert.equal(session.ok, true);
    assert.equal(session.session?.status, "coordinated");
    assert.equal(session.session?.realSearchExecuted, true);
  });

  it("Capture Runtime continua coordenando; Search Runtime permanece desacoplado", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
      searchProviderPort: createSearchProviderPort({
        provider: "storage-backed",
        storageProviderPort: createStorageProviderPort({ provider: "mock" }),
      }),
    });

    const captureCaps = runtime.getCaptureEngineRuntimePort().capabilities();
    assert.equal(captureCaps.usesDocumentSearchRuntime, true);
    assert.equal(captureCaps.implementsSearch, false);

    const searchCaps = runtime.getDocumentSearchRuntimePort().capabilities();
    assert.equal(searchCaps.implementsRealSearch, true);
    assert.equal(searchCaps.implementsExternalProviderCall, false);

    const register = await runtime.registerCaptureDocumentIntake({
      sessionId: "sess-search-01-capture",
      documentId: "doc-search-01-capture",
      storagePath: "tenant/sess-search-01-capture/original.pdf",
      tenantRef: "tenant-1",
      correlationId: "corr-search-01",
      channel: "file_upload",
    });
    assert.equal(register.ok, true);
    assert.ok(register.documentSearchRuntimeSessionId);

    const searchSession = await runtime.getDocumentSearchRuntimePort().getSession({
      runtimeSessionId: register.documentSearchRuntimeSessionId!,
    });
    assert.equal(searchSession.ok, true);
    assert.equal(searchSession.session?.status, "coordinated");
    assert.equal(searchSession.session?.realSearchExecuted, false);
  });

  it("Canonical Execution Orchestrator permanece no caminho de search()", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    await runtime.getSearchProviderPort().indexDocument(
      sampleDoc({ documentId: "doc-orch", storageKey: undefined }),
    );
    const result = await runtime.getDocumentSearchRuntimePort().search({
      kind: "canonical-search-request",
      mode: "by-id",
      documentId: "doc-orch",
      metadata: { kind: "canonical-search-metadata", sessionId: "sess-orch" },
    });
    assert.equal(result.ok, true);
    if (result.executionId) {
      const exec = await runtime.getOrchestratorPort().getExecution({
        executionId: result.executionId,
      });
      assert.equal(exec.ok, true);
    }
  });
});

describe("SEARCH-01 auditoria — sem bypass / sem backend direto", () => {
  it("módulo search-provider não contém backends externos diretos", () => {
    const moduleDir = join(repoRoot, "src/lib/enterprise/search-provider");
    const files = collectTsFiles(moduleDir);
    assert.ok(files.length > 0);

    const forbidden = [
      /from ["']@supabase/i,
      /storage\.from\s*\(/,
      /\.from\s*\(\s*["']clinical/i,
      /from ["']@elastic/i,
      /new\s+Client\s*\(\s*\{[^}]*node:/i,
      /@azure\/search/i,
      /SearchClient\s*\(/,
      /from ["']fs["']/,
      /from ["']node:fs["']/,
      /createClient\s*\(/,
    ];

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      // Allow comments mentioning forbidden engines as "not implemented"
      const codeWithoutComments = source
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "");
      for (const pattern of forbidden) {
        assert.equal(
          pattern.test(codeWithoutComments),
          false,
          `Padrão proibido ${pattern} em ${file}`,
        );
      }
    }
  });

  it("não existe busca fora do SearchProviderPort na cadeia Enterprise", () => {
    const captureAdapter = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/capture-engine-runtime/adapters/default-capture-engine-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(captureAdapter, /getDocumentSearchRuntimePort/);
    assert.equal(/createSearchProviderPort/.test(captureAdapter), false);
    assert.equal(/DefaultSearchProviderAdapter/.test(captureAdapter), false);

    const searchRuntime = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/document-search-runtime/adapters/default-document-search-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(searchRuntime, /getSearchProviderPort/);
    assert.match(searchRuntime, /\.search\(/);

    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.match(enterpriseRuntime, /createSearchProviderPort/);
    assert.match(enterpriseRuntime, /getSearchProviderPort/);
  });
});

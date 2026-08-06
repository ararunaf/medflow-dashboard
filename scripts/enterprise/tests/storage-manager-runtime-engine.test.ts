#!/usr/bin/env node
/**
 * DIP-05 — Storage Manager Runtime
 * Prova: Runtime → Port → Adapter → Store → Factory → Provider
 *         + Enterprise Runtime + Capture Runtime + OCR Runtime
 *         + Document Classification Runtime + Orchestrator
 *         + ausência de armazenamento real / upload / chamadas externas
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_STORAGE_MANAGER_RUNTIME_ADAPTER_ID,
  DefaultStorageManagerRuntimeAdapter,
  IN_MEMORY_STORAGE_MANAGER_RUNTIME_STORE_ID,
  InMemoryStorageManagerRuntimeStore,
  MOCK_STORAGE_MANAGER_RUNTIME_ADAPTER_ID,
  MockStorageManagerRuntimeAdapter,
  StorageManagerRuntimeFactory,
  STRUCTURAL_STORAGE_PROVIDER_REFERENCES,
  createStorageManagerRuntimeFactory,
  createStorageManagerRuntimePort,
  createStorageManagerRuntimeSessionId,
  getStorageManagerRuntimeHealthSummary,
  resetAllStorageManagerRuntimeIdSequences,
  type CanonicalStorageRequest,
  type StorageManagerRuntimePort,
} from "../../../src/lib/enterprise/storage-manager-runtime/index.ts";
import { createOCRProviderPort } from "../../../src/lib/enterprise/ocr-provider/index.ts";
import { createOCRRuntimePort } from "../../../src/lib/enterprise/ocr-runtime/index.ts";
import { createDocumentClassificationProviderPort } from "../../../src/lib/enterprise/document-classification-provider/index.ts";
import { createDocumentClassificationRuntimePort } from "../../../src/lib/enterprise/document-classification-runtime/index.ts";
import { createStorageProviderPort } from "../../../src/lib/enterprise/storage-provider/index.ts";
import { createCanonicalExecutionOrchestratorPort } from "../../../src/lib/enterprise/canonical-execution-orchestrator/index.ts";
import {
  createEnterpriseRuntime,
  resetEnterpriseRuntimeForTests,
} from "../../../src/lib/enterprise/runtime/index.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../../..");

function sampleRequest(overrides: Partial<CanonicalStorageRequest> = {}): CanonicalStorageRequest {
  return {
    kind: "canonical-storage-request",
    identity: {
      kind: "canonical-storage-identity",
      documentId: "doc-dip-05",
      documentKind: "capture-document",
    },
    metadata: {
      kind: "canonical-storage-metadata",
      sessionId: "sess-dip-05",
      tenantRef: "tenant-1",
      correlationId: "corr-dip-05",
      channel: "file_upload",
      tags: ["dip-05"],
    },
    reference: {
      kind: "canonical-storage-reference",
      storageKey: "tenant/sess-dip-05/original.pdf",
      storageContainer: "clinical-documents",
      storageProvider: "product-capture",
      metadataId: "sess-dip-05",
      metadataNamespace: "product.capture",
      captureRuntimeSessionId: "dip-capture-session-1",
      ocrRuntimeSessionId: "dip-ocr-session-1",
      classificationRuntimeSessionId: "dip-classification-session-1",
      providerReferenceId: "mock-storage",
    },
    capabilities: {
      kind: "canonical-storage-capabilities",
      supportsVersioning: false,
      supportsRetentionPolicy: false,
      supportsEncryption: false,
      supportsCompression: false,
      supportsDeduplication: false,
      supportsCloudStorage: false,
      supportsLocalStorage: false,
      supportsImmutableStorage: false,
      declared: ["storage-manager-runtime"],
    },
    configuration: {
      kind: "canonical-storage-configuration",
      preferredProviderReference: "mock-storage",
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
  return {
    orchestratorPort,
    ocrRuntimePort,
    documentClassificationRuntimePort,
    storageProviderPort,
    deps: {
      getOrchestratorPort: () => orchestratorPort,
      getDocumentClassificationRuntimePort: () => documentClassificationRuntimePort,
      getStorageProviderPort: () => storageProviderPort,
    },
  };
}

function assertStorageProviderCapabilities(
  caps: ReturnType<StorageManagerRuntimePort["capabilities"]>,
) {
  assert.equal(caps.usesStorageProviderPort, true);
  assert.equal(caps.implementsRealStorage, true);
  assert.equal(caps.implementsUpload, true);
  assert.equal(caps.implementsDownload, true);
  assert.equal(caps.implementsDelete, true);
  assert.equal(caps.implementsMetadata, true);
  assert.equal(caps.supportsVersioning, false);
  assert.equal(caps.implementsRetention, false);
}

describe("DIP-05 StorageManagerRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy (STORAGE-01 ops via Provider)", async () => {
    const port: StorageManagerRuntimePort = new MockStorageManagerRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.realStorageAvailable, true);
    assert.equal(health.realUploadAvailable, true);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_STORAGE_MANAGER_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsCoordinateStorage, true);
    assert.equal(caps.implementsRealStorage, true);
    assert.equal(caps.implementsUpload, true);
    assert.equal(caps.implementsDownload, true);
  });

  it("default adapter exige enterpriseDeps (sem implementação paralela)", () => {
    assert.throws(
      () =>
        // @ts-expect-error — enterpriseDeps obrigatório
        new DefaultStorageManagerRuntimeAdapter({}),
      /enterpriseDeps/,
    );
  });

  it("default adapter coordena via Orchestrator + Classification Runtime + StorageProviderPort", async () => {
    resetAllStorageManagerRuntimeIdSequences();
    const { deps, orchestratorPort, documentClassificationRuntimePort } = enterpriseDeps();
    const port = new DefaultStorageManagerRuntimeAdapter({ enterpriseDeps: deps });

    assert.equal(port.providerId, "default");
    assert.equal(port.capabilities().adapterId, DEFAULT_STORAGE_MANAGER_RUNTIME_ADAPTER_ID);
    assert.equal(port.capabilities().usesCanonicalExecutionOrchestrator, true);
    assert.equal(port.capabilities().usesDocumentClassificationRuntime, true);
    assertStorageProviderCapabilities(port.capabilities());

    const result = await port.coordinateStorage(sampleRequest());
    assert.equal(result.ok, true);
    assert.ok(result.runtimeSessionId);
    assert.ok(result.executionId);
    assert.equal(result.realStorageExecuted, false);
    assert.equal(result.realUploadExecuted, false);
    assert.equal(result.session?.status, "coordinated");
    assert.equal(result.session?.realStorageExecuted, false);
    assert.equal(result.session?.realUploadExecuted, false);
    assert.equal(result.providerReferenceId, "mock-storage");

    const storedExec = await orchestratorPort.getExecution({
      executionId: result.executionId!,
    });
    assert.equal(storedExec.ok, true);

    const classificationHealth = await documentClassificationRuntimePort.health();
    assert.equal(classificationHealth.ok, true);

    const session = await port.getSession({ runtimeSessionId: result.runtimeSessionId! });
    assert.equal(session.ok, true);
    assert.equal(session.session?.executionId, result.executionId);
  });

  it("InMemoryStorageManagerRuntimeStore persiste sessões", () => {
    const store = new InMemoryStorageManagerRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_STORAGE_MANAGER_RUNTIME_STORE_ID);
    assert.equal(store.health().ok, true);

    const stamp = new Date().toISOString();
    store.setSession({
      kind: "canonical-storage-session",
      runtimeSessionId: "sess-store-1",
      status: "coordinated",
      request: sampleRequest(),
      createdAt: stamp,
      updatedAt: stamp,
      realStorageExecuted: false,
      realUploadExecuted: false,
    });
    assert.equal(store.sessionCount(), 1);
    assert.equal(store.getSession("sess-store-1")?.status, "coordinated");
    assert.equal(store.listSessions().length, 1);
    assert.equal(store.removeSession("sess-store-1"), true);
    assert.equal(store.sessionCount(), 0);
  });

  it("Factory e Provider resolvem default / mock / test", () => {
    const { deps } = enterpriseDeps();
    const factory = createStorageManagerRuntimeFactory({ enterpriseDeps: deps });
    assert.ok(factory instanceof StorageManagerRuntimeFactory);

    const defaultPort = factory.create({ provider: "default" });
    assert.equal(defaultPort.providerId, "default");

    const mockPort = createStorageManagerRuntimePort({ provider: "mock" });
    assert.equal(mockPort.providerId, "mock");

    const testPort = createStorageManagerRuntimePort({
      provider: "test",
      enterpriseDeps: deps,
    });
    assert.equal(testPort.providerId, "test");

    assert.throws(() => createStorageManagerRuntimePort({ provider: "default" }), /enterpriseDeps/);
  });

  it("Provider desconhecido não existe — ids restritos a default|mock|test", () => {
    const factory = createStorageManagerRuntimeFactory();
    assert.throws(
      () =>
        factory.create({
          // @ts-expect-error — provider inválido
          provider: "aws-s3",
        }),
      /desconhecido|exige enterpriseDeps/,
    );
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createStorageManagerRuntimePort({ provider: "mock" });
    const summary = await getStorageManagerRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.health.realStorageAvailable, true);
    assert.equal(summary.health.realUploadAvailable, true);
    assert.equal(summary.capabilities.supportsCoordinateStorage, true);
    assert.equal(summary.capabilities.implementsRealStorage, true);
    assert.equal(summary.capabilities.implementsUpload, true);
  });

  it("coordinateStorage rejeita input inválido", async () => {
    const { deps } = enterpriseDeps();
    const port = createStorageManagerRuntimePort({
      provider: "default",
      enterpriseDeps: deps,
    });
    const result = await port.coordinateStorage(
      sampleRequest({
        identity: {
          kind: "canonical-storage-identity",
          documentId: "",
        },
        metadata: {
          kind: "canonical-storage-metadata",
          sessionId: "",
        },
      }),
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, "INVALID_INPUT");
    assert.equal(result.realStorageExecuted, false);
    assert.equal(result.realUploadExecuted, false);
  });

  it("createStorageManagerRuntimeSessionId é determinístico após reset", () => {
    resetAllStorageManagerRuntimeIdSequences();
    assert.equal(createStorageManagerRuntimeSessionId(), "dip-storage-session-1");
    assert.equal(createStorageManagerRuntimeSessionId(), "dip-storage-session-2");
    resetAllStorageManagerRuntimeIdSequences();
    assert.equal(createStorageManagerRuntimeSessionId(), "dip-storage-session-1");
  });

  it("lista Storage Providers — supabase/mock ready (STORAGE-01), demais estruturais", async () => {
    const port = createStorageManagerRuntimePort({ provider: "mock" });
    const refs = await port.listProviderReferences();
    assert.equal(refs.ok, true);
    assert.equal(refs.references.length, STRUCTURAL_STORAGE_PROVIDER_REFERENCES.length);
    const ids = refs.references.map((r) => r.providerReferenceId).sort();
    assert.deepEqual(ids, [
      "aws-s3",
      "azure-blob",
      "google-cloud-storage",
      "local-storage",
      "mock-storage",
      "nas",
      "sharepoint",
      "supabase-storage",
    ]);
    const supabase = refs.references.find((r) => r.providerReferenceId === "supabase-storage");
    const mock = refs.references.find((r) => r.providerReferenceId === "mock-storage");
    assert.equal(supabase?.status, "ready");
    assert.equal(supabase?.implementsRealStorage, true);
    assert.equal(mock?.status, "ready");
    assert.equal(mock?.implementsRealStorage, true);
    const structural = refs.references.filter(
      (r) =>
        r.providerReferenceId !== "supabase-storage" && r.providerReferenceId !== "mock-storage",
    );
    for (const ref of structural) {
      assert.equal(ref.connected, false);
      assert.equal(ref.implementsRealStorage, false);
      assert.equal(ref.status, "structural-reference-only");
    }
  });
});

describe("DIP-05 integração Enterprise / Capture / OCR / Classification / Orchestrator", () => {
  it("Enterprise Runtime expõe StorageManagerRuntimePort", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const storageManagerRuntime = runtime.getStorageManagerRuntimePort();
    assert.ok(storageManagerRuntime);
    assert.equal(storageManagerRuntime.providerId, "default");

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.storageManagerRuntimeOk, true);
    assert.equal(health.documentClassificationRuntimeOk, true);
    assert.equal(health.ocrRuntimeOk, true);
    assert.equal(health.captureEngineRuntimeOk, true);
    assert.equal(health.orchestratorOk, true);

    const storageHealth = await storageManagerRuntime.health();
    assert.equal(storageHealth.realStorageAvailable, true);
    assert.equal(storageHealth.realUploadAvailable, true);
    assert.equal(storageHealth.storageProviderOk, true);
    assert.equal(runtime.getStorageProviderPort().providerId, "supabase");
  });

  it("fluxo captura passa pelo Storage Manager Runtime + StorageProviderPort", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });

    const result = await runtime.registerCaptureDocumentIntake({
      sessionId: "sess-arch-dip-05",
      documentId: "doc-arch-dip-05",
      storagePath: "tenant/sess-arch-dip-05/original.pdf",
      tenantRef: "tenant-1",
      correlationId: "corr-arch-dip-05",
      channel: "file_upload",
    });

    assert.equal(result.ok, true);
    assert.ok(result.intakeId);
    assert.ok(result.executionId);
    assert.ok(result.runtimeSessionId);
    assert.ok(result.ocrRuntimeSessionId);
    assert.ok(result.classificationRuntimeSessionId);
    assert.ok(result.storageManagerRuntimeSessionId);

    const captureSession = await runtime.getCaptureEngineRuntimePort().getSession({
      runtimeSessionId: result.runtimeSessionId!,
    });
    assert.equal(captureSession.ok, true);
    assert.equal(captureSession.session?.status, "registered");
    assert.equal(
      captureSession.session?.storageManagerRuntimeSessionId,
      result.storageManagerRuntimeSessionId,
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
    assert.equal(storageSession.session?.realUploadExecuted, false);

    const storageExec = await runtime.getOrchestratorPort().getExecution({
      executionId: storageSession.session!.executionId!,
    });
    assert.equal(storageExec.ok, true);

    assert.equal(runtime.getStorageManagerRuntimePort().capabilities().implementsRealStorage, true);
    assert.equal(
      runtime.getStorageManagerRuntimePort().capabilities().usesStorageProviderPort,
      true,
    );
    assert.equal(
      runtime.getCaptureEngineRuntimePort().capabilities().implementsStorageManager,
      false,
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

  it("produto não instancia Adapter Storage diretamente", () => {
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const keys = Object.keys(runtime);
    assert.ok(!keys.some((k) => /adapter/i.test(k)));
    assert.equal(typeof runtime.getStorageManagerRuntimePort, "function");
    assert.equal(typeof runtime.getDocumentClassificationRuntimePort, "function");
    assert.equal(typeof runtime.getOCRRuntimePort, "function");
    assert.equal(typeof runtime.getCaptureEngineRuntimePort, "function");
    assert.equal(typeof runtime.registerCaptureDocumentIntake, "function");
  });
});

describe("DIP-05 / STORAGE-01 — Storage Manager usa apenas StorageProviderPort", () => {
  it("fonte do Storage Manager Runtime não contém SDKs de vendor diretos", () => {
    const moduleDir = join(repoRoot, "src/lib/enterprise/storage-manager-runtime");
    const files = [
      "adapters/default-storage-manager-runtime-adapter.ts",
      "adapters/mock-storage-manager-runtime-adapter.ts",
      "factory/storage-manager-runtime-factory.ts",
      "providers/create-storage-manager-runtime-port.ts",
      "ports/storage-manager-runtime-port.ts",
      "ports/types.ts",
      "ports/models.ts",
      "index.ts",
    ];

    const forbidden = [
      /from ["']@supabase\/storage/i,
      /from ["']@aws-sdk\/client-s3/i,
      /from ["']@azure\/storage-blob/i,
      /from ["']@google-cloud\/storage/i,
      /\.putObject\s*\(/,
      /\.getObject\s*\(/,
      /createWriteStream\s*\(/,
      /writeFileSync\s*\(/,
      /writeFile\s*\(/,
      /fetch\s*\(/,
      /https?:\/\//,
      /blob\.core\.windows\.net/i,
      /storage\.googleapis\.com/i,
      /s3\.amazonaws\.com/i,
      /storage\.from\s*\(/,
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
      join(moduleDir, "adapters/default-storage-manager-runtime-adapter.ts"),
      "utf8",
    );
    assert.match(defaultAdapter, /getStorageProviderPort/);
    assert.match(defaultAdapter, /StorageProviderPort/);
    assert.equal(/\.putObject\s*\(/.test(defaultAdapter), false);
    assert.equal(/storage\.from\s*\(/.test(defaultAdapter), false);
  });

  it("coordinateStorage sem executeUpload não executa upload real", async () => {
    const { deps } = enterpriseDeps();
    const port = createStorageManagerRuntimePort({
      provider: "default",
      enterpriseDeps: deps,
    });
    const result = await port.coordinateStorage(sampleRequest());
    assert.equal(result.ok, true);
    const sessionJson = JSON.stringify(result.session);
    assert.equal(/"blobUri"\s*:/i.test(sessionJson), false);
    assert.equal(/"signedUrl"\s*:/i.test(sessionJson), false);
    assert.equal(/"byteLength"\s*:/i.test(sessionJson), false);
    assert.equal(/"uploadedBytes"\s*:/i.test(sessionJson), false);
    assert.equal(result.realStorageExecuted, false);
    assert.equal(result.realUploadExecuted, false);
    assert.equal(result.session?.realStorageExecuted, false);
    assert.equal(result.session?.realUploadExecuted, false);
  });
});

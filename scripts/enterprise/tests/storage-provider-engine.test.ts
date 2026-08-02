#!/usr/bin/env node
/**
 * STORAGE-01 — Enterprise Storage Provider
 * Prova: Application → StorageProviderPort → Adapter → Factory → Registry
 *         + Storage Manager Runtime + Enterprise Runtime + Capture Runtime
 *         + OCR Runtime + Classification Runtime
 *         + CanonicalStorageResult / CanonicalStorageMetadata / CanonicalStoredDocument
 *         + upload / download / delete / metadata
 *         + timeout / retry / cancelamento / erros
 *         + ausência de bypass / acesso direto a vendors
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_STORAGE_PROVIDER_COUNT,
  DEFAULT_STORAGE_PROVIDER_ADAPTER_ID,
  DEFAULT_STORAGE_PROVIDER_CAPABILITIES,
  DefaultStorageProviderAdapter,
  MOCK_STORAGE_PROVIDER_ADAPTER_ID,
  MockStorageProviderAdapter,
  StorageProviderFactory,
  StorageProviderRegistry,
  SupabaseStorageProviderAdapter,
  createDefaultStorageProviderRegistry,
  createInMemoryStorageBackend,
  createStorageProviderFactory,
  createStorageProviderPort,
  getStorageProviderFactory,
  getStorageProviderHealthSummary,
  type StorageProviderPort,
} from "../../../src/lib/enterprise/storage-provider/index.ts";
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

describe("STORAGE-01 StorageProviderPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: StorageProviderPort = new MockStorageProviderAdapter({ provider: "mock" });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.status, "ready");

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_STORAGE_PROVIDER_ADAPTER_ID);
    assert.equal(caps.supportsCanonicalResult, true);
    assert.equal(caps.supportsUpload, true);
    assert.equal(caps.supportsDownload, true);
    assert.equal(caps.supportsDelete, true);
    assert.equal(caps.supportsMetadata, true);
    assert.equal(caps.implementsRealStorage, true);
  });

  it("DefaultStorageProviderAdapter é o adapter oficial (alias Supabase)", () => {
    assert.equal(SupabaseStorageProviderAdapter, DefaultStorageProviderAdapter);
    const port = new DefaultStorageProviderAdapter({
      provider: "supabase",
      backend: createInMemoryStorageBackend(),
    });
    assert.equal(port.providerId, "supabase");
    assert.equal(port.capabilities().adapterId, DEFAULT_STORAGE_PROVIDER_ADAPTER_ID);
  });

  it("createStorageProviderPort default resolve supabase", async () => {
    const port = createStorageProviderPort();
    assert.equal(port.providerId, "supabase");
    const validation = await port.validateConfiguration();
    assert.equal(validation.ok, true);
    assert.equal(validation.errors.length, 0);
  });

  it("test / default / mock são resolvidos pelo factory", async () => {
    assert.equal(createStorageProviderPort({ provider: "test" }).providerId, "test");
    assert.equal(createStorageProviderPort({ provider: "default" }).providerId, "default");
    assert.equal(createStorageProviderPort({ provider: "mock" }).providerId, "mock");
    assert.equal((await createStorageProviderPort({ provider: "mock" }).health()).ok, true);
  });

  it("upload / download / delete / metadata produzem resultado canônico", async () => {
    const port = new DefaultStorageProviderAdapter({
      provider: "supabase",
      backend: createInMemoryStorageBackend(),
    });

    const upload = await port.upload({
      requestId: "req-up-1",
      key: "tenant/sess-1/original.pdf",
      body: new TextEncoder().encode("hello-storage-01"),
      contentType: "application/pdf",
      documentId: "doc-1",
      sessionId: "sess-1",
      tenantRef: "tenant-1",
    });
    assert.equal(upload.ok, true);
    assert.equal(upload.kind, "canonical-storage-result");
    assert.equal(upload.operation, "upload");
    assert.equal(upload.realUploadExecuted, true);
    assert.equal(upload.storedDocument?.kind, "canonical-stored-document");
    assert.equal(upload.metadata?.kind, "canonical-storage-metadata");
    assert.equal(upload.telemetry.cancelled, false);

    const downloaded = await port.download({
      key: "tenant/sess-1/original.pdf",
      sessionId: "sess-1",
    });
    assert.equal(downloaded.ok, true);
    assert.equal(downloaded.operation, "download");
    assert.equal(downloaded.realDownloadExecuted, true);
    assert.equal(new TextDecoder().decode(downloaded.body), "hello-storage-01");

    const meta = await port.metadata({
      key: "tenant/sess-1/original.pdf",
      sessionId: "sess-1",
    });
    assert.equal(meta.ok, true);
    assert.equal(meta.operation, "metadata");
    assert.ok((meta.metadata?.sizeBytes ?? 0) > 0);

    const deleted = await port.delete({
      key: "tenant/sess-1/original.pdf",
      sessionId: "sess-1",
    });
    assert.equal(deleted.ok, true);
    assert.equal(deleted.operation, "delete");
    assert.equal(deleted.realDeleteExecuted, true);

    const missing = await port.download({ key: "tenant/sess-1/original.pdf" });
    assert.equal(missing.ok, false);
  });

  it("timeout é implementado e retorna STORAGE_TIMEOUT", async () => {
    const port = new DefaultStorageProviderAdapter({
      defaultTimeoutMs: 20,
      defaultRetryCount: 0,
      backend: createInMemoryStorageBackend(),
    });
    const result = await port.upload({
      key: "k-timeout",
      body: "x",
      timeoutMs: 20,
      retryCount: 0,
      attributes: { forceDelayMs: 200 },
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "STORAGE_TIMEOUT");
  });

  it("retry recupera falha transitória", async () => {
    const port = new DefaultStorageProviderAdapter({
      failAttempts: 1,
      defaultRetryCount: 2,
      defaultRetryBackoffMs: 1,
      backend: createInMemoryStorageBackend(),
    });
    const result = await port.upload({
      key: "k-retry",
      body: "retry-body",
      retryCount: 2,
    });
    assert.equal(result.ok, true);
    assert.ok(result.telemetry.attempts >= 2);
  });

  it("cancelamento via AbortSignal retorna STORAGE_CANCELLED", async () => {
    const port = new DefaultStorageProviderAdapter({
      backend: createInMemoryStorageBackend(),
    });
    const controller = new AbortController();
    controller.abort();
    const result = await port.upload({
      key: "k-cancel",
      body: "x",
      signal: controller.signal,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "STORAGE_CANCELLED");
    assert.equal(result.telemetry.cancelled, true);
  });

  it("tratamento de erro para provider unhealthy", async () => {
    const port = new DefaultStorageProviderAdapter({
      healthy: false,
      backend: createInMemoryStorageBackend(),
    });
    const result = await port.upload({ key: "k-unhealthy", body: "x" });
    assert.equal(result.ok, false);
    assert.equal(result.code, "STORAGE_UNHEALTHY");
  });

  it("Registry e Factory seguem ECS-01 (sem fallback silencioso)", () => {
    const registry = createDefaultStorageProviderRegistry();
    assert.ok(registry instanceof StorageProviderRegistry);
    assert.equal(registry.snapshot().count, BUILTIN_STORAGE_PROVIDER_COUNT);
    assert.equal(registry.has("supabase"), true);

    const factory = createStorageProviderFactory({ registry });
    assert.ok(factory instanceof StorageProviderFactory);
    assert.equal(factory.create({ provider: "supabase" }).providerId, "supabase");

    assert.throws(
      () =>
        factory.create({
          // @ts-expect-error — provider inválido
          provider: "azure-blob-direct",
        }),
      /não está registrado|desconhecido/,
    );

    assert.equal(getStorageProviderFactory().getRegistry().has("mock"), true);
    assert.equal(DEFAULT_STORAGE_PROVIDER_CAPABILITIES.supportsCanonicalResult, true);
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createStorageProviderPort({ provider: "supabase" });
    const summary = await getStorageProviderHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.info.providerType, "DOCUMENT_STORAGE");
    assert.equal(summary.capabilities.implementsRealStorage, true);
  });
});

describe("STORAGE-01 cadeia Enterprise / Capture / OCR / Classification / Storage", () => {
  it("Enterprise Runtime expõe Storage Provider + Storage Manager Runtime", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    assert.equal(runtime.getStorageProviderPort().providerId, "supabase");
    assert.equal(runtime.getStorageManagerRuntimePort().providerId, "default");
    assert.equal(
      runtime.getStorageManagerRuntimePort().capabilities().implementsRealStorage,
      true,
    );
    assert.equal(
      runtime.getStorageManagerRuntimePort().capabilities().usesStorageProviderPort,
      true,
    );

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.storageProviderOk, true);
    assert.equal(health.storageManagerRuntimeOk, true);
    assert.equal(health.documentClassificationRuntimeOk, true);
    assert.equal(health.ocrRuntimeOk, true);
    assert.equal(health.captureEngineRuntimeOk, true);
    assert.equal(health.orchestratorOk, true);
  });

  it("fluxo: Runtime → Storage Manager → StorageProviderPort → Canonical Result", async () => {
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

    const upload = await storageManager.upload({
      key: "tenant/chain/doc.pdf",
      body: "canonical-chain",
      documentId: "doc-chain",
      sessionId: "sess-chain",
    });
    assert.equal(upload.kind, "canonical-storage-result");
    assert.equal(upload.ok, true);
    assert.equal(upload.realUploadExecuted, true);
    assert.equal(upload.storedDocument?.kind, "canonical-stored-document");

    const download = await storageManager.download({ key: "tenant/chain/doc.pdf" });
    assert.equal(download.ok, true);
    assert.equal(new TextDecoder().decode(download.body), "canonical-chain");

    const meta = await storageManager.metadata({ key: "tenant/chain/doc.pdf" });
    assert.equal(meta.ok, true);

    const del = await storageManager.delete({ key: "tenant/chain/doc.pdf" });
    assert.equal(del.ok, true);
    assert.equal(del.realDeleteExecuted, true);
  });

  it("Capture Runtime continua coordenando; Storage Runtime permanece desacoplado", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
      storageProviderPort: createStorageProviderPort({ provider: "mock" }),
    });

    const captureCaps = runtime.getCaptureEngineRuntimePort().capabilities();
    assert.equal(captureCaps.usesStorageManagerRuntime, true);
    assert.equal(captureCaps.implementsStorageManager, false);

    const storageCaps = runtime.getStorageManagerRuntimePort().capabilities();
    assert.equal(storageCaps.usesStorageProviderPort, true);
    assert.equal(storageCaps.implementsRealStorage, true);

    const register = await runtime.registerCaptureDocumentIntake({
      sessionId: "sess-storage-01-capture",
      documentId: "doc-storage-01-capture",
      storagePath: "tenant/sess-storage-01-capture/original.pdf",
      tenantRef: "tenant-1",
      correlationId: "corr-storage-01",
      channel: "file_upload",
    });
    assert.equal(register.ok, true);
    assert.ok(register.storageManagerRuntimeSessionId);

    const storageSession = await runtime.getStorageManagerRuntimePort().getSession({
      runtimeSessionId: register.storageManagerRuntimeSessionId!,
    });
    assert.equal(storageSession.ok, true);
    assert.equal(storageSession.session?.status, "coordinated");
  });

  it("coordinateStorage com executeUpload persiste via StorageProviderPort", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test",
      storageProviderPort: createStorageProviderPort({ provider: "mock" }),
    });

    const result = await runtime.getStorageManagerRuntimePort().coordinateStorage({
      kind: "canonical-storage-request",
      identity: {
        kind: "canonical-storage-identity",
        documentId: "doc-exec-upload",
      },
      metadata: {
        kind: "canonical-storage-metadata",
        sessionId: "sess-exec-upload",
        tenantRef: "tenant-1",
      },
      reference: {
        kind: "canonical-storage-reference",
        storageKey: "tenant/sess-exec-upload/original.pdf",
        storageContainer: "clinical-documents",
        providerReferenceId: "mock-storage",
      },
      configuration: {
        kind: "canonical-storage-configuration",
        preferredProviderReference: "mock-storage",
        executeUpload: true,
        contentTypeHint: "application/pdf",
        bodyBase64: Buffer.from("upload-via-coordinate").toString("base64"),
      },
    });

    assert.equal(result.ok, true);
    assert.equal(result.realUploadExecuted, true);
    assert.equal(result.storedDocument?.kind, "canonical-stored-document");
    assert.equal(result.operation, "upload");
  });
});

describe("STORAGE-01 auditoria — sem bypass / sem acesso direto no produto", () => {
  it("módulo storage-provider não contém SDKs Azure/AWS/GCS", () => {
    const moduleDir = join(repoRoot, "src/lib/enterprise/storage-provider");
    const files = collectTsFiles(moduleDir);
    assert.ok(files.length > 0);

    const forbidden = [
      /from ["']@azure\/storage/i,
      /from ["']@aws-sdk/i,
      /from ["']@google-cloud\/storage/i,
      /BlobServiceClient/,
      /S3Client/,
    ];

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        assert.equal(pattern.test(source), false, `Padrão proibido ${pattern} em ${file}`);
      }
    }
  });

  it("produto captura não acessa storage.from diretamente", () => {
    const captureDirs = [
      join(repoRoot, "src/lib/capture/infrastructure"),
      join(repoRoot, "src/lib/capture/ocr"),
      join(repoRoot, "src/lib/capture/parser"),
      join(repoRoot, "src/lib/capture/audit"),
      join(repoRoot, "src/lib/capture/correction"),
      join(repoRoot, "src/lib/capture/contract"),
      join(repoRoot, "src/lib/capture/risk"),
      join(repoRoot, "src/lib/capture/learning"),
    ];
    for (const dir of captureDirs) {
      for (const file of collectTsFiles(dir)) {
        if (file.includes("enterprise-storage-bridge")) continue;
        const source = readFileSync(file, "utf8");
        assert.equal(
          /storage\.from\s*\(/.test(source),
          false,
          `Bypass storage.from em ${file}`,
        );
        assert.equal(
          /client\.storage/.test(source),
          false,
          `Bypass client.storage em ${file}`,
        );
      }
    }
  });

  it("Enterprise Runtime e Storage Manager usam StorageProviderPort sem bypass", () => {
    const captureAdapter = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/capture-engine-runtime/adapters/default-capture-engine-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(captureAdapter, /getStorageManagerRuntimePort/);
    assert.equal(/createBoundStorageProviderPort/.test(captureAdapter), false);
    assert.equal(/DefaultStorageProviderAdapter/.test(captureAdapter), false);

    const storageManager = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/storage-manager-runtime/adapters/default-storage-manager-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(storageManager, /getStorageProviderPort/);
    assert.match(storageManager, /\.upload\(/);

    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.match(enterpriseRuntime, /createStorageProviderPort/);
    assert.match(enterpriseRuntime, /getStorageProviderPort/);
  });
});

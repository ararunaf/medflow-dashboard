#!/usr/bin/env node
/**
 * F3-CAP-03 — Enterprise Upload Runtime
 * Prova: Application → UploadRuntimePort → Adapter → Factory → Registry → Store
 *         + Enterprise Runtime + deps estruturais (Scanner/WatchFolder/Capture/OCR/PQR/Scheduler/Worker/Obs)
 *         + register / unregister / discover / openSession / closeSession / receive / stats / health
 *         + ausência de Upload real / Web / Desktop / Mobile / API / Multipart / Chunked / Resumable
 *         + ausência de Azure Blob / Supabase / S3 / Google Drive / OneDrive / Dropbox
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_UPLOAD_RUNTIME_PROVIDER_COUNT,
  DEFAULT_UPLOAD_RUNTIME_ADAPTER_ID,
  DEFAULT_UPLOAD_RUNTIME_CAPABILITIES,
  DefaultUploadRuntimeAdapter,
  EnterpriseUploadRuntimeAdapter,
  IN_MEMORY_UPLOAD_RUNTIME_STORE_ID,
  InMemoryUploadRuntimeStore,
  MOCK_UPLOAD_RUNTIME_ADAPTER_ID,
  MockUploadRuntimeAdapter,
  UPLOAD_RUNTIME_IDENTITY,
  UploadRuntimeFactory,
  UploadRuntimeProvider,
  UploadRuntimeRegistry,
  createDefaultUploadRuntimeRegistry,
  createUploadRuntimeFactory,
  createUploadRuntimePort,
  getUploadRuntimeFactory,
  getUploadRuntimeHealthSummary,
  getUploadRuntimePort,
  resetUploadRuntimeIdSequences,
  type UploadRuntimePort,
} from "../../../src/lib/enterprise/upload-runtime/index.ts";
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

describe("F3-CAP-03 UploadRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: UploadRuntimePort = new MockUploadRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.status, "ready");
    assert.equal(health.kind, "canonical-upload-health");
    assert.equal(health.runtimeReady, true);
    assert.equal(health.webUploadImplemented, false);
    assert.equal(health.desktopUploadImplemented, false);
    assert.equal(health.mobileUploadImplemented, false);
    assert.equal(health.apiUploadImplemented, false);
    assert.equal(health.multipartImplemented, false);
    assert.equal(health.chunkedUploadImplemented, false);
    assert.equal(health.resumableUploadImplemented, false);
    assert.equal(health.azureBlobImplemented, false);
    assert.equal(health.supabaseStorageImplemented, false);
    assert.equal(health.s3Implemented, false);
    assert.equal(health.googleDriveImplemented, false);
    assert.equal(health.oneDriveImplemented, false);
    assert.equal(health.dropboxImplemented, false);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_UPLOAD_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsCanonicalUpload, true);
    assert.equal(caps.usesScannerRuntimePort, true);
    assert.equal(caps.usesWatchFolderRuntimePort, true);
    assert.equal(caps.usesCaptureEngineRuntimePort, true);
    assert.equal(caps.usesOCRRuntimePort, true);
    assert.equal(caps.usesPersistentQueueRuntimePort, true);
    assert.equal(caps.usesSchedulerRuntimePort, true);
    assert.equal(caps.usesWorkerRuntimePort, true);
    assert.equal(caps.usesObservabilityRuntimePort, true);
    assert.equal(caps.runtimeReady, true);
    assert.equal(caps.webUploadImplemented, false);
    assert.equal(caps.multipartImplemented, false);
    assert.equal(caps.azureBlobImplemented, false);
    assert.equal(caps.s3Implemented, false);
    assert.equal(caps.canonical.kind, "canonical-upload-capabilities");
    assert.equal(caps.canonical.webUploadImplemented, false);
  });

  it("DefaultUploadRuntimeAdapter é o adapter enterprise oficial", () => {
    assert.equal(EnterpriseUploadRuntimeAdapter, DefaultUploadRuntimeAdapter);
    const port = new DefaultUploadRuntimeAdapter({
      provider: "enterprise",
    });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_UPLOAD_RUNTIME_ADAPTER_ID);
  });

  it("identity declara Enterprise Upload Runtime Foundation vendor-agnostic", () => {
    assert.equal(UPLOAD_RUNTIME_IDENTITY.name, "Enterprise Upload Runtime");
    assert.equal(UPLOAD_RUNTIME_IDENTITY.layer, "Foundation");
    assert.ok(UPLOAD_RUNTIME_IDENTITY.version);
    assert.equal(UPLOAD_RUNTIME_IDENTITY.vendorAgnostic, true);
    const info = createUploadRuntimePort().providerInfo();
    assert.equal(info.metadata.vendorAgnostic, true);
    assert.equal(info.metadata.layer, "Foundation");
  });

  it("provider default resolve enterprise via getUploadRuntimePort", () => {
    const port = createUploadRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(getUploadRuntimePort().providerId, "enterprise");
    assert.equal(UploadRuntimeProvider.create().providerId, "enterprise");
  });

  it("factory resolve mock / test / default / enterprise", () => {
    const factory = createUploadRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(
      getUploadRuntimeFactory().getRegistry().list().length,
      BUILTIN_UPLOAD_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("register → discover → openSession → receive → closeSession → unregister → stats", async () => {
    resetUploadRuntimeIdSequences();
    const port = createUploadRuntimePort({ provider: "enterprise" });

    const registered = await port.register({
      uploadName: "foundation-upload",
      channelKey: "structural://channel/opaque",
      correlationId: "corr-f3-cap-03",
    });
    assert.equal(registered.ok, true);
    assert.ok(registered.result?.resultId);
    assert.equal(registered.result?.webUploadImplemented, false);
    assert.equal(registered.result?.multipartImplemented, false);
    assert.equal(registered.result?.azureBlobImplemented, false);
    assert.equal(registered.result?.runtimeReady, true);
    assert.equal(registered.upload?.status, "registered");
    assert.equal(registered.upload?.uploadName, "foundation-upload");
    assert.equal(registered.upload?.channelKey, "structural://channel/opaque");

    const discovered = await port.discover();
    assert.equal(discovered.ok, true);
    assert.ok((discovered.uploads?.length ?? 0) >= 1);
    assert.equal(discovered.result?.chunkedUploadImplemented, false);
    assert.equal(discovered.result?.s3Implemented, false);
    assert.equal(discovered.result?.apiUploadImplemented, false);

    const opened = await port.openSession({
      uploadId: registered.upload!.uploadId,
    });
    assert.equal(opened.ok, true);
    assert.equal(opened.session?.status, "session-open");
    assert.equal(opened.session?.resumableUploadImplemented, false);
    assert.ok(opened.session?.sessionId);

    const received = await port.receive({
      uploadId: registered.upload!.uploadId,
      sessionId: opened.session!.sessionId,
    });
    assert.equal(received.ok, true);
    assert.equal(received.receipt?.status, "received");
    assert.equal(received.result?.webUploadImplemented, false);
    assert.equal(received.result?.googleDriveImplemented, false);
    assert.ok(received.receipt?.receiptId);

    const closed = await port.closeSession({ sessionId: opened.session!.sessionId });
    assert.equal(closed.ok, true);
    assert.equal(closed.session?.status, "session-closed");

    const unregistered = await port.unregister({
      uploadId: registered.upload!.uploadId,
    });
    assert.equal(unregistered.ok, true);
    assert.equal(unregistered.upload?.status, "unregistered");

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "canonical-upload-statistics");
    assert.equal(stats.statistics?.webUploadImplementedCount, 0);
    assert.equal(stats.statistics?.multipartImplementedCount, 0);
    assert.equal(stats.statistics?.azureBlobImplementedCount, 0);
    assert.equal(stats.statistics?.s3ImplementedCount, 0);
  });

  it("InMemory store oficial e flags estruturais zeradas", () => {
    const store = new InMemoryUploadRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_UPLOAD_RUNTIME_STORE_ID);
    const stats = store.statistics();
    assert.equal(stats.kind, "canonical-upload-statistics");
    assert.equal(stats.webUploadImplementedCount, 0);
    assert.equal(stats.desktopUploadImplementedCount, 0);
    assert.equal(stats.azureBlobImplementedCount, 0);
    assert.equal(DEFAULT_UPLOAD_RUNTIME_CAPABILITIES.runtimeReady, true);
    assert.equal(DEFAULT_UPLOAD_RUNTIME_CAPABILITIES.webUploadImplemented, false);
    assert.equal(DEFAULT_UPLOAD_RUNTIME_CAPABILITIES.desktopUploadImplemented, false);
    assert.equal(DEFAULT_UPLOAD_RUNTIME_CAPABILITIES.mobileUploadImplemented, false);
    assert.equal(DEFAULT_UPLOAD_RUNTIME_CAPABILITIES.apiUploadImplemented, false);
    assert.equal(DEFAULT_UPLOAD_RUNTIME_CAPABILITIES.multipartImplemented, false);
    assert.equal(DEFAULT_UPLOAD_RUNTIME_CAPABILITIES.chunkedUploadImplemented, false);
    assert.equal(DEFAULT_UPLOAD_RUNTIME_CAPABILITIES.resumableUploadImplemented, false);
    assert.equal(DEFAULT_UPLOAD_RUNTIME_CAPABILITIES.azureBlobImplemented, false);
    assert.equal(DEFAULT_UPLOAD_RUNTIME_CAPABILITIES.supabaseStorageImplemented, false);
    assert.equal(DEFAULT_UPLOAD_RUNTIME_CAPABILITIES.s3Implemented, false);
    assert.equal(DEFAULT_UPLOAD_RUNTIME_CAPABILITIES.googleDriveImplemented, false);
    assert.equal(DEFAULT_UPLOAD_RUNTIME_CAPABILITIES.oneDriveImplemented, false);
    assert.equal(DEFAULT_UPLOAD_RUNTIME_CAPABILITIES.dropboxImplemented, false);
  });

  it("retry recupera falha transitória", async () => {
    const port = new DefaultUploadRuntimeAdapter({
      provider: "enterprise",
      failAttempts: 1,
      defaultRetryCount: 1,
      defaultRetryBackoffMs: 1,
    });
    const result = await port.register({ uploadName: "retry-upload" });
    assert.equal(result.ok, true);
    assert.ok((result.telemetry?.attempts ?? 0) >= 2);
  });

  it("AbortSignal cancela operação", async () => {
    const port = createUploadRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.register({
      uploadName: "abort-upload",
      signal: controller.signal,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "UPLOAD_RUNTIME_CANCELLED");
  });

  it("registry/factory sem fallback silencioso", () => {
    const registry = createDefaultUploadRuntimeRegistry();
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.has("mock"), true);
    assert.equal(registry.has("test"), true);
    assert.equal(registry.has("default"), true);
    assert.equal(registry.snapshot().count, BUILTIN_UPLOAD_RUNTIME_PROVIDER_COUNT);
    assert.ok(registry instanceof UploadRuntimeRegistry);

    const factory = new UploadRuntimeFactory({ registry });
    assert.throws(() => factory.create({ provider: "unknown" as never }), /não está registrado/);
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createUploadRuntimePort({ provider: "enterprise" });
    const summary = await getUploadRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.info.providerType, "UPLOAD_RUNTIME");
    assert.equal(summary.capabilities.runtimeReady, true);
    assert.equal(summary.capabilities.webUploadImplemented, false);
    assert.equal(summary.capabilities.azureBlobImplemented, false);
  });
});

describe("F3-CAP-03 cadeia Enterprise / Upload Runtime", () => {
  it("Enterprise Runtime expõe Upload Runtime + health uploadRuntimeOk", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    assert.equal(runtime.getUploadRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getWatchFolderRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getScannerRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getCaptureEngineRuntimePort().providerId, "default");
    assert.equal(runtime.getOCRRuntimePort().providerId, "default");
    assert.equal(runtime.getWorkerRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getSchedulerRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getPersistentQueueRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getObservabilityRuntimePort().providerId, "enterprise");

    const caps = runtime.getUploadRuntimePort().capabilities();
    assert.equal(caps.usesScannerRuntimePort, true);
    assert.equal(caps.usesWatchFolderRuntimePort, true);
    assert.equal(caps.usesCaptureEngineRuntimePort, true);
    assert.equal(caps.usesOCRRuntimePort, true);
    assert.equal(caps.usesWorkerRuntimePort, true);
    assert.equal(caps.webUploadImplemented, false);

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.uploadRuntimeOk, true);
    assert.equal(health.watchFolderRuntimeOk, true);
    assert.equal(health.scannerRuntimeOk, true);
    assert.equal(health.captureEngineRuntimeOk, true);
    assert.equal(health.ocrRuntimeOk, true);
  });

  it("Upload Runtime prepara deps sem consumo funcional", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const upload = runtime.getUploadRuntimePort();
    const watchFolder = runtime.getWatchFolderRuntimePort();
    const scanner = runtime.getScannerRuntimePort();
    const worker = runtime.getWorkerRuntimePort();

    const uploadHealth = await upload.health();
    assert.equal(uploadHealth.ok, true);
    assert.equal(uploadHealth.scannerRuntimeOk, true);
    assert.equal(uploadHealth.watchFolderRuntimeOk, true);
    assert.equal(uploadHealth.captureEngineRuntimeOk, true);
    assert.equal(uploadHealth.ocrRuntimeOk, true);
    assert.equal(uploadHealth.persistentQueueRuntimeOk, true);
    assert.equal(uploadHealth.schedulerRuntimeOk, true);
    assert.equal(uploadHealth.workerRuntimeOk, true);
    assert.equal(uploadHealth.observabilityRuntimeOk, true);

    const beforeWatch = await watchFolder.stats();
    const beforeScanner = await scanner.stats();
    const beforeWorkers = await worker.stats();
    const beforeWatchCount = beforeWatch.statistics?.totalWatchFolders ?? 0;
    const beforeScannerCount = beforeScanner.statistics?.totalScanners ?? 0;
    const beforeWorkerCount = beforeWorkers.statistics?.totalWorkers ?? 0;

    const received = await upload.receive({ uploadName: "f3-cap-03-no-consume" });
    assert.equal(received.ok, true);
    assert.equal(received.result?.webUploadImplemented, false);
    assert.equal(received.result?.azureBlobImplemented, false);

    const afterWatch = await watchFolder.stats();
    const afterScanner = await scanner.stats();
    const afterWorkers = await worker.stats();
    assert.equal(afterWatch.statistics?.totalWatchFolders ?? 0, beforeWatchCount);
    assert.equal(afterScanner.statistics?.totalScanners ?? 0, beforeScannerCount);
    assert.equal(afterWorkers.statistics?.totalWorkers ?? 0, beforeWorkerCount);
  });
});

describe("F3-CAP-03 ausência de Upload real / storage / bypass", () => {
  it("módulo upload-runtime não referencia backends reais", () => {
    const root = join(repoRoot, "src/lib/enterprise/upload-runtime");
    const files = collectTsFiles(root);
    assert.ok(files.length > 0);

    const forbidden = [
      /from ["']@azure\/storage-blob["']/i,
      /from ["']@supabase\/storage-js["']/i,
      /from ["']@aws-sdk\/client-s3["']/i,
      /from ["']axios["']/,
      /from ["']amqplib["']/,
      /from ["']bullmq["']/,
      /new\s+FormData\s*\(/,
      /multipart\/form-data/i,
      /createClient\s*\(\s*\{[^}]*redis/i,
      /new\s+WebSocket\s*\(/,
      /setInterval\s*\(/,
      /input\s+type=["']file["']/i,
      /webkitdirectory/i,
    ];

    for (const file of files) {
      const src = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        assert.equal(pattern.test(src), false, `${file} matched ${pattern}`);
      }
    }

    const capabilitiesSrc = readFileSync(join(root, "ports/capabilities.ts"), "utf8");
    assert.match(capabilitiesSrc, /webUploadImplemented:\s*false/);
    assert.match(capabilitiesSrc, /desktopUploadImplemented:\s*false/);
    assert.match(capabilitiesSrc, /mobileUploadImplemented:\s*false/);
    assert.match(capabilitiesSrc, /apiUploadImplemented:\s*false/);
    assert.match(capabilitiesSrc, /multipartImplemented:\s*false/);
    assert.match(capabilitiesSrc, /chunkedUploadImplemented:\s*false/);
    assert.match(capabilitiesSrc, /resumableUploadImplemented:\s*false/);
    assert.match(capabilitiesSrc, /azureBlobImplemented:\s*false/);
    assert.match(capabilitiesSrc, /supabaseStorageImplemented:\s*false/);
    assert.match(capabilitiesSrc, /s3Implemented:\s*false/);
    assert.match(capabilitiesSrc, /googleDriveImplemented:\s*false/);
    assert.match(capabilitiesSrc, /oneDriveImplemented:\s*false/);
    assert.match(capabilitiesSrc, /dropboxImplemented:\s*false/);
  });

  it("Enterprise Runtime wiring inclui getUploadRuntimePort e uploadRuntimeOk", () => {
    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.match(enterpriseRuntime, /createUploadRuntimePort/);
    assert.match(enterpriseRuntime, /getUploadRuntimePort/);
    assert.match(enterpriseRuntime, /uploadRuntimeOk/);
  });

  it("Upload Runtime não consome Scanner/WatchFolder/Capture/OCR/Worker nas operações", () => {
    const adapter = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/upload-runtime/adapters/default-upload-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(adapter, /getScannerRuntimePort/);
    assert.match(adapter, /getWatchFolderRuntimePort/);
    assert.match(adapter, /getCaptureEngineRuntimePort/);
    assert.match(adapter, /getOCRRuntimePort/);
    assert.match(adapter, /getWorkerRuntimePort/);
    assert.match(adapter, /getPersistentQueueRuntimePort/);
    assert.equal(/getScannerRuntimePort\(\)\.\w+\s*\(/.test(adapter), false);
    assert.equal(/getWatchFolderRuntimePort\(\)\.\w+\s*\(/.test(adapter), false);
    assert.equal(/getCaptureEngineRuntimePort\(\)\.\w+\s*\(/.test(adapter), false);
    assert.equal(/getOCRRuntimePort\(\)\.\w+\s*\(/.test(adapter), false);
    assert.equal(
      /getWorkerRuntimePort\(\)\.(register|unregister|allocate|release|heartbeat)\s*\(/.test(
        adapter,
      ),
      false,
    );
  });

  it("sem Provider/Adapter/Factory/Registry paralelo", () => {
    const root = join(repoRoot, "src/lib/enterprise/upload-runtime");
    const files = collectTsFiles(root).map((f) => f.replace(/\\/g, "/"));
    assert.ok(files.some((f) => f.endsWith("/providers/create-upload-runtime-port.ts")));
    assert.ok(files.some((f) => f.endsWith("/factory/upload-runtime-factory.ts")));
    assert.ok(files.some((f) => f.endsWith("/registry/upload-runtime-registry.ts")));
    assert.equal(files.filter((f) => f.includes("/factory/")).length, 2);
    assert.equal(files.filter((f) => f.includes("/registry/")).length, 2);
    assert.equal(files.filter((f) => /adapters\/.*upload-runtime-adapter\.ts$/.test(f)).length, 2);
  });
});

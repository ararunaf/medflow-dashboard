#!/usr/bin/env node
/**
 * F3-CAP-02 — Enterprise Watch Folder Runtime
 * Prova: Application → WatchFolderRuntimePort → Adapter → Factory → Registry → Store
 *         + Enterprise Runtime + deps estruturais (Scanner/Capture/OCR/PQR/Scheduler/Worker/Obs)
 *         + register / unregister / discover / openSession / closeSession / observe / stats / health
 *         + ausência de Watch Folder real / FileSystemWatcher / Polling / SMB / UNC / Azure Files
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_WATCH_FOLDER_RUNTIME_PROVIDER_COUNT,
  DEFAULT_WATCH_FOLDER_RUNTIME_ADAPTER_ID,
  DEFAULT_WATCH_FOLDER_RUNTIME_CAPABILITIES,
  DefaultWatchFolderRuntimeAdapter,
  EnterpriseWatchFolderRuntimeAdapter,
  IN_MEMORY_WATCH_FOLDER_RUNTIME_STORE_ID,
  InMemoryWatchFolderRuntimeStore,
  MOCK_WATCH_FOLDER_RUNTIME_ADAPTER_ID,
  MockWatchFolderRuntimeAdapter,
  WATCH_FOLDER_RUNTIME_IDENTITY,
  WatchFolderRuntimeFactory,
  WatchFolderRuntimeProvider,
  WatchFolderRuntimeRegistry,
  createDefaultWatchFolderRuntimeRegistry,
  createWatchFolderRuntimeFactory,
  createWatchFolderRuntimePort,
  getWatchFolderRuntimeFactory,
  getWatchFolderRuntimeHealthSummary,
  getWatchFolderRuntimePort,
  resetWatchFolderRuntimeIdSequences,
  type WatchFolderRuntimePort,
} from "../../../src/lib/enterprise/watch-folder-runtime/index.ts";
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

describe("F3-CAP-02 WatchFolderRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: WatchFolderRuntimePort = new MockWatchFolderRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.status, "ready");
    assert.equal(health.kind, "canonical-watch-folder-health");
    assert.equal(health.runtimeReady, true);
    assert.equal(health.localWatchImplemented, false);
    assert.equal(health.networkWatchImplemented, false);
    assert.equal(health.uncImplemented, false);
    assert.equal(health.smbImplemented, false);
    assert.equal(health.azureFilesImplemented, false);
    assert.equal(health.pollingImplemented, false);
    assert.equal(health.fileSystemWatcherImplemented, false);
    assert.equal(health.recursiveWatchImplemented, false);
    assert.equal(health.changeNotificationImplemented, false);
    assert.equal(health.automaticImportImplemented, false);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_WATCH_FOLDER_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsCanonicalWatchFolder, true);
    assert.equal(caps.usesScannerRuntimePort, true);
    assert.equal(caps.usesCaptureEngineRuntimePort, true);
    assert.equal(caps.usesOCRRuntimePort, true);
    assert.equal(caps.usesPersistentQueueRuntimePort, true);
    assert.equal(caps.usesSchedulerRuntimePort, true);
    assert.equal(caps.usesWorkerRuntimePort, true);
    assert.equal(caps.usesObservabilityRuntimePort, true);
    assert.equal(caps.runtimeReady, true);
    assert.equal(caps.localWatchImplemented, false);
    assert.equal(caps.pollingImplemented, false);
    assert.equal(caps.fileSystemWatcherImplemented, false);
    assert.equal(caps.automaticImportImplemented, false);
    assert.equal(caps.canonical.kind, "canonical-watch-folder-capabilities");
    assert.equal(caps.canonical.localWatchImplemented, false);
  });

  it("DefaultWatchFolderRuntimeAdapter é o adapter enterprise oficial", () => {
    assert.equal(EnterpriseWatchFolderRuntimeAdapter, DefaultWatchFolderRuntimeAdapter);
    const port = new DefaultWatchFolderRuntimeAdapter({
      provider: "enterprise",
    });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_WATCH_FOLDER_RUNTIME_ADAPTER_ID);
  });

  it("identity declara Enterprise Watch Folder Runtime Foundation vendor-agnostic", () => {
    assert.equal(WATCH_FOLDER_RUNTIME_IDENTITY.name, "Enterprise Watch Folder Runtime");
    assert.equal(WATCH_FOLDER_RUNTIME_IDENTITY.layer, "Foundation");
    assert.ok(WATCH_FOLDER_RUNTIME_IDENTITY.version);
    assert.equal(WATCH_FOLDER_RUNTIME_IDENTITY.vendorAgnostic, true);
    const info = createWatchFolderRuntimePort().providerInfo();
    assert.equal(info.metadata.vendorAgnostic, true);
    assert.equal(info.metadata.layer, "Foundation");
  });

  it("provider default resolve enterprise via getWatchFolderRuntimePort", () => {
    const port = createWatchFolderRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(getWatchFolderRuntimePort().providerId, "enterprise");
    assert.equal(WatchFolderRuntimeProvider.create().providerId, "enterprise");
  });

  it("factory resolve mock / test / default / enterprise", () => {
    const factory = createWatchFolderRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(
      getWatchFolderRuntimeFactory().getRegistry().list().length,
      BUILTIN_WATCH_FOLDER_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("register → discover → openSession → observe → closeSession → unregister → stats", async () => {
    resetWatchFolderRuntimeIdSequences();
    const port = createWatchFolderRuntimePort({ provider: "enterprise" });

    const registered = await port.register({
      watchFolderName: "foundation-watch-folder",
      folderPath: "\\\\structural\\path\\opaque",
      correlationId: "corr-f3-cap-02",
    });
    assert.equal(registered.ok, true);
    assert.ok(registered.result?.resultId);
    assert.equal(registered.result?.localWatchImplemented, false);
    assert.equal(registered.result?.fileSystemWatcherImplemented, false);
    assert.equal(registered.result?.automaticImportImplemented, false);
    assert.equal(registered.result?.runtimeReady, true);
    assert.equal(registered.watchFolder?.status, "registered");
    assert.equal(registered.watchFolder?.watchFolderName, "foundation-watch-folder");
    assert.equal(registered.watchFolder?.folderPath, "\\\\structural\\path\\opaque");

    const discovered = await port.discover();
    assert.equal(discovered.ok, true);
    assert.ok((discovered.watchFolders?.length ?? 0) >= 1);
    assert.equal(discovered.result?.pollingImplemented, false);
    assert.equal(discovered.result?.smbImplemented, false);
    assert.equal(discovered.result?.uncImplemented, false);

    const opened = await port.openSession({
      watchFolderId: registered.watchFolder!.watchFolderId,
    });
    assert.equal(opened.ok, true);
    assert.equal(opened.session?.status, "session-open");
    assert.equal(opened.session?.fileSystemWatcherImplemented, false);
    assert.ok(opened.session?.sessionId);

    const observed = await port.observe({
      watchFolderId: registered.watchFolder!.watchFolderId,
      sessionId: opened.session!.sessionId,
    });
    assert.equal(observed.ok, true);
    assert.equal(observed.observation?.status, "observed");
    assert.equal(observed.result?.localWatchImplemented, false);
    assert.equal(observed.result?.changeNotificationImplemented, false);
    assert.ok(observed.observation?.observationId);

    const closed = await port.closeSession({ sessionId: opened.session!.sessionId });
    assert.equal(closed.ok, true);
    assert.equal(closed.session?.status, "session-closed");

    const unregistered = await port.unregister({
      watchFolderId: registered.watchFolder!.watchFolderId,
    });
    assert.equal(unregistered.ok, true);
    assert.equal(unregistered.watchFolder?.status, "unregistered");

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "canonical-watch-folder-statistics");
    assert.equal(stats.statistics?.localWatchImplementedCount, 0);
    assert.equal(stats.statistics?.pollingImplementedCount, 0);
    assert.equal(stats.statistics?.fileSystemWatcherImplementedCount, 0);
    assert.equal(stats.statistics?.automaticImportImplementedCount, 0);
  });

  it("InMemory store oficial e flags estruturais zeradas", () => {
    const store = new InMemoryWatchFolderRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_WATCH_FOLDER_RUNTIME_STORE_ID);
    const stats = store.statistics();
    assert.equal(stats.kind, "canonical-watch-folder-statistics");
    assert.equal(stats.localWatchImplementedCount, 0);
    assert.equal(stats.networkWatchImplementedCount, 0);
    assert.equal(stats.fileSystemWatcherImplementedCount, 0);
    assert.equal(DEFAULT_WATCH_FOLDER_RUNTIME_CAPABILITIES.runtimeReady, true);
    assert.equal(DEFAULT_WATCH_FOLDER_RUNTIME_CAPABILITIES.localWatchImplemented, false);
    assert.equal(DEFAULT_WATCH_FOLDER_RUNTIME_CAPABILITIES.networkWatchImplemented, false);
    assert.equal(DEFAULT_WATCH_FOLDER_RUNTIME_CAPABILITIES.uncImplemented, false);
    assert.equal(DEFAULT_WATCH_FOLDER_RUNTIME_CAPABILITIES.smbImplemented, false);
    assert.equal(DEFAULT_WATCH_FOLDER_RUNTIME_CAPABILITIES.azureFilesImplemented, false);
    assert.equal(DEFAULT_WATCH_FOLDER_RUNTIME_CAPABILITIES.pollingImplemented, false);
    assert.equal(DEFAULT_WATCH_FOLDER_RUNTIME_CAPABILITIES.fileSystemWatcherImplemented, false);
    assert.equal(DEFAULT_WATCH_FOLDER_RUNTIME_CAPABILITIES.recursiveWatchImplemented, false);
    assert.equal(DEFAULT_WATCH_FOLDER_RUNTIME_CAPABILITIES.changeNotificationImplemented, false);
    assert.equal(DEFAULT_WATCH_FOLDER_RUNTIME_CAPABILITIES.automaticImportImplemented, false);
  });

  it("retry recupera falha transitória", async () => {
    const port = new DefaultWatchFolderRuntimeAdapter({
      provider: "enterprise",
      failAttempts: 1,
      defaultRetryCount: 1,
      defaultRetryBackoffMs: 1,
    });
    const result = await port.register({ watchFolderName: "retry-watch-folder" });
    assert.equal(result.ok, true);
    assert.ok((result.telemetry?.attempts ?? 0) >= 2);
  });

  it("AbortSignal cancela operação", async () => {
    const port = createWatchFolderRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.register({
      watchFolderName: "abort-watch-folder",
      signal: controller.signal,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "WATCH_FOLDER_RUNTIME_CANCELLED");
  });

  it("registry/factory sem fallback silencioso", () => {
    const registry = createDefaultWatchFolderRuntimeRegistry();
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.has("mock"), true);
    assert.equal(registry.has("test"), true);
    assert.equal(registry.has("default"), true);
    assert.equal(registry.snapshot().count, BUILTIN_WATCH_FOLDER_RUNTIME_PROVIDER_COUNT);
    assert.ok(registry instanceof WatchFolderRuntimeRegistry);

    const factory = new WatchFolderRuntimeFactory({ registry });
    assert.throws(() => factory.create({ provider: "unknown" as never }), /não está registrado/);
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createWatchFolderRuntimePort({ provider: "enterprise" });
    const summary = await getWatchFolderRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.info.providerType, "WATCH_FOLDER_RUNTIME");
    assert.equal(summary.capabilities.runtimeReady, true);
    assert.equal(summary.capabilities.localWatchImplemented, false);
    assert.equal(summary.capabilities.fileSystemWatcherImplemented, false);
  });
});

describe("F3-CAP-02 cadeia Enterprise / Watch Folder Runtime", () => {
  it("Enterprise Runtime expõe Watch Folder Runtime + health watchFolderRuntimeOk", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    assert.equal(runtime.getWatchFolderRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getScannerRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getCaptureEngineRuntimePort().providerId, "default");
    assert.equal(runtime.getOCRRuntimePort().providerId, "default");
    assert.equal(runtime.getWorkerRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getSchedulerRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getPersistentQueueRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getObservabilityRuntimePort().providerId, "enterprise");

    const caps = runtime.getWatchFolderRuntimePort().capabilities();
    assert.equal(caps.usesScannerRuntimePort, true);
    assert.equal(caps.usesCaptureEngineRuntimePort, true);
    assert.equal(caps.usesOCRRuntimePort, true);
    assert.equal(caps.usesWorkerRuntimePort, true);
    assert.equal(caps.localWatchImplemented, false);

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.watchFolderRuntimeOk, true);
    assert.equal(health.scannerRuntimeOk, true);
    assert.equal(health.captureEngineRuntimeOk, true);
    assert.equal(health.ocrRuntimeOk, true);
  });

  it("Watch Folder Runtime prepara deps sem consumo funcional", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const watchFolder = runtime.getWatchFolderRuntimePort();
    const scanner = runtime.getScannerRuntimePort();
    const worker = runtime.getWorkerRuntimePort();

    const watchHealth = await watchFolder.health();
    assert.equal(watchHealth.ok, true);
    assert.equal(watchHealth.scannerRuntimeOk, true);
    assert.equal(watchHealth.captureEngineRuntimeOk, true);
    assert.equal(watchHealth.ocrRuntimeOk, true);
    assert.equal(watchHealth.persistentQueueRuntimeOk, true);
    assert.equal(watchHealth.schedulerRuntimeOk, true);
    assert.equal(watchHealth.workerRuntimeOk, true);
    assert.equal(watchHealth.observabilityRuntimeOk, true);

    const beforeScanner = await scanner.stats();
    const beforeWorkers = await worker.stats();
    const beforeScannerCount = beforeScanner.statistics?.totalScanners ?? 0;
    const beforeWorkerCount = beforeWorkers.statistics?.totalWorkers ?? 0;

    const observed = await watchFolder.observe({ watchFolderName: "f3-cap-02-no-consume" });
    assert.equal(observed.ok, true);
    assert.equal(observed.result?.localWatchImplemented, false);
    assert.equal(observed.result?.fileSystemWatcherImplemented, false);

    const afterScanner = await scanner.stats();
    const afterWorkers = await worker.stats();
    assert.equal(afterScanner.statistics?.totalScanners ?? 0, beforeScannerCount);
    assert.equal(afterWorkers.statistics?.totalWorkers ?? 0, beforeWorkerCount);
  });
});

describe("F3-CAP-02 ausência de Watch Folder real / watcher / polling / bypass", () => {
  it("módulo watch-folder-runtime não referencia backends reais", () => {
    const root = join(repoRoot, "src/lib/enterprise/watch-folder-runtime");
    const files = collectTsFiles(root);
    assert.ok(files.length > 0);

    const forbidden = [
      /from ["']chokidar["']/i,
      /from ["']fs-watch["']/i,
      /from ["']node-watch["']/i,
      /from ["']axios["']/,
      /from ["']amqplib["']/,
      /from ["']bullmq["']/,
      /new\s+FileSystemWatcher\b/,
      /fs\.watch\s*\(/,
      /fs\.watchFile\s*\(/,
      /createClient\s*\(\s*\{[^}]*redis/i,
      /new\s+WebSocket\s*\(/,
      /setInterval\s*\(/,
    ];

    for (const file of files) {
      const src = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        assert.equal(pattern.test(src), false, `${file} matched ${pattern}`);
      }
    }

    const capabilitiesSrc = readFileSync(join(root, "ports/capabilities.ts"), "utf8");
    assert.match(capabilitiesSrc, /localWatchImplemented:\s*false/);
    assert.match(capabilitiesSrc, /networkWatchImplemented:\s*false/);
    assert.match(capabilitiesSrc, /uncImplemented:\s*false/);
    assert.match(capabilitiesSrc, /smbImplemented:\s*false/);
    assert.match(capabilitiesSrc, /azureFilesImplemented:\s*false/);
    assert.match(capabilitiesSrc, /pollingImplemented:\s*false/);
    assert.match(capabilitiesSrc, /fileSystemWatcherImplemented:\s*false/);
    assert.match(capabilitiesSrc, /recursiveWatchImplemented:\s*false/);
    assert.match(capabilitiesSrc, /changeNotificationImplemented:\s*false/);
    assert.match(capabilitiesSrc, /automaticImportImplemented:\s*false/);
  });

  it("Enterprise Runtime wiring inclui getWatchFolderRuntimePort e watchFolderRuntimeOk", () => {
    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.match(enterpriseRuntime, /createWatchFolderRuntimePort/);
    assert.match(enterpriseRuntime, /getWatchFolderRuntimePort/);
    assert.match(enterpriseRuntime, /watchFolderRuntimeOk/);
  });

  it("Watch Folder Runtime não consome Scanner/Capture/OCR/Worker nas operações", () => {
    const adapter = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/watch-folder-runtime/adapters/default-watch-folder-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(adapter, /getScannerRuntimePort/);
    assert.match(adapter, /getCaptureEngineRuntimePort/);
    assert.match(adapter, /getOCRRuntimePort/);
    assert.match(adapter, /getWorkerRuntimePort/);
    assert.match(adapter, /getPersistentQueueRuntimePort/);
    assert.equal(/getScannerRuntimePort\(\)\.\w+\s*\(/.test(adapter), false);
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
    const root = join(repoRoot, "src/lib/enterprise/watch-folder-runtime");
    const files = collectTsFiles(root).map((f) => f.replace(/\\/g, "/"));
    assert.ok(files.some((f) => f.endsWith("/providers/create-watch-folder-runtime-port.ts")));
    assert.ok(files.some((f) => f.endsWith("/factory/watch-folder-runtime-factory.ts")));
    assert.ok(files.some((f) => f.endsWith("/registry/watch-folder-runtime-registry.ts")));
    assert.equal(files.filter((f) => f.includes("/factory/")).length, 2);
    assert.equal(files.filter((f) => f.includes("/registry/")).length, 2);
    assert.equal(
      files.filter((f) => /adapters\/.*watch-folder-runtime-adapter\.ts$/.test(f)).length,
      2,
    );
  });
});

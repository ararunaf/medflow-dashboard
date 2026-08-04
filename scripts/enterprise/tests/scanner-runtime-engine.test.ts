#!/usr/bin/env node
/**
 * F3-CAP-01 — Enterprise Scanner Runtime
 * Prova: Application → ScannerRuntimePort → Adapter → Factory → Registry → Store
 *         + Enterprise Runtime + deps estruturais (Capture/OCR/Queue/Worker/Scheduler/…)
 *         + register / unregister / discover / openSession / closeSession / acquire / stats / health
 *         + ausência de Scanner real / TWAIN / WIA / ISIS / Drivers / OCR / Upload / Watch Folder
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_SCANNER_RUNTIME_PROVIDER_COUNT,
  DEFAULT_SCANNER_RUNTIME_ADAPTER_ID,
  DEFAULT_SCANNER_RUNTIME_CAPABILITIES,
  DefaultScannerRuntimeAdapter,
  EnterpriseScannerRuntimeAdapter,
  IN_MEMORY_SCANNER_RUNTIME_STORE_ID,
  InMemoryScannerRuntimeStore,
  MOCK_SCANNER_RUNTIME_ADAPTER_ID,
  MockScannerRuntimeAdapter,
  SCANNER_RUNTIME_IDENTITY,
  ScannerRuntimeFactory,
  ScannerRuntimeProvider,
  ScannerRuntimeRegistry,
  createDefaultScannerRuntimeRegistry,
  createScannerRuntimeFactory,
  createScannerRuntimePort,
  getScannerRuntimeFactory,
  getScannerRuntimeHealthSummary,
  getScannerRuntimePort,
  resetScannerRuntimeIdSequences,
  type ScannerRuntimePort,
} from "../../../src/lib/enterprise/scanner-runtime/index.ts";
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

describe("F3-CAP-01 ScannerRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: ScannerRuntimePort = new MockScannerRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.status, "ready");
    assert.equal(health.kind, "canonical-scanner-health");
    assert.equal(health.runtimeReady, true);
    assert.equal(health.scannerImplemented, false);
    assert.equal(health.twainImplemented, false);
    assert.equal(health.wiaImplemented, false);
    assert.equal(health.isisImplemented, false);
    assert.equal(health.networkScannerImplemented, false);
    assert.equal(health.driverImplemented, false);
    assert.equal(health.captureImplemented, false);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_SCANNER_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsCanonicalScanner, true);
    assert.equal(caps.usesCaptureEngineRuntimePort, true);
    assert.equal(caps.usesOCRRuntimePort, true);
    assert.equal(caps.usesQueueRuntimePort, true);
    assert.equal(caps.usesWorkerRuntimePort, true);
    assert.equal(caps.usesSchedulerRuntimePort, true);
    assert.equal(caps.usesPersistentQueueRuntimePort, true);
    assert.equal(caps.usesObservabilityRuntimePort, true);
    assert.equal(caps.usesScalabilityRuntimePort, true);
    assert.equal(caps.usesTISSRuntimePort, true);
    assert.equal(caps.runtimeReady, true);
    assert.equal(caps.scannerImplemented, false);
    assert.equal(caps.twainImplemented, false);
    assert.equal(caps.wiaImplemented, false);
    assert.equal(caps.isisImplemented, false);
    assert.equal(caps.driverImplemented, false);
    assert.equal(caps.captureImplemented, false);
    assert.equal(caps.implementsTwain, false);
    assert.equal(caps.implementsWia, false);
    assert.equal(caps.implementsIsis, false);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.implementsUpload, false);
    assert.equal(caps.implementsWatchFolder, false);
    assert.equal(caps.canonical.kind, "canonical-scanner-capabilities");
    assert.equal(caps.canonical.scannerImplemented, false);
  });

  it("DefaultScannerRuntimeAdapter é o adapter enterprise oficial", () => {
    assert.equal(EnterpriseScannerRuntimeAdapter, DefaultScannerRuntimeAdapter);
    const port = new DefaultScannerRuntimeAdapter({
      provider: "enterprise",
    });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_SCANNER_RUNTIME_ADAPTER_ID);
  });

  it("identity declara Enterprise Scanner Runtime Foundation vendor-agnostic", () => {
    assert.equal(SCANNER_RUNTIME_IDENTITY.name, "Enterprise Scanner Runtime");
    assert.equal(SCANNER_RUNTIME_IDENTITY.layer, "Foundation");
    assert.ok(SCANNER_RUNTIME_IDENTITY.version);
    assert.equal(SCANNER_RUNTIME_IDENTITY.vendorAgnostic, true);
    const info = createScannerRuntimePort().providerInfo();
    assert.equal(info.metadata.vendorAgnostic, true);
    assert.equal(info.metadata.layer, "Foundation");
  });

  it("provider default resolve enterprise via getScannerRuntimePort", () => {
    const port = createScannerRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(getScannerRuntimePort().providerId, "enterprise");
    assert.equal(ScannerRuntimeProvider.create().providerId, "enterprise");
  });

  it("factory resolve mock / test / default / enterprise", () => {
    const factory = createScannerRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(
      getScannerRuntimeFactory().getRegistry().list().length,
      BUILTIN_SCANNER_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("register → discover → openSession → acquire → closeSession → unregister → stats", async () => {
    resetScannerRuntimeIdSequences();
    const port = createScannerRuntimePort({ provider: "enterprise" });

    const registered = await port.register({
      scannerName: "foundation-scanner",
      correlationId: "corr-f3-cap-01",
    });
    assert.equal(registered.ok, true);
    assert.ok(registered.result?.resultId);
    assert.equal(registered.result?.scannerImplemented, false);
    assert.equal(registered.result?.twainImplemented, false);
    assert.equal(registered.result?.captureImplemented, false);
    assert.equal(registered.result?.runtimeReady, true);
    assert.equal(registered.scanner?.status, "registered");
    assert.equal(registered.scanner?.scannerName, "foundation-scanner");

    const discovered = await port.discover();
    assert.equal(discovered.ok, true);
    assert.ok((discovered.scanners?.length ?? 0) >= 1);
    assert.equal(discovered.result?.twainImplemented, false);
    assert.equal(discovered.result?.wiaImplemented, false);
    assert.equal(discovered.result?.isisImplemented, false);

    const opened = await port.openSession({
      scannerId: registered.scanner!.scannerId,
    });
    assert.equal(opened.ok, true);
    assert.equal(opened.session?.status, "session-open");
    assert.equal(opened.session?.driverImplemented, false);
    assert.ok(opened.session?.sessionId);

    const acquired = await port.acquire({
      scannerId: registered.scanner!.scannerId,
      sessionId: opened.session!.sessionId,
    });
    assert.equal(acquired.ok, true);
    assert.equal(acquired.acquisition?.status, "acquired");
    assert.equal(acquired.result?.captureImplemented, false);
    assert.equal(acquired.result?.scannerImplemented, false);
    assert.ok(acquired.acquisition?.acquisitionId);

    const closed = await port.closeSession({ sessionId: opened.session!.sessionId });
    assert.equal(closed.ok, true);
    assert.equal(closed.session?.status, "session-closed");

    const unregistered = await port.unregister({ scannerId: registered.scanner!.scannerId });
    assert.equal(unregistered.ok, true);
    assert.equal(unregistered.scanner?.status, "unregistered");

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "canonical-scanner-statistics");
    assert.equal(stats.statistics?.scannerImplementedCount, 0);
    assert.equal(stats.statistics?.twainImplementedCount, 0);
    assert.equal(stats.statistics?.wiaImplementedCount, 0);
    assert.equal(stats.statistics?.isisImplementedCount, 0);
    assert.equal(stats.statistics?.driverImplementedCount, 0);
    assert.equal(stats.statistics?.captureImplementedCount, 0);
  });

  it("InMemory store oficial e flags estruturais zeradas", () => {
    const store = new InMemoryScannerRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_SCANNER_RUNTIME_STORE_ID);
    const stats = store.statistics();
    assert.equal(stats.kind, "canonical-scanner-statistics");
    assert.equal(stats.scannerImplementedCount, 0);
    assert.equal(stats.twainImplementedCount, 0);
    assert.equal(stats.captureImplementedCount, 0);
    assert.equal(DEFAULT_SCANNER_RUNTIME_CAPABILITIES.runtimeReady, true);
    assert.equal(DEFAULT_SCANNER_RUNTIME_CAPABILITIES.scannerImplemented, false);
    assert.equal(DEFAULT_SCANNER_RUNTIME_CAPABILITIES.twainImplemented, false);
    assert.equal(DEFAULT_SCANNER_RUNTIME_CAPABILITIES.wiaImplemented, false);
    assert.equal(DEFAULT_SCANNER_RUNTIME_CAPABILITIES.isisImplemented, false);
    assert.equal(DEFAULT_SCANNER_RUNTIME_CAPABILITIES.networkScannerImplemented, false);
    assert.equal(DEFAULT_SCANNER_RUNTIME_CAPABILITIES.driverImplemented, false);
    assert.equal(DEFAULT_SCANNER_RUNTIME_CAPABILITIES.captureImplemented, false);
  });

  it("retry recupera falha transitória", async () => {
    const port = new DefaultScannerRuntimeAdapter({
      provider: "enterprise",
      failAttempts: 1,
      defaultRetryCount: 1,
      defaultRetryBackoffMs: 1,
    });
    const result = await port.register({ scannerName: "retry-scanner" });
    assert.equal(result.ok, true);
    assert.ok((result.telemetry?.attempts ?? 0) >= 2);
  });

  it("AbortSignal cancela operação", async () => {
    const port = createScannerRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.register({
      scannerName: "abort-scanner",
      signal: controller.signal,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "SCANNER_RUNTIME_CANCELLED");
  });

  it("registry/factory sem fallback silencioso", () => {
    const registry = createDefaultScannerRuntimeRegistry();
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.has("mock"), true);
    assert.equal(registry.has("test"), true);
    assert.equal(registry.has("default"), true);
    assert.equal(registry.snapshot().count, BUILTIN_SCANNER_RUNTIME_PROVIDER_COUNT);
    assert.ok(registry instanceof ScannerRuntimeRegistry);

    const factory = new ScannerRuntimeFactory({ registry });
    assert.throws(() => factory.create({ provider: "unknown" as never }), /não está registrado/);
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createScannerRuntimePort({ provider: "enterprise" });
    const summary = await getScannerRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.info.providerType, "SCANNER_RUNTIME");
    assert.equal(summary.capabilities.runtimeReady, true);
    assert.equal(summary.capabilities.scannerImplemented, false);
    assert.equal(summary.capabilities.twainImplemented, false);
  });
});

describe("F3-CAP-01 cadeia Enterprise / Scanner Runtime", () => {
  it("Enterprise Runtime expõe Scanner Runtime + health scannerRuntimeOk", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    assert.equal(runtime.getScannerRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getCaptureEngineRuntimePort().providerId, "default");
    assert.equal(runtime.getOCRRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getQueueRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getWorkerRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getSchedulerRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getPersistentQueueRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getObservabilityRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getScalabilityRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getTISSRuntimePort().providerId, "default");

    const caps = runtime.getScannerRuntimePort().capabilities();
    assert.equal(caps.usesCaptureEngineRuntimePort, true);
    assert.equal(caps.usesOCRRuntimePort, true);
    assert.equal(caps.usesQueueRuntimePort, true);
    assert.equal(caps.usesWorkerRuntimePort, true);
    assert.equal(caps.usesTISSRuntimePort, true);
    assert.equal(caps.scannerImplemented, false);

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.scannerRuntimeOk, true);
    assert.equal(health.captureEngineRuntimeOk, true);
    assert.equal(health.ocrRuntimeOk, true);
    assert.equal(health.queueRuntimeOk, true);
    assert.equal(health.tissRuntimeOk, true);
  });

  it("Scanner Runtime prepara deps sem consumo funcional", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const scanner = runtime.getScannerRuntimePort();
    const queue = runtime.getQueueRuntimePort();
    const worker = runtime.getWorkerRuntimePort();

    const scannerHealth = await scanner.health();
    assert.equal(scannerHealth.ok, true);
    assert.equal(scannerHealth.captureEngineRuntimeOk, true);
    assert.equal(scannerHealth.ocrRuntimeOk, true);
    assert.equal(scannerHealth.queueRuntimeOk, true);
    assert.equal(scannerHealth.workerRuntimeOk, true);
    assert.equal(scannerHealth.schedulerRuntimeOk, true);
    assert.equal(scannerHealth.persistentQueueRuntimeOk, true);
    assert.equal(scannerHealth.observabilityRuntimeOk, true);
    assert.equal(scannerHealth.scalabilityRuntimeOk, true);
    assert.equal(scannerHealth.tissRuntimeOk, true);

    const beforeQueue = await queue.stats();
    const beforeWorkers = await worker.stats();
    const beforeQueueCount = beforeQueue.statistics?.totalMessages ?? 0;
    const beforeWorkerCount = beforeWorkers.statistics?.totalWorkers ?? 0;

    const acquired = await scanner.acquire({ scannerName: "f3-cap-01-no-consume" });
    assert.equal(acquired.ok, true);
    assert.equal(acquired.result?.captureImplemented, false);
    assert.equal(acquired.result?.scannerImplemented, false);

    const afterQueue = await queue.stats();
    const afterWorkers = await worker.stats();
    assert.equal(afterQueue.statistics?.totalMessages ?? 0, beforeQueueCount);
    assert.equal(afterWorkers.statistics?.totalWorkers ?? 0, beforeWorkerCount);
  });
});

describe("F3-CAP-01 ausência de Scanner real / drivers / OCR / bypass", () => {
  it("módulo scanner-runtime não referencia drivers/backends reais", () => {
    const root = join(repoRoot, "src/lib/enterprise/scanner-runtime");
    const files = collectTsFiles(root);
    assert.ok(files.length > 0);

    const forbidden = [
      /from ["']twain["']/i,
      /from ["']wia["']/i,
      /from ["']isis["']/i,
      /from ["']node-hid["']/,
      /from ["']usb["']/,
      /from ["']axios["']/,
      /from ["']amqplib["']/,
      /from ["']bullmq["']/,
      /TWAIN_DSM|twain\.dll|wia\.dll/i,
      /navigator\.mediaDevices/,
      /getUserMedia\s*\(/,
      /createClient\s*\(\s*\{[^}]*redis/i,
      /new\s+WebSocket\s*\(/,
    ];

    for (const file of files) {
      const src = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        assert.equal(pattern.test(src), false, `${file} matched ${pattern}`);
      }
    }

    const capabilitiesSrc = readFileSync(
      join(root, "ports/capabilities.ts"),
      "utf8",
    );
    assert.match(capabilitiesSrc, /scannerImplemented:\s*false/);
    assert.match(capabilitiesSrc, /twainImplemented:\s*false/);
    assert.match(capabilitiesSrc, /wiaImplemented:\s*false/);
    assert.match(capabilitiesSrc, /isisImplemented:\s*false/);
    assert.match(capabilitiesSrc, /networkScannerImplemented:\s*false/);
    assert.match(capabilitiesSrc, /driverImplemented:\s*false/);
    assert.match(capabilitiesSrc, /captureImplemented:\s*false/);
  });

  it("Enterprise Runtime wiring inclui getScannerRuntimePort e scannerRuntimeOk", () => {
    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.match(enterpriseRuntime, /createScannerRuntimePort/);
    assert.match(enterpriseRuntime, /getScannerRuntimePort/);
    assert.match(enterpriseRuntime, /scannerRuntimeOk/);
  });

  it("Scanner Runtime não consome Capture/OCR/Queue/Worker nas operações", () => {
    const adapter = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/scanner-runtime/adapters/default-scanner-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(adapter, /getCaptureEngineRuntimePort/);
    assert.match(adapter, /getOCRRuntimePort/);
    assert.match(adapter, /getQueueRuntimePort/);
    assert.match(adapter, /getWorkerRuntimePort/);
    assert.match(adapter, /getTISSRuntimePort/);
    assert.equal(
      /getCaptureEngineRuntimePort\(\)\.\w+\s*\(/.test(adapter),
      false,
    );
    assert.equal(/getOCRRuntimePort\(\)\.\w+\s*\(/.test(adapter), false);
    assert.equal(
      /getQueueRuntimePort\(\)\.(enqueue|dequeue|peek|ack|nack|purge)\s*\(/.test(adapter),
      false,
    );
    assert.equal(
      /getWorkerRuntimePort\(\)\.(register|unregister|allocate|release|heartbeat)\s*\(/.test(
        adapter,
      ),
      false,
    );
  });

  it("sem Provider/Adapter/Factory/Registry paralelo", () => {
    const root = join(repoRoot, "src/lib/enterprise/scanner-runtime");
    const files = collectTsFiles(root).map((f) => f.replace(/\\/g, "/"));
    assert.ok(files.some((f) => f.endsWith("/providers/create-scanner-runtime-port.ts")));
    assert.ok(files.some((f) => f.endsWith("/factory/scanner-runtime-factory.ts")));
    assert.ok(files.some((f) => f.endsWith("/registry/scanner-runtime-registry.ts")));
    assert.equal(files.filter((f) => f.includes("/factory/")).length, 2);
    assert.equal(files.filter((f) => f.includes("/registry/")).length, 2);
    assert.equal(
      files.filter((f) => /adapters\/.*scanner-runtime-adapter\.ts$/.test(f)).length,
      2,
    );
  });
});

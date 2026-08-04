#!/usr/bin/env node
/**
 * F3-CAP-04 — Enterprise Intelligent Capture Runtime
 * Prova: Application → IntelligentCaptureRuntimePort → Adapter → Factory → Registry → Store
 *         + Enterprise Runtime + deps estruturais (Scanner/WatchFolder/Upload/OCR/PQR/Scheduler/Worker/Obs)
 *         + registerSource / unregisterSource / discoverSources / openRequest / closeRequest / route / envelope / stats / health
 *         + ausência de OCR / IA / Pipeline / captura automática / leitura de arquivos / processamento documental
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_INTELLIGENT_CAPTURE_RUNTIME_PROVIDER_COUNT,
  DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_ADAPTER_ID,
  DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES,
  DefaultIntelligentCaptureRuntimeAdapter,
  EnterpriseIntelligentCaptureRuntimeAdapter,
  IN_MEMORY_INTELLIGENT_CAPTURE_RUNTIME_STORE_ID,
  InMemoryIntelligentCaptureRuntimeStore,
  MOCK_INTELLIGENT_CAPTURE_RUNTIME_ADAPTER_ID,
  MockIntelligentCaptureRuntimeAdapter,
  INTELLIGENT_CAPTURE_RUNTIME_IDENTITY,
  IntelligentCaptureRuntimeFactory,
  IntelligentCaptureRuntimeProvider,
  IntelligentCaptureRuntimeRegistry,
  createDefaultIntelligentCaptureRuntimeRegistry,
  createIntelligentCaptureRuntimeFactory,
  createIntelligentCaptureRuntimePort,
  getIntelligentCaptureRuntimeFactory,
  getIntelligentCaptureRuntimeHealthSummary,
  getIntelligentCaptureRuntimePort,
  resetIntelligentCaptureRuntimeIdSequences,
  type IntelligentCaptureRuntimePort,
} from "../../../src/lib/enterprise/intelligent-capture-runtime/index.ts";
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

describe("F3-CAP-04 IntelligentCaptureRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: IntelligentCaptureRuntimePort = new MockIntelligentCaptureRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.status, "ready");
    assert.equal(health.kind, "canonical-capture-health");
    assert.equal(health.runtimeReady, true);
    assert.equal(health.scannerIntegrationImplemented, false);
    assert.equal(health.watchFolderIntegrationImplemented, false);
    assert.equal(health.uploadIntegrationImplemented, false);
    assert.equal(health.capturePipelineImplemented, false);
    assert.equal(health.documentRoutingImplemented, false);
    assert.equal(health.automaticSelectionImplemented, false);
    assert.equal(health.automaticCaptureImplemented, false);
    assert.equal(health.ocrPipelineImplemented, false);
    assert.equal(health.classificationPipelineImplemented, false);
    assert.equal(health.processingPipelineImplemented, false);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_INTELLIGENT_CAPTURE_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsCanonicalCapture, true);
    assert.equal(caps.usesScannerRuntimePort, true);
    assert.equal(caps.usesWatchFolderRuntimePort, true);
    assert.equal(caps.usesUploadRuntimePort, true);
    assert.equal(caps.usesOCRRuntimePort, true);
    assert.equal(caps.usesPersistentQueueRuntimePort, true);
    assert.equal(caps.usesSchedulerRuntimePort, true);
    assert.equal(caps.usesWorkerRuntimePort, true);
    assert.equal(caps.usesObservabilityRuntimePort, true);
    assert.equal(caps.runtimeReady, true);
    assert.equal(caps.scannerIntegrationImplemented, false);
    assert.equal(caps.automaticCaptureImplemented, false);
    assert.equal(caps.ocrPipelineImplemented, false);
    assert.equal(caps.canonical.kind, "canonical-capture-capabilities");
    assert.equal(caps.canonical.processingPipelineImplemented, false);
  });

  it("DefaultIntelligentCaptureRuntimeAdapter é o adapter enterprise oficial", () => {
    assert.equal(
      EnterpriseIntelligentCaptureRuntimeAdapter,
      DefaultIntelligentCaptureRuntimeAdapter,
    );
    const port = new DefaultIntelligentCaptureRuntimeAdapter({
      provider: "enterprise",
    });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_ADAPTER_ID);
  });

  it("identity declara Enterprise Intelligent Capture Runtime Foundation vendor-agnostic", () => {
    assert.equal(INTELLIGENT_CAPTURE_RUNTIME_IDENTITY.name, "Enterprise Intelligent Capture Runtime");
    assert.equal(INTELLIGENT_CAPTURE_RUNTIME_IDENTITY.layer, "Foundation");
    assert.ok(INTELLIGENT_CAPTURE_RUNTIME_IDENTITY.version);
    assert.equal(INTELLIGENT_CAPTURE_RUNTIME_IDENTITY.vendorAgnostic, true);
    const info = createIntelligentCaptureRuntimePort().providerInfo();
    assert.equal(info.metadata.vendorAgnostic, true);
    assert.equal(info.metadata.layer, "Foundation");
  });

  it("provider default resolve enterprise via getIntelligentCaptureRuntimePort", () => {
    const port = createIntelligentCaptureRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(getIntelligentCaptureRuntimePort().providerId, "enterprise");
    assert.equal(IntelligentCaptureRuntimeProvider.create().providerId, "enterprise");
  });

  it("factory resolve mock / test / default / enterprise", () => {
    const factory = createIntelligentCaptureRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(
      getIntelligentCaptureRuntimeFactory().getRegistry().list().length,
      BUILTIN_INTELLIGENT_CAPTURE_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("registerSource → discoverSources → openRequest → route → envelope → closeRequest → unregisterSource → stats", async () => {
    resetIntelligentCaptureRuntimeIdSequences();
    const port = createIntelligentCaptureRuntimePort({ provider: "enterprise" });

    const registered = await port.registerSource({
      sourceName: "foundation-capture-source",
      origin: "scanner",
      channel: "scanner",
      correlationId: "corr-f3-cap-04",
    });
    assert.equal(registered.ok, true);
    assert.ok(registered.result?.resultId);
    assert.equal(registered.result?.scannerIntegrationImplemented, false);
    assert.equal(registered.result?.automaticCaptureImplemented, false);
    assert.equal(registered.result?.ocrPipelineImplemented, false);
    assert.equal(registered.result?.runtimeReady, true);
    assert.equal(registered.source?.status, "registered");
    assert.equal(registered.source?.sourceName, "foundation-capture-source");
    assert.equal(registered.source?.origin, "scanner");

    const discovered = await port.discoverSources();
    assert.equal(discovered.ok, true);
    assert.ok((discovered.sources?.length ?? 0) >= 1);
    assert.equal(discovered.result?.capturePipelineImplemented, false);
    assert.equal(discovered.result?.documentRoutingImplemented, false);

    const opened = await port.openRequest({
      sourceId: registered.source!.sourceId,
    });
    assert.equal(opened.ok, true);
    assert.equal(opened.request?.status, "request-open");
    assert.equal(opened.request?.automaticSelectionImplemented, false);
    assert.ok(opened.request?.requestId);

    const routed = await port.route({
      sourceId: registered.source!.sourceId,
      captureRequestId: opened.request!.requestId,
      targetRuntime: "scanner",
    });
    assert.equal(routed.ok, true);
    assert.equal(routed.route?.status, "routed");
    assert.equal(routed.route?.targetRuntime, "scanner");
    assert.equal(routed.result?.processingPipelineImplemented, false);
    assert.ok(routed.route?.routeId);

    const enveloped = await port.envelope({
      sourceId: registered.source!.sourceId,
      captureRequestId: opened.request!.requestId,
      routeId: routed.route!.routeId,
    });
    assert.equal(enveloped.ok, true);
    assert.equal(enveloped.envelope?.status, "enveloped");
    assert.equal(enveloped.result?.classificationPipelineImplemented, false);
    assert.ok(enveloped.envelope?.envelopeId);

    const closed = await port.closeRequest({ captureRequestId: opened.request!.requestId });
    assert.equal(closed.ok, true);
    assert.equal(closed.request?.status, "request-closed");

    const unregistered = await port.unregisterSource({
      sourceId: registered.source!.sourceId,
    });
    assert.equal(unregistered.ok, true);
    assert.equal(unregistered.source?.status, "unregistered");

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "canonical-capture-statistics");
    assert.equal(stats.statistics?.scannerIntegrationImplementedCount, 0);
    assert.equal(stats.statistics?.automaticCaptureImplementedCount, 0);
    assert.equal(stats.statistics?.ocrPipelineImplementedCount, 0);
  });

  it("InMemory store oficial e flags estruturais zeradas", () => {
    const store = new InMemoryIntelligentCaptureRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_INTELLIGENT_CAPTURE_RUNTIME_STORE_ID);
    const stats = store.statistics();
    assert.equal(stats.kind, "canonical-capture-statistics");
    assert.equal(stats.scannerIntegrationImplementedCount, 0);
    assert.equal(stats.watchFolderIntegrationImplementedCount, 0);
    assert.equal(stats.uploadIntegrationImplementedCount, 0);
    assert.equal(DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES.runtimeReady, true);
    assert.equal(DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES.scannerIntegrationImplemented, false);
    assert.equal(
      DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES.watchFolderIntegrationImplemented,
      false,
    );
    assert.equal(DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES.uploadIntegrationImplemented, false);
    assert.equal(DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES.capturePipelineImplemented, false);
    assert.equal(DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES.documentRoutingImplemented, false);
    assert.equal(
      DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES.automaticSelectionImplemented,
      false,
    );
    assert.equal(DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES.automaticCaptureImplemented, false);
    assert.equal(DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES.ocrPipelineImplemented, false);
    assert.equal(
      DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES.classificationPipelineImplemented,
      false,
    );
    assert.equal(
      DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES.processingPipelineImplemented,
      false,
    );
  });

  it("retry recupera falha transitória", async () => {
    const port = new DefaultIntelligentCaptureRuntimeAdapter({
      provider: "enterprise",
      failAttempts: 1,
      defaultRetryCount: 1,
      defaultRetryBackoffMs: 1,
    });
    const result = await port.registerSource({ sourceName: "retry-source" });
    assert.equal(result.ok, true);
    assert.ok((result.telemetry?.attempts ?? 0) >= 2);
  });

  it("AbortSignal cancela operação", async () => {
    const port = createIntelligentCaptureRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.registerSource({
      sourceName: "abort-source",
      signal: controller.signal,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "INTELLIGENT_CAPTURE_RUNTIME_CANCELLED");
  });

  it("registry/factory sem fallback silencioso", () => {
    const registry = createDefaultIntelligentCaptureRuntimeRegistry();
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.has("mock"), true);
    assert.equal(registry.has("test"), true);
    assert.equal(registry.has("default"), true);
    assert.equal(registry.snapshot().count, BUILTIN_INTELLIGENT_CAPTURE_RUNTIME_PROVIDER_COUNT);
    assert.ok(registry instanceof IntelligentCaptureRuntimeRegistry);

    const factory = new IntelligentCaptureRuntimeFactory({ registry });
    assert.throws(() => factory.create({ provider: "unknown" as never }), /não está registrado/);
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createIntelligentCaptureRuntimePort({ provider: "enterprise" });
    const summary = await getIntelligentCaptureRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.info.providerType, "INTELLIGENT_CAPTURE_RUNTIME");
    assert.equal(summary.capabilities.runtimeReady, true);
    assert.equal(summary.capabilities.scannerIntegrationImplemented, false);
    assert.equal(summary.capabilities.automaticCaptureImplemented, false);
  });
});

describe("F3-CAP-04 cadeia Enterprise / Intelligent Capture Runtime", () => {
  it("Enterprise Runtime expõe Intelligent Capture Runtime + health intelligentCaptureRuntimeOk", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    assert.equal(runtime.getIntelligentCaptureRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getUploadRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getWatchFolderRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getScannerRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getOCRRuntimePort().providerId, "default");
    assert.equal(runtime.getWorkerRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getSchedulerRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getPersistentQueueRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getObservabilityRuntimePort().providerId, "enterprise");

    const caps = runtime.getIntelligentCaptureRuntimePort().capabilities();
    assert.equal(caps.usesScannerRuntimePort, true);
    assert.equal(caps.usesWatchFolderRuntimePort, true);
    assert.equal(caps.usesUploadRuntimePort, true);
    assert.equal(caps.usesOCRRuntimePort, true);
    assert.equal(caps.usesWorkerRuntimePort, true);
    assert.equal(caps.scannerIntegrationImplemented, false);
    assert.equal(caps.automaticCaptureImplemented, false);

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.intelligentCaptureRuntimeOk, true);
    assert.equal(health.uploadRuntimeOk, true);
    assert.equal(health.watchFolderRuntimeOk, true);
    assert.equal(health.scannerRuntimeOk, true);
    assert.equal(health.ocrRuntimeOk, true);
  });

  it("Intelligent Capture Runtime prepara deps sem consumo funcional", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const intelligentCapture = runtime.getIntelligentCaptureRuntimePort();
    const upload = runtime.getUploadRuntimePort();
    const watchFolder = runtime.getWatchFolderRuntimePort();
    const scanner = runtime.getScannerRuntimePort();
    const worker = runtime.getWorkerRuntimePort();

    const icHealth = await intelligentCapture.health();
    assert.equal(icHealth.ok, true);
    assert.equal(icHealth.scannerRuntimeOk, true);
    assert.equal(icHealth.watchFolderRuntimeOk, true);
    assert.equal(icHealth.uploadRuntimeOk, true);
    assert.equal(icHealth.ocrRuntimeOk, true);
    assert.equal(icHealth.persistentQueueRuntimeOk, true);
    assert.equal(icHealth.schedulerRuntimeOk, true);
    assert.equal(icHealth.workerRuntimeOk, true);
    assert.equal(icHealth.observabilityRuntimeOk, true);

    const beforeUpload = await upload.stats();
    const beforeWatch = await watchFolder.stats();
    const beforeScanner = await scanner.stats();
    const beforeWorkers = await worker.stats();
    const beforeUploadCount = beforeUpload.statistics?.totalUploads ?? 0;
    const beforeWatchCount = beforeWatch.statistics?.totalWatchFolders ?? 0;
    const beforeScannerCount = beforeScanner.statistics?.totalScanners ?? 0;
    const beforeWorkerCount = beforeWorkers.statistics?.totalWorkers ?? 0;

    const routed = await intelligentCapture.route({
      sourceName: "f3-cap-04-no-consume",
      origin: "upload",
      channel: "upload",
      targetRuntime: "upload",
    });
    assert.equal(routed.ok, true);
    assert.equal(routed.result?.uploadIntegrationImplemented, false);
    assert.equal(routed.result?.automaticCaptureImplemented, false);

    const afterUpload = await upload.stats();
    const afterWatch = await watchFolder.stats();
    const afterScanner = await scanner.stats();
    const afterWorkers = await worker.stats();
    assert.equal(afterUpload.statistics?.totalUploads ?? 0, beforeUploadCount);
    assert.equal(afterWatch.statistics?.totalWatchFolders ?? 0, beforeWatchCount);
    assert.equal(afterScanner.statistics?.totalScanners ?? 0, beforeScannerCount);
    assert.equal(afterWorkers.statistics?.totalWorkers ?? 0, beforeWorkerCount);
  });
});

describe("F3-CAP-04 ausência de OCR / IA / Pipeline / captura automática", () => {
  it("módulo intelligent-capture-runtime não referencia backends reais / OCR / IA", () => {
    const root = join(repoRoot, "src/lib/enterprise/intelligent-capture-runtime");
    const files = collectTsFiles(root);
    assert.ok(files.length > 0);

    const forbidden = [
      /from ["']tesseract/i,
      /from ["']openai["']/,
      /from ["']@azure\/ai-form-recognizer["']/i,
      /from ["']axios["']/,
      /from ["']amqplib["']/,
      /from ["']bullmq["']/,
      /new\s+FormData\s*\(/,
      /createClient\s*\(\s*\{[^}]*redis/i,
      /new\s+WebSocket\s*\(/,
      /setInterval\s*\(/,
      /fs\.readFile/i,
      /fs\.promises\.readFile/i,
      /createReadStream\s*\(/,
      /FileSystemWatcher/i,
      /TWAIN/i,
      /webkitdirectory/i,
    ];

    for (const file of files) {
      const src = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        assert.equal(pattern.test(src), false, `${file} matched ${pattern}`);
      }
    }

    const capabilitiesSrc = readFileSync(join(root, "ports/capabilities.ts"), "utf8");
    assert.match(capabilitiesSrc, /scannerIntegrationImplemented:\s*false/);
    assert.match(capabilitiesSrc, /watchFolderIntegrationImplemented:\s*false/);
    assert.match(capabilitiesSrc, /uploadIntegrationImplemented:\s*false/);
    assert.match(capabilitiesSrc, /capturePipelineImplemented:\s*false/);
    assert.match(capabilitiesSrc, /documentRoutingImplemented:\s*false/);
    assert.match(capabilitiesSrc, /automaticSelectionImplemented:\s*false/);
    assert.match(capabilitiesSrc, /automaticCaptureImplemented:\s*false/);
    assert.match(capabilitiesSrc, /ocrPipelineImplemented:\s*false/);
    assert.match(capabilitiesSrc, /classificationPipelineImplemented:\s*false/);
    assert.match(capabilitiesSrc, /processingPipelineImplemented:\s*false/);
  });

  it("Enterprise Runtime wiring inclui getIntelligentCaptureRuntimePort e intelligentCaptureRuntimeOk", () => {
    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.match(enterpriseRuntime, /createIntelligentCaptureRuntimePort/);
    assert.match(enterpriseRuntime, /getIntelligentCaptureRuntimePort/);
    assert.match(enterpriseRuntime, /intelligentCaptureRuntimeOk/);
  });

  it("Intelligent Capture Runtime não consome Scanner/WatchFolder/Upload/OCR/Worker nas operações", () => {
    const adapter = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/intelligent-capture-runtime/adapters/default-intelligent-capture-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(adapter, /getScannerRuntimePort/);
    assert.match(adapter, /getWatchFolderRuntimePort/);
    assert.match(adapter, /getUploadRuntimePort/);
    assert.match(adapter, /getOCRRuntimePort/);
    assert.match(adapter, /getWorkerRuntimePort/);
    assert.match(adapter, /getPersistentQueueRuntimePort/);
    assert.equal(/getScannerRuntimePort\(\)\.\w+\s*\(/.test(adapter), false);
    assert.equal(/getWatchFolderRuntimePort\(\)\.\w+\s*\(/.test(adapter), false);
    assert.equal(/getUploadRuntimePort\(\)\.\w+\s*\(/.test(adapter), false);
    assert.equal(/getOCRRuntimePort\(\)\.\w+\s*\(/.test(adapter), false);
    assert.equal(
      /getWorkerRuntimePort\(\)\.(register|unregister|allocate|release|heartbeat)\s*\(/.test(
        adapter,
      ),
      false,
    );
  });

  it("sem Provider/Adapter/Factory/Registry paralelo", () => {
    const root = join(repoRoot, "src/lib/enterprise/intelligent-capture-runtime");
    const files = collectTsFiles(root).map((f) => f.replace(/\\/g, "/"));
    assert.ok(
      files.some((f) => f.endsWith("/providers/create-intelligent-capture-runtime-port.ts")),
    );
    assert.ok(files.some((f) => f.endsWith("/factory/intelligent-capture-runtime-factory.ts")));
    assert.ok(files.some((f) => f.endsWith("/registry/intelligent-capture-runtime-registry.ts")));
    assert.equal(files.filter((f) => f.includes("/factory/")).length, 2);
    assert.equal(files.filter((f) => f.includes("/registry/")).length, 2);
    assert.equal(
      files.filter((f) => /adapters\/.*intelligent-capture-runtime-adapter\.ts$/.test(f)).length,
      2,
    );
  });
});

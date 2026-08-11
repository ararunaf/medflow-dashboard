#!/usr/bin/env node
/**
 * INF-09 — Enterprise Observability Runtime
 * Prova: Application → ObservabilityRuntimePort → Adapter → Factory → Registry → Store
 *         + Enterprise Runtime + Queue / Worker / Scheduler / Persistent Queue / TISS Runtime (deps preparadas sem consumo)
 *         + register / unregister / observe / release / list / stats / health
 *         + ausência de OpenTelemetry / App Insights / Prometheus / Grafana / logs/métricas/tracing reais
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_OBSERVABILITY_RUNTIME_PROVIDER_COUNT,
  DEFAULT_OBSERVABILITY_RUNTIME_ADAPTER_ID,
  DEFAULT_OBSERVABILITY_RUNTIME_CAPABILITIES,
  DefaultObservabilityRuntimeAdapter,
  EnterpriseObservabilityRuntimeAdapter,
  IN_MEMORY_OBSERVABILITY_RUNTIME_STORE_ID,
  InMemoryObservabilityRuntimeStore,
  MOCK_OBSERVABILITY_RUNTIME_ADAPTER_ID,
  MockObservabilityRuntimeAdapter,
  ObservabilityRuntimeFactory,
  ObservabilityRuntimeProvider,
  ObservabilityRuntimeRegistry,
  createDefaultObservabilityRuntimeRegistry,
  createObservabilityRuntimeFactory,
  createObservabilityRuntimePort,
  getObservabilityRuntimeFactory,
  getObservabilityRuntimeHealthSummary,
  resetObservabilityRuntimeIdSequences,
  type ObservabilityRuntimePort,
} from "../../../src/lib/enterprise/observability-runtime/index.ts";
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

describe("INF-09 ObservabilityRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: ObservabilityRuntimePort = new MockObservabilityRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.status, "ready");
    assert.equal(health.kind, "canonical-observability-health");
    assert.equal(health.runtimeReady, true);
    assert.equal(health.realObservabilityBackend, false);
    assert.equal(health.openTelemetryImplemented, false);
    assert.equal(health.applicationInsightsImplemented, false);
    assert.equal(health.prometheusImplemented, false);
    assert.equal(health.grafanaImplemented, false);
    assert.equal(health.realLogsImplemented, false);
    assert.equal(health.realMetricsImplemented, false);
    assert.equal(health.realTracingImplemented, false);
    assert.equal(health.distributedTracingImplemented, false);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_OBSERVABILITY_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsCanonicalObservability, true);
    assert.equal(caps.usesQueueRuntimePort, true);
    assert.equal(caps.usesWorkerRuntimePort, true);
    assert.equal(caps.usesSchedulerRuntimePort, true);
    assert.equal(caps.usesPersistentQueueRuntimePort, true);
    assert.equal(caps.usesTISSRuntimePort, true);
    assert.equal(caps.runtimeReady, true);
    assert.equal(caps.realObservabilityBackend, false);
    assert.equal(caps.implementsRealObservabilityBackend, false);
    assert.equal(caps.implementsOpenTelemetry, false);
    assert.equal(caps.implementsApplicationInsights, false);
    assert.equal(caps.implementsPrometheus, false);
    assert.equal(caps.implementsGrafana, false);
    assert.equal(caps.implementsRealLogs, false);
    assert.equal(caps.implementsRealMetrics, false);
    assert.equal(caps.implementsRealTracing, false);
    assert.equal(caps.implementsDistributedTracing, false);
    assert.equal(caps.canonical.kind, "canonical-observability-capabilities");
    assert.equal(caps.canonical.runtimeReady, true);
    assert.equal(caps.canonical.realObservabilityBackend, false);
  });

  it("DefaultObservabilityRuntimeAdapter é o adapter enterprise oficial", () => {
    assert.equal(EnterpriseObservabilityRuntimeAdapter, DefaultObservabilityRuntimeAdapter);
    const port = new DefaultObservabilityRuntimeAdapter({
      provider: "enterprise",
    });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_OBSERVABILITY_RUNTIME_ADAPTER_ID);
  });

  it("provider default resolve enterprise", () => {
    const port = createObservabilityRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(ObservabilityRuntimeProvider.create().providerId, "enterprise");
  });

  it("factory resolve mock / test / default / enterprise", () => {
    const factory = createObservabilityRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(
      getObservabilityRuntimeFactory().getRegistry().list().length,
      BUILTIN_OBSERVABILITY_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("register → observe → list → release → unregister → stats com flags estruturais", async () => {
    resetObservabilityRuntimeIdSequences();
    const port = createObservabilityRuntimePort({ provider: "enterprise" });

    const registered = await port.register({
      scopeName: "foundation-observability-scope",
      correlationId: "corr-inf-09",
    });
    assert.equal(registered.ok, true);
    assert.ok(registered.result?.resultId);
    assert.equal(registered.result?.realObservabilityBackend, false);
    assert.equal(registered.result?.openTelemetryImplemented, false);
    assert.equal(registered.result?.applicationInsightsImplemented, false);
    assert.equal(registered.result?.runtimeReady, true);
    assert.equal(registered.scope?.status, "registered");
    assert.equal(registered.scope?.scopeName, "foundation-observability-scope");

    const observed = await port.observe({
      scopeId: registered.scope!.scopeId,
    });
    assert.equal(observed.ok, true);
    assert.equal(observed.scope?.status, "observed");
    assert.equal(observed.scope?.active, true);
    assert.equal(observed.result?.openTelemetryImplemented, false);
    assert.equal(observed.result?.prometheusImplemented, false);
    assert.equal(observed.result?.realLogsImplemented, false);
    assert.equal(observed.result?.realMetricsImplemented, false);
    assert.equal(observed.result?.realTracingImplemented, false);
    assert.ok(observed.observabilitySignal?.signalId);
    assert.ok(observed.envelope?.envelopeId);

    const listed = await port.list({ scopeId: registered.scope!.scopeId });
    assert.equal(listed.ok, true);
    assert.equal(listed.scopes?.length, 1);
    assert.ok((listed.signals?.length ?? 0) >= 1);

    const released = await port.release({
      scopeId: registered.scope!.scopeId,
      signalId: observed.observabilitySignal!.signalId,
    });
    assert.equal(released.ok, true);
    assert.equal(released.scope?.status, "released");
    assert.equal(released.scope?.active, false);

    const unregistered = await port.unregister({ scopeId: registered.scope!.scopeId });
    assert.equal(unregistered.ok, true);
    assert.equal(unregistered.scope?.status, "unregistered");

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "canonical-observability-statistics");
    assert.equal(stats.statistics?.realObservabilityBackendCount, 0);
    assert.equal(stats.statistics?.openTelemetryImplementedCount, 0);
    assert.equal(stats.statistics?.applicationInsightsImplementedCount, 0);
    assert.equal(stats.statistics?.prometheusImplementedCount, 0);
    assert.equal(stats.statistics?.grafanaImplementedCount, 0);
    assert.equal(stats.statistics?.realLogsImplementedCount, 0);
    assert.equal(stats.statistics?.realMetricsImplementedCount, 0);
    assert.equal(stats.statistics?.realTracingImplementedCount, 0);
    assert.equal(stats.statistics?.distributedTracingImplementedCount, 0);
  });

  it("InMemory store oficial e estatísticas zeradas para backend de observabilidade real", () => {
    const store = new InMemoryObservabilityRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_OBSERVABILITY_RUNTIME_STORE_ID);
    const stats = store.statistics();
    assert.equal(stats.kind, "canonical-observability-statistics");
    assert.equal(stats.realObservabilityBackendCount, 0);
    assert.equal(stats.openTelemetryImplementedCount, 0);
    assert.equal(stats.applicationInsightsImplementedCount, 0);
    assert.equal(DEFAULT_OBSERVABILITY_RUNTIME_CAPABILITIES.runtimeReady, true);
    assert.equal(DEFAULT_OBSERVABILITY_RUNTIME_CAPABILITIES.realObservabilityBackend, false);
  });

  it("retry estrutural recupera falha transitória", async () => {
    const port = new DefaultObservabilityRuntimeAdapter({
      provider: "enterprise",
      failAttempts: 1,
      defaultRetryCount: 1,
      defaultRetryBackoffMs: 1,
    });
    const result = await port.register({ scopeName: "retry-observability-scope" });
    assert.equal(result.ok, true);
    assert.ok((result.telemetry?.attempts ?? 0) >= 2);
  });

  it("AbortSignal cancela operação", async () => {
    const port = createObservabilityRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.register({
      scopeName: "abort-observability-scope",
      signal: controller.signal,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "OBSERVABILITY_RUNTIME_CANCELLED");
  });

  it("registry/factory sem fallback silencioso", () => {
    const registry = createDefaultObservabilityRuntimeRegistry();
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.snapshot().count, BUILTIN_OBSERVABILITY_RUNTIME_PROVIDER_COUNT);
    assert.ok(registry instanceof ObservabilityRuntimeRegistry);

    const factory = new ObservabilityRuntimeFactory({ registry });
    assert.throws(() => factory.create({ provider: "unknown" as never }), /não está registrado/);
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createObservabilityRuntimePort({ provider: "enterprise" });
    const summary = await getObservabilityRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.info.providerType, "OBSERVABILITY_RUNTIME");
    assert.equal(summary.capabilities.runtimeReady, true);
    assert.equal(summary.capabilities.realObservabilityBackend, false);
    assert.equal(summary.capabilities.implementsOpenTelemetry, false);
  });
});

describe("INF-09 cadeia Enterprise / Queue / Worker / Scheduler / Persistent Queue / TISS / Observability Runtime", () => {
  it("Enterprise Runtime expõe Observability Runtime + health observabilityRuntimeOk", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    assert.equal(runtime.getObservabilityRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getQueueRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getWorkerRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getSchedulerRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getPersistentQueueRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getTISSRuntimePort().providerId, "default");
    assert.equal(runtime.getObservabilityRuntimePort().capabilities().usesQueueRuntimePort, true);
    assert.equal(runtime.getObservabilityRuntimePort().capabilities().usesWorkerRuntimePort, true);
    assert.equal(
      runtime.getObservabilityRuntimePort().capabilities().usesSchedulerRuntimePort,
      true,
    );
    assert.equal(
      runtime.getObservabilityRuntimePort().capabilities().usesPersistentQueueRuntimePort,
      true,
    );
    assert.equal(runtime.getObservabilityRuntimePort().capabilities().usesTISSRuntimePort, true);
    assert.equal(runtime.getQueueRuntimePort().capabilities().usesObservabilityRuntimePort, true);
    assert.equal(runtime.getWorkerRuntimePort().capabilities().usesObservabilityRuntimePort, true);
    assert.equal(
      runtime.getSchedulerRuntimePort().capabilities().usesObservabilityRuntimePort,
      true,
    );
    assert.equal(
      runtime.getPersistentQueueRuntimePort().capabilities().usesObservabilityRuntimePort,
      true,
    );
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesObservabilityRuntimePort, true);

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.observabilityRuntimeOk, true);
    assert.equal(health.persistentQueueRuntimeOk, true);
    assert.equal(health.schedulerRuntimeOk, true);
    assert.equal(health.workerRuntimeOk, true);
    assert.equal(health.queueRuntimeOk, true);
    assert.equal(health.tissRuntimeOk, true);
  });

  it("Observability Runtime consome Ports apenas em leitura (stats) — sem mutação", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const obs = runtime.getObservabilityRuntimePort();
    const queue = runtime.getQueueRuntimePort();
    const worker = runtime.getWorkerRuntimePort();
    const scheduler = runtime.getSchedulerRuntimePort();
    const pqr = runtime.getPersistentQueueRuntimePort();

    const obsHealth = await obs.health();
    assert.equal(obsHealth.ok, true);
    assert.equal(obsHealth.queueRuntimeOk, true);
    assert.equal(obsHealth.workerRuntimeOk, true);
    assert.equal(obsHealth.schedulerRuntimeOk, true);
    assert.equal(obsHealth.persistentQueueRuntimeOk, true);
    assert.equal(obsHealth.tissRuntimeOk, true);
    assert.ok(obsHealth.operational);
    assert.equal(obsHealth.operational?.kind, "operational-runtime-diagnostics");
    assert.equal(obsHealth.operational?.operationalCollection, true);
    assert.equal(obsHealth.operational?.realObservabilityBackend, false);
    assert.equal(obsHealth.operational?.openTelemetryImplemented, false);
    assert.equal(obsHealth.operational?.prometheusImplemented, false);

    const beforeQueue = await queue.stats();
    const beforeQueueCount = beforeQueue.statistics?.totalMessages ?? 0;
    const beforeWorker = await worker.stats();
    const beforeWorkers = beforeWorker.statistics?.totalWorkers ?? 0;
    const beforeScheduler = await scheduler.stats();
    const beforeSchedules = beforeScheduler.statistics?.totalSchedules ?? 0;
    const beforePqr = await pqr.stats();
    const beforeQueues = beforePqr.statistics?.totalQueues ?? 0;

    const observed = await obs.observe({ scopeName: "oper-inf-o-read-only" });
    assert.equal(observed.ok, true);
    assert.equal(observed.result?.openTelemetryImplemented, false);
    assert.equal(observed.result?.applicationInsightsImplemented, false);
    assert.equal(observed.result?.prometheusImplemented, false);
    assert.equal(observed.result?.realLogsImplemented, false);
    assert.equal(observed.result?.realMetricsImplemented, false);
    assert.equal(observed.result?.realTracingImplemented, false);

    const afterQueue = await queue.stats();
    assert.equal(afterQueue.statistics?.totalMessages ?? 0, beforeQueueCount);
    const afterWorker = await worker.stats();
    assert.equal(afterWorker.statistics?.totalWorkers ?? 0, beforeWorkers);
    const afterScheduler = await scheduler.stats();
    assert.equal(afterScheduler.statistics?.totalSchedules ?? 0, beforeSchedules);
    const afterPqr = await pqr.stats();
    assert.equal(afterPqr.statistics?.totalQueues ?? 0, beforeQueues);
  });

  it("TISS Runtime prepara dependência Observability sem observar/consumir", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const tiss = runtime.getTISSRuntimePort();
    const obs = runtime.getObservabilityRuntimePort();

    const tissHealth = await tiss.health();
    assert.equal(tissHealth.ok, true);
    assert.equal(tissHealth.observabilityRuntimeOk, true);
    assert.equal(tissHealth.persistentQueueRuntimeOk, true);
    assert.equal(tissHealth.schedulerRuntimeOk, true);
    assert.equal(tissHealth.workerRuntimeOk, true);
    assert.equal(tissHealth.queueRuntimeOk, true);

    const before = await obs.stats();
    const beforeScopes = before.statistics?.totalScopes ?? 0;

    const processed = await tiss.process({
      kind: "canonical-tiss-request",
      mode: "structural-process",
      metadata: {
        kind: "canonical-tiss-metadata",
        sessionId: "sess-inf-09",
        correlationId: "corr-inf-09",
      },
    });
    assert.equal(processed.ok, true);

    const after = await obs.stats();
    assert.equal(after.statistics?.totalScopes ?? 0, beforeScopes);
    assert.equal(after.statistics?.realObservabilityBackendCount, 0);
    assert.equal(after.statistics?.openTelemetryImplementedCount, 0);
  });
});

describe("INF-09 ausência de backends de observabilidade / bypass", () => {
  it("módulo observability-runtime não referencia backends reais", () => {
    const root = join(repoRoot, "src/lib/enterprise/observability-runtime");
    const files = collectTsFiles(root);
    assert.ok(files.length > 0);

    const forbidden = [
      /from ["']@opentelemetry\//,
      /from ["']@opentelemetry["']/,
      /from ["']applicationinsights["']/,
      /from ["']prom-client["']/,
      /from ["']@datadog\//,
      /from ["']dd-trace["']/,
      /from ["']newrelic["']/,
      /from ["']@elastic\//,
      /from ["']winston["']/,
      /from ["']pino["']/,
      /from ["']axios["']/,
      /from ["']@azure\/monitor-opentelemetry["']/,
      /from ["']@azure\/monitor-query["']/,
      /new\s+WebSocket\s*\(/,
      /setInterval\s*\(/,
      /new\s+Worker\s*\(/,
      /ThreadPoolExecutor/,
      /from ["']worker_threads["']/,
    ];

    for (const file of files) {
      const src = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        assert.equal(pattern.test(src), false, `${file} matched ${pattern}`);
      }
    }
  });

  it("Enterprise Runtime wiring inclui getObservabilityRuntimePort e createObservabilityRuntimePort", () => {
    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.match(enterpriseRuntime, /createObservabilityRuntimePort/);
    assert.match(enterpriseRuntime, /getObservabilityRuntimePort/);
    assert.match(enterpriseRuntime, /observabilityRuntimeOk/);
  });

  it("Queue Runtime wiring inclui getObservabilityRuntimePort sem observe/release", () => {
    const queueAdapter = readFileSync(
      join(repoRoot, "src/lib/enterprise/queue-runtime/adapters/default-queue-runtime-adapter.ts"),
      "utf8",
    );
    assert.match(queueAdapter, /getObservabilityRuntimePort/);
    assert.match(queueAdapter, /usesObservabilityRuntimePort/);
    assert.match(queueAdapter, /observabilityRuntimeOk/);
    assert.equal(
      /observabilityRuntimePort\.(register|unregister|observe|release|list)\s*\(/.test(
        queueAdapter,
      ),
      false,
    );
  });

  it("Worker Runtime wiring inclui getObservabilityRuntimePort sem observe/release", () => {
    const workerAdapter = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/worker-runtime/adapters/default-worker-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(workerAdapter, /getObservabilityRuntimePort/);
    assert.match(workerAdapter, /usesObservabilityRuntimePort/);
    assert.match(workerAdapter, /observabilityRuntimeOk/);
    assert.equal(
      /getObservabilityRuntimePort\(\)\.(register|unregister|observe|release|list)\s*\(/.test(
        workerAdapter,
      ),
      false,
    );
  });

  it("Scheduler Runtime wiring inclui getObservabilityRuntimePort sem observe/release", () => {
    const schedulerAdapter = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/scheduler-runtime/adapters/default-scheduler-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(schedulerAdapter, /getObservabilityRuntimePort/);
    assert.match(schedulerAdapter, /usesObservabilityRuntimePort/);
    assert.match(schedulerAdapter, /observabilityRuntimeOk/);
    assert.equal(
      /getObservabilityRuntimePort\(\)\.(register|unregister|observe|release|list)\s*\(/.test(
        schedulerAdapter,
      ),
      false,
    );
  });

  it("Persistent Queue Runtime wiring inclui getObservabilityRuntimePort sem observe/release", () => {
    const pqrAdapter = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/persistent-queue-runtime/adapters/default-persistent-queue-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(pqrAdapter, /getObservabilityRuntimePort/);
    assert.match(pqrAdapter, /usesObservabilityRuntimePort/);
    assert.match(pqrAdapter, /observabilityRuntimeOk/);
    assert.equal(
      /getObservabilityRuntimePort\(\)\.(register|unregister|observe|release|list)\s*\(/.test(
        pqrAdapter,
      ),
      false,
    );
  });

  it("TISS Runtime wiring inclui getObservabilityRuntimePort sem observe no process", () => {
    const tissAdapter = readFileSync(
      join(repoRoot, "src/lib/enterprise/tiss-runtime/adapters/default-tiss-runtime-adapter.ts"),
      "utf8",
    );
    assert.match(tissAdapter, /getObservabilityRuntimePort/);
    assert.match(tissAdapter, /usesObservabilityRuntimePort/);
    assert.match(tissAdapter, /observabilityRuntimeOk/);

    const processStart = tissAdapter.indexOf("async process(");
    assert.ok(processStart > 0);
    const processBody = tissAdapter.slice(processStart);
    assert.equal(
      /observabilityRuntimePort\.(register|unregister|observe|release|list)\s*\(/.test(processBody),
      false,
    );
  });

  it("Observability Runtime coleta Ports apenas via stats (somente leitura) — sem mutadores", () => {
    const obsAdapter = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/observability-runtime/adapters/default-observability-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(obsAdapter, /getQueueRuntimePort/);
    assert.match(obsAdapter, /getWorkerRuntimePort/);
    assert.match(obsAdapter, /getSchedulerRuntimePort/);
    assert.match(obsAdapter, /getPersistentQueueRuntimePort/);
    assert.match(obsAdapter, /getTISSRuntimePort/);
    assert.match(obsAdapter, /usesQueueRuntimePort/);
    assert.match(obsAdapter, /usesWorkerRuntimePort/);
    assert.match(obsAdapter, /usesSchedulerRuntimePort/);
    assert.match(obsAdapter, /usesPersistentQueueRuntimePort/);
    assert.match(obsAdapter, /usesTISSRuntimePort/);
    assert.match(obsAdapter, /operationalPortCollection/);
    assert.match(obsAdapter, /RuntimeObservabilityCollector/);
    assert.equal(
      /getQueueRuntimePort\(\)\.(enqueue|dequeue|peek|ack|nack|purge)\s*\(/.test(obsAdapter),
      false,
    );
    assert.equal(
      /getWorkerRuntimePort\(\)\.(register|unregister|allocate|release|heartbeat)\s*\(/.test(
        obsAdapter,
      ),
      false,
    );
    assert.equal(
      /getSchedulerRuntimePort\(\)\.(register|unregister|schedule|cancel|list)\s*\(/.test(
        obsAdapter,
      ),
      false,
    );
    assert.equal(
      /getPersistentQueueRuntimePort\(\)\.(register|unregister|persist|release|list)\s*\(/.test(
        obsAdapter,
      ),
      false,
    );
    assert.equal(
      /getTISSRuntimePort\(\)\.(process|getSession|listSessions)\s*\(/.test(obsAdapter),
      false,
    );
  });

  it("OPER-INF-O collector usa apenas stats/shape — sem mutadores nos Ports", () => {
    const collector = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/observability-runtime/operational/runtime-observability-collector.ts",
      ),
      "utf8",
    );
    assert.match(collector, /\.stats\s*\(/);
    assert.match(collector, /ENTERPRISE_DEAD_LETTER_QUEUE_NAME/);
    assert.equal(
      /\.(enqueue|dequeue|peek|ack|nack|purge|allocate|schedule|cancel|process)\s*\(/.test(
        collector,
      ),
      false,
    );
    assert.equal(/from ["']@supabase\//.test(collector), false);
    assert.equal(/createClient\s*\(/.test(collector), false);
  });
});

describe("OPER-INF-O Observability operacional Port-only", () => {
  it("stats/health expõem métricas, contadores, timers, throughput, filas, workers, scheduler, DLQ", async () => {
    process.env.MEDICFLOW_QUEUE_RUNTIME_BACKEND = "memory";
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const obs = runtime.getObservabilityRuntimePort() as DefaultObservabilityRuntimeAdapter;
    const queue = runtime.getQueueRuntimePort();

    assert.equal(obs.capabilities().operationalPortCollection, true);
    assert.ok(obs.getOperationalCollector());

    await queue.enqueue({
      queueName: "oper-inf-o-pending",
      payloadRef: "payload://obs-o-1",
    });

    const stats = await obs.stats();
    assert.equal(stats.ok, true);
    assert.ok(stats.operational);
    assert.equal(stats.operational?.kind, "operational-runtime-diagnostics");
    assert.equal(stats.operational?.operationalCollection, true);
    assert.ok(typeof stats.operational?.counters.queueTotalMessages === "number");
    assert.ok(typeof stats.operational?.timers.collectionLatencyMs === "number");
    assert.ok(typeof stats.operational?.throughput.messagesPublished === "number");
    assert.ok(typeof stats.operational?.pendingQueues.pendingMessages === "number");
    assert.ok(stats.operational!.pendingQueues.pendingMessages >= 1);
    assert.ok(typeof stats.operational?.activeWorkers.allocatedWorkers === "number");
    assert.ok(typeof stats.operational?.schedulerStatus.activeSchedules === "number");
    assert.ok(typeof stats.operational?.deadLetter.totalDeadLetters === "number");
    assert.equal(stats.operational?.realObservabilityBackend, false);
    assert.equal(stats.operational?.prometheusImplemented, false);
    assert.equal(stats.operational?.grafanaImplemented, false);
    assert.equal(stats.statistics?.realMetricsImplementedCount, 0);

    const health = await obs.health();
    assert.equal(health.ok, true);
    assert.ok(health.operational);
    assert.equal(health.operational?.healthChecks.queueRuntimeOk, true);
    assert.equal(health.operational?.healthChecks.workerRuntimeOk, true);
    assert.equal(health.operational?.healthChecks.schedulerRuntimeOk, true);
  });

  it("coleta não muta Queue/Worker/Scheduler e não decide retry", async () => {
    process.env.MEDICFLOW_QUEUE_RUNTIME_BACKEND = "memory";
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const obs = runtime.getObservabilityRuntimePort();
    const queue = runtime.getQueueRuntimePort();
    const worker = runtime.getWorkerRuntimePort();
    const scheduler = runtime.getSchedulerRuntimePort();

    const beforeQ = await queue.stats();
    const beforeW = await worker.stats();
    const beforeS = await scheduler.stats();

    const snap = await obs.stats();
    assert.equal(snap.ok, true);
    assert.ok(snap.operational);

    const afterQ = await queue.stats();
    const afterW = await worker.stats();
    const afterS = await scheduler.stats();
    assert.equal(afterQ.statistics?.totalMessages, beforeQ.statistics?.totalMessages);
    assert.equal(afterQ.statistics?.enqueuedMessages, beforeQ.statistics?.enqueuedMessages);
    assert.equal(afterW.statistics?.totalWorkers, beforeW.statistics?.totalWorkers);
    assert.equal(afterS.statistics?.totalSchedules, beforeS.statistics?.totalSchedules);

    const root = join(repoRoot, "src/lib/enterprise/observability-runtime");
    const files = collectTsFiles(root);
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      assert.equal(/implementsRetryReal\s*:\s*true/.test(src), false, file);
      assert.equal(/from ["']@opentelemetry\//.test(src), false, file);
      assert.equal(/from ["']prom-client["']/.test(src), false, file);
    }
  });

  it("preserva arquitetura: sem novo Port/Gateway/Runtime; Dead Letter não no EnterpriseRuntime", () => {
    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    const enterpriseTypes = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/types.ts"),
      "utf8",
    );
    assert.match(enterpriseRuntime, /getObservabilityRuntimePort/);
    assert.equal(/getDeadLetterRuntimePort/.test(enterpriseTypes), false);
    assert.equal(/createDeadLetterRuntimePort/.test(enterpriseRuntime), false);
    assert.equal(/ObservabilityGateway/.test(enterpriseRuntime), false);
    assert.equal(/createObservabilityGateway/.test(enterpriseRuntime), false);

    const foundationRoot = join(repoRoot, "src/lib/enterprise/observability-foundation");
    const foundationFiles = collectTsFiles(foundationRoot);
    for (const file of foundationFiles) {
      const src = readFileSync(file, "utf8");
      assert.equal(/RuntimeObservabilityCollector/.test(src), false, file);
    }
  });

  it("sem Provider/Adapter/Factory/Registry paralelo", () => {
    const root = join(repoRoot, "src/lib/enterprise/observability-runtime");
    const files = collectTsFiles(root).map((f) => f.replace(/\\/g, "/"));
    assert.ok(files.some((f) => f.endsWith("/providers/create-observability-runtime-port.ts")));
    assert.ok(files.some((f) => f.endsWith("/factory/observability-runtime-factory.ts")));
    assert.ok(files.some((f) => f.endsWith("/registry/observability-runtime-registry.ts")));
    assert.ok(files.some((f) => f.includes("/operational/runtime-observability-collector.ts")));
    assert.equal(files.filter((f) => f.includes("/factory/")).length, 2);
    assert.equal(files.filter((f) => f.includes("/registry/")).length, 2);
    assert.equal(
      files.filter((f) => /adapters\/.*observability-runtime-adapter\.ts$/.test(f)).length,
      2,
    );
  });
});

#!/usr/bin/env node
/**
 * INF-06 — Enterprise Worker Runtime
 * Prova: Application → WorkerRuntimePort → Adapter → Factory → Registry → Store
 *         + Enterprise Runtime + Queue Runtime / TISS Runtime (deps preparadas sem consumo)
 *         + register / unregister / allocate / release / heartbeat / stats / health
 *         + ausência de Workers reais / Scheduler / Thread Pool / backends
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_WORKER_RUNTIME_PROVIDER_COUNT,
  DEFAULT_WORKER_RUNTIME_ADAPTER_ID,
  DEFAULT_WORKER_RUNTIME_CAPABILITIES,
  DefaultWorkerRuntimeAdapter,
  EnterpriseWorkerRuntimeAdapter,
  IN_MEMORY_WORKER_RUNTIME_STORE_ID,
  InMemoryWorkerRuntimeStore,
  MOCK_WORKER_RUNTIME_ADAPTER_ID,
  MockWorkerRuntimeAdapter,
  WorkerRuntimeFactory,
  WorkerRuntimeProvider,
  WorkerRuntimeRegistry,
  createDefaultWorkerRuntimeRegistry,
  createWorkerRuntimeFactory,
  createWorkerRuntimePort,
  getWorkerRuntimeFactory,
  getWorkerRuntimeHealthSummary,
  resetWorkerRuntimeIdSequences,
  type WorkerRuntimePort,
} from "../../../src/lib/enterprise/worker-runtime/index.ts";
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

describe("INF-06 WorkerRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: WorkerRuntimePort = new MockWorkerRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.status, "ready");
    assert.equal(health.kind, "canonical-worker-health");
    assert.equal(health.runtimeReady, true);
    assert.equal(health.realWorkers, false);
    assert.equal(health.tasksExecuted, false);
    assert.equal(health.parallelProcessing, false);
    assert.equal(health.schedulerImplemented, false);
    assert.equal(health.threadPoolImplemented, false);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_WORKER_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsCanonicalWorker, true);
    assert.equal(caps.usesQueueRuntimePort, true);
    assert.equal(caps.runtimeReady, true);
    assert.equal(caps.realWorkers, false);
    assert.equal(caps.implementsRealWorkers, false);
    assert.equal(caps.implementsScheduler, false);
    assert.equal(caps.implementsThreadPool, false);
    assert.equal(caps.implementsCron, false);
    assert.equal(caps.implementsRabbitMq, false);
    assert.equal(caps.implementsKafka, false);
    assert.equal(caps.implementsBullMq, false);
    assert.equal(caps.persistenceImplemented, false);
    assert.equal(caps.canonical.kind, "canonical-worker-capabilities");
    assert.equal(caps.canonical.runtimeReady, true);
    assert.equal(caps.canonical.realWorkers, false);
  });

  it("DefaultWorkerRuntimeAdapter é o adapter enterprise oficial", () => {
    assert.equal(EnterpriseWorkerRuntimeAdapter, DefaultWorkerRuntimeAdapter);
    const port = new DefaultWorkerRuntimeAdapter({
      provider: "enterprise",
    });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_WORKER_RUNTIME_ADAPTER_ID);
  });

  it("provider default resolve enterprise", () => {
    const port = createWorkerRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(WorkerRuntimeProvider.create().providerId, "enterprise");
  });

  it("factory resolve mock / test / default / enterprise", () => {
    const factory = createWorkerRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(
      getWorkerRuntimeFactory().getRegistry().list().length,
      BUILTIN_WORKER_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("register → allocate → heartbeat → release → unregister → stats com flags estruturais", async () => {
    resetWorkerRuntimeIdSequences();
    const port = createWorkerRuntimePort({ provider: "enterprise" });

    const registered = await port.register({
      workerName: "foundation-worker",
      correlationId: "corr-inf-06",
    });
    assert.equal(registered.ok, true);
    assert.ok(registered.result?.resultId);
    assert.equal(registered.result?.realWorkers, false);
    assert.equal(registered.result?.tasksExecuted, false);
    assert.equal(registered.result?.parallelProcessing, false);
    assert.equal(registered.result?.runtimeReady, true);
    assert.equal(registered.worker?.status, "registered");
    assert.equal(registered.worker?.workerName, "foundation-worker");

    const allocated = await port.allocate({
      workerId: registered.worker!.workerId,
    });
    assert.equal(allocated.ok, true);
    assert.equal(allocated.worker?.status, "allocated");
    assert.equal(allocated.worker?.allocated, true);
    assert.equal(allocated.result?.tasksExecuted, false);
    assert.equal(allocated.result?.queueConsumed, false);
    assert.ok(allocated.task?.taskId);
    assert.ok(allocated.execution?.executionId);

    const beat = await port.heartbeat({ workerId: registered.worker!.workerId });
    assert.equal(beat.ok, true);
    assert.ok(beat.worker?.lastHeartbeatAt);

    const released = await port.release({ workerId: registered.worker!.workerId });
    assert.equal(released.ok, true);
    assert.equal(released.worker?.status, "released");
    assert.equal(released.worker?.allocated, false);

    const unregistered = await port.unregister({ workerId: registered.worker!.workerId });
    assert.equal(unregistered.ok, true);
    assert.equal(unregistered.worker?.status, "unregistered");

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "canonical-worker-statistics");
    assert.equal(stats.statistics?.realWorkersCount, 0);
    assert.equal(stats.statistics?.tasksExecutedCount, 0);
    assert.equal(stats.statistics?.parallelProcessingCount, 0);
    assert.equal(stats.statistics?.schedulerImplementedCount, 0);
    assert.equal(stats.statistics?.threadPoolImplementedCount, 0);
    assert.equal(stats.statistics?.queueConsumedCount, 0);
  });

  it("InMemory store oficial e estatísticas zeradas para Workers reais", () => {
    const store = new InMemoryWorkerRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_WORKER_RUNTIME_STORE_ID);
    const stats = store.statistics();
    assert.equal(stats.kind, "canonical-worker-statistics");
    assert.equal(stats.realWorkersCount, 0);
    assert.equal(stats.tasksExecutedCount, 0);
    assert.equal(stats.parallelProcessingCount, 0);
    assert.equal(DEFAULT_WORKER_RUNTIME_CAPABILITIES.runtimeReady, true);
    assert.equal(DEFAULT_WORKER_RUNTIME_CAPABILITIES.realWorkers, false);
  });

  it("retry recupera falha transitória", async () => {
    const port = new DefaultWorkerRuntimeAdapter({
      provider: "enterprise",
      failAttempts: 1,
      defaultRetryCount: 1,
      defaultRetryBackoffMs: 1,
    });
    const result = await port.register({ workerName: "retry-worker" });
    assert.equal(result.ok, true);
    assert.ok((result.telemetry?.attempts ?? 0) >= 2);
  });

  it("AbortSignal cancela operação", async () => {
    const port = createWorkerRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.register({
      workerName: "abort-worker",
      signal: controller.signal,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "WORKER_RUNTIME_CANCELLED");
  });

  it("registry/factory sem fallback silencioso", () => {
    const registry = createDefaultWorkerRuntimeRegistry();
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.snapshot().count, BUILTIN_WORKER_RUNTIME_PROVIDER_COUNT);
    assert.ok(registry instanceof WorkerRuntimeRegistry);

    const factory = new WorkerRuntimeFactory({ registry });
    assert.throws(() => factory.create({ provider: "unknown" as never }), /não está registrado/);
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createWorkerRuntimePort({ provider: "enterprise" });
    const summary = await getWorkerRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.info.providerType, "WORKER_RUNTIME");
    assert.equal(summary.capabilities.runtimeReady, true);
    assert.equal(summary.capabilities.realWorkers, false);
    assert.equal(summary.capabilities.implementsScheduler, false);
  });
});

describe("INF-06 cadeia Enterprise / Queue / TISS / Worker Runtime", () => {
  it("Enterprise Runtime expõe Worker Runtime + health workerRuntimeOk", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    assert.equal(runtime.getWorkerRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getQueueRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getTISSRuntimePort().providerId, "default");
    assert.equal(runtime.getWorkerRuntimePort().capabilities().usesQueueRuntimePort, true);
    assert.equal(runtime.getQueueRuntimePort().capabilities().usesWorkerRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesWorkerRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesQueueRuntimePort, true);

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.workerRuntimeOk, true);
    assert.equal(health.queueRuntimeOk, true);
    assert.equal(health.tissRuntimeOk, true);
  });

  it("Worker Runtime prepara dependência Queue sem consumir filas", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const worker = runtime.getWorkerRuntimePort();
    const queue = runtime.getQueueRuntimePort();

    const workerHealth = await worker.health();
    assert.equal(workerHealth.ok, true);
    assert.equal(workerHealth.queueRuntimeOk, true);

    const before = await queue.stats();
    const beforeCount = before.statistics?.totalMessages ?? 0;

    const allocated = await worker.allocate({ workerName: "inf-06-no-queue-consume" });
    assert.equal(allocated.ok, true);
    assert.equal(allocated.result?.queueConsumed, false);
    assert.equal(allocated.result?.tasksExecuted, false);

    const after = await queue.stats();
    assert.equal(after.statistics?.totalMessages ?? 0, beforeCount);
    assert.equal(after.statistics?.messagesPublishedCount, 0);
    assert.equal(after.statistics?.workersInvokedCount, 0);
  });

  it("TISS Runtime prepara dependência Worker sem alocar/executar", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const tiss = runtime.getTISSRuntimePort();
    const worker = runtime.getWorkerRuntimePort();

    const tissHealth = await tiss.health();
    assert.equal(tissHealth.ok, true);
    assert.equal(tissHealth.workerRuntimeOk, true);
    assert.equal(tissHealth.queueRuntimeOk, true);

    const before = await worker.stats();
    const beforeWorkers = before.statistics?.totalWorkers ?? 0;

    const processed = await tiss.process({
      kind: "canonical-tiss-request",
      mode: "structural-process",
      metadata: {
        kind: "canonical-tiss-metadata",
        sessionId: "sess-inf-06",
        correlationId: "corr-inf-06",
      },
    });
    assert.equal(processed.ok, true);

    const after = await worker.stats();
    assert.equal(after.statistics?.totalWorkers ?? 0, beforeWorkers);
    assert.equal(after.statistics?.realWorkersCount, 0);
    assert.equal(after.statistics?.tasksExecutedCount, 0);
  });
});

describe("INF-06 ausência de Workers reais / Scheduler / bypass", () => {
  it("módulo worker-runtime não referencia backends reais nem scheduler", () => {
    const root = join(repoRoot, "src/lib/enterprise/worker-runtime");
    const files = collectTsFiles(root);
    assert.ok(files.length > 0);

    const forbidden = [
      /from ["']amqplib["']/,
      /from ["']kafkajs["']/,
      /from ["']bullmq["']/,
      /from ["']ioredis["']/,
      /from ["']@azure\/service-bus["']/,
      /from ["']@azure\/storage-queue["']/,
      /from ["']celery["']/,
      /from ["']node-cron["']/,
      /from ["']worker_threads["']/,
      /from ["']axios["']/,
      /redis\.createClient\s*\(/,
      /new\s+WebSocket\s*\(/,
      /setInterval\s*\(/,
      /new\s+Worker\s*\(/,
      /ThreadPoolExecutor/,
      /createClient\s*\(\s*\{[^}]*redis/i,
    ];

    for (const file of files) {
      const src = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        assert.equal(pattern.test(src), false, `${file} matched ${pattern}`);
      }
    }
  });

  it("Enterprise Runtime wiring inclui getWorkerRuntimePort e createWorkerRuntimePort", () => {
    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.match(enterpriseRuntime, /createWorkerRuntimePort/);
    assert.match(enterpriseRuntime, /getWorkerRuntimePort/);
    assert.match(enterpriseRuntime, /workerRuntimeOk/);
  });

  it("Queue Runtime wiring inclui getWorkerRuntimePort sem allocate/register de Workers", () => {
    const queueAdapter = readFileSync(
      join(repoRoot, "src/lib/enterprise/queue-runtime/adapters/default-queue-runtime-adapter.ts"),
      "utf8",
    );
    assert.match(queueAdapter, /getWorkerRuntimePort/);
    assert.match(queueAdapter, /usesWorkerRuntimePort/);
    assert.match(queueAdapter, /workerRuntimeOk/);
    assert.equal(
      /workerRuntimePort\.(register|unregister|allocate|release|heartbeat)\s*\(/.test(queueAdapter),
      false,
    );
  });

  it("TISS Runtime wiring inclui getWorkerRuntimePort sem allocate/register no process", () => {
    const tissAdapter = readFileSync(
      join(repoRoot, "src/lib/enterprise/tiss-runtime/adapters/default-tiss-runtime-adapter.ts"),
      "utf8",
    );
    assert.match(tissAdapter, /getWorkerRuntimePort/);
    assert.match(tissAdapter, /usesWorkerRuntimePort/);
    assert.match(tissAdapter, /workerRuntimeOk/);

    const processStart = tissAdapter.indexOf("async process(");
    assert.ok(processStart > 0);
    const processBody = tissAdapter.slice(processStart);
    assert.equal(
      /workerRuntimePort\.(register|unregister|allocate|release|heartbeat)\s*\(/.test(processBody),
      false,
    );
  });

  it("Worker Runtime não consome Queue (enqueue/dequeue) nas operações", () => {
    const workerAdapter = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/worker-runtime/adapters/default-worker-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(workerAdapter, /getQueueRuntimePort/);
    assert.match(workerAdapter, /usesQueueRuntimePort/);
    assert.equal(
      /getQueueRuntimePort\(\)\.(enqueue|dequeue|peek|ack|nack|purge)\s*\(/.test(workerAdapter),
      false,
    );
  });

  it("sem Provider/Adapter/Factory/Registry paralelo", () => {
    const root = join(repoRoot, "src/lib/enterprise/worker-runtime");
    const files = collectTsFiles(root).map((f) => f.replace(/\\/g, "/"));
    assert.ok(files.some((f) => f.endsWith("/providers/create-worker-runtime-port.ts")));
    assert.ok(files.some((f) => f.endsWith("/factory/worker-runtime-factory.ts")));
    assert.ok(files.some((f) => f.endsWith("/registry/worker-runtime-registry.ts")));
    assert.equal(files.filter((f) => f.includes("/factory/")).length, 2);
    assert.equal(files.filter((f) => f.includes("/registry/")).length, 2);
    assert.equal(files.filter((f) => /adapters\/.*worker-runtime-adapter\.ts$/.test(f)).length, 2);
  });
});

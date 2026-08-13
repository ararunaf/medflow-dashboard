#!/usr/bin/env node
/**
 * INF-08 — Enterprise Persistent Queue Runtime
 * Prova: Application → PersistentQueueRuntimePort → Adapter → Factory → Registry → Store
 *         + Enterprise Runtime + Queue / Worker / Scheduler / TISS Runtime (deps preparadas sem consumo)
 *         + register / unregister / persist / release / list / stats / health
 *         + ausência de RabbitMQ / Kafka / Azure / Redis / BullMQ / persistência real
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_PERSISTENT_QUEUE_RUNTIME_PROVIDER_COUNT,
  DEFAULT_PERSISTENT_QUEUE_RUNTIME_ADAPTER_ID,
  DEFAULT_PERSISTENT_QUEUE_RUNTIME_CAPABILITIES,
  DefaultPersistentQueueRuntimeAdapter,
  EnterprisePersistentQueueRuntimeAdapter,
  IN_MEMORY_PERSISTENT_QUEUE_RUNTIME_STORE_ID,
  InMemoryPersistentQueueRuntimeStore,
  MOCK_PERSISTENT_QUEUE_RUNTIME_ADAPTER_ID,
  MockPersistentQueueRuntimeAdapter,
  PersistentQueueRuntimeFactory,
  PersistentQueueRuntimeProvider,
  PersistentQueueRuntimeRegistry,
  REAL_TISS_PERSISTENCE_RUNTIME_ADAPTER_ID,
  RealTissPersistenceRuntimeAdapter,
  createDefaultPersistentQueueRuntimeRegistry,
  createPersistentQueueRuntimeFactory,
  createPersistentQueueRuntimePort,
  getPersistentQueueRuntimeFactory,
  getPersistentQueueRuntimeHealthSummary,
  resetPersistentQueueRuntimeIdSequences,
  type PersistentQueueRuntimePort,
} from "../../../src/lib/enterprise/persistent-queue-runtime/index.ts";
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

describe("INF-08 PersistentQueueRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: PersistentQueueRuntimePort = new MockPersistentQueueRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.status, "ready");
    assert.equal(health.kind, "canonical-persistent-queue-health");
    assert.equal(health.runtimeReady, true);
    assert.equal(health.realPersistentBackend, false);
    assert.equal(health.rabbitMqImplemented, false);
    assert.equal(health.kafkaImplemented, false);
    assert.equal(health.deadLetterImplemented, false);
    assert.equal(health.messagePersistenceImplemented, false);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_PERSISTENT_QUEUE_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsCanonicalPersistentQueue, true);
    assert.equal(caps.usesQueueRuntimePort, true);
    assert.equal(caps.usesWorkerRuntimePort, true);
    assert.equal(caps.usesSchedulerRuntimePort, true);
    assert.equal(caps.runtimeReady, true);
    assert.equal(caps.realPersistentBackend, false);
    assert.equal(caps.implementsRealPersistentBackend, false);
    assert.equal(caps.implementsRabbitMq, false);
    assert.equal(caps.implementsKafka, false);
    assert.equal(caps.implementsBullMq, false);
    assert.equal(caps.implementsAzureServiceBus, false);
    assert.equal(caps.messagePersistenceImplemented, false);
    assert.equal(caps.canonical.kind, "canonical-persistent-queue-capabilities");
    assert.equal(caps.canonical.runtimeReady, true);
    assert.equal(caps.canonical.realPersistentBackend, false);
  });

  it("DefaultPersistentQueueRuntimeAdapter é o adapter enterprise oficial", () => {
    assert.equal(EnterprisePersistentQueueRuntimeAdapter, DefaultPersistentQueueRuntimeAdapter);
    const port = new DefaultPersistentQueueRuntimeAdapter({
      provider: "enterprise",
    });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_PERSISTENT_QUEUE_RUNTIME_ADAPTER_ID);
  });

  it("RealTissPersistenceRuntimeAdapter atende PersistentQueueRuntimePort", () => {
    const port: PersistentQueueRuntimePort = new RealTissPersistenceRuntimeAdapter({
      provider: "real-tiss",
    });
    assert.equal(port.providerId, "real-tiss");

    const caps = port.capabilities();
    assert.equal(caps.provider, "real-tiss");
    assert.equal(caps.adapterId, REAL_TISS_PERSISTENCE_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsCanonicalPersistentQueue, true);
    assert.equal(caps.usesQueueRuntimePort, true);
    assert.equal(caps.usesWorkerRuntimePort, true);
    assert.equal(caps.usesSchedulerRuntimePort, true);
    assert.equal(caps.runtimeReady, true);
    assert.equal(caps.realPersistentBackend, false);
    assert.equal(caps.implementsRealPersistentBackend, false);

    const info = port.providerInfo();
    assert.equal(info.providerId, "real-tiss");
    assert.equal(info.providerType, "PERSISTENT_QUEUE_RUNTIME");
    assert.equal(info.status, "ready");
  });

  it("provider default resolve enterprise", () => {
    const port = createPersistentQueueRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(PersistentQueueRuntimeProvider.create().providerId, "enterprise");
  });

  it("factory resolve mock / test / default / enterprise / real-tiss", () => {
    const factory = createPersistentQueueRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(factory.create({ provider: "real-tiss" }).providerId, "real-tiss");
    assert.equal(
      getPersistentQueueRuntimeFactory().getRegistry().list().length,
      BUILTIN_PERSISTENT_QUEUE_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("register → persist → list → release → unregister → stats com flags estruturais", async () => {
    resetPersistentQueueRuntimeIdSequences();
    const port = createPersistentQueueRuntimePort({ provider: "enterprise" });

    const registered = await port.register({
      queueName: "foundation-persistent-queue",
      correlationId: "corr-inf-08",
    });
    assert.equal(registered.ok, true);
    assert.ok(registered.result?.resultId);
    assert.equal(registered.result?.realPersistentBackend, false);
    assert.equal(registered.result?.rabbitMqImplemented, false);
    assert.equal(registered.result?.kafkaImplemented, false);
    assert.equal(registered.result?.runtimeReady, true);
    assert.equal(registered.queue?.status, "registered");
    assert.equal(registered.queue?.queueName, "foundation-persistent-queue");

    const persisted = await port.persist({
      queueId: registered.queue!.queueId,
    });
    assert.equal(persisted.ok, true);
    assert.equal(persisted.queue?.status, "persisted");
    assert.equal(persisted.queue?.active, true);
    assert.equal(persisted.result?.rabbitMqImplemented, false);
    assert.equal(persisted.result?.deadLetterImplemented, false);
    assert.equal(persisted.result?.retryQueueImplemented, false);
    assert.ok(persisted.persistentMessage?.messageId);
    assert.ok(persisted.envelope?.envelopeId);

    const listed = await port.list({ queueId: registered.queue!.queueId });
    assert.equal(listed.ok, true);
    assert.equal(listed.queues?.length, 1);
    assert.ok((listed.messages?.length ?? 0) >= 1);

    const released = await port.release({
      queueId: registered.queue!.queueId,
      messageId: persisted.persistentMessage!.messageId,
    });
    assert.equal(released.ok, true);
    assert.equal(released.queue?.status, "released");
    assert.equal(released.queue?.active, false);

    const unregistered = await port.unregister({ queueId: registered.queue!.queueId });
    assert.equal(unregistered.ok, true);
    assert.equal(unregistered.queue?.status, "unregistered");

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "canonical-persistent-queue-statistics");
    assert.equal(stats.statistics?.realPersistentBackendCount, 0);
    assert.equal(stats.statistics?.rabbitMqImplementedCount, 0);
    assert.equal(stats.statistics?.kafkaImplementedCount, 0);
    assert.equal(stats.statistics?.deadLetterImplementedCount, 0);
    assert.equal(stats.statistics?.messagePersistenceImplementedCount, 0);
    assert.equal(stats.statistics?.retryQueueImplementedCount, 0);
  });

  it("InMemory store oficial e estatísticas zeradas para backend persistente real", () => {
    const store = new InMemoryPersistentQueueRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_PERSISTENT_QUEUE_RUNTIME_STORE_ID);
    const stats = store.statistics();
    assert.equal(stats.kind, "canonical-persistent-queue-statistics");
    assert.equal(stats.realPersistentBackendCount, 0);
    assert.equal(stats.rabbitMqImplementedCount, 0);
    assert.equal(stats.kafkaImplementedCount, 0);
    assert.equal(DEFAULT_PERSISTENT_QUEUE_RUNTIME_CAPABILITIES.runtimeReady, true);
    assert.equal(DEFAULT_PERSISTENT_QUEUE_RUNTIME_CAPABILITIES.realPersistentBackend, false);
  });

  it("retry estrutural recupera falha transitória", async () => {
    const port = new DefaultPersistentQueueRuntimeAdapter({
      provider: "enterprise",
      failAttempts: 1,
      defaultRetryCount: 1,
      defaultRetryBackoffMs: 1,
    });
    const result = await port.register({ queueName: "retry-persistent-queue" });
    assert.equal(result.ok, true);
    assert.ok((result.telemetry?.attempts ?? 0) >= 2);
  });

  it("AbortSignal cancela operação", async () => {
    const port = createPersistentQueueRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.register({
      queueName: "abort-persistent-queue",
      signal: controller.signal,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "PERSISTENT_QUEUE_RUNTIME_CANCELLED");
  });

  it("registry/factory sem fallback silencioso", () => {
    const registry = createDefaultPersistentQueueRuntimeRegistry();
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.snapshot().count, BUILTIN_PERSISTENT_QUEUE_RUNTIME_PROVIDER_COUNT);
    assert.ok(registry instanceof PersistentQueueRuntimeRegistry);

    const factory = new PersistentQueueRuntimeFactory({ registry });
    assert.throws(() => factory.create({ provider: "unknown" as never }), /não está registrado/);
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createPersistentQueueRuntimePort({ provider: "enterprise" });
    const summary = await getPersistentQueueRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.info.providerType, "PERSISTENT_QUEUE_RUNTIME");
    assert.equal(summary.capabilities.runtimeReady, true);
    assert.equal(summary.capabilities.realPersistentBackend, false);
    assert.equal(summary.capabilities.implementsRabbitMq, false);
  });
});

describe("INF-08 cadeia Enterprise / Queue / Worker / Scheduler / TISS / Persistent Queue Runtime", () => {
  it("Enterprise Runtime expõe Persistent Queue Runtime + health persistentQueueRuntimeOk", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    assert.equal(runtime.getPersistentQueueRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getQueueRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getWorkerRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getSchedulerRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getTISSRuntimePort().providerId, "default");
    assert.equal(runtime.getPersistentQueueRuntimePort().capabilities().usesQueueRuntimePort, true);
    assert.equal(
      runtime.getPersistentQueueRuntimePort().capabilities().usesWorkerRuntimePort,
      true,
    );
    assert.equal(
      runtime.getPersistentQueueRuntimePort().capabilities().usesSchedulerRuntimePort,
      true,
    );
    assert.equal(runtime.getQueueRuntimePort().capabilities().usesPersistentQueueRuntimePort, true);
    assert.equal(
      runtime.getWorkerRuntimePort().capabilities().usesPersistentQueueRuntimePort,
      true,
    );
    assert.equal(
      runtime.getSchedulerRuntimePort().capabilities().usesPersistentQueueRuntimePort,
      true,
    );
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesPersistentQueueRuntimePort, true);

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.persistentQueueRuntimeOk, true);
    assert.equal(health.schedulerRuntimeOk, true);
    assert.equal(health.workerRuntimeOk, true);
    assert.equal(health.queueRuntimeOk, true);
    assert.equal(health.tissRuntimeOk, true);
  });

  it("Persistent Queue Runtime prepara deps Queue/Worker/Scheduler sem consumir", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const pqr = runtime.getPersistentQueueRuntimePort();
    const queue = runtime.getQueueRuntimePort();
    const worker = runtime.getWorkerRuntimePort();
    const scheduler = runtime.getSchedulerRuntimePort();

    const pqrHealth = await pqr.health();
    assert.equal(pqrHealth.ok, true);
    assert.equal(pqrHealth.queueRuntimeOk, true);
    assert.equal(pqrHealth.workerRuntimeOk, true);
    assert.equal(pqrHealth.schedulerRuntimeOk, true);

    const beforeQueue = await queue.stats();
    const beforeQueueCount = beforeQueue.statistics?.totalMessages ?? 0;
    const beforeWorker = await worker.stats();
    const beforeWorkers = beforeWorker.statistics?.totalWorkers ?? 0;
    const beforeScheduler = await scheduler.stats();
    const beforeSchedules = beforeScheduler.statistics?.totalSchedules ?? 0;

    const persisted = await pqr.persist({ queueName: "inf-08-no-consume" });
    assert.equal(persisted.ok, true);
    assert.equal(persisted.result?.retryQueueImplemented, false);
    assert.equal(persisted.result?.deadLetterImplemented, false);
    assert.equal(persisted.result?.rabbitMqImplemented, false);
    assert.equal(persisted.result?.messagePersistenceImplemented, false);

    const afterQueue = await queue.stats();
    assert.equal(afterQueue.statistics?.totalMessages ?? 0, beforeQueueCount);
    const afterWorker = await worker.stats();
    assert.equal(afterWorker.statistics?.totalWorkers ?? 0, beforeWorkers);
    assert.equal(afterWorker.statistics?.realWorkersCount, 0);
    const afterScheduler = await scheduler.stats();
    assert.equal(afterScheduler.statistics?.totalSchedules ?? 0, beforeSchedules);
    assert.equal(afterScheduler.statistics?.realSchedulerCount, 0);
  });

  it("TISS Runtime prepara dependência Persistent Queue sem persistir/consumir", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const tiss = runtime.getTISSRuntimePort();
    const pqr = runtime.getPersistentQueueRuntimePort();

    const tissHealth = await tiss.health();
    assert.equal(tissHealth.ok, true);
    assert.equal(tissHealth.persistentQueueRuntimeOk, true);
    assert.equal(tissHealth.schedulerRuntimeOk, true);
    assert.equal(tissHealth.workerRuntimeOk, true);
    assert.equal(tissHealth.queueRuntimeOk, true);

    const before = await pqr.stats();
    const beforeQueues = before.statistics?.totalQueues ?? 0;

    const processed = await tiss.process({
      kind: "canonical-tiss-request",
      mode: "structural-process",
      metadata: {
        kind: "canonical-tiss-metadata",
        sessionId: "sess-inf-08",
        correlationId: "corr-inf-08",
      },
    });
    assert.equal(processed.ok, true);

    const after = await pqr.stats();
    assert.equal(after.statistics?.totalQueues ?? 0, beforeQueues);
    assert.equal(after.statistics?.realPersistentBackendCount, 0);
    assert.equal(after.statistics?.rabbitMqImplementedCount, 0);
  });
});

describe("INF-08 ausência de backends persistentes / bypass", () => {
  it("módulo persistent-queue-runtime não referencia backends reais", () => {
    const root = join(repoRoot, "src/lib/enterprise/persistent-queue-runtime");
    const files = collectTsFiles(root);
    assert.ok(files.length > 0);

    const forbidden = [
      /from ["']amqplib["']/,
      /from ["']kafkajs["']/,
      /from ["']bullmq["']/,
      /from ["']ioredis["']/,
      /from ["']@azure\/service-bus["']/,
      /from ["']@azure\/storage-queue["']/,
      /from ["']redis["']/,
      /from ["']axios["']/,
      /redis\.createClient\s*\(/,
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

  it("Enterprise Runtime wiring inclui getPersistentQueueRuntimePort e createPersistentQueueRuntimePort", () => {
    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.match(enterpriseRuntime, /createPersistentQueueRuntimePort/);
    assert.match(enterpriseRuntime, /getPersistentQueueRuntimePort/);
    assert.match(enterpriseRuntime, /persistentQueueRuntimeOk/);
  });

  it("Queue Runtime wiring inclui getPersistentQueueRuntimePort sem persist/release", () => {
    const queueAdapter = readFileSync(
      join(repoRoot, "src/lib/enterprise/queue-runtime/adapters/default-queue-runtime-adapter.ts"),
      "utf8",
    );
    assert.match(queueAdapter, /getPersistentQueueRuntimePort/);
    assert.match(queueAdapter, /usesPersistentQueueRuntimePort/);
    assert.match(queueAdapter, /persistentQueueRuntimeOk/);
    assert.equal(
      /persistentQueueRuntimePort\.(register|unregister|persist|release|list)\s*\(/.test(
        queueAdapter,
      ),
      false,
    );
  });

  it("Worker Runtime wiring inclui getPersistentQueueRuntimePort sem persist/release", () => {
    const workerAdapter = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/worker-runtime/adapters/default-worker-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(workerAdapter, /getPersistentQueueRuntimePort/);
    assert.match(workerAdapter, /usesPersistentQueueRuntimePort/);
    assert.match(workerAdapter, /persistentQueueRuntimeOk/);
    assert.equal(
      /getPersistentQueueRuntimePort\(\)\.(register|unregister|persist|release|list)\s*\(/.test(
        workerAdapter,
      ),
      false,
    );
  });

  it("Scheduler Runtime wiring inclui getPersistentQueueRuntimePort sem persist/release", () => {
    const schedulerAdapter = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/scheduler-runtime/adapters/default-scheduler-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(schedulerAdapter, /getPersistentQueueRuntimePort/);
    assert.match(schedulerAdapter, /usesPersistentQueueRuntimePort/);
    assert.match(schedulerAdapter, /persistentQueueRuntimeOk/);
    assert.equal(
      /getPersistentQueueRuntimePort\(\)\.(register|unregister|persist|release|list)\s*\(/.test(
        schedulerAdapter,
      ),
      false,
    );
  });

  it("TISS Runtime wiring inclui getPersistentQueueRuntimePort sem persist no process", () => {
    const tissAdapter = readFileSync(
      join(repoRoot, "src/lib/enterprise/tiss-runtime/adapters/default-tiss-runtime-adapter.ts"),
      "utf8",
    );
    assert.match(tissAdapter, /getPersistentQueueRuntimePort/);
    assert.match(tissAdapter, /usesPersistentQueueRuntimePort/);
    assert.match(tissAdapter, /persistentQueueRuntimeOk/);

    const processStart = tissAdapter.indexOf("async process(");
    assert.ok(processStart > 0);
    const processBody = tissAdapter.slice(processStart);
    assert.equal(
      /persistentQueueRuntimePort\.(register|unregister|persist|release|list)\s*\(/.test(
        processBody,
      ),
      false,
    );
  });

  it("Persistent Queue Runtime não consome Queue/Worker/Scheduler nas operações", () => {
    const pqrAdapter = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/persistent-queue-runtime/adapters/default-persistent-queue-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(pqrAdapter, /getQueueRuntimePort/);
    assert.match(pqrAdapter, /getWorkerRuntimePort/);
    assert.match(pqrAdapter, /getSchedulerRuntimePort/);
    assert.match(pqrAdapter, /usesQueueRuntimePort/);
    assert.match(pqrAdapter, /usesWorkerRuntimePort/);
    assert.match(pqrAdapter, /usesSchedulerRuntimePort/);
    assert.equal(
      /getQueueRuntimePort\(\)\.(enqueue|dequeue|peek|ack|nack|purge)\s*\(/.test(pqrAdapter),
      false,
    );
    assert.equal(
      /getWorkerRuntimePort\(\)\.(register|unregister|allocate|release|heartbeat)\s*\(/.test(
        pqrAdapter,
      ),
      false,
    );
    assert.equal(
      /getSchedulerRuntimePort\(\)\.(register|unregister|schedule|cancel|list)\s*\(/.test(
        pqrAdapter,
      ),
      false,
    );
  });

  it("sem Provider/Adapter/Factory/Registry paralelo", () => {
    const root = join(repoRoot, "src/lib/enterprise/persistent-queue-runtime");
    const files = collectTsFiles(root).map((f) => f.replace(/\\/g, "/"));
    assert.ok(files.some((f) => f.endsWith("/providers/create-persistent-queue-runtime-port.ts")));
    assert.ok(files.some((f) => f.endsWith("/factory/persistent-queue-runtime-factory.ts")));
    assert.ok(files.some((f) => f.endsWith("/registry/persistent-queue-runtime-registry.ts")));
    assert.equal(files.filter((f) => f.includes("/factory/")).length, 2);
    assert.equal(files.filter((f) => f.includes("/registry/")).length, 2);
    assert.equal(
      files.filter((f) => /adapters\/.*persistent-queue-runtime-adapter\.ts$/.test(f)).length,
      3,
    );
  });
});

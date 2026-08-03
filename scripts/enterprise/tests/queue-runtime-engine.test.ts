#!/usr/bin/env node
/**
 * INF-05 — Enterprise Queue Runtime
 * Prova: Application → QueueRuntimePort → Adapter → Factory → Registry → Store
 *         + Enterprise Runtime + TISS Runtime (dependência preparada sem consumo)
 *         + enqueue / dequeue / peek / ack / nack / purge / stats / health
 *         + ausência de RabbitMQ / Kafka / Azure / Redis / Workers / Scheduler
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_QUEUE_RUNTIME_PROVIDER_COUNT,
  DEFAULT_QUEUE_RUNTIME_ADAPTER_ID,
  DEFAULT_QUEUE_RUNTIME_CAPABILITIES,
  DefaultQueueRuntimeAdapter,
  EnterpriseQueueRuntimeAdapter,
  IN_MEMORY_QUEUE_RUNTIME_STORE_ID,
  InMemoryQueueRuntimeStore,
  MOCK_QUEUE_RUNTIME_ADAPTER_ID,
  MockQueueRuntimeAdapter,
  QueueRuntimeFactory,
  QueueRuntimeProvider,
  QueueRuntimeRegistry,
  createDefaultQueueRuntimeRegistry,
  createQueueRuntimeFactory,
  createQueueRuntimePort,
  getQueueRuntimeFactory,
  getQueueRuntimeHealthSummary,
  resetQueueRuntimeIdSequences,
  type QueueRuntimePort,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
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

describe("INF-05 QueueRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: QueueRuntimePort = new MockQueueRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.status, "ready");
    assert.equal(health.kind, "canonical-queue-health");
    assert.equal(health.runtimeReady, true);
    assert.equal(health.realQueueBackend, false);
    assert.equal(health.messagesPublished, false);
    assert.equal(health.workersInvoked, false);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_QUEUE_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsCanonicalQueue, true);
    assert.equal(caps.runtimeReady, true);
    assert.equal(caps.realQueueBackend, false);
    assert.equal(caps.implementsRabbitMq, false);
    assert.equal(caps.implementsKafka, false);
    assert.equal(caps.implementsAzureServiceBus, false);
    assert.equal(caps.implementsAzureQueue, false);
    assert.equal(caps.implementsRedis, false);
    assert.equal(caps.implementsBullMq, false);
    assert.equal(caps.implementsWorkers, false);
    assert.equal(caps.implementsScheduler, false);
    assert.equal(caps.implementsDeadLetter, false);
    assert.equal(caps.implementsRetryReal, false);
    assert.equal(caps.persistenceImplemented, false);
    assert.equal(caps.canonical.kind, "canonical-queue-capabilities");
    assert.equal(caps.canonical.runtimeReady, true);
    assert.equal(caps.canonical.realQueueBackend, false);
  });

  it("DefaultQueueRuntimeAdapter é o adapter enterprise oficial", () => {
    assert.equal(EnterpriseQueueRuntimeAdapter, DefaultQueueRuntimeAdapter);
    const port = new DefaultQueueRuntimeAdapter({
      provider: "enterprise",
    });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_QUEUE_RUNTIME_ADAPTER_ID);
  });

  it("provider default resolve enterprise", () => {
    const port = createQueueRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(QueueRuntimeProvider.create().providerId, "enterprise");
  });

  it("factory resolve mock / test / default / enterprise", () => {
    const factory = createQueueRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(
      getQueueRuntimeFactory().getRegistry().list().length,
      BUILTIN_QUEUE_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("enqueue → dequeue → peek → ack → nack → purge → stats com flags estruturais", async () => {
    resetQueueRuntimeIdSequences();
    const port = createQueueRuntimePort({ provider: "enterprise" });

    const enqueued = await port.enqueue({
      queueName: "foundation-queue",
      payloadRef: "payload://structural-01",
      correlationId: "corr-inf-05",
    });
    assert.equal(enqueued.ok, true);
    assert.ok(enqueued.result?.resultId);
    assert.equal(enqueued.result?.realQueueBackend, false);
    assert.equal(enqueued.result?.messagesPublished, false);
    assert.equal(enqueued.result?.workersInvoked, false);
    assert.equal(enqueued.result?.runtimeReady, true);
    assert.equal(enqueued.queueMessage?.status, "enqueued");
    assert.equal(enqueued.queue?.queueName, "foundation-queue");

    const peeked = await port.peek({ queueName: "foundation-queue" });
    assert.equal(peeked.ok, true);
    assert.equal(peeked.queueMessage?.messageId, enqueued.queueMessage?.messageId);

    const dequeued = await port.dequeue({ queueName: "foundation-queue" });
    assert.equal(dequeued.ok, true);
    assert.equal(dequeued.queueMessage?.status, "dequeued");
    assert.equal(dequeued.result?.messagesConsumed, false);

    const acked = await port.ack({ messageId: dequeued.queueMessage!.messageId });
    assert.equal(acked.ok, true);
    assert.equal(acked.queueMessage?.status, "acked");

    const enqueued2 = await port.enqueue({
      queueName: "foundation-queue",
      payloadRef: "payload://structural-02",
    });
    const nacked = await port.nack({ messageId: enqueued2.queueMessage!.messageId });
    assert.equal(nacked.ok, true);
    assert.equal(nacked.queueMessage?.status, "nacked");

    const enqueued3 = await port.enqueue({
      queueName: "foundation-queue",
      payloadRef: "payload://structural-03",
    });
    assert.equal(enqueued3.ok, true);

    const purged = await port.purge({ queueName: "foundation-queue" });
    assert.equal(purged.ok, true);
    assert.ok((purged.purgedCount ?? 0) >= 1);
    assert.equal(purged.queue?.messageCount, 0);

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "canonical-queue-statistics");
    assert.equal(stats.statistics?.realQueueBackendCount, 0);
    assert.equal(stats.statistics?.messagesPublishedCount, 0);
    assert.equal(stats.statistics?.workersInvokedCount, 0);
    assert.equal(stats.statistics?.persistenceImplementedCount, 0);
  });

  it("InMemory store oficial e estatísticas zeradas para backends reais", () => {
    const store = new InMemoryQueueRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_QUEUE_RUNTIME_STORE_ID);
    const stats = store.statistics();
    assert.equal(stats.kind, "canonical-queue-statistics");
    assert.equal(stats.realQueueBackendCount, 0);
    assert.equal(stats.messagesPublishedCount, 0);
    assert.equal(stats.workersInvokedCount, 0);
    assert.equal(DEFAULT_QUEUE_RUNTIME_CAPABILITIES.runtimeReady, true);
    assert.equal(DEFAULT_QUEUE_RUNTIME_CAPABILITIES.realQueueBackend, false);
  });

  it("retry recupera falha transitória", async () => {
    const port = new DefaultQueueRuntimeAdapter({
      provider: "enterprise",
      failAttempts: 1,
      defaultRetryCount: 1,
      defaultRetryBackoffMs: 1,
    });
    const result = await port.enqueue({ queueName: "retry-queue" });
    assert.equal(result.ok, true);
    assert.ok((result.telemetry?.attempts ?? 0) >= 2);
  });

  it("AbortSignal cancela operação", async () => {
    const port = createQueueRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.enqueue({
      queueName: "abort-queue",
      signal: controller.signal,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "QUEUE_RUNTIME_CANCELLED");
  });

  it("registry/factory sem fallback silencioso", () => {
    const registry = createDefaultQueueRuntimeRegistry();
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.snapshot().count, BUILTIN_QUEUE_RUNTIME_PROVIDER_COUNT);
    assert.ok(registry instanceof QueueRuntimeRegistry);

    const factory = new QueueRuntimeFactory({ registry });
    assert.throws(() => factory.create({ provider: "unknown" as never }), /não está registrado/);
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createQueueRuntimePort({ provider: "enterprise" });
    const summary = await getQueueRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.info.providerType, "QUEUE_RUNTIME");
    assert.equal(summary.capabilities.runtimeReady, true);
    assert.equal(summary.capabilities.realQueueBackend, false);
    assert.equal(summary.capabilities.implementsRabbitMq, false);
  });
});

describe("INF-05 cadeia Enterprise / TISS / Queue Runtime", () => {
  it("Enterprise Runtime expõe Queue Runtime + health queueRuntimeOk", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    assert.equal(runtime.getQueueRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getTISSRuntimePort().providerId, "default");
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesQueueRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesNamespaceRuntimePort, true);

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.queueRuntimeOk, true);
    assert.equal(health.tissRuntimeOk, true);
    assert.equal(health.namespaceRuntimeOk, true);
  });

  it("TISS Runtime prepara dependência Queue Runtime sem consumir filas", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const tiss = runtime.getTISSRuntimePort();
    const queue = runtime.getQueueRuntimePort();

    const tissHealth = await tiss.health();
    assert.equal(tissHealth.ok, true);
    assert.equal(tissHealth.queueRuntimeOk, true);

    const before = await queue.stats();
    const beforeCount = before.statistics?.totalMessages ?? 0;

    const processed = await tiss.process({
      kind: "canonical-tiss-request",
      mode: "structural-process",
      metadata: {
        kind: "canonical-tiss-metadata",
        sessionId: "sess-inf-05",
        correlationId: "corr-inf-05",
      },
    });
    assert.equal(processed.ok, true);

    const after = await queue.stats();
    assert.equal(after.statistics?.totalMessages ?? 0, beforeCount);
    assert.equal(after.statistics?.messagesPublishedCount, 0);
    assert.equal(after.statistics?.workersInvokedCount, 0);
  });
});

describe("INF-05 ausência de backends / workers / bypass", () => {
  it("módulo queue-runtime não referencia backends reais nem workers", () => {
    const root = join(repoRoot, "src/lib/enterprise/queue-runtime");
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
      /from ["']axios["']/,
      /redis\.createClient\s*\(/,
      /new\s+WebSocket\s*\(/,
      /setInterval\s*\(/,
      /createClient\s*\(\s*\{[^}]*redis/i,
    ];

    for (const file of files) {
      const src = readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        assert.equal(pattern.test(src), false, `${file} matched ${pattern}`);
      }
    }
  });

  it("Enterprise Runtime wiring inclui getQueueRuntimePort e createQueueRuntimePort", () => {
    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.match(enterpriseRuntime, /createQueueRuntimePort/);
    assert.match(enterpriseRuntime, /getQueueRuntimePort/);
    assert.match(enterpriseRuntime, /queueRuntimeOk/);
  });

  it("TISS Runtime wiring inclui getQueueRuntimePort sem enqueue/dequeue no process", () => {
    const tissAdapter = readFileSync(
      join(repoRoot, "src/lib/enterprise/tiss-runtime/adapters/default-tiss-runtime-adapter.ts"),
      "utf8",
    );
    assert.match(tissAdapter, /getQueueRuntimePort/);
    assert.match(tissAdapter, /usesQueueRuntimePort/);
    assert.match(tissAdapter, /queueRuntimeOk/);

    const processStart = tissAdapter.indexOf("async process(");
    assert.ok(processStart > 0);
    const processBody = tissAdapter.slice(processStart);
    assert.equal(/queueRuntimePort\.(enqueue|dequeue|peek|ack|nack|purge)\s*\(/.test(processBody), false);
  });

  it("sem Provider/Adapter/Factory/Registry paralelo", () => {
    const root = join(repoRoot, "src/lib/enterprise/queue-runtime");
    const files = collectTsFiles(root).map((f) => f.replace(/\\/g, "/"));
    assert.ok(files.some((f) => f.endsWith("/providers/create-queue-runtime-port.ts")));
    assert.ok(files.some((f) => f.endsWith("/factory/queue-runtime-factory.ts")));
    assert.ok(files.some((f) => f.endsWith("/registry/queue-runtime-registry.ts")));
    assert.equal(files.filter((f) => f.includes("/factory/")).length, 2);
    assert.equal(files.filter((f) => f.includes("/registry/")).length, 2);
    assert.equal(
      files.filter((f) => /adapters\/.*queue-runtime-adapter\.ts$/.test(f)).length,
      2,
    );
  });
});

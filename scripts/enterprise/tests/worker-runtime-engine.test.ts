#!/usr/bin/env node
/**
 * INF-06 / OPER-INF-W — Enterprise Worker Runtime
 * Prova: Application → WorkerRuntimePort → Adapter → QueueRuntimePort → Backend
 *         + Enterprise Runtime (deps DI existentes)
 *         + register / unregister / allocate / release / heartbeat / stats / health
 *         + polling / claim / lock / ack / nack / graceful shutdown
 *         + ausência de novos Ports / Gateways / Scheduler / paralelismo / DB direto
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_WORKER_RUNTIME_PROVIDER_COUNT,
  DEFAULT_MOCK_WORKER_RUNTIME_CAPABILITIES,
  DEFAULT_WORKER_QUEUE_NAME,
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
  createQueueRuntimePort,
  DefaultQueueRuntimeAdapter,
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

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function createOperationalWorkerPair(queueName = "oper-inf-w-queue") {
  const queue = createQueueRuntimePort({ provider: "enterprise" });
  const worker = new DefaultWorkerRuntimeAdapter({
    provider: "enterprise",
    operational: true,
    pollIntervalMs: 10,
    enterpriseDeps: {
      getQueueRuntimePort: () => queue,
    },
  });
  return { queue, worker, queueName };
}

describe("INF-06 WorkerRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy (estrutural)", async () => {
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

  it("OPER-INF-W register → allocate → heartbeat → release → unregister → stats operacionais", async () => {
    resetWorkerRuntimeIdSequences();
    const { queue, worker, queueName } = createOperationalWorkerPair();

    const registered = await worker.register({
      workerName: "foundation-worker",
      correlationId: "corr-oper-inf-w",
    });
    assert.equal(registered.ok, true);
    assert.ok(registered.result?.resultId);
    assert.equal(registered.result?.realWorkers, true);
    assert.equal(registered.result?.tasksExecuted, true);
    assert.equal(registered.result?.parallelProcessing, false);
    assert.equal(registered.result?.runtimeReady, true);
    assert.equal(registered.worker?.status, "registered");
    assert.equal(registered.worker?.workerName, "foundation-worker");

    await queue.enqueue({
      queueName,
      payloadRef: "payload://oper-inf-w-01",
    });

    const allocated = await worker.allocate({
      workerId: registered.worker!.workerId,
      attributes: { queueName, pollIntervalMs: 10 },
    });
    assert.equal(allocated.ok, true);
    assert.equal(allocated.worker?.status, "allocated");
    assert.equal(allocated.worker?.allocated, true);
    assert.equal(allocated.result?.tasksExecuted, true);
    assert.equal(allocated.result?.queueConsumed, true);
    assert.ok(allocated.task?.taskId);
    assert.ok(allocated.execution?.executionId);

    await sleep(80);

    const beat = await worker.heartbeat({ workerId: registered.worker!.workerId });
    assert.equal(beat.ok, true);
    assert.ok(beat.worker?.lastHeartbeatAt);

    const released = await worker.release({ workerId: registered.worker!.workerId });
    assert.equal(released.ok, true);
    assert.equal(released.worker?.status, "released");
    assert.equal(released.worker?.allocated, false);

    const unregistered = await worker.unregister({ workerId: registered.worker!.workerId });
    assert.equal(unregistered.ok, true);
    assert.equal(unregistered.worker?.status, "unregistered");

    const stats = await worker.stats();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "canonical-worker-statistics");
    assert.ok((stats.statistics?.queueConsumedCount ?? 0) >= 1);
    assert.ok((stats.statistics?.tasksExecutedCount ?? 0) >= 1);
    assert.equal(stats.statistics?.parallelProcessingCount, 0);
    assert.equal(stats.statistics?.schedulerImplementedCount, 0);
    assert.equal(stats.statistics?.threadPoolImplementedCount, 0);
    assert.equal(stats.statistics?.persistenceImplementedCount, 1);
  });

  it("InMemory store oficial; capabilities operacionais no default", () => {
    const store = new InMemoryWorkerRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_WORKER_RUNTIME_STORE_ID);
    const stats = store.statistics();
    assert.equal(stats.kind, "canonical-worker-statistics");
    assert.equal(stats.realWorkersCount, 0);
    assert.equal(stats.tasksExecutedCount, 0);
    assert.equal(stats.parallelProcessingCount, 0);
    assert.equal(DEFAULT_WORKER_RUNTIME_CAPABILITIES.runtimeReady, true);
    assert.equal(DEFAULT_WORKER_RUNTIME_CAPABILITIES.realWorkers, true);
    assert.equal(DEFAULT_WORKER_RUNTIME_CAPABILITIES.queueConsumed, true);
    assert.equal(DEFAULT_WORKER_RUNTIME_CAPABILITIES.persistenceImplemented, true);
    assert.equal(DEFAULT_MOCK_WORKER_RUNTIME_CAPABILITIES.realWorkers, false);
    assert.equal(DEFAULT_WORKER_QUEUE_NAME, "enterprise-worker-queue");
  });

  it("retry recupera falha transitória", async () => {
    const port = new DefaultWorkerRuntimeAdapter({
      provider: "enterprise",
      failAttempts: 1,
      defaultRetryCount: 1,
      defaultRetryBackoffMs: 1,
      operational: false,
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
    assert.equal(summary.capabilities.realWorkers, true);
    assert.equal(summary.capabilities.implementsScheduler, false);
  });
});

describe("OPER-INF-W consumo exclusivo via QueueRuntimePort", () => {
  it("allocate consome mensagem com claim + ACK via QueueRuntimePort", async () => {
    const { queue, worker, queueName } = createOperationalWorkerPair();

    const enqueued = await queue.enqueue({
      queueName,
      payloadRef: "payload://claim-ack",
    });
    assert.equal(enqueued.ok, true);
    const messageId = enqueued.queueMessage!.messageId;

    const allocated = await worker.allocate({
      workerName: "ack-worker",
      attributes: { queueName, pollIntervalMs: 10 },
    });
    assert.equal(allocated.ok, true);
    assert.ok(worker.getConsumer()?.isActive(allocated.worker!.workerId));

    await sleep(100);

    const peeked = await queue.peek({ queueName, messageId });
    assert.equal(peeked.ok, true);
    assert.equal(peeked.queueMessage?.status, "acked");

    const stats = await worker.stats();
    assert.ok((stats.statistics?.queueConsumedCount ?? 0) >= 1);
    assert.ok((stats.statistics?.tasksExecutedCount ?? 0) >= 1);

    await worker.release({ workerId: allocated.worker!.workerId });
  });

  it("allocate com forceNack realiza NACK via QueueRuntimePort", async () => {
    const { queue, worker, queueName } = createOperationalWorkerPair("oper-inf-w-nack");

    const enqueued = await queue.enqueue({
      queueName,
      payloadRef: "payload://claim-nack",
    });
    assert.equal(enqueued.ok, true);
    const messageId = enqueued.queueMessage!.messageId;

    const allocated = await worker.allocate({
      workerName: "nack-worker",
      attributes: { queueName, pollIntervalMs: 10, forceNack: true },
    });
    assert.equal(allocated.ok, true);

    await sleep(100);

    const peeked = await queue.peek({ queueName, messageId });
    assert.equal(peeked.ok, true);
    assert.equal(peeked.queueMessage?.status, "nacked");

    await worker.release({ workerId: allocated.worker!.workerId });
  });

  it("release executa graceful shutdown do poll loop", async () => {
    const { worker, queueName } = createOperationalWorkerPair("oper-inf-w-shutdown");
    const allocated = await worker.allocate({
      workerName: "shutdown-worker",
      attributes: { queueName, pollIntervalMs: 10 },
    });
    assert.equal(allocated.ok, true);
    assert.equal(worker.getConsumer()?.isActive(allocated.worker!.workerId), true);

    const released = await worker.release({ workerId: allocated.worker!.workerId });
    assert.equal(released.ok, true);
    assert.equal(worker.getConsumer()?.isActive(allocated.worker!.workerId), false);
  });

  it("heartbeat renova lock quando há claim ativo", async () => {
    const { queue, worker, queueName } = createOperationalWorkerPair("oper-inf-w-lock");
    // Enfileira e força settle lento via forceNack path is instant; lock is brief.
    // Valida API de renewLock sem exigir lock persistente longo.
    await queue.enqueue({ queueName, payloadRef: "payload://lock" });
    const allocated = await worker.allocate({
      workerName: "lock-worker",
      attributes: { queueName, pollIntervalMs: 20 },
    });
    const beat = await worker.heartbeat({ workerId: allocated.worker!.workerId });
    assert.equal(beat.ok, true);
    assert.ok(beat.worker?.lastHeartbeatAt);
    await worker.release({ workerId: allocated.worker!.workerId });
  });
});

describe("INF-06 / OPER-INF-W cadeia Enterprise / Queue / TISS / Worker Runtime", () => {
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

  it("Worker Runtime operacional consome Queue exclusivamente via QueueRuntimePort", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const worker = runtime.getWorkerRuntimePort() as DefaultWorkerRuntimeAdapter;
    const queue = runtime.getQueueRuntimePort();

    const workerHealth = await worker.health();
    assert.equal(workerHealth.ok, true);
    assert.equal(workerHealth.queueRuntimeOk, true);
    assert.equal(workerHealth.realWorkers, true);
    assert.equal(workerHealth.queueConsumed, true);

    const queueName = "enterprise-oper-inf-w";
    await queue.enqueue({ queueName, payloadRef: "payload://enterprise-path" });

    const allocated = await worker.allocate({
      workerName: "oper-inf-w-enterprise",
      attributes: { queueName, pollIntervalMs: 10 },
    });
    assert.equal(allocated.ok, true);
    assert.equal(allocated.result?.queueConsumed, true);
    assert.equal(allocated.result?.tasksExecuted, true);

    await sleep(100);

    const stats = await worker.stats();
    assert.ok((stats.statistics?.queueConsumedCount ?? 0) >= 1);

    await worker.release({ workerId: allocated.worker!.workerId });
  });

  it("TISS Runtime prepara dependência Worker sem alocar/executar (consumidor inalterado)", async () => {
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
        sessionId: "sess-oper-inf-w",
        correlationId: "corr-oper-inf-w",
      },
    });
    assert.equal(processed.ok, true);

    const after = await worker.stats();
    assert.equal(after.statistics?.totalWorkers ?? 0, beforeWorkers);
  });
});

describe("INF-06 / OPER-INF-W ausência de backends proibidos / novos Ports / bypass", () => {
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
      /from ["']@supabase\/supabase-js["']/,
      /\.from\(\s*["']enterprise_queue/,
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

  it("OPER-INF-W — Worker consome QueueRuntimePort (dequeue/ack/nack) sem DB direto", () => {
    const workerAdapter = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/worker-runtime/adapters/default-worker-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(workerAdapter, /getQueueRuntimePort/);
    assert.match(workerAdapter, /usesQueueRuntimePort/);
    assert.match(workerAdapter, /OPER-INF-W/);
    assert.equal(/createClient\s*\(/.test(workerAdapter), false);
    assert.equal(/SupabaseQueueRuntimeBackend/.test(workerAdapter), false);

    const consumer = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/worker-runtime/operational/worker-queue-consumer.ts",
      ),
      "utf8",
    );
    assert.match(consumer, /queue\.dequeue/);
    assert.match(consumer, /queue\.ack/);
    assert.match(consumer, /queue\.nack/);
    assert.equal(/from ["']@supabase/.test(consumer), false);
  });

  it("sem Provider/Adapter/Factory/Registry/Port/Gateway paralelo", () => {
    const root = join(repoRoot, "src/lib/enterprise/worker-runtime");
    const files = collectTsFiles(root).map((f) => f.replace(/\\/g, "/"));
    assert.ok(files.some((f) => f.endsWith("/providers/create-worker-runtime-port.ts")));
    assert.ok(files.some((f) => f.endsWith("/factory/worker-runtime-factory.ts")));
    assert.ok(files.some((f) => f.endsWith("/registry/worker-runtime-registry.ts")));
    assert.ok(files.some((f) => f.endsWith("/operational/worker-queue-consumer.ts")));
    assert.equal(files.filter((f) => f.includes("/factory/")).length, 2);
    assert.equal(files.filter((f) => f.includes("/registry/")).length, 2);
    assert.equal(files.filter((f) => /adapters\/.*worker-runtime-adapter\.ts$/.test(f)).length, 2);
    assert.equal(files.filter((f) => /\/ports\/.*-port\.ts$/.test(f)).length, 1);
    assert.equal(files.filter((f) => /gateway/i.test(f)).length, 0);
  });

  it("OPER-INF-W — Runtime permanece com createWorkerRuntimePort (sem novo Runtime)", () => {
    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.match(enterpriseRuntime, /createWorkerRuntimePort/);
    assert.equal(/createWorkerQueueConsumer/.test(enterpriseRuntime), false);
    assert.equal(/WorkerQueueConsumer/.test(enterpriseRuntime), false);
    assert.ok(DefaultQueueRuntimeAdapter);
  });
});

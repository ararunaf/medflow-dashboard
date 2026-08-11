#!/usr/bin/env node
/**
 * INF-07 / OPER-INF-S — Enterprise Scheduler Runtime
 * Prova: Application → SchedulerRuntimePort → Adapter → WorkerRuntimePort → QueueRuntimePort
 *         + Enterprise Runtime (deps DI existentes)
 *         + register / unregister / schedule / cancel / list / stats / health
 *         + polling temporal / agendamento / cancelamento / heartbeat /
 *           graceful shutdown / concorrência / recuperação pós-restart
 *         + ausência de novos Ports / Gateways / Cron / Queue direto / DB direto
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_SCHEDULER_RUNTIME_PROVIDER_COUNT,
  DEFAULT_MOCK_SCHEDULER_RUNTIME_CAPABILITIES,
  DEFAULT_SCHEDULER_RUNTIME_ADAPTER_ID,
  DEFAULT_SCHEDULER_RUNTIME_CAPABILITIES,
  DEFAULT_SCHEDULER_WORKER_QUEUE_NAME,
  DefaultSchedulerRuntimeAdapter,
  EnterpriseSchedulerRuntimeAdapter,
  IN_MEMORY_SCHEDULER_RUNTIME_STORE_ID,
  InMemorySchedulerRuntimeStore,
  MOCK_SCHEDULER_RUNTIME_ADAPTER_ID,
  MockSchedulerRuntimeAdapter,
  SchedulerRuntimeFactory,
  SchedulerRuntimeProvider,
  SchedulerRuntimeRegistry,
  createDefaultSchedulerRuntimeRegistry,
  createSchedulerRuntimeFactory,
  createSchedulerRuntimePort,
  getSchedulerRuntimeFactory,
  getSchedulerRuntimeHealthSummary,
  resetSchedulerRuntimeIdSequences,
  type SchedulerRuntimePort,
} from "../../../src/lib/enterprise/scheduler-runtime/index.ts";
import {
  createQueueRuntimePort,
  DefaultQueueRuntimeAdapter,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
import {
  createWorkerRuntimePort,
  DefaultWorkerRuntimeAdapter,
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

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function createOperationalSchedulerTriplet(queueName = "oper-inf-s-queue") {
  const queue = createQueueRuntimePort({ provider: "enterprise" });
  const worker = new DefaultWorkerRuntimeAdapter({
    provider: "enterprise",
    operational: true,
    pollIntervalMs: 10,
    enterpriseDeps: {
      getQueueRuntimePort: () => queue,
    },
  });
  const scheduler = new DefaultSchedulerRuntimeAdapter({
    provider: "enterprise",
    operational: true,
    pollIntervalMs: 10,
    maxConcurrent: 1,
    enterpriseDeps: {
      getQueueRuntimePort: () => queue,
      getWorkerRuntimePort: () => worker,
    },
  });
  return { queue, worker, scheduler, queueName };
}

describe("INF-07 SchedulerRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy (estrutural)", async () => {
    const port: SchedulerRuntimePort = new MockSchedulerRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.status, "ready");
    assert.equal(health.kind, "canonical-scheduler-health");
    assert.equal(health.runtimeReady, true);
    assert.equal(health.realScheduler, false);
    assert.equal(health.cronImplemented, false);
    assert.equal(health.timerImplemented, false);
    assert.equal(health.workersOrchestrated, false);
    assert.equal(health.parallelProcessing, false);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_SCHEDULER_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsCanonicalSchedule, true);
    assert.equal(caps.usesQueueRuntimePort, true);
    assert.equal(caps.usesWorkerRuntimePort, true);
    assert.equal(caps.runtimeReady, true);
    assert.equal(caps.realScheduler, false);
    assert.equal(caps.implementsRealScheduler, false);
    assert.equal(caps.implementsCron, false);
    assert.equal(caps.implementsTimer, false);
    assert.equal(caps.implementsWorkers, false);
    assert.equal(caps.implementsBullMq, false);
    assert.equal(caps.implementsQuartz, false);
    assert.equal(caps.persistenceImplemented, false);
    assert.equal(caps.canonical.kind, "canonical-scheduler-capabilities");
    assert.equal(caps.canonical.runtimeReady, true);
    assert.equal(caps.canonical.realScheduler, false);
    assert.equal(DEFAULT_MOCK_SCHEDULER_RUNTIME_CAPABILITIES.realScheduler, false);
  });

  it("DefaultSchedulerRuntimeAdapter é o adapter enterprise oficial", () => {
    assert.equal(EnterpriseSchedulerRuntimeAdapter, DefaultSchedulerRuntimeAdapter);
    const port = new DefaultSchedulerRuntimeAdapter({
      provider: "enterprise",
    });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_SCHEDULER_RUNTIME_ADAPTER_ID);
    assert.equal(port.capabilities().realScheduler, true);
  });

  it("provider default resolve enterprise", () => {
    const port = createSchedulerRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(SchedulerRuntimeProvider.create().providerId, "enterprise");
  });

  it("factory resolve mock / test / default / enterprise", () => {
    const factory = createSchedulerRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(
      getSchedulerRuntimeFactory().getRegistry().list().length,
      BUILTIN_SCHEDULER_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("register → schedule → list → cancel → unregister → stats (enterprise operacional)", async () => {
    resetSchedulerRuntimeIdSequences();
    const port = createSchedulerRuntimePort({ provider: "enterprise" });

    const registered = await port.register({
      scheduleName: "foundation-schedule",
      correlationId: "corr-inf-07",
    });
    assert.equal(registered.ok, true);
    assert.ok(registered.result?.resultId);
    assert.equal(registered.result?.realScheduler, true);
    assert.equal(registered.result?.cronImplemented, false);
    assert.equal(registered.result?.timerImplemented, true);
    assert.equal(registered.result?.runtimeReady, true);
    assert.equal(registered.schedule?.status, "registered");
    assert.equal(registered.schedule?.scheduleName, "foundation-schedule");

    const scheduled = await port.schedule({
      scheduleId: registered.schedule!.scheduleId,
      attributes: { delayMs: 60_000, pollIntervalMs: 50 },
    });
    assert.equal(scheduled.ok, true);
    assert.equal(scheduled.schedule?.status, "scheduled");
    assert.equal(scheduled.schedule?.active, true);
    assert.equal(scheduled.result?.cronImplemented, false);
    assert.equal(scheduled.result?.workersOrchestrated, true);
    assert.equal(scheduled.result?.queueConsumed, false);
    assert.ok(scheduled.job?.jobId);
    assert.ok(scheduled.dispatch?.dispatchId);

    const listed = await port.list({ scheduleId: registered.schedule!.scheduleId });
    assert.equal(listed.ok, true);
    assert.equal(listed.schedules?.length, 1);
    assert.ok((listed.jobs?.length ?? 0) >= 1);

    const cancelled = await port.cancel({
      scheduleId: registered.schedule!.scheduleId,
      jobId: scheduled.job!.jobId,
    });
    assert.equal(cancelled.ok, true);
    assert.equal(cancelled.schedule?.status, "cancelled");
    assert.equal(cancelled.schedule?.active, false);

    const unregistered = await port.unregister({ scheduleId: registered.schedule!.scheduleId });
    assert.equal(unregistered.ok, true);
    assert.equal(unregistered.schedule?.status, "unregistered");

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "canonical-scheduler-statistics");
    assert.equal(stats.statistics?.cronImplementedCount, 0);
    assert.equal(stats.statistics?.queueConsumedCount, 0);
    assert.equal(stats.statistics?.parallelProcessingCount, 0);
  });

  it("InMemory store oficial e capabilities default operacionais", () => {
    const store = new InMemorySchedulerRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_SCHEDULER_RUNTIME_STORE_ID);
    const stats = store.statistics();
    assert.equal(stats.kind, "canonical-scheduler-statistics");
    assert.equal(stats.realSchedulerCount, 0);
    assert.equal(stats.cronImplementedCount, 0);
    assert.equal(stats.timerImplementedCount, 0);
    assert.equal(DEFAULT_SCHEDULER_RUNTIME_CAPABILITIES.runtimeReady, true);
    assert.equal(DEFAULT_SCHEDULER_RUNTIME_CAPABILITIES.realScheduler, true);
    assert.equal(DEFAULT_SCHEDULER_RUNTIME_CAPABILITIES.workersOrchestrated, true);
  });

  it("retry estrutural recupera falha transitória", async () => {
    const port = new DefaultSchedulerRuntimeAdapter({
      provider: "enterprise",
      operational: false,
      failAttempts: 1,
      defaultRetryCount: 1,
      defaultRetryBackoffMs: 1,
    });
    const result = await port.register({ scheduleName: "retry-schedule" });
    assert.equal(result.ok, true);
    assert.ok((result.telemetry?.attempts ?? 0) >= 2);
  });

  it("AbortSignal cancela operação", async () => {
    const port = createSchedulerRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.register({
      scheduleName: "abort-schedule",
      signal: controller.signal,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "SCHEDULER_RUNTIME_CANCELLED");
  });

  it("registry/factory sem fallback silencioso", () => {
    const registry = createDefaultSchedulerRuntimeRegistry();
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.snapshot().count, BUILTIN_SCHEDULER_RUNTIME_PROVIDER_COUNT);
    assert.ok(registry instanceof SchedulerRuntimeRegistry);

    const factory = new SchedulerRuntimeFactory({ registry });
    assert.throws(() => factory.create({ provider: "unknown" as never }), /não está registrado/);
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createSchedulerRuntimePort({ provider: "enterprise" });
    const summary = await getSchedulerRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.info.providerType, "SCHEDULER_RUNTIME");
    assert.equal(summary.capabilities.runtimeReady, true);
    assert.equal(summary.capabilities.realScheduler, true);
    assert.equal(summary.capabilities.implementsCron, false);
  });
});

describe("OPER-INF-S acionamento exclusivo via WorkerRuntimePort", () => {
  it("schedule dispara Worker.allocate quando due (delayMs=0)", async () => {
    const { worker, scheduler, queueName } = createOperationalSchedulerTriplet();

    const before = await worker.stats();
    const beforeWorkers = before.statistics?.totalWorkers ?? 0;

    const scheduled = await scheduler.schedule({
      scheduleName: "oper-inf-s-trigger",
      attributes: {
        delayMs: 0,
        pollIntervalMs: 10,
        queueName,
        workerName: "oper-inf-s-worker",
      },
    });
    assert.equal(scheduled.ok, true);
    assert.ok(scheduler.getDispatcher()?.isActive(scheduled.schedule!.scheduleId));

    await sleep(80);

    const after = await worker.stats();
    assert.ok((after.statistics?.totalWorkers ?? 0) > beforeWorkers);

    const stats = await scheduler.stats();
    assert.ok((stats.statistics?.workersOrchestratedCount ?? 0) >= 1);
    assert.ok((stats.statistics?.jobDispatcherImplementedCount ?? 0) >= 1);

    await scheduler.cancel({ scheduleId: scheduled.schedule!.scheduleId });
  });

  it("cancel executa graceful shutdown do poll loop", async () => {
    const { scheduler, queueName } = createOperationalSchedulerTriplet("oper-inf-s-shutdown");
    const scheduled = await scheduler.schedule({
      scheduleName: "shutdown-schedule",
      attributes: { delayMs: 60_000, pollIntervalMs: 10, queueName },
    });
    assert.equal(scheduled.ok, true);
    assert.equal(scheduler.getDispatcher()?.isActive(scheduled.schedule!.scheduleId), true);

    const cancelled = await scheduler.cancel({ scheduleId: scheduled.schedule!.scheduleId });
    assert.equal(cancelled.ok, true);
    assert.equal(scheduler.getDispatcher()?.isActive(scheduled.schedule!.scheduleId), false);
  });

  it("heartbeat renova liveness da sessão (e do Worker alocado)", async () => {
    const { scheduler, queueName } = createOperationalSchedulerTriplet("oper-inf-s-hb");
    const scheduled = await scheduler.schedule({
      scheduleName: "hb-schedule",
      attributes: { delayMs: 0, pollIntervalMs: 20, queueName, workerName: "hb-worker" },
    });
    assert.equal(scheduled.ok, true);
    await sleep(60);
    const beat = await scheduler.getDispatcher()!.heartbeat(scheduled.schedule!.scheduleId);
    assert.equal(beat.renewed, true);
    assert.ok(beat.lastHeartbeatAt);
    await scheduler.cancel({ scheduleId: scheduled.schedule!.scheduleId });
  });

  it("controle de concorrência respeita maxConcurrent=1", async () => {
    const queue = createQueueRuntimePort({ provider: "enterprise" });
    let allocateCount = 0;
    const slowWorker = new DefaultWorkerRuntimeAdapter({
      provider: "enterprise",
      operational: true,
      pollIntervalMs: 10,
      enterpriseDeps: { getQueueRuntimePort: () => queue },
    });
    const originalAllocate = slowWorker.allocate.bind(slowWorker);
    slowWorker.allocate = async (input) => {
      allocateCount += 1;
      await sleep(80);
      return originalAllocate(input);
    };

    const scheduler = new DefaultSchedulerRuntimeAdapter({
      provider: "enterprise",
      operational: true,
      pollIntervalMs: 10,
      maxConcurrent: 1,
      enterpriseDeps: {
        getQueueRuntimePort: () => queue,
        getWorkerRuntimePort: () => slowWorker,
      },
    });

    const a = await scheduler.schedule({
      scheduleName: "conc-a",
      attributes: { delayMs: 0, pollIntervalMs: 10, queueName: "oper-inf-s-conc", repeat: true },
    });
    const b = await scheduler.schedule({
      scheduleName: "conc-b",
      attributes: { delayMs: 0, pollIntervalMs: 10, queueName: "oper-inf-s-conc", repeat: true },
    });
    assert.equal(a.ok, true);
    assert.equal(b.ok, true);

    await sleep(50);
    assert.ok(scheduler.getDispatcher()!.getActiveDispatchCount() <= 1);

    await scheduler.cancel({ scheduleId: a.schedule!.scheduleId });
    await scheduler.cancel({ scheduleId: b.schedule!.scheduleId });
    assert.ok(allocateCount >= 1);
  });

  it("recuperação pós-restart reativa schedules ativos do store", async () => {
    const queue = createQueueRuntimePort({ provider: "enterprise" });
    const worker = new DefaultWorkerRuntimeAdapter({
      provider: "enterprise",
      operational: true,
      pollIntervalMs: 10,
      enterpriseDeps: { getQueueRuntimePort: () => queue },
    });
    const store = new InMemorySchedulerRuntimeStore();
    const first = new DefaultSchedulerRuntimeAdapter({
      provider: "enterprise",
      operational: true,
      pollIntervalMs: 10,
      store,
      enterpriseDeps: {
        getQueueRuntimePort: () => queue,
        getWorkerRuntimePort: () => worker,
      },
    });
    const scheduled = await first.schedule({
      scheduleName: "recover-schedule",
      attributes: { delayMs: 60_000, pollIntervalMs: 10, queueName: "oper-inf-s-recover" },
    });
    assert.equal(scheduled.ok, true);
    await first.cancel({ scheduleId: scheduled.schedule!.scheduleId });

    // Reativa manualmente no store (simula estado persistido ativo após restart).
    const existing = store.getSchedule(scheduled.schedule!.scheduleId)!;
    store.setSchedule({ ...existing, status: "scheduled", active: true });

    const recovered = new DefaultSchedulerRuntimeAdapter({
      provider: "enterprise",
      operational: true,
      pollIntervalMs: 10,
      store,
      enterpriseDeps: {
        getQueueRuntimePort: () => queue,
        getWorkerRuntimePort: () => worker,
      },
    });
    assert.equal(recovered.getDispatcher()?.isActive(scheduled.schedule!.scheduleId), true);
    await recovered.cancel({ scheduleId: scheduled.schedule!.scheduleId });
  });
});

describe("INF-07 / OPER-INF-S cadeia Enterprise / Queue / Worker / TISS / Scheduler Runtime", () => {
  it("Enterprise Runtime expõe Scheduler Runtime + health schedulerRuntimeOk", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    assert.equal(runtime.getSchedulerRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getQueueRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getWorkerRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getTISSRuntimePort().providerId, "default");
    assert.equal(runtime.getSchedulerRuntimePort().capabilities().usesQueueRuntimePort, true);
    assert.equal(runtime.getSchedulerRuntimePort().capabilities().usesWorkerRuntimePort, true);
    assert.equal(runtime.getQueueRuntimePort().capabilities().usesSchedulerRuntimePort, true);
    assert.equal(runtime.getWorkerRuntimePort().capabilities().usesSchedulerRuntimePort, true);
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesSchedulerRuntimePort, true);

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.schedulerRuntimeOk, true);
    assert.equal(health.workerRuntimeOk, true);
    assert.equal(health.queueRuntimeOk, true);
    assert.equal(health.tissRuntimeOk, true);
  });

  it("Scheduler Runtime operacional aciona Worker exclusivamente via WorkerRuntimePort", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const scheduler = runtime.getSchedulerRuntimePort() as DefaultSchedulerRuntimeAdapter;
    const worker = runtime.getWorkerRuntimePort();
    const queue = runtime.getQueueRuntimePort();

    const schedulerHealth = await scheduler.health();
    assert.equal(schedulerHealth.ok, true);
    assert.equal(schedulerHealth.workerRuntimeOk, true);
    assert.equal(schedulerHealth.realScheduler, true);
    assert.equal(schedulerHealth.workersOrchestrated, true);

    const beforeWorker = await worker.stats();
    const beforeWorkers = beforeWorker.statistics?.totalWorkers ?? 0;
    const beforeQueue = await queue.stats();
    const beforeQueueCount = beforeQueue.statistics?.totalMessages ?? 0;

    const scheduled = await scheduler.schedule({
      scheduleName: "oper-inf-s-enterprise",
      attributes: {
        delayMs: 0,
        pollIntervalMs: 10,
        queueName: DEFAULT_SCHEDULER_WORKER_QUEUE_NAME,
        workerName: "oper-inf-s-enterprise-worker",
      },
    });
    assert.equal(scheduled.ok, true);
    assert.equal(scheduled.result?.workersOrchestrated, true);
    assert.equal(scheduled.result?.queueConsumed, false);

    await sleep(100);

    const afterWorker = await worker.stats();
    assert.ok((afterWorker.statistics?.totalWorkers ?? 0) > beforeWorkers);

    // Scheduler NÃO consome a fila — Worker pode consumir se houver mensagens; count inalterado aqui.
    const afterQueue = await queue.stats();
    assert.equal(afterQueue.statistics?.totalMessages ?? 0, beforeQueueCount);

    await scheduler.cancel({ scheduleId: scheduled.schedule!.scheduleId });
  });

  it("TISS Runtime prepara dependência Scheduler sem agendar/executar", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const tiss = runtime.getTISSRuntimePort();
    const scheduler = runtime.getSchedulerRuntimePort();

    const tissHealth = await tiss.health();
    assert.equal(tissHealth.ok, true);
    assert.equal(tissHealth.schedulerRuntimeOk, true);
    assert.equal(tissHealth.workerRuntimeOk, true);
    assert.equal(tissHealth.queueRuntimeOk, true);

    const before = await scheduler.stats();
    const beforeSchedules = before.statistics?.totalSchedules ?? 0;

    const processed = await tiss.process({
      kind: "canonical-tiss-request",
      mode: "structural-process",
      metadata: {
        kind: "canonical-tiss-metadata",
        sessionId: "sess-oper-inf-s",
        correlationId: "corr-oper-inf-s",
      },
    });
    assert.equal(processed.ok, true);

    const after = await scheduler.stats();
    assert.equal(after.statistics?.totalSchedules ?? 0, beforeSchedules);
  });
});

describe("INF-07 / OPER-INF-S ausência de Cron / Queue direto / novos Ports / bypass", () => {
  it("módulo scheduler-runtime não referencia backends reais nem cron services", () => {
    const root = join(repoRoot, "src/lib/enterprise/scheduler-runtime");
    const files = collectTsFiles(root);
    assert.ok(files.length > 0);

    const forbidden = [
      /from ["']amqplib["']/,
      /from ["']kafkajs["']/,
      /from ["']bullmq["']/,
      /from ["']ioredis["']/,
      /from ["']@azure\/service-bus["']/,
      /from ["']@azure\/functions["']/,
      /from ["']node-cron["']/,
      /from ["']cron["']/,
      /from ["']node-schedule["']/,
      /from ["']agenda["']/,
      /from ["']celery["']/,
      /from ["']worker_threads["']/,
      /from ["']axios["']/,
      /redis\.createClient\s*\(/,
      /new\s+WebSocket\s*\(/,
      /setInterval\s*\(/,
      /new\s+Worker\s*\(/,
      /ThreadPoolExecutor/,
      /extends\s+BackgroundService/,
      /implements\s+IHostedService/,
      /from ["']hangfire/i,
      /from ["']quartz/i,
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

  it("Enterprise Runtime wiring inclui getSchedulerRuntimePort e createSchedulerRuntimePort", () => {
    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.match(enterpriseRuntime, /createSchedulerRuntimePort/);
    assert.match(enterpriseRuntime, /getSchedulerRuntimePort/);
    assert.match(enterpriseRuntime, /schedulerRuntimeOk/);
  });

  it("Queue Runtime wiring inclui getSchedulerRuntimePort sem schedule/cancel", () => {
    const queueAdapter = readFileSync(
      join(repoRoot, "src/lib/enterprise/queue-runtime/adapters/default-queue-runtime-adapter.ts"),
      "utf8",
    );
    assert.match(queueAdapter, /getSchedulerRuntimePort/);
    assert.match(queueAdapter, /usesSchedulerRuntimePort/);
    assert.match(queueAdapter, /schedulerRuntimeOk/);
    assert.equal(
      /schedulerRuntimePort\.(register|unregister|schedule|cancel|list)\s*\(/.test(queueAdapter),
      false,
    );
  });

  it("Worker Runtime wiring inclui getSchedulerRuntimePort sem schedule/cancel", () => {
    const workerAdapter = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/worker-runtime/adapters/default-worker-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(workerAdapter, /getSchedulerRuntimePort/);
    assert.match(workerAdapter, /usesSchedulerRuntimePort/);
    assert.match(workerAdapter, /schedulerRuntimeOk/);
    assert.equal(
      /getSchedulerRuntimePort\(\)\.(register|unregister|schedule|cancel|list)\s*\(/.test(
        workerAdapter,
      ),
      false,
    );
  });

  it("TISS Runtime wiring inclui getSchedulerRuntimePort sem schedule no process", () => {
    const tissAdapter = readFileSync(
      join(repoRoot, "src/lib/enterprise/tiss-runtime/adapters/default-tiss-runtime-adapter.ts"),
      "utf8",
    );
    assert.match(tissAdapter, /getSchedulerRuntimePort/);
    assert.match(tissAdapter, /usesSchedulerRuntimePort/);
    assert.match(tissAdapter, /schedulerRuntimeOk/);

    const processStart = tissAdapter.indexOf("async process(");
    assert.ok(processStart > 0);
    const processBody = tissAdapter.slice(processStart);
    assert.equal(
      /schedulerRuntimePort\.(register|unregister|schedule|cancel|list)\s*\(/.test(processBody),
      false,
    );
  });

  it("OPER-INF-S — Scheduler aciona WorkerRuntimePort sem Queue direto", () => {
    const schedulerAdapter = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/scheduler-runtime/adapters/default-scheduler-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(schedulerAdapter, /getWorkerRuntimePort/);
    assert.match(schedulerAdapter, /usesWorkerRuntimePort/);
    assert.match(schedulerAdapter, /OPER-INF-S/);
    assert.equal(
      /getQueueRuntimePort\(\)\.(enqueue|dequeue|peek|ack|nack|purge)\s*\(/.test(schedulerAdapter),
      false,
    );
    assert.equal(
      /getWorkerRuntimePort\(\)\.(register|unregister|allocate|release|heartbeat)\s*\(/.test(
        schedulerAdapter,
      ),
      false,
    );

    const dispatcher = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/scheduler-runtime/operational/scheduler-worker-dispatcher.ts",
      ),
      "utf8",
    );
    assert.match(dispatcher, /worker\.allocate/);
    assert.match(dispatcher, /\.heartbeat\(\{\s*workerId/);
    assert.match(dispatcher, /\.release\(\{\s*workerId/);
    assert.equal(/from ["'].*queue-runtime/.test(dispatcher), false);
    assert.equal(/import\s+type\s+\{\s*QueueRuntimePort/.test(dispatcher), false);
    assert.equal(/\.enqueue\(|\.dequeue\(|\.ack\(|\.nack\(/.test(dispatcher), false);
    assert.equal(/from ["']@supabase/.test(dispatcher), false);
  });

  it("sem Provider/Adapter/Factory/Registry/Port/Gateway paralelo", () => {
    const root = join(repoRoot, "src/lib/enterprise/scheduler-runtime");
    const files = collectTsFiles(root).map((f) => f.replace(/\\/g, "/"));
    assert.ok(files.some((f) => f.endsWith("/providers/create-scheduler-runtime-port.ts")));
    assert.ok(files.some((f) => f.endsWith("/factory/scheduler-runtime-factory.ts")));
    assert.ok(files.some((f) => f.endsWith("/registry/scheduler-runtime-registry.ts")));
    assert.ok(files.some((f) => f.endsWith("/operational/scheduler-worker-dispatcher.ts")));
    assert.equal(files.filter((f) => f.includes("/factory/")).length, 2);
    assert.equal(files.filter((f) => f.includes("/registry/")).length, 2);
    assert.equal(
      files.filter((f) => /adapters\/.*scheduler-runtime-adapter\.ts$/.test(f)).length,
      2,
    );
    assert.equal(files.filter((f) => /\/ports\/.*-port\.ts$/.test(f)).length, 1);
    assert.equal(files.filter((f) => /gateway/i.test(f)).length, 0);
  });

  it("OPER-INF-S — Runtime permanece com createSchedulerRuntimePort (sem novo Runtime)", () => {
    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.match(enterpriseRuntime, /createSchedulerRuntimePort/);
    assert.equal(/createSchedulerWorkerDispatcher/.test(enterpriseRuntime), false);
    assert.equal(/SchedulerWorkerDispatcher/.test(enterpriseRuntime), false);
    assert.ok(DefaultQueueRuntimeAdapter);
    assert.ok(createWorkerRuntimePort);
  });
});

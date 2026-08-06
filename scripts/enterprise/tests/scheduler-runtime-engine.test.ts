#!/usr/bin/env node
/**
 * INF-07 — Enterprise Scheduler Runtime
 * Prova: Application → SchedulerRuntimePort → Adapter → Factory → Registry → Store
 *         + Enterprise Runtime + Queue / Worker / TISS Runtime (deps preparadas sem consumo)
 *         + register / unregister / schedule / cancel / list / stats / health
 *         + ausência de Scheduler real / Cron / Timer / Workers / backends
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_SCHEDULER_RUNTIME_PROVIDER_COUNT,
  DEFAULT_SCHEDULER_RUNTIME_ADAPTER_ID,
  DEFAULT_SCHEDULER_RUNTIME_CAPABILITIES,
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

describe("INF-07 SchedulerRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
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
  });

  it("DefaultSchedulerRuntimeAdapter é o adapter enterprise oficial", () => {
    assert.equal(EnterpriseSchedulerRuntimeAdapter, DefaultSchedulerRuntimeAdapter);
    const port = new DefaultSchedulerRuntimeAdapter({
      provider: "enterprise",
    });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_SCHEDULER_RUNTIME_ADAPTER_ID);
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

  it("register → schedule → list → cancel → unregister → stats com flags estruturais", async () => {
    resetSchedulerRuntimeIdSequences();
    const port = createSchedulerRuntimePort({ provider: "enterprise" });

    const registered = await port.register({
      scheduleName: "foundation-schedule",
      correlationId: "corr-inf-07",
    });
    assert.equal(registered.ok, true);
    assert.ok(registered.result?.resultId);
    assert.equal(registered.result?.realScheduler, false);
    assert.equal(registered.result?.cronImplemented, false);
    assert.equal(registered.result?.timerImplemented, false);
    assert.equal(registered.result?.runtimeReady, true);
    assert.equal(registered.schedule?.status, "registered");
    assert.equal(registered.schedule?.scheduleName, "foundation-schedule");

    const scheduled = await port.schedule({
      scheduleId: registered.schedule!.scheduleId,
    });
    assert.equal(scheduled.ok, true);
    assert.equal(scheduled.schedule?.status, "scheduled");
    assert.equal(scheduled.schedule?.active, true);
    assert.equal(scheduled.result?.cronImplemented, false);
    assert.equal(scheduled.result?.workersOrchestrated, false);
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
    assert.equal(stats.statistics?.realSchedulerCount, 0);
    assert.equal(stats.statistics?.cronImplementedCount, 0);
    assert.equal(stats.statistics?.timerImplementedCount, 0);
    assert.equal(stats.statistics?.workersOrchestratedCount, 0);
    assert.equal(stats.statistics?.parallelProcessingCount, 0);
    assert.equal(stats.statistics?.queueConsumedCount, 0);
  });

  it("InMemory store oficial e estatísticas zeradas para Scheduler real", () => {
    const store = new InMemorySchedulerRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_SCHEDULER_RUNTIME_STORE_ID);
    const stats = store.statistics();
    assert.equal(stats.kind, "canonical-scheduler-statistics");
    assert.equal(stats.realSchedulerCount, 0);
    assert.equal(stats.cronImplementedCount, 0);
    assert.equal(stats.timerImplementedCount, 0);
    assert.equal(DEFAULT_SCHEDULER_RUNTIME_CAPABILITIES.runtimeReady, true);
    assert.equal(DEFAULT_SCHEDULER_RUNTIME_CAPABILITIES.realScheduler, false);
  });

  it("retry estrutural recupera falha transitória", async () => {
    const port = new DefaultSchedulerRuntimeAdapter({
      provider: "enterprise",
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
    assert.equal(summary.capabilities.realScheduler, false);
    assert.equal(summary.capabilities.implementsCron, false);
  });
});

describe("INF-07 cadeia Enterprise / Queue / Worker / TISS / Scheduler Runtime", () => {
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

  it("Scheduler Runtime prepara deps Queue/Worker sem consumir/orquestrar", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const scheduler = runtime.getSchedulerRuntimePort();
    const queue = runtime.getQueueRuntimePort();
    const worker = runtime.getWorkerRuntimePort();

    const schedulerHealth = await scheduler.health();
    assert.equal(schedulerHealth.ok, true);
    assert.equal(schedulerHealth.queueRuntimeOk, true);
    assert.equal(schedulerHealth.workerRuntimeOk, true);

    const beforeQueue = await queue.stats();
    const beforeQueueCount = beforeQueue.statistics?.totalMessages ?? 0;
    const beforeWorker = await worker.stats();
    const beforeWorkers = beforeWorker.statistics?.totalWorkers ?? 0;

    const scheduled = await scheduler.schedule({ scheduleName: "inf-07-no-consume" });
    assert.equal(scheduled.ok, true);
    assert.equal(scheduled.result?.queueConsumed, false);
    assert.equal(scheduled.result?.workersOrchestrated, false);
    assert.equal(scheduled.result?.cronImplemented, false);

    const afterQueue = await queue.stats();
    assert.equal(afterQueue.statistics?.totalMessages ?? 0, beforeQueueCount);
    const afterWorker = await worker.stats();
    assert.equal(afterWorker.statistics?.totalWorkers ?? 0, beforeWorkers);
    assert.equal(afterWorker.statistics?.realWorkersCount, 0);
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
        sessionId: "sess-inf-07",
        correlationId: "corr-inf-07",
      },
    });
    assert.equal(processed.ok, true);

    const after = await scheduler.stats();
    assert.equal(after.statistics?.totalSchedules ?? 0, beforeSchedules);
    assert.equal(after.statistics?.realSchedulerCount, 0);
    assert.equal(after.statistics?.cronImplementedCount, 0);
  });
});

describe("INF-07 ausência de Scheduler real / Cron / bypass", () => {
  it("módulo scheduler-runtime não referencia backends reais nem cron/timer services", () => {
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

  it("Scheduler Runtime não consome Queue nem orquestra Workers nas operações", () => {
    const schedulerAdapter = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/scheduler-runtime/adapters/default-scheduler-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(schedulerAdapter, /getQueueRuntimePort/);
    assert.match(schedulerAdapter, /getWorkerRuntimePort/);
    assert.match(schedulerAdapter, /usesQueueRuntimePort/);
    assert.match(schedulerAdapter, /usesWorkerRuntimePort/);
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
  });

  it("sem Provider/Adapter/Factory/Registry paralelo", () => {
    const root = join(repoRoot, "src/lib/enterprise/scheduler-runtime");
    const files = collectTsFiles(root).map((f) => f.replace(/\\/g, "/"));
    assert.ok(files.some((f) => f.endsWith("/providers/create-scheduler-runtime-port.ts")));
    assert.ok(files.some((f) => f.endsWith("/factory/scheduler-runtime-factory.ts")));
    assert.ok(files.some((f) => f.endsWith("/registry/scheduler-runtime-registry.ts")));
    assert.equal(files.filter((f) => f.includes("/factory/")).length, 2);
    assert.equal(files.filter((f) => f.includes("/registry/")).length, 2);
    assert.equal(
      files.filter((f) => /adapters\/.*scheduler-runtime-adapter\.ts$/.test(f)).length,
      2,
    );
  });
});

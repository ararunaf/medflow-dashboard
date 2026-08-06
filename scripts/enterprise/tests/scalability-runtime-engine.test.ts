#!/usr/bin/env node
/**
 * INF-10 — Enterprise Scalability Runtime
 * Prova: Application → ScalabilityRuntimePort → Adapter → Factory → Registry → Store
 *         + Enterprise Runtime + Queue / Worker / Scheduler / Persistent Queue / Observability / TISS Runtime (deps preparadas sem consumo)
 *         + register / unregister / observe / release / list / stats / health
 *         + ausência de Kubernetes / Auto Scaling / Cluster / Load Balancer / Failover / Sharding reais
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUILTIN_SCALABILITY_RUNTIME_PROVIDER_COUNT,
  DEFAULT_SCALABILITY_RUNTIME_ADAPTER_ID,
  DEFAULT_SCALABILITY_RUNTIME_CAPABILITIES,
  DefaultScalabilityRuntimeAdapter,
  EnterpriseScalabilityRuntimeAdapter,
  IN_MEMORY_SCALABILITY_RUNTIME_STORE_ID,
  InMemoryScalabilityRuntimeStore,
  MOCK_SCALABILITY_RUNTIME_ADAPTER_ID,
  MockScalabilityRuntimeAdapter,
  ScalabilityRuntimeFactory,
  ScalabilityRuntimeProvider,
  ScalabilityRuntimeRegistry,
  createDefaultScalabilityRuntimeRegistry,
  createScalabilityRuntimeFactory,
  createScalabilityRuntimePort,
  getScalabilityRuntimeFactory,
  getScalabilityRuntimeHealthSummary,
  resetScalabilityRuntimeIdSequences,
  type ScalabilityRuntimePort,
} from "../../../src/lib/enterprise/scalability-runtime/index.ts";
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

describe("INF-10 ScalabilityRuntimePort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: ScalabilityRuntimePort = new MockScalabilityRuntimeAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.status, "ready");
    assert.equal(health.kind, "canonical-scalability-health");
    assert.equal(health.runtimeReady, true);
    assert.equal(health.realScalabilityBackend, false);
    assert.equal(health.kubernetesImplemented, false);
    assert.equal(health.dockerSwarmImplemented, false);
    assert.equal(health.horizontalPodAutoscalerImplemented, false);
    assert.equal(health.autoScalingImplemented, false);
    assert.equal(health.horizontalScalingImplemented, false);
    assert.equal(health.verticalScalingImplemented, false);
    assert.equal(health.nodeManagementImplemented, false);
    assert.equal(health.highAvailabilityImplemented, false);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, MOCK_SCALABILITY_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsCanonicalScalability, true);
    assert.equal(caps.usesQueueRuntimePort, true);
    assert.equal(caps.usesWorkerRuntimePort, true);
    assert.equal(caps.usesSchedulerRuntimePort, true);
    assert.equal(caps.usesPersistentQueueRuntimePort, true);
    assert.equal(caps.usesObservabilityRuntimePort, true);
    assert.equal(caps.usesTISSRuntimePort, true);
    assert.equal(caps.runtimeReady, true);
    assert.equal(caps.realScalabilityBackend, false);
    assert.equal(caps.implementsRealScalabilityBackend, false);
    assert.equal(caps.implementsKubernetes, false);
    assert.equal(caps.implementsDockerSwarm, false);
    assert.equal(caps.implementsHorizontalPodAutoscaler, false);
    assert.equal(caps.implementsAutoScaling, false);
    assert.equal(caps.implementsCluster, false);
    assert.equal(caps.implementsLoadBalancer, false);
    assert.equal(caps.implementsFailover, false);
    assert.equal(caps.implementsSharding, false);
    assert.equal(caps.implementsPartitioning, false);
    assert.equal(caps.canonical.kind, "canonical-scalability-capabilities");
    assert.equal(caps.canonical.runtimeReady, true);
    assert.equal(caps.canonical.realScalabilityBackend, false);
  });

  it("DefaultScalabilityRuntimeAdapter é o adapter enterprise oficial", () => {
    assert.equal(EnterpriseScalabilityRuntimeAdapter, DefaultScalabilityRuntimeAdapter);
    const port = new DefaultScalabilityRuntimeAdapter({
      provider: "enterprise",
    });
    assert.equal(port.providerId, "enterprise");
    assert.equal(port.capabilities().adapterId, DEFAULT_SCALABILITY_RUNTIME_ADAPTER_ID);
  });

  it("provider default resolve enterprise", () => {
    const port = createScalabilityRuntimePort();
    assert.equal(port.providerId, "enterprise");
    assert.equal(ScalabilityRuntimeProvider.create().providerId, "enterprise");
  });

  it("factory resolve mock / test / default / enterprise", () => {
    const factory = createScalabilityRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(
      getScalabilityRuntimeFactory().getRegistry().list().length,
      BUILTIN_SCALABILITY_RUNTIME_PROVIDER_COUNT,
    );
  });

  it("register → observe → list → release → unregister → stats com flags estruturais", async () => {
    resetScalabilityRuntimeIdSequences();
    const port = createScalabilityRuntimePort({ provider: "enterprise" });

    const registered = await port.register({
      scopeName: "foundation-scalability-scope",
      correlationId: "corr-inf-10",
    });
    assert.equal(registered.ok, true);
    assert.ok(registered.result?.resultId);
    assert.equal(registered.result?.realScalabilityBackend, false);
    assert.equal(registered.result?.kubernetesImplemented, false);
    assert.equal(registered.result?.dockerSwarmImplemented, false);
    assert.equal(registered.result?.runtimeReady, true);
    assert.equal(registered.scope?.status, "registered");
    assert.equal(registered.scope?.scopeName, "foundation-scalability-scope");

    const observed = await port.observe({
      scopeId: registered.scope!.scopeId,
    });
    assert.equal(observed.ok, true);
    assert.equal(observed.scope?.status, "observed");
    assert.equal(observed.scope?.active, true);
    assert.equal(observed.result?.kubernetesImplemented, false);
    assert.equal(observed.result?.horizontalPodAutoscalerImplemented, false);
    assert.equal(observed.result?.horizontalScalingImplemented, false);
    assert.equal(observed.result?.verticalScalingImplemented, false);
    assert.equal(observed.result?.nodeManagementImplemented, false);
    assert.ok(observed.scalabilitySignal?.signalId);
    assert.ok(observed.envelope?.envelopeId);

    const listed = await port.list({ scopeId: registered.scope!.scopeId });
    assert.equal(listed.ok, true);
    assert.equal(listed.scopes?.length, 1);
    assert.ok((listed.signals?.length ?? 0) >= 1);

    const released = await port.release({
      scopeId: registered.scope!.scopeId,
      signalId: observed.scalabilitySignal!.signalId,
    });
    assert.equal(released.ok, true);
    assert.equal(released.scope?.status, "released");
    assert.equal(released.scope?.active, false);

    const unregistered = await port.unregister({ scopeId: registered.scope!.scopeId });
    assert.equal(unregistered.ok, true);
    assert.equal(unregistered.scope?.status, "unregistered");

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "canonical-scalability-statistics");
    assert.equal(stats.statistics?.realScalabilityBackendCount, 0);
    assert.equal(stats.statistics?.kubernetesImplementedCount, 0);
    assert.equal(stats.statistics?.dockerSwarmImplementedCount, 0);
    assert.equal(stats.statistics?.horizontalPodAutoscalerImplementedCount, 0);
    assert.equal(stats.statistics?.autoScalingImplementedCount, 0);
    assert.equal(stats.statistics?.horizontalScalingImplementedCount, 0);
    assert.equal(stats.statistics?.verticalScalingImplementedCount, 0);
    assert.equal(stats.statistics?.nodeManagementImplementedCount, 0);
    assert.equal(stats.statistics?.highAvailabilityImplementedCount, 0);
  });

  it("InMemory store oficial e estatísticas zeradas para backend de observabilidade real", () => {
    const store = new InMemoryScalabilityRuntimeStore();
    assert.equal(store.storeId, IN_MEMORY_SCALABILITY_RUNTIME_STORE_ID);
    const stats = store.statistics();
    assert.equal(stats.kind, "canonical-scalability-statistics");
    assert.equal(stats.realScalabilityBackendCount, 0);
    assert.equal(stats.kubernetesImplementedCount, 0);
    assert.equal(stats.dockerSwarmImplementedCount, 0);
    assert.equal(DEFAULT_SCALABILITY_RUNTIME_CAPABILITIES.runtimeReady, true);
    assert.equal(DEFAULT_SCALABILITY_RUNTIME_CAPABILITIES.realScalabilityBackend, false);
  });

  it("retry estrutural recupera falha transitória", async () => {
    const port = new DefaultScalabilityRuntimeAdapter({
      provider: "enterprise",
      failAttempts: 1,
      defaultRetryCount: 1,
      defaultRetryBackoffMs: 1,
    });
    const result = await port.register({ scopeName: "retry-scalability-scope" });
    assert.equal(result.ok, true);
    assert.ok((result.telemetry?.attempts ?? 0) >= 2);
  });

  it("AbortSignal cancela operação", async () => {
    const port = createScalabilityRuntimePort({ provider: "enterprise" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.register({
      scopeName: "abort-scalability-scope",
      signal: controller.signal,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "SCALABILITY_RUNTIME_CANCELLED");
  });

  it("registry/factory sem fallback silencioso", () => {
    const registry = createDefaultScalabilityRuntimeRegistry();
    assert.equal(registry.has("enterprise"), true);
    assert.equal(registry.snapshot().count, BUILTIN_SCALABILITY_RUNTIME_PROVIDER_COUNT);
    assert.ok(registry instanceof ScalabilityRuntimeRegistry);

    const factory = new ScalabilityRuntimeFactory({ registry });
    assert.throws(() => factory.create({ provider: "unknown" as never }), /não está registrado/);
  });

  it("demo health summary depende apenas do Port", async () => {
    const port = createScalabilityRuntimePort({ provider: "enterprise" });
    const summary = await getScalabilityRuntimeHealthSummary(port);
    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.ok, true);
    assert.equal(summary.info.providerType, "SCALABILITY_RUNTIME");
    assert.equal(summary.capabilities.runtimeReady, true);
    assert.equal(summary.capabilities.realScalabilityBackend, false);
    assert.equal(summary.capabilities.implementsKubernetes, false);
  });
});

describe("INF-10 cadeia Enterprise / Queue / Worker / Scheduler / Persistent Queue / TISS / Scalability Runtime", () => {
  it("Enterprise Runtime expõe Scalability Runtime + health scalabilityRuntimeOk", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    assert.equal(runtime.getScalabilityRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getQueueRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getWorkerRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getSchedulerRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getPersistentQueueRuntimePort().providerId, "enterprise");
    assert.equal(runtime.getTISSRuntimePort().providerId, "default");
    assert.equal(runtime.getScalabilityRuntimePort().capabilities().usesQueueRuntimePort, true);
    assert.equal(runtime.getScalabilityRuntimePort().capabilities().usesWorkerRuntimePort, true);
    assert.equal(runtime.getScalabilityRuntimePort().capabilities().usesSchedulerRuntimePort, true);
    assert.equal(
      runtime.getScalabilityRuntimePort().capabilities().usesPersistentQueueRuntimePort,
      true,
    );
    assert.equal(runtime.getScalabilityRuntimePort().capabilities().usesTISSRuntimePort, true);
    assert.equal(
      runtime.getScalabilityRuntimePort().capabilities().usesObservabilityRuntimePort,
      true,
    );
    assert.equal(runtime.getQueueRuntimePort().capabilities().usesScalabilityRuntimePort, true);
    assert.equal(runtime.getWorkerRuntimePort().capabilities().usesScalabilityRuntimePort, true);
    assert.equal(runtime.getSchedulerRuntimePort().capabilities().usesScalabilityRuntimePort, true);
    assert.equal(
      runtime.getPersistentQueueRuntimePort().capabilities().usesScalabilityRuntimePort,
      true,
    );
    assert.equal(runtime.getTISSRuntimePort().capabilities().usesScalabilityRuntimePort, true);

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.scalabilityRuntimeOk, true);
    assert.equal(health.observabilityRuntimeOk, true);
    assert.equal(health.persistentQueueRuntimeOk, true);
    assert.equal(health.schedulerRuntimeOk, true);
    assert.equal(health.workerRuntimeOk, true);
    assert.equal(health.queueRuntimeOk, true);
    assert.equal(health.tissRuntimeOk, true);
  });

  it("Scalability Runtime prepara deps Queue/Worker/Scheduler/PQR sem consumir", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const obs = runtime.getScalabilityRuntimePort();
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
    assert.equal(obsHealth.observabilityRuntimeOk, true);
    assert.equal(obsHealth.tissRuntimeOk, true);

    const beforeQueue = await queue.stats();
    const beforeQueueCount = beforeQueue.statistics?.totalMessages ?? 0;
    const beforeWorker = await worker.stats();
    const beforeWorkers = beforeWorker.statistics?.totalWorkers ?? 0;
    const beforeScheduler = await scheduler.stats();
    const beforeSchedules = beforeScheduler.statistics?.totalSchedules ?? 0;
    const beforePqr = await pqr.stats();
    const beforeQueues = beforePqr.statistics?.totalQueues ?? 0;

    const observed = await obs.observe({ scopeName: "inf-10-no-consume" });
    assert.equal(observed.ok, true);
    assert.equal(observed.result?.kubernetesImplemented, false);
    assert.equal(observed.result?.dockerSwarmImplemented, false);
    assert.equal(observed.result?.horizontalPodAutoscalerImplemented, false);
    assert.equal(observed.result?.autoScalingImplemented, false);
    assert.equal(observed.result?.clusterImplemented, false);
    assert.equal(observed.result?.loadBalancerImplemented, false);

    const afterQueue = await queue.stats();
    assert.equal(afterQueue.statistics?.totalMessages ?? 0, beforeQueueCount);
    const afterWorker = await worker.stats();
    assert.equal(afterWorker.statistics?.totalWorkers ?? 0, beforeWorkers);
    assert.equal(afterWorker.statistics?.realWorkersCount, 0);
    const afterScheduler = await scheduler.stats();
    assert.equal(afterScheduler.statistics?.totalSchedules ?? 0, beforeSchedules);
    assert.equal(afterScheduler.statistics?.realSchedulerCount, 0);
    const afterPqr = await pqr.stats();
    assert.equal(afterPqr.statistics?.totalQueues ?? 0, beforeQueues);
    assert.equal(afterPqr.statistics?.realPersistentBackendCount, 0);
  });

  it("TISS Runtime prepara dependência Scalability sem observar/consumir", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const tiss = runtime.getTISSRuntimePort();
    const obs = runtime.getScalabilityRuntimePort();

    const tissHealth = await tiss.health();
    assert.equal(tissHealth.ok, true);
    assert.equal(tissHealth.scalabilityRuntimeOk, true);
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
        sessionId: "sess-inf-10",
        correlationId: "corr-inf-10",
      },
    });
    assert.equal(processed.ok, true);

    const after = await obs.stats();
    assert.equal(after.statistics?.totalScopes ?? 0, beforeScopes);
    assert.equal(after.statistics?.realScalabilityBackendCount, 0);
    assert.equal(after.statistics?.kubernetesImplementedCount, 0);
  });
});

describe("INF-10 ausência de backends de escalabilidade / bypass", () => {
  it("módulo scalability-runtime não referencia backends reais", () => {
    const root = join(repoRoot, "src/lib/enterprise/scalability-runtime");
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

  it("Enterprise Runtime wiring inclui getScalabilityRuntimePort e createScalabilityRuntimePort", () => {
    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.match(enterpriseRuntime, /createScalabilityRuntimePort/);
    assert.match(enterpriseRuntime, /getScalabilityRuntimePort/);
    assert.match(enterpriseRuntime, /scalabilityRuntimeOk/);
  });

  it("Queue Runtime wiring inclui getScalabilityRuntimePort sem observe/release", () => {
    const queueAdapter = readFileSync(
      join(repoRoot, "src/lib/enterprise/queue-runtime/adapters/default-queue-runtime-adapter.ts"),
      "utf8",
    );
    assert.match(queueAdapter, /getScalabilityRuntimePort/);
    assert.match(queueAdapter, /usesScalabilityRuntimePort/);
    assert.match(queueAdapter, /scalabilityRuntimeOk/);
    assert.equal(
      /scalabilityRuntimePort\.(register|unregister|observe|release|list)\s*\(/.test(queueAdapter),
      false,
    );
  });

  it("Worker Runtime wiring inclui getScalabilityRuntimePort sem observe/release", () => {
    const workerAdapter = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/worker-runtime/adapters/default-worker-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(workerAdapter, /getScalabilityRuntimePort/);
    assert.match(workerAdapter, /usesScalabilityRuntimePort/);
    assert.match(workerAdapter, /scalabilityRuntimeOk/);
    assert.equal(
      /getScalabilityRuntimePort\(\)\.(register|unregister|observe|release|list)\s*\(/.test(
        workerAdapter,
      ),
      false,
    );
  });

  it("Scheduler Runtime wiring inclui getScalabilityRuntimePort sem observe/release", () => {
    const schedulerAdapter = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/scheduler-runtime/adapters/default-scheduler-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(schedulerAdapter, /getScalabilityRuntimePort/);
    assert.match(schedulerAdapter, /usesScalabilityRuntimePort/);
    assert.match(schedulerAdapter, /scalabilityRuntimeOk/);
    assert.equal(
      /getScalabilityRuntimePort\(\)\.(register|unregister|observe|release|list)\s*\(/.test(
        schedulerAdapter,
      ),
      false,
    );
  });

  it("Persistent Queue Runtime wiring inclui getScalabilityRuntimePort sem observe/release", () => {
    const pqrAdapter = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/persistent-queue-runtime/adapters/default-persistent-queue-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(pqrAdapter, /getScalabilityRuntimePort/);
    assert.match(pqrAdapter, /usesScalabilityRuntimePort/);
    assert.match(pqrAdapter, /scalabilityRuntimeOk/);
    assert.equal(
      /getScalabilityRuntimePort\(\)\.(register|unregister|observe|release|list)\s*\(/.test(
        pqrAdapter,
      ),
      false,
    );
  });

  it("TISS Runtime wiring inclui getScalabilityRuntimePort sem observe no process", () => {
    const tissAdapter = readFileSync(
      join(repoRoot, "src/lib/enterprise/tiss-runtime/adapters/default-tiss-runtime-adapter.ts"),
      "utf8",
    );
    assert.match(tissAdapter, /getScalabilityRuntimePort/);
    assert.match(tissAdapter, /usesScalabilityRuntimePort/);
    assert.match(tissAdapter, /scalabilityRuntimeOk/);

    const processStart = tissAdapter.indexOf("async process(");
    assert.ok(processStart > 0);
    const processBody = tissAdapter.slice(processStart);
    assert.equal(
      /scalabilityRuntimePort\.(register|unregister|observe|release|list)\s*\(/.test(processBody),
      false,
    );
  });

  it("Scalability Runtime não consome Queue/Worker/Scheduler/PQR/TISS nas operações", () => {
    const obsAdapter = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/scalability-runtime/adapters/default-scalability-runtime-adapter.ts",
      ),
      "utf8",
    );
    assert.match(obsAdapter, /getQueueRuntimePort/);
    assert.match(obsAdapter, /getWorkerRuntimePort/);
    assert.match(obsAdapter, /getSchedulerRuntimePort/);
    assert.match(obsAdapter, /getPersistentQueueRuntimePort/);
    assert.match(obsAdapter, /getObservabilityRuntimePort/);
    assert.match(obsAdapter, /getTISSRuntimePort/);
    assert.match(obsAdapter, /usesQueueRuntimePort/);
    assert.match(obsAdapter, /usesWorkerRuntimePort/);
    assert.match(obsAdapter, /usesSchedulerRuntimePort/);
    assert.match(obsAdapter, /usesPersistentQueueRuntimePort/);
    assert.match(obsAdapter, /usesObservabilityRuntimePort/);
    assert.match(obsAdapter, /usesTISSRuntimePort/);
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
      /getObservabilityRuntimePort\(\)\.(register|unregister|observe|release|list)\s*\(/.test(
        obsAdapter,
      ),
      false,
    );
    assert.equal(
      /getTISSRuntimePort\(\)\.(process|getSession|listSessions)\s*\(/.test(obsAdapter),
      false,
    );
  });

  it("sem Provider/Adapter/Factory/Registry paralelo", () => {
    const root = join(repoRoot, "src/lib/enterprise/scalability-runtime");
    const files = collectTsFiles(root).map((f) => f.replace(/\\/g, "/"));
    assert.ok(files.some((f) => f.endsWith("/providers/create-scalability-runtime-port.ts")));
    assert.ok(files.some((f) => f.endsWith("/factory/scalability-runtime-factory.ts")));
    assert.ok(files.some((f) => f.endsWith("/registry/scalability-runtime-registry.ts")));
    assert.equal(files.filter((f) => f.includes("/factory/")).length, 2);
    assert.equal(files.filter((f) => f.includes("/registry/")).length, 2);
    assert.equal(
      files.filter((f) => /adapters\/.*scalability-runtime-adapter\.ts$/.test(f)).length,
      2,
    );
  });
});

#!/usr/bin/env node
/**
 * INF-02 — Worker Foundation
 * Prova Application → ExecutionWorkerPort → Adapter → Store
 * sem tocar produto e sem invocar OCR / IA / Mapping / regras / banco / threads / execução.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  AI_WORKER_FOUNDATION_CONSUMER_REFERENCE,
  DEFAULT_EXECUTION_WORKER_ADAPTER_ID,
  DefaultExecutionWorkerAdapter,
  ExecutionWorkerProvider,
  IN_MEMORY_EXECUTION_WORKER_STORE_ID,
  InMemoryExecutionWorkerStore,
  MOCK_EXECUTION_WORKER_ADAPTER_ID,
  MockExecutionWorkerAdapter,
  OCR_PIPELINE_WORKER_FOUNDATION_CONSUMER_REFERENCE,
  STRUCTURAL_WORKER_FOUNDATION_CAPABILITY,
  createExecutionWorkerFactory,
  createExecutionWorkerPort,
  getWorkerFoundationHealthSummary,
  resetAllWorkerFoundationIdSequences,
  type ExecutionWorkerPort,
} from "../../../src/lib/enterprise/worker-foundation/index.ts";
import {
  createExecutionQueuePort,
  resetAllMessageQueueIdSequences,
} from "../../../src/lib/enterprise/message-queue/index.ts";
import {
  DefaultCanonicalExecutionOrchestratorAdapter,
  MockCanonicalExecutionOrchestratorAdapter,
  createCanonicalExecutionOrchestratorFactory,
  resetAllCanonicalExecutionIdSequences,
} from "../../../src/lib/enterprise/canonical-execution-orchestrator/index.ts";
import {
  createExecutionContextPort,
  type ExecutionContextPort,
} from "../../../src/lib/enterprise/execution-context/index.ts";
import { createExecutionCapabilityRegistryPort } from "../../../src/lib/enterprise/execution-capability-registry/index.ts";
import { createExecutionConstraintRegistryPort } from "../../../src/lib/enterprise/execution-constraint-registry/index.ts";
import { createExecutionDependencyRegistryPort } from "../../../src/lib/enterprise/execution-dependency-registry/index.ts";
import { createExecutionEnvironmentRegistryPort } from "../../../src/lib/enterprise/execution-environment-registry/index.ts";
import { createExecutionEventBusPort } from "../../../src/lib/enterprise/execution-event-bus/index.ts";
import { createExecutionPolicyRegistryPort } from "../../../src/lib/enterprise/execution-policy-registry/index.ts";
import { createExecutionRegistryPort } from "../../../src/lib/enterprise/execution-registry/index.ts";
import { createExecutionRequirementRegistryPort } from "../../../src/lib/enterprise/execution-requirement-registry/index.ts";
import { createExecutionResourceRegistryPort } from "../../../src/lib/enterprise/execution-resource-registry/index.ts";
import { createExecutionStateMachinePort } from "../../../src/lib/enterprise/execution-state-machine/index.ts";
import { createExecutionTracePort } from "../../../src/lib/enterprise/execution-trace/index.ts";
import {
  createPipelineResolverPort,
  type PipelineResolverPort,
} from "../../../src/lib/enterprise/pipeline-resolver/index.ts";

describe("INF-02 ExecutionWorkerPort contract", () => {
  it("mock adapter satisfaz o Port e responde healthy", async () => {
    const port: ExecutionWorkerPort = new MockExecutionWorkerAdapter({
      provider: "mock",
    });
    assert.equal(port.providerId, "mock");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "mock");
    assert.equal(health.storedWorkerCount, 0);
    assert.equal(health.structuralHealth?.kind, "canonical-worker-health");
    assert.equal(health.structuralHealth?.persistenceImplemented, false);
    assert.equal(health.structuralHealth?.executionPerformed, false);
    assert.equal(health.structuralHealth?.threadsSpawned, false);
    assert.equal(health.structuralHealth?.backgroundJobsStarted, false);
    assert.equal(health.structuralHealth?.realWorkerBackend, false);

    const caps = port.capabilities();
    assert.equal(caps.adapterId, "mock-in-memory");
    assert.equal(caps.supportsRegisterWorker, true);
    assert.equal(caps.supportsUnregisterWorker, true);
    assert.equal(caps.supportsStartWorker, true);
    assert.equal(caps.supportsStopWorker, true);
    assert.equal(caps.supportsPauseWorker, true);
    assert.equal(caps.supportsResumeWorker, true);
    assert.equal(caps.supportsGetWorker, true);
    assert.equal(caps.supportsStatistics, true);
    assert.equal(caps.supportsHealth, true);
    assert.equal(caps.supportsCapabilities, true);
    assert.equal(caps.structuralWorkerOnly, true);
    assert.equal(caps.persistenceImplemented, false);
    assert.equal(caps.databaseUsed, false);
    assert.equal(caps.enginesInvoked, false);
    assert.equal(caps.executionPerformed, false);
    assert.equal(caps.threadsSpawned, false);
    assert.equal(caps.backgroundJobsStarted, false);
    assert.equal(caps.concurrencyEnabled, false);
    assert.equal(caps.asynchronousProcessing, false);
    assert.equal(caps.messagesConsumed, false);
    assert.equal(caps.realWorkerBackend, false);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.implementsAi, false);
    assert.equal(caps.implementsTiss, false);
    assert.equal(caps.implementsBullMq, false);
    assert.equal(caps.implementsHangfire, false);
    assert.equal(caps.implementsAzureWorkers, false);
    assert.equal(caps.implementsAwsLambda, false);
    assert.equal(caps.implementsCloudflareWorkers, false);
    assert.equal(caps.implementsKubernetesJobs, false);
    assert.equal(caps.implementsWorkerThreads, false);
    assert.equal(caps.implementsBackgroundServices, false);
    assert.equal(caps.usesExecutionQueuePortOnly, true);
    assert.equal(caps.noDirectEngineCoupling, true);
    assert.equal(caps.decoupledFromEngines, true);
  });

  it("DefaultExecutionWorkerAdapter é o default da fundação", async () => {
    const port: ExecutionWorkerPort = new DefaultExecutionWorkerAdapter();
    assert.equal(port.providerId, "default");
    const caps = port.capabilities();
    assert.equal(caps.adapterId, DEFAULT_EXECUTION_WORKER_ADAPTER_ID);
    assert.equal(caps.structuralWorkerOnly, true);
    assert.equal(caps.realWorkerBackend, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "default");
  });

  it("test adapter é resolvido pelo provider", async () => {
    const port = createExecutionWorkerPort({ provider: "test" });
    assert.equal(port.providerId, "test");
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("Default usa ping opcional sem I/O externo", async () => {
    const port = new DefaultExecutionWorkerAdapter({
      store: new InMemoryExecutionWorkerStore(),
      ping: async () => ({
        ok: true,
        message: "worker-foundation probe custom",
      }),
    });
    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.message, "worker-foundation probe custom");
    assert.equal(typeof health.latencyMs, "number");
  });

  it("provider default resolve DefaultExecutionWorkerAdapter", () => {
    const defaultPort = createExecutionWorkerPort();
    assert.equal(defaultPort.providerId, "default");
  });

  it("Factory materializa adapters corretos", () => {
    const factory = createExecutionWorkerFactory();
    assert.equal(factory.create().providerId, "default");
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
  });

  it("ExecutionWorkerProvider resolve adapters via Factory", () => {
    const provider = new ExecutionWorkerProvider();
    assert.equal(provider.resolve().providerId, "default");
    assert.equal(provider.resolve({ provider: "mock" }).providerId, "mock");
  });

  it("PoC Application depende só do Port (inversão de dependência)", async () => {
    const port = createExecutionWorkerPort({ provider: "mock" });
    const summary = await getWorkerFoundationHealthSummary(port);

    assert.equal(summary.architectureLayer, "application");
    assert.equal(summary.health.provider, "mock");
    assert.equal(summary.capabilities.provider, "mock");
    assert.equal(summary.health.ok, true);
  });

  it("MOCK adapter id constante está estável", () => {
    assert.equal(MOCK_EXECUTION_WORKER_ADAPTER_ID, "mock-in-memory");
    assert.equal(IN_MEMORY_EXECUTION_WORKER_STORE_ID, "in-memory-execution-worker");
  });
});

describe("INF-02 Worker Foundation — modelos canônicos e store", () => {
  it("registerWorker materializa CanonicalWorker e modelos canônicos", async () => {
    resetAllWorkerFoundationIdSequences();
    const port = new MockExecutionWorkerAdapter({
      createExecutionWorkerId: () => "execution-worker-fixed-1",
      now: () => "2026-08-01T22:00:00.000Z",
    });

    const resolved = await port.registerWorker({
      executionId: "exec-1",
      correlationId: "corr-1",
      contextId: "ctx-1",
      stateMachineId: "sm-1",
      eventBusId: "bus-1",
      executionRegistryId: "reg-1",
      executionTraceId: "trace-1",
      executionCapabilityRegistryId: "cap-reg-1",
      executionDependencyRegistryId: "dep-reg-1",
      executionEnvironmentRegistryId: "env-reg-1",
      executionMessageQueueId: "execution-message-queue-1",
      pipelineId: "pipe-1",
      key: "structural-execution-worker",
      name: "Structural Execution Worker",
      tags: ["worker-foundation", "foundation"],
      structuralNotes: "structural only",
    });

    assert.equal(resolved.ok, true);
    assert.equal(resolved.executionPerformed, false);
    assert.equal(resolved.threadsSpawned, false);
    assert.equal(resolved.backgroundJobsStarted, false);
    assert.equal(resolved.concurrencyEnabled, false);
    assert.equal(resolved.messagesConsumed, false);
    assert.equal(resolved.processingPerformed, false);
    assert.equal(resolved.realWorkerBackend, false);
    assert.equal(resolved.enginesInvoked, false);

    assert.equal(resolved.worker?.kind, "canonical-worker");
    assert.equal(resolved.worker?.id, "execution-worker-fixed-1");
    assert.equal(resolved.worker?.executionWorkerId, "execution-worker-fixed-1");
    assert.equal(resolved.worker?.identity.kind, "canonical-worker-identity");
    assert.equal(resolved.worker?.status.kind, "canonical-worker-status");
    assert.equal(resolved.worker?.status.value, "registered-structural");
    assert.equal(resolved.worker?.configuration.kind, "canonical-worker-configuration");
    assert.equal(resolved.worker?.configuration.backendConnected, false);
    assert.equal(resolved.worker?.configuration.queuePortContract, "ExecutionQueuePort");
    assert.equal(resolved.worker?.capability.kind, "canonical-worker-capabilities");
    assert.equal(resolved.worker?.capability, STRUCTURAL_WORKER_FOUNDATION_CAPABILITY);
    assert.equal(resolved.worker?.executionMessageQueueId, "execution-message-queue-1");
    assert.equal(resolved.worker?.executionPerformed, false);
    assert.equal(resolved.worker?.realWorkerBackend, false);
  });

  it("operações estruturais NÃO executam / NÃO criam threads / NÃO processam", async () => {
    resetAllWorkerFoundationIdSequences();
    const port = new DefaultExecutionWorkerAdapter({
      createExecutionWorkerId: () => "execution-worker-ops-1",
      now: () => "2026-08-01T22:10:00.000Z",
    });

    const registered = await port.registerWorker({ executionId: "exec-ops" });
    assert.equal(registered.ok, true);
    assert.equal(registered.executionPerformed, false);

    const started = await port.startWorker({
      executionWorkerId: registered.worker!.executionWorkerId,
    });
    assert.equal(started.ok, true);
    assert.equal(started.executionPerformed, false);
    assert.equal(started.threadsSpawned, false);
    assert.equal(started.backgroundJobsStarted, false);
    assert.equal(started.concurrencyEnabled, false);
    assert.equal(started.asynchronousProcessing, false);
    assert.equal(started.worker?.status.value, "started-structural");

    const paused = await port.pauseWorker({
      executionWorkerId: registered.worker!.executionWorkerId,
    });
    assert.equal(paused.ok, true);
    assert.equal(paused.executionPerformed, false);
    assert.equal(paused.worker?.status.value, "paused-structural");

    const resumed = await port.resumeWorker({
      executionWorkerId: registered.worker!.executionWorkerId,
    });
    assert.equal(resumed.ok, true);
    assert.equal(resumed.threadsSpawned, false);
    assert.equal(resumed.worker?.status.value, "resumed-structural");

    const stopped = await port.stopWorker({
      executionWorkerId: registered.worker!.executionWorkerId,
    });
    assert.equal(stopped.ok, true);
    assert.equal(stopped.backgroundJobsStarted, false);
    assert.equal(stopped.worker?.status.value, "stopped-structural");

    const got = await port.getWorker({
      executionWorkerId: registered.worker!.executionWorkerId,
      createIfMissing: false,
    });
    assert.equal(got.ok, true);
    assert.equal(got.executionPerformed, false);

    const stats = await port.statistics();
    assert.equal(stats.ok, true);
    assert.equal(stats.statistics?.kind, "canonical-worker-statistics");
    assert.equal(stats.statistics?.executionPerformed, false);
    assert.equal(stats.statistics?.threadsSpawned, false);
    assert.equal(stats.statistics?.realWorkerBackend, false);

    const unregistered = await port.unregisterWorker({
      executionWorkerId: registered.worker!.executionWorkerId,
    });
    assert.equal(unregistered.ok, true);
    assert.equal(unregistered.executionPerformed, false);
  });

  it("InMemoryExecutionWorkerStore é estrutural e sem persistência", () => {
    const store = new InMemoryExecutionWorkerStore();
    assert.equal(store.storeId, IN_MEMORY_EXECUTION_WORKER_STORE_ID);
    assert.equal(store.workerCount(), 0);
    const health = store.health();
    assert.equal(health.ok, true);
  });

  it("referência estrutural OCR Pipeline NÃO utiliza Workers", () => {
    const ref = OCR_PIPELINE_WORKER_FOUNDATION_CONSUMER_REFERENCE;
    assert.equal(ref.kind, "ocr-pipeline-worker-foundation-consumer-reference");
    assert.equal(ref.portContract, "ExecutionWorkerPort");
    assert.equal(ref.queuePortContract, "ExecutionQueuePort");
    assert.equal(ref.willUseWorkerFoundationViaPort, true);
    assert.equal(ref.currentlyUsesWorker, false);
    assert.equal(ref.executionPerformed, false);
    assert.equal(ref.threadsSpawned, false);
    assert.equal(ref.ocrInvoked, false);
    assert.equal(ref.implementsOcr, false);
    assert.equal(ref.structuralReferenceOnly, true);
  });

  it("referência estrutural IA NÃO utiliza Workers", () => {
    const ref = AI_WORKER_FOUNDATION_CONSUMER_REFERENCE;
    assert.equal(ref.kind, "ai-worker-foundation-consumer-reference");
    assert.equal(ref.portContract, "ExecutionWorkerPort");
    assert.equal(ref.queuePortContract, "ExecutionQueuePort");
    assert.equal(ref.willUseWorkerFoundationViaPort, true);
    assert.equal(ref.currentlyUsesWorker, false);
    assert.equal(ref.executionPerformed, false);
    assert.equal(ref.aiInvoked, false);
    assert.equal(ref.implementsAi, false);
    assert.equal(ref.structuralReferenceOnly, true);
  });

  it("ausência de dependências externas de Workers", () => {
    const caps = createExecutionWorkerPort().capabilities();
    assert.equal(caps.implementsBullMq, false);
    assert.equal(caps.implementsHangfire, false);
    assert.equal(caps.implementsAzureWorkers, false);
    assert.equal(caps.implementsAwsLambda, false);
    assert.equal(caps.implementsCloudflareWorkers, false);
    assert.equal(caps.implementsKubernetesJobs, false);
    assert.equal(caps.implementsWorkerThreads, false);
    assert.equal(caps.implementsBackgroundServices, false);
    assert.equal(caps.implementsHttpWorkersQueues, false);
    assert.equal(caps.realWorkerBackend, false);
    assert.equal(caps.concurrencyEnabled, false);
    assert.equal(caps.asynchronousProcessing, false);
  });
});

describe("INF-02 Worker Foundation — integração estrutural com Message Queue", () => {
  it("Worker utiliza exclusivamente ExecutionQueuePort", async () => {
    resetAllMessageQueueIdSequences();
    resetAllWorkerFoundationIdSequences();

    const queuePort = createExecutionQueuePort({ provider: "mock" });
    const queue = await queuePort.getQueue({
      executionId: "exec-mq-link",
      key: "structural-execution-queue",
    });
    assert.equal(queue.ok, true);

    const workerPort = new MockExecutionWorkerAdapter({
      provider: "mock",
      executionQueue: queuePort,
      createExecutionWorkerId: () => "execution-worker-mq-1",
    });

    assert.equal(workerPort.getExecutionQueuePort(), queuePort);
    assert.equal(workerPort.capabilities().usesExecutionQueuePortOnly, true);

    const registered = await workerPort.registerWorker({
      executionId: "exec-mq-link",
      executionMessageQueueId: queue.queue!.executionMessageQueueId,
    });
    assert.equal(registered.ok, true);
    assert.equal(registered.worker?.executionMessageQueueId, queue.queue!.executionMessageQueueId);
    assert.equal(registered.messagesConsumed, false);
    assert.equal(registered.executionPerformed, false);

    // Nenhuma mensagem consumida / processada via Queue Port.
    const peek = await queuePort.peek({
      executionMessageQueueId: queue.queue!.executionMessageQueueId,
    });
    assert.equal(peek.ok, false);
    assert.equal(peek.code, "empty");
  });

  it("Worker NÃO acessa adapters/stores da Message Queue diretamente", () => {
    const workerPort = createExecutionWorkerPort({
      provider: "mock",
    }) as MockExecutionWorkerAdapter;
    const queuePort = workerPort.getExecutionQueuePort();
    assert.ok(queuePort);
    assert.equal(typeof queuePort.getQueue, "function");
    assert.equal(typeof queuePort.enqueue, "function");
    assert.equal(workerPort.capabilities().usesExecutionQueuePortOnly, true);
    assert.equal((workerPort as { messageQueueStore?: unknown }).messageQueueStore, undefined);
  });
});

describe("INF-02 Worker Foundation — integração estrutural com Orchestrator", () => {
  it("Orchestrator anexa executionWorkerId sem executar Workers", async () => {
    resetAllCanonicalExecutionIdSequences();
    resetAllWorkerFoundationIdSequences();
    resetAllMessageQueueIdSequences();

    const port = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-inf02",
      createResultId: () => "canonical-result-inf02",
      createTraceId: () => "canonical-trace-inf02",
      createCorrelationId: () => "canonical-corr-inf02",
      createStepId: (() => {
        let n = 0;
        return () => `canonical-step-inf02-${++n}`;
      })(),
      now: () => "2026-08-01T23:00:00.000Z",
    });

    const started = await port.startExecution({ intakeRef: "intake-inf02" });
    assert.equal(started.ok, true);
    assert.ok(started.executionContext);
    assert.equal(started.executionContext?.state.phase, "finalized");
    assert.equal(started.executionContext?.state.status, "completed");
    assert.equal(started.result?.enginesInvoked, false);

    const workerRef = started.executionContext?.references.find(
      (r) => r.name === "executionWorkerId",
    );
    assert.ok(workerRef);
    assert.ok(workerRef.value.length > 0);

    const queueRef = started.executionContext?.references.find(
      (r) => r.name === "executionMessageQueueId",
    );
    assert.ok(queueRef);

    const historyEntry = started.executionContext?.history.find(
      (h) => h.event === "execution-worker-attached",
    );
    assert.ok(historyEntry);
    assert.equal(historyEntry.attributes?.executionPerformed, false);
    assert.equal(historyEntry.attributes?.threadsSpawned, false);
    assert.equal(historyEntry.attributes?.backgroundJobsStarted, false);
    assert.equal(historyEntry.attributes?.concurrencyEnabled, false);

    const workerPort = port.getExecutionWorkerPort();
    const worker = await workerPort.getWorker({
      executionWorkerId: workerRef.value,
      createIfMissing: false,
    });
    assert.equal(worker.ok, true);
    assert.equal(worker.worker?.executionPerformed, false);
    assert.equal(worker.worker?.threadsSpawned, false);
    assert.equal(worker.worker?.status.value, "registered-structural");
    assert.equal(worker.worker?.executionMessageQueueId, queueRef.value);

    const caps = workerPort.capabilities();
    assert.equal(caps.executionPerformed, false);
    assert.equal(caps.threadsSpawned, false);
    assert.equal(caps.decoupledFromEngines, true);
    assert.equal(caps.usesExecutionQueuePortOnly, true);

    assert.ok(started.message?.includes("ExecutionWorkerPort"));
    assert.ok(started.message?.includes("no execution/threads/background jobs"));
  });

  it("Orchestrator capabilities declaram dependência estrutural do Worker Foundation", () => {
    const port = new DefaultCanonicalExecutionOrchestratorAdapter();
    const caps = port.capabilities();
    assert.equal(caps.dependsOnExecutionWorker, true);
    assert.equal(caps.usesExecutionWorkerStructurally, true);
    assert.equal(caps.dependsOnExecutionQueue, true);
    assert.equal(caps.usesExecutionQueueStructurally, true);
    assert.equal(caps.implementsHttpWorkersQueues, false);
    assert.equal(caps.implementsOcr, false);
    assert.equal(caps.noDirectEngineCoupling, true);
  });

  it("Execution Context permanece transporte; Worker só via Port", async () => {
    resetAllCanonicalExecutionIdSequences();
    const orchestrator = new MockCanonicalExecutionOrchestratorAdapter({
      createExecutionId: () => "canonical-exec-inf02-transport",
      createResultId: () => "canonical-result-inf02-transport",
      createTraceId: () => "canonical-trace-inf02-transport",
      createCorrelationId: () => "canonical-corr-inf02-transport",
      createStepId: (() => {
        let n = 0;
        return () => `canonical-step-transport-${++n}`;
      })(),
      now: () => "2026-08-01T23:30:00.000Z",
    });

    const started = await orchestrator.startExecution();
    assert.equal(started.ok, true);

    const contextPort: ExecutionContextPort = orchestrator.getExecutionContextPort();
    const context = await contextPort.getContext({
      contextId: "canonical-exec-inf02-transport",
    });
    assert.equal(context.ok, true);
    assert.equal(context.context?.capability.structuralTransportOnly, true);
    assert.equal(context.context?.state.processingPerformed, false);

    assert.equal((context.context as { worker?: unknown } | undefined)?.worker, undefined);

    const workerCaps = orchestrator.getExecutionWorkerPort().capabilities();
    assert.equal(workerCaps.structuralWorkerOnly, true);
    assert.equal(workerCaps.decoupledFromEngines, true);
    assert.equal(workerCaps.executionPerformed, false);
  });

  it("módulos EPC-24 / INF-01 anteriores permanecem independentes do Worker Foundation", async () => {
    const resolver: PipelineResolverPort = createPipelineResolverPort({ provider: "mock" });
    const stateMachine = createExecutionStateMachinePort({ provider: "mock" });
    const eventBus = createExecutionEventBusPort({ provider: "mock" });
    const registry = createExecutionRegistryPort({ provider: "mock" });
    const trace = createExecutionTracePort({ provider: "mock" });
    const capabilityRegistry = createExecutionCapabilityRegistryPort({ provider: "mock" });
    const dependencyRegistry = createExecutionDependencyRegistryPort({ provider: "mock" });
    const policyRegistry = createExecutionPolicyRegistryPort({ provider: "mock" });
    const constraintRegistry = createExecutionConstraintRegistryPort({ provider: "mock" });
    const requirementRegistry = createExecutionRequirementRegistryPort({ provider: "mock" });
    const resourceRegistry = createExecutionResourceRegistryPort({ provider: "mock" });
    const environmentRegistry = createExecutionEnvironmentRegistryPort({ provider: "mock" });
    const messageQueue = createExecutionQueuePort({ provider: "mock" });
    const orchestrator = new MockCanonicalExecutionOrchestratorAdapter({
      pipelineResolver: resolver,
      executionStateMachine: stateMachine,
      executionEventBus: eventBus,
      executionRegistry: registry,
      executionTrace: trace,
      executionCapabilityRegistry: capabilityRegistry,
      executionDependencyRegistry: dependencyRegistry,
      executionPolicyRegistry: policyRegistry,
      executionConstraintRegistry: constraintRegistry,
      executionRequirementRegistry: requirementRegistry,
      executionResourceRegistry: resourceRegistry,
      executionEnvironmentRegistry: environmentRegistry,
      executionQueue: messageQueue,
    });

    const started = await orchestrator.startExecution();
    assert.equal(started.ok, true);
    assert.equal(started.result?.enginesInvoked, false);

    const priorModules = [
      resolver,
      stateMachine,
      eventBus,
      registry,
      trace,
      capabilityRegistry,
      dependencyRegistry,
      policyRegistry,
      constraintRegistry,
      requirementRegistry,
      resourceRegistry,
      environmentRegistry,
      messageQueue,
    ] as Array<{ getExecutionWorkerPort?: unknown }>;

    for (const mod of priorModules) {
      assert.equal(mod.getExecutionWorkerPort, undefined);
    }
  });

  it("Factory do Orchestrator injeta ExecutionWorkerPort", async () => {
    const executionWorker = createExecutionWorkerPort({ provider: "test" });
    const factory = createCanonicalExecutionOrchestratorFactory({
      executionWorker,
    });
    const port = factory.create({ provider: "mock" });
    assert.ok((port as MockCanonicalExecutionOrchestratorAdapter).getExecutionWorkerPort);
    const started = await port.startExecution();
    assert.equal(started.ok, true);
  });

  it("Default orchestrator health inclui Worker Foundation", async () => {
    const port = new DefaultCanonicalExecutionOrchestratorAdapter();
    const health = await port.health();
    assert.equal(health.ok, true);
  });

  it("ausência de acoplamento direto com OCR / IA / TISS", () => {
    const workerCaps = createExecutionWorkerPort().capabilities();
    const orchCaps = new DefaultCanonicalExecutionOrchestratorAdapter().capabilities();
    assert.equal(workerCaps.implementsOcr, false);
    assert.equal(workerCaps.implementsAi, false);
    assert.equal(workerCaps.implementsTiss, false);
    assert.equal(workerCaps.decoupledFromEngines, true);
    assert.equal(orchCaps.implementsOcr, false);
    assert.equal(orchCaps.implementsAi, false);
    assert.equal(orchCaps.implementsTissRules, false);
    assert.equal(orchCaps.noDirectEngineCoupling, true);
  });
});

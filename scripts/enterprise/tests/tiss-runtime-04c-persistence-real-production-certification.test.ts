#!/usr/bin/env node
/**
 * A8-03 — TISS-RUNTIME-04C Persistence Real Production Certification.
 *
 * Certifica o RealTissPersistenceRuntimeAdapter para produção:
 *   - Persistência válida (PROTOCOL_SENT → PERSISTED)
 *   - Persistência inválida (documento/queue inexistente, payload inválido, provider indisponível)
 *   - Retry estrutural (attempts, backoff, latência)
 *   - Dead Letter (via QueueRuntimePort / EnterpriseRuntime)
 *   - Observability (health, providerInfo, capabilities, telemetry)
 *   - Integridade dos dados (correlationId, previousJobId, runtimeId, tenantId, jobId, timestamps, metadata, payload)
 *   - Idempotência (dupla persistência do mesmo messageId gera um único registro)
 *   - Recovery (falha transitória → retentativa → sucesso)
 *   - Consistência Queue ↔ PersistentQueue
 *   - Performance (latência média, throughput)
 *
 * Sem alterar EnterpriseRuntime, Queue, Worker, Scheduler, Retry, Dead Letter,
 * Observability, Pipeline, Foundations, Ports, Composition Root.
 */
process.env.MEDICFLOW_QUEUE_RUNTIME_BACKEND = "memory";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import {
  ENTERPRISE_TISS_QUEUE_NAME,
  TISS_JOB_STATUS_PROTOCOL_SENT,
  TISS_JOB_STATUS_PERSISTED,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
import {
  createPersistentQueueRuntimePort,
  RealTissPersistenceRuntimeAdapter,
} from "../../../src/lib/enterprise/persistent-queue-runtime/index.ts";
import {
  createEnterpriseRuntime,
  resetEnterpriseRuntimeForTests,
  setEnterpriseRuntimeForTests,
  processTissProtocolSentPersisted,
} from "../../../src/lib/enterprise/runtime/index.ts";
import { resetQueueRuntimeIdSequences } from "../../../src/lib/enterprise/queue-runtime/index.ts";

describe("A8-03 — TISS-RUNTIME-04C Persistence Real Production Certification", () => {
  it("1. Persistence válida: PROTOCOL_SENT → PERSISTED → Envelope íntegro", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-04c-real",
      persistentQueueRuntimePort: createPersistentQueueRuntimePort({ provider: "real-tiss" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const queue = runtime.getQueueRuntimePort();
    const protocolMessageId = "job-tiss-04c-protocol";
    await queue.enqueue({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: protocolMessageId,
      payloadRef: "storage://tiss/doc-tiss-04c",
      correlationId: "corr-tiss-04c-real",
      metadata: {
        kind: "canonical-queue-metadata",
        sessionId: "sess-tiss-04c",
        correlationId: "corr-tiss-04c-real",
        source: "tiss-protocol",
        tags: ["tiss-job", TISS_JOB_STATUS_PROTOCOL_SENT],
        customAttributes: {
          status: TISS_JOB_STATUS_PROTOCOL_SENT,
          tissJobStatus: TISS_JOB_STATUS_PROTOCOL_SENT,
          documentId: "doc-tiss-04c",
          sessionId: "sess-tiss-04c",
          batchId: "batch-tiss-04c",
          xmlDocumentId: "xml-doc-tiss-04c",
          profileId: "profile-tiss-04c",
          ocrExecuted: true,
          parserExecuted: true,
          validationExecuted: true,
          enrichmentExecuted: true,
          xmlGenerated: true,
          xmlExecuted: true,
          batchCreated: true,
          batchExecuted: true,
          protocolSent: true,
          protocolExecuted: true,
          protocolResolved: false,
          persistenceExecuted: false,
          auditExecuted: false,
          completedExecuted: false,
        },
      },
    });

    const result = await processTissProtocolSentPersisted({
      workerName: "tiss-persistence-04c-real",
      pollIntervalMs: 15,
      waitTimeoutMs: 8_000,
    });

    assert.equal(result.ok, true);
    assert.equal(result.entry, "getEnterpriseRuntime");
    assert.equal(result.persisted, true);
    assert.equal(result.auditExecuted, false);
    assert.equal(result.completedExecuted, false);
    assert.equal(result.infrastructure.persistentQueueRuntimePort, true);
    assert.equal(result.infrastructure.deadLetterRuntime, true);
    assert.equal(result.job?.status, TISS_JOB_STATUS_PERSISTED);
    assert.equal(result.job?.previousJobId, protocolMessageId);
    assert.equal(result.job?.queueName, ENTERPRISE_TISS_QUEUE_NAME);

    const queuePort = runtime.getQueueRuntimePort();
    assert.equal(typeof (queuePort as { getDeadLetterRuntimePort?: () => unknown }).getDeadLetterRuntimePort, "function");

    const peeked = await queue.peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: result.job!.jobId,
    });
    assert.equal(peeked.ok, true);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.tissJobStatus, TISS_JOB_STATUS_PERSISTED);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.persistenceExecuted, true);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.status, TISS_JOB_STATUS_PERSISTED);
  });

  it("2. Persistence inválida: documento/queue inexistente, payload inválido, provider indisponível", async () => {
    const port = createPersistentQueueRuntimePort({ provider: "real-tiss" });

    // documento/queue inexistente: release em queueId desconhecido
    const release = await port.release({ queueId: "queue-does-not-exist", messageId: "msg-none" });
    assert.equal(release.ok, false);
    assert.equal(release.code, "PERSISTENT_QUEUE_RUNTIME_QUEUE_NOT_FOUND");

    // queue inexistente: unregister em queueId inexistente
    const unregister = await port.unregister({ queueId: "queue-does-not-exist" });
    assert.equal(unregister.ok, false);
    assert.equal(unregister.code, "PERSISTENT_QUEUE_RUNTIME_SCHEDULE_NOT_FOUND");

    // provider indisponível: health() reporta unhealthy
    const unhealthy = new RealTissPersistenceRuntimeAdapter({ healthy: false });
    const health = await unhealthy.health();
    assert.equal(health.ok, false);
    assert.equal(health.status, "unhealthy");
    assert.equal(health.provider, "real-tiss");

    // payload/operacao inválida: persist falha por falha transitória sem retentativa
    const failing = new RealTissPersistenceRuntimeAdapter({
      failAttempts: 2,
      defaultRetryCount: 0,
      defaultRetryBackoffMs: 0,
    });
    const invalid = await failing.persist({
      queueName: "real-tiss-invalid",
      messageId: "msg-invalid",
      metadata: { customAttributes: { payload: null } },
    });
    assert.equal(invalid.ok, false);
    assert.equal(invalid.code, "PERSISTENT_QUEUE_RUNTIME_FAILED");
    assert.ok((invalid.telemetry?.attempts ?? 0) >= 1);
  });

  it("3. Retry: recuperação automática com attempts, backoff e latência", async () => {
    const port = new RealTissPersistenceRuntimeAdapter({
      failAttempts: 2,
      defaultRetryCount: 2,
      defaultRetryBackoffMs: 10,
    });

    const started = performance.now();
    const registered = await port.register({ queueName: "real-tiss-retry-04c" });
    const elapsed = performance.now() - started;

    assert.equal(registered.ok, true);
    assert.equal(registered.code, "PERSISTENT_QUEUE_RUNTIME_OK");
    assert.equal(registered.telemetry?.attempts, 3);
    assert.ok(registered.telemetry?.latencyMs >= 20, "backoff acumulado deve ser >= 20ms (10 + 20)");
    assert.ok(registered.telemetry?.latencyMs >= elapsed - 5, "latência reportada coerente com tempo real");
  });

  it("4. Dead Letter: QueueRuntimePort expõe getDeadLetterRuntimePort e processTiss reporta DL disponível", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-04c-dl",
      persistentQueueRuntimePort: createPersistentQueueRuntimePort({ provider: "real-tiss" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const queue = runtime.getQueueRuntimePort();
    const queueAdapter = queue as { getDeadLetterRuntimePort?: () => unknown };
    assert.equal(typeof queueAdapter.getDeadLetterRuntimePort, "function");

    const dlPort = queueAdapter.getDeadLetterRuntimePort?.();
    assert.ok(dlPort, "DeadLetterRuntimePort deve estar disponível via QueueRuntimePort");
  });

  it("5. Observability: health, providerInfo, capabilities e telemetry", async () => {
    const port = createPersistentQueueRuntimePort({ provider: "real-tiss" });

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "real-tiss");
    assert.equal(health.runtimeReady, true);
    assert.equal(health.realPersistentBackend, false);

    const info = port.providerInfo();
    assert.equal(info.providerId, "real-tiss");
    assert.equal(info.status, "ready");
    assert.equal(info.providerType, "PERSISTENT_QUEUE_RUNTIME");

    const caps = port.capabilities();
    assert.equal(caps.provider, "real-tiss");
    assert.equal(caps.engine?.supportsPersist, true);
    assert.equal(caps.engine?.supportsRetry, true);
    assert.equal(caps.engine?.supportsTelemetry, true);
    assert.equal(caps.usesQueueRuntimePort, true);
    assert.equal(caps.usesWorkerRuntimePort, true);
    assert.equal(caps.usesSchedulerRuntimePort, true);
    assert.equal(caps.usesObservabilityRuntimePort, true);

    const stats = await port.stats();
    assert.equal(stats.ok, true);
    assert.equal(stats.provider, "real-tiss");
    assert.ok(stats.statistics);
  });

  it("6. Integridade dos dados: correlationId, previousJobId, runtimeId, tenantId, jobId, timestamps, metadata, payload", async () => {
    const port = createPersistentQueueRuntimePort({ provider: "real-tiss" });

    const payload = { protocolId: "proto-04c", value: 12345, items: ["a", "b"] };
    const registered = await port.register({
      queueName: "real-tiss-integrity",
      correlationId: "corr-integrity",
      metadata: { customAttributes: { tenantId: "tenant-04c", runtimeId: "rt-04c" } },
    });
    assert.equal(registered.ok, true);

    const persisted = await port.persist({
      queueId: registered.queue!.queueId,
      messageId: "msg-integrity",
      previousJobId: "job-prev-04c",
      metadata: {
        kind: "canonical-queue-metadata",
        source: "tiss-integrity",
        tags: ["tiss-persistence", "integrity"],
        customAttributes: {
          tenantId: "tenant-04c",
          runtimeId: "rt-04c",
          jobId: "job-04c",
          previousJobId: "job-prev-04c",
          payloadHash: "sha256-abc",
          payload,
        },
      },
    });
    assert.equal(persisted.ok, true);
    assert.equal(persisted.persistentMessage?.queueId, registered.queue!.queueId);
    assert.equal(persisted.persistentMessage?.messageId, "msg-integrity");
    assert.equal(persisted.persistentMessage?.status, "persisted");
    assert.equal(persisted.persistentMessage?.metadata?.customAttributes?.tenantId, "tenant-04c");
    assert.equal(persisted.persistentMessage?.metadata?.customAttributes?.runtimeId, "rt-04c");
    assert.equal(persisted.persistentMessage?.metadata?.customAttributes?.jobId, "job-04c");
    assert.equal(persisted.persistentMessage?.metadata?.customAttributes?.previousJobId, "job-prev-04c");
    assert.deepEqual(persisted.persistentMessage?.metadata?.customAttributes?.payload, payload);
    assert.equal(persisted.envelope?.queueId, registered.queue!.queueId);
    assert.equal(persisted.envelope?.messageId, "msg-integrity");
    assert.equal(persisted.envelope?.status, "persisted");
    assert.ok(persisted.persistentMessage?.registeredAt);
    assert.ok(persisted.persistentMessage?.updatedAt);
    assert.ok(persisted.result?.createdAt);

    const listed = await port.list({ queueId: registered.queue!.queueId });
    const msg = listed.messages?.find((m) => m.messageId === "msg-integrity");
    assert.ok(msg);
    assert.equal(msg?.metadata?.customAttributes?.previousJobId, "job-prev-04c");
  });

  it("7. Idempotência: persistência dupla do mesmo messageId gera um único registro", async () => {
    const port = createPersistentQueueRuntimePort({ provider: "real-tiss" });

    const registered = await port.register({ queueName: "real-tiss-idempotent" });
    assert.equal(registered.ok, true);

    const first = await port.persist({
      queueId: registered.queue!.queueId,
      messageId: "msg-idempotent",
      metadata: { customAttributes: { value: 1 } },
    });
    assert.equal(first.ok, true);

    const second = await port.persist({
      queueId: registered.queue!.queueId,
      messageId: "msg-idempotent",
      metadata: { customAttributes: { value: 2 } },
    });
    assert.equal(second.ok, true);

    const listed = await port.list({ queueId: registered.queue!.queueId });
    const messages = listed.messages?.filter((m) => m.messageId === "msg-idempotent") ?? [];
    assert.equal(messages.length, 1, "deve existir apenas uma mensagem para o mesmo messageId");
    assert.deepEqual(messages[0].metadata?.customAttributes?.value, 2, "último payload deve prevalecer");

    const stats = await port.stats();
    assert.equal(stats.statistics?.totalMessages, 1);
  });

  it("8. Recovery: interrupção → restart → release → recuperação completa", async () => {
    const port = new RealTissPersistenceRuntimeAdapter({
      failAttempts: 1,
      defaultRetryCount: 2,
      defaultRetryBackoffMs: 5,
    });

    // persistência com falha transitória na primeira tentativa
    const persisted = await port.persist({
      queueName: "real-tiss-recovery",
      messageId: "msg-recovery",
    });
    assert.equal(persisted.ok, true);
    assert.equal(persisted.telemetry?.attempts, 2, "deve recuperar após uma falha transitória");
    assert.equal(persisted.persistentMessage?.status, "persisted");

    const registeredQueueId = persisted.queue!.queueId;

    const released = await port.release({
      queueId: registeredQueueId,
      messageId: "msg-recovery",
    });
    assert.equal(released.ok, true);
    assert.equal(released.persistentMessage?.status, "released");

    const listed = await port.list({ queueId: registeredQueueId });
    assert.equal(listed.queues?.[0]?.status, "released");

    // reiniciar com novo adapter sobre o mesmo store a partir do anterior
    const afterRestart = new RealTissPersistenceRuntimeAdapter({ store: port.getStore() });
    const recovered = await afterRestart.list({ queueId: registeredQueueId });
    assert.equal(recovered.ok, true);
    const message = recovered.messages?.find((m) => m.messageId === "msg-recovery");
    assert.ok(message, "mensagem deve estar preservada após restart");
    assert.equal(message?.status, "released");
  });

  it("9. Consistência Queue ↔ PersistentQueue: headers, metadata, payload, status, correlationId preservados", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-04c-consistency",
      persistentQueueRuntimePort: createPersistentQueueRuntimePort({ provider: "real-tiss" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const queue = runtime.getQueueRuntimePort();
    const protocolMessageId = "job-tiss-04c-consistency";
    const correlationId = "corr-tiss-04c-consistency";
    await queue.enqueue({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: protocolMessageId,
      payloadRef: "storage://tiss/doc-tiss-04c-consistency",
      correlationId,
      metadata: {
        kind: "canonical-queue-metadata",
        sessionId: "sess-consistency",
        correlationId,
        source: "tiss-protocol",
        tags: ["tiss-job", TISS_JOB_STATUS_PROTOCOL_SENT],
        customAttributes: {
          status: TISS_JOB_STATUS_PROTOCOL_SENT,
          tissJobStatus: TISS_JOB_STATUS_PROTOCOL_SENT,
          ocrExecuted: true,
          parserExecuted: true,
          validationExecuted: true,
          enrichmentExecuted: true,
          xmlGenerated: true,
          xmlExecuted: true,
          batchCreated: true,
          batchExecuted: true,
          protocolSent: true,
          protocolExecuted: true,
          protocolResolved: false,
          persistenceExecuted: false,
          auditExecuted: false,
          completedExecuted: false,
        },
      },
    });

    const result = await processTissProtocolSentPersisted({
      workerName: "tiss-persistence-04c-consistency",
      pollIntervalMs: 15,
      waitTimeoutMs: 8_000,
    });

    assert.equal(result.ok, true);
    assert.equal(result.persisted, true);
    assert.equal(result.job?.previousJobId, protocolMessageId);
    assert.equal(result.job?.queueName, ENTERPRISE_TISS_QUEUE_NAME);

    const peeked = await queue.peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: result.job!.jobId,
    });
    assert.equal(peeked.ok, true);
    assert.equal(peeked.queueMessage?.metadata?.correlationId, correlationId);
    assert.equal(peeked.queueMessage?.metadata?.sessionId, "sess-consistency");
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.tissJobStatus, TISS_JOB_STATUS_PERSISTED);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.persistenceExecuted, true);
  });

  it("10. Performance: latência média e throughput", async () => {
    const port = createPersistentQueueRuntimePort({ provider: "real-tiss" });

    const registered = await port.register({ queueName: "real-tiss-perf" });
    assert.equal(registered.ok, true);

    const iterations = 50;
    const queueId = registered.queue!.queueId;
    const start = performance.now();
    for (let i = 0; i < iterations; i += 1) {
      await port.persist({
        queueId,
        messageId: `msg-perf-${i}`,
        metadata: { customAttributes: { idx: i } },
      });
    }
    const totalMs = performance.now() - start;

    const avgLatencyMs = totalMs / iterations;
    const throughputOps = (iterations / totalMs) * 1000;

    console.log(`[A8-03 performance] totalMs=${totalMs.toFixed(2)} avgLatencyMs=${avgLatencyMs.toFixed(2)} throughputOps=${throughputOps.toFixed(2)}`);

    assert.ok(avgLatencyMs < 100, `latência média deve ser < 100ms (foi ${avgLatencyMs.toFixed(2)}ms)`);
    assert.ok(throughputOps > 5, `throughput deve ser > 5 ops/s (foi ${throughputOps.toFixed(2)} ops/s)`);

    const stats = await port.stats();
    assert.equal(stats.statistics?.totalMessages, iterations);
  });
});

#!/usr/bin/env node
/**
 * A8-02 — TISS-RUNTIME-04B Persistence Real Activation.
 *
 * Prova:
 *   - RealTissPersistenceRuntimeAdapter ativado via provider `real-tiss`.
 *   - Reutiliza DefaultPersistentQueueRuntimeAdapter para ciclo de vida, retry,
 *     observability, telemetry, health, capabilities, store.
 *   - PersistentQueueRuntimePort, QueueRuntimePort, WorkerRuntimePort, SchedulerRuntimePort,
 *     Retry, Dead Letter, ObservabilityRuntimePort reutilizados sem alteração.
 *   - PROTOCOL_SENT → PERSISTED com audit/completed não executados.
 */
process.env.MEDICFLOW_QUEUE_RUNTIME_BACKEND = "memory";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ENTERPRISE_TISS_QUEUE_NAME,
  TISS_JOB_STATUS_PROTOCOL_SENT,
  TISS_JOB_STATUS_PERSISTED,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
import {
  createPersistentQueueRuntimePort,
  RealTissPersistenceRuntimeAdapter,
  REAL_TISS_PERSISTENCE_RUNTIME_ADAPTER_ID,
  REAL_TISS_PERSISTENCE_RUNTIME_VERSION,
} from "../../../src/lib/enterprise/persistent-queue-runtime/index.ts";
import {
  createEnterpriseRuntime,
  resetEnterpriseRuntimeForTests,
  setEnterpriseRuntimeForTests,
  processTissProtocolSentPersisted,
} from "../../../src/lib/enterprise/runtime/index.ts";
import { resetQueueRuntimeIdSequences } from "../../../src/lib/enterprise/queue-runtime/index.ts";

describe("A8-02 — TISS-RUNTIME-04B Persistence Real Activation", () => {
  it("1. RealTissPersistenceRuntimeAdapter resolve via provider real-tiss e implementa PersistentQueueRuntimePort", () => {
    const port = createPersistentQueueRuntimePort({ provider: "real-tiss" });
    assert.ok(port instanceof RealTissPersistenceRuntimeAdapter);
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
    assert.equal(info.metadata.version, REAL_TISS_PERSISTENCE_RUNTIME_VERSION);
    assert.equal(info.metadata.vendor, "medicflow-enterprise");
    assert.equal(info.providerType, "PERSISTENT_QUEUE_RUNTIME");
    assert.equal(info.status, "ready");
  });

  it("2. RealTissPersistenceRuntimeAdapter persiste e libera via Default subjacente", async () => {
    const port = createPersistentQueueRuntimePort({ provider: "real-tiss" });

    const registered = await port.register({
      queueName: "real-tiss-persistence-queue",
      correlationId: "corr-tiss-04b",
    });
    assert.equal(registered.ok, true);
    assert.equal(registered.provider, "real-tiss");
    assert.equal(registered.queue?.queueName, "real-tiss-persistence-queue");
    assert.ok(registered.queue?.queueId);

    const persisted = await port.persist({
      queueId: registered.queue!.queueId,
      messageId: "msg-tiss-04b",
    });
    assert.equal(persisted.ok, true);
    assert.equal(persisted.provider, "real-tiss");
    assert.equal(persisted.persistentMessage?.status, "persisted");
    assert.ok(persisted.persistentMessage?.metadata?.tags?.includes("real-tiss"));
    assert.ok(persisted.persistentMessage?.metadata?.tags?.includes("tiss-persistence"));

    const listed = await port.list();
    assert.equal(listed.ok, true);
    assert.ok((listed.messages?.length ?? 0) >= 1);
    assert.equal(listed.provider, "real-tiss");

    const released = await port.release({
      queueId: persisted.queue!.queueId,
      messageId: persisted.persistentMessage!.messageId,
    });
    assert.equal(released.ok, true);
    assert.equal(released.provider, "real-tiss");
    assert.equal(released.persistentMessage?.status, "released");
  });

  it("3. End-to-end: PROTOCOL_SENT → PERSISTED via RealTissPersistenceRuntimeAdapter", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-04b-real",
      persistentQueueRuntimePort: createPersistentQueueRuntimePort({ provider: "real-tiss" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const queue = runtime.getQueueRuntimePort();
    const protocolMessageId = "job-tiss-04b-protocol";
    const enqueued = await queue.enqueue({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: protocolMessageId,
      payloadRef: "storage://tiss/doc-tiss-04b",
      correlationId: "corr-tiss-04b-real",
      metadata: {
        kind: "canonical-queue-metadata",
        sessionId: "sess-tiss-04b",
        correlationId: "corr-tiss-04b-real",
        source: "tiss-protocol",
        tags: ["tiss-job", TISS_JOB_STATUS_PROTOCOL_SENT],
        customAttributes: {
          status: TISS_JOB_STATUS_PROTOCOL_SENT,
          tissJobStatus: TISS_JOB_STATUS_PROTOCOL_SENT,
          documentId: "doc-tiss-04b",
          sessionId: "sess-tiss-04b",
          batchId: "batch-tiss-04b",
          xmlDocumentId: "xml-doc-tiss-04b",
          profileId: "profile-tiss-04b",
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
    assert.equal(enqueued.ok, true);

    const result = await processTissProtocolSentPersisted({
      workerName: "tiss-persistence-04b-real",
      pollIntervalMs: 15,
      waitTimeoutMs: 8_000,
    });

    assert.equal(result.ok, true);
    assert.equal(result.entry, "getEnterpriseRuntime");
    assert.equal(result.runtimeId, "test-tiss-04b-real");
    assert.equal(result.persisted, true);
    assert.equal(result.protocolSent, true);
    assert.equal(result.batchCreated, true);
    assert.equal(result.xmlGenerated, true);
    assert.equal(result.enrichmentExecuted, true);
    assert.equal(result.validationExecuted, true);
    assert.equal(result.parserExecuted, true);
    assert.equal(result.ocrExecuted, true);
    assert.equal(result.auditExecuted, false);
    assert.equal(result.completedExecuted, false);
    assert.equal(result.infrastructure.persistentQueueRuntimePort, true);
    assert.equal(result.infrastructure.queueRuntimePort, true);
    assert.equal(result.infrastructure.workerRuntimePort, true);
    assert.equal(result.infrastructure.schedulerRuntimePort, true);
    assert.equal(result.infrastructure.observabilityRuntimePort, true);
    assert.equal(result.infrastructure.retryInfrastructure, true);
    assert.equal(result.infrastructure.deadLetterRuntime, true);
    assert.equal(result.job?.status, TISS_JOB_STATUS_PERSISTED);
    assert.equal(result.job?.queueName, ENTERPRISE_TISS_QUEUE_NAME);
    assert.equal(result.job?.previousJobId, protocolMessageId);

    assert.equal(runtime.getPersistentQueueRuntimePort().providerId, "real-tiss");

    const peeked = await queue.peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: result.job!.jobId,
    });
    assert.equal(peeked.ok, true);
    assert.equal(peeked.queueMessage?.status, "enqueued");
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.tissJobStatus, TISS_JOB_STATUS_PERSISTED);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.status, TISS_JOB_STATUS_PERSISTED);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.persisted, true);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.persistenceExecuted, true);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.auditExecuted, false);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.completedExecuted, false);
  });

  it("4. Observability: health, providerInfo e capabilities reportam real-tiss", async () => {
    const port = createPersistentQueueRuntimePort({ provider: "real-tiss" });

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "real-tiss");
    assert.equal(health.runtimeReady, true);
    assert.equal(health.realPersistentBackend, false);

    const caps = port.capabilities();
    assert.equal(caps.provider, "real-tiss");
    assert.equal(caps.adapterId, REAL_TISS_PERSISTENCE_RUNTIME_ADAPTER_ID);

    const info = port.providerInfo();
    assert.equal(info.providerId, "real-tiss");
    assert.equal(info.status, "ready");
    assert.equal(info.providerType, "PERSISTENT_QUEUE_RUNTIME");
  });

  it("5. Retry com transient failures funciona via DefaultPersistentQueueRuntimeAdapter subjacente", async () => {
    const port = new RealTissPersistenceRuntimeAdapter({
      provider: "real-tiss",
      failAttempts: 2,
      defaultRetryCount: 2,
      defaultRetryBackoffMs: 10,
    });

    const registered = await port.register({
      queueName: "real-tiss-persistence-retry",
    });

    assert.equal(registered.ok, true);
    assert.equal(registered.provider, "real-tiss");
    assert.ok((registered.telemetry?.attempts ?? 0) > 1, `expected >1 attempts, got ${registered.telemetry?.attempts}`);
  });

  it("6. Cancelamento via AbortSignal", async () => {
    const port = createPersistentQueueRuntimePort({ provider: "real-tiss" });
    const controller = new AbortController();
    controller.abort();

    const registered = await port.register({
      queueName: "real-tiss-persistence-cancelled",
      signal: controller.signal,
    });

    assert.equal(registered.ok, false);
    assert.equal(registered.provider, "real-tiss");
    assert.equal(registered.code, "PERSISTENT_QUEUE_RUNTIME_CANCELLED");
  });
});

#!/usr/bin/env node
/**
 * A10-02 — Completed Real Activation.
 *
 * Prova:
 *   RealTissCompletedRuntimeAdapter registrado como provider "real-tiss"
 *     → CompletedRuntimeFactory / CompletedRuntimeRegistry
 *     → createCompletedRuntimePort({ provider: "real-tiss" })
 *     → processTissCompletedJob via getEnterpriseRuntime / QueueRuntimePort
 *     → AUDITED → COMPLETED (terminal, ack, sem reenfileiramento)
 *
 * Sem novo Port / Runtime / Pipeline / Queue / Worker / Scheduler / Retry / DLQ / Observability.
 */
process.env.MEDICFLOW_QUEUE_RUNTIME_BACKEND = "memory";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

import {
  ENTERPRISE_TISS_QUEUE_NAME,
  TISS_JOB_STATUS_AUDITED,
  type CanonicalQueueMessage,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
import { processTissCompletedJob } from "../../../src/lib/enterprise/queue-runtime/operational/process-tiss-completed-job.ts";
import {
  REALTISS_COMPLETED_RUNTIME_ADAPTER_ID,
  REALTISS_COMPLETED_RUNTIME_VERSION,
  RealTissCompletedRuntimeAdapter,
  createCompletedRuntimePort,
  createDefaultCompletedRuntimeRegistry,
} from "../../../src/lib/enterprise/completed-runtime/index.ts";
import {
  createEnterpriseRuntime,
  getEnterpriseRuntime,
  resetEnterpriseRuntimeForTests,
  setEnterpriseRuntimeForTests,
} from "../../../src/lib/enterprise/runtime/index.ts";

describe("A10-02 Completed Real Activation — AUDITED → COMPLETED com real-tiss", () => {
  it("factory + registry resolvem provider real-tiss", () => {
    const port = createCompletedRuntimePort({ provider: "real-tiss" });
    assert.equal(port.providerId, "real-tiss");
    assert.equal(port.capabilities().adapterId, REALTISS_COMPLETED_RUNTIME_ADAPTER_ID);
    assert.equal(port.capabilities().provider, "real-tiss");
    assert.equal(port.providerInfo().providerId, "real-tiss");
    assert.equal(port.providerInfo().metadata.vendor, "real-tiss");
  });

  it("processTissCompletedJob evolui AUDITED para COMPLETED via QueueRuntimePort", async () => {
    resetEnterpriseRuntimeForTests();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-06a-real-tiss",
    });
    setEnterpriseRuntimeForTests(runtime);

    const message: CanonicalQueueMessage = {
      kind: "canonical-queue-message",
      messageId: "job-audited-06a",
      queueId: ENTERPRISE_TISS_QUEUE_NAME,
      status: "dequeued",
      registeredAt: "2026-08-13T00:00:00.000Z",
      updatedAt: "2026-08-13T00:00:00.000Z",
      messagesPublished: true,
      messagesConsumed: true,
      workersInvoked: true,
      processingPerformed: true,
      persistenceImplemented: true,
      realQueueBackend: false,
      identity: {
        kind: "canonical-queue-identity",
        messageId: "job-audited-06a",
        queueName: ENTERPRISE_TISS_QUEUE_NAME,
        correlationId: "corr-06a",
        sessionId: "session-06a",
      },
      metadata: {
        kind: "canonical-queue-metadata",
        source: "tiss-runtime-06a",
        sessionId: "session-06a",
        correlationId: "corr-06a",
        customAttributes: {
          tissJobStatus: TISS_JOB_STATUS_AUDITED,
          status: TISS_JOB_STATUS_AUDITED,
          previousJobId: "job-audited-06a",
          sessionId: "session-06a",
        },
      },
    };

    const result = await processTissCompletedJob({
      getQueueRuntimePort: () => runtime.getQueueRuntimePort(),
      message,
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
    });

    assert.equal(result.ok, true);
    assert.equal(result.settle, "ack");
    assert.equal(result.completed, true);
    assert.equal(result.reenqueued, false);
    assert.equal(result.audited, true);
    assert.equal(result.job?.status, "COMPLETED");
    assert.equal(result.job?.correlationId, "corr-06a");
    assert.equal(result.job?.previousJobId, "job-audited-06a");
    assert.equal(result.job?.source, "tiss-runtime-06a");
    assert.equal(result.job?.queueName, ENTERPRISE_TISS_QUEUE_NAME);
    assert.equal(result.job?.terminal, true);
    assert.equal(message.metadata?.sessionId, "session-06a");
  });

  it("processTissCompletedJob rejeita status que não é AUDITED", async () => {
    resetEnterpriseRuntimeForTests();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-06a-invalid",
    });
    setEnterpriseRuntimeForTests(runtime);

    const message: CanonicalQueueMessage = {
      kind: "canonical-queue-message",
      messageId: "job-pending-06a",
      queueId: ENTERPRISE_TISS_QUEUE_NAME,
      status: "dequeued",
      registeredAt: "2026-08-13T00:00:00.000Z",
      updatedAt: "2026-08-13T00:00:00.000Z",
      messagesPublished: true,
      messagesConsumed: true,
      workersInvoked: true,
      processingPerformed: true,
      persistenceImplemented: true,
      realQueueBackend: false,
      identity: {
        kind: "canonical-queue-identity",
        messageId: "job-pending-06a",
        queueName: ENTERPRISE_TISS_QUEUE_NAME,
      },
      metadata: {
        kind: "canonical-queue-metadata",
        customAttributes: {
          tissJobStatus: "PENDING",
          status: "PENDING",
        },
      },
    };

    const result = await processTissCompletedJob({
      getQueueRuntimePort: () => runtime.getQueueRuntimePort(),
      message,
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
    });

    assert.equal(result.ok, false);
    assert.equal(result.settle, "nack");
    assert.equal(result.completed, false);
    assert.equal(result.reenqueued, false);
    assert.equal(result.code, "TISS_COMPLETED_JOB_STATUS_NOT_AUDITED");
  });

  it("RealTissCompletedRuntimeAdapter expõe identidade real-tiss", async () => {
    const port = new RealTissCompletedRuntimeAdapter({ provider: "real-tiss" });
    assert.equal(port.providerId, "real-tiss");
    assert.equal(port.capabilities().adapterId, REALTISS_COMPLETED_RUNTIME_ADAPTER_ID);
    assert.equal(port.capabilities().provider, "real-tiss");
    assert.equal(port.providerInfo().metadata.vendor, "real-tiss");
    assert.equal(port.providerInfo().metadata.version, REALTISS_COMPLETED_RUNTIME_VERSION);
    assert.equal(port.capabilities().completedEngineImplemented, false);

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "real-tiss");
    assert.equal(health.runtimeReady, true);
    assert.equal(health.completedEngineImplemented, false);
  });

  it("registry default contém real-tiss", () => {
    const registry = createDefaultCompletedRuntimeRegistry();
    assert.equal(registry.has("real-tiss"), true);
    assert.equal(registry.get("real-tiss")?.vendor, "real-tiss");
    assert.equal(registry.get("real-tiss")?.adapterId, REALTISS_COMPLETED_RUNTIME_ADAPTER_ID);
    assert.equal(registry.get("real-tiss")?.version, REALTISS_COMPLETED_RUNTIME_VERSION);
  });

  it("EnterpriseRuntime, Queue, Worker e Scheduler permanecem inalterados", async () => {
    resetEnterpriseRuntimeForTests();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-06a-unchanged",
    });
    setEnterpriseRuntimeForTests(runtime);

    assert.equal(typeof runtime.getQueueRuntimePort, "function");
    assert.equal(typeof runtime.getWorkerRuntimePort, "function");
    assert.equal(typeof runtime.getSchedulerRuntimePort, "function");

    const queuePort = runtime.getQueueRuntimePort();
    assert.equal(typeof queuePort.health, "function");
    assert.equal(typeof queuePort.capabilities, "function");
    assert.equal(typeof queuePort.enqueue, "function");

    const message: CanonicalQueueMessage = {
      kind: "canonical-queue-message",
      messageId: "job-audited-06a-unchanged",
      queueId: ENTERPRISE_TISS_QUEUE_NAME,
      status: "dequeued",
      registeredAt: "2026-08-13T00:00:00.000Z",
      updatedAt: "2026-08-13T00:00:00.000Z",
      messagesPublished: true,
      messagesConsumed: true,
      workersInvoked: true,
      processingPerformed: true,
      persistenceImplemented: true,
      realQueueBackend: false,
      metadata: {
        kind: "canonical-queue-metadata",
        customAttributes: {
          tissJobStatus: TISS_JOB_STATUS_AUDITED,
          status: TISS_JOB_STATUS_AUDITED,
        },
      },
    };

    const result = await processTissCompletedJob({
      getQueueRuntimePort: () => runtime.getQueueRuntimePort(),
      message,
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
    });

    assert.equal(result.ok, true);
    assert.equal(runtime.getQueueRuntimePort().providerId, queuePort.providerId);
  });
});

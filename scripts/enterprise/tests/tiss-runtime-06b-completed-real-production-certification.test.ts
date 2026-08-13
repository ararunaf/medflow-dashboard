#!/usr/bin/env node
/**
 * A10-03 — Completed Real Production Certification.
 *
 * Certifica o provider real-tiss do CompletedRuntimePort para produção, sem alterar
 * nenhum componente arquitetural existente (EnterpriseRuntime, Queue, Worker,
 * Scheduler, Retry, Dead Letter, Observability, Pipeline, Composition Root, etc.).
 */
process.env.MEDICFLOW_QUEUE_RUNTIME_BACKEND = "memory";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";

import {
  ENTERPRISE_TISS_QUEUE_NAME,
  TISS_JOB_STATUS_AUDITED,
  TISS_JOB_STATUS_COMPLETED,
  processTissCompletedJob,
  resetQueueRuntimeIdSequences,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
import { createOCRProviderPort } from "../../../src/lib/enterprise/ocr-provider/index.ts";
import {
  REALTISS_COMPLETED_RUNTIME_ADAPTER_ID,
  REALTISS_COMPLETED_RUNTIME_VERSION,
  createCompletedRuntimeFactory,
  createCompletedRuntimePort,
  createDefaultCompletedRuntimeRegistry,
} from "../../../src/lib/enterprise/completed-runtime/index.ts";
import {
  createEnterpriseRuntime,
  getEnterpriseRuntime,
  resetEnterpriseRuntimeForTests,
  setEnterpriseRuntimeForTests,
} from "../../../src/lib/enterprise/runtime/index.ts";

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  const weight = idx - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function benchmarkStats(latencies: number[]) {
  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = latencies.reduce((a, b) => a + b, 0);
  const avg = sum / latencies.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const p95 = percentile(sorted, 95);
  const p99 = percentile(sorted, 99);
  const throughput = latencies.length / (sum / 1000);
  return { avg, min, max, p95, p99, throughput, count: latencies.length };
}

describe("A10-03 Completed Real Production Certification", () => {
  it("RealTissCompletedRuntimeAdapter passa health/capabilities/providerInfo canônicos", async () => {
    const port = createCompletedRuntimePort({ provider: "real-tiss" });
    assert.equal(port.providerId, "real-tiss");

    const caps = port.capabilities();
    assert.equal(caps.provider, "real-tiss");
    assert.equal(caps.adapterId, REALTISS_COMPLETED_RUNTIME_ADAPTER_ID);
    assert.equal(caps.completedEngineImplemented, false);
    assert.equal(caps.tissCompletedImplemented, false);

    const info = port.providerInfo();
    assert.equal(info.providerId, "real-tiss");
    assert.equal(info.metadata.vendor, "real-tiss");
    assert.equal(info.metadata.version, REALTISS_COMPLETED_RUNTIME_VERSION);
    assert.equal(info.status, "ready");
    assert.equal(info.providerType, "COMPLETED_RUNTIME");

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "real-tiss");
    assert.equal(health.runtimeReady, true);
    assert.equal(health.completedEngineImplemented, false);
  });

  it("Factory e Registry certificam real-tiss sem fallback", () => {
    const factory = createCompletedRuntimeFactory();
    const port = factory.create({ provider: "real-tiss" });
    assert.equal(port.providerId, "real-tiss");

    const registry = createDefaultCompletedRuntimeRegistry();
    assert.equal(registry.has("real-tiss"), true);
    const reg = registry.get("real-tiss");
    assert.ok(reg);
    assert.equal(reg!.status, "ready");
    assert.equal(reg!.adapterId, REALTISS_COMPLETED_RUNTIME_ADAPTER_ID);
    assert.equal(reg!.vendor, "real-tiss");
  });

  it("Transition AUDITED → COMPLETED via getEnterpriseRuntime e QueueRuntimePort", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-06b-prod-cert",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const queue = runtime.getQueueRuntimePort();
    const messageId = "job-tiss-06b-audited";
    const correlationId = "corr-tiss-06b";
    const sessionId = "session-tiss-06b";
    const documentId = "doc-tiss-06b";
    const payloadRef = "storage://doc-tiss-06b";

    const enqueued = await queue.enqueue({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId,
      correlationId,
      payloadRef,
      metadata: {
        kind: "canonical-queue-metadata",
        source: "tiss-runtime-06b",
        tags: ["tiss-job", TISS_JOB_STATUS_AUDITED],
        customAttributes: {
          status: TISS_JOB_STATUS_AUDITED,
          tissJobStatus: TISS_JOB_STATUS_AUDITED,
          audited: true,
          auditExecuted: true,
          completedExecuted: false,
          persisted: true,
          protocolSent: true,
          batchCreated: true,
          xmlGenerated: true,
          enrichmentExecuted: true,
          validationExecuted: true,
          parserExecuted: true,
          ocrExecuted: true,
          sessionId,
          documentId,
        },
      },
    });
    assert.equal(enqueued.ok, true);

    const result = await processTissCompletedJob({
      getQueueRuntimePort: () => queue,
      message: enqueued.queueMessage!,
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
    });

    assert.equal(result.ok, true);
    assert.equal(result.settle, "ack");
    assert.equal(result.completed, true);
    assert.equal(result.reenqueued, false);
    assert.equal(result.audited, true);
    assert.equal(result.job?.status, TISS_JOB_STATUS_COMPLETED);
    assert.equal(result.job?.correlationId, correlationId);
    assert.equal(result.job?.previousJobId, messageId);
    assert.equal(result.job?.terminal, true);
  });

  it("processTissCompletedJob rejeita status diferente de AUDITED", async () => {
    resetQueueRuntimeIdSequences();
    resetEnterpriseRuntimeForTests();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-06b-invalid",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const queue = runtime.getQueueRuntimePort();
    const enqueued = await queue.enqueue({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-invalid",
      metadata: {
        kind: "canonical-queue-metadata",
        source: "unit-test",
        tags: ["tiss-job", TISS_JOB_STATUS_COMPLETED],
        customAttributes: {
          status: TISS_JOB_STATUS_COMPLETED,
          tissJobStatus: TISS_JOB_STATUS_COMPLETED,
          audited: true,
          auditExecuted: true,
          completedExecuted: true,
        },
      },
    });
    assert.equal(enqueued.ok, true);

    const result = await processTissCompletedJob({
      getQueueRuntimePort: () => queue,
      message: enqueued.queueMessage!,
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
    });

    assert.equal(result.ok, false);
    assert.equal(result.completed, false);
    assert.equal(result.settle, "nack");
    assert.equal(result.code, "TISS_COMPLETED_JOB_STATUS_NOT_AUDITED");
  });

  it("Completed Runtime herda Retry do DefaultCompletedRuntimeAdapter", async () => {
    const port = createCompletedRuntimePort({ provider: "real-tiss", failAttempts: 1 });
    const opened = await port.openJob({});
    assert.equal(opened.ok, true);
    assert.equal(opened.job?.status, "job-open");
  });

  it("Completed Runtime herda AbortSignal do DefaultCompletedRuntimeAdapter", async () => {
    const port = createCompletedRuntimePort({ provider: "real-tiss" });
    const controller = new AbortController();
    controller.abort();
    const result = await port.openJob({ signal: controller.signal });
    assert.equal(result.ok, false);
    assert.equal(result.code, "COMPLETED_RUNTIME_CANCELLED");
  });

  it("Performance — openJob/closeJob real-tiss", async () => {
    const port = createCompletedRuntimePort({ provider: "real-tiss" });
    const latencies: number[] = [];
    const ops = 200;

    for (let i = 0; i < ops; i++) {
      const start = performance.now();
      const open = await port.openJob({ jobId: `perf-completed-${i}` });
      const end = performance.now();
      latencies.push(end - start);
      assert.equal(open.ok, true);
      await port.closeJob({ jobId: `perf-completed-${i}` });
    }

    const stats = benchmarkStats(latencies);
    console.log("[A10-03 Performance] openJob/closeJob real-tiss:", stats);
    assert.ok(stats.avg > 0);
    assert.ok(stats.throughput > 0);
  });
});

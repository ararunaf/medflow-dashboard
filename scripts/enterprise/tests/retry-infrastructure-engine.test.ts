#!/usr/bin/env node
/**
 * OPER-INF-R — Enterprise Retry Infrastructure (operacional)
 * Prova: getEnterpriseRuntime()
 *         → QueueRuntimePort.nack (transitório)
 *         → DefaultRetryInfrastructure
 *              → QueueRuntimePort (transporte / requeue)
 *              → SchedulerRuntimePort (tempo / delay / backoff)
 *              → WorkerRuntimePort (shape + acionamento via Scheduler)
 *         → DeadLetterRuntimePort após maxAttempts
 *         + ausência de Port Enterprise novo / Gateway / Runtime paralelo
 *         + Retry nunca executa processamento
 */
process.env.MEDICFLOW_QUEUE_RUNTIME_BACKEND = "memory";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DefaultQueueRuntimeAdapter,
  computeExponentialBackoffDelayMs,
  resetQueueRuntimeIdSequences,
  resetRetryIdSequences,
  resolveRetryPolicy,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
import { DefaultWorkerRuntimeAdapter } from "../../../src/lib/enterprise/worker-runtime/index.ts";
import { DefaultSchedulerRuntimeAdapter } from "../../../src/lib/enterprise/scheduler-runtime/index.ts";
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function cleanupTrio(args: {
  queue: DefaultQueueRuntimeAdapter;
  worker: DefaultWorkerRuntimeAdapter;
  scheduler: DefaultSchedulerRuntimeAdapter;
}): Promise<void> {
  const listed = await args.scheduler.list({});
  for (const schedule of listed.schedules ?? []) {
    await args.scheduler.cancel({ scheduleId: schedule.scheduleId });
  }
  for (const w of args.worker.getStore().listWorkers()) {
    if (w.workerId) {
      await args.worker.release({ workerId: w.workerId });
    }
  }
  void args.queue;
}

function wireOperationalTrio(): {
  queue: DefaultQueueRuntimeAdapter;
  worker: DefaultWorkerRuntimeAdapter;
  scheduler: DefaultSchedulerRuntimeAdapter;
} {
  resetQueueRuntimeIdSequences();
  resetRetryIdSequences();

  let queue!: DefaultQueueRuntimeAdapter;
  let worker!: DefaultWorkerRuntimeAdapter;
  let scheduler!: DefaultSchedulerRuntimeAdapter;

  queue = new DefaultQueueRuntimeAdapter({
    provider: "enterprise",
    operational: true,
    enterpriseDeps: {
      getWorkerRuntimePort: () => worker,
      getSchedulerRuntimePort: () => scheduler,
    },
  });
  worker = new DefaultWorkerRuntimeAdapter({
    provider: "enterprise",
    operational: true,
    pollIntervalMs: 15,
    enterpriseDeps: {
      getQueueRuntimePort: () => queue,
      getSchedulerRuntimePort: () => scheduler,
    },
  });
  scheduler = new DefaultSchedulerRuntimeAdapter({
    provider: "enterprise",
    operational: true,
    pollIntervalMs: 15,
    enterpriseDeps: {
      getQueueRuntimePort: () => queue,
      getWorkerRuntimePort: () => worker,
    },
  });

  return { queue, worker, scheduler };
}

describe("OPER-INF-R Retry policy / backoff / counter", () => {
  it("exponential backoff e policy defaults", () => {
    const policy = resolveRetryPolicy({ maxAttempts: 4, baseDelayMs: 50, maxDelayMs: 10_000 });
    assert.equal(computeExponentialBackoffDelayMs(1, policy), 50);
    assert.equal(computeExponentialBackoffDelayMs(2, policy), 100);
    assert.equal(computeExponentialBackoffDelayMs(3, policy), 200);
    assert.equal(computeExponentialBackoffDelayMs(4, policy), 400);
    assert.equal(computeExponentialBackoffDelayMs(10, policy), 10_000);
  });

  it("Queue operacional com Scheduler+Worker ativa Retry (implementsRetryReal)", async () => {
    const trio = wireOperationalTrio();
    const retry = trio.queue.getRetryInfrastructure();
    assert.ok(retry);
    assert.equal(typeof retry.decideAndSchedule, "function");
    assert.equal(typeof retry.getById, "function");
    assert.equal(typeof retry.stats, "function");
    assert.equal(trio.queue.capabilities().implementsRetryReal, true);
    assert.equal(trio.queue.capabilities().canonical.implementsRetryReal, true);
    assert.equal(trio.queue.capabilities().implementsDeadLetter, true);
    await cleanupTrio(trio);
  });
});

describe("OPER-INF-R Retry scheduling via Ports existentes", () => {
  it("nack transitório agenda retry: counter, delay, status, metadata, schedule", async () => {
    const trio = wireOperationalTrio();
    const { queue, scheduler } = trio;

    const enqueued = await queue.enqueue({
      queueName: "oper-inf-r-main",
      payloadRef: "payload://retry-01",
      correlationId: "corr-r-1",
    });
    assert.equal(enqueued.ok, true);
    const messageId = enqueued.queueMessage!.messageId;

    const nacked = await queue.nack({
      queueName: "oper-inf-r-main",
      messageId,
      attributes: {
        attemptCount: 1,
        maxAttempts: 3,
        baseDelayMs: 40,
        failureReason: "transient-timeout",
      },
    });
    assert.equal(nacked.ok, true);
    assert.equal(nacked.code, "QUEUE_RUNTIME_RETRY_SCHEDULED");
    assert.equal(nacked.queueMessage?.metadata?.customAttributes?.retryStatus, "scheduled");
    assert.equal(nacked.queueMessage?.metadata?.customAttributes?.attemptCount, 1);
    assert.equal(nacked.queueMessage?.metadata?.customAttributes?.delayMs, 40);
    assert.ok(nacked.queueMessage?.metadata?.customAttributes?.retryId);
    assert.ok(nacked.queueMessage?.metadata?.customAttributes?.requeuedMessageId);
    assert.ok(nacked.queueMessage?.metadata?.customAttributes?.scheduleId);

    const retry = queue.getRetryInfrastructure()!;
    const retryId = String(nacked.queueMessage!.metadata!.customAttributes!.retryId);
    const found = await retry.getById({ retryId });
    assert.equal(found.ok, true);
    assert.equal(found.record?.status, "scheduled");
    assert.equal(found.record?.attemptCount, 1);
    assert.equal(found.record?.maxAttempts, 3);
    assert.equal(found.record?.delayMs, 40);
    assert.equal(found.record?.failureReason, "transient-timeout");
    assert.ok(found.record?.nextAttemptAt);
    assert.ok(found.record?.scheduleId);

    const listed = await scheduler.list({ activeOnly: true });
    assert.equal(listed.ok, true);
    assert.ok((listed.schedules?.length ?? 0) >= 1);

    const stats = await retry.stats();
    assert.equal(stats.ok, true);
    assert.ok(stats.scheduledRetries >= 1);
    await cleanupTrio(trio);
  });

  it("exponential backoff na 2ª tentativa (attemptCount=2 → delay 2x)", async () => {
    const trio = wireOperationalTrio();
    const { queue } = trio;
    const enqueued = await queue.enqueue({
      queueName: "oper-inf-r-backoff",
      payloadRef: "payload://retry-02",
    });
    const nacked = await queue.nack({
      messageId: enqueued.queueMessage!.messageId,
      queueName: "oper-inf-r-backoff",
      attributes: {
        attemptCount: 2,
        maxAttempts: 5,
        baseDelayMs: 50,
        failureReason: "transient",
      },
    });
    assert.equal(nacked.ok, true);
    assert.equal(nacked.code, "QUEUE_RUNTIME_RETRY_SCHEDULED");
    assert.equal(nacked.queueMessage?.metadata?.customAttributes?.delayMs, 100);
    await cleanupTrio(trio);
  });

  it("maxAttempts esgotado → Dead Letter (destino definitivo)", async () => {
    const trio = wireOperationalTrio();
    const { queue } = trio;
    const enqueued = await queue.enqueue({
      queueName: "oper-inf-r-exhaust",
      payloadRef: "payload://retry-exhaust",
    });
    const nacked = await queue.nack({
      messageId: enqueued.queueMessage!.messageId,
      queueName: "oper-inf-r-exhaust",
      attributes: {
        attemptCount: 3,
        maxAttempts: 3,
        failureReason: "still-failing",
      },
    });
    assert.equal(nacked.ok, true);
    assert.equal(nacked.code, "QUEUE_RUNTIME_DEAD_LETTERED");
    assert.equal(nacked.queueMessage?.status, "dead-lettered");
    assert.equal(nacked.queueMessage?.metadata?.customAttributes?.retryExhausted, true);

    const dlq = queue.getDeadLetterRuntimePort()!;
    const dlqStats = await dlq.stats();
    assert.ok(dlqStats.totalDeadLetters >= 1);

    const retry = queue.getRetryInfrastructure()!;
    const retryStats = await retry.stats();
    assert.ok(retryStats.exhaustedRetries >= 1);
    await cleanupTrio(trio);
  });

  it("falha permanente explícita bypassa Retry e vai direto à Dead Letter", async () => {
    const trio = wireOperationalTrio();
    const { queue } = trio;
    const enqueued = await queue.enqueue({
      queueName: "oper-inf-r-perm",
      payloadRef: "payload://perm",
    });
    const nacked = await queue.nack({
      messageId: enqueued.queueMessage!.messageId,
      attributes: {
        permanentFailure: true,
        failureReason: "validation-failed",
        attemptCount: 1,
      },
    });
    assert.equal(nacked.ok, true);
    assert.equal(nacked.code, "QUEUE_RUNTIME_DEAD_LETTERED");
    assert.equal(nacked.queueMessage?.metadata?.customAttributes?.retryExhausted, false);
    await cleanupTrio(trio);
  });

  it("Scheduler dispara Worker após delay (Retry não executa processamento)", async () => {
    const trio = wireOperationalTrio();
    const { queue, worker } = trio;
    const enqueued = await queue.enqueue({
      queueName: "oper-inf-r-dispatch",
      payloadRef: "payload://dispatch",
    });
    const nacked = await queue.nack({
      messageId: enqueued.queueMessage!.messageId,
      queueName: "oper-inf-r-dispatch",
      attributes: {
        attemptCount: 1,
        maxAttempts: 3,
        baseDelayMs: 30,
        failureReason: "transient",
      },
    });
    assert.equal(nacked.code, "QUEUE_RUNTIME_RETRY_SCHEDULED");

    // Aguarda o Scheduler (tempo) acionar o Worker (executor).
    await sleep(120);

    const workerStats = await worker.stats();
    assert.ok((workerStats.statistics?.allocatedWorkers ?? 0) >= 1);
    await cleanupTrio(trio);
  });
});

describe("OPER-INF-R Enterprise Runtime + preservação arquitetural", () => {
  it("Enterprise Runtime ativa Retry sem getRetryRuntimePort / sem Gateway", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test-oper-inf-r" });
    const queue = runtime.getQueueRuntimePort() as DefaultQueueRuntimeAdapter;
    const worker = runtime.getWorkerRuntimePort() as DefaultWorkerRuntimeAdapter;
    const scheduler = runtime.getSchedulerRuntimePort() as DefaultSchedulerRuntimeAdapter;

    assert.equal(typeof runtime.getQueueRuntimePort, "function");
    assert.equal(typeof runtime.getWorkerRuntimePort, "function");
    assert.equal(typeof runtime.getSchedulerRuntimePort, "function");
    assert.equal(
      typeof (runtime as unknown as { getRetryRuntimePort?: unknown }).getRetryRuntimePort,
      "undefined",
    );
    assert.equal(
      typeof (runtime as unknown as { getRetryInfrastructure?: unknown }).getRetryInfrastructure,
      "undefined",
    );

    assert.equal(queue.capabilities().implementsRetryReal, true);
    assert.ok(queue.getRetryInfrastructure());

    const enqueued = await queue.enqueue({ queueName: "oper-inf-r-enterprise" });
    const nacked = await queue.nack({
      messageId: enqueued.queueMessage!.messageId,
      queueName: "oper-inf-r-enterprise",
      attributes: { attemptCount: 1, maxAttempts: 3, baseDelayMs: 20 },
    });
    assert.equal(nacked.ok, true);
    assert.equal(nacked.code, "QUEUE_RUNTIME_RETRY_SCHEDULED");

    const health = await runtime.health();
    assert.equal(health.ok, true);
    await cleanupTrio({ queue, worker, scheduler });
  });

  it("Retry usa apenas Scheduler/Worker/Queue Ports; sem DB; sem Port/Gateway novo", () => {
    const operationalDir = join(repoRoot, "src/lib/enterprise/queue-runtime/operational");
    const retryInfra = readFileSync(join(operationalDir, "default-retry-infrastructure.ts"), "utf8");
    assert.match(retryInfra, /SchedulerRuntimePort/);
    assert.match(retryInfra, /WorkerRuntimePort/);
    assert.match(retryInfra, /QueueRuntimePort/);
    assert.match(retryInfra, /getSchedulerRuntimePort/);
    assert.match(retryInfra, /getWorkerRuntimePort/);
    assert.match(retryInfra, /getQueueRuntimePort/);
    assert.match(retryInfra, /NÃO é Port Enterprise/);
    assert.match(retryInfra, /Nunca executa processamento|nunca executa/i);
    assert.equal(/from ["']@supabase\/supabase-js["']/.test(retryInfra), false);
    assert.equal(/allocate\s*\(/.test(retryInfra), false, "Retry must not allocate Worker");
    assert.equal(/dequeue\s*\(/.test(retryInfra), false, "Retry must not dequeue/process");

    const queueAdapter = readFileSync(
      join(repoRoot, "src/lib/enterprise/queue-runtime/adapters/default-queue-runtime-adapter.ts"),
      "utf8",
    );
    assert.match(queueAdapter, /DefaultRetryInfrastructure/);
    assert.match(queueAdapter, /OPER-INF-R/);
    assert.match(queueAdapter, /getRetryInfrastructure/);
    assert.match(queueAdapter, /QUEUE_RUNTIME_RETRY_SCHEDULED/);

    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    const enterpriseTypes = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/types.ts"),
      "utf8",
    );
    assert.equal(/getRetryRuntimePort/.test(enterpriseTypes), false);
    assert.equal(/createRetryRuntimePort/.test(enterpriseRuntime), false);
    assert.equal(/RetryGateway/.test(enterpriseRuntime), false);
    assert.equal(/RetryRuntimePort/.test(enterpriseRuntime), false);

    // Sem arquivo RetryRuntimePort (proibido Port novo).
    const files = collectTsFiles(operationalDir);
    assert.equal(
      files.some((f) => f.endsWith("retry-runtime-port.ts")),
      false,
    );
  });

  it("sem bypass do Enterprise Runtime — createQueueRuntimePort / create* factories inalteradas no composition root", () => {
    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.match(enterpriseRuntime, /createQueueRuntimePort/);
    assert.match(enterpriseRuntime, /createWorkerRuntimePort/);
    assert.match(enterpriseRuntime, /createSchedulerRuntimePort/);
    assert.match(enterpriseRuntime, /getSchedulerRuntimePort:\s*\(\)\s*=>\s*this\.schedulerRuntimePort/);
  });
});

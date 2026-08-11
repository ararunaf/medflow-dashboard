#!/usr/bin/env node
/**
 * OPER-INF-D — Enterprise Dead Letter Runtime (operacional)
 * Prova: getEnterpriseRuntime()
 *         → WorkerRuntimePort → QueueRuntimePort → DeadLetterRuntimePort
 *         + armazenamento definitivo / isolamento / motivo / tentativas /
 *           timestamp / metadata / getById / purge
 *         + ausência de retry / reprocessamento / Port Enterprise novo / Gateway
 */
process.env.MEDICFLOW_QUEUE_RUNTIME_BACKEND = "memory";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DefaultDeadLetterRuntime,
  DefaultQueueRuntimeAdapter,
  ENTERPRISE_DEAD_LETTER_QUEUE_NAME,
  InMemoryDeadLetterStore,
  createQueueRuntimePort,
  resetDeadLetterIdSequences,
  resetQueueRuntimeIdSequences,
  type DeadLetterRuntimePort,
  type QueueRuntimePort,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
import {
  DefaultWorkerRuntimeAdapter,
  createWorkerRuntimePort,
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("OPER-INF-D DeadLetterRuntimePort contract", () => {
  it("Queue operacional expõe DeadLetterRuntimePort interno (não Enterprise Port)", () => {
    resetQueueRuntimeIdSequences();
    resetDeadLetterIdSequences();
    const queue = createQueueRuntimePort({ provider: "enterprise" }) as DefaultQueueRuntimeAdapter;
    const dlq = queue.getDeadLetterRuntimePort();
    assert.ok(dlq);
    assert.equal(typeof dlq.park, "function");
    assert.equal(typeof dlq.getById, "function");
    assert.equal(typeof dlq.purge, "function");
    assert.equal(typeof dlq.stats, "function");
    assert.equal(queue.capabilities().implementsDeadLetter, true);
    assert.equal(queue.capabilities().canonical.implementsDeadLetter, true);
    assert.equal(queue.capabilities().implementsRetryReal, false);
  });

  it("park armazena motivo, tentativas, timestamp e metadata; getById consulta", async () => {
    resetQueueRuntimeIdSequences();
    resetDeadLetterIdSequences();
    const queue = createQueueRuntimePort({ provider: "enterprise" }) as DefaultQueueRuntimeAdapter;
    const dlq = queue.getDeadLetterRuntimePort()!;

    const parked = await dlq.park({
      sourceMessageId: "src-msg-1",
      sourceQueueName: "main-queue",
      failureReason: "validation-failed",
      attemptCount: 3,
      payloadRef: "payload://dead-01",
      correlationId: "corr-dlq-1",
      metadata: { operatorHint: "none", code: 422 },
    });
    assert.equal(parked.ok, true);
    assert.ok(parked.record);
    assert.equal(parked.record!.failureReason, "validation-failed");
    assert.equal(parked.record!.attemptCount, 3);
    assert.ok(parked.record!.parkedAt);
    assert.equal(parked.record!.metadata.operatorHint, "none");
    assert.equal(parked.record!.metadata.code, 422);

    const found = await dlq.getById({ deadLetterId: parked.record!.deadLetterId });
    assert.equal(found.ok, true);
    assert.equal(found.record?.sourceMessageId, "src-msg-1");
    assert.equal(found.record?.failureReason, "validation-failed");

    const missing = await dlq.getById({ deadLetterId: "does-not-exist" });
    assert.equal(missing.ok, false);
    assert.equal(missing.code, "DEAD_LETTER_RUNTIME_NOT_FOUND");
  });

  it("isolamento: mensagem sai da fila principal e entra na DLQ via QueueRuntimePort", async () => {
    resetQueueRuntimeIdSequences();
    resetDeadLetterIdSequences();
    const queue = createQueueRuntimePort({ provider: "enterprise" }) as DefaultQueueRuntimeAdapter;

    const enqueued = await queue.enqueue({
      queueName: "oper-inf-d-main",
      payloadRef: "payload://main-dead",
    });
    assert.equal(enqueued.ok, true);
    const messageId = enqueued.queueMessage!.messageId;

    const dead = await queue.nack({
      queueName: "oper-inf-d-main",
      messageId,
      attributes: {
        permanentFailure: true,
        failureReason: "poison-message",
        attemptCount: 5,
      },
    });
    assert.equal(dead.ok, true);
    assert.equal(dead.code, "QUEUE_RUNTIME_DEAD_LETTERED");
    assert.equal(dead.queueMessage?.status, "dead-lettered");

    // Isolamento da fila principal — não reaparece no dequeue.
    const empty = await queue.dequeue({ queueName: "oper-inf-d-main" });
    assert.equal(empty.ok, false);
    assert.equal(empty.code, "QUEUE_RUNTIME_EMPTY");
    assert.equal(queue.getStore().getMessage(messageId), undefined);

    const dlq = queue.getDeadLetterRuntimePort()!;
    const stats = await dlq.stats();
    assert.equal(stats.totalDeadLetters, 1);

    const records = (dlq as DefaultDeadLetterRuntime).getStore().list();
    assert.equal(records[0]?.failureReason, "poison-message");
    assert.equal(records[0]?.attemptCount, 5);

    // Isolamento via QueueRuntimePort — fila dedicada.
    const dlqPeek = await queue.peek({
      queueName: ENTERPRISE_DEAD_LETTER_QUEUE_NAME,
      messageId: records[0]!.deadLetterId,
    });
    assert.equal(dlqPeek.ok, true);
    assert.equal(dlqPeek.queueMessage?.messageId, records[0]!.deadLetterId);
  });

  it("nack sem falha permanente NÃO envia para Dead Letter (sem retry)", async () => {
    resetQueueRuntimeIdSequences();
    const queue = createQueueRuntimePort({ provider: "enterprise" }) as DefaultQueueRuntimeAdapter;
    const enqueued = await queue.enqueue({ queueName: "oper-inf-d-nack" });
    const nacked = await queue.nack({
      queueName: "oper-inf-d-nack",
      messageId: enqueued.queueMessage!.messageId,
    });
    assert.equal(nacked.ok, true);
    assert.equal(nacked.queueMessage?.status, "nacked");
    assert.equal(nacked.code, "QUEUE_RUNTIME_OK");
    const stats = await queue.getDeadLetterRuntimePort()!.stats();
    assert.equal(stats.totalDeadLetters, 0);
  });

  it("purge remove registros (por id e total)", async () => {
    resetQueueRuntimeIdSequences();
    resetDeadLetterIdSequences();
    const queue = createQueueRuntimePort({ provider: "enterprise" }) as DefaultQueueRuntimeAdapter;
    const dlq = queue.getDeadLetterRuntimePort()!;

    const a = await dlq.park({
      sourceMessageId: "a",
      failureReason: "r1",
      attemptCount: 1,
    });
    const b = await dlq.park({
      sourceMessageId: "b",
      failureReason: "r2",
      attemptCount: 2,
    });
    assert.equal(a.ok, true);
    assert.equal(b.ok, true);

    const one = await dlq.purge({ deadLetterId: a.record!.deadLetterId });
    assert.equal(one.ok, true);
    assert.equal(one.purgedCount, 1);
    assert.equal((await dlq.getById({ deadLetterId: a.record!.deadLetterId })).ok, false);

    const all = await dlq.purge();
    assert.equal(all.ok, true);
    assert.ok(all.purgedCount >= 1);
    assert.equal((await dlq.stats()).totalDeadLetters, 0);
  });
});

describe("OPER-INF-D cadeia Worker → Queue → DeadLetter", () => {
  it("Worker continua usando exclusivamente QueueRuntimePort", async () => {
    resetQueueRuntimeIdSequences();
    const queue = createQueueRuntimePort({ provider: "enterprise" }) as DefaultQueueRuntimeAdapter;
    const worker = new DefaultWorkerRuntimeAdapter({
      provider: "enterprise",
      operational: true,
      pollIntervalMs: 10,
      enterpriseDeps: { getQueueRuntimePort: () => queue },
    });

    await queue.enqueue({ queueName: "oper-inf-d-worker", payloadRef: "payload://w1" });
    const allocated = await worker.allocate({
      workerName: "dlq-worker",
      attributes: { queueName: "oper-inf-d-worker", pollIntervalMs: 10 },
    });
    assert.equal(allocated.ok, true);
    await sleep(80);
    await worker.release({ workerId: allocated.worker!.workerId });

    // Worker não referencia DeadLetterRuntimePort.
    const workerConsumer = readFileSync(
      join(repoRoot, "src/lib/enterprise/worker-runtime/operational/worker-queue-consumer.ts"),
      "utf8",
    );
    assert.match(workerConsumer, /QueueRuntimePort/);
    assert.equal(/DeadLetterRuntimePort/.test(workerConsumer), false);
  });

  it("Enterprise Runtime: Queue → DeadLetter sem getDeadLetterRuntimePort no Runtime", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({ runtimeId: "test" });
    const queue = runtime.getQueueRuntimePort() as DefaultQueueRuntimeAdapter;
    const worker = runtime.getWorkerRuntimePort();

    assert.equal(typeof runtime.getQueueRuntimePort, "function");
    assert.equal(typeof runtime.getWorkerRuntimePort, "function");
    assert.equal(
      typeof (runtime as unknown as { getDeadLetterRuntimePort?: unknown })
        .getDeadLetterRuntimePort,
      "undefined",
    );

    assert.equal(queue.capabilities().implementsDeadLetter, true);
    assert.equal(worker.capabilities().implementsDeadLetter, false);

    const enqueued = await queue.enqueue({ queueName: "oper-inf-d-enterprise" });
    const dead = await queue.nack({
      messageId: enqueued.queueMessage!.messageId,
      attributes: {
        permanentFailure: true,
        failureReason: "enterprise-permanent",
        attemptCount: 2,
      },
    });
    assert.equal(dead.ok, true);
    assert.equal(dead.code, "QUEUE_RUNTIME_DEAD_LETTERED");

    const health = await runtime.health();
    assert.equal(health.ok, true);
    assert.equal(health.queueRuntimeOk, true);
    assert.equal(health.workerRuntimeOk, true);
  });
});

describe("OPER-INF-D preservação arquitetural", () => {
  it("DeadLetter usa QueueRuntimePort; sem DB direto; sem Port/Gateway novo", () => {
    const operationalDir = join(repoRoot, "src/lib/enterprise/queue-runtime/operational");
    const files = collectTsFiles(operationalDir);
    assert.ok(files.length >= 4);

    const deadLetterPort = readFileSync(
      join(operationalDir, "dead-letter-runtime-port.ts"),
      "utf8",
    );
    assert.match(deadLetterPort, /DeadLetterRuntimePort/);
    assert.match(deadLetterPort, /NÃO é Port Enterprise novo/);

    const deadLetterRuntime = readFileSync(
      join(operationalDir, "default-dead-letter-runtime.ts"),
      "utf8",
    );
    assert.match(deadLetterRuntime, /QueueRuntimePort/);
    assert.match(deadLetterRuntime, /getQueueRuntimePort/);
    assert.match(deadLetterRuntime, /enqueue/);
    assert.match(deadLetterRuntime, /purge/);
    assert.equal(/from ["']@supabase\/supabase-js["']/.test(deadLetterRuntime), false);
    // Sem implementação de retry/reprocess — apenas menções de proibição em comentários.
    assert.equal(/\basync\s+retry\s*\(|\.retry\s*\(|reprocess\s*\(/.test(deadLetterRuntime), false);

    const queueAdapter = readFileSync(
      join(repoRoot, "src/lib/enterprise/queue-runtime/adapters/default-queue-runtime-adapter.ts"),
      "utf8",
    );
    assert.match(queueAdapter, /DeadLetterRuntimePort/);
    assert.match(queueAdapter, /getDeadLetterRuntimePort/);
    assert.match(queueAdapter, /OPER-INF-D/);
    assert.match(queueAdapter, /permanentFailure/);

    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.equal(/getDeadLetterRuntimePort/.test(enterpriseRuntime), false);
    assert.equal(/createDeadLetterRuntimePort/.test(enterpriseRuntime), false);

    const runtimeTypes = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/types.ts"),
      "utf8",
    );
    assert.equal(/DeadLetterRuntimePort/.test(runtimeTypes), false);

    // Sem Gateway novo sob queue-runtime/operational
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      assert.equal(/Gateway/.test(src) && /export.*Gateway/.test(src), false, file);
      assert.equal(/from ["']@supabase\/supabase-js["']/.test(src), false, file);
    }
  });

  it("createWorkerRuntimePort permanece sem DeadLetter direto", () => {
    const worker = createWorkerRuntimePort({ provider: "enterprise" });
    assert.equal(worker.capabilities().implementsDeadLetter, false);
    const port: QueueRuntimePort = createQueueRuntimePort({ provider: "enterprise" });
    assert.equal(port.capabilities().implementsDeadLetter, true);
    const dlq: DeadLetterRuntimePort | null = (
      port as DefaultQueueRuntimeAdapter
    ).getDeadLetterRuntimePort();
    assert.ok(dlq);
    assert.ok(dlq instanceof DefaultDeadLetterRuntime);
    assert.ok(new InMemoryDeadLetterStore());
  });
});

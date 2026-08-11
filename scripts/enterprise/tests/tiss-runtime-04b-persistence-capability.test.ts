#!/usr/bin/env node
/**
 * TISS-RUNTIME-04B — Capability Persistence operacional.
 *
 * Prova:
 *   Job PROTOCOL_SENT
 *     → getEnterpriseRuntime()
 *     → WorkerRuntimePort (QueueRuntimePort.dequeue)
 *     → PersistentQueueRuntimePort (persist)
 *     → Job PERSISTED reenfileirado
 *     → Audit / Completed NÃO executados
 *
 * Sem Audit / Completed.
 * Sem novo Port / Gateway / Runtime / Pipeline.
 */
process.env.MEDICFLOW_QUEUE_RUNTIME_BACKEND = "memory";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ENTERPRISE_TISS_QUEUE_NAME,
  TISS_JOB_STATUS_BATCH_CREATED,
  TISS_JOB_STATUS_ENRICHED,
  TISS_JOB_STATUS_OCR_COMPLETED,
  TISS_JOB_STATUS_PARSED,
  TISS_JOB_STATUS_PERSISTED,
  TISS_JOB_STATUS_PROTOCOL_SENT,
  TISS_JOB_STATUS_VALIDATED,
  TISS_JOB_STATUS_XML_GENERATED,
  processTissPersistenceJob,
  resetQueueRuntimeIdSequences,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
import { createOCRProviderPort } from "../../../src/lib/enterprise/ocr-provider/index.ts";
import {
  createEnterpriseRuntime,
  getEnterpriseRuntime,
  processTissBatchCreatedProtocolSent,
  processTissEnrichedXmlGenerated,
  processTissOcrParsed,
  processTissParsedValidated,
  processTissProtocolSentPersisted,
  processTissReceivedOcr,
  processTissValidatedEnriched,
  processTissXmlGeneratedBatchCreated,
  registerTissReceivedJob,
  resetEnterpriseRuntimeForTests,
  setEnterpriseRuntimeForTests,
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

describe("TISS-RUNTIME-04B Job PROTOCOL_SENT → Worker → Persistence → PERSISTED", () => {
  it("processTissProtocolSentPersisted via getEnterpriseRuntime evolui PROTOCOL_SENT para PERSISTED", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-04b",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const registered = await registerTissReceivedJob({
      source: "document-intake",
      correlationId: "corr-tiss-04b",
      sessionId: "session-tiss-04b",
      documentId: "doc-tiss-04b",
      payloadRef: "storage://clinical-documents/doc-tiss-04b",
      jobId: "job-tiss-04b",
      channel: "capture-upload",
    });
    assert.equal(registered.ok, true);
    assert.equal(registered.job?.status, "RECEIVED");

    const ocrResult = await processTissReceivedOcr({
      preferredProviderReference: "mock",
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(ocrResult.ok, true);
    assert.equal(ocrResult.job?.status, TISS_JOB_STATUS_OCR_COMPLETED);

    const parserResult = await processTissOcrParsed({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(parserResult.ok, true);
    assert.equal(parserResult.job?.status, TISS_JOB_STATUS_PARSED);

    const validationResult = await processTissParsedValidated({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(validationResult.ok, true);
    assert.equal(validationResult.job?.status, TISS_JOB_STATUS_VALIDATED);

    const enrichmentResult = await processTissValidatedEnriched({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(enrichmentResult.ok, true);
    assert.equal(enrichmentResult.job?.status, TISS_JOB_STATUS_ENRICHED);

    const xmlResult = await processTissEnrichedXmlGenerated({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(xmlResult.ok, true);
    assert.equal(xmlResult.job?.status, TISS_JOB_STATUS_XML_GENERATED);

    const batchResult = await processTissXmlGeneratedBatchCreated({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(batchResult.ok, true);
    assert.equal(batchResult.job?.status, TISS_JOB_STATUS_BATCH_CREATED);

    const protocolResult = await processTissBatchCreatedProtocolSent({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(protocolResult.ok, true);
    assert.equal(protocolResult.job?.status, TISS_JOB_STATUS_PROTOCOL_SENT);

    const persistenceResult = await processTissProtocolSentPersisted({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(persistenceResult.ok, true);
    assert.equal(persistenceResult.entry, "getEnterpriseRuntime");
    assert.equal(persistenceResult.runtimeId, "test-tiss-04b");
    assert.equal(persistenceResult.persisted, true);
    assert.equal(persistenceResult.auditExecuted, false);
    assert.equal(persistenceResult.completedExecuted, false);
    assert.equal(persistenceResult.protocolSent, true);
    assert.equal(persistenceResult.batchCreated, true);
    assert.equal(persistenceResult.xmlGenerated, true);
    assert.equal(persistenceResult.enrichmentExecuted, true);
    assert.equal(persistenceResult.validationExecuted, true);
    assert.equal(persistenceResult.parserExecuted, true);
    assert.equal(persistenceResult.ocrExecuted, true);
    assert.ok(persistenceResult.job);
    assert.equal(persistenceResult.job!.status, TISS_JOB_STATUS_PERSISTED);
    assert.equal(
      persistenceResult.job!.previousJobId,
      "job-tiss-04b:ocr-completed:parsed:validated:enriched:xml-generated:batch-created:protocol-sent",
    );
    assert.equal(persistenceResult.job!.queueName, ENTERPRISE_TISS_QUEUE_NAME);
    assert.equal(persistenceResult.job!.correlationId, "corr-tiss-04b");

    const peeked = await runtime.getQueueRuntimePort().peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId:
        "job-tiss-04b:ocr-completed:parsed:validated:enriched:xml-generated:batch-created:protocol-sent:persisted",
    });
    assert.equal(peeked.ok, true);
    assert.equal(
      peeked.queueMessage?.messageId,
      "job-tiss-04b:ocr-completed:parsed:validated:enriched:xml-generated:batch-created:protocol-sent:persisted",
    );
    assert.equal(peeked.queueMessage?.status, "enqueued");
    assert.equal(
      peeked.queueMessage?.metadata?.customAttributes?.tissJobStatus,
      TISS_JOB_STATUS_PERSISTED,
    );
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.persisted, true);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.persistenceExecuted, true);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.auditExecuted, false);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.completedExecuted, false);

    // PROTOCOL_SENT foi ACK'd — não permanece como enqueued.
    const protocolGone = await runtime.getQueueRuntimePort().peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId:
        "job-tiss-04b:ocr-completed:parsed:validated:enriched:xml-generated:batch-created:protocol-sent",
    });
    assert.notEqual(protocolGone.queueMessage?.status, "enqueued");
  });

  it("reutiliza exclusivamente Ports INF + PersistentQueueRuntimePort (sem Audit)", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-04b-infra",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    await registerTissReceivedJob({
      source: "capture-upload",
      correlationId: "corr-infra-04b",
      jobId: "job-infra-04b",
    });
    await processTissReceivedOcr({
      preferredProviderReference: "mock",
      waitTimeoutMs: 8_000,
    });
    await processTissOcrParsed({
      waitTimeoutMs: 8_000,
    });
    await processTissParsedValidated({
      waitTimeoutMs: 8_000,
    });
    await processTissValidatedEnriched({
      waitTimeoutMs: 8_000,
    });
    await processTissEnrichedXmlGenerated({
      waitTimeoutMs: 8_000,
    });
    await processTissXmlGeneratedBatchCreated({
      waitTimeoutMs: 8_000,
    });
    await processTissBatchCreatedProtocolSent({
      waitTimeoutMs: 8_000,
    });

    const result = await processTissProtocolSentPersisted({
      waitTimeoutMs: 8_000,
    });

    assert.equal(result.ok, true);
    assert.equal(result.infrastructure.queueRuntimePort, true);
    assert.equal(result.infrastructure.workerRuntimePort, true);
    assert.equal(result.infrastructure.schedulerRuntimePort, true);
    assert.equal(result.infrastructure.observabilityRuntimePort, true);
    assert.equal(result.infrastructure.persistentQueueRuntimePort, true);
    assert.equal(result.infrastructure.retryInfrastructure, true);
    assert.equal(result.infrastructure.deadLetterRuntime, true);
    assert.equal(result.auditExecuted, false);
    assert.equal(result.completedExecuted, false);
    assert.equal(result.persisted, true);

    assert.equal(typeof runtime.getPersistentQueueRuntimePort, "function");
    assert.equal(typeof runtime.getQueueRuntimePort, "function");
  });

  it("processTissPersistenceJob ignora status != PROTOCOL_SENT e marca auditExecuted=false", async () => {
    resetQueueRuntimeIdSequences();
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-04b-skip",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const queue = runtime.getQueueRuntimePort();
    const enqueued = await queue.enqueue({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-already-persisted",
      metadata: {
        kind: "canonical-queue-metadata",
        source: "unit-test",
        tags: ["tiss-job", TISS_JOB_STATUS_PERSISTED],
        customAttributes: {
          status: TISS_JOB_STATUS_PERSISTED,
          tissJobStatus: TISS_JOB_STATUS_PERSISTED,
          protocolSent: true,
          persisted: true,
          persistenceExecuted: true,
          auditExecuted: false,
          completedExecuted: false,
        },
      },
    });
    assert.equal(enqueued.ok, true);

    const result = await processTissPersistenceJob({
      getQueueRuntimePort: () => queue,
      getPersistentQueueRuntimePort: () => runtime.getPersistentQueueRuntimePort(),
      message: enqueued.queueMessage!,
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
    });

    assert.equal(result.ok, false);
    assert.equal(result.settle, "nack");
    assert.equal(result.persisted, false);
    assert.equal(result.auditExecuted, false);
    assert.equal(result.completedExecuted, false);
    assert.equal(result.code, "TISS_PERSISTENCE_JOB_STATUS_NOT_PROTOCOL_SENT");
  });
});

describe("TISS-RUNTIME-04B preservação arquitetural", () => {
  it("sem Port / Gateway / Runtime / Pipeline novo; Audit/Completed ausente no caminho Persistence", () => {
    const processSrc = readFileSync(
      join(
        repoRoot,
        "src/lib/enterprise/queue-runtime/operational/process-tiss-persistence-job.ts",
      ),
      "utf8",
    );
    assert.match(processSrc, /TISS-RUNTIME-04B/);
    assert.match(processSrc, /PersistentQueueRuntimePort/);
    assert.match(processSrc, /PERSISTED/);
    assert.match(processSrc, /NÃO cria Port/);
    assert.equal(/AuditRuntimePort/.test(processSrc), false);
    assert.equal(/CompletedRuntimePort/.test(processSrc), false);
    assert.equal(/from ["']@supabase\/supabase-js["']/.test(processSrc), false);

    const entrySrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/process-tiss-protocol-sent-persisted.ts"),
      "utf8",
    );
    assert.match(entrySrc, /getEnterpriseRuntime/);
    assert.match(entrySrc, /getWorkerRuntimePort/);
    assert.match(entrySrc, /getQueueRuntimePort/);
    assert.match(entrySrc, /getPersistentQueueRuntimePort/);
    assert.match(entrySrc, /getSchedulerRuntimePort/);
    assert.match(entrySrc, /getObservabilityRuntimePort/);
    assert.equal(/AuditRuntimePort/.test(entrySrc), false);
    assert.equal(/CompletedRuntimePort/.test(entrySrc), false);

    const enterpriseTypes = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/types.ts"),
      "utf8",
    );
    assert.equal(
      /TissPersistenceRuntimePort|getTissPersistenceRuntimePort|TissPersistenceGateway/.test(
        enterpriseTypes,
      ),
      false,
    );

    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.equal(
      /TissPersistenceRuntimePort|createTissPersistenceRuntimePort|TissPersistencePipeline/.test(
        enterpriseRuntime,
      ),
      false,
    );

    // Sem arquivo *Port novo para Job TISS.
    const operationalDir = join(repoRoot, "src/lib/enterprise/queue-runtime/operational");
    const files = collectTsFiles(operationalDir);
    assert.equal(
      files.some(
        (f) => /tiss-.*-port\.ts$/i.test(f) || /tiss-persistence-runtime-port\.ts$/i.test(f),
      ),
      false,
    );
  });

  it("composition root permanece getEnterpriseRuntime (sem bypass)", () => {
    const entrySrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/process-tiss-protocol-sent-persisted.ts"),
      "utf8",
    );
    assert.match(entrySrc, /const runtime = getEnterpriseRuntime\(\)/);
    assert.equal(/new DefaultQueueRuntimeAdapter/.test(entrySrc), false);
    assert.equal(/createPersistentQueueRuntimePort\(/.test(entrySrc), false);
  });
});

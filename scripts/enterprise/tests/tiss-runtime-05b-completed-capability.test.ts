#!/usr/bin/env node
/**
 * TISS-RUNTIME-05B — Capability Completed / encerramento terminal.
 *
 * Prova:
 *   Job AUDITED
 *     → getEnterpriseRuntime()
 *     → WorkerRuntimePort (QueueRuntimePort.dequeue)
 *     → Completed (sem Port novo; apenas infraestrutura homologada)
 *     → Job COMPLETED (estado terminal)
 *     → ACK definitivo (não reenfileira)
 *
 * Sem reenfileiramento.
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
  TISS_JOB_STATUS_AUDITED,
  TISS_JOB_STATUS_BATCH_CREATED,
  TISS_JOB_STATUS_COMPLETED,
  TISS_JOB_STATUS_ENRICHED,
  TISS_JOB_STATUS_OCR_COMPLETED,
  TISS_JOB_STATUS_PARSED,
  TISS_JOB_STATUS_PERSISTED,
  TISS_JOB_STATUS_PROTOCOL_SENT,
  TISS_JOB_STATUS_VALIDATED,
  TISS_JOB_STATUS_XML_GENERATED,
  processTissCompletedJob,
  resetQueueRuntimeIdSequences,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
import { createOCRProviderPort } from "../../../src/lib/enterprise/ocr-provider/index.ts";
import {
  createEnterpriseRuntime,
  getEnterpriseRuntime,
  processTissAuditedCompleted,
  processTissBatchCreatedProtocolSent,
  processTissEnrichedXmlGenerated,
  processTissOcrParsed,
  processTissParsedValidated,
  processTissPersistedAudited,
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

describe("TISS-RUNTIME-05B Job AUDITED → Worker → Completed → COMPLETED", () => {
  it("processTissAuditedCompleted via getEnterpriseRuntime encerra AUDITED em COMPLETED sem reenfileirar", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-05b",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const registered = await registerTissReceivedJob({
      source: "document-intake",
      correlationId: "corr-tiss-05b",
      sessionId: "session-tiss-05b",
      documentId: "doc-tiss-05b",
      payloadRef: "storage://clinical-documents/doc-tiss-05b",
      jobId: "job-tiss-05b",
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
    assert.equal(persistenceResult.job?.status, TISS_JOB_STATUS_PERSISTED);

    const auditResult = await processTissPersistedAudited({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(auditResult.ok, true);
    assert.equal(auditResult.job?.status, TISS_JOB_STATUS_AUDITED);

    const completedResult = await processTissAuditedCompleted({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });
    assert.equal(completedResult.ok, true);
    assert.equal(completedResult.entry, "getEnterpriseRuntime");
    assert.equal(completedResult.runtimeId, "test-tiss-05b");
    assert.equal(completedResult.completed, true);
    assert.equal(completedResult.reenqueued, false);
    assert.equal(completedResult.audited, true);
    assert.equal(completedResult.persisted, true);
    assert.equal(completedResult.protocolSent, true);
    assert.equal(completedResult.batchCreated, true);
    assert.equal(completedResult.xmlGenerated, true);
    assert.equal(completedResult.enrichmentExecuted, true);
    assert.equal(completedResult.validationExecuted, true);
    assert.equal(completedResult.parserExecuted, true);
    assert.equal(completedResult.ocrExecuted, true);
    assert.ok(completedResult.job);
    assert.equal(completedResult.job!.status, TISS_JOB_STATUS_COMPLETED);
    assert.equal(completedResult.job!.terminal, true);
    assert.equal(
      completedResult.job!.previousJobId,
      "job-tiss-05b:ocr-completed:parsed:validated:enriched:xml-generated:batch-created:protocol-sent:persisted:audited",
    );
    assert.equal(completedResult.job!.queueName, ENTERPRISE_TISS_QUEUE_NAME);
    assert.equal(completedResult.job!.correlationId, "corr-tiss-05b");

    // Nenhuma mensagem COMPLETED deve ter sido reenfileirada.
    const completedPeek = await runtime.getQueueRuntimePort().peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId:
        "job-tiss-05b:ocr-completed:parsed:validated:enriched:xml-generated:batch-created:protocol-sent:persisted:audited:completed",
    });
    assert.equal(completedPeek.ok, false);

    // A mensagem AUDITED original não está mais enqueued (foi ACK'd).
    const auditedGone = await runtime.getQueueRuntimePort().peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId:
        "job-tiss-05b:ocr-completed:parsed:validated:enriched:xml-generated:batch-created:protocol-sent:persisted:audited",
    });
    assert.notEqual(auditedGone.queueMessage?.status, "enqueued");
  });

  it("reutiliza exclusivamente a infraestrutura Enterprise homologada (sem CompletedRuntimePort)", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-05b-infra",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    await registerTissReceivedJob({
      source: "capture-upload",
      correlationId: "corr-infra-05b",
      jobId: "job-infra-05b",
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
    await processTissProtocolSentPersisted({
      waitTimeoutMs: 8_000,
    });
    await processTissPersistedAudited({
      waitTimeoutMs: 8_000,
    });

    const result = await processTissAuditedCompleted({
      waitTimeoutMs: 8_000,
    });

    assert.equal(result.ok, true);
    assert.equal(result.infrastructure.queueRuntimePort, true);
    assert.equal(result.infrastructure.workerRuntimePort, true);
    assert.equal(result.infrastructure.schedulerRuntimePort, true);
    assert.equal(result.infrastructure.observabilityRuntimePort, true);
    assert.equal(result.infrastructure.retryInfrastructure, true);
    assert.equal(result.infrastructure.deadLetterRuntime, true);
    assert.equal(result.completed, true);
    assert.equal(result.reenqueued, false);
    assert.equal(result.audited, true);

    assert.equal(typeof runtime.getQueueRuntimePort, "function");
    assert.equal(typeof runtime.getWorkerRuntimePort, "function");
  });

  it("processTissCompletedJob ignora status != AUDITED e reenqueued=false", async () => {
    resetQueueRuntimeIdSequences();
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-05b-skip",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const queue = runtime.getQueueRuntimePort();
    const enqueued = await queue.enqueue({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-already-completed",
      metadata: {
        kind: "canonical-queue-metadata",
        source: "unit-test",
        tags: ["tiss-job", TISS_JOB_STATUS_COMPLETED],
        customAttributes: {
          status: TISS_JOB_STATUS_COMPLETED,
          tissJobStatus: TISS_JOB_STATUS_COMPLETED,
          audited: true,
          completed: true,
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
    assert.equal(result.settle, "nack");
    assert.equal(result.completed, false);
    assert.equal(result.reenqueued, false);
    assert.equal(result.code, "TISS_COMPLETED_JOB_STATUS_NOT_AUDITED");
  });
});

describe("TISS-RUNTIME-05B preservação arquitetural", () => {
  it("sem Port / Gateway / Runtime / Pipeline novo; sem reenfileiramento", () => {
    const processSrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/queue-runtime/operational/process-tiss-completed-job.ts"),
      "utf8",
    );
    assert.match(processSrc, /TISS-RUNTIME-05B/);
    assert.match(processSrc, /estado terminal/);
    assert.match(processSrc, /NÃO reenfileira/);
    assert.match(processSrc, /CompletedRuntimePort/); // menciona inexistência no comentário
    assert.equal(/CompletedRuntimePort/.test(processSrc), true); // comentário documenta ausência
    assert.equal(/queuePort\.enqueue/.test(processSrc), false);
    assert.equal(/from ["']@supabase\/supabase-js["']/.test(processSrc), false);

    const entrySrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/process-tiss-audited-completed.ts"),
      "utf8",
    );
    assert.match(entrySrc, /getEnterpriseRuntime/);
    assert.match(entrySrc, /getWorkerRuntimePort/);
    assert.match(entrySrc, /getQueueRuntimePort/);
    assert.match(entrySrc, /getSchedulerRuntimePort/);
    assert.match(entrySrc, /getObservabilityRuntimePort/);
    assert.equal(/queuePort\.enqueue/.test(entrySrc), false);
    assert.equal(/getCompletedRuntimePort/.test(entrySrc), false);

    const enterpriseTypes = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/types.ts"),
      "utf8",
    );
    assert.equal(
      /TissCompletedRuntimePort|getTissCompletedRuntimePort|TissCompletedGateway/.test(
        enterpriseTypes,
      ),
      false,
    );

    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.equal(
      /TissCompletedRuntimePort|createTissCompletedRuntimePort|TissCompletedPipeline/.test(
        enterpriseRuntime,
      ),
      false,
    );

    // Sem arquivo *Port novo para Job TISS.
    const operationalDir = join(repoRoot, "src/lib/enterprise/queue-runtime/operational");
    const files = collectTsFiles(operationalDir);
    assert.equal(
      files.some(
        (f) => /tiss-.*-port\.ts$/i.test(f) || /tiss-completed-runtime-port\.ts$/i.test(f),
      ),
      false,
    );
  });

  it("composition root permanece getEnterpriseRuntime (sem bypass)", () => {
    const entrySrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/process-tiss-audited-completed.ts"),
      "utf8",
    );
    assert.match(entrySrc, /const runtime = getEnterpriseRuntime\(\)/);
    assert.equal(/new DefaultQueueRuntimeAdapter/.test(entrySrc), false);
    assert.equal(/createCompletedRuntimePort\(/.test(entrySrc), false);
  });
});

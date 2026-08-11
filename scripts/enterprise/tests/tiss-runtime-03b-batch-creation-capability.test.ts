#!/usr/bin/env node
/**
 * TISS-RUNTIME-03B — Capability Batch Generation operacional.
 *
 * Prova:
 *   Job XML_GENERATED
 *     → getEnterpriseRuntime()
 *     → WorkerRuntimePort (QueueRuntimePort.dequeue)
 *     → BatchRuntimePort (prepareBatch / getBatch)
 *     → Job BATCH_CREATED reenfileirado
 *     → Protocol / Persistence / Audit NÃO executados
 *
 * Sem Protocol / Persistência / Auditoria.
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
  TISS_JOB_STATUS_VALIDATED,
  TISS_JOB_STATUS_XML_GENERATED,
  processTissBatchJob,
  resetQueueRuntimeIdSequences,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
import { createOCRProviderPort } from "../../../src/lib/enterprise/ocr-provider/index.ts";
import {
  createEnterpriseRuntime,
  getEnterpriseRuntime,
  processTissEnrichedXmlGenerated,
  processTissOcrParsed,
  processTissParsedValidated,
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

describe("TISS-RUNTIME-03B Job XML_GENERATED → Worker → Batch → BATCH_CREATED", () => {
  it("processTissXmlGeneratedBatchCreated via getEnterpriseRuntime evolui XML_GENERATED para BATCH_CREATED", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-03b",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const registered = await registerTissReceivedJob({
      source: "document-intake",
      correlationId: "corr-tiss-03b",
      sessionId: "session-tiss-03b",
      documentId: "doc-tiss-03b",
      payloadRef: "storage://clinical-documents/doc-tiss-03b",
      jobId: "job-tiss-03b",
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
    assert.equal(batchResult.entry, "getEnterpriseRuntime");
    assert.equal(batchResult.runtimeId, "test-tiss-03b");
    assert.equal(batchResult.batchCreated, true);
    assert.equal(batchResult.protocolExecuted, false);
    assert.equal(batchResult.persistenceExecuted, false);
    assert.equal(batchResult.auditExecuted, false);
    assert.equal(batchResult.xmlGenerated, true);
    assert.equal(batchResult.enrichmentExecuted, true);
    assert.equal(batchResult.validationExecuted, true);
    assert.equal(batchResult.parserExecuted, true);
    assert.equal(batchResult.ocrExecuted, true);
    assert.ok(batchResult.job);
    assert.equal(batchResult.job!.status, TISS_JOB_STATUS_BATCH_CREATED);
    assert.equal(
      batchResult.job!.previousJobId,
      "job-tiss-03b:ocr-completed:parsed:validated:enriched:xml-generated",
    );
    assert.equal(batchResult.job!.queueName, ENTERPRISE_TISS_QUEUE_NAME);
    assert.equal(batchResult.job!.correlationId, "corr-tiss-03b");

    const peeked = await runtime.getQueueRuntimePort().peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-tiss-03b:ocr-completed:parsed:validated:enriched:xml-generated:batch-created",
    });
    assert.equal(peeked.ok, true);
    assert.equal(
      peeked.queueMessage?.messageId,
      "job-tiss-03b:ocr-completed:parsed:validated:enriched:xml-generated:batch-created",
    );
    assert.equal(peeked.queueMessage?.status, "enqueued");
    assert.equal(
      peeked.queueMessage?.metadata?.customAttributes?.tissJobStatus,
      TISS_JOB_STATUS_BATCH_CREATED,
    );
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.batchCreated, true);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.protocolExecuted, false);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.persistenceExecuted, false);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.auditExecuted, false);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.xmlGenerated, true);

    // XML_GENERATED foi ACK'd — não permanece como enqueued.
    const xmlGone = await runtime.getQueueRuntimePort().peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-tiss-03b:ocr-completed:parsed:validated:enriched:xml-generated",
    });
    assert.notEqual(xmlGone.queueMessage?.status, "enqueued");
  });

  it("reutiliza exclusivamente Ports INF + BatchRuntimePort (sem Protocol)", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-03b-infra",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    await registerTissReceivedJob({
      source: "capture-upload",
      correlationId: "corr-infra-03b",
      jobId: "job-infra-03b",
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

    const result = await processTissXmlGeneratedBatchCreated({
      waitTimeoutMs: 8_000,
    });

    assert.equal(result.ok, true);
    assert.equal(result.infrastructure.queueRuntimePort, true);
    assert.equal(result.infrastructure.workerRuntimePort, true);
    assert.equal(result.infrastructure.schedulerRuntimePort, true);
    assert.equal(result.infrastructure.observabilityRuntimePort, true);
    assert.equal(result.infrastructure.batchRuntimePort, true);
    assert.equal(result.infrastructure.retryInfrastructure, true);
    assert.equal(result.infrastructure.deadLetterRuntime, true);
    assert.equal(result.protocolExecuted, false);
    assert.equal(result.batchCreated, true);

    assert.equal(typeof runtime.getBatchRuntimePort, "function");
    assert.equal(typeof runtime.getQueueRuntimePort, "function");
  });

  it("processTissBatchJob ignora status != XML_GENERATED e marca protocolExecuted=false", async () => {
    resetQueueRuntimeIdSequences();
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-03b-skip",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const queue = runtime.getQueueRuntimePort();
    const enqueued = await queue.enqueue({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-already-batch",
      metadata: {
        kind: "canonical-queue-metadata",
        source: "unit-test",
        tags: ["tiss-job", TISS_JOB_STATUS_BATCH_CREATED],
        customAttributes: {
          status: TISS_JOB_STATUS_BATCH_CREATED,
          tissJobStatus: TISS_JOB_STATUS_BATCH_CREATED,
          xmlGenerated: true,
          batchCreated: true,
          protocolExecuted: false,
          persistenceExecuted: false,
          auditExecuted: false,
        },
      },
    });
    assert.equal(enqueued.ok, true);

    const result = await processTissBatchJob({
      getQueueRuntimePort: () => queue,
      getBatchRuntimePort: () => runtime.getBatchRuntimePort(),
      message: enqueued.queueMessage!,
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
    });

    assert.equal(result.ok, false);
    assert.equal(result.settle, "nack");
    assert.equal(result.batchCreated, false);
    assert.equal(result.protocolExecuted, false);
    assert.equal(result.persistenceExecuted, false);
    assert.equal(result.auditExecuted, false);
    assert.equal(result.code, "TISS_BATCH_JOB_STATUS_NOT_XML_GENERATED");
  });
});

describe("TISS-RUNTIME-03B preservação arquitetural", () => {
  it("sem Port / Gateway / Runtime / Pipeline novo; Protocol ausente no caminho Batch", () => {
    const processSrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/queue-runtime/operational/process-tiss-batch-job.ts"),
      "utf8",
    );
    assert.match(processSrc, /TISS-RUNTIME-03B/);
    assert.match(processSrc, /BatchRuntimePort/);
    assert.match(processSrc, /BATCH_CREATED/);
    assert.match(processSrc, /NÃO cria Port/);
    assert.equal(/ProtocolRuntimePort/.test(processSrc), false);
    assert.equal(/PersistenceRuntimePort/.test(processSrc), false);
    assert.equal(/AuditRuntimePort/.test(processSrc), false);
    assert.equal(/from ["']@supabase\/supabase-js["']/.test(processSrc), false);

    const entrySrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/process-tiss-xml-generated-batch-created.ts"),
      "utf8",
    );
    assert.match(entrySrc, /getEnterpriseRuntime/);
    assert.match(entrySrc, /getWorkerRuntimePort/);
    assert.match(entrySrc, /getQueueRuntimePort/);
    assert.match(entrySrc, /getBatchRuntimePort/);
    assert.match(entrySrc, /getSchedulerRuntimePort/);
    assert.match(entrySrc, /getObservabilityRuntimePort/);
    assert.equal(/ProtocolRuntimePort/.test(entrySrc), false);
    assert.equal(/PersistenceRuntimePort/.test(entrySrc), false);
    assert.equal(/AuditRuntimePort/.test(entrySrc), false);

    const enterpriseTypes = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/types.ts"),
      "utf8",
    );
    assert.equal(
      /TissBatchRuntimePort|getTissBatchRuntimePort|TissBatchGateway/.test(enterpriseTypes),
      false,
    );

    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.equal(
      /TissBatchRuntimePort|createTissBatchRuntimePort|TissBatchPipeline/.test(enterpriseRuntime),
      false,
    );

    // Sem arquivo *Port novo para Job TISS.
    const operationalDir = join(repoRoot, "src/lib/enterprise/queue-runtime/operational");
    const files = collectTsFiles(operationalDir);
    assert.equal(
      files.some((f) => /tiss-.*-port\.ts$/i.test(f) || /tiss-batch-runtime-port\.ts$/i.test(f)),
      false,
    );
  });

  it("composition root permanece getEnterpriseRuntime (sem bypass)", () => {
    const entrySrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/process-tiss-xml-generated-batch-created.ts"),
      "utf8",
    );
    assert.match(entrySrc, /const runtime = getEnterpriseRuntime\(\)/);
    assert.equal(/new DefaultQueueRuntimeAdapter/.test(entrySrc), false);
    assert.equal(/createBatchRuntimePort\(/.test(entrySrc), false);
  });
});

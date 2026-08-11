#!/usr/bin/env node
/**
 * TISS-RUNTIME-04A — Capability Protocol operacional.
 *
 * Prova:
 *   Job BATCH_CREATED
 *     → getEnterpriseRuntime()
 *     → WorkerRuntimePort (QueueRuntimePort.dequeue)
 *     → ProtocolRuntimePort (prepareProfile / getProfile)
 *     → Job PROTOCOL_SENT reenfileirado
 *     → Persistence / Audit NÃO executados
 *
 * Sem Persistence / Audit.
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
  TISS_JOB_STATUS_PROTOCOL_SENT,
  TISS_JOB_STATUS_VALIDATED,
  TISS_JOB_STATUS_XML_GENERATED,
  processTissProtocolJob,
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

describe("TISS-RUNTIME-04A Job BATCH_CREATED → Worker → Protocol → PROTOCOL_SENT", () => {
  it("processTissBatchCreatedProtocolSent via getEnterpriseRuntime evolui BATCH_CREATED para PROTOCOL_SENT", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-04a",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const registered = await registerTissReceivedJob({
      source: "document-intake",
      correlationId: "corr-tiss-04a",
      sessionId: "session-tiss-04a",
      documentId: "doc-tiss-04a",
      payloadRef: "storage://clinical-documents/doc-tiss-04a",
      jobId: "job-tiss-04a",
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
    assert.equal(protocolResult.entry, "getEnterpriseRuntime");
    assert.equal(protocolResult.runtimeId, "test-tiss-04a");
    assert.equal(protocolResult.protocolSent, true);
    assert.equal(protocolResult.protocolResolved, false);
    assert.equal(protocolResult.persistenceExecuted, false);
    assert.equal(protocolResult.auditExecuted, false);
    assert.equal(protocolResult.batchCreated, true);
    assert.equal(protocolResult.xmlGenerated, true);
    assert.equal(protocolResult.enrichmentExecuted, true);
    assert.equal(protocolResult.validationExecuted, true);
    assert.equal(protocolResult.parserExecuted, true);
    assert.equal(protocolResult.ocrExecuted, true);
    assert.ok(protocolResult.job);
    assert.equal(protocolResult.job!.status, TISS_JOB_STATUS_PROTOCOL_SENT);
    assert.equal(
      protocolResult.job!.previousJobId,
      "job-tiss-04a:ocr-completed:parsed:validated:enriched:xml-generated:batch-created",
    );
    assert.equal(protocolResult.job!.queueName, ENTERPRISE_TISS_QUEUE_NAME);
    assert.equal(protocolResult.job!.correlationId, "corr-tiss-04a");
    assert.ok(protocolResult.job!.profileId);

    const peeked = await runtime.getQueueRuntimePort().peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId:
        "job-tiss-04a:ocr-completed:parsed:validated:enriched:xml-generated:batch-created:protocol-sent",
    });
    assert.equal(peeked.ok, true);
    assert.equal(
      peeked.queueMessage?.messageId,
      "job-tiss-04a:ocr-completed:parsed:validated:enriched:xml-generated:batch-created:protocol-sent",
    );
    assert.equal(peeked.queueMessage?.status, "enqueued");
    assert.equal(
      peeked.queueMessage?.metadata?.customAttributes?.tissJobStatus,
      TISS_JOB_STATUS_PROTOCOL_SENT,
    );
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.protocolSent, true);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.protocolResolved, false);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.persistenceExecuted, false);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.auditExecuted, false);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.batchCreated, true);

    // BATCH_CREATED foi ACK'd — não permanece como enqueued.
    const batchGone = await runtime.getQueueRuntimePort().peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-tiss-04a:ocr-completed:parsed:validated:enriched:xml-generated:batch-created",
    });
    assert.notEqual(batchGone.queueMessage?.status, "enqueued");
  });

  it("reutiliza exclusivamente Ports INF + ProtocolRuntimePort (sem Persistence)", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-04a-infra",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    await registerTissReceivedJob({
      source: "capture-upload",
      correlationId: "corr-infra-04a",
      jobId: "job-infra-04a",
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

    const result = await processTissBatchCreatedProtocolSent({
      waitTimeoutMs: 8_000,
    });

    assert.equal(result.ok, true);
    assert.equal(result.infrastructure.queueRuntimePort, true);
    assert.equal(result.infrastructure.workerRuntimePort, true);
    assert.equal(result.infrastructure.schedulerRuntimePort, true);
    assert.equal(result.infrastructure.observabilityRuntimePort, true);
    assert.equal(result.infrastructure.protocolRuntimePort, true);
    assert.equal(result.infrastructure.retryInfrastructure, true);
    assert.equal(result.infrastructure.deadLetterRuntime, true);
    assert.equal(result.persistenceExecuted, false);
    assert.equal(result.auditExecuted, false);
    assert.equal(result.protocolSent, true);

    assert.equal(typeof runtime.getProtocolRuntimePort, "function");
    assert.equal(typeof runtime.getQueueRuntimePort, "function");
  });

  it("processTissProtocolJob ignora status != BATCH_CREATED e marca persistenceExecuted=false", async () => {
    resetQueueRuntimeIdSequences();
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-04a-skip",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const queue = runtime.getQueueRuntimePort();
    const enqueued = await queue.enqueue({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-already-protocol",
      metadata: {
        kind: "canonical-queue-metadata",
        source: "unit-test",
        tags: ["tiss-job", TISS_JOB_STATUS_PROTOCOL_SENT],
        customAttributes: {
          status: TISS_JOB_STATUS_PROTOCOL_SENT,
          tissJobStatus: TISS_JOB_STATUS_PROTOCOL_SENT,
          batchCreated: true,
          protocolSent: true,
          protocolResolved: false,
          persistenceExecuted: false,
          auditExecuted: false,
        },
      },
    });
    assert.equal(enqueued.ok, true);

    const result = await processTissProtocolJob({
      getQueueRuntimePort: () => queue,
      getProtocolRuntimePort: () => runtime.getProtocolRuntimePort(),
      message: enqueued.queueMessage!,
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
    });

    assert.equal(result.ok, false);
    assert.equal(result.settle, "nack");
    assert.equal(result.protocolSent, false);
    assert.equal(result.protocolResolved, false);
    assert.equal(result.persistenceExecuted, false);
    assert.equal(result.auditExecuted, false);
    assert.equal(result.code, "TISS_PROTOCOL_JOB_STATUS_NOT_BATCH_CREATED");
  });
});

describe("TISS-RUNTIME-04A preservação arquitetural", () => {
  it("sem Port / Gateway / Runtime / Pipeline novo; Persistence/Audio ausente no caminho Protocol", () => {
    const processSrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/queue-runtime/operational/process-tiss-protocol-job.ts"),
      "utf8",
    );
    assert.match(processSrc, /TISS-RUNTIME-04A/);
    assert.match(processSrc, /ProtocolRuntimePort/);
    assert.match(processSrc, /PROTOCOL_SENT/);
    assert.match(processSrc, /NÃO cria Port/);
    assert.equal(/PersistenceRuntimePort/.test(processSrc), false);
    assert.equal(/AuditRuntimePort/.test(processSrc), false);
    assert.equal(/from ["']@supabase\/supabase-js["']/.test(processSrc), false);

    const entrySrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/process-tiss-batch-created-protocol-sent.ts"),
      "utf8",
    );
    assert.match(entrySrc, /getEnterpriseRuntime/);
    assert.match(entrySrc, /getWorkerRuntimePort/);
    assert.match(entrySrc, /getQueueRuntimePort/);
    assert.match(entrySrc, /getProtocolRuntimePort/);
    assert.match(entrySrc, /getSchedulerRuntimePort/);
    assert.match(entrySrc, /getObservabilityRuntimePort/);
    assert.equal(/PersistenceRuntimePort/.test(entrySrc), false);
    assert.equal(/AuditRuntimePort/.test(entrySrc), false);

    const enterpriseTypes = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/types.ts"),
      "utf8",
    );
    assert.equal(
      /TissProtocolRuntimePort|getTissProtocolRuntimePort|TissProtocolGateway/.test(
        enterpriseTypes,
      ),
      false,
    );

    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.equal(
      /TissProtocolRuntimePort|createTissProtocolRuntimePort|TissProtocolPipeline/.test(
        enterpriseRuntime,
      ),
      false,
    );

    // Sem arquivo *Port novo para Job TISS.
    const operationalDir = join(repoRoot, "src/lib/enterprise/queue-runtime/operational");
    const files = collectTsFiles(operationalDir);
    assert.equal(
      files.some((f) => /tiss-.*-port\.ts$/i.test(f) || /tiss-protocol-runtime-port\.ts$/i.test(f)),
      false,
    );
  });

  it("composition root permanece getEnterpriseRuntime (sem bypass)", () => {
    const entrySrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/process-tiss-batch-created-protocol-sent.ts"),
      "utf8",
    );
    assert.match(entrySrc, /const runtime = getEnterpriseRuntime\(\)/);
    assert.equal(/new DefaultQueueRuntimeAdapter/.test(entrySrc), false);
    assert.equal(/createProtocolRuntimePort\(/.test(entrySrc), false);
  });
});

#!/usr/bin/env node
/**
 * TISS-RUNTIME-05A — Capability Audit operacional.
 *
 * Prova:
 *   Job PERSISTED
 *     → getEnterpriseRuntime()
 *     → WorkerRuntimePort (QueueRuntimePort.dequeue)
 *     → AuditRuntimePort (openJob / getResult)
 *     → Job AUDITED reenfileirado
 *     → Completed NÃO executado
 *
 * Sem Completed.
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
  TISS_JOB_STATUS_ENRICHED,
  TISS_JOB_STATUS_OCR_COMPLETED,
  TISS_JOB_STATUS_PARSED,
  TISS_JOB_STATUS_PERSISTED,
  TISS_JOB_STATUS_PROTOCOL_SENT,
  TISS_JOB_STATUS_VALIDATED,
  TISS_JOB_STATUS_XML_GENERATED,
  processTissAuditJob,
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

describe("TISS-RUNTIME-05A Job PERSISTED → Worker → Audit → AUDITED", () => {
  it("processTissPersistedAudited via getEnterpriseRuntime evolui PERSISTED para AUDITED", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-05a",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const registered = await registerTissReceivedJob({
      source: "document-intake",
      correlationId: "corr-tiss-05a",
      sessionId: "session-tiss-05a",
      documentId: "doc-tiss-05a",
      payloadRef: "storage://clinical-documents/doc-tiss-05a",
      jobId: "job-tiss-05a",
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
    assert.equal(auditResult.entry, "getEnterpriseRuntime");
    assert.equal(auditResult.runtimeId, "test-tiss-05a");
    assert.equal(auditResult.audited, true);
    assert.equal(auditResult.completedExecuted, false);
    assert.equal(auditResult.persisted, true);
    assert.equal(auditResult.protocolSent, true);
    assert.equal(auditResult.batchCreated, true);
    assert.equal(auditResult.xmlGenerated, true);
    assert.equal(auditResult.enrichmentExecuted, true);
    assert.equal(auditResult.validationExecuted, true);
    assert.equal(auditResult.parserExecuted, true);
    assert.equal(auditResult.ocrExecuted, true);
    assert.ok(auditResult.job);
    assert.equal(auditResult.job!.status, TISS_JOB_STATUS_AUDITED);
    assert.equal(
      auditResult.job!.previousJobId,
      "job-tiss-05a:ocr-completed:parsed:validated:enriched:xml-generated:batch-created:protocol-sent:persisted",
    );
    assert.equal(auditResult.job!.queueName, ENTERPRISE_TISS_QUEUE_NAME);
    assert.equal(auditResult.job!.correlationId, "corr-tiss-05a");
    assert.ok(auditResult.job!.auditJobId);

    const peeked = await runtime.getQueueRuntimePort().peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId:
        "job-tiss-05a:ocr-completed:parsed:validated:enriched:xml-generated:batch-created:protocol-sent:persisted:audited",
    });
    assert.equal(peeked.ok, true);
    assert.equal(
      peeked.queueMessage?.messageId,
      "job-tiss-05a:ocr-completed:parsed:validated:enriched:xml-generated:batch-created:protocol-sent:persisted:audited",
    );
    assert.equal(peeked.queueMessage?.status, "enqueued");
    assert.equal(
      peeked.queueMessage?.metadata?.customAttributes?.tissJobStatus,
      TISS_JOB_STATUS_AUDITED,
    );
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.audited, true);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.auditExecuted, true);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.completedExecuted, false);
    assert.equal(peeked.queueMessage?.metadata?.customAttributes?.persisted, true);

    // PERSISTED foi ACK'd — não permanece como enqueued.
    const persistedGone = await runtime.getQueueRuntimePort().peek({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId:
        "job-tiss-05a:ocr-completed:parsed:validated:enriched:xml-generated:batch-created:protocol-sent:persisted",
    });
    assert.notEqual(persistedGone.queueMessage?.status, "enqueued");
  });

  it("reutiliza exclusivamente Ports INF + AuditRuntimePort (sem Completed)", async () => {
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-05a-infra",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    await registerTissReceivedJob({
      source: "capture-upload",
      correlationId: "corr-infra-05a",
      jobId: "job-infra-05a",
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

    const result = await processTissPersistedAudited({
      waitTimeoutMs: 8_000,
    });

    assert.equal(result.ok, true);
    assert.equal(result.infrastructure.queueRuntimePort, true);
    assert.equal(result.infrastructure.workerRuntimePort, true);
    assert.equal(result.infrastructure.schedulerRuntimePort, true);
    assert.equal(result.infrastructure.observabilityRuntimePort, true);
    assert.equal(result.infrastructure.auditRuntimePort, true);
    assert.equal(result.infrastructure.retryInfrastructure, true);
    assert.equal(result.infrastructure.deadLetterRuntime, true);
    assert.equal(result.completedExecuted, false);
    assert.equal(result.audited, true);

    assert.equal(typeof runtime.getAuditRuntimePort, "function");
    assert.equal(typeof runtime.getQueueRuntimePort, "function");
  });

  it("processTissAuditJob ignora status != PERSISTED e marca completedExecuted=false", async () => {
    resetQueueRuntimeIdSequences();
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-05a-skip",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const queue = runtime.getQueueRuntimePort();
    const enqueued = await queue.enqueue({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-already-audited",
      metadata: {
        kind: "canonical-queue-metadata",
        source: "unit-test",
        tags: ["tiss-job", TISS_JOB_STATUS_AUDITED],
        customAttributes: {
          status: TISS_JOB_STATUS_AUDITED,
          tissJobStatus: TISS_JOB_STATUS_AUDITED,
          persisted: true,
          audited: true,
          auditExecuted: true,
          completedExecuted: false,
        },
      },
    });
    assert.equal(enqueued.ok, true);

    const result = await processTissAuditJob({
      getQueueRuntimePort: () => queue,
      getAuditRuntimePort: () => runtime.getAuditRuntimePort(),
      message: enqueued.queueMessage!,
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
    });

    assert.equal(result.ok, false);
    assert.equal(result.settle, "nack");
    assert.equal(result.audited, false);
    assert.equal(result.completedExecuted, false);
    assert.equal(result.code, "TISS_AUDIT_JOB_STATUS_NOT_PERSISTED");
  });
});

describe("TISS-RUNTIME-05A preservação arquitetural", () => {
  it("sem Port / Gateway / Runtime / Pipeline novo; Completed ausente no caminho Audit", () => {
    const processSrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/queue-runtime/operational/process-tiss-audit-job.ts"),
      "utf8",
    );
    assert.match(processSrc, /TISS-RUNTIME-05A/);
    assert.match(processSrc, /AuditRuntimePort/);
    assert.match(processSrc, /AUDITED/);
    assert.match(processSrc, /NÃO cria Port/);
    assert.equal(/CompletedRuntimePort/.test(processSrc), false);
    assert.equal(/from ["']@supabase\/supabase-js["']/.test(processSrc), false);

    const entrySrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/process-tiss-persisted-audited.ts"),
      "utf8",
    );
    assert.match(entrySrc, /getEnterpriseRuntime/);
    assert.match(entrySrc, /getWorkerRuntimePort/);
    assert.match(entrySrc, /getQueueRuntimePort/);
    assert.match(entrySrc, /getAuditRuntimePort/);
    assert.match(entrySrc, /getSchedulerRuntimePort/);
    assert.match(entrySrc, /getObservabilityRuntimePort/);
    assert.equal(/CompletedRuntimePort/.test(entrySrc), false);

    const enterpriseTypes = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/types.ts"),
      "utf8",
    );
    assert.equal(
      /TissAuditRuntimePort|getTissAuditRuntimePort|TissAuditGateway/.test(enterpriseTypes),
      false,
    );

    const enterpriseRuntime = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/enterprise-runtime.ts"),
      "utf8",
    );
    assert.equal(
      /TissAuditRuntimePort|createTissAuditRuntimePort|TissAuditPipeline/.test(enterpriseRuntime),
      false,
    );

    // Sem arquivo *Port novo para Job TISS.
    const operationalDir = join(repoRoot, "src/lib/enterprise/queue-runtime/operational");
    const files = collectTsFiles(operationalDir);
    assert.equal(
      files.some((f) => /tiss-.*-port\.ts$/i.test(f) || /tiss-audit-runtime-port\.ts$/i.test(f)),
      false,
    );
  });

  it("composition root permanece getEnterpriseRuntime (sem bypass)", () => {
    const entrySrc = readFileSync(
      join(repoRoot, "src/lib/enterprise/runtime/process-tiss-persisted-audited.ts"),
      "utf8",
    );
    assert.match(entrySrc, /const runtime = getEnterpriseRuntime\(\)/);
    assert.equal(/new DefaultQueueRuntimeAdapter/.test(entrySrc), false);
    assert.equal(/createAuditRuntimePort\(/.test(entrySrc), false);
  });
});

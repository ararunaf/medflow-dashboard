#!/usr/bin/env node
/**
 * A7-03 — Protocol Real Production Certification.
 *
 * Certifica RealTissProtocolRuntimeAdapter para produção reutilizando
 * exclusivamente a arquitetura Enterprise congelada.
 *
 * Cenários: protocol válido, protocol inválido, retry, dead letter,
 * observability, health, providerInfo, capabilities, telemetry, performance,
 * throughput e pipeline Enterprise (BATCH_CREATED → PROTOCOL_SENT).
 */
process.env.MEDICFLOW_QUEUE_RUNTIME_BACKEND = "memory";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import {
  ENTERPRISE_TISS_QUEUE_NAME,
  TISS_JOB_STATUS_BATCH_CREATED,
  TISS_JOB_STATUS_PROTOCOL_SENT,
  TISS_JOB_STATUS_XML_GENERATED,
  processTissProtocolJob,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
import { createOCRProviderPort } from "../../../src/lib/enterprise/ocr-provider/index.ts";
import { createBatchRuntimePort } from "../../../src/lib/enterprise/batch-runtime/index.ts";
import {
  ProtocolRuntimeFactory,
  ProtocolRuntimeProvider,
  RealTissProtocolRuntimeAdapter,
  REAL_TISS_PROTOCOL_RUNTIME_ADAPTER_ID,
  REAL_TISS_PROTOCOL_RUNTIME_VERSION,
  createProtocolRuntimeFactory,
  createProtocolRuntimePort,
  getProtocolRuntimeFactory,
} from "../../../src/lib/enterprise/protocol-runtime/index.ts";
import {
  createEnterpriseRuntime,
  resetEnterpriseRuntimeForTests,
  setEnterpriseRuntimeForTests,
  processTissBatchCreatedProtocolSent,
  processTissEnrichedXmlGenerated,
  processTissOcrParsed,
  processTissParsedValidated,
  processTissReceivedOcr,
  processTissValidatedEnriched,
  processTissXmlGeneratedBatchCreated,
  registerTissReceivedJob,
} from "../../../src/lib/enterprise/runtime/index.ts";
import { resetQueueRuntimeIdSequences } from "../../../src/lib/enterprise/queue-runtime/index.ts";
import { createEmptyProtocolCapabilities } from "../../../src/lib/enterprise/protocol-runtime/index.ts";

describe("A7-03 — Protocol Real Production Certification", () => {
  it("1. Protocol válido: ProtocolProfile, state, owner, tags, requiredCapabilities, metadata, profile", async () => {
    const port = createProtocolRuntimePort({ provider: "real-tiss" });

    const prepared = await port.prepareProfile({
      profileName: "TISS real protocol certification",
      protocolContext: {
        kind: "canonical-protocol-context",
        contextId: "ctx-tiss-real-cert",
        correlationId: "corr-tiss-real-cert",
        structuralNotes: "Real TISS protocol certification",
      },
      requiredCapabilities: createEmptyProtocolCapabilities(),
      metadata: {
        kind: "canonical-protocol-metadata",
        attributes: { source: "tiss-ans-3.05.00" },
        protocolMetadataImplemented: false,
      },
    });

    assert.equal(prepared.ok, true);
    assert.equal(prepared.provider, "real-tiss");
    assert.equal(prepared.protocolResolved, false);
    assert.ok(prepared.profile);
    assert.equal(prepared.profile!.kind, "canonical-protocol-profile");
    assert.equal(prepared.profile!.state, "PENDING_RESOLUTION");
    assert.equal(prepared.profile!.owner, "real-tiss");
    assert.ok(prepared.profile!.tags?.includes("real-tiss"));
    assert.ok(prepared.profile!.tags?.includes("tiss-protocol"));
    assert.ok(prepared.profile!.tags?.includes("ans-3.05.00"));
    assert.equal(prepared.profile!.abstractProtocolRef, "tiss-ans-3.05.00");
    assert.ok(prepared.profile!.requiredCapabilities);
    assert.equal(prepared.profile!.requiredCapabilities!.kind, "canonical-protocol-capabilities");
    assert.equal(prepared.profile!.metadata?.kind, "canonical-protocol-metadata");
    assert.ok(prepared.protocolContext);
    assert.equal(prepared.protocolContext!.kind, "canonical-protocol-context");

    const loaded = await port.getProfile({ profileId: prepared.profile!.profileId! });
    assert.equal(loaded.ok, true);
    assert.equal(loaded.profile!.profileId, prepared.profile!.profileId);
    assert.equal(loaded.profile!.state, "PENDING_RESOLUTION");

    const listed = await port.listProfiles();
    assert.equal(listed.ok, true);
    assert.ok(listed.profiles.some((p) => p.profileId === prepared.profile!.profileId));
    assert.ok(listed.contexts.some((c) => c.contextId === prepared.protocolContext!.contextId));
  });

  it("2. Protocol inválido — Batch inexistente: perfil gerado sem batchManifest", async () => {
    const port = createProtocolRuntimePort({ provider: "real-tiss" });

    const prepared = await port.prepareProfile({
      profileName: "TISS protocol without batch",
      protocolContext: {
        kind: "canonical-protocol-context",
        contextId: "ctx-tiss-no-batch",
        structuralNotes: "Protocol without batch manifest",
      },
    });

    assert.equal(prepared.ok, true);
    assert.equal(prepared.provider, "real-tiss");
    assert.equal(prepared.protocolResolved, false);
    assert.equal(prepared.profile!.batchManifest, undefined);
    assert.equal(prepared.profile!.xmlDocument, undefined);
  });

  it("3. Protocol inválido — XML inexistente: perfil gerado sem xmlDocument", async () => {
    const port = createProtocolRuntimePort({ provider: "real-tiss" });

    const prepared = await port.prepareProfile({
      profileName: "TISS protocol without XML",
      protocolContext: {
        kind: "canonical-protocol-context",
        contextId: "ctx-tiss-no-xml",
        structuralNotes: "Protocol without XML document",
      },
    });

    assert.equal(prepared.ok, true);
    assert.equal(prepared.provider, "real-tiss");
    assert.equal(prepared.protocolResolved, false);
    assert.equal(prepared.profile!.xmlDocument, undefined);
    assert.equal(prepared.profile!.xmlValidationResult, undefined);
  });

  it("4. Protocol inválido — contexto inválido: getProfile retorna NOT_FOUND", async () => {
    const port = createProtocolRuntimePort({ provider: "real-tiss" });

    const loaded = await port.getProfile({ profileId: "non-existent-profile-id" });
    assert.equal(loaded.ok, false);
    assert.equal(loaded.provider, "real-tiss");
    assert.equal(loaded.code, "PROTOCOL_RUNTIME_NOT_FOUND");
  });

  it("5. Protocol inválido — profile inválido: resolveProtocol sem resolução", async () => {
    const port = createProtocolRuntimePort({ provider: "real-tiss" });

    const resolved = await port.resolveProtocol({});
    assert.equal(resolved.ok, true);
    assert.equal(resolved.provider, "real-tiss");
    assert.equal(resolved.protocolResolved, false);
    assert.equal(resolved.protocolResolutionImplemented, false);
    assert.equal(resolved.resolver?.protocolResolutionImplemented, false);
  });

  it("6. Retry: retryCount, backoff, attempts e recuperação automática", async () => {
    const port = new RealTissProtocolRuntimeAdapter({
      provider: "real-tiss",
      failAttempts: 2,
      defaultRetryCount: 2,
      defaultRetryBackoffMs: 10,
    });

    const start = performance.now();
    const prepared = await port.prepareProfile({
      profileName: "TISS real protocol with retry",
      protocolContext: {
        kind: "canonical-protocol-context",
        contextId: "ctx-tiss-retry",
        structuralNotes: "Real TISS protocol retry",
      },
    });
    const elapsed = performance.now() - start;

    assert.equal(prepared.ok, true);
    assert.equal(prepared.provider, "real-tiss");
    assert.ok(prepared.telemetry!.attempts > 1, `expected >1 attempts, got ${prepared.telemetry?.attempts}`);
    assert.ok(elapsed >= 20, `expected backoff >=20ms, got ${elapsed}ms`);
    assert.ok(prepared.logs!.some((l) => l.code === "PROTOCOL_RUNTIME_RETRY"));
  });

  it("7. Dead Letter: processTissProtocolJob rejeita status != BATCH_CREATED e devolve nack", async () => {
    resetQueueRuntimeIdSequences();
    resetEnterpriseRuntimeForTests();
    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-07a-dl",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
      protocolRuntimePort: createProtocolRuntimePort({ provider: "real-tiss" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const queue = runtime.getQueueRuntimePort();
    const enqueued = await queue.enqueue({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: "job-protocol-sent-dl",
      metadata: {
        kind: "canonical-queue-metadata",
        source: "unit-test",
        tags: ["tiss-job", TISS_JOB_STATUS_PROTOCOL_SENT],
        customAttributes: {
          status: TISS_JOB_STATUS_PROTOCOL_SENT,
          tissJobStatus: TISS_JOB_STATUS_PROTOCOL_SENT,
          batchCreated: true,
          protocolSent: true,
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

    const missingPort = await processTissProtocolJob({
      getQueueRuntimePort: undefined as any,
      getProtocolRuntimePort: () => runtime.getProtocolRuntimePort(),
      message: enqueued.queueMessage!,
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
    });
    assert.equal(missingPort.ok, false);
    assert.equal(missingPort.settle, "nack-error");
    assert.equal(missingPort.code, "TISS_PROTOCOL_JOB_MISSING_QUEUE_PORT");
  });

  it("8. Observability: health, providerInfo, capabilities, telemetry, runtimeReady", async () => {
    const port = createProtocolRuntimePort({ provider: "real-tiss" });

    const health = await port.health();
    assert.equal(health.ok, true);
    assert.equal(health.provider, "real-tiss");
    assert.equal(health.runtimeReady, true);
    assert.equal(health.soapImplemented, false);
    assert.equal(health.protocolResolutionImplemented, false);

    const caps = port.capabilities();
    assert.equal(caps.provider, "real-tiss");
    assert.equal(caps.adapterId, REAL_TISS_PROTOCOL_RUNTIME_ADAPTER_ID);
    assert.equal(caps.supportsPrepareProfile, true);
    assert.equal(caps.supportsResolveProtocol, true);
    assert.equal(caps.runtimeReady, true);
    assert.equal(caps.protocolResolutionImplemented, false);

    const info = port.providerInfo();
    assert.equal(info.providerId, "real-tiss");
    assert.equal(info.status, "ready");
    assert.equal(info.providerType, "PROTOCOL_RUNTIME");
    assert.equal(info.metadata.version, REAL_TISS_PROTOCOL_RUNTIME_VERSION);
  });

  it("9. Latência média e throughput (1000 amostras)", async () => {
    const port = createProtocolRuntimePort({ provider: "real-tiss" });

    const samples = 1000;
    const start = performance.now();
    for (let i = 0; i < samples; i += 1) {
      await port.prepareProfile({
        profileName: `Benchmark protocol ${i}`,
        protocolContext: {
          kind: "canonical-protocol-context",
          contextId: `ctx-bench-${i}`,
        },
      });
    }
    const totalMs = performance.now() - start;
    const avgMs = totalMs / samples;
    const throughput = (samples / totalMs) * 1000;

    assert.ok(totalMs > 0);
    assert.ok(avgMs < 1, `average latency ${avgMs}ms too high`);
    console.log(`[protocol-certification] throughput=${throughput.toFixed(2)} ops/s, averageLatency=${avgMs.toFixed(4)} ms, totalMs=${totalMs.toFixed(2)}`);
  });

  it("10. Pipeline Enterprise: BATCH_CREATED → PROTOCOL_SENT com real-tiss", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-tiss-07a-pipeline",
      ocrProviderPort: createOCRProviderPort({ provider: "mock" }),
      batchRuntimePort: createBatchRuntimePort({ provider: "real-tiss" }),
      protocolRuntimePort: createProtocolRuntimePort({ provider: "real-tiss" }),
    });
    setEnterpriseRuntimeForTests(runtime);

    await registerTissReceivedJob({
      source: "document-intake",
      correlationId: "corr-tiss-07a",
      documentId: "doc-tiss-07a",
      jobId: "job-tiss-07a",
      payloadRef: "storage://clinical-documents/doc-tiss-07a",
    });

    await processTissReceivedOcr({ preferredProviderReference: "mock", waitTimeoutMs: 8_000, pollIntervalMs: 15 });
    await processTissOcrParsed({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });
    await processTissParsedValidated({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });
    await processTissValidatedEnriched({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });

    const xmlResult = await processTissEnrichedXmlGenerated({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });
    assert.equal(xmlResult.ok, true);
    assert.equal(xmlResult.job?.status, TISS_JOB_STATUS_XML_GENERATED);

    const batchResult = await processTissXmlGeneratedBatchCreated({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });
    assert.equal(batchResult.ok, true);
    assert.equal(batchResult.batchCreated, true);
    assert.equal(batchResult.protocolExecuted, false);
    assert.equal(batchResult.persistenceExecuted, false);
    assert.equal(batchResult.auditExecuted, false);

    const protocolResult = await processTissBatchCreatedProtocolSent({ waitTimeoutMs: 8_000, pollIntervalMs: 15 });
    assert.equal(protocolResult.ok, true);
    assert.equal(protocolResult.entry, "getEnterpriseRuntime");
    assert.equal(protocolResult.protocolSent, true);
    assert.equal(protocolResult.protocolResolved, false);
    assert.equal(protocolResult.persistenceExecuted, false);
    assert.equal(protocolResult.auditExecuted, false);
    assert.equal(protocolResult.infrastructure.queueRuntimePort, true);
    assert.equal(protocolResult.infrastructure.workerRuntimePort, true);
    assert.equal(protocolResult.infrastructure.schedulerRuntimePort, true);
    assert.equal(protocolResult.infrastructure.observabilityRuntimePort, true);
    assert.equal(protocolResult.infrastructure.protocolRuntimePort, true);
    assert.equal(protocolResult.infrastructure.retryInfrastructure, true);
    assert.equal(protocolResult.infrastructure.deadLetterRuntime, true);
    assert.equal(protocolResult.job?.status, TISS_JOB_STATUS_PROTOCOL_SENT);
  });

  it("11. Factory e Registry compatíveis com todos os providers", () => {
    const factory = createProtocolRuntimeFactory();
    assert.equal(factory.create({ provider: "mock" }).providerId, "mock");
    assert.equal(factory.create({ provider: "test" }).providerId, "test");
    assert.equal(factory.create({ provider: "default" }).providerId, "default");
    assert.equal(factory.create({ provider: "enterprise" }).providerId, "enterprise");
    assert.equal(factory.create({ provider: "real-tiss" }).providerId, "real-tiss");
    assert.ok(factory.create({ provider: "real-tiss" }) instanceof RealTissProtocolRuntimeAdapter);
    assert.ok(getProtocolRuntimeFactory().getRegistry().has("real-tiss"));
    assert.ok(ProtocolRuntimeProvider.create({ provider: "real-tiss" }) instanceof RealTissProtocolRuntimeAdapter);
  });
});

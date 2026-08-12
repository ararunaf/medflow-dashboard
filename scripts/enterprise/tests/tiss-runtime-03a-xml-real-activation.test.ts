#!/usr/bin/env node
/**
 * A5-02 — TISS-RUNTIME-03A XML Real Activation.
 *
 * Ativa o RealTissXMLTISSRuntimeAdapter como provider `real-tiss` do
 * XMLTISSRuntimePort, provando ENRICHED → XML_GENERATED sem alterar
 * EnterpriseRuntime, Runtime, Queue, Worker, Scheduler, Retry, Dead Letter,
 * Observability, Pipeline, Foundations ou Composition Root.
 */
process.env.MEDICFLOW_QUEUE_RUNTIME_BACKEND = "memory";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { RealTissXMLTISSRuntimeAdapter } from "../../../src/lib/enterprise/xml-tiss-runtime/index.ts";
import {
  ENTERPRISE_TISS_QUEUE_NAME,
  TISS_JOB_STATUS_ENRICHED,
  resetQueueRuntimeIdSequences,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
import {
  createEnterpriseRuntime,
  processTissEnrichedXmlGenerated,
  resetEnterpriseRuntimeForTests,
  setEnterpriseRuntimeForTests,
} from "../../../src/lib/enterprise/runtime/index.ts";
import { createXMLTISSRuntimePort } from "../../../src/lib/enterprise/xml-tiss-runtime/index.ts";

describe("A5-02 — TISS-RUNTIME-03A XML Real Activation", () => {
  it("1. RealTissXMLTISSRuntimeAdapter gera XML real a partir de guia consulta", async () => {
    const port = new RealTissXMLTISSRuntimeAdapter();

    const res = await port.prepareXMLDocument({
      documentId: "xml-real-01",
      xmlContext: {
        kind: "canonical-xml-tiss-context",
        structuralNotes: "Test A5-02 real XML generation.",
        autoFillResult: {
          kind: "canonical-auto-fill-result",
          status: "populated",
          guide: {
            kind: "canonical-auto-fill-guide",
            guideId: "g-real-01",
            guideType: "consulta",
            status: "populated",
            fields: [
              {
                kind: "canonical-auto-fill-field",
                fieldId: "BENEFICIARIO",
                fieldName: "nomeBeneficiario",
                label: "João da Silva",
                status: "populated",
                fieldPopulationImplemented: false,
                templatePopulationImplemented: false,
              },
              {
                kind: "canonical-auto-fill-field",
                fieldId: "CARTEIRA",
                fieldName: "numeroCarteira",
                label: "1234567890",
                status: "populated",
                fieldPopulationImplemented: false,
                templatePopulationImplemented: false,
              },
              {
                kind: "canonical-auto-fill-field",
                fieldId: "ATENDIMENTO",
                fieldName: "dataAtendimento",
                label: "2026-08-12",
                status: "populated",
                fieldPopulationImplemented: false,
                templatePopulationImplemented: false,
              },
            ],
            autoFillEngineImplemented: false,
            guideGenerationImplemented: false,
            fieldPopulationImplemented: false,
            templatePopulationImplemented: false,
            operatorPopulationImplemented: false,
            xmlPopulationImplemented: false,
            validationIntegrationImplemented: false,
            auditIntegrationImplemented: false,
            qualityIntegrationImplemented: false,
            automaticCompletionImplemented: false,
          },
        },
      } as any,
    });

    assert.equal(res.ok, true);
    assert.equal(res.provider, "real-tiss");
    assert.equal(res.result!.status, "generated");
    assert.equal(res.document!.status, "generated");
    assert.ok(res.result!.body!.bodyId.includes('<?xml version="1.0"'));
    assert.ok(res.result!.body!.bodyId.includes("<ans:consulta"));
    assert.ok(
      res.result!.body!.bodyId.includes('xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas"'),
    );
    assert.ok(res.result!.body!.bodyId.includes("1234567890"));
    assert.equal(res.result!.metadata!.guideType, "consulta");
    assert.equal(res.result!.metadata!.tissVersion!.versionId, "3.05.00");
    assert.equal(
      res.result!.metadata!.tissVersion!.namespaces![0].namespaceUri,
      "http://www.ans.gov.br/padroes/tiss/schemas",
    );
    assert.equal(res.telemetry!.attempts, 1);
    assert.equal(res.telemetry!.cancelled, false);
  });

  it("2. End-to-end: ENRICHED → XML_GENERATED via getEnterpriseRuntime", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-03a-real-tiss",
      xmlTissRuntimePort: createXMLTISSRuntimePort({
        provider: "real-tiss",
      }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const enrichedMessageId = "job-03a-real:enriched";
    const previousJobId = "job-03a-real:parsed";
    const documentId = "doc-03a-real";
    const correlationId = "corr-03a-real";
    const sessionId = "session-03a-real";

    await runtime.getQueueRuntimePort().enqueue({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: enrichedMessageId,
      payloadRef: `storage://clinical-documents/${documentId}`,
      correlationId,
      metadata: {
        kind: "canonical-queue-metadata",
        sessionId,
        correlationId,
        channel: "tiss-xml-generation",
        source: "tiss-runtime-03a",
        tags: ["tiss-runtime-03a", "tiss-job", TISS_JOB_STATUS_ENRICHED],
        customAttributes: {
          status: TISS_JOB_STATUS_ENRICHED,
          tissJobStatus: TISS_JOB_STATUS_ENRICHED,
          documentId,
          sessionId,
          previousJobId,
          ocrExecuted: true,
          parserExecuted: true,
          validationExecuted: true,
          enrichmentExecuted: true,
          xmlExecuted: false,
          batchExecuted: false,
          protocolExecuted: false,
          persistenceExecuted: false,
          auditExecuted: false,
          completedExecuted: false,
        },
      },
    });

    const result = await processTissEnrichedXmlGenerated({
      waitTimeoutMs: 8_000,
      pollIntervalMs: 15,
    });

    assert.equal(result.ok, true);
    assert.equal(result.entry, "getEnterpriseRuntime");
    assert.equal(result.xmlGenerated, true);
    assert.equal(result.enrichmentExecuted, true);
    assert.equal(result.ocrExecuted, true);
    assert.equal(result.parserExecuted, true);
    assert.equal(result.validationExecuted, true);
    assert.equal(result.batchExecuted, false);
    assert.equal(result.protocolExecuted, false);
    assert.equal(result.persistenceExecuted, false);
    assert.equal(result.auditExecuted, false);
    assert.equal(result.infrastructure.xmlTissRuntimePort, true);
    assert.equal(result.infrastructure.deadLetterRuntime, true);
    assert.equal(result.infrastructure.retryInfrastructure, true);
    assert.ok(result.job);
    assert.equal(result.job!.status, "XML_GENERATED");
    assert.equal(result.job!.previousJobId, enrichedMessageId);
    assert.equal(result.job!.correlationId, correlationId);
    assert.ok(result.job!.xmlDocumentId);

    const xmlResult = await runtime.getXMLTISSRuntimePort().getResult({
      documentId: result.job!.xmlDocumentId,
    });
    assert.equal(xmlResult.ok, true);
    assert.equal(xmlResult.provider, "real-tiss");
    assert.equal(xmlResult.result!.status, "generated");
    assert.ok(xmlResult.result!.body!.bodyId.includes("<ans:consulta"));
  });

  it("3. RealTissXMLTISSRuntimeAdapter rejeita status != ENRICHED no worker", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-03a-reject",
      xmlTissRuntimePort: createXMLTISSRuntimePort({
        provider: "real-tiss",
      }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const wrongMessageId = "job-03a-reject:parsed";
    await runtime.getQueueRuntimePort().enqueue({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: wrongMessageId,
      payloadRef: "storage://doc",
      metadata: {
        kind: "canonical-queue-metadata",
        customAttributes: {
          status: "PARSED",
          tissJobStatus: "PARSED",
          documentId: "doc-reject",
          previousJobId: "job-03a-reject:ocr",
          ocrExecuted: true,
          parserExecuted: true,
          validationExecuted: false,
          enrichmentExecuted: false,
          xmlExecuted: false,
        },
      },
    });

    const result = await processTissEnrichedXmlGenerated({
      waitTimeoutMs: 2_000,
      pollIntervalMs: 10,
    });

    assert.equal(result.ok, false);
    assert.equal(result.xmlGenerated, false);
    assert.equal(result.infrastructure.xmlTissRuntimePort, true);
  });

  it("4. Observability: health, providerInfo, capabilities", async () => {
    const port = new RealTissXMLTISSRuntimeAdapter();
    const health = await port.health();
    assert.equal(health.provider, "real-tiss");
    assert.equal(health.ok, true);
    assert.equal(health.runtimeReady, true);
    assert.ok(health.latencyMs !== undefined);

    const info = port.providerInfo();
    assert.equal(info.providerId, "real-tiss");
    assert.equal(info.metadata.name, "Real TISS XML TISS Runtime");

    const caps = port.capabilities();
    assert.equal(caps.provider, "real-tiss");
    assert.equal(caps.runtimeReady, true);
    assert.equal(caps.adapterId, "real-tiss-xml-tiss-runtime");
  });

  it("5. Retry com transient failures", async () => {
    const port = new RealTissXMLTISSRuntimeAdapter({
      failAttempts: 2,
      defaultRetryCount: 2,
      defaultRetryBackoffMs: 1,
    });

    const res = await port.prepareXMLDocument({
      documentId: "xml-retry-01",
      retryCount: 2,
      xmlContext: {
        kind: "canonical-xml-tiss-context",
        autoFillResult: {
          kind: "canonical-auto-fill-result",
          guide: {
            kind: "canonical-auto-fill-guide",
            guideId: "g-retry",
            guideType: "consulta",
            status: "populated",
            fields: [
              {
                kind: "canonical-auto-fill-field",
                fieldId: "CARTEIRA",
                label: "9999999999",
                status: "populated",
                fieldPopulationImplemented: false,
                templatePopulationImplemented: false,
              },
            ],
          },
        },
      } as any,
    });

    assert.equal(res.ok, true);
    assert.equal(res.telemetry!.attempts, 3);
    assert.equal(res.result!.status, "generated");
  });

  it("6. Cancelamento via AbortSignal", async () => {
    const port = new RealTissXMLTISSRuntimeAdapter();
    const controller = new AbortController();
    controller.abort();

    const res = await port.prepareXMLDocument({
      documentId: "xml-cancel-01",
      signal: controller.signal,
    });

    assert.equal(res.ok, false);
    assert.equal(res.code, "XML_TISS_RUNTIME_CANCELLED");
    assert.equal(res.telemetry!.cancelled, true);
  });
});

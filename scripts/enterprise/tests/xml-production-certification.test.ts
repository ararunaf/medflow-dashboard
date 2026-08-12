#!/usr/bin/env node
/**
 * A5-03 — XML Real Production Certification.
 *
 * Certifica o RealTissXMLTISSRuntimeAdapter sem alterar src, Runtime,
 * Ports, Gateways, Pipeline, Foundations, Queue, Worker, Scheduler,
 * Retry, Dead Letter, Observability, Composition Root ou qualquer outro
 * componente arquitetural.
 */
process.env.MEDICFLOW_QUEUE_RUNTIME_BACKEND = "memory";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { RealTissXMLTISSRuntimeAdapter } from "../../../src/lib/enterprise/xml-tiss-runtime/index.ts";
import { createXMLTISSRuntimePort } from "../../../src/lib/enterprise/xml-tiss-runtime/index.ts";
import {
  ENTERPRISE_TISS_QUEUE_NAME,
  TISS_JOB_STATUS_ENRICHED,
  TISS_JOB_STATUS_XML_GENERATED,
  processTissXmlJob,
  resetQueueRuntimeIdSequences,
} from "../../../src/lib/enterprise/queue-runtime/index.ts";
import {
  createEnterpriseRuntime,
  processTissEnrichedXmlGenerated,
  resetEnterpriseRuntimeForTests,
  setEnterpriseRuntimeForTests,
} from "../../../src/lib/enterprise/runtime/index.ts";

const SAMPLE_COUNT = 1000;

function sampleAutoFillResult(
  overrides: {
    guideType?: "consulta" | "internacao" | "honorarios" | string;
    fields?: Array<{ fieldId: string; label: string }>;
  } = {},
): any {
  const { guideType = "consulta", fields = [] } = overrides;
  return {
    kind: "canonical-auto-fill-result",
    ok: true,
    status: "populated",
    guide: {
      kind: "canonical-auto-fill-guide",
      guideId: `g-${guideType}-cert`,
      guideType,
      status: "populated",
      fields: fields.map((f) => ({
        kind: "canonical-auto-fill-field",
        fieldId: f.fieldId,
        fieldName: f.fieldId.toLowerCase(),
        label: f.label,
        status: "populated",
        fieldPopulationImplemented: false,
        templatePopulationImplemented: false,
      })),
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
  };
}

describe("A5-03 — XML Real Production Certification", () => {
  it("1. XML válido de consulta com namespace ANS", async () => {
    const port = new RealTissXMLTISSRuntimeAdapter();
    const res = await port.prepareXMLDocument({
      documentId: "xml-valid-01",
      xmlContext: {
        kind: "canonical-xml-tiss-context",
        autoFillResult: sampleAutoFillResult({
          fields: [
            { fieldId: "BENEFICIARIO", label: "João da Silva" },
            { fieldId: "CARTEIRA", label: "1234567890" },
            { fieldId: "ATENDIMENTO", label: "2026-08-12" },
          ],
        }),
      } as any,
    });

    assert.equal(res.ok, true);
    assert.equal(res.provider, "real-tiss");
    assert.equal(res.result!.status, "generated");
    assert.equal(res.result!.metadata!.guideType, "consulta");
    assert.equal(res.result!.metadata!.tissVersion!.versionId, "3.05.00");
    assert.equal(
      res.result!.metadata!.tissVersion!.namespaces![0].namespaceUri,
      "http://www.ans.gov.br/padroes/tiss/schemas",
    );
    assert.ok(res.result!.body!.bodyId.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(res.result!.body!.bodyId.includes("<ans:consulta"));
    assert.ok(
      res.result!.body!.bodyId.includes('xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas"'),
    );
    assert.ok(
      res.result!.body!.bodyId.includes("<ans:numeroCarteira>1234567890</ans:numeroCarteira>"),
    );
  });

  it("2. XML vazio sem autoFillResult gera consulta com placeholders", async () => {
    const port = new RealTissXMLTISSRuntimeAdapter();
    const res = await port.prepareXMLDocument({
      documentId: "xml-empty-01",
      xmlContext: { kind: "canonical-xml-tiss-context" },
    });

    assert.equal(res.ok, true);
    assert.equal(res.result!.status, "generated");
    assert.ok(res.result!.body!.bodyId.includes("<ans:consulta"));
    assert.ok(res.result!.body!.bodyId.includes("<ans:numeroCarteira>"));
    assert.ok(res.result!.body!.bodyId.includes("</ans:numeroCarteira>"));
  });

  it("3. XML inválido: guia não suportada (internacao) gera XML bem-formado mas sem estrutura de internação", async () => {
    const port = new RealTissXMLTISSRuntimeAdapter();
    const res = await port.prepareXMLDocument({
      documentId: "xml-invalid-01",
      xmlContext: {
        kind: "canonical-xml-tiss-context",
        autoFillResult: sampleAutoFillResult({
          guideType: "internacao",
          fields: [{ fieldId: "CARTEIRA", label: "9999999999" }],
        }),
      } as any,
    });

    assert.equal(res.ok, true);
    assert.equal(res.result!.metadata!.guideType, "internacao");
    assert.ok(res.result!.body!.bodyId.includes("<ans:internacao"));
    assert.ok(!res.result!.body!.bodyId.includes("<ans:internacao><ans:diagnostico>"));
    assert.ok(
      res.result!.body!.bodyId.includes("<ans:numeroCarteira>9999999999</ans:numeroCarteira>"),
    );
  });

  it("4. Múltiplas guias / campos adicionais mantêm XML bem-formado", async () => {
    const port = new RealTissXMLTISSRuntimeAdapter();
    const manyFields = [
      { fieldId: "BENEFICIARIO", label: "Maria" },
      { fieldId: "CARTEIRA", label: "1111111111" },
      { fieldId: "ATENDIMENTO", label: "2026-08-13" },
      { fieldId: "EXTRA_1", label: "extra-1" },
      { fieldId: "EXTRA_2", label: "extra-2" },
    ];
    const res = await port.prepareXMLDocument({
      documentId: "xml-multi-01",
      xmlContext: {
        kind: "canonical-xml-tiss-context",
        autoFillResult: sampleAutoFillResult({ fields: manyFields }),
      } as any,
    });

    assert.equal(res.ok, true);
    assert.ok(res.result!.body!.bodyId.includes("<ans:consulta"));
    assert.ok(res.result!.body!.bodyId.includes("1111111111"));
    assert.ok(res.result!.body!.bodyId.includes("2026-08-13"));
  });

  it("5. Caracteres especiais são escapados corretamente", async () => {
    const port = new RealTissXMLTISSRuntimeAdapter();
    const res = await port.prepareXMLDocument({
      documentId: "xml-escape-01",
      xmlContext: {
        kind: "canonical-xml-tiss-context",
        autoFillResult: sampleAutoFillResult({
          fields: [
            { fieldId: "BENEFICIARIO", label: "A <B> C & D \"E\" F 'G'" },
            { fieldId: "CARTEIRA", label: "2222222222" },
            { fieldId: "ATENDIMENTO", label: "2026-08-14" },
          ],
        }),
      } as any,
    });

    const body = res.result!.body!.bodyId;
    assert.equal(res.ok, true);
    assert.ok(!body.includes("A <B> C & D \"E\" F 'G'"));
    assert.ok(body.includes("A &lt;B&gt; C &amp; D &quot;E&quot; F &apos;G&apos;"));
  });

  it("6. UTF-8 é preservado", async () => {
    const port = new RealTissXMLTISSRuntimeAdapter();
    const res = await port.prepareXMLDocument({
      documentId: "xml-utf8-01",
      xmlContext: {
        kind: "canonical-xml-tiss-context",
        autoFillResult: sampleAutoFillResult({
          fields: [
            { fieldId: "BENEFICIARIO", label: "João José Müller Ção" },
            { fieldId: "CARTEIRA", label: "3333333333" },
            { fieldId: "ATENDIMENTO", label: "2026-08-15" },
          ],
        }),
      } as any,
    });

    assert.equal(res.ok, true);
    assert.ok(res.result!.body!.bodyId.includes("João José Müller Ção"));
    assert.ok(res.result!.body!.bodyId.includes('encoding="UTF-8"'));
  });

  it("7. Schema version ANS 3.05.00", async () => {
    const port = new RealTissXMLTISSRuntimeAdapter();
    const res = await port.prepareXMLDocument({
      documentId: "xml-schema-01",
      xmlContext: {
        kind: "canonical-xml-tiss-context",
        autoFillResult: sampleAutoFillResult({
          fields: [{ fieldId: "CARTEIRA", label: "4444444444" }],
        }),
      } as any,
    });

    assert.equal(res.ok, true);
    assert.equal(res.result!.metadata!.tissVersion!.versionId, "3.05.00");
    assert.equal(res.result!.metadata!.tissVersion!.schemas![0].versionId, "3.05.00");
    assert.equal(res.result!.metadata!.tissVersion!.namespaces![0].versionId, "3.05.00");
  });

  it("8. Serialização: documento único com prolog e fechamento correto", async () => {
    const port = new RealTissXMLTISSRuntimeAdapter();
    const res = await port.prepareXMLDocument({
      documentId: "xml-serial-01",
      xmlContext: {
        kind: "canonical-xml-tiss-context",
        autoFillResult: sampleAutoFillResult({
          fields: [{ fieldId: "CARTEIRA", label: "5555555555" }],
        }),
      } as any,
    });

    const body = res.result!.body!.bodyId;
    assert.equal(res.ok, true);
    assert.ok(/^<\?xml[^?]*\?>/.test(body));
    const rootOpen = body.match(/<ans:([a-zA-Z-]+)/);
    const rootClose = body.match(/<\/ans:([a-zA-Z-]+)>\s*$/);
    assert.ok(rootOpen, "procura tag raiz de abertura");
    assert.ok(rootClose, "procura tag raiz de fechamento");
    assert.equal(rootOpen![1], rootClose![1]);
  });

  it("9. Documento grande com conteúdo extenso", async () => {
    const port = new RealTissXMLTISSRuntimeAdapter();
    const bigBeneficiario = "X".repeat(10_000);
    const res = await port.prepareXMLDocument({
      documentId: "xml-large-01",
      xmlContext: {
        kind: "canonical-xml-tiss-context",
        autoFillResult: sampleAutoFillResult({
          fields: [
            { fieldId: "BENEFICIARIO", label: bigBeneficiario },
            { fieldId: "CARTEIRA", label: "6666666666" },
            { fieldId: "ATENDIMENTO", label: "2026-08-16" },
          ],
        }),
      } as any,
    });

    assert.equal(res.ok, true);
    assert.ok(res.result!.body!.bodyId.length > 10_000);
    assert.ok(res.result!.body!.bodyId.includes(bigBeneficiario));
  });

  it("10. Retry com transient failures", async () => {
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
        autoFillResult: sampleAutoFillResult({
          fields: [{ fieldId: "CARTEIRA", label: "7777777777" }],
        }),
      } as any,
    });

    assert.equal(res.ok, true);
    assert.equal(res.telemetry!.attempts, 3);
    assert.equal(res.result!.status, "generated");
  });

  it("11. Dead Letter: infraestrutura acessível sem Port novo", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-cert-dl",
      xmlTissRuntimePort: createXMLTISSRuntimePort({
        provider: "real-tiss",
      }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const invalidMessageId = "job-cert-dl:invalid";
    await runtime.getQueueRuntimePort().enqueue({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: invalidMessageId,
      payloadRef: "storage://test",
      metadata: {
        kind: "canonical-queue-metadata",
        customAttributes: {
          status: "PARSED",
          tissJobStatus: "PARSED",
          documentId: "doc-cert-dl",
          previousJobId: "job-cert-dl:parsed",
          ocrExecuted: true,
          parserExecuted: true,
          validationExecuted: true,
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
    assert.equal(result.infrastructure.deadLetterRuntime, true);
    assert.equal(result.infrastructure.retryInfrastructure, true);
    assert.equal(result.infrastructure.xmlTissRuntimePort, true);
  });

  it("12. Observability: health, providerInfo, capabilities", async () => {
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

  it("13 & 14. Throughput e latência média (1000 amostras)", async () => {
    const port = new RealTissXMLTISSRuntimeAdapter();

    const start = performance.now();
    for (let i = 0; i < SAMPLE_COUNT; i += 1) {
      const id = `xml-throughput-${i}`;
      const p = await port.prepareXMLDocument({
        documentId: id,
        xmlContext: {
          kind: "canonical-xml-tiss-context",
          autoFillResult: sampleAutoFillResult({
            fields: [
              { fieldId: "BENEFICIARIO", label: "João" },
              { fieldId: "CARTEIRA", label: `1111111111-${i}` },
              { fieldId: "ATENDIMENTO", label: "2026-08-17" },
            ],
          }),
        } as any,
      });
      assert.equal(p.ok, true);
    }
    const end = performance.now();
    const totalMs = end - start;
    const averageLatencyMs = totalMs / SAMPLE_COUNT;
    const throughputOpsPerSecond = (SAMPLE_COUNT / totalMs) * 1000;

    console.log(
      `[xml-certification] throughput=${throughputOpsPerSecond.toFixed(2)} ops/s, averageLatency=${averageLatencyMs.toFixed(4)} ms, totalMs=${totalMs.toFixed(2)}`,
    );

    assert.ok(averageLatencyMs < 1.0, `average latency too high: ${averageLatencyMs} ms`);
    assert.ok(throughputOpsPerSecond > 1000, `throughput too low: ${throughputOpsPerSecond} ops/s`);
  });

  it("15. End-to-end: VALIDATED → ENRICHED → XML_GENERATED sem Batch", async () => {
    resetEnterpriseRuntimeForTests();
    resetQueueRuntimeIdSequences();

    const runtime = createEnterpriseRuntime({
      runtimeId: "test-cert-e2e",
      xmlTissRuntimePort: createXMLTISSRuntimePort({
        provider: "real-tiss",
      }),
    });
    setEnterpriseRuntimeForTests(runtime);

    const enrichedMessageId = "job-cert-e2e:enriched";
    await runtime.getQueueRuntimePort().enqueue({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: enrichedMessageId,
      payloadRef: "storage://clinical-documents/doc-cert-e2e",
      correlationId: "corr-cert-e2e",
      metadata: {
        kind: "canonical-queue-metadata",
        sessionId: "session-cert-e2e",
        correlationId: "corr-cert-e2e",
        channel: "tiss-xml-generation",
        source: "tiss-runtime-03a",
        tags: ["tiss-runtime-03a", "tiss-job", TISS_JOB_STATUS_ENRICHED],
        customAttributes: {
          status: TISS_JOB_STATUS_ENRICHED,
          tissJobStatus: TISS_JOB_STATUS_ENRICHED,
          documentId: "doc-cert-e2e",
          sessionId: "session-cert-e2e",
          previousJobId: "job-cert-e2e:parsed",
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
    assert.equal(result.batchExecuted, false);
    assert.equal(result.protocolExecuted, false);
    assert.equal(result.persistenceExecuted, false);
    assert.equal(result.auditExecuted, false);
    assert.equal(result.enrichmentExecuted, true);
    assert.equal(result.ocrExecuted, true);
    assert.equal(result.parserExecuted, true);
    assert.equal(result.validationExecuted, true);
    assert.ok(result.job);
    assert.equal(result.job!.status, "XML_GENERATED");
    assert.equal(result.job!.correlationId, "corr-cert-e2e");
    assert.ok(result.job!.xmlDocumentId);

    const xmlResult = await runtime.getXMLTISSRuntimePort().getResult({
      documentId: result.job!.xmlDocumentId,
    });
    assert.equal(xmlResult.ok, true);
    assert.equal(xmlResult.provider, "real-tiss");
    assert.equal(xmlResult.result!.status, "generated");
    assert.ok(xmlResult.result!.body!.bodyId.includes("<ans:consulta"));
    assert.ok(xmlResult.result!.body!.bodyId.includes("<?xml"));

    const direct = await processTissXmlJob({
      getQueueRuntimePort: () => runtime.getQueueRuntimePort(),
      getXMLTISSRuntimePort: () => runtime.getXMLTISSRuntimePort(),
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      message: {
        messageId: "job-cert-e2e:direct",
        queueName: ENTERPRISE_TISS_QUEUE_NAME,
        payloadRef: "storage://clinical-documents/doc-cert-e2e-direct",
        correlationId: "corr-cert-e2e-direct",
        metadata: {
          kind: "canonical-queue-metadata",
          customAttributes: {
            status: TISS_JOB_STATUS_ENRICHED,
            tissJobStatus: TISS_JOB_STATUS_ENRICHED,
            documentId: "doc-cert-e2e-direct",
            previousJobId: "job-cert-e2e:parsed-direct",
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
      } as any,
    });

    assert.equal(direct.ok, true);
    assert.equal(direct.xmlGenerated, true);
    assert.equal(direct.queueMessage!.metadata.customAttributes.xmlExecuted, true);
    assert.equal(direct.queueMessage!.metadata.customAttributes.batchExecuted, false);
    assert.equal(direct.queueMessage!.metadata.customAttributes.protocolExecuted, false);
    assert.equal(direct.queueMessage!.metadata.customAttributes.persistenceExecuted, false);
    assert.equal(direct.queueMessage!.metadata.customAttributes.auditExecuted, false);
    assert.notEqual(direct.queueMessage!.metadata.customAttributes.completedExecuted, true);
    assert.equal(
      direct.queueMessage!.metadata.customAttributes.tissJobStatus,
      TISS_JOB_STATUS_XML_GENERATED,
    );
  });
});

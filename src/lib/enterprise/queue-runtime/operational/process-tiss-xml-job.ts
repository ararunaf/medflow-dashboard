/**
 * TISS-RUNTIME-03A — Capability XML TISS Generation operacional (única desta Sprint).
 *
 * Fluxo oficial:
 *   Job ENRICHED
 *     → Worker (consumo via QueueRuntimePort)
 *     → XMLTISSRuntimePort (prepareXMLDocument / getResult)
 *     → Job XML_GENERATED
 *     → reenqueue via QueueRuntimePort
 *
 * NÃO executa: Batch, Protocolo, Persistência, Auditoria.
 * NÃO cria Port / Gateway / Runtime / Pipeline paralelo.
 */
import type { XMLTISSRuntimePort } from "../../xml-tiss-runtime/ports/xml-tiss-runtime-port";
import type { QueueRuntimePort } from "../ports/queue-runtime-port";
import type { CanonicalQueueMessage } from "../ports/canonical";
import { ENTERPRISE_TISS_QUEUE_NAME } from "./enqueue-tiss-received-job";
import { TISS_JOB_STATUS_ENRICHED } from "./process-tiss-enrichment-job";

/** Status lógico após capability XML TISS (Discovery §4 — estágio E5 concluído). */
export const TISS_JOB_STATUS_XML_GENERATED = "XML_GENERATED" as const;

export type TissXmlJobLogicalStatus =
  | typeof TISS_JOB_STATUS_ENRICHED
  | typeof TISS_JOB_STATUS_XML_GENERATED;

export type TissXmlCompletedJob = {
  jobId: string;
  status: typeof TISS_JOB_STATUS_XML_GENERATED;
  correlationId: string | null;
  createdAt: string;
  source: string;
  queueName: string;
  previousJobId: string;
  xmlDocumentId?: string;
};

export type ProcessTissXmlJobInput = {
  getQueueRuntimePort: () => QueueRuntimePort;
  getXMLTISSRuntimePort: () => XMLTISSRuntimePort;
  /** Mensagem já claim/dequeued pelo Worker. */
  message: CanonicalQueueMessage;
  queueName: string;
};

export type ProcessTissXmlJobResult = {
  ok: boolean;
  settle: "ack" | "nack" | "nack-error";
  job?: TissXmlCompletedJob;
  queueMessage?: CanonicalQueueMessage;
  xmlGenerated: boolean;
  batchExecuted: false;
  protocolExecuted: false;
  persistenceExecuted: false;
  auditExecuted: false;
  enrichmentExecuted: boolean;
  validationExecuted: boolean;
  parserExecuted: boolean;
  ocrExecuted: boolean;
  message?: string;
  code?: string;
  xmlCode?: string;
};

function readCustomAttr(
  message: CanonicalQueueMessage,
  key: string,
): string | number | boolean | null | undefined {
  return message.metadata?.customAttributes?.[key];
}

function readTissJobStatus(message: CanonicalQueueMessage): string | null {
  const raw = readCustomAttr(message, "tissJobStatus") ?? readCustomAttr(message, "status");
  return typeof raw === "string" ? raw : null;
}

/**
 * Executa exclusivamente XML TISS sobre Job ENRICHED e reenfileira XML_GENERATED.
 * Chamado pelo Worker após dequeue — não bypassa QueueRuntimePort.
 */
export async function processTissXmlJob(
  input: ProcessTissXmlJobInput,
): Promise<ProcessTissXmlJobResult> {
  if (typeof input.getQueueRuntimePort !== "function") {
    return {
      ok: false,
      settle: "nack-error",
      xmlGenerated: false,
      batchExecuted: false,
      protocolExecuted: false,
      persistenceExecuted: false,
      auditExecuted: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_XML_JOB_MISSING_QUEUE_PORT",
      message: "getQueueRuntimePort is required (must come from getEnterpriseRuntime()).",
    };
  }
  if (typeof input.getXMLTISSRuntimePort !== "function") {
    return {
      ok: false,
      settle: "nack-error",
      xmlGenerated: false,
      batchExecuted: false,
      protocolExecuted: false,
      persistenceExecuted: false,
      auditExecuted: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_XML_JOB_MISSING_XML_TISS_PORT",
      message: "getXMLTISSRuntimePort is required (must come from getEnterpriseRuntime()).",
    };
  }

  if (input.queueName !== ENTERPRISE_TISS_QUEUE_NAME) {
    return {
      ok: true,
      settle: "ack",
      xmlGenerated: false,
      batchExecuted: false,
      protocolExecuted: false,
      persistenceExecuted: false,
      auditExecuted: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_XML_JOB_SKIPPED_NON_TISS_QUEUE",
      message: "Non-TISS queue — default Worker settle (no XML generation).",
    };
  }

  const status = readTissJobStatus(input.message);
  if (status !== TISS_JOB_STATUS_ENRICHED) {
    return {
      ok: false,
      settle: "nack",
      xmlGenerated: false,
      batchExecuted: false,
      protocolExecuted: false,
      persistenceExecuted: false,
      auditExecuted: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_XML_JOB_STATUS_NOT_ENRICHED",
      message: `XML capability consumes only ENRICHED jobs (got: ${status ?? "missing"}).`,
    };
  }

  const documentId =
    (typeof readCustomAttr(input.message, "documentId") === "string"
      ? (readCustomAttr(input.message, "documentId") as string)
      : null) ??
    input.message.metadata?.sessionId ??
    input.message.messageId;
  const sessionId =
    (typeof readCustomAttr(input.message, "sessionId") === "string"
      ? (readCustomAttr(input.message, "sessionId") as string)
      : null) ??
    input.message.metadata?.sessionId ??
    undefined;
  const source =
    (typeof input.message.metadata?.source === "string" && input.message.metadata.source.trim()
      ? input.message.metadata.source.trim()
      : null) ?? "tiss-runtime-03a";
  const correlationId =
    input.message.identity?.correlationId ?? input.message.metadata?.correlationId ?? null;

  const xmlDocumentId = `tiss-xml-doc-${input.message.messageId}`;

  const xmlPort = input.getXMLTISSRuntimePort();
  let prepareResult;
  try {
    prepareResult = await xmlPort.prepareXMLDocument({
      documentId: xmlDocumentId,
      xmlContext: {
        kind: "canonical-xml-tiss-context",
        documentId: xmlDocumentId,
        resultId: `${xmlDocumentId}:result`,
        structuralNotes: `TISS-RUNTIME-03A XML generation from ${input.message.messageId} (enriched canonical guide)`,
      },
    });
  } catch (err) {
    return {
      ok: false,
      settle: "nack-error",
      xmlGenerated: false,
      batchExecuted: false,
      protocolExecuted: false,
      persistenceExecuted: false,
      auditExecuted: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_XML_JOB_PREPARE_THREW",
      message: err instanceof Error ? err.message : "XMLTISSRuntimePort.prepareXMLDocument threw.",
    };
  }

  if (!prepareResult.ok) {
    return {
      ok: false,
      settle: "nack",
      xmlGenerated: false,
      batchExecuted: false,
      protocolExecuted: false,
      persistenceExecuted: false,
      auditExecuted: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_XML_JOB_PREPARE_FAILED",
      xmlCode: prepareResult.code,
      message: prepareResult.message ?? "XMLTISSRuntimePort.prepareXMLDocument failed.",
    };
  }

  let getResult;
  try {
    getResult = await xmlPort.getResult({ documentId: xmlDocumentId });
  } catch (err) {
    return {
      ok: false,
      settle: "nack-error",
      xmlGenerated: true,
      batchExecuted: false,
      protocolExecuted: false,
      persistenceExecuted: false,
      auditExecuted: false,
      enrichmentExecuted: true,
      validationExecuted: true,
      parserExecuted: true,
      ocrExecuted: true,
      code: "TISS_XML_JOB_GET_RESULT_THREW",
      message: err instanceof Error ? err.message : "XMLTISSRuntimePort.getResult threw.",
    };
  }

  if (!getResult.ok) {
    return {
      ok: false,
      settle: "nack",
      xmlGenerated: true,
      batchExecuted: false,
      protocolExecuted: false,
      persistenceExecuted: false,
      auditExecuted: false,
      enrichmentExecuted: true,
      validationExecuted: true,
      parserExecuted: true,
      ocrExecuted: true,
      code: "TISS_XML_JOB_GET_RESULT_FAILED",
      xmlCode: getResult.code,
      message: getResult.message ?? "XMLTISSRuntimePort.getResult failed.",
    };
  }

  const queuePort = input.getQueueRuntimePort();
  const xmlGeneratedJobId = `${input.message.messageId}:xml-generated`;
  const enqueued = await queuePort.enqueue({
    queueName: ENTERPRISE_TISS_QUEUE_NAME,
    messageId: xmlGeneratedJobId,
    payloadRef: input.message.payloadRef,
    correlationId,
    metadata: {
      kind: "canonical-queue-metadata",
      sessionId: sessionId ? String(sessionId) : undefined,
      correlationId,
      channel: input.message.metadata?.channel ?? "tiss-xml-generation",
      source,
      tags: ["tiss-runtime-03a", "tiss-job", TISS_JOB_STATUS_XML_GENERATED],
      customAttributes: {
        status: TISS_JOB_STATUS_XML_GENERATED,
        tissJobStatus: TISS_JOB_STATUS_XML_GENERATED,
        documentId: documentId != null ? String(documentId) : null,
        sessionId: sessionId != null ? String(sessionId) : null,
        previousJobId: input.message.messageId,
        xmlDocumentId,
        ocrExecuted: true,
        parserExecuted: true,
        validationExecuted: true,
        enrichmentExecuted: true,
        xmlGenerated: true,
        xmlExecuted: true,
        batchExecuted: false,
        protocolExecuted: false,
        persistenceExecuted: false,
        auditExecuted: false,
      },
    },
  });

  if (!enqueued.ok || !enqueued.queueMessage) {
    return {
      ok: false,
      settle: "nack",
      xmlGenerated: true,
      batchExecuted: false,
      protocolExecuted: false,
      persistenceExecuted: false,
      auditExecuted: false,
      enrichmentExecuted: true,
      validationExecuted: true,
      parserExecuted: true,
      ocrExecuted: true,
      code: enqueued.code ?? "TISS_XML_JOB_REENQUEUE_FAILED",
      message: enqueued.message ?? "Failed to re-enqueue XML_GENERATED via QueueRuntimePort.",
    };
  }

  const completed = enqueued.queueMessage;
  const job: TissXmlCompletedJob = {
    jobId: completed.messageId,
    status: TISS_JOB_STATUS_XML_GENERATED,
    correlationId: completed.identity?.correlationId ?? correlationId,
    createdAt: completed.registeredAt,
    source,
    queueName: enqueued.queue?.queueName ?? ENTERPRISE_TISS_QUEUE_NAME,
    previousJobId: input.message.messageId,
    xmlDocumentId,
  };

  return {
    ok: true,
    settle: "ack",
    job,
    queueMessage: completed,
    xmlGenerated: true,
    batchExecuted: false,
    protocolExecuted: false,
    persistenceExecuted: false,
    auditExecuted: false,
    enrichmentExecuted: true,
    validationExecuted: true,
    parserExecuted: true,
    ocrExecuted: true,
    code: "TISS_XML_JOB_COMPLETED",
    message:
      "TISS job XML TISS generation completed; re-enqueued as XML_GENERATED via QueueRuntimePort (Batch/Protocol/Persistence/Audit not executed).",
  };
}

export type TissXmlProcessMessageDeps = {
  getQueueRuntimePort: () => QueueRuntimePort;
  getXMLTISSRuntimePort: () => XMLTISSRuntimePort;
};

/**
 * Handler injetável no WorkerQueueConsumer (OPER-INF-W) — sem Port novo.
 */
export function createTissXmlProcessMessage(
  deps: TissXmlProcessMessageDeps,
): (ctx: {
  workerId: string;
  queueName: string;
  message: CanonicalQueueMessage;
}) => Promise<"ack" | "nack" | "nack-error"> {
  return async (ctx) => {
    const result = await processTissXmlJob({
      getQueueRuntimePort: deps.getQueueRuntimePort,
      getXMLTISSRuntimePort: deps.getXMLTISSRuntimePort,
      message: ctx.message,
      queueName: ctx.queueName,
    });
    return result.settle;
  };
}

/**
 * TISS-RUNTIME-01C — Capability Parser operacional (única desta Sprint).
 *
 * Fluxo oficial:
 *   Job OCR_COMPLETED
 *     → Worker (consumo via QueueRuntimePort)
 *     → DocumentExtractionRuntimePort (submitRequest / getResult)
 *     → Job PARSED
 *     → reenqueue via QueueRuntimePort
 *
 * NÃO executa: Validação, Enriquecimento, XML, Lote, Protocolo,
 * Persistência de domínio, Auditoria.
 * NÃO cria Port / Gateway / Runtime / Pipeline paralelo.
 */
import type { DocumentExtractionRuntimePort } from "../../document-extraction-runtime/ports/document-extraction-runtime-port";
import type { QueueRuntimePort } from "../ports/queue-runtime-port";
import type { CanonicalQueueMessage } from "../ports/canonical";
import { ENTERPRISE_TISS_QUEUE_NAME } from "./enqueue-tiss-received-job";
import { TISS_JOB_STATUS_OCR_COMPLETED } from "./process-tiss-ocr-job";

/** Status lógico após capability Parser (Discovery §4 — estágio E2 concluído). */
export const TISS_JOB_STATUS_PARSED = "PARSED" as const;

export type TissParserJobLogicalStatus =
  | typeof TISS_JOB_STATUS_OCR_COMPLETED
  | typeof TISS_JOB_STATUS_PARSED;

export type TissParserCompletedJob = {
  jobId: string;
  status: typeof TISS_JOB_STATUS_PARSED;
  correlationId: string | null;
  createdAt: string;
  source: string;
  queueName: string;
  previousJobId: string;
  parserRuntimeRequestId?: string;
};

export type ProcessTissParserJobInput = {
  getQueueRuntimePort: () => QueueRuntimePort;
  getDocumentExtractionRuntimePort: () => DocumentExtractionRuntimePort;
  /** Mensagem já claim/dequeued pelo Worker. */
  message: CanonicalQueueMessage;
  queueName: string;
};

export type ProcessTissParserJobResult = {
  ok: boolean;
  settle: "ack" | "nack" | "nack-error";
  job?: TissParserCompletedJob;
  queueMessage?: CanonicalQueueMessage;
  parserExecuted: boolean;
  validationExecuted: false;
  ocrExecuted: boolean;
  message?: string;
  code?: string;
  parserCode?: string;
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
 * Executa exclusivamente Parser sobre Job OCR_COMPLETED e reenfileira PARSED.
 * Chamado pelo Worker após dequeue — não bypassa QueueRuntimePort.
 */
export async function processTissParserJob(
  input: ProcessTissParserJobInput,
): Promise<ProcessTissParserJobResult> {
  if (typeof input.getQueueRuntimePort !== "function") {
    return {
      ok: false,
      settle: "nack-error",
      parserExecuted: false,
      validationExecuted: false,
      ocrExecuted: false,
      code: "TISS_PARSER_JOB_MISSING_QUEUE_PORT",
      message: "getQueueRuntimePort is required (must come from getEnterpriseRuntime()).",
    };
  }
  if (typeof input.getDocumentExtractionRuntimePort !== "function") {
    return {
      ok: false,
      settle: "nack-error",
      parserExecuted: false,
      validationExecuted: false,
      ocrExecuted: false,
      code: "TISS_PARSER_JOB_MISSING_EXTRACTION_PORT",
      message:
        "getDocumentExtractionRuntimePort is required (must come from getEnterpriseRuntime()).",
    };
  }

  if (input.queueName !== ENTERPRISE_TISS_QUEUE_NAME) {
    return {
      ok: true,
      settle: "ack",
      parserExecuted: false,
      validationExecuted: false,
      ocrExecuted: false,
      code: "TISS_PARSER_JOB_SKIPPED_NON_TISS_QUEUE",
      message: "Non-TISS queue — default Worker settle (no Parser).",
    };
  }

  const status = readTissJobStatus(input.message);
  if (status !== TISS_JOB_STATUS_OCR_COMPLETED) {
    return {
      ok: false,
      settle: "nack",
      parserExecuted: false,
      validationExecuted: false,
      ocrExecuted: false,
      code: "TISS_PARSER_JOB_STATUS_NOT_OCR_COMPLETED",
      message: `Parser capability consumes only OCR_COMPLETED jobs (got: ${status ?? "missing"}).`,
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
      : null) ?? "tiss-runtime-01c";
  const correlationId =
    input.message.identity?.correlationId ?? input.message.metadata?.correlationId ?? null;

  const parserRuntimeJobId = `tiss-parser-job-${input.message.messageId}`;
  const parserRuntimeRequestId = `tiss-parser-req-${input.message.messageId}`;

  const extractionPort = input.getDocumentExtractionRuntimePort();
  let submitResult;
  try {
    submitResult = await extractionPort.submitRequest({
      jobId: parserRuntimeJobId,
      requestId: parserRuntimeRequestId,
      documentId: String(documentId),
      metadata: {
        kind: "canonical-extraction-metadata",
        jobId: parserRuntimeJobId,
        requestId: parserRuntimeRequestId,
        documentId: String(documentId),
        correlationId,
        channel: input.message.metadata?.channel ?? "tiss-parser",
        tags: ["tiss-runtime-01c", "tiss-job", TISS_JOB_STATUS_OCR_COMPLETED],
        customAttributes: {
          previousJobId: input.message.messageId,
          tissJobStatus: TISS_JOB_STATUS_OCR_COMPLETED,
        },
      },
    });
  } catch (err) {
    return {
      ok: false,
      settle: "nack-error",
      parserExecuted: false,
      validationExecuted: false,
      ocrExecuted: false,
      code: "TISS_PARSER_JOB_SUBMIT_THREW",
      message:
        err instanceof Error ? err.message : "DocumentExtractionRuntimePort.submitRequest threw.",
    };
  }

  if (!submitResult.ok) {
    return {
      ok: false,
      settle: "nack",
      parserExecuted: false,
      validationExecuted: false,
      ocrExecuted: false,
      code: "TISS_PARSER_JOB_SUBMIT_FAILED",
      parserCode: submitResult.code,
      message: submitResult.message ?? "DocumentExtractionRuntimePort.submitRequest failed.",
    };
  }

  let getResult;
  try {
    getResult = await extractionPort.getResult({ requestId: parserRuntimeRequestId });
  } catch (err) {
    return {
      ok: false,
      settle: "nack-error",
      parserExecuted: true,
      validationExecuted: false,
      ocrExecuted: true,
      code: "TISS_PARSER_JOB_GET_RESULT_THREW",
      message:
        err instanceof Error ? err.message : "DocumentExtractionRuntimePort.getResult threw.",
    };
  }

  if (!getResult.ok) {
    return {
      ok: false,
      settle: "nack",
      parserExecuted: true,
      validationExecuted: false,
      ocrExecuted: true,
      code: "TISS_PARSER_JOB_GET_RESULT_FAILED",
      parserCode: getResult.code,
      message: getResult.message ?? "DocumentExtractionRuntimePort.getResult failed.",
    };
  }

  const queuePort = input.getQueueRuntimePort();
  const parsedJobId = `${input.message.messageId}:parsed`;
  const enqueued = await queuePort.enqueue({
    queueName: ENTERPRISE_TISS_QUEUE_NAME,
    messageId: parsedJobId,
    payloadRef: input.message.payloadRef,
    correlationId,
    metadata: {
      kind: "canonical-queue-metadata",
      sessionId: sessionId ? String(sessionId) : undefined,
      correlationId,
      channel: input.message.metadata?.channel ?? "tiss-parser",
      source,
      tags: ["tiss-runtime-01c", "tiss-job", TISS_JOB_STATUS_PARSED],
      customAttributes: {
        status: TISS_JOB_STATUS_PARSED,
        tissJobStatus: TISS_JOB_STATUS_PARSED,
        documentId: documentId != null ? String(documentId) : null,
        sessionId: sessionId != null ? String(sessionId) : null,
        previousJobId: input.message.messageId,
        parserRuntimeRequestId,
        ocrExecuted: true,
        parserExecuted: true,
        validationExecuted: false,
        xmlExecuted: false,
        enrichmentExecuted: false,
        batchExecuted: false,
        protocolExecuted: false,
        auditExecuted: false,
      },
    },
  });

  if (!enqueued.ok || !enqueued.queueMessage) {
    return {
      ok: false,
      settle: "nack",
      parserExecuted: true,
      validationExecuted: false,
      ocrExecuted: true,
      code: enqueued.code ?? "TISS_PARSER_JOB_REENQUEUE_FAILED",
      message: enqueued.message ?? "Failed to re-enqueue PARSED via QueueRuntimePort.",
    };
  }

  const completed = enqueued.queueMessage;
  const job: TissParserCompletedJob = {
    jobId: completed.messageId,
    status: TISS_JOB_STATUS_PARSED,
    correlationId: completed.identity?.correlationId ?? correlationId,
    createdAt: completed.registeredAt,
    source,
    queueName: enqueued.queue?.queueName ?? ENTERPRISE_TISS_QUEUE_NAME,
    previousJobId: input.message.messageId,
    parserRuntimeRequestId,
  };

  return {
    ok: true,
    settle: "ack",
    job,
    queueMessage: completed,
    parserExecuted: true,
    validationExecuted: false,
    ocrExecuted: true,
    code: "TISS_PARSER_JOB_COMPLETED",
    message:
      "TISS job Parser completed; re-enqueued as PARSED via QueueRuntimePort (Validation not executed).",
  };
}

export type TissParserProcessMessageDeps = {
  getQueueRuntimePort: () => QueueRuntimePort;
  getDocumentExtractionRuntimePort: () => DocumentExtractionRuntimePort;
};

/**
 * Handler injetável no WorkerQueueConsumer (OPER-INF-W) — sem Port novo.
 */
export function createTissParserProcessMessage(
  deps: TissParserProcessMessageDeps,
): (ctx: {
  workerId: string;
  queueName: string;
  message: CanonicalQueueMessage;
}) => Promise<"ack" | "nack" | "nack-error"> {
  return async (ctx) => {
    const result = await processTissParserJob({
      getQueueRuntimePort: deps.getQueueRuntimePort,
      getDocumentExtractionRuntimePort: deps.getDocumentExtractionRuntimePort,
      message: ctx.message,
      queueName: ctx.queueName,
    });
    return result.settle;
  };
}

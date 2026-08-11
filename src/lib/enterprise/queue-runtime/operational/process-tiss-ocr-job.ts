/**
 * TISS-RUNTIME-01B — Capability OCR operacional (única desta Sprint).
 *
 * Fluxo oficial:
 *   Job RECEIVED
 *     → Worker (consumo via QueueRuntimePort)
 *     → OCRRuntimePort.process
 *     → Job OCR_COMPLETED
 *     → reenqueue via QueueRuntimePort
 *
 * NÃO executa: Parser, Validação, Enriquecimento, XML, Lote, Protocolo,
 * Persistência de domínio, Auditoria.
 * NÃO cria Port / Gateway / Runtime / Pipeline paralelo.
 */
import type { OCRRuntimePort } from "../../ocr-runtime/ports/ocr-runtime-port";
import type { CanonicalOCRProviderReferenceId } from "../../ocr-runtime/ports/models";
import type { QueueRuntimePort } from "../ports/queue-runtime-port";
import type { CanonicalQueueMessage } from "../ports/canonical";
import { ENTERPRISE_TISS_QUEUE_NAME, TISS_JOB_STATUS_RECEIVED } from "./enqueue-tiss-received-job";

/** Status lógico após capability OCR (Discovery §4 — estágio E1 concluído). */
export const TISS_JOB_STATUS_OCR_COMPLETED = "OCR_COMPLETED" as const;

export type TissOcrJobLogicalStatus =
  | typeof TISS_JOB_STATUS_RECEIVED
  | typeof TISS_JOB_STATUS_OCR_COMPLETED;

export type TissOcrCompletedJob = {
  jobId: string;
  status: typeof TISS_JOB_STATUS_OCR_COMPLETED;
  correlationId: string | null;
  createdAt: string;
  source: string;
  queueName: string;
  previousJobId: string;
  ocrRuntimeSessionId?: string;
};

export type ProcessTissOcrJobInput = {
  getQueueRuntimePort: () => QueueRuntimePort;
  getOCRRuntimePort: () => OCRRuntimePort;
  /** Mensagem já claim/dequeued pelo Worker. */
  message: CanonicalQueueMessage;
  queueName: string;
  /** Bytes opcionais — mock OCR não exige; Azure sim. */
  fileBytes?: Uint8Array;
  contentType?: string;
  preferredProviderReference?: CanonicalOCRProviderReferenceId;
};

export type ProcessTissOcrJobResult = {
  ok: boolean;
  settle: "ack" | "nack" | "nack-error";
  job?: TissOcrCompletedJob;
  queueMessage?: CanonicalQueueMessage;
  ocrExecuted: boolean;
  parserExecuted: false;
  message?: string;
  code?: string;
  ocrCode?: string;
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
 * Executa exclusivamente OCR sobre Job RECEIVED e reenfileira OCR_COMPLETED.
 * Chamado pelo Worker após dequeue — não bypassa QueueRuntimePort.
 */
export async function processTissOcrJob(
  input: ProcessTissOcrJobInput,
): Promise<ProcessTissOcrJobResult> {
  if (typeof input.getQueueRuntimePort !== "function") {
    return {
      ok: false,
      settle: "nack-error",
      ocrExecuted: false,
      parserExecuted: false,
      code: "TISS_OCR_JOB_MISSING_QUEUE_PORT",
      message: "getQueueRuntimePort is required (must come from getEnterpriseRuntime()).",
    };
  }
  if (typeof input.getOCRRuntimePort !== "function") {
    return {
      ok: false,
      settle: "nack-error",
      ocrExecuted: false,
      parserExecuted: false,
      code: "TISS_OCR_JOB_MISSING_OCR_PORT",
      message: "getOCRRuntimePort is required (must come from getEnterpriseRuntime()).",
    };
  }

  if (input.queueName !== ENTERPRISE_TISS_QUEUE_NAME) {
    return {
      ok: true,
      settle: "ack",
      ocrExecuted: false,
      parserExecuted: false,
      code: "TISS_OCR_JOB_SKIPPED_NON_TISS_QUEUE",
      message: "Non-TISS queue — default Worker settle (no OCR).",
    };
  }

  const status = readTissJobStatus(input.message);
  if (status !== TISS_JOB_STATUS_RECEIVED) {
    return {
      ok: false,
      settle: "nack",
      ocrExecuted: false,
      parserExecuted: false,
      code: "TISS_OCR_JOB_STATUS_NOT_RECEIVED",
      message: `OCR capability consumes only RECEIVED jobs (got: ${status ?? "missing"}).`,
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
      : null) ?? "tiss-runtime-01b";
  const correlationId =
    input.message.identity?.correlationId ?? input.message.metadata?.correlationId ?? null;

  const ocrPort = input.getOCRRuntimePort();
  let ocrResult;
  try {
    ocrResult = await ocrPort.process({
      requestId: `tiss-ocr-${input.message.messageId}`,
      documentId: String(documentId),
      sessionId: sessionId ? String(sessionId) : undefined,
      correlationId: correlationId ?? undefined,
      fileBytes: input.fileBytes,
      contentType: input.contentType ?? "application/octet-stream",
      preferredProviderReference: input.preferredProviderReference,
      documentIdentityReference: {
        documentId: String(documentId),
        kind: "document",
      },
      attributes: {
        source: "tiss-runtime-01b",
        jobId: input.message.messageId,
        payloadRef: input.message.payloadRef ?? null,
        tissJobStatus: TISS_JOB_STATUS_RECEIVED,
      },
    });
  } catch (err) {
    return {
      ok: false,
      settle: "nack-error",
      ocrExecuted: false,
      parserExecuted: false,
      code: "TISS_OCR_JOB_PROCESS_THREW",
      message: err instanceof Error ? err.message : "OCRRuntimePort.process threw.",
    };
  }

  if (!ocrResult.ok) {
    return {
      ok: false,
      settle: "nack",
      ocrExecuted: false,
      parserExecuted: false,
      code: "TISS_OCR_JOB_OCR_FAILED",
      ocrCode: ocrResult.code,
      message: ocrResult.message ?? "OCRRuntimePort.process failed.",
    };
  }

  const queuePort = input.getQueueRuntimePort();
  const completedJobId = `${input.message.messageId}:ocr-completed`;
  const enqueued = await queuePort.enqueue({
    queueName: ENTERPRISE_TISS_QUEUE_NAME,
    messageId: completedJobId,
    payloadRef: input.message.payloadRef,
    correlationId,
    metadata: {
      kind: "canonical-queue-metadata",
      sessionId: sessionId ? String(sessionId) : undefined,
      correlationId,
      channel: input.message.metadata?.channel ?? "tiss-ocr",
      source,
      tags: ["tiss-runtime-01b", "tiss-job", TISS_JOB_STATUS_OCR_COMPLETED],
      customAttributes: {
        status: TISS_JOB_STATUS_OCR_COMPLETED,
        tissJobStatus: TISS_JOB_STATUS_OCR_COMPLETED,
        documentId: documentId != null ? String(documentId) : null,
        sessionId: sessionId != null ? String(sessionId) : null,
        previousJobId: input.message.messageId,
        ocrRuntimeSessionId: ocrResult.runtimeSessionId ?? null,
        ocrExecuted: true,
        parserExecuted: false,
        xmlExecuted: false,
        validationExecuted: false,
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
      ocrExecuted: true,
      parserExecuted: false,
      code: enqueued.code ?? "TISS_OCR_JOB_REENQUEUE_FAILED",
      message: enqueued.message ?? "Failed to re-enqueue OCR_COMPLETED via QueueRuntimePort.",
    };
  }

  const completed = enqueued.queueMessage;
  const job: TissOcrCompletedJob = {
    jobId: completed.messageId,
    status: TISS_JOB_STATUS_OCR_COMPLETED,
    correlationId: completed.identity?.correlationId ?? correlationId,
    createdAt: completed.registeredAt,
    source,
    queueName: enqueued.queue?.queueName ?? ENTERPRISE_TISS_QUEUE_NAME,
    previousJobId: input.message.messageId,
    ocrRuntimeSessionId: ocrResult.runtimeSessionId,
  };

  return {
    ok: true,
    settle: "ack",
    job,
    queueMessage: completed,
    ocrExecuted: true,
    parserExecuted: false,
    code: "TISS_OCR_JOB_COMPLETED",
    message:
      "TISS job OCR completed; re-enqueued as OCR_COMPLETED via QueueRuntimePort (Parser not executed).",
  };
}

export type TissOcrProcessMessageDeps = {
  getQueueRuntimePort: () => QueueRuntimePort;
  getOCRRuntimePort: () => OCRRuntimePort;
  fileBytes?: Uint8Array;
  contentType?: string;
  preferredProviderReference?: CanonicalOCRProviderReferenceId;
};

/**
 * Handler injetável no WorkerQueueConsumer (OPER-INF-W) — sem Port novo.
 */
export function createTissOcrProcessMessage(
  deps: TissOcrProcessMessageDeps,
): (ctx: {
  workerId: string;
  queueName: string;
  message: CanonicalQueueMessage;
}) => Promise<"ack" | "nack" | "nack-error"> {
  return async (ctx) => {
    const result = await processTissOcrJob({
      getQueueRuntimePort: deps.getQueueRuntimePort,
      getOCRRuntimePort: deps.getOCRRuntimePort,
      message: ctx.message,
      queueName: ctx.queueName,
      fileBytes: deps.fileBytes,
      contentType: deps.contentType,
      preferredProviderReference: deps.preferredProviderReference,
    });
    return result.settle;
  };
}

/**
 * TISS-RUNTIME-02A — Capability Validation operacional (única desta Sprint).
 *
 * Fluxo oficial:
 *   Job PARSED
 *     → Worker (consumo via QueueRuntimePort)
 *     → ValidationRuntimePort (submitRequest / getResult)
 *     → Job VALIDATED
 *     → reenqueue via QueueRuntimePort
 *
 * NÃO executa: Enriquecimento, XML, Lote, Protocolo, Persistência, Auditoria.
 * NÃO cria Port / Gateway / Runtime / Pipeline paralelo.
 */
import type { ValidationRuntimePort } from "../../validation-runtime/ports/validation-runtime-port";
import type { QueueRuntimePort } from "../ports/queue-runtime-port";
import type { CanonicalQueueMessage } from "../ports/canonical";
import { ENTERPRISE_TISS_QUEUE_NAME } from "./enqueue-tiss-received-job";
import { TISS_JOB_STATUS_PARSED } from "./process-tiss-parser-job";

/** Status lógico após capability Validation (Discovery §4 — estágio E3 concluído). */
export const TISS_JOB_STATUS_VALIDATED = "VALIDATED" as const;

export type TissValidationJobLogicalStatus =
  | typeof TISS_JOB_STATUS_PARSED
  | typeof TISS_JOB_STATUS_VALIDATED;

export type TissValidationCompletedJob = {
  jobId: string;
  status: typeof TISS_JOB_STATUS_VALIDATED;
  correlationId: string | null;
  createdAt: string;
  source: string;
  queueName: string;
  previousJobId: string;
  validationRuntimeRequestId?: string;
};

export type ProcessTissValidationJobInput = {
  getQueueRuntimePort: () => QueueRuntimePort;
  getValidationRuntimePort: () => ValidationRuntimePort;
  /** Mensagem já claim/dequeued pelo Worker. */
  message: CanonicalQueueMessage;
  queueName: string;
};

export type ProcessTissValidationJobResult = {
  ok: boolean;
  settle: "ack" | "nack" | "nack-error";
  job?: TissValidationCompletedJob;
  queueMessage?: CanonicalQueueMessage;
  validationExecuted: boolean;
  enrichmentExecuted: false;
  parserExecuted: boolean;
  message?: string;
  code?: string;
  validationCode?: string;
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
 * Executa exclusivamente Validation sobre Job PARSED e reenfileira VALIDATED.
 * Chamado pelo Worker após dequeue — não bypassa QueueRuntimePort.
 */
export async function processTissValidationJob(
  input: ProcessTissValidationJobInput,
): Promise<ProcessTissValidationJobResult> {
  if (typeof input.getQueueRuntimePort !== "function") {
    return {
      ok: false,
      settle: "nack-error",
      validationExecuted: false,
      enrichmentExecuted: false,
      parserExecuted: false,
      code: "TISS_VALIDATION_JOB_MISSING_QUEUE_PORT",
      message: "getQueueRuntimePort is required (must come from getEnterpriseRuntime()).",
    };
  }
  if (typeof input.getValidationRuntimePort !== "function") {
    return {
      ok: false,
      settle: "nack-error",
      validationExecuted: false,
      enrichmentExecuted: false,
      parserExecuted: false,
      code: "TISS_VALIDATION_JOB_MISSING_VALIDATION_PORT",
      message: "getValidationRuntimePort is required (must come from getEnterpriseRuntime()).",
    };
  }

  if (input.queueName !== ENTERPRISE_TISS_QUEUE_NAME) {
    return {
      ok: true,
      settle: "ack",
      validationExecuted: false,
      enrichmentExecuted: false,
      parserExecuted: false,
      code: "TISS_VALIDATION_JOB_SKIPPED_NON_TISS_QUEUE",
      message: "Non-TISS queue — default Worker settle (no Validation).",
    };
  }

  const status = readTissJobStatus(input.message);
  if (status !== TISS_JOB_STATUS_PARSED) {
    return {
      ok: false,
      settle: "nack",
      validationExecuted: false,
      enrichmentExecuted: false,
      parserExecuted: false,
      code: "TISS_VALIDATION_JOB_STATUS_NOT_PARSED",
      message: `Validation capability consumes only PARSED jobs (got: ${status ?? "missing"}).`,
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
      : null) ?? "tiss-runtime-02a";
  const correlationId =
    input.message.identity?.correlationId ?? input.message.metadata?.correlationId ?? null;

  const validationRuntimeJobId = `tiss-validation-job-${input.message.messageId}`;
  const validationRuntimeRequestId = `tiss-validation-req-${input.message.messageId}`;

  const validationPort = input.getValidationRuntimePort();
  let submitResult;
  try {
    submitResult = await validationPort.submitRequest({
      jobId: validationRuntimeJobId,
      requestId: validationRuntimeRequestId,
      documentId: String(documentId),
      metadata: {
        kind: "canonical-validation-metadata",
        jobId: validationRuntimeJobId,
        requestId: validationRuntimeRequestId,
        documentId: String(documentId),
        correlationId,
        channel: input.message.metadata?.channel ?? "tiss-validation",
        tags: ["tiss-runtime-02a", "tiss-job", TISS_JOB_STATUS_PARSED],
        customAttributes: {
          previousJobId: input.message.messageId,
          tissJobStatus: TISS_JOB_STATUS_PARSED,
        },
      },
    });
  } catch (err) {
    return {
      ok: false,
      settle: "nack-error",
      validationExecuted: false,
      enrichmentExecuted: false,
      parserExecuted: false,
      code: "TISS_VALIDATION_JOB_SUBMIT_THREW",
      message: err instanceof Error ? err.message : "ValidationRuntimePort.submitRequest threw.",
    };
  }

  if (!submitResult.ok) {
    return {
      ok: false,
      settle: "nack",
      validationExecuted: false,
      enrichmentExecuted: false,
      parserExecuted: false,
      code: "TISS_VALIDATION_JOB_SUBMIT_FAILED",
      validationCode: submitResult.code,
      message: submitResult.message ?? "ValidationRuntimePort.submitRequest failed.",
    };
  }

  let getResult;
  try {
    getResult = await validationPort.getResult({ requestId: validationRuntimeRequestId });
  } catch (err) {
    return {
      ok: false,
      settle: "nack-error",
      validationExecuted: true,
      enrichmentExecuted: false,
      parserExecuted: true,
      code: "TISS_VALIDATION_JOB_GET_RESULT_THREW",
      message: err instanceof Error ? err.message : "ValidationRuntimePort.getResult threw.",
    };
  }

  if (!getResult.ok) {
    return {
      ok: false,
      settle: "nack",
      validationExecuted: true,
      enrichmentExecuted: false,
      parserExecuted: true,
      code: "TISS_VALIDATION_JOB_GET_RESULT_FAILED",
      validationCode: getResult.code,
      message: getResult.message ?? "ValidationRuntimePort.getResult failed.",
    };
  }

  const queuePort = input.getQueueRuntimePort();
  const validatedJobId = `${input.message.messageId}:validated`;
  const enqueued = await queuePort.enqueue({
    queueName: ENTERPRISE_TISS_QUEUE_NAME,
    messageId: validatedJobId,
    payloadRef: input.message.payloadRef,
    correlationId,
    metadata: {
      kind: "canonical-queue-metadata",
      sessionId: sessionId ? String(sessionId) : undefined,
      correlationId,
      channel: input.message.metadata?.channel ?? "tiss-validation",
      source,
      tags: ["tiss-runtime-02a", "tiss-job", TISS_JOB_STATUS_VALIDATED],
      customAttributes: {
        status: TISS_JOB_STATUS_VALIDATED,
        tissJobStatus: TISS_JOB_STATUS_VALIDATED,
        documentId: documentId != null ? String(documentId) : null,
        sessionId: sessionId != null ? String(sessionId) : null,
        previousJobId: input.message.messageId,
        validationRuntimeRequestId,
        ocrExecuted: true,
        parserExecuted: true,
        validationExecuted: true,
        enrichmentExecuted: false,
        xmlExecuted: false,
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
      validationExecuted: true,
      enrichmentExecuted: false,
      parserExecuted: true,
      code: enqueued.code ?? "TISS_VALIDATION_JOB_REENQUEUE_FAILED",
      message: enqueued.message ?? "Failed to re-enqueue VALIDATED via QueueRuntimePort.",
    };
  }

  const completed = enqueued.queueMessage;
  const job: TissValidationCompletedJob = {
    jobId: completed.messageId,
    status: TISS_JOB_STATUS_VALIDATED,
    correlationId: completed.identity?.correlationId ?? correlationId,
    createdAt: completed.registeredAt,
    source,
    queueName: enqueued.queue?.queueName ?? ENTERPRISE_TISS_QUEUE_NAME,
    previousJobId: input.message.messageId,
    validationRuntimeRequestId,
  };

  return {
    ok: true,
    settle: "ack",
    job,
    queueMessage: completed,
    validationExecuted: true,
    enrichmentExecuted: false,
    parserExecuted: true,
    code: "TISS_VALIDATION_JOB_COMPLETED",
    message:
      "TISS job Validation completed; re-enqueued as VALIDATED via QueueRuntimePort (Enrichment not executed).",
  };
}

export type TissValidationProcessMessageDeps = {
  getQueueRuntimePort: () => QueueRuntimePort;
  getValidationRuntimePort: () => ValidationRuntimePort;
};

/**
 * Handler injetável no WorkerQueueConsumer (OPER-INF-W) — sem Port novo.
 */
export function createTissValidationProcessMessage(
  deps: TissValidationProcessMessageDeps,
): (ctx: {
  workerId: string;
  queueName: string;
  message: CanonicalQueueMessage;
}) => Promise<"ack" | "nack" | "nack-error"> {
  return async (ctx) => {
    const result = await processTissValidationJob({
      getQueueRuntimePort: deps.getQueueRuntimePort,
      getValidationRuntimePort: deps.getValidationRuntimePort,
      message: ctx.message,
      queueName: ctx.queueName,
    });
    return result.settle;
  };
}

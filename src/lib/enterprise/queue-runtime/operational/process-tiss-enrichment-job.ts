/**
 * TISS-RUNTIME-02B — Capability Enrichment operacional (única desta Sprint).
 *
 * Fluxo oficial:
 *   Job VALIDATED
 *     → Worker (consumo via QueueRuntimePort)
 *     → AutoFillRuntimePort (prepareAutoFill / getResult)
 *     → Job ENRICHED
 *     → reenqueue via QueueRuntimePort
 *
 * NÃO executa: XML, Lote, Protocolo, Persistência, Auditoria.
 * NÃO cria Port / Gateway / Runtime / Pipeline paralelo.
 */
import type { AutoFillRuntimePort } from "../../auto-fill-runtime/ports/auto-fill-runtime-port";
import type { QueueRuntimePort } from "../ports/queue-runtime-port";
import type { CanonicalQueueMessage } from "../ports/canonical";
import { ENTERPRISE_TISS_QUEUE_NAME } from "./enqueue-tiss-received-job";
import { TISS_JOB_STATUS_VALIDATED } from "./process-tiss-validation-job";

/** Status lógico após capability Enrichment (Discovery §4 — estágio E4 concluído). */
export const TISS_JOB_STATUS_ENRICHED = "ENRICHED" as const;

export type TissEnrichmentJobLogicalStatus =
  | typeof TISS_JOB_STATUS_VALIDATED
  | typeof TISS_JOB_STATUS_ENRICHED;

export type TissEnrichmentCompletedJob = {
  jobId: string;
  status: typeof TISS_JOB_STATUS_ENRICHED;
  correlationId: string | null;
  createdAt: string;
  source: string;
  queueName: string;
  previousJobId: string;
  autoFillId?: string;
};

export type ProcessTissEnrichmentJobInput = {
  getQueueRuntimePort: () => QueueRuntimePort;
  getAutoFillRuntimePort: () => AutoFillRuntimePort;
  /** Mensagem já claim/dequeued pelo Worker. */
  message: CanonicalQueueMessage;
  queueName: string;
};

export type ProcessTissEnrichmentJobResult = {
  ok: boolean;
  settle: "ack" | "nack" | "nack-error";
  job?: TissEnrichmentCompletedJob;
  queueMessage?: CanonicalQueueMessage;
  enrichmentExecuted: boolean;
  xmlExecuted: false;
  validationExecuted: boolean;
  parserExecuted: boolean;
  ocrExecuted: boolean;
  message?: string;
  code?: string;
  enrichmentCode?: string;
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
 * Executa exclusivamente Enrichment sobre Job VALIDATED e reenfileira ENRICHED.
 * Chamado pelo Worker após dequeue — não bypassa QueueRuntimePort.
 */
export async function processTissEnrichmentJob(
  input: ProcessTissEnrichmentJobInput,
): Promise<ProcessTissEnrichmentJobResult> {
  if (typeof input.getQueueRuntimePort !== "function") {
    return {
      ok: false,
      settle: "nack-error",
      enrichmentExecuted: false,
      xmlExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_ENRICHMENT_JOB_MISSING_QUEUE_PORT",
      message: "getQueueRuntimePort is required (must come from getEnterpriseRuntime()).",
    };
  }
  if (typeof input.getAutoFillRuntimePort !== "function") {
    return {
      ok: false,
      settle: "nack-error",
      enrichmentExecuted: false,
      xmlExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_ENRICHMENT_JOB_MISSING_AUTO_FILL_PORT",
      message: "getAutoFillRuntimePort is required (must come from getEnterpriseRuntime()).",
    };
  }

  if (input.queueName !== ENTERPRISE_TISS_QUEUE_NAME) {
    return {
      ok: true,
      settle: "ack",
      enrichmentExecuted: false,
      xmlExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_ENRICHMENT_JOB_SKIPPED_NON_TISS_QUEUE",
      message: "Non-TISS queue — default Worker settle (no Enrichment).",
    };
  }

  const status = readTissJobStatus(input.message);
  if (status !== TISS_JOB_STATUS_VALIDATED) {
    return {
      ok: false,
      settle: "nack",
      enrichmentExecuted: false,
      xmlExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_ENRICHMENT_JOB_STATUS_NOT_VALIDATED",
      message: `Enrichment capability consumes only VALIDATED jobs (got: ${status ?? "missing"}).`,
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
      : null) ?? "tiss-runtime-02b";
  const correlationId =
    input.message.identity?.correlationId ?? input.message.metadata?.correlationId ?? null;

  const autoFillId = `tiss-enrichment-${input.message.messageId}`;

  const autoFillPort = input.getAutoFillRuntimePort();
  let prepareResult;
  try {
    prepareResult = await autoFillPort.prepareAutoFill({
      autoFillId,
      autoFillContext: {
        kind: "canonical-auto-fill-context",
        structuralNotes: `TISS-RUNTIME-02B enrichment for ${input.message.messageId} (validated)`,
      },
    });
  } catch (err) {
    return {
      ok: false,
      settle: "nack-error",
      enrichmentExecuted: false,
      xmlExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_ENRICHMENT_JOB_PREPARE_THREW",
      message: err instanceof Error ? err.message : "AutoFillRuntimePort.prepareAutoFill threw.",
    };
  }

  if (!prepareResult.ok) {
    return {
      ok: false,
      settle: "nack",
      enrichmentExecuted: false,
      xmlExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_ENRICHMENT_JOB_PREPARE_FAILED",
      enrichmentCode: prepareResult.code,
      message: prepareResult.message ?? "AutoFillRuntimePort.prepareAutoFill failed.",
    };
  }

  let getResult;
  try {
    getResult = await autoFillPort.getResult({ autoFillId });
  } catch (err) {
    return {
      ok: false,
      settle: "nack-error",
      enrichmentExecuted: true,
      xmlExecuted: false,
      validationExecuted: true,
      parserExecuted: true,
      ocrExecuted: true,
      code: "TISS_ENRICHMENT_JOB_GET_RESULT_THREW",
      message: err instanceof Error ? err.message : "AutoFillRuntimePort.getResult threw.",
    };
  }

  if (!getResult.ok) {
    return {
      ok: false,
      settle: "nack",
      enrichmentExecuted: true,
      xmlExecuted: false,
      validationExecuted: true,
      parserExecuted: true,
      ocrExecuted: true,
      code: "TISS_ENRICHMENT_JOB_GET_RESULT_FAILED",
      enrichmentCode: getResult.code,
      message: getResult.message ?? "AutoFillRuntimePort.getResult failed.",
    };
  }

  const queuePort = input.getQueueRuntimePort();
  const enrichedJobId = `${input.message.messageId}:enriched`;
  const enqueued = await queuePort.enqueue({
    queueName: ENTERPRISE_TISS_QUEUE_NAME,
    messageId: enrichedJobId,
    payloadRef: input.message.payloadRef,
    correlationId,
    metadata: {
      kind: "canonical-queue-metadata",
      sessionId: sessionId ? String(sessionId) : undefined,
      correlationId,
      channel: input.message.metadata?.channel ?? "tiss-enrichment",
      source,
      tags: ["tiss-runtime-02b", "tiss-job", TISS_JOB_STATUS_ENRICHED],
      customAttributes: {
        status: TISS_JOB_STATUS_ENRICHED,
        tissJobStatus: TISS_JOB_STATUS_ENRICHED,
        documentId: documentId != null ? String(documentId) : null,
        sessionId: sessionId != null ? String(sessionId) : null,
        previousJobId: input.message.messageId,
        autoFillId,
        ocrExecuted: true,
        parserExecuted: true,
        validationExecuted: true,
        enrichmentExecuted: true,
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
      enrichmentExecuted: true,
      xmlExecuted: false,
      validationExecuted: true,
      parserExecuted: true,
      ocrExecuted: true,
      code: enqueued.code ?? "TISS_ENRICHMENT_JOB_REENQUEUE_FAILED",
      message: enqueued.message ?? "Failed to re-enqueue ENRICHED via QueueRuntimePort.",
    };
  }

  const completed = enqueued.queueMessage;
  const job: TissEnrichmentCompletedJob = {
    jobId: completed.messageId,
    status: TISS_JOB_STATUS_ENRICHED,
    correlationId: completed.identity?.correlationId ?? correlationId,
    createdAt: completed.registeredAt,
    source,
    queueName: enqueued.queue?.queueName ?? ENTERPRISE_TISS_QUEUE_NAME,
    previousJobId: input.message.messageId,
    autoFillId,
  };

  return {
    ok: true,
    settle: "ack",
    job,
    queueMessage: completed,
    enrichmentExecuted: true,
    xmlExecuted: false,
    validationExecuted: true,
    parserExecuted: true,
    ocrExecuted: true,
    code: "TISS_ENRICHMENT_JOB_COMPLETED",
    message:
      "TISS job Enrichment completed; re-enqueued as ENRICHED via QueueRuntimePort (XML not executed).",
  };
}

export type TissEnrichmentProcessMessageDeps = {
  getQueueRuntimePort: () => QueueRuntimePort;
  getAutoFillRuntimePort: () => AutoFillRuntimePort;
};

/**
 * Handler injetável no WorkerQueueConsumer (OPER-INF-W) — sem Port novo.
 */
export function createTissEnrichmentProcessMessage(
  deps: TissEnrichmentProcessMessageDeps,
): (ctx: {
  workerId: string;
  queueName: string;
  message: CanonicalQueueMessage;
}) => Promise<"ack" | "nack" | "nack-error"> {
  return async (ctx) => {
    const result = await processTissEnrichmentJob({
      getQueueRuntimePort: deps.getQueueRuntimePort,
      getAutoFillRuntimePort: deps.getAutoFillRuntimePort,
      message: ctx.message,
      queueName: ctx.queueName,
    });
    return result.settle;
  };
}

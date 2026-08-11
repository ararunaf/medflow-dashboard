/**
 * TISS-RUNTIME-03B — Capability Batch Generation operacional (única desta Sprint).
 *
 * Fluxo oficial:
 *   Job XML_GENERATED
 *     → Worker (consumo via QueueRuntimePort)
 *     → BatchRuntimePort (prepareBatch / getBatch)
 *     → Job BATCH_CREATED
 *     → reenqueue via QueueRuntimePort
 *
 * NÃO executa: Protocolo, Persistência, Auditoria.
 * NÃO cria Port / Gateway / Runtime / Pipeline paralelo.
 */
import type { BatchRuntimePort } from "../../batch-runtime/ports/batch-runtime-port";
import type { QueueRuntimePort } from "../ports/queue-runtime-port";
import type { CanonicalQueueMessage } from "../ports/canonical";
import { ENTERPRISE_TISS_QUEUE_NAME } from "./enqueue-tiss-received-job";
import { TISS_JOB_STATUS_XML_GENERATED } from "./process-tiss-xml-job";

/** Status lógico após capability Batch (Discovery §4 — estágio E6 concluído). */
export const TISS_JOB_STATUS_BATCH_CREATED = "BATCH_CREATED" as const;

export type TissBatchJobLogicalStatus =
  | typeof TISS_JOB_STATUS_XML_GENERATED
  | typeof TISS_JOB_STATUS_BATCH_CREATED;

export type TissBatchCompletedJob = {
  jobId: string;
  status: typeof TISS_JOB_STATUS_BATCH_CREATED;
  correlationId: string | null;
  createdAt: string;
  source: string;
  queueName: string;
  previousJobId: string;
  batchId?: string;
};

export type ProcessTissBatchJobInput = {
  getQueueRuntimePort: () => QueueRuntimePort;
  getBatchRuntimePort: () => BatchRuntimePort;
  /** Mensagem já claim/dequeued pelo Worker. */
  message: CanonicalQueueMessage;
  queueName: string;
};

export type ProcessTissBatchJobResult = {
  ok: boolean;
  settle: "ack" | "nack" | "nack-error";
  job?: TissBatchCompletedJob;
  queueMessage?: CanonicalQueueMessage;
  batchCreated: boolean;
  protocolExecuted: false;
  persistenceExecuted: false;
  auditExecuted: false;
  xmlGenerated: boolean;
  enrichmentExecuted: boolean;
  validationExecuted: boolean;
  parserExecuted: boolean;
  ocrExecuted: boolean;
  message?: string;
  code?: string;
  batchCode?: string;
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
 * Executa exclusivamente Batch sobre Job XML_GENERATED e reenfileira BATCH_CREATED.
 * Chamado pelo Worker após dequeue — não bypassa QueueRuntimePort.
 */
export async function processTissBatchJob(
  input: ProcessTissBatchJobInput,
): Promise<ProcessTissBatchJobResult> {
  if (typeof input.getQueueRuntimePort !== "function") {
    return {
      ok: false,
      settle: "nack-error",
      batchCreated: false,
      protocolExecuted: false,
      persistenceExecuted: false,
      auditExecuted: false,
      xmlGenerated: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_BATCH_JOB_MISSING_QUEUE_PORT",
      message: "getQueueRuntimePort is required (must come from getEnterpriseRuntime()).",
    };
  }
  if (typeof input.getBatchRuntimePort !== "function") {
    return {
      ok: false,
      settle: "nack-error",
      batchCreated: false,
      protocolExecuted: false,
      persistenceExecuted: false,
      auditExecuted: false,
      xmlGenerated: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_BATCH_JOB_MISSING_BATCH_PORT",
      message: "getBatchRuntimePort is required (must come from getEnterpriseRuntime()).",
    };
  }

  if (input.queueName !== ENTERPRISE_TISS_QUEUE_NAME) {
    return {
      ok: true,
      settle: "ack",
      batchCreated: false,
      protocolExecuted: false,
      persistenceExecuted: false,
      auditExecuted: false,
      xmlGenerated: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_BATCH_JOB_SKIPPED_NON_TISS_QUEUE",
      message: "Non-TISS queue — default Worker settle (no Batch).",
    };
  }

  const status = readTissJobStatus(input.message);
  if (status !== TISS_JOB_STATUS_XML_GENERATED) {
    return {
      ok: false,
      settle: "nack",
      batchCreated: false,
      protocolExecuted: false,
      persistenceExecuted: false,
      auditExecuted: false,
      xmlGenerated: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_BATCH_JOB_STATUS_NOT_XML_GENERATED",
      message: `Batch capability consumes only XML_GENERATED jobs (got: ${status ?? "missing"}).`,
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
      : null) ?? "tiss-runtime-03b";
  const correlationId =
    input.message.identity?.correlationId ?? input.message.metadata?.correlationId ?? null;
  const xmlDocumentId =
    (typeof readCustomAttr(input.message, "xmlDocumentId") === "string"
      ? (readCustomAttr(input.message, "xmlDocumentId") as string)
      : null) ?? documentId;

  const batchId = `tiss-batch-${input.message.messageId}`;

  const batchPort = input.getBatchRuntimePort();
  let prepareResult;
  try {
    prepareResult = await batchPort.prepareBatch({
      batchName: `TISS batch for ${input.message.messageId}`,
      batchContext: {
        kind: "canonical-batch-context",
        batchId,
        contextId: batchId,
        correlationId,
        structuralNotes: `TISS-RUNTIME-03B batch created from ${input.message.messageId} (XML generated from enriched canonical guide)`,
      },
    });
  } catch (err) {
    return {
      ok: false,
      settle: "nack-error",
      batchCreated: false,
      protocolExecuted: false,
      persistenceExecuted: false,
      auditExecuted: false,
      xmlGenerated: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_BATCH_JOB_PREPARE_THREW",
      message: err instanceof Error ? err.message : "BatchRuntimePort.prepareBatch threw.",
    };
  }

  if (!prepareResult.ok) {
    return {
      ok: false,
      settle: "nack",
      batchCreated: false,
      protocolExecuted: false,
      persistenceExecuted: false,
      auditExecuted: false,
      xmlGenerated: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_BATCH_JOB_PREPARE_FAILED",
      batchCode: prepareResult.code,
      message: prepareResult.message ?? "BatchRuntimePort.prepareBatch failed.",
    };
  }

  const createdBatchId = prepareResult.manifest?.batchId ?? batchId;

  let getResult;
  try {
    getResult = await batchPort.getBatch({ batchId: createdBatchId });
  } catch (err) {
    return {
      ok: false,
      settle: "nack-error",
      batchCreated: true,
      protocolExecuted: false,
      persistenceExecuted: false,
      auditExecuted: false,
      xmlGenerated: true,
      enrichmentExecuted: true,
      validationExecuted: true,
      parserExecuted: true,
      ocrExecuted: true,
      code: "TISS_BATCH_JOB_GET_BATCH_THREW",
      message: err instanceof Error ? err.message : "BatchRuntimePort.getBatch threw.",
    };
  }

  if (!getResult.ok) {
    return {
      ok: false,
      settle: "nack",
      batchCreated: true,
      protocolExecuted: false,
      persistenceExecuted: false,
      auditExecuted: false,
      xmlGenerated: true,
      enrichmentExecuted: true,
      validationExecuted: true,
      parserExecuted: true,
      ocrExecuted: true,
      code: "TISS_BATCH_JOB_GET_BATCH_FAILED",
      batchCode: getResult.code,
      message: getResult.message ?? "BatchRuntimePort.getBatch failed.",
    };
  }

  const queuePort = input.getQueueRuntimePort();
  const batchCreatedJobId = `${input.message.messageId}:batch-created`;
  const enqueued = await queuePort.enqueue({
    queueName: ENTERPRISE_TISS_QUEUE_NAME,
    messageId: batchCreatedJobId,
    payloadRef: input.message.payloadRef,
    correlationId,
    metadata: {
      kind: "canonical-queue-metadata",
      sessionId: sessionId ? String(sessionId) : undefined,
      correlationId,
      channel: input.message.metadata?.channel ?? "tiss-batch",
      source,
      tags: ["tiss-runtime-03b", "tiss-job", TISS_JOB_STATUS_BATCH_CREATED],
      customAttributes: {
        status: TISS_JOB_STATUS_BATCH_CREATED,
        tissJobStatus: TISS_JOB_STATUS_BATCH_CREATED,
        documentId: documentId != null ? String(documentId) : null,
        sessionId: sessionId != null ? String(sessionId) : null,
        previousJobId: input.message.messageId,
        xmlDocumentId,
        batchId: createdBatchId,
        ocrExecuted: true,
        parserExecuted: true,
        validationExecuted: true,
        enrichmentExecuted: true,
        xmlGenerated: true,
        xmlExecuted: true,
        batchCreated: true,
        batchExecuted: true,
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
      batchCreated: true,
      protocolExecuted: false,
      persistenceExecuted: false,
      auditExecuted: false,
      xmlGenerated: true,
      enrichmentExecuted: true,
      validationExecuted: true,
      parserExecuted: true,
      ocrExecuted: true,
      code: enqueued.code ?? "TISS_BATCH_JOB_REENQUEUE_FAILED",
      message: enqueued.message ?? "Failed to re-enqueue BATCH_CREATED via QueueRuntimePort.",
    };
  }

  const completed = enqueued.queueMessage;
  const job: TissBatchCompletedJob = {
    jobId: completed.messageId,
    status: TISS_JOB_STATUS_BATCH_CREATED,
    correlationId: completed.identity?.correlationId ?? correlationId,
    createdAt: completed.registeredAt,
    source,
    queueName: enqueued.queue?.queueName ?? ENTERPRISE_TISS_QUEUE_NAME,
    previousJobId: input.message.messageId,
    batchId: createdBatchId,
  };

  return {
    ok: true,
    settle: "ack",
    job,
    queueMessage: completed,
    batchCreated: true,
    protocolExecuted: false,
    persistenceExecuted: false,
    auditExecuted: false,
    xmlGenerated: true,
    enrichmentExecuted: true,
    validationExecuted: true,
    parserExecuted: true,
    ocrExecuted: true,
    code: "TISS_BATCH_JOB_COMPLETED",
    message:
      "TISS job Batch created; re-enqueued as BATCH_CREATED via QueueRuntimePort (Protocol/Persistence/Audit not executed).",
  };
}

export type TissBatchProcessMessageDeps = {
  getQueueRuntimePort: () => QueueRuntimePort;
  getBatchRuntimePort: () => BatchRuntimePort;
};

/**
 * Handler injetável no WorkerQueueConsumer (OPER-INF-W) — sem Port novo.
 */
export function createTissBatchProcessMessage(
  deps: TissBatchProcessMessageDeps,
): (ctx: {
  workerId: string;
  queueName: string;
  message: CanonicalQueueMessage;
}) => Promise<"ack" | "nack" | "nack-error"> {
  return async (ctx) => {
    const result = await processTissBatchJob({
      getQueueRuntimePort: deps.getQueueRuntimePort,
      getBatchRuntimePort: deps.getBatchRuntimePort,
      message: ctx.message,
      queueName: ctx.queueName,
    });
    return result.settle;
  };
}

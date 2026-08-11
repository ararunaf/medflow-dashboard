/**
 * TISS-RUNTIME-04B — Capability Persistence operacional (única desta Sprint).
 *
 * Fluxo oficial:
 *   Job PROTOCOL_SENT
 *     → Worker (consumo via QueueRuntimePort)
 *     → PersistentQueueRuntimePort (persist) — infraestrutura canônica de persistência
 *     → Job PERSISTED
 *     → reenqueue via QueueRuntimePort
 *
 * NÃO executa: Audit, Completed.
 * NÃO cria Port / Gateway / Runtime / Pipeline paralelo.
 */
import type { PersistentQueueRuntimePort } from "../../persistent-queue-runtime/ports/persistent-queue-runtime-port";
import type { QueueRuntimePort } from "../ports/queue-runtime-port";
import type { CanonicalQueueMessage } from "../ports/canonical";
import { ENTERPRISE_TISS_QUEUE_NAME } from "./enqueue-tiss-received-job";
import { TISS_JOB_STATUS_PROTOCOL_SENT } from "./process-tiss-protocol-job";

/** Status lógico após capability Persistence (Discovery §4 — estágio E8 concluído). */
export const TISS_JOB_STATUS_PERSISTED = "PERSISTED" as const;

export type TissPersistenceJobLogicalStatus =
  | typeof TISS_JOB_STATUS_PROTOCOL_SENT
  | typeof TISS_JOB_STATUS_PERSISTED;

export type TissPersistenceCompletedJob = {
  jobId: string;
  status: typeof TISS_JOB_STATUS_PERSISTED;
  correlationId: string | null;
  createdAt: string;
  source: string;
  queueName: string;
  previousJobId: string;
};

export type ProcessTissPersistenceJobInput = {
  getQueueRuntimePort: () => QueueRuntimePort;
  getPersistentQueueRuntimePort: () => PersistentQueueRuntimePort;
  /** Mensagem já claim/dequeued pelo Worker. */
  message: CanonicalQueueMessage;
  queueName: string;
};

export type ProcessTissPersistenceJobResult = {
  ok: boolean;
  settle: "ack" | "nack" | "nack-error";
  job?: TissPersistenceCompletedJob;
  queueMessage?: CanonicalQueueMessage;
  persisted: boolean;
  auditExecuted: false;
  completedExecuted: false;
  protocolSent: boolean;
  batchCreated: boolean;
  xmlGenerated: boolean;
  enrichmentExecuted: boolean;
  validationExecuted: boolean;
  parserExecuted: boolean;
  ocrExecuted: boolean;
  message?: string;
  code?: string;
  persistenceCode?: string;
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
 * Executa exclusivamente Persistence sobre Job PROTOCOL_SENT e reenfileira PERSISTED.
 * Chamado pelo Worker após dequeue — não bypassa QueueRuntimePort.
 */
export async function processTissPersistenceJob(
  input: ProcessTissPersistenceJobInput,
): Promise<ProcessTissPersistenceJobResult> {
  if (typeof input.getQueueRuntimePort !== "function") {
    return {
      ok: false,
      settle: "nack-error",
      persisted: false,
      auditExecuted: false,
      completedExecuted: false,
      protocolSent: false,
      batchCreated: false,
      xmlGenerated: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_PERSISTENCE_JOB_MISSING_QUEUE_PORT",
      message: "getQueueRuntimePort is required (must come from getEnterpriseRuntime()).",
    };
  }
  if (typeof input.getPersistentQueueRuntimePort !== "function") {
    return {
      ok: false,
      settle: "nack-error",
      persisted: false,
      auditExecuted: false,
      completedExecuted: false,
      protocolSent: false,
      batchCreated: false,
      xmlGenerated: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_PERSISTENCE_JOB_MISSING_PERSISTENCE_PORT",
      message: "getPersistentQueueRuntimePort is required (must come from getEnterpriseRuntime()).",
    };
  }

  if (input.queueName !== ENTERPRISE_TISS_QUEUE_NAME) {
    return {
      ok: true,
      settle: "ack",
      persisted: false,
      auditExecuted: false,
      completedExecuted: false,
      protocolSent: false,
      batchCreated: false,
      xmlGenerated: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_PERSISTENCE_JOB_SKIPPED_NON_TISS_QUEUE",
      message: "Non-TISS queue — default Worker settle (no Persistence).",
    };
  }

  const status = readTissJobStatus(input.message);
  if (status !== TISS_JOB_STATUS_PROTOCOL_SENT) {
    return {
      ok: false,
      settle: "nack",
      persisted: false,
      auditExecuted: false,
      completedExecuted: false,
      protocolSent: false,
      batchCreated: false,
      xmlGenerated: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_PERSISTENCE_JOB_STATUS_NOT_PROTOCOL_SENT",
      message: `Persistence capability consumes only PROTOCOL_SENT jobs (got: ${status ?? "missing"}).`,
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
      : null) ?? "tiss-runtime-04b";
  const correlationId =
    input.message.identity?.correlationId ?? input.message.metadata?.correlationId ?? null;
  const batchId =
    (typeof readCustomAttr(input.message, "batchId") === "string"
      ? (readCustomAttr(input.message, "batchId") as string)
      : null) ?? input.message.messageId;
  const xmlDocumentId =
    (typeof readCustomAttr(input.message, "xmlDocumentId") === "string"
      ? (readCustomAttr(input.message, "xmlDocumentId") as string)
      : null) ?? documentId;
  const profileId =
    (typeof readCustomAttr(input.message, "profileId") === "string"
      ? (readCustomAttr(input.message, "profileId") as string)
      : null) ?? undefined;

  const persistencePort = input.getPersistentQueueRuntimePort();
  let persistResult;
  try {
    persistResult = await persistencePort.persist({
      queueName: ENTERPRISE_TISS_QUEUE_NAME,
      messageId: input.message.messageId,
      metadata: {
        kind: "canonical-persistent-queue-metadata",
        sessionId: sessionId ? String(sessionId) : undefined,
        correlationId,
        channel: input.message.metadata?.channel ?? "tiss-persistence",
        source,
        tags: ["tiss-runtime-04b", "tiss-job", TISS_JOB_STATUS_PERSISTED],
      },
    });
  } catch (err) {
    return {
      ok: false,
      settle: "nack-error",
      persisted: false,
      auditExecuted: false,
      completedExecuted: false,
      protocolSent: false,
      batchCreated: false,
      xmlGenerated: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_PERSISTENCE_JOB_PERSIST_THREW",
      message: err instanceof Error ? err.message : "PersistentQueueRuntimePort.persist threw.",
    };
  }

  if (!persistResult.ok) {
    return {
      ok: false,
      settle: "nack",
      persisted: false,
      auditExecuted: false,
      completedExecuted: false,
      protocolSent: false,
      batchCreated: false,
      xmlGenerated: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_PERSISTENCE_JOB_PERSIST_FAILED",
      persistenceCode: persistResult.code,
      message: persistResult.message ?? "PersistentQueueRuntimePort.persist failed.",
    };
  }

  const queuePort = input.getQueueRuntimePort();
  const persistedJobId = `${input.message.messageId}:persisted`;
  const enqueued = await queuePort.enqueue({
    queueName: ENTERPRISE_TISS_QUEUE_NAME,
    messageId: persistedJobId,
    payloadRef: input.message.payloadRef,
    correlationId,
    metadata: {
      kind: "canonical-queue-metadata",
      sessionId: sessionId ? String(sessionId) : undefined,
      correlationId,
      channel: input.message.metadata?.channel ?? "tiss-persistence",
      source,
      tags: ["tiss-runtime-04b", "tiss-job", TISS_JOB_STATUS_PERSISTED],
      customAttributes: {
        status: TISS_JOB_STATUS_PERSISTED,
        tissJobStatus: TISS_JOB_STATUS_PERSISTED,
        documentId: documentId != null ? String(documentId) : null,
        sessionId: sessionId != null ? String(sessionId) : null,
        previousJobId: input.message.messageId,
        xmlDocumentId,
        batchId,
        profileId: profileId != null ? String(profileId) : null,
        ocrExecuted: true,
        parserExecuted: true,
        validationExecuted: true,
        enrichmentExecuted: true,
        xmlGenerated: true,
        xmlExecuted: true,
        batchCreated: true,
        batchExecuted: true,
        protocolSent: true,
        protocolExecuted: true,
        protocolResolved: false,
        persisted: true,
        persistenceExecuted: true,
        auditExecuted: false,
        completedExecuted: false,
      },
    },
  });

  if (!enqueued.ok || !enqueued.queueMessage) {
    return {
      ok: false,
      settle: "nack",
      persisted: true,
      auditExecuted: false,
      completedExecuted: false,
      protocolSent: true,
      batchCreated: true,
      xmlGenerated: true,
      enrichmentExecuted: true,
      validationExecuted: true,
      parserExecuted: true,
      ocrExecuted: true,
      code: enqueued.code ?? "TISS_PERSISTENCE_JOB_REENQUEUE_FAILED",
      message: enqueued.message ?? "Failed to re-enqueue PERSISTED via QueueRuntimePort.",
    };
  }

  const completed = enqueued.queueMessage;
  const job: TissPersistenceCompletedJob = {
    jobId: completed.messageId,
    status: TISS_JOB_STATUS_PERSISTED,
    correlationId: completed.identity?.correlationId ?? correlationId,
    createdAt: completed.registeredAt,
    source,
    queueName: enqueued.queue?.queueName ?? ENTERPRISE_TISS_QUEUE_NAME,
    previousJobId: input.message.messageId,
  };

  return {
    ok: true,
    settle: "ack",
    job,
    queueMessage: completed,
    persisted: true,
    auditExecuted: false,
    completedExecuted: false,
    protocolSent: true,
    batchCreated: true,
    xmlGenerated: true,
    enrichmentExecuted: true,
    validationExecuted: true,
    parserExecuted: true,
    ocrExecuted: true,
    code: "TISS_PERSISTENCE_JOB_COMPLETED",
    message:
      "TISS job persisted; re-enqueued as PERSISTED via QueueRuntimePort (Audit/Completed not executed).",
  };
}

export type TissPersistenceProcessMessageDeps = {
  getQueueRuntimePort: () => QueueRuntimePort;
  getPersistentQueueRuntimePort: () => PersistentQueueRuntimePort;
};

/**
 * Handler injetável no WorkerQueueConsumer (OPER-INF-W) — sem Port novo.
 */
export function createTissPersistenceProcessMessage(
  deps: TissPersistenceProcessMessageDeps,
): (ctx: {
  workerId: string;
  queueName: string;
  message: CanonicalQueueMessage;
}) => Promise<"ack" | "nack" | "nack-error"> {
  return async (ctx) => {
    const result = await processTissPersistenceJob({
      getQueueRuntimePort: deps.getQueueRuntimePort,
      getPersistentQueueRuntimePort: deps.getPersistentQueueRuntimePort,
      message: ctx.message,
      queueName: ctx.queueName,
    });
    return result.settle;
  };
}

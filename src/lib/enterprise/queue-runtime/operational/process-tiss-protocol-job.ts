/**
 * TISS-RUNTIME-04A — Capability Protocol operacional (única desta Sprint).
 *
 * Fluxo oficial:
 *   Job BATCH_CREATED
 *     → Worker (consumo via QueueRuntimePort)
 *     → ProtocolRuntimePort (prepareProfile / getProfile)
 *     → Job PROTOCOL_SENT
 *     → reenqueue via QueueRuntimePort
 *
 * NÃO executa: Persistência, Auditoria.
 * NÃO cria Port / Gateway / Runtime / Pipeline paralelo.
 */
import type { ProtocolRuntimePort } from "../../protocol-runtime/ports/protocol-runtime-port";
import type { QueueRuntimePort } from "../ports/queue-runtime-port";
import type { CanonicalQueueMessage } from "../ports/canonical";
import { ENTERPRISE_TISS_QUEUE_NAME } from "./enqueue-tiss-received-job";
import { TISS_JOB_STATUS_BATCH_CREATED } from "./process-tiss-batch-job";

/** Status lógico após capability Protocol (Discovery §4 — estágio E7 concluído). */
export const TISS_JOB_STATUS_PROTOCOL_SENT = "PROTOCOL_SENT" as const;

export type TissProtocolJobLogicalStatus =
  | typeof TISS_JOB_STATUS_BATCH_CREATED
  | typeof TISS_JOB_STATUS_PROTOCOL_SENT;

export type TissProtocolCompletedJob = {
  jobId: string;
  status: typeof TISS_JOB_STATUS_PROTOCOL_SENT;
  correlationId: string | null;
  createdAt: string;
  source: string;
  queueName: string;
  previousJobId: string;
  profileId?: string;
};

export type ProcessTissProtocolJobInput = {
  getQueueRuntimePort: () => QueueRuntimePort;
  getProtocolRuntimePort: () => ProtocolRuntimePort;
  /** Mensagem já claim/dequeued pelo Worker. */
  message: CanonicalQueueMessage;
  queueName: string;
};

export type ProcessTissProtocolJobResult = {
  ok: boolean;
  settle: "ack" | "nack" | "nack-error";
  job?: TissProtocolCompletedJob;
  queueMessage?: CanonicalQueueMessage;
  protocolSent: boolean;
  protocolResolved: false;
  persistenceExecuted: false;
  auditExecuted: false;
  batchCreated: boolean;
  xmlGenerated: boolean;
  enrichmentExecuted: boolean;
  validationExecuted: boolean;
  parserExecuted: boolean;
  ocrExecuted: boolean;
  message?: string;
  code?: string;
  protocolCode?: string;
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
 * Executa exclusivamente Protocol sobre Job BATCH_CREATED e reenfileira PROTOCOL_SENT.
 * Chamado pelo Worker após dequeue — não bypassa QueueRuntimePort.
 */
export async function processTissProtocolJob(
  input: ProcessTissProtocolJobInput,
): Promise<ProcessTissProtocolJobResult> {
  if (typeof input.getQueueRuntimePort !== "function") {
    return {
      ok: false,
      settle: "nack-error",
      protocolSent: false,
      protocolResolved: false,
      persistenceExecuted: false,
      auditExecuted: false,
      batchCreated: false,
      xmlGenerated: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_PROTOCOL_JOB_MISSING_QUEUE_PORT",
      message: "getQueueRuntimePort is required (must come from getEnterpriseRuntime()).",
    };
  }
  if (typeof input.getProtocolRuntimePort !== "function") {
    return {
      ok: false,
      settle: "nack-error",
      protocolSent: false,
      protocolResolved: false,
      persistenceExecuted: false,
      auditExecuted: false,
      batchCreated: false,
      xmlGenerated: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_PROTOCOL_JOB_MISSING_PROTOCOL_PORT",
      message: "getProtocolRuntimePort is required (must come from getEnterpriseRuntime()).",
    };
  }

  if (input.queueName !== ENTERPRISE_TISS_QUEUE_NAME) {
    return {
      ok: true,
      settle: "ack",
      protocolSent: false,
      protocolResolved: false,
      persistenceExecuted: false,
      auditExecuted: false,
      batchCreated: false,
      xmlGenerated: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_PROTOCOL_JOB_SKIPPED_NON_TISS_QUEUE",
      message: "Non-TISS queue — default Worker settle (no Protocol).",
    };
  }

  const status = readTissJobStatus(input.message);
  if (status !== TISS_JOB_STATUS_BATCH_CREATED) {
    return {
      ok: false,
      settle: "nack",
      protocolSent: false,
      protocolResolved: false,
      persistenceExecuted: false,
      auditExecuted: false,
      batchCreated: false,
      xmlGenerated: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_PROTOCOL_JOB_STATUS_NOT_BATCH_CREATED",
      message: `Protocol capability consumes only BATCH_CREATED jobs (got: ${status ?? "missing"}).`,
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
      : null) ?? "tiss-runtime-04a";
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

  const protocolName = `TISS protocol for ${input.message.messageId}`;

  const protocolPort = input.getProtocolRuntimePort();
  let prepareResult;
  try {
    prepareResult = await protocolPort.prepareProfile({
      profileName: protocolName,
      protocolContext: {
        kind: "canonical-protocol-context",
        contextId: `tiss-protocol-${input.message.messageId}`,
        correlationId,
        structuralNotes: `TISS-RUNTIME-04A protocol prepared from ${input.message.messageId} (batch created from XML generated from enriched canonical guide)`,
      },
    });
  } catch (err) {
    return {
      ok: false,
      settle: "nack-error",
      protocolSent: false,
      protocolResolved: false,
      persistenceExecuted: false,
      auditExecuted: false,
      batchCreated: false,
      xmlGenerated: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_PROTOCOL_JOB_PREPARE_THREW",
      message: err instanceof Error ? err.message : "ProtocolRuntimePort.prepareProfile threw.",
    };
  }

  if (!prepareResult.ok) {
    return {
      ok: false,
      settle: "nack",
      protocolSent: false,
      protocolResolved: false,
      persistenceExecuted: false,
      auditExecuted: false,
      batchCreated: false,
      xmlGenerated: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_PROTOCOL_JOB_PREPARE_FAILED",
      protocolCode: prepareResult.code,
      message: prepareResult.message ?? "ProtocolRuntimePort.prepareProfile failed.",
    };
  }

  const createdProfileId =
    prepareResult.profile?.profileId ?? `tiss-protocol-${input.message.messageId}`;

  let getResult;
  try {
    getResult = await protocolPort.getProfile({ profileId: createdProfileId });
  } catch (err) {
    return {
      ok: false,
      settle: "nack-error",
      protocolSent: true,
      protocolResolved: false,
      persistenceExecuted: false,
      auditExecuted: false,
      batchCreated: true,
      xmlGenerated: true,
      enrichmentExecuted: true,
      validationExecuted: true,
      parserExecuted: true,
      ocrExecuted: true,
      code: "TISS_PROTOCOL_JOB_GET_PROFILE_THREW",
      message: err instanceof Error ? err.message : "ProtocolRuntimePort.getProfile threw.",
    };
  }

  if (!getResult.ok) {
    return {
      ok: false,
      settle: "nack",
      protocolSent: true,
      protocolResolved: false,
      persistenceExecuted: false,
      auditExecuted: false,
      batchCreated: true,
      xmlGenerated: true,
      enrichmentExecuted: true,
      validationExecuted: true,
      parserExecuted: true,
      ocrExecuted: true,
      code: "TISS_PROTOCOL_JOB_GET_PROFILE_FAILED",
      protocolCode: getResult.code,
      message: getResult.message ?? "ProtocolRuntimePort.getProfile failed.",
    };
  }

  const queuePort = input.getQueueRuntimePort();
  const protocolSentJobId = `${input.message.messageId}:protocol-sent`;
  const enqueued = await queuePort.enqueue({
    queueName: ENTERPRISE_TISS_QUEUE_NAME,
    messageId: protocolSentJobId,
    payloadRef: input.message.payloadRef,
    correlationId,
    metadata: {
      kind: "canonical-queue-metadata",
      sessionId: sessionId ? String(sessionId) : undefined,
      correlationId,
      channel: input.message.metadata?.channel ?? "tiss-protocol",
      source,
      tags: ["tiss-runtime-04a", "tiss-job", TISS_JOB_STATUS_PROTOCOL_SENT],
      customAttributes: {
        status: TISS_JOB_STATUS_PROTOCOL_SENT,
        tissJobStatus: TISS_JOB_STATUS_PROTOCOL_SENT,
        documentId: documentId != null ? String(documentId) : null,
        sessionId: sessionId != null ? String(sessionId) : null,
        previousJobId: input.message.messageId,
        xmlDocumentId,
        batchId,
        profileId: createdProfileId,
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
        persistenceExecuted: false,
        auditExecuted: false,
      },
    },
  });

  if (!enqueued.ok || !enqueued.queueMessage) {
    return {
      ok: false,
      settle: "nack",
      protocolSent: true,
      protocolResolved: false,
      persistenceExecuted: false,
      auditExecuted: false,
      batchCreated: true,
      xmlGenerated: true,
      enrichmentExecuted: true,
      validationExecuted: true,
      parserExecuted: true,
      ocrExecuted: true,
      code: enqueued.code ?? "TISS_PROTOCOL_JOB_REENQUEUE_FAILED",
      message: enqueued.message ?? "Failed to re-enqueue PROTOCOL_SENT via QueueRuntimePort.",
    };
  }

  const completed = enqueued.queueMessage;
  const job: TissProtocolCompletedJob = {
    jobId: completed.messageId,
    status: TISS_JOB_STATUS_PROTOCOL_SENT,
    correlationId: completed.identity?.correlationId ?? correlationId,
    createdAt: completed.registeredAt,
    source,
    queueName: enqueued.queue?.queueName ?? ENTERPRISE_TISS_QUEUE_NAME,
    previousJobId: input.message.messageId,
    profileId: createdProfileId,
  };

  return {
    ok: true,
    settle: "ack",
    job,
    queueMessage: completed,
    protocolSent: true,
    protocolResolved: false,
    persistenceExecuted: false,
    auditExecuted: false,
    batchCreated: true,
    xmlGenerated: true,
    enrichmentExecuted: true,
    validationExecuted: true,
    parserExecuted: true,
    ocrExecuted: true,
    code: "TISS_PROTOCOL_JOB_COMPLETED",
    message:
      "TISS job Protocol prepared; re-enqueued as PROTOCOL_SENT via QueueRuntimePort (Persistence/Audit not executed).",
  };
}

export type TissProtocolProcessMessageDeps = {
  getQueueRuntimePort: () => QueueRuntimePort;
  getProtocolRuntimePort: () => ProtocolRuntimePort;
};

/**
 * Handler injetável no WorkerQueueConsumer (OPER-INF-W) — sem Port novo.
 */
export function createTissProtocolProcessMessage(
  deps: TissProtocolProcessMessageDeps,
): (ctx: {
  workerId: string;
  queueName: string;
  message: CanonicalQueueMessage;
}) => Promise<"ack" | "nack" | "nack-error"> {
  return async (ctx) => {
    const result = await processTissProtocolJob({
      getQueueRuntimePort: deps.getQueueRuntimePort,
      getProtocolRuntimePort: deps.getProtocolRuntimePort,
      message: ctx.message,
      queueName: ctx.queueName,
    });
    return result.settle;
  };
}

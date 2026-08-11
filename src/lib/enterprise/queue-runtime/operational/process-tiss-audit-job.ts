/**
 * TISS-RUNTIME-05A — Capability Audit operacional (única desta Sprint).
 *
 * Fluxo oficial:
 *   Job PERSISTED
 *     → Worker (consumo via QueueRuntimePort)
 *     → AuditRuntimePort (openJob / getResult)
 *     → Job AUDITED
 *     → reenqueue via QueueRuntimePort
 *
 * NÃO executa: Completed.
 * NÃO cria Port / Gateway / Runtime / Pipeline paralelo.
 */
import type { AuditRuntimePort } from "../../audit-runtime/ports/audit-runtime-port";
import type { QueueRuntimePort } from "../ports/queue-runtime-port";
import type { CanonicalQueueMessage } from "../ports/canonical";
import { ENTERPRISE_TISS_QUEUE_NAME } from "./enqueue-tiss-received-job";
import { TISS_JOB_STATUS_PERSISTED } from "./process-tiss-persistence-job";

/** Status lógico após capability Audit (Discovery §4 — estágio E9 concluído). */
export const TISS_JOB_STATUS_AUDITED = "AUDITED" as const;

export type TissAuditJobLogicalStatus =
  | typeof TISS_JOB_STATUS_PERSISTED
  | typeof TISS_JOB_STATUS_AUDITED;

export type TissAuditCompletedJob = {
  jobId: string;
  status: typeof TISS_JOB_STATUS_AUDITED;
  correlationId: string | null;
  createdAt: string;
  source: string;
  queueName: string;
  previousJobId: string;
  auditJobId?: string;
};

export type ProcessTissAuditJobInput = {
  getQueueRuntimePort: () => QueueRuntimePort;
  getAuditRuntimePort: () => AuditRuntimePort;
  /** Mensagem já claim/dequeued pelo Worker. */
  message: CanonicalQueueMessage;
  queueName: string;
};

export type ProcessTissAuditJobResult = {
  ok: boolean;
  settle: "ack" | "nack" | "nack-error";
  job?: TissAuditCompletedJob;
  queueMessage?: CanonicalQueueMessage;
  audited: boolean;
  completedExecuted: false;
  persisted: boolean;
  protocolSent: boolean;
  batchCreated: boolean;
  xmlGenerated: boolean;
  enrichmentExecuted: boolean;
  validationExecuted: boolean;
  parserExecuted: boolean;
  ocrExecuted: boolean;
  message?: string;
  code?: string;
  auditCode?: string;
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
 * Executa exclusivamente Audit sobre Job PERSISTED e reenfileira AUDITED.
 * Chamado pelo Worker após dequeue — não bypassa QueueRuntimePort.
 */
export async function processTissAuditJob(
  input: ProcessTissAuditJobInput,
): Promise<ProcessTissAuditJobResult> {
  if (typeof input.getQueueRuntimePort !== "function") {
    return {
      ok: false,
      settle: "nack-error",
      audited: false,
      completedExecuted: false,
      persisted: false,
      protocolSent: false,
      batchCreated: false,
      xmlGenerated: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_AUDIT_JOB_MISSING_QUEUE_PORT",
      message: "getQueueRuntimePort is required (must come from getEnterpriseRuntime()).",
    };
  }
  if (typeof input.getAuditRuntimePort !== "function") {
    return {
      ok: false,
      settle: "nack-error",
      audited: false,
      completedExecuted: false,
      persisted: false,
      protocolSent: false,
      batchCreated: false,
      xmlGenerated: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_AUDIT_JOB_MISSING_AUDIT_PORT",
      message: "getAuditRuntimePort is required (must come from getEnterpriseRuntime()).",
    };
  }

  if (input.queueName !== ENTERPRISE_TISS_QUEUE_NAME) {
    return {
      ok: true,
      settle: "ack",
      audited: false,
      completedExecuted: false,
      persisted: false,
      protocolSent: false,
      batchCreated: false,
      xmlGenerated: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_AUDIT_JOB_SKIPPED_NON_TISS_QUEUE",
      message: "Non-TISS queue — default Worker settle (no Audit).",
    };
  }

  const status = readTissJobStatus(input.message);
  if (status !== TISS_JOB_STATUS_PERSISTED) {
    return {
      ok: false,
      settle: "nack",
      audited: false,
      completedExecuted: false,
      persisted: false,
      protocolSent: false,
      batchCreated: false,
      xmlGenerated: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_AUDIT_JOB_STATUS_NOT_PERSISTED",
      message: `Audit capability consumes only PERSISTED jobs (got: ${status ?? "missing"}).`,
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
      : null) ?? "tiss-runtime-05a";
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

  const auditJobId = `tiss-audit-${input.message.messageId}`;

  const auditPort = input.getAuditRuntimePort();
  let openResult;
  try {
    openResult = await auditPort.openJob({
      jobId: auditJobId,
      correlationId,
      metadata: {
        kind: "canonical-audit-metadata",
        jobId: auditJobId,
        customAttributes: {
          structuralNotes: `TISS-RUNTIME-05A audit opened from ${input.message.messageId} (persisted result from protocol prepared from batch created from XML)`,
        },
      },
      auditContext: {
        kind: "canonical-audit-context",
        jobId: auditJobId,
      },
    });
  } catch (err) {
    return {
      ok: false,
      settle: "nack-error",
      audited: false,
      completedExecuted: false,
      persisted: false,
      protocolSent: false,
      batchCreated: false,
      xmlGenerated: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_AUDIT_JOB_OPEN_THREW",
      message: err instanceof Error ? err.message : "AuditRuntimePort.openJob threw.",
    };
  }

  if (!openResult.ok) {
    return {
      ok: false,
      settle: "nack",
      audited: false,
      completedExecuted: false,
      persisted: false,
      protocolSent: false,
      batchCreated: false,
      xmlGenerated: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_AUDIT_JOB_OPEN_FAILED",
      auditCode: openResult.code,
      message: openResult.message ?? "AuditRuntimePort.openJob failed.",
    };
  }

  let getResult;
  try {
    getResult = await auditPort.getResult({ jobId: auditJobId });
  } catch (err) {
    return {
      ok: false,
      settle: "nack-error",
      audited: true,
      completedExecuted: false,
      persisted: true,
      protocolSent: true,
      batchCreated: true,
      xmlGenerated: true,
      enrichmentExecuted: true,
      validationExecuted: true,
      parserExecuted: true,
      ocrExecuted: true,
      code: "TISS_AUDIT_JOB_GET_RESULT_THREW",
      message: err instanceof Error ? err.message : "AuditRuntimePort.getResult threw.",
    };
  }

  if (!getResult.ok) {
    return {
      ok: false,
      settle: "nack",
      audited: true,
      completedExecuted: false,
      persisted: true,
      protocolSent: true,
      batchCreated: true,
      xmlGenerated: true,
      enrichmentExecuted: true,
      validationExecuted: true,
      parserExecuted: true,
      ocrExecuted: true,
      code: "TISS_AUDIT_JOB_GET_RESULT_FAILED",
      auditCode: getResult.code,
      message: getResult.message ?? "AuditRuntimePort.getResult failed.",
    };
  }

  const queuePort = input.getQueueRuntimePort();
  const auditedJobId = `${input.message.messageId}:audited`;
  const enqueued = await queuePort.enqueue({
    queueName: ENTERPRISE_TISS_QUEUE_NAME,
    messageId: auditedJobId,
    payloadRef: input.message.payloadRef,
    correlationId,
    metadata: {
      kind: "canonical-queue-metadata",
      sessionId: sessionId ? String(sessionId) : undefined,
      correlationId,
      channel: input.message.metadata?.channel ?? "tiss-audit",
      source,
      tags: ["tiss-runtime-05a", "tiss-job", TISS_JOB_STATUS_AUDITED],
      customAttributes: {
        status: TISS_JOB_STATUS_AUDITED,
        tissJobStatus: TISS_JOB_STATUS_AUDITED,
        documentId: documentId != null ? String(documentId) : null,
        sessionId: sessionId != null ? String(sessionId) : null,
        previousJobId: input.message.messageId,
        xmlDocumentId,
        batchId,
        profileId: profileId != null ? String(profileId) : null,
        auditJobId,
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
        audited: true,
        auditExecuted: true,
        completedExecuted: false,
      },
    },
  });

  if (!enqueued.ok || !enqueued.queueMessage) {
    return {
      ok: false,
      settle: "nack",
      audited: true,
      completedExecuted: false,
      persisted: true,
      protocolSent: true,
      batchCreated: true,
      xmlGenerated: true,
      enrichmentExecuted: true,
      validationExecuted: true,
      parserExecuted: true,
      ocrExecuted: true,
      code: enqueued.code ?? "TISS_AUDIT_JOB_REENQUEUE_FAILED",
      message: enqueued.message ?? "Failed to re-enqueue AUDITED via QueueRuntimePort.",
    };
  }

  const completed = enqueued.queueMessage;
  const job: TissAuditCompletedJob = {
    jobId: completed.messageId,
    status: TISS_JOB_STATUS_AUDITED,
    correlationId: completed.identity?.correlationId ?? correlationId,
    createdAt: completed.registeredAt,
    source,
    queueName: enqueued.queue?.queueName ?? ENTERPRISE_TISS_QUEUE_NAME,
    previousJobId: input.message.messageId,
    auditJobId,
  };

  return {
    ok: true,
    settle: "ack",
    job,
    queueMessage: completed,
    audited: true,
    completedExecuted: false,
    persisted: true,
    protocolSent: true,
    batchCreated: true,
    xmlGenerated: true,
    enrichmentExecuted: true,
    validationExecuted: true,
    parserExecuted: true,
    ocrExecuted: true,
    code: "TISS_AUDIT_JOB_COMPLETED",
    message:
      "TISS job Audit opened; re-enqueued as AUDITED via QueueRuntimePort (Completed not executed).",
  };
}

export type TissAuditProcessMessageDeps = {
  getQueueRuntimePort: () => QueueRuntimePort;
  getAuditRuntimePort: () => AuditRuntimePort;
};

/**
 * Handler injetável no WorkerQueueConsumer (OPER-INF-W) — sem Port novo.
 */
export function createTissAuditProcessMessage(
  deps: TissAuditProcessMessageDeps,
): (ctx: {
  workerId: string;
  queueName: string;
  message: CanonicalQueueMessage;
}) => Promise<"ack" | "nack" | "nack-error"> {
  return async (ctx) => {
    const result = await processTissAuditJob({
      getQueueRuntimePort: deps.getQueueRuntimePort,
      getAuditRuntimePort: deps.getAuditRuntimePort,
      message: ctx.message,
      queueName: ctx.queueName,
    });
    return result.settle;
  };
}

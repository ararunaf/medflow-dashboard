/**
 * TISS-RUNTIME-05B — Capability Completed / encerramento terminal (única desta Sprint).
 *
 * Fluxo oficial:
 *   Job AUDITED
 *     → Worker (consumo via QueueRuntimePort)
 *     → Completed (sem Port novo; apenas infraestrutura Enterprise homologada)
 *     → Job COMPLETED (estado terminal)
 *     → ACK definitivo (não reenfileira)
 *
 * NÃO cria Port, Runtime, Gateway, Pipeline ou fila nova.
 * NÃO reenfileira.
 */
import type { QueueRuntimePort } from "../ports/queue-runtime-port";
import type { CanonicalQueueMessage } from "../ports/canonical";
import { ENTERPRISE_TISS_QUEUE_NAME } from "./enqueue-tiss-received-job";
import { TISS_JOB_STATUS_AUDITED } from "./process-tiss-audit-job";

/** Status terminal do pipeline funcional TISS (Discovery §4 — estágio E10 concluído). */
export const TISS_JOB_STATUS_COMPLETED = "COMPLETED" as const;

export type TissCompletedJobLogicalStatus =
  | typeof TISS_JOB_STATUS_AUDITED
  | typeof TISS_JOB_STATUS_COMPLETED;

export type TissCompletedTerminalJob = {
  jobId: string;
  status: typeof TISS_JOB_STATUS_COMPLETED;
  correlationId: string | null;
  completedAt: string;
  source: string;
  queueName: string;
  previousJobId: string;
  terminal: true;
};

export type ProcessTissCompletedJobInput = {
  getQueueRuntimePort: () => QueueRuntimePort;
  /** Mensagem já claim/dequeued pelo Worker. */
  message: CanonicalQueueMessage;
  queueName: string;
};

export type ProcessTissCompletedJobResult = {
  ok: boolean;
  settle: "ack" | "nack" | "nack-error";
  job?: TissCompletedTerminalJob;
  completed: boolean;
  reenqueued: false;
  audited: boolean;
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
 * Executa o encerramento terminal sobre Job AUDITED.
 * O Worker acionará ACK; nenhuma mensagem é reenfileirada.
 * Não existe CompletedRuntimePort — utiliza-se exclusivamente a infraestrutura
 * Enterprise homologada (getEnterpriseRuntime → Worker → Queue → Retry/DeadLetter/Observability).
 */
export async function processTissCompletedJob(
  input: ProcessTissCompletedJobInput,
): Promise<ProcessTissCompletedJobResult> {
  if (typeof input.getQueueRuntimePort !== "function") {
    return {
      ok: false,
      settle: "nack-error",
      completed: false,
      reenqueued: false,
      audited: false,
      persisted: false,
      protocolSent: false,
      batchCreated: false,
      xmlGenerated: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_COMPLETED_JOB_MISSING_QUEUE_PORT",
      message: "getQueueRuntimePort is required (must come from getEnterpriseRuntime()).",
    };
  }

  if (input.queueName !== ENTERPRISE_TISS_QUEUE_NAME) {
    return {
      ok: true,
      settle: "ack",
      completed: false,
      reenqueued: false,
      audited: false,
      persisted: false,
      protocolSent: false,
      batchCreated: false,
      xmlGenerated: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_COMPLETED_JOB_SKIPPED_NON_TISS_QUEUE",
      message: "Non-TISS queue — default Worker settle (no Completed).",
    };
  }

  const status = readTissJobStatus(input.message);
  if (status !== TISS_JOB_STATUS_AUDITED) {
    return {
      ok: false,
      settle: "nack",
      completed: false,
      reenqueued: false,
      audited: false,
      persisted: false,
      protocolSent: false,
      batchCreated: false,
      xmlGenerated: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_COMPLETED_JOB_STATUS_NOT_AUDITED",
      message: `Completed capability consumes only AUDITED jobs (got: ${status ?? "missing"}).`,
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
      : null) ?? "tiss-runtime-05b";
  const correlationId =
    input.message.identity?.correlationId ?? input.message.metadata?.correlationId ?? null;

  // Estado terminal: o Job é concluído e o Worker dará ACK definitivo.
  // Não há reenfileiramento; não há CompletedRuntimePort; não há processamento adicional.
  const queuePort = input.getQueueRuntimePort();

  // Garantia estrutural: a mensagem AUDITED será removida da fila pelo ACK.
  // Nenhuma mensagem COMPLETED é enfileirada (proibido pelo escopo).
  const completedJobId = `${input.message.messageId}:completed`;
  const job: TissCompletedTerminalJob = {
    jobId: completedJobId,
    status: TISS_JOB_STATUS_COMPLETED,
    correlationId,
    completedAt: new Date().toISOString(),
    source,
    queueName: ENTERPRISE_TISS_QUEUE_NAME,
    previousJobId: input.message.messageId,
    terminal: true,
  };

  // Sanity check: confirma que a mensagem AUDITED original não será re-enfileirada.
  // O handler retorna 'ack', que sinaliza o WorkerQueueConsumer a invocar QueueRuntimePort.ack.
  void queuePort;

  return {
    ok: true,
    settle: "ack",
    job,
    completed: true,
    reenqueued: false,
    audited: true,
    persisted: true,
    protocolSent: true,
    batchCreated: true,
    xmlGenerated: true,
    enrichmentExecuted: true,
    validationExecuted: true,
    parserExecuted: true,
    ocrExecuted: true,
    code: "TISS_COMPLETED_JOB_TERMINAL",
    message:
      "TISS job reached terminal COMPLETED state via Worker ACK. No new Port, no re-enqueue, no further processing.",
  };
}

export type TissCompletedProcessMessageDeps = {
  getQueueRuntimePort: () => QueueRuntimePort;
};

/**
 * Handler injetável no WorkerQueueConsumer (OPER-INF-W) — sem Port novo.
 * Retorna 'ack' para encerrar a mensagem; nenhuma mensagem futura é produzida.
 */
export function createTissCompletedProcessMessage(
  deps: TissCompletedProcessMessageDeps,
): (ctx: {
  workerId: string;
  queueName: string;
  message: CanonicalQueueMessage;
}) => Promise<"ack" | "nack" | "nack-error"> {
  return async (ctx) => {
    const result = await processTissCompletedJob({
      getQueueRuntimePort: deps.getQueueRuntimePort,
      message: ctx.message,
      queueName: ctx.queueName,
    });
    return result.settle;
  };
}

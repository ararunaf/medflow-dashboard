/**
 * TISS-RUNTIME-01A — Entrada operacional do boletim TISS (Job RECEIVED).
 *
 * Fluxo oficial (única capability desta Sprint):
 *   Documento recebido
 *     → QueueRuntimePort.enqueue (via getEnterpriseRuntime())
 *     → Job TISS persistido
 *     → status lógico RECEIVED
 *
 * NÃO executa: OCR, Parser, XML, Validação, Enriquecimento, Lote, Protocolo, Auditoria.
 * NÃO cria Port / Gateway / Runtime / Pipeline paralelo.
 *
 * Reutiliza exclusivamente a infraestrutura INF já homologada
 * (Queue / Worker / Scheduler / Retry / Dead Letter / Observability) —
 * esta Sprint apenas enfileira; consumo OCR = TISS-RUNTIME-01B.
 */
import type { QueueRuntimePort } from "../ports/queue-runtime-port";
import type { CanonicalQueueMessage } from "../ports/canonical";

/** Fila oficial do domínio TISS no pipeline operacional. */
export const ENTERPRISE_TISS_QUEUE_NAME = "enterprise-tiss";

/** Status lógico do boletim no estágio de entrada (Discovery §4). */
export const TISS_JOB_STATUS_RECEIVED = "RECEIVED" as const;

export type TissJobLogicalStatus = typeof TISS_JOB_STATUS_RECEIVED;

/** Job TISS mínimo registrado na entrada operacional. */
export type TissReceivedJob = {
  jobId: string;
  status: TissJobLogicalStatus;
  correlationId: string | null;
  createdAt: string;
  source: string;
  queueName: string;
};

export type EnqueueTissReceivedJobInput = {
  /**
   * Obrigatório: Port obtido de getEnterpriseRuntime().getQueueRuntimePort().
   * Injeta a dependência para evitar ciclo Runtime ↔ queue-runtime.
   */
  getQueueRuntimePort: () => QueueRuntimePort;
  /** Origem do documento (ex.: document-intake, capture-upload). */
  source: string;
  correlationId?: string | null;
  sessionId?: string;
  documentId?: string;
  payloadRef?: string;
  /** Identidade do Job (= messageId na Queue). */
  jobId?: string;
  channel?: string;
};

export type EnqueueTissReceivedJobResult = {
  ok: boolean;
  job?: TissReceivedJob;
  queueMessage?: CanonicalQueueMessage;
  message?: string;
  code?: string;
};

/**
 * Registra o Job TISS com status RECEIVED via QueueRuntimePort.
 * Persistência = backend do Queue (OPER-INF-Q). Sem processamento funcional.
 */
export async function enqueueTissReceivedJob(
  input: EnqueueTissReceivedJobInput,
): Promise<EnqueueTissReceivedJobResult> {
  if (typeof input.getQueueRuntimePort !== "function") {
    return {
      ok: false,
      code: "TISS_RECEIVED_JOB_MISSING_QUEUE_PORT",
      message: "getQueueRuntimePort is required (must come from getEnterpriseRuntime()).",
    };
  }

  const source = input.source?.trim();
  if (!source) {
    return {
      ok: false,
      code: "TISS_RECEIVED_JOB_INVALID_SOURCE",
      message: "source is required for TISS RECEIVED job registration.",
    };
  }

  const queuePort = input.getQueueRuntimePort();
  const enqueued = await queuePort.enqueue({
    queueName: ENTERPRISE_TISS_QUEUE_NAME,
    messageId: input.jobId,
    payloadRef: input.payloadRef,
    correlationId: input.correlationId ?? null,
    metadata: {
      kind: "canonical-queue-metadata",
      sessionId: input.sessionId,
      correlationId: input.correlationId ?? null,
      channel: input.channel ?? "tiss-intake",
      source,
      tags: ["tiss-runtime-01a", "tiss-job", TISS_JOB_STATUS_RECEIVED],
      customAttributes: {
        status: TISS_JOB_STATUS_RECEIVED,
        tissJobStatus: TISS_JOB_STATUS_RECEIVED,
        documentId: input.documentId ?? null,
        sessionId: input.sessionId ?? null,
        /** Explicit — no functional stages run in 01A. */
        ocrExecuted: false,
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
      code: enqueued.code ?? "TISS_RECEIVED_JOB_ENQUEUE_FAILED",
      message: enqueued.message ?? "Failed to enqueue TISS RECEIVED job via QueueRuntimePort.",
    };
  }

  const message = enqueued.queueMessage;
  const job: TissReceivedJob = {
    jobId: message.messageId,
    status: TISS_JOB_STATUS_RECEIVED,
    correlationId: message.identity?.correlationId ?? input.correlationId ?? null,
    createdAt: message.registeredAt,
    source,
    queueName: enqueued.queue?.queueName ?? ENTERPRISE_TISS_QUEUE_NAME,
  };

  return {
    ok: true,
    job,
    queueMessage: message,
    code: "TISS_RECEIVED_JOB_ENQUEUED",
    message: "TISS job registered with status RECEIVED via QueueRuntimePort (no OCR/Parser/XML).",
  };
}

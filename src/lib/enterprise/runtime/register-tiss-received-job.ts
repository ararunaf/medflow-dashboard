/**
 * TISS-RUNTIME-01A — Entrypoint oficial do Job TISS RECEIVED.
 *
 * Único caminho autorizado:
 *   getEnterpriseRuntime()
 *     → QueueRuntimePort.enqueue
 *     → Job TISS (status RECEIVED)
 *
 * Reutiliza (sem substituir / sem Port novo):
 *   SchedulerRuntimePort · Retry · WorkerRuntimePort · QueueRuntimePort
 *   · Dead Letter · ObservabilityRuntimePort
 *
 * NÃO executa OCR / Parser / XML / regras TISS.
 */
import {
  enqueueTissReceivedJob,
  type EnqueueTissReceivedJobResult,
  type TissReceivedJob,
} from "../queue-runtime/operational/enqueue-tiss-received-job";
import { getEnterpriseRuntime } from "./create-enterprise-runtime";

export type RegisterTissReceivedJobInput = {
  source: string;
  correlationId?: string | null;
  sessionId?: string;
  documentId?: string;
  payloadRef?: string;
  jobId?: string;
  channel?: string;
};

export type RegisterTissReceivedJobResult = EnqueueTissReceivedJobResult & {
  entry: "getEnterpriseRuntime";
  runtimeId: string;
  /** Prova de reutilização da cadeia INF (shape) — sem execução de estágios TISS. */
  infrastructure: {
    queueRuntimePort: true;
    workerRuntimePort: true;
    schedulerRuntimePort: true;
    observabilityRuntimePort: true;
    retryInfrastructure: boolean;
    deadLetterRuntime: boolean;
  };
};

export type { TissReceivedJob };

/**
 * Registra documento como Job TISS RECEIVED via Enterprise Runtime exclusivo.
 */
export async function registerTissReceivedJob(
  input: RegisterTissReceivedJobInput,
): Promise<RegisterTissReceivedJobResult> {
  const runtime = getEnterpriseRuntime();
  const queuePort = runtime.getQueueRuntimePort();

  // Shape check — cadeia operacional oficial permanece acessível (sem consumo nesta Sprint).
  void runtime.getWorkerRuntimePort();
  void runtime.getSchedulerRuntimePort();
  void runtime.getObservabilityRuntimePort();

  const queueAdapter = queuePort as {
    getRetryInfrastructure?: () => unknown;
    getDeadLetterRuntimePort?: () => unknown;
  };
  const retryInfrastructure = typeof queueAdapter.getRetryInfrastructure === "function";
  const deadLetterRuntime = typeof queueAdapter.getDeadLetterRuntimePort === "function";

  const enqueued = await enqueueTissReceivedJob({
    getQueueRuntimePort: () => runtime.getQueueRuntimePort(),
    source: input.source,
    correlationId: input.correlationId,
    sessionId: input.sessionId,
    documentId: input.documentId,
    payloadRef: input.payloadRef,
    jobId: input.jobId,
    channel: input.channel,
  });

  return {
    ...enqueued,
    entry: "getEnterpriseRuntime",
    runtimeId: runtime.runtimeId,
    infrastructure: {
      queueRuntimePort: true,
      workerRuntimePort: true,
      schedulerRuntimePort: true,
      observabilityRuntimePort: true,
      retryInfrastructure,
      deadLetterRuntime,
    },
  };
}

/**
 * TISS-RUNTIME-01B — Entrypoint oficial: capability OCR via Enterprise Runtime.
 *
 * Único caminho autorizado:
 *   getEnterpriseRuntime()
 *     → WorkerRuntimePort.allocate (queue enterprise-tiss)
 *     → WorkerQueueConsumer (claim via QueueRuntimePort)
 *     → OCRRuntimePort.process
 *     → QueueRuntimePort.enqueue (status OCR_COMPLETED)
 *
 * Reutiliza (sem substituir / sem Port novo):
 *   SchedulerRuntimePort · Retry · WorkerRuntimePort · QueueRuntimePort
 *   · Dead Letter · ObservabilityRuntimePort · OCRRuntimePort
 *
 * NÃO executa Parser / Validação / Enriquecimento / XML / Lote / Protocolo / Auditoria.
 */
import { ENTERPRISE_TISS_QUEUE_NAME } from "../queue-runtime/operational/enqueue-tiss-received-job";
import {
  TISS_JOB_STATUS_OCR_COMPLETED,
  processTissOcrJob,
  type ProcessTissOcrJobResult,
  type TissOcrCompletedJob,
} from "../queue-runtime/operational/process-tiss-ocr-job";
import type { CanonicalOCRProviderReferenceId } from "../ocr-runtime/ports/models";
import type { DefaultWorkerRuntimeAdapter } from "../worker-runtime/adapters/default-worker-runtime-adapter";
import { getEnterpriseRuntime } from "./create-enterprise-runtime";

export type ProcessTissReceivedOcrInput = {
  /** Identidade do worker operacional (default: tiss-ocr-01b). */
  workerName?: string;
  pollIntervalMs?: number;
  waitTimeoutMs?: number;
  fileBytes?: Uint8Array;
  contentType?: string;
  preferredProviderReference?: CanonicalOCRProviderReferenceId;
};

export type ProcessTissReceivedOcrResult = {
  ok: boolean;
  entry: "getEnterpriseRuntime";
  runtimeId: string;
  job?: TissOcrCompletedJob;
  workerId?: string;
  ocrExecuted: boolean;
  parserExecuted: false;
  message?: string;
  code?: string;
  infrastructure: {
    queueRuntimePort: true;
    workerRuntimePort: true;
    schedulerRuntimePort: true;
    observabilityRuntimePort: true;
    ocrRuntimePort: true;
    retryInfrastructure: boolean;
    deadLetterRuntime: boolean;
  };
};

function asWorkerAdapter(port: unknown): DefaultWorkerRuntimeAdapter | null {
  if (
    port &&
    typeof port === "object" &&
    typeof (port as DefaultWorkerRuntimeAdapter).setProcessMessage === "function" &&
    typeof (port as DefaultWorkerRuntimeAdapter).getConsumer === "function"
  ) {
    return port as DefaultWorkerRuntimeAdapter;
  }
  return null;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Consome um Job RECEIVED via Worker oficial, executa OCR e reenfileira OCR_COMPLETED.
 * Oneshot: libera o worker após a transição (evita consumir OCR_COMPLETED antes de 01C).
 */
export async function processTissReceivedOcr(
  input: ProcessTissReceivedOcrInput = {},
): Promise<ProcessTissReceivedOcrResult> {
  const runtime = getEnterpriseRuntime();
  const queuePort = runtime.getQueueRuntimePort();
  const workerPort = runtime.getWorkerRuntimePort();

  // Shape check — cadeia operacional oficial permanece acessível.
  void runtime.getOCRRuntimePort();
  void runtime.getSchedulerRuntimePort();
  void runtime.getObservabilityRuntimePort();

  const queueAdapter = queuePort as {
    getRetryInfrastructure?: () => unknown;
    getDeadLetterRuntimePort?: () => unknown;
  };
  const retryInfrastructure = typeof queueAdapter.getRetryInfrastructure === "function";
  const deadLetterRuntime = typeof queueAdapter.getDeadLetterRuntimePort === "function";

  const infrastructure = {
    queueRuntimePort: true as const,
    workerRuntimePort: true as const,
    schedulerRuntimePort: true as const,
    observabilityRuntimePort: true as const,
    ocrRuntimePort: true as const,
    retryInfrastructure,
    deadLetterRuntime,
  };

  const adapter = asWorkerAdapter(workerPort);
  if (!adapter?.getConsumer()) {
    return {
      ok: false,
      entry: "getEnterpriseRuntime",
      runtimeId: runtime.runtimeId,
      ocrExecuted: false,
      parserExecuted: false,
      code: "TISS_OCR_WORKER_CONSUMER_UNAVAILABLE",
      message:
        "WorkerRuntimePort must expose operational WorkerQueueConsumer (OPER-INF-W) for OCR capability.",
      infrastructure,
    };
  }

  const settlement: { current: ProcessTissOcrJobResult | null } = { current: null };

  adapter.setProcessMessage(async (ctx) => {
    const result = await processTissOcrJob({
      getQueueRuntimePort: () => runtime.getQueueRuntimePort(),
      getOCRRuntimePort: () => runtime.getOCRRuntimePort(),
      message: ctx.message,
      queueName: ctx.queueName,
      fileBytes: input.fileBytes,
      contentType: input.contentType,
      preferredProviderReference: input.preferredProviderReference,
    });
    settlement.current = result;
    return result.settle;
  });

  const workerName = input.workerName?.trim() || "tiss-ocr-01b";
  const pollIntervalMs = input.pollIntervalMs ?? 20;
  const waitTimeoutMs = input.waitTimeoutMs ?? 5_000;

  let workerId: string | undefined;
  try {
    const registered = await workerPort.register({
      workerName,
      attributes: {
        capability: "tiss-ocr",
        sprint: "tiss-runtime-01b",
      },
    });
    if (!registered.ok || !registered.worker?.workerId) {
      return {
        ok: false,
        entry: "getEnterpriseRuntime",
        runtimeId: runtime.runtimeId,
        ocrExecuted: false,
        parserExecuted: false,
        code: registered.code ?? "TISS_OCR_WORKER_REGISTER_FAILED",
        message: registered.message ?? "Failed to register TISS OCR worker.",
        infrastructure,
      };
    }
    workerId = registered.worker.workerId;

    const allocated = await workerPort.allocate({
      workerId,
      attributes: {
        queueName: ENTERPRISE_TISS_QUEUE_NAME,
        pollIntervalMs,
      },
    });
    if (!allocated.ok) {
      return {
        ok: false,
        entry: "getEnterpriseRuntime",
        runtimeId: runtime.runtimeId,
        workerId,
        ocrExecuted: false,
        parserExecuted: false,
        code: allocated.code ?? "TISS_OCR_WORKER_ALLOCATE_FAILED",
        message: allocated.message ?? "Failed to allocate TISS OCR worker.",
        infrastructure,
      };
    }

    const deadline = Date.now() + waitTimeoutMs;
    while (Date.now() < deadline) {
      if (settlement.current) break;
      await sleep(Math.min(pollIntervalMs, 50));
    }

    if (!settlement.current) {
      return {
        ok: false,
        entry: "getEnterpriseRuntime",
        runtimeId: runtime.runtimeId,
        workerId,
        ocrExecuted: false,
        parserExecuted: false,
        code: "TISS_OCR_CAPABILITY_TIMEOUT",
        message: `Timed out waiting for Worker OCR settle (${waitTimeoutMs}ms).`,
        infrastructure,
      };
    }

    const settled = settlement.current;
    return {
      ok: settled.ok,
      entry: "getEnterpriseRuntime",
      runtimeId: runtime.runtimeId,
      workerId,
      job: settled.job,
      ocrExecuted: settled.ocrExecuted,
      parserExecuted: false,
      code: settled.code,
      message: settled.message,
      infrastructure,
    };
  } finally {
    if (workerId) {
      try {
        await workerPort.release({ workerId });
      } catch {
        // best-effort
      }
      try {
        await workerPort.unregister({ workerId });
      } catch {
        // best-effort
      }
    }
    adapter.setProcessMessage(undefined);
  }
}

export { TISS_JOB_STATUS_OCR_COMPLETED, ENTERPRISE_TISS_QUEUE_NAME };
export type { TissOcrCompletedJob };

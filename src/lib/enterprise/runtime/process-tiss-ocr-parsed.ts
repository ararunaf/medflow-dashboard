/**
 * TISS-RUNTIME-01C — Entrypoint oficial: capability Parser via Enterprise Runtime.
 *
 * Único caminho autorizado:
 *   getEnterpriseRuntime()
 *     → WorkerRuntimePort.allocate (queue enterprise-tiss)
 *     → WorkerQueueConsumer (claim via QueueRuntimePort)
 *     → DocumentExtractionRuntimePort (submitRequest / getResult)
 *     → QueueRuntimePort.enqueue (status PARSED)
 *
 * Reutiliza (sem substituir / sem Port novo):
 *   SchedulerRuntimePort · Retry · WorkerRuntimePort · QueueRuntimePort
 *   · Dead Letter · ObservabilityRuntimePort · DocumentExtractionRuntimePort
 *
 * NÃO executa Validação / Enriquecimento / XML / Lote / Protocolo / Auditoria.
 */
import { ENTERPRISE_TISS_QUEUE_NAME } from "../queue-runtime/operational/enqueue-tiss-received-job";
import {
  TISS_JOB_STATUS_PARSED,
  processTissParserJob,
  type ProcessTissParserJobResult,
  type TissParserCompletedJob,
} from "../queue-runtime/operational/process-tiss-parser-job";
import type { DefaultWorkerRuntimeAdapter } from "../worker-runtime/adapters/default-worker-runtime-adapter";
import { getEnterpriseRuntime } from "./create-enterprise-runtime";

export type ProcessTissOcrParsedInput = {
  /** Identidade do worker operacional (default: tiss-parser-01c). */
  workerName?: string;
  pollIntervalMs?: number;
  waitTimeoutMs?: number;
};

export type ProcessTissOcrParsedResult = {
  ok: boolean;
  entry: "getEnterpriseRuntime";
  runtimeId: string;
  job?: TissParserCompletedJob;
  workerId?: string;
  parserExecuted: boolean;
  validationExecuted: false;
  ocrExecuted: boolean;
  message?: string;
  code?: string;
  infrastructure: {
    queueRuntimePort: true;
    workerRuntimePort: true;
    schedulerRuntimePort: true;
    observabilityRuntimePort: true;
    documentExtractionRuntimePort: true;
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
 * Consome um Job OCR_COMPLETED via Worker oficial, executa Parser e reenfileira PARSED.
 * Oneshot: libera o worker após a transição (evita consumir PARSED antes de 01D).
 */
export async function processTissOcrParsed(
  input: ProcessTissOcrParsedInput = {},
): Promise<ProcessTissOcrParsedResult> {
  const runtime = getEnterpriseRuntime();
  const queuePort = runtime.getQueueRuntimePort();
  const workerPort = runtime.getWorkerRuntimePort();

  // Shape check — cadeia operacional oficial permanece acessível.
  void runtime.getDocumentExtractionRuntimePort();
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
    documentExtractionRuntimePort: true as const,
    retryInfrastructure,
    deadLetterRuntime,
  };

  const adapter = asWorkerAdapter(workerPort);
  if (!adapter?.getConsumer()) {
    return {
      ok: false,
      entry: "getEnterpriseRuntime",
      runtimeId: runtime.runtimeId,
      parserExecuted: false,
      validationExecuted: false,
      ocrExecuted: false,
      code: "TISS_PARSER_WORKER_CONSUMER_UNAVAILABLE",
      message:
        "WorkerRuntimePort must expose operational WorkerQueueConsumer (OPER-INF-W) for Parser capability.",
      infrastructure,
    };
  }

  const settlement: { current: ProcessTissParserJobResult | null } = { current: null };

  adapter.setProcessMessage(async (ctx) => {
    const result = await processTissParserJob({
      getQueueRuntimePort: () => runtime.getQueueRuntimePort(),
      getDocumentExtractionRuntimePort: () => runtime.getDocumentExtractionRuntimePort(),
      message: ctx.message,
      queueName: ctx.queueName,
    });
    settlement.current = result;
    return result.settle;
  });

  const workerName = input.workerName?.trim() || "tiss-parser-01c";
  const pollIntervalMs = input.pollIntervalMs ?? 20;
  const waitTimeoutMs = input.waitTimeoutMs ?? 5_000;

  let workerId: string | undefined;
  try {
    const registered = await workerPort.register({
      workerName,
      attributes: {
        capability: "tiss-parser",
        sprint: "tiss-runtime-01c",
      },
    });
    if (!registered.ok || !registered.worker?.workerId) {
      return {
        ok: false,
        entry: "getEnterpriseRuntime",
        runtimeId: runtime.runtimeId,
        parserExecuted: false,
        validationExecuted: false,
        ocrExecuted: false,
        code: registered.code ?? "TISS_PARSER_WORKER_REGISTER_FAILED",
        message: registered.message ?? "Failed to register TISS Parser worker.",
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
        parserExecuted: false,
        validationExecuted: false,
        ocrExecuted: false,
        code: allocated.code ?? "TISS_PARSER_WORKER_ALLOCATE_FAILED",
        message: allocated.message ?? "Failed to allocate TISS Parser worker.",
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
        parserExecuted: false,
        validationExecuted: false,
        ocrExecuted: false,
        code: "TISS_PARSER_CAPABILITY_TIMEOUT",
        message: `Timed out waiting for Worker Parser settle (${waitTimeoutMs}ms).`,
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
      parserExecuted: settled.parserExecuted,
      validationExecuted: false,
      ocrExecuted: settled.ocrExecuted,
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

export { TISS_JOB_STATUS_PARSED };
export type { TissParserCompletedJob };

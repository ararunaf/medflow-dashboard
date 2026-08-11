/**
 * TISS-RUNTIME-02A — Entrypoint oficial: capability Validation via Enterprise Runtime.
 *
 * Único caminho autorizado:
 *   getEnterpriseRuntime()
 *     → WorkerRuntimePort.allocate (queue enterprise-tiss)
 *     → WorkerQueueConsumer (claim via QueueRuntimePort)
 *     → ValidationRuntimePort (submitRequest / getResult)
 *     → QueueRuntimePort.enqueue (status VALIDATED)
 *
 * Reutiliza (sem substituir / sem Port novo):
 *   SchedulerRuntimePort · Retry · WorkerRuntimePort · QueueRuntimePort
 *   · Dead Letter · ObservabilityRuntimePort · ValidationRuntimePort
 *
 * NÃO executa Enriquecimento / XML / Lote / Protocolo / Persistência / Auditoria.
 */
import { ENTERPRISE_TISS_QUEUE_NAME } from "../queue-runtime/operational/enqueue-tiss-received-job";
import {
  TISS_JOB_STATUS_VALIDATED,
  processTissValidationJob,
  type ProcessTissValidationJobResult,
  type TissValidationCompletedJob,
} from "../queue-runtime/operational/process-tiss-validation-job";
import type { DefaultWorkerRuntimeAdapter } from "../worker-runtime/adapters/default-worker-runtime-adapter";
import { getEnterpriseRuntime } from "./create-enterprise-runtime";

export type ProcessTissParsedValidatedInput = {
  /** Identidade do worker operacional (default: tiss-validation-02a). */
  workerName?: string;
  pollIntervalMs?: number;
  waitTimeoutMs?: number;
};

export type ProcessTissParsedValidatedResult = {
  ok: boolean;
  entry: "getEnterpriseRuntime";
  runtimeId: string;
  job?: TissValidationCompletedJob;
  workerId?: string;
  validationExecuted: boolean;
  enrichmentExecuted: false;
  parserExecuted: boolean;
  message?: string;
  code?: string;
  infrastructure: {
    queueRuntimePort: true;
    workerRuntimePort: true;
    schedulerRuntimePort: true;
    observabilityRuntimePort: true;
    validationRuntimePort: true;
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
 * Consome um Job PARSED via Worker oficial, executa Validation e reenfileira VALIDATED.
 * Oneshot: libera o worker após a transição (evita consumir VALIDATED antes de 02B).
 */
export async function processTissParsedValidated(
  input: ProcessTissParsedValidatedInput = {},
): Promise<ProcessTissParsedValidatedResult> {
  const runtime = getEnterpriseRuntime();
  const queuePort = runtime.getQueueRuntimePort();
  const workerPort = runtime.getWorkerRuntimePort();

  // Shape check — cadeia operacional oficial permanece acessível.
  void runtime.getValidationRuntimePort();
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
    validationRuntimePort: true as const,
    retryInfrastructure,
    deadLetterRuntime,
  };

  const adapter = asWorkerAdapter(workerPort);
  if (!adapter?.getConsumer()) {
    return {
      ok: false,
      entry: "getEnterpriseRuntime",
      runtimeId: runtime.runtimeId,
      validationExecuted: false,
      enrichmentExecuted: false,
      parserExecuted: false,
      code: "TISS_VALIDATION_WORKER_CONSUMER_UNAVAILABLE",
      message:
        "WorkerRuntimePort must expose operational WorkerQueueConsumer (OPER-INF-W) for Validation capability.",
      infrastructure,
    };
  }

  const settlement: { current: ProcessTissValidationJobResult | null } = { current: null };

  adapter.setProcessMessage(async (ctx) => {
    const result = await processTissValidationJob({
      getQueueRuntimePort: () => runtime.getQueueRuntimePort(),
      getValidationRuntimePort: () => runtime.getValidationRuntimePort(),
      message: ctx.message,
      queueName: ctx.queueName,
    });
    settlement.current = result;
    return result.settle;
  });

  const workerName = input.workerName?.trim() || "tiss-validation-02a";
  const pollIntervalMs = input.pollIntervalMs ?? 20;
  const waitTimeoutMs = input.waitTimeoutMs ?? 5_000;

  let workerId: string | undefined;
  try {
    const registered = await workerPort.register({
      workerName,
      attributes: {
        capability: "tiss-validation",
        sprint: "tiss-runtime-02a",
      },
    });
    if (!registered.ok || !registered.worker?.workerId) {
      return {
        ok: false,
        entry: "getEnterpriseRuntime",
        runtimeId: runtime.runtimeId,
        validationExecuted: false,
        enrichmentExecuted: false,
        parserExecuted: false,
        code: registered.code ?? "TISS_VALIDATION_WORKER_REGISTER_FAILED",
        message: registered.message ?? "Failed to register TISS Validation worker.",
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
        validationExecuted: false,
        enrichmentExecuted: false,
        parserExecuted: false,
        code: allocated.code ?? "TISS_VALIDATION_WORKER_ALLOCATE_FAILED",
        message: allocated.message ?? "Failed to allocate TISS Validation worker.",
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
        validationExecuted: false,
        enrichmentExecuted: false,
        parserExecuted: false,
        code: "TISS_VALIDATION_CAPABILITY_TIMEOUT",
        message: `Timed out waiting for Worker Validation settle (${waitTimeoutMs}ms).`,
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
      validationExecuted: settled.validationExecuted,
      enrichmentExecuted: false,
      parserExecuted: settled.parserExecuted,
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

export { TISS_JOB_STATUS_VALIDATED };
export type { TissValidationCompletedJob };

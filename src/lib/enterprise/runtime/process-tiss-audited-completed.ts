/**
 * TISS-RUNTIME-05B — Entrypoint oficial: capability Completed / encerramento terminal.
 *
 * Único caminho autorizado:
 *   getEnterpriseRuntime()
 *     → WorkerRuntimePort.allocate (queue enterprise-tiss)
 *     → WorkerQueueConsumer (claim via QueueRuntimePort)
 *     → Completed (sem Port novo; apenas infraestrutura Enterprise homologada)
 *     → ACK definitivo (não reenfileira)
 *
 * Reutiliza (sem substituir / sem Port novo):
 *   SchedulerRuntimePort · Retry · WorkerRuntimePort · QueueRuntimePort
 *   · Dead Letter · ObservabilityRuntimePort
 *
 * NÃO reenfileira. NÃO processa adicionalmente.
 */
import { ENTERPRISE_TISS_QUEUE_NAME } from "../queue-runtime/operational/enqueue-tiss-received-job";
import {
  TISS_JOB_STATUS_COMPLETED,
  processTissCompletedJob,
  type ProcessTissCompletedJobResult,
  type TissCompletedTerminalJob,
} from "../queue-runtime/operational/process-tiss-completed-job";
import type { DefaultWorkerRuntimeAdapter } from "../worker-runtime/adapters/default-worker-runtime-adapter";
import { getEnterpriseRuntime } from "./create-enterprise-runtime";

export type ProcessTissAuditedCompletedInput = {
  /** Identidade do worker operacional (default: tiss-completed-05b). */
  workerName?: string;
  pollIntervalMs?: number;
  waitTimeoutMs?: number;
};

export type ProcessTissAuditedCompletedResult = {
  ok: boolean;
  entry: "getEnterpriseRuntime";
  runtimeId: string;
  job?: TissCompletedTerminalJob;
  workerId?: string;
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
  infrastructure: {
    queueRuntimePort: true;
    workerRuntimePort: true;
    schedulerRuntimePort: true;
    observabilityRuntimePort: true;
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
 * Consome um Job AUDITED via Worker oficial, encerra como COMPLETED e dá ACK definitivo.
 * Não reenfileira. Não cria Port/Runtime/Gateway/Pipeline.
 */
export async function processTissAuditedCompleted(
  input: ProcessTissAuditedCompletedInput = {},
): Promise<ProcessTissAuditedCompletedResult> {
  const runtime = getEnterpriseRuntime();
  const queuePort = runtime.getQueueRuntimePort();
  const workerPort = runtime.getWorkerRuntimePort();

  // Shape check — cadeia operacional oficial permanece acessível.
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
    retryInfrastructure,
    deadLetterRuntime,
  };

  const adapter = asWorkerAdapter(workerPort);
  if (!adapter?.getConsumer()) {
    return {
      ok: false,
      entry: "getEnterpriseRuntime",
      runtimeId: runtime.runtimeId,
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
      code: "TISS_COMPLETED_WORKER_CONSUMER_UNAVAILABLE",
      message:
        "WorkerRuntimePort must expose operational WorkerQueueConsumer (OPER-INF-W) for Completed capability.",
      infrastructure,
    };
  }

  const settlement: { current: ProcessTissCompletedJobResult | null } = { current: null };

  adapter.setProcessMessage(async (ctx) => {
    const result = await processTissCompletedJob({
      getQueueRuntimePort: () => runtime.getQueueRuntimePort(),
      message: ctx.message,
      queueName: ctx.queueName,
    });
    settlement.current = result;
    return result.settle;
  });

  const workerName = input.workerName?.trim() || "tiss-completed-05b";
  const pollIntervalMs = input.pollIntervalMs ?? 20;
  const waitTimeoutMs = input.waitTimeoutMs ?? 5_000;

  let workerId: string | undefined;
  try {
    const registered = await workerPort.register({
      workerName,
      attributes: {
        capability: "tiss-completed",
        sprint: "tiss-runtime-05b",
      },
    });
    if (!registered.ok || !registered.worker?.workerId) {
      return {
        ok: false,
        entry: "getEnterpriseRuntime",
        runtimeId: runtime.runtimeId,
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
        code: registered.code ?? "TISS_COMPLETED_WORKER_REGISTER_FAILED",
        message: registered.message ?? "Failed to register TISS Completed worker.",
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
        code: allocated.code ?? "TISS_COMPLETED_WORKER_ALLOCATE_FAILED",
        message: allocated.message ?? "Failed to allocate TISS Completed worker.",
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
        code: "TISS_COMPLETED_CAPABILITY_TIMEOUT",
        message: `Timed out waiting for Worker Completed settle (${waitTimeoutMs}ms).`,
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
      completed: settled.completed,
      reenqueued: settled.reenqueued,
      audited: settled.audited,
      persisted: settled.persisted,
      protocolSent: settled.protocolSent,
      batchCreated: settled.batchCreated,
      xmlGenerated: settled.xmlGenerated,
      enrichmentExecuted: settled.enrichmentExecuted,
      validationExecuted: settled.validationExecuted,
      parserExecuted: settled.parserExecuted,
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

export { TISS_JOB_STATUS_COMPLETED };
export type { TissCompletedTerminalJob };

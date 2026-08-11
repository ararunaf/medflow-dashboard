/**
 * TISS-RUNTIME-04A — Entrypoint oficial: capability Protocol via Enterprise Runtime.
 *
 * Único caminho autorizado:
 *   getEnterpriseRuntime()
 *     → WorkerRuntimePort.allocate (queue enterprise-tiss)
 *     → WorkerQueueConsumer (claim via QueueRuntimePort)
 *     → ProtocolRuntimePort (prepareProfile / getProfile)
 *     → QueueRuntimePort.enqueue (status PROTOCOL_SENT)
 *
 * Reutiliza (sem substituir / sem Port novo):
 *   SchedulerRuntimePort · Retry · WorkerRuntimePort · QueueRuntimePort
 *   · Dead Letter · ObservabilityRuntimePort · ProtocolRuntimePort
 *
 * NÃO executa Persistência / Auditoria.
 */
import { ENTERPRISE_TISS_QUEUE_NAME } from "../queue-runtime/operational/enqueue-tiss-received-job";
import {
  TISS_JOB_STATUS_PROTOCOL_SENT,
  processTissProtocolJob,
  type ProcessTissProtocolJobResult,
  type TissProtocolCompletedJob,
} from "../queue-runtime/operational/process-tiss-protocol-job";
import type { DefaultWorkerRuntimeAdapter } from "../worker-runtime/adapters/default-worker-runtime-adapter";
import { getEnterpriseRuntime } from "./create-enterprise-runtime";

export type ProcessTissBatchCreatedProtocolSentInput = {
  /** Identidade do worker operacional (default: tiss-protocol-04a). */
  workerName?: string;
  pollIntervalMs?: number;
  waitTimeoutMs?: number;
};

export type ProcessTissBatchCreatedProtocolSentResult = {
  ok: boolean;
  entry: "getEnterpriseRuntime";
  runtimeId: string;
  job?: TissProtocolCompletedJob;
  workerId?: string;
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
  infrastructure: {
    queueRuntimePort: true;
    workerRuntimePort: true;
    schedulerRuntimePort: true;
    observabilityRuntimePort: true;
    protocolRuntimePort: true;
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
 * Consome um Job BATCH_CREATED via Worker oficial, executa Protocol e reenfileira PROTOCOL_SENT.
 * Oneshot: libera o worker após a transição (evita consumir PROTOCOL_SENT antes de 04B).
 */
export async function processTissBatchCreatedProtocolSent(
  input: ProcessTissBatchCreatedProtocolSentInput = {},
): Promise<ProcessTissBatchCreatedProtocolSentResult> {
  const runtime = getEnterpriseRuntime();
  const queuePort = runtime.getQueueRuntimePort();
  const workerPort = runtime.getWorkerRuntimePort();

  // Shape check — cadeia operacional oficial permanece acessível.
  void runtime.getProtocolRuntimePort();
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
    protocolRuntimePort: true as const,
    retryInfrastructure,
    deadLetterRuntime,
  };

  const adapter = asWorkerAdapter(workerPort);
  if (!adapter?.getConsumer()) {
    return {
      ok: false,
      entry: "getEnterpriseRuntime",
      runtimeId: runtime.runtimeId,
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
      code: "TISS_PROTOCOL_WORKER_CONSUMER_UNAVAILABLE",
      message:
        "WorkerRuntimePort must expose operational WorkerQueueConsumer (OPER-INF-W) for Protocol capability.",
      infrastructure,
    };
  }

  const settlement: { current: ProcessTissProtocolJobResult | null } = { current: null };

  adapter.setProcessMessage(async (ctx) => {
    const result = await processTissProtocolJob({
      getQueueRuntimePort: () => runtime.getQueueRuntimePort(),
      getProtocolRuntimePort: () => runtime.getProtocolRuntimePort(),
      message: ctx.message,
      queueName: ctx.queueName,
    });
    settlement.current = result;
    return result.settle;
  });

  const workerName = input.workerName?.trim() || "tiss-protocol-04a";
  const pollIntervalMs = input.pollIntervalMs ?? 20;
  const waitTimeoutMs = input.waitTimeoutMs ?? 5_000;

  let workerId: string | undefined;
  try {
    const registered = await workerPort.register({
      workerName,
      attributes: {
        capability: "tiss-protocol",
        sprint: "tiss-runtime-04a",
      },
    });
    if (!registered.ok || !registered.worker?.workerId) {
      return {
        ok: false,
        entry: "getEnterpriseRuntime",
        runtimeId: runtime.runtimeId,
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
        code: registered.code ?? "TISS_PROTOCOL_WORKER_REGISTER_FAILED",
        message: registered.message ?? "Failed to register TISS Protocol worker.",
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
        code: allocated.code ?? "TISS_PROTOCOL_WORKER_ALLOCATE_FAILED",
        message: allocated.message ?? "Failed to allocate TISS Protocol worker.",
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
        code: "TISS_PROTOCOL_CAPABILITY_TIMEOUT",
        message: `Timed out waiting for Worker Protocol settle (${waitTimeoutMs}ms).`,
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
      protocolSent: settled.protocolSent,
      protocolResolved: false,
      persistenceExecuted: false,
      auditExecuted: false,
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

export { TISS_JOB_STATUS_PROTOCOL_SENT };
export type { TissProtocolCompletedJob };

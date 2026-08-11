/**
 * TISS-RUNTIME-05A — Entrypoint oficial: capability Audit via Enterprise Runtime.
 *
 * Único caminho autorizado:
 *   getEnterpriseRuntime()
 *     → WorkerRuntimePort.allocate (queue enterprise-tiss)
 *     → WorkerQueueConsumer (claim via QueueRuntimePort)
 *     → AuditRuntimePort (openJob / getResult)
 *     → QueueRuntimePort.enqueue (status AUDITED)
 *
 * Reutiliza (sem substituir / sem Port novo):
 *   SchedulerRuntimePort · Retry · WorkerRuntimePort · QueueRuntimePort
 *   · Dead Letter · ObservabilityRuntimePort · AuditRuntimePort
 *
 * NÃO executa Completed.
 */
import { ENTERPRISE_TISS_QUEUE_NAME } from "../queue-runtime/operational/enqueue-tiss-received-job";
import {
  TISS_JOB_STATUS_AUDITED,
  processTissAuditJob,
  type ProcessTissAuditJobResult,
  type TissAuditCompletedJob,
} from "../queue-runtime/operational/process-tiss-audit-job";
import type { DefaultWorkerRuntimeAdapter } from "../worker-runtime/adapters/default-worker-runtime-adapter";
import { getEnterpriseRuntime } from "./create-enterprise-runtime";

export type ProcessTissPersistedAuditedInput = {
  /** Identidade do worker operacional (default: tiss-audit-05a). */
  workerName?: string;
  pollIntervalMs?: number;
  waitTimeoutMs?: number;
};

export type ProcessTissPersistedAuditedResult = {
  ok: boolean;
  entry: "getEnterpriseRuntime";
  runtimeId: string;
  job?: TissAuditCompletedJob;
  workerId?: string;
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
  infrastructure: {
    queueRuntimePort: true;
    workerRuntimePort: true;
    schedulerRuntimePort: true;
    observabilityRuntimePort: true;
    auditRuntimePort: true;
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
 * Consome um Job PERSISTED via Worker oficial, executa Audit e reenfileira AUDITED.
 * Oneshot: libera o worker após a transição (evita consumir AUDITED antes de 05B).
 */
export async function processTissPersistedAudited(
  input: ProcessTissPersistedAuditedInput = {},
): Promise<ProcessTissPersistedAuditedResult> {
  const runtime = getEnterpriseRuntime();
  const queuePort = runtime.getQueueRuntimePort();
  const workerPort = runtime.getWorkerRuntimePort();

  // Shape check — cadeia operacional oficial permanece acessível.
  void runtime.getAuditRuntimePort();
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
    auditRuntimePort: true as const,
    retryInfrastructure,
    deadLetterRuntime,
  };

  const adapter = asWorkerAdapter(workerPort);
  if (!adapter?.getConsumer()) {
    return {
      ok: false,
      entry: "getEnterpriseRuntime",
      runtimeId: runtime.runtimeId,
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
      code: "TISS_AUDIT_WORKER_CONSUMER_UNAVAILABLE",
      message:
        "WorkerRuntimePort must expose operational WorkerQueueConsumer (OPER-INF-W) for Audit capability.",
      infrastructure,
    };
  }

  const settlement: { current: ProcessTissAuditJobResult | null } = { current: null };

  adapter.setProcessMessage(async (ctx) => {
    const result = await processTissAuditJob({
      getQueueRuntimePort: () => runtime.getQueueRuntimePort(),
      getAuditRuntimePort: () => runtime.getAuditRuntimePort(),
      message: ctx.message,
      queueName: ctx.queueName,
    });
    settlement.current = result;
    return result.settle;
  });

  const workerName = input.workerName?.trim() || "tiss-audit-05a";
  const pollIntervalMs = input.pollIntervalMs ?? 20;
  const waitTimeoutMs = input.waitTimeoutMs ?? 5_000;

  let workerId: string | undefined;
  try {
    const registered = await workerPort.register({
      workerName,
      attributes: {
        capability: "tiss-audit",
        sprint: "tiss-runtime-05a",
      },
    });
    if (!registered.ok || !registered.worker?.workerId) {
      return {
        ok: false,
        entry: "getEnterpriseRuntime",
        runtimeId: runtime.runtimeId,
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
        code: registered.code ?? "TISS_AUDIT_WORKER_REGISTER_FAILED",
        message: registered.message ?? "Failed to register TISS Audit worker.",
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
        code: allocated.code ?? "TISS_AUDIT_WORKER_ALLOCATE_FAILED",
        message: allocated.message ?? "Failed to allocate TISS Audit worker.",
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
        code: "TISS_AUDIT_CAPABILITY_TIMEOUT",
        message: `Timed out waiting for Worker Audit settle (${waitTimeoutMs}ms).`,
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
      audited: settled.audited,
      completedExecuted: false,
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

export { TISS_JOB_STATUS_AUDITED };
export type { TissAuditCompletedJob };

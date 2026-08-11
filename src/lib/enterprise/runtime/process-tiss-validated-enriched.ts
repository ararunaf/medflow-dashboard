/**
 * TISS-RUNTIME-02B — Entrypoint oficial: capability Enrichment via Enterprise Runtime.
 *
 * Único caminho autorizado:
 *   getEnterpriseRuntime()
 *     → WorkerRuntimePort.allocate (queue enterprise-tiss)
 *     → WorkerQueueConsumer (claim via QueueRuntimePort)
 *     → AutoFillRuntimePort (prepareAutoFill / getResult)
 *     → QueueRuntimePort.enqueue (status ENRICHED)
 *
 * Reutiliza (sem substituir / sem Port novo):
 *   SchedulerRuntimePort · Retry · WorkerRuntimePort · QueueRuntimePort
 *   · Dead Letter · ObservabilityRuntimePort · AutoFillRuntimePort
 *
 * NÃO executa XML / Lote / Protocolo / Persistência / Auditoria.
 */
import { ENTERPRISE_TISS_QUEUE_NAME } from "../queue-runtime/operational/enqueue-tiss-received-job";
import {
  TISS_JOB_STATUS_ENRICHED,
  processTissEnrichmentJob,
  type ProcessTissEnrichmentJobResult,
  type TissEnrichmentCompletedJob,
} from "../queue-runtime/operational/process-tiss-enrichment-job";
import type { DefaultWorkerRuntimeAdapter } from "../worker-runtime/adapters/default-worker-runtime-adapter";
import { getEnterpriseRuntime } from "./create-enterprise-runtime";

export type ProcessTissValidatedEnrichedInput = {
  /** Identidade do worker operacional (default: tiss-enrichment-02b). */
  workerName?: string;
  pollIntervalMs?: number;
  waitTimeoutMs?: number;
};

export type ProcessTissValidatedEnrichedResult = {
  ok: boolean;
  entry: "getEnterpriseRuntime";
  runtimeId: string;
  job?: TissEnrichmentCompletedJob;
  workerId?: string;
  enrichmentExecuted: boolean;
  xmlExecuted: false;
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
    autoFillRuntimePort: true;
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
 * Consome um Job VALIDATED via Worker oficial, executa Enrichment e reenfileira ENRICHED.
 * Oneshot: libera o worker após a transição (evita consumir ENRICHED antes de 03A).
 */
export async function processTissValidatedEnriched(
  input: ProcessTissValidatedEnrichedInput = {},
): Promise<ProcessTissValidatedEnrichedResult> {
  const runtime = getEnterpriseRuntime();
  const queuePort = runtime.getQueueRuntimePort();
  const workerPort = runtime.getWorkerRuntimePort();

  // Shape check — cadeia operacional oficial permanece acessível.
  void runtime.getAutoFillRuntimePort();
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
    autoFillRuntimePort: true as const,
    retryInfrastructure,
    deadLetterRuntime,
  };

  const adapter = asWorkerAdapter(workerPort);
  if (!adapter?.getConsumer()) {
    return {
      ok: false,
      entry: "getEnterpriseRuntime",
      runtimeId: runtime.runtimeId,
      enrichmentExecuted: false,
      xmlExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_ENRICHMENT_WORKER_CONSUMER_UNAVAILABLE",
      message:
        "WorkerRuntimePort must expose operational WorkerQueueConsumer (OPER-INF-W) for Enrichment capability.",
      infrastructure,
    };
  }

  const settlement: { current: ProcessTissEnrichmentJobResult | null } = { current: null };

  adapter.setProcessMessage(async (ctx) => {
    const result = await processTissEnrichmentJob({
      getQueueRuntimePort: () => runtime.getQueueRuntimePort(),
      getAutoFillRuntimePort: () => runtime.getAutoFillRuntimePort(),
      message: ctx.message,
      queueName: ctx.queueName,
    });
    settlement.current = result;
    return result.settle;
  });

  const workerName = input.workerName?.trim() || "tiss-enrichment-02b";
  const pollIntervalMs = input.pollIntervalMs ?? 20;
  const waitTimeoutMs = input.waitTimeoutMs ?? 5_000;

  let workerId: string | undefined;
  try {
    const registered = await workerPort.register({
      workerName,
      attributes: {
        capability: "tiss-enrichment",
        sprint: "tiss-runtime-02b",
      },
    });
    if (!registered.ok || !registered.worker?.workerId) {
      return {
        ok: false,
        entry: "getEnterpriseRuntime",
        runtimeId: runtime.runtimeId,
        enrichmentExecuted: false,
        xmlExecuted: false,
        validationExecuted: false,
        parserExecuted: false,
        ocrExecuted: false,
        code: registered.code ?? "TISS_ENRICHMENT_WORKER_REGISTER_FAILED",
        message: registered.message ?? "Failed to register TISS Enrichment worker.",
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
        enrichmentExecuted: false,
        xmlExecuted: false,
        validationExecuted: false,
        parserExecuted: false,
        ocrExecuted: false,
        code: allocated.code ?? "TISS_ENRICHMENT_WORKER_ALLOCATE_FAILED",
        message: allocated.message ?? "Failed to allocate TISS Enrichment worker.",
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
        enrichmentExecuted: false,
        xmlExecuted: false,
        validationExecuted: false,
        parserExecuted: false,
        ocrExecuted: false,
        code: "TISS_ENRICHMENT_CAPABILITY_TIMEOUT",
        message: `Timed out waiting for Worker Enrichment settle (${waitTimeoutMs}ms).`,
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
      enrichmentExecuted: settled.enrichmentExecuted,
      xmlExecuted: false,
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

export { TISS_JOB_STATUS_ENRICHED };
export type { TissEnrichmentCompletedJob };

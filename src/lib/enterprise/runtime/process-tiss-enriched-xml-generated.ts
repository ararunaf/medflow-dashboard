/**
 * TISS-RUNTIME-03A — Entrypoint oficial: capability XML TISS via Enterprise Runtime.
 *
 * Único caminho autorizado:
 *   getEnterpriseRuntime()
 *     → WorkerRuntimePort.allocate (queue enterprise-tiss)
 *     → WorkerQueueConsumer (claim via QueueRuntimePort)
 *     → XMLTISSRuntimePort (prepareXMLDocument / getResult)
 *     → QueueRuntimePort.enqueue (status XML_GENERATED)
 *
 * Reutiliza (sem substituir / sem Port novo):
 *   SchedulerRuntimePort · Retry · WorkerRuntimePort · QueueRuntimePort
 *   · Dead Letter · ObservabilityRuntimePort · XMLTISSRuntimePort
 *
 * NÃO executa Batch / Protocolo / Persistência / Auditoria.
 */
import { ENTERPRISE_TISS_QUEUE_NAME } from "../queue-runtime/operational/enqueue-tiss-received-job";
import {
  TISS_JOB_STATUS_XML_GENERATED,
  processTissXmlJob,
  type ProcessTissXmlJobResult,
  type TissXmlCompletedJob,
} from "../queue-runtime/operational/process-tiss-xml-job";
import type { DefaultWorkerRuntimeAdapter } from "../worker-runtime/adapters/default-worker-runtime-adapter";
import { getEnterpriseRuntime } from "./create-enterprise-runtime";

export type ProcessTissEnrichedXmlGeneratedInput = {
  /** Identidade do worker operacional (default: tiss-xml-03a). */
  workerName?: string;
  pollIntervalMs?: number;
  waitTimeoutMs?: number;
};

export type ProcessTissEnrichedXmlGeneratedResult = {
  ok: boolean;
  entry: "getEnterpriseRuntime";
  runtimeId: string;
  job?: TissXmlCompletedJob;
  workerId?: string;
  xmlGenerated: boolean;
  batchExecuted: false;
  protocolExecuted: false;
  persistenceExecuted: false;
  auditExecuted: false;
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
    xmlTissRuntimePort: true;
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
 * Consome um Job ENRICHED via Worker oficial, executa XML TISS e reenfileira XML_GENERATED.
 * Oneshot: libera o worker após a transição (evita consumir XML_GENERATED antes de 03B).
 */
export async function processTissEnrichedXmlGenerated(
  input: ProcessTissEnrichedXmlGeneratedInput = {},
): Promise<ProcessTissEnrichedXmlGeneratedResult> {
  const runtime = getEnterpriseRuntime();
  const queuePort = runtime.getQueueRuntimePort();
  const workerPort = runtime.getWorkerRuntimePort();

  // Shape check — cadeia operacional oficial permanece acessível.
  void runtime.getXMLTISSRuntimePort();
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
    xmlTissRuntimePort: true as const,
    retryInfrastructure,
    deadLetterRuntime,
  };

  const adapter = asWorkerAdapter(workerPort);
  if (!adapter?.getConsumer()) {
    return {
      ok: false,
      entry: "getEnterpriseRuntime",
      runtimeId: runtime.runtimeId,
      xmlGenerated: false,
      batchExecuted: false,
      protocolExecuted: false,
      persistenceExecuted: false,
      auditExecuted: false,
      enrichmentExecuted: false,
      validationExecuted: false,
      parserExecuted: false,
      ocrExecuted: false,
      code: "TISS_XML_WORKER_CONSUMER_UNAVAILABLE",
      message:
        "WorkerRuntimePort must expose operational WorkerQueueConsumer (OPER-INF-W) for XML TISS capability.",
      infrastructure,
    };
  }

  const settlement: { current: ProcessTissXmlJobResult | null } = { current: null };

  adapter.setProcessMessage(async (ctx) => {
    const result = await processTissXmlJob({
      getQueueRuntimePort: () => runtime.getQueueRuntimePort(),
      getXMLTISSRuntimePort: () => runtime.getXMLTISSRuntimePort(),
      message: ctx.message,
      queueName: ctx.queueName,
    });
    settlement.current = result;
    return result.settle;
  });

  const workerName = input.workerName?.trim() || "tiss-xml-03a";
  const pollIntervalMs = input.pollIntervalMs ?? 20;
  const waitTimeoutMs = input.waitTimeoutMs ?? 5_000;

  let workerId: string | undefined;
  try {
    const registered = await workerPort.register({
      workerName,
      attributes: {
        capability: "tiss-xml-generation",
        sprint: "tiss-runtime-03a",
      },
    });
    if (!registered.ok || !registered.worker?.workerId) {
      return {
        ok: false,
        entry: "getEnterpriseRuntime",
        runtimeId: runtime.runtimeId,
        xmlGenerated: false,
        batchExecuted: false,
        protocolExecuted: false,
        persistenceExecuted: false,
        auditExecuted: false,
        enrichmentExecuted: false,
        validationExecuted: false,
        parserExecuted: false,
        ocrExecuted: false,
        code: registered.code ?? "TISS_XML_WORKER_REGISTER_FAILED",
        message: registered.message ?? "Failed to register TISS XML worker.",
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
        xmlGenerated: false,
        batchExecuted: false,
        protocolExecuted: false,
        persistenceExecuted: false,
        auditExecuted: false,
        enrichmentExecuted: false,
        validationExecuted: false,
        parserExecuted: false,
        ocrExecuted: false,
        code: allocated.code ?? "TISS_XML_WORKER_ALLOCATE_FAILED",
        message: allocated.message ?? "Failed to allocate TISS XML worker.",
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
        xmlGenerated: false,
        batchExecuted: false,
        protocolExecuted: false,
        persistenceExecuted: false,
        auditExecuted: false,
        enrichmentExecuted: false,
        validationExecuted: false,
        parserExecuted: false,
        ocrExecuted: false,
        code: "TISS_XML_CAPABILITY_TIMEOUT",
        message: `Timed out waiting for Worker XML TISS settle (${waitTimeoutMs}ms).`,
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
      xmlGenerated: settled.xmlGenerated,
      batchExecuted: false,
      protocolExecuted: false,
      persistenceExecuted: false,
      auditExecuted: false,
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

export { TISS_JOB_STATUS_XML_GENERATED };
export type { TissXmlCompletedJob };

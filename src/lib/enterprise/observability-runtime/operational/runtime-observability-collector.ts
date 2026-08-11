/**
 * RuntimeObservabilityCollector — OPER-INF-O
 *
 * Coletor operacional interno do Observability Runtime.
 * Consome exclusivamente Ports existentes em modo SOMENTE LEITURA:
 *   QueueRuntimePort.stats / health(shape)
 *   WorkerRuntimePort.stats / health(shape)
 *   SchedulerRuntimePort.stats / health(shape)
 *   PersistentQueueRuntimePort.stats / health(shape)
 *   DeadLetterRuntimePort.stats (via Queue adapter interno, se presente)
 *     OU QueueRuntimePort.stats(enterprise-dead-letter)
 *
 * Nunca enqueue/dequeue/ack/nack/allocate/schedule/process.
 * Nunca executa regras. Nunca altera o fluxo. Nunca interfere na execução.
 */
import { ENTERPRISE_DEAD_LETTER_QUEUE_NAME } from "../../queue-runtime/operational/dead-letter-types";
import type { DeadLetterRuntimePort } from "../../queue-runtime/operational/dead-letter-runtime-port";
import type { QueueRuntimePort } from "../../queue-runtime/ports/queue-runtime-port";
import type { ObservabilityRuntimeEnterpriseDeps } from "../ports/types";
import type {
  OperationalCounters,
  OperationalDeadLetterStats,
  OperationalHealthChecks,
  OperationalRuntimeDiagnostics,
  OperationalRuntimeStatus,
} from "./types";

export type RuntimeObservabilityCollectorOptions = {
  enterpriseDeps: ObservabilityRuntimeEnterpriseDeps;
  now?: () => string;
  /** Contagens locais do store de Observability (somente leitura). */
  getLocalStoreCounts?: () => {
    scopes: number;
    signals: number;
    envelopes: number;
  };
};

type QueueWithOptionalDeadLetter = QueueRuntimePort & {
  getDeadLetterRuntimePort?: () => DeadLetterRuntimePort | null;
};

function portShapeOk(port: unknown): boolean {
  if (!port || typeof port !== "object") return false;
  const p = port as { health?: unknown; capabilities?: unknown; stats?: unknown };
  return typeof p.health === "function" && typeof p.capabilities === "function";
}

function deriveRuntimeStatus(checks: OperationalHealthChecks): OperationalRuntimeStatus {
  const core =
    checks.queueRuntimeOk &&
    checks.workerRuntimeOk &&
    checks.schedulerRuntimeOk &&
    checks.persistentQueueRuntimeOk &&
    checks.tissRuntimeOk;
  if (!core) return "unavailable";
  if (!checks.deadLetterOk || !checks.scalabilityRuntimeOk) return "degraded";
  return "ready";
}

/**
 * Coletor Port-only — snapshot sob demanda.
 */
export class RuntimeObservabilityCollector {
  private readonly enterpriseDeps: ObservabilityRuntimeEnterpriseDeps;
  private readonly now: () => string;
  private readonly getLocalStoreCounts?: () => {
    scopes: number;
    signals: number;
    envelopes: number;
  };

  constructor(options: RuntimeObservabilityCollectorOptions) {
    this.enterpriseDeps = options.enterpriseDeps;
    this.now = options.now ?? (() => new Date().toISOString());
    this.getLocalStoreCounts = options.getLocalStoreCounts;
  }

  async collect(): Promise<OperationalRuntimeDiagnostics> {
    const started = typeof performance !== "undefined" ? performance.now() : Date.now();
    const stamp = this.now();

    const queuePort = this.enterpriseDeps.getQueueRuntimePort();
    const workerPort = this.enterpriseDeps.getWorkerRuntimePort();
    const schedulerPort = this.enterpriseDeps.getSchedulerRuntimePort();
    const persistentQueuePort = this.enterpriseDeps.getPersistentQueueRuntimePort();
    const tissPort = this.enterpriseDeps.getTISSRuntimePort();

    // Shape-check apenas (evita ciclo Observability.health ↔ sibling.health).
    const queueRuntimeOk = portShapeOk(queuePort);
    const workerRuntimeOk = portShapeOk(workerPort);
    const schedulerRuntimeOk = portShapeOk(schedulerPort);
    const persistentQueueRuntimeOk = portShapeOk(persistentQueuePort);
    const tissRuntimeOk = portShapeOk(tissPort);

    let scalabilityRuntimeOk = true;
    if (typeof this.enterpriseDeps.getScalabilityRuntimePort === "function") {
      scalabilityRuntimeOk = portShapeOk(this.enterpriseDeps.getScalabilityRuntimePort());
    }

    // Somente leitura: stats() — nunca mutators.
    const [queueStats, workerStats, schedulerStats, deadLetter] = await Promise.all([
      queueRuntimeOk && typeof queuePort.stats === "function"
        ? queuePort.stats()
        : Promise.resolve(null),
      workerRuntimeOk && typeof workerPort.stats === "function"
        ? workerPort.stats()
        : Promise.resolve(null),
      schedulerRuntimeOk && typeof schedulerPort.stats === "function"
        ? schedulerPort.stats()
        : Promise.resolve(null),
      this.collectDeadLetterStats(queuePort, queueRuntimeOk),
    ]);

    // PQR stats — leitura opcional (não bloqueia diagnóstico core).
    if (persistentQueueRuntimeOk && typeof persistentQueuePort.stats === "function") {
      try {
        await persistentQueuePort.stats();
      } catch {
        // diagnóstico best-effort — não falha o snapshot
      }
    }

    const local = this.getLocalStoreCounts?.() ?? { scopes: 0, signals: 0, envelopes: 0 };
    const q = queueStats?.statistics;
    const w = workerStats?.statistics;
    const s = schedulerStats?.statistics;

    const counters: OperationalCounters = {
      queueTotalMessages: q?.totalMessages ?? 0,
      queueEnqueued: q?.enqueuedMessages ?? 0,
      queueDequeued: q?.dequeuedMessages ?? 0,
      queueAcked: q?.ackedMessages ?? 0,
      queueNacked: q?.nackedMessages ?? 0,
      queuePurged: q?.purgedMessages ?? 0,
      workerTotal: w?.totalWorkers ?? 0,
      workerRegistered: w?.registeredWorkers ?? 0,
      workerAllocated: w?.allocatedWorkers ?? 0,
      workerHeartbeats: w?.heartbeatCount ?? 0,
      workerTasks: w?.totalTasks ?? 0,
      workerExecutions: w?.totalExecutions ?? 0,
      schedulerTotal: s?.totalSchedules ?? 0,
      schedulerRegistered: s?.registeredSchedules ?? 0,
      schedulerActive: s?.activeSchedules ?? 0,
      schedulerCancelled: s?.cancelledSchedules ?? 0,
      schedulerJobs: s?.totalJobs ?? 0,
      schedulerDispatches: s?.totalDispatches ?? 0,
      deadLetterTotal: deadLetter.totalDeadLetters,
      observabilityScopes: local.scopes,
      observabilitySignals: local.signals,
      observabilityEnvelopes: local.envelopes,
    };

    const pendingMessages = Math.max(
      0,
      (q?.totalMessages ?? 0) - (q?.ackedMessages ?? 0) - (q?.purgedMessages ?? 0),
    );

    const healthChecks: OperationalHealthChecks = {
      queueRuntimeOk,
      workerRuntimeOk,
      schedulerRuntimeOk,
      persistentQueueRuntimeOk,
      tissRuntimeOk,
      scalabilityRuntimeOk,
      deadLetterOk: deadLetter.ok,
    };

    const runtimeStatus = deriveRuntimeStatus(healthChecks);
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    const collectionLatencyMs = Math.max(0, Math.round(end - started));

    const schedulerOk = schedulerRuntimeOk && schedulerStats?.ok !== false;

    return {
      kind: "operational-runtime-diagnostics",
      collectedAt: stamp,
      runtimeStatus,
      healthChecks,
      counters,
      timers: {
        schedulerTimerImplementedCount: s?.timerImplementedCount ?? 0,
        schedulerActiveSchedules: s?.activeSchedules ?? 0,
        collectionLatencyMs,
      },
      throughput: {
        messagesPublished: q?.messagesPublishedCount ?? q?.enqueuedMessages ?? 0,
        messagesConsumed: q?.messagesConsumedCount ?? q?.dequeuedMessages ?? 0,
        queueConsumedByWorkers: w?.queueConsumedCount ?? 0,
        workersOrchestrated: s?.workersOrchestratedCount ?? 0,
        schedulerDispatches: s?.totalDispatches ?? 0,
      },
      pendingQueues: {
        pendingMessages,
        totalQueues: q?.totalQueues ?? 0,
      },
      activeWorkers: {
        allocatedWorkers: w?.allocatedWorkers ?? 0,
        registeredWorkers: w?.registeredWorkers ?? 0,
        totalWorkers: w?.totalWorkers ?? 0,
      },
      schedulerStatus: {
        status: schedulerOk ? "ready" : "unavailable",
        activeSchedules: s?.activeSchedules ?? 0,
        totalSchedules: s?.totalSchedules ?? 0,
        totalDispatches: s?.totalDispatches ?? 0,
        ok: schedulerOk,
      },
      deadLetter,
      operationalCollection: true,
      realObservabilityBackend: false,
      openTelemetryImplemented: false,
      prometheusImplemented: false,
      grafanaImplemented: false,
      realAlertsImplemented: false,
      distributedTracingImplemented: false,
    };
  }

  /**
   * Dead Letter stats: prefer DeadLetterRuntimePort.stats (interno do Queue adapter);
   * fallback QueueRuntimePort.stats(enterprise-dead-letter) — ambos Port-only.
   */
  private async collectDeadLetterStats(
    queuePort: QueueRuntimePort,
    queueRuntimeOk: boolean,
  ): Promise<OperationalDeadLetterStats> {
    if (!queueRuntimeOk) {
      return { totalDeadLetters: 0, ok: false, source: "unavailable" };
    }

    const withDlq = queuePort as QueueWithOptionalDeadLetter;
    if (typeof withDlq.getDeadLetterRuntimePort === "function") {
      const dlq = withDlq.getDeadLetterRuntimePort();
      if (dlq && typeof dlq.stats === "function") {
        try {
          const result = await dlq.stats();
          return {
            totalDeadLetters: result.totalDeadLetters,
            ok: result.ok === true,
            source: "dead-letter-port",
          };
        } catch {
          return { totalDeadLetters: 0, ok: false, source: "dead-letter-port" };
        }
      }
    }

    try {
      const stats = await queuePort.stats({ queueName: ENTERPRISE_DEAD_LETTER_QUEUE_NAME });
      return {
        totalDeadLetters: stats.statistics?.totalMessages ?? 0,
        ok: stats.ok === true,
        source: "queue-stats",
      };
    } catch {
      return { totalDeadLetters: 0, ok: false, source: "unavailable" };
    }
  }
}

/**
 * SchedulerWorkerDispatcher — OPER-INF-S
 *
 * Motor operacional interno do Scheduler Runtime.
 * Decide QUANDO acionar o Worker — consome exclusivamente WorkerRuntimePort
 * (allocate / heartbeat / release).
 * Sem acesso a QueueRuntimePort. Sem DB. Sem Cron. Sem backends de fila.
 * Sem regras de negócio. Sem paralelismo (concorrência sequencial controlada).
 */
import type { WorkerRuntimePort } from "../../worker-runtime/ports/worker-runtime-port";

export const DEFAULT_SCHEDULER_POLL_INTERVAL_MS = 50;
export const DEFAULT_SCHEDULER_MAX_CONCURRENT = 1;

export type SchedulerDispatchOutcome =
  | "triggered"
  | "skipped-concurrency"
  | "waiting"
  | "error"
  | "cancelled";

export type SchedulerDispatchedEvent = {
  scheduleId: string;
  jobId?: string;
  workerId?: string;
  outcome: SchedulerDispatchOutcome;
  at: string;
};

export type SchedulerWorkerDispatcherOptions = {
  getWorkerRuntimePort: () => WorkerRuntimePort;
  pollIntervalMs?: number;
  maxConcurrent?: number;
  sleep?: (ms: number) => Promise<void>;
  now?: () => string;
  onDispatched?: (event: SchedulerDispatchedEvent) => void;
};

export type SchedulerSessionStartInput = {
  scheduleId: string;
  jobId?: string;
  pollIntervalMs?: number;
  /** Atraso relativo (ms) até o primeiro disparo. */
  delayMs?: number;
  /** Timestamp ISO absoluto do primeiro disparo (tem precedência sobre delayMs). */
  runAt?: string;
  workerName?: string;
  workerId?: string;
  /** Encaminhado ao Worker.allocate como atributo (Worker → Queue). */
  queueName?: string;
  /** Se true, re-dispara a cada ciclo após o due; senão one-shot. */
  repeat?: boolean;
};

type SchedulerSession = {
  scheduleId: string;
  jobId?: string;
  pollIntervalMs: number;
  dueAtMs: number;
  repeat: boolean;
  workerName?: string;
  allocatedWorkerId: string | null;
  queueName?: string;
  abort: AbortController;
  lastHeartbeatAt: string | null;
  stopping: boolean;
  triggered: boolean;
  inFlight: boolean;
  loop: Promise<void> | null;
};

async function defaultSleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function sleepInterruptible(
  ms: number,
  signal: AbortSignal,
  sleep: (ms: number) => Promise<void>,
): Promise<void> {
  if (ms <= 0) return;
  if (signal.aborted) return;
  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", onAbort);
      resolve();
    };
    const onAbort = () => finish();
    signal.addEventListener("abort", onAbort, { once: true });
    void sleep(ms).then(finish);
  });
}

function resolveDueAtMs(input: SchedulerSessionStartInput, nowIso: string): number {
  if (typeof input.runAt === "string" && input.runAt.trim() !== "") {
    const parsed = Date.parse(input.runAt);
    if (Number.isFinite(parsed)) return parsed;
  }
  const delayMs =
    typeof input.delayMs === "number" && Number.isFinite(input.delayMs) && input.delayMs >= 0
      ? Math.floor(input.delayMs)
      : 0;
  return Date.parse(nowIso) + delayMs;
}

/**
 * Dispatcher operacional — um poll loop temporal por schedule, concorrência limitada.
 */
export class SchedulerWorkerDispatcher {
  private readonly getWorkerRuntimePort: () => WorkerRuntimePort;
  private readonly defaultPollIntervalMs: number;
  private readonly maxConcurrent: number;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly now: () => string;
  private readonly onDispatched?: (event: SchedulerDispatchedEvent) => void;
  private readonly sessions = new Map<string, SchedulerSession>();
  private activeDispatches = 0;

  constructor(options: SchedulerWorkerDispatcherOptions) {
    this.getWorkerRuntimePort = options.getWorkerRuntimePort;
    this.defaultPollIntervalMs = options.pollIntervalMs ?? DEFAULT_SCHEDULER_POLL_INTERVAL_MS;
    this.maxConcurrent = Math.max(1, options.maxConcurrent ?? DEFAULT_SCHEDULER_MAX_CONCURRENT);
    this.sleep = options.sleep ?? defaultSleep;
    this.now = options.now ?? (() => new Date().toISOString());
    this.onDispatched = options.onDispatched;
  }

  isActive(scheduleId: string): boolean {
    const session = this.sessions.get(scheduleId);
    return !!session && !session.stopping && session.loop !== null;
  }

  getAllocatedWorkerId(scheduleId: string): string | null {
    return this.sessions.get(scheduleId)?.allocatedWorkerId ?? null;
  }

  getLastHeartbeatAt(scheduleId: string): string | null {
    return this.sessions.get(scheduleId)?.lastHeartbeatAt ?? null;
  }

  getActiveDispatchCount(): number {
    return this.activeDispatches;
  }

  getMaxConcurrent(): number {
    return this.maxConcurrent;
  }

  listActiveScheduleIds(): readonly string[] {
    return Array.from(this.sessions.entries())
      .filter(([, session]) => !session.stopping && session.loop !== null)
      .map(([id]) => id);
  }

  /**
   * Heartbeat operacional — renova liveness da sessão e do Worker alocado (se houver).
   */
  async heartbeat(
    scheduleId: string,
  ): Promise<{ renewed: boolean; lastHeartbeatAt: string | null }> {
    const session = this.sessions.get(scheduleId);
    if (!session || session.stopping) {
      return { renewed: false, lastHeartbeatAt: null };
    }
    const stamp = this.now();
    session.lastHeartbeatAt = stamp;
    if (session.allocatedWorkerId) {
      try {
        await this.getWorkerRuntimePort().heartbeat({ workerId: session.allocatedWorkerId });
      } catch {
        // best-effort — não quebra o loop do scheduler
      }
    }
    return { renewed: true, lastHeartbeatAt: stamp };
  }

  start(input: SchedulerSessionStartInput): void {
    const existing = this.sessions.get(input.scheduleId);
    if (existing && !existing.stopping && existing.loop) {
      return;
    }

    const stamp = this.now();
    const session: SchedulerSession = {
      scheduleId: input.scheduleId,
      jobId: input.jobId,
      pollIntervalMs: input.pollIntervalMs ?? this.defaultPollIntervalMs,
      dueAtMs: resolveDueAtMs(input, stamp),
      repeat: input.repeat === true,
      workerName: input.workerName,
      allocatedWorkerId: null,
      queueName: input.queueName,
      abort: new AbortController(),
      lastHeartbeatAt: stamp,
      stopping: false,
      triggered: false,
      inFlight: false,
      loop: null,
    };
    this.sessions.set(input.scheduleId, session);
    session.loop = this.runLoop(session);
  }

  /**
   * Recuperação pós-restart — reativa polls para schedules que permanecem ativos no store.
   */
  recover(inputs: readonly SchedulerSessionStartInput[]): void {
    for (const input of inputs) {
      if (!input.scheduleId) continue;
      this.start(input);
    }
  }

  /** Graceful shutdown — encerra poll e libera Worker alocado (se houver). */
  async stop(scheduleId: string): Promise<void> {
    const session = this.sessions.get(scheduleId);
    if (!session) return;
    session.stopping = true;
    session.abort.abort();
    if (session.loop) {
      await session.loop;
    }
    await this.releaseAllocatedWorker(session);
    this.sessions.delete(scheduleId);
  }

  async stopAll(): Promise<void> {
    const ids = Array.from(this.sessions.keys());
    await Promise.all(ids.map((id) => this.stop(id)));
  }

  private async runLoop(session: SchedulerSession): Promise<void> {
    try {
      while (!session.stopping) {
        session.lastHeartbeatAt = this.now();
        if (session.allocatedWorkerId) {
          try {
            await this.getWorkerRuntimePort().heartbeat({ workerId: session.allocatedWorkerId });
          } catch {
            // best-effort heartbeat
          }
        }

        const nowMs = Date.parse(this.now());
        const due = Number.isFinite(nowMs) && nowMs >= session.dueAtMs;
        const shouldFire = due && (session.repeat || !session.triggered) && !session.inFlight;

        if (shouldFire) {
          if (this.activeDispatches >= this.maxConcurrent) {
            this.emit({
              scheduleId: session.scheduleId,
              jobId: session.jobId,
              outcome: "skipped-concurrency",
              at: this.now(),
            });
          } else {
            await this.triggerWorker(session);
            if (!session.repeat) {
              // one-shot: encerra após disparo bem-sucedido ou erro
              break;
            }
            // repeat: próximo due = agora + pollInterval
            session.dueAtMs = Date.parse(this.now()) + session.pollIntervalMs;
          }
        }

        if (session.stopping) break;
        await sleepInterruptible(session.pollIntervalMs, session.abort.signal, this.sleep);
      }
    } finally {
      session.loop = null;
    }
  }

  private async triggerWorker(session: SchedulerSession): Promise<void> {
    session.inFlight = true;
    this.activeDispatches += 1;
    const stamp = this.now();
    try {
      const worker = this.getWorkerRuntimePort();
      const attributes: Record<string, string | number | boolean> = {};
      if (session.queueName) attributes.queueName = session.queueName;
      attributes.pollIntervalMs = session.pollIntervalMs;
      attributes.scheduleId = session.scheduleId;
      if (session.jobId) attributes.jobId = session.jobId;

      const allocated = await worker.allocate({
        workerId: session.allocatedWorkerId ?? undefined,
        workerName: session.workerName ?? `scheduler-${session.scheduleId}`,
        attributes,
      });

      if (!allocated.ok || !allocated.worker?.workerId) {
        this.emit({
          scheduleId: session.scheduleId,
          jobId: session.jobId,
          outcome: "error",
          at: this.now(),
        });
        return;
      }

      session.allocatedWorkerId = allocated.worker.workerId;
      session.triggered = true;
      this.emit({
        scheduleId: session.scheduleId,
        jobId: session.jobId,
        workerId: allocated.worker.workerId,
        outcome: "triggered",
        at: stamp,
      });
    } catch {
      this.emit({
        scheduleId: session.scheduleId,
        jobId: session.jobId,
        outcome: "error",
        at: this.now(),
      });
    } finally {
      session.inFlight = false;
      this.activeDispatches = Math.max(0, this.activeDispatches - 1);
    }
  }

  private async releaseAllocatedWorker(session: SchedulerSession): Promise<void> {
    if (!session.allocatedWorkerId) return;
    const workerId = session.allocatedWorkerId;
    session.allocatedWorkerId = null;
    try {
      await this.getWorkerRuntimePort().release({ workerId });
    } catch {
      // best-effort release on shutdown
    }
  }

  private emit(event: SchedulerDispatchedEvent): void {
    this.onDispatched?.(event);
  }
}

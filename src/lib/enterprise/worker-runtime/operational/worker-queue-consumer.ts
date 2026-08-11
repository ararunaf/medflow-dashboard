/**
 * WorkerQueueConsumer — OPER-INF-W
 *
 * Motor operacional interno do Worker Runtime.
 * Consome exclusivamente QueueRuntimePort (dequeue/claim → lock → ack/nack).
 * Sem acesso direto a banco. Sem Scheduler. Sem paralelismo. Sem Dead Letter / Retry Engine.
 */
import type { QueueRuntimePort } from "../../queue-runtime/ports/queue-runtime-port";

export const DEFAULT_WORKER_POLL_INTERVAL_MS = 50;

export type WorkerQueueProcessOutcome = "ack" | "nack" | "nack-error" | "empty" | "queue-missing";

export type WorkerQueueProcessedEvent = {
  workerId: string;
  queueName: string;
  messageId?: string;
  outcome: WorkerQueueProcessOutcome;
  at: string;
};

export type WorkerQueueConsumerOptions = {
  getQueueRuntimePort: () => QueueRuntimePort;
  pollIntervalMs?: number;
  sleep?: (ms: number) => Promise<void>;
  now?: () => string;
  onProcessed?: (event: WorkerQueueProcessedEvent) => void;
};

export type WorkerQueueSessionStartInput = {
  workerId: string;
  queueName: string;
  pollIntervalMs?: number;
  /** Test helper — força NACK após claim (sem Retry Engine). */
  forceNack?: boolean;
};

type WorkerQueueSession = {
  workerId: string;
  queueName: string;
  pollIntervalMs: number;
  forceNack: boolean;
  abort: AbortController;
  lockedMessageId: string | null;
  lockAcquiredAt: string | null;
  stopping: boolean;
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

/**
 * Consumidor operacional controlado — um poll loop sequencial por worker.
 */
export class WorkerQueueConsumer {
  private readonly getQueueRuntimePort: () => QueueRuntimePort;
  private readonly defaultPollIntervalMs: number;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly now: () => string;
  private readonly onProcessed?: (event: WorkerQueueProcessedEvent) => void;
  private readonly sessions = new Map<string, WorkerQueueSession>();

  constructor(options: WorkerQueueConsumerOptions) {
    this.getQueueRuntimePort = options.getQueueRuntimePort;
    this.defaultPollIntervalMs = options.pollIntervalMs ?? DEFAULT_WORKER_POLL_INTERVAL_MS;
    this.sleep = options.sleep ?? defaultSleep;
    this.now = options.now ?? (() => new Date().toISOString());
    this.onProcessed = options.onProcessed;
  }

  isActive(workerId: string): boolean {
    const session = this.sessions.get(workerId);
    return !!session && !session.stopping && session.loop !== null;
  }

  getLockedMessageId(workerId: string): string | null {
    return this.sessions.get(workerId)?.lockedMessageId ?? null;
  }

  /** Renova lock local de processamento (heartbeat operacional). */
  renewLock(workerId: string): { renewed: boolean; lockedMessageId: string | null } {
    const session = this.sessions.get(workerId);
    if (!session?.lockedMessageId) {
      return { renewed: false, lockedMessageId: null };
    }
    session.lockAcquiredAt = this.now();
    return { renewed: true, lockedMessageId: session.lockedMessageId };
  }

  start(input: WorkerQueueSessionStartInput): void {
    const existing = this.sessions.get(input.workerId);
    if (existing && !existing.stopping && existing.loop) {
      return;
    }

    const session: WorkerQueueSession = {
      workerId: input.workerId,
      queueName: input.queueName,
      pollIntervalMs: input.pollIntervalMs ?? this.defaultPollIntervalMs,
      forceNack: input.forceNack === true,
      abort: new AbortController(),
      lockedMessageId: null,
      lockAcquiredAt: null,
      stopping: false,
      loop: null,
    };
    this.sessions.set(input.workerId, session);
    session.loop = this.runLoop(session);
  }

  /** Graceful shutdown — conclui mensagem sob lock e encerra o poll. */
  async stop(workerId: string): Promise<void> {
    const session = this.sessions.get(workerId);
    if (!session) return;
    session.stopping = true;
    session.abort.abort();
    if (session.loop) {
      await session.loop;
    }
    this.sessions.delete(workerId);
  }

  async stopAll(): Promise<void> {
    const ids = Array.from(this.sessions.keys());
    await Promise.all(ids.map((id) => this.stop(id)));
  }

  private async runLoop(session: WorkerQueueSession): Promise<void> {
    while (!session.stopping) {
      if (!session.lockedMessageId) {
        await this.claimAndSettle(session);
      }
      if (session.stopping) break;
      await sleepInterruptible(session.pollIntervalMs, session.abort.signal, this.sleep);
    }
  }

  private async claimAndSettle(session: WorkerQueueSession): Promise<void> {
    const queue = this.getQueueRuntimePort();
    const stamp = this.now();
    let dequeued;
    try {
      dequeued = await queue.dequeue({ queueName: session.queueName });
    } catch {
      this.emit({
        workerId: session.workerId,
        queueName: session.queueName,
        outcome: "nack-error",
        at: stamp,
      });
      return;
    }

    if (!dequeued.ok) {
      const code = dequeued.code ?? "";
      const outcome: WorkerQueueProcessOutcome =
        code === "QUEUE_RUNTIME_QUEUE_NOT_FOUND" ? "queue-missing" : "empty";
      this.emit({
        workerId: session.workerId,
        queueName: session.queueName,
        outcome,
        at: stamp,
      });
      return;
    }

    const messageId = dequeued.queueMessage?.messageId;
    if (!messageId) {
      this.emit({
        workerId: session.workerId,
        queueName: session.queueName,
        outcome: "empty",
        at: stamp,
      });
      return;
    }

    // Claim seguro = dequeue bem-sucedido; lock local impede paralelismo no mesmo worker.
    session.lockedMessageId = messageId;
    session.lockAcquiredAt = stamp;

    try {
      if (session.forceNack || session.stopping) {
        await queue.nack({
          queueName: session.queueName,
          messageId,
        });
        this.emit({
          workerId: session.workerId,
          queueName: session.queueName,
          messageId,
          outcome: "nack",
          at: this.now(),
        });
      } else {
        await queue.ack({
          queueName: session.queueName,
          messageId,
        });
        this.emit({
          workerId: session.workerId,
          queueName: session.queueName,
          messageId,
          outcome: "ack",
          at: this.now(),
        });
      }
    } catch {
      try {
        await queue.nack({
          queueName: session.queueName,
          messageId,
        });
      } catch {
        // best-effort nack on settle failure
      }
      this.emit({
        workerId: session.workerId,
        queueName: session.queueName,
        messageId,
        outcome: "nack-error",
        at: this.now(),
      });
    } finally {
      session.lockedMessageId = null;
      session.lockAcquiredAt = null;
    }
  }

  private emit(event: WorkerQueueProcessedEvent): void {
    this.onProcessed?.(event);
  }
}

/**
 * RealTissPersistenceRuntimeAdapter — A8-02.
 *
 * Adapter real de persistência TISS para o provider `real-tiss` do
 * `PersistentQueueRuntimePort` (INF-08).
 *
 * Reutiliza `DefaultPersistentQueueRuntimeAdapter` para ciclo de vida, retry,
 * cancelamento/AbortSignal, observability, health, capabilities, providerInfo,
 * storage e statistics.
 *
 * Sem alterar `EnterpriseRuntime`, `Queue`, `Worker`, `Scheduler`, `Retry`,
 * `Dead Letter`, `Observability`, `Pipeline`, `Foundations`, `Composition Root`.
 *
 * Sem backend persistente real nesta Sprint (A8-02). Sem PostgreSQL, Supabase,
 * Oracle, SQL Server, MongoDB, S3, Azure Blob real.
 */
import { DEFAULT_PERSISTENT_QUEUE_RUNTIME_CAPABILITIES } from "../ports/capabilities";
import type { PersistentQueueRuntimePort } from "../ports/persistent-queue-runtime-port";
import type {
  ListPersistentQueuesInput,
  ListPersistentQueuesResult,
  PersistMessageInput,
  PersistMessageResult,
  PersistentQueueRuntimeEnterpriseDeps,
  PersistentQueueRuntimeHealth,
  PersistentQueueRuntimeInfo,
  PersistentQueueRuntimePortCapabilities,
  PersistentQueueRuntimeProviderId,
  PersistentQueueRuntimeProviderMetadata,
  PersistentQueueStatsInput,
  PersistentQueueStatsResult,
  RegisterPersistentQueueInput,
  RegisterPersistentQueueResult,
  ReleaseMessageInput,
  ReleaseMessageResult,
  UnregisterPersistentQueueInput,
  UnregisterPersistentQueueResult,
} from "../ports/types";
import type { PersistentQueueRuntimeStore } from "../store";
import {
  DefaultPersistentQueueRuntimeAdapter,
  type DefaultPersistentQueueRuntimeAdapterOptions,
} from "./default-persistent-queue-runtime-adapter";

export const REAL_TISS_PERSISTENCE_RUNTIME_ADAPTER_ID = "real-tiss-persistent-queue-runtime";
export const REAL_TISS_PERSISTENCE_RUNTIME_VERSION = "1.0.0";

export type RealTissPersistenceRuntimeAdapterOptions = {
  provider?: Extract<PersistentQueueRuntimeProviderId, "real-tiss">;
  healthy?: boolean;
  message?: string;
  store?: PersistentQueueRuntimeStore;
  enterpriseDeps?: PersistentQueueRuntimeEnterpriseDeps;
  defaultTimeoutMs?: number;
  defaultRetryCount?: number;
  defaultRetryBackoffMs?: number;
  now?: () => string;
  sleep?: (ms: number) => Promise<void>;
  failAttempts?: number;
};

function defaultQueueName(input: RegisterPersistentQueueInput): string {
  return input.queueName ?? `real-tiss-persistence-queue-${input.correlationId ?? "default"}`;
}

function defaultMetadata(input: PersistMessageInput): PersistMessageInput {
  return {
    ...input,
    queueName: input.queueName ?? "real-tiss-persistence",
    metadata: {
      ...input.metadata,
      kind: "canonical-persistent-queue-metadata",
      source: input.metadata?.source ?? "tiss-runtime-04b-real",
      tags: input.metadata?.tags ?? ["real-tiss", "tiss-persistence", "tiss-runtime-04b"],
      customAttributes: {
        ...input.metadata?.customAttributes,
        realTiss: true,
      },
    },
  };
}

export class RealTissPersistenceRuntimeAdapter implements PersistentQueueRuntimePort {
  readonly providerId: Extract<PersistentQueueRuntimeProviderId, "real-tiss">;

  private readonly delegate: DefaultPersistentQueueRuntimeAdapter;
  private readonly metadata: PersistentQueueRuntimeProviderMetadata;

  constructor(options: RealTissPersistenceRuntimeAdapterOptions = {}) {
    this.providerId = options.provider ?? "real-tiss";
    this.delegate = new DefaultPersistentQueueRuntimeAdapter({
      provider: "default",
      healthy: options.healthy ?? true,
      message:
        options.message ??
        "Real TISS Persistence Runtime ready (structural — real backend planned for A9 without changing this adapter).",
      store: options.store,
      enterpriseDeps: options.enterpriseDeps,
      defaultTimeoutMs: options.defaultTimeoutMs,
      defaultRetryCount: options.defaultRetryCount,
      defaultRetryBackoffMs: options.defaultRetryBackoffMs,
      now: options.now,
      sleep: options.sleep,
      failAttempts: options.failAttempts,
    } as DefaultPersistentQueueRuntimeAdapterOptions);

    this.metadata = {
      name: "Real TISS Persistence Runtime",
      version: REAL_TISS_PERSISTENCE_RUNTIME_VERSION,
      vendor: "medicflow-enterprise",
      description:
        "Real TISS persistence adapter — prepares CanonicalPersistentQueue for future real backend without changing PersistentQueueRuntimePort.",
    };
  }

  getStore(): PersistentQueueRuntimeStore {
    return this.delegate.getStore();
  }

  capabilities(): PersistentQueueRuntimePortCapabilities {
    const caps = this.delegate.capabilities();
    return {
      ...caps,
      provider: this.providerId,
      adapterId: REAL_TISS_PERSISTENCE_RUNTIME_ADAPTER_ID,
    };
  }

  providerInfo(): PersistentQueueRuntimeInfo {
    return {
      providerId: this.providerId,
      metadata: this.metadata,
      status: this.delegate.providerInfo().status,
      providerType: "PERSISTENT_QUEUE_RUNTIME",
      capabilities: { ...DEFAULT_PERSISTENT_QUEUE_RUNTIME_CAPABILITIES },
    };
  }

  async health(): Promise<PersistentQueueRuntimeHealth> {
    const health = await this.delegate.health();
    return { ...health, provider: this.providerId };
  }

  async register(input: RegisterPersistentQueueInput): Promise<RegisterPersistentQueueResult> {
    const res = await this.delegate.register({ ...input, queueName: defaultQueueName(input) });
    return { ...res, provider: this.providerId };
  }

  async unregister(
    input: UnregisterPersistentQueueInput,
  ): Promise<UnregisterPersistentQueueResult> {
    const res = await this.delegate.unregister(input);
    return { ...res, provider: this.providerId };
  }

  async persist(input: PersistMessageInput): Promise<PersistMessageResult> {
    const res = await this.delegate.persist(defaultMetadata(input));
    return { ...res, provider: this.providerId };
  }

  async release(input: ReleaseMessageInput): Promise<ReleaseMessageResult> {
    const res = await this.delegate.release(input);
    return { ...res, provider: this.providerId };
  }

  async list(input: ListPersistentQueuesInput = {}): Promise<ListPersistentQueuesResult> {
    const res = await this.delegate.list(input);
    return { ...res, provider: this.providerId };
  }

  async stats(input: PersistentQueueStatsInput = {}): Promise<PersistentQueueStatsResult> {
    const res = await this.delegate.stats(input);
    return { ...res, provider: this.providerId };
  }
}

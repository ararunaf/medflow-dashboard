/**
 * PersistentQueueRuntimeRegistry — catálogo de mecanismos (INF-08).
 *
 * Registra: nome, versão, capacidades, status.
 * Sem lógica de negócio. Sem Scheduler real. Sem Cron. Sem Timer.
 */
import {
  DEFAULT_PERSISTENT_QUEUE_RUNTIME_ADAPTER_ID,
  DEFAULT_PERSISTENT_QUEUE_RUNTIME_VERSION,
} from "../adapters/default-persistent-queue-runtime-adapter";
import {
  DEFAULT_MOCK_PERSISTENT_QUEUE_RUNTIME_VERSION,
  MOCK_PERSISTENT_QUEUE_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-persistent-queue-runtime-adapter";
import {
  DEFAULT_MOCK_PERSISTENT_QUEUE_RUNTIME_CAPABILITIES,
  DEFAULT_PERSISTENT_QUEUE_RUNTIME_CAPABILITIES,
  type PersistentQueueRuntimeCapabilities,
} from "../ports/capabilities";
import type {
  PersistentQueueRuntimeProviderId,
  PersistentQueueRuntimeRegistration,
  PersistentQueueRuntimeStatus,
} from "../ports/types";

export type PersistentQueueRuntimeRegistrySnapshot = {
  registrations: readonly PersistentQueueRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly PersistentQueueRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Persistent Queue Runtime",
    version: DEFAULT_MOCK_PERSISTENT_QUEUE_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_PERSISTENT_QUEUE_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_PERSISTENT_QUEUE_RUNTIME_CAPABILITIES,
    description:
      "Deterministic in-process Persistent Queue Runtime mock — no real persistent backend, no RabbitMQ, no Kafka.",
  },
  {
    providerId: "test",
    name: "Test Persistent Queue Runtime",
    version: DEFAULT_MOCK_PERSISTENT_QUEUE_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_PERSISTENT_QUEUE_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_PERSISTENT_QUEUE_RUNTIME_CAPABILITIES,
    description: "Test alias of the deterministic Persistent Queue Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Persistent Queue Runtime",
    version: DEFAULT_PERSISTENT_QUEUE_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_PERSISTENT_QUEUE_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_PERSISTENT_QUEUE_RUNTIME_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (INF-08).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Persistent Queue Runtime",
    version: DEFAULT_PERSISTENT_QUEUE_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_PERSISTENT_QUEUE_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_PERSISTENT_QUEUE_RUNTIME_CAPABILITIES,
    description:
      "Official INF-08 Enterprise Persistent Queue Runtime — canonical persistent queue infrastructure only.",
  },
];

export class PersistentQueueRuntimeRegistry {
  private readonly byId = new Map<
    PersistentQueueRuntimeProviderId,
    PersistentQueueRuntimeRegistration
  >();

  constructor(seed: readonly PersistentQueueRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: PersistentQueueRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(
    providerId: PersistentQueueRuntimeProviderId,
  ): PersistentQueueRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: PersistentQueueRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly PersistentQueueRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(
    status: PersistentQueueRuntimeStatus,
  ): readonly PersistentQueueRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  capabilitiesOf(providerId: PersistentQueueRuntimeProviderId): PersistentQueueRuntimeCapabilities {
    return this.byId.get(providerId)?.capabilities ?? {};
  }

  snapshot(): PersistentQueueRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultPersistentQueueRuntimeRegistry(): PersistentQueueRuntimeRegistry {
  return new PersistentQueueRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_PERSISTENT_QUEUE_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

/**
 * QueueRuntimeRegistry — catálogo de mecanismos (INF-05).
 *
 * Registra: nome, versão, capacidades, status.
 * Sem lógica de negócio. Sem filas reais. Sem workers. Sem backends.
 */
import {
  DEFAULT_QUEUE_RUNTIME_ADAPTER_ID,
  DEFAULT_QUEUE_RUNTIME_VERSION,
} from "../adapters/default-queue-runtime-adapter";
import {
  DEFAULT_MOCK_QUEUE_RUNTIME_VERSION,
  MOCK_QUEUE_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-queue-runtime-adapter";
import {
  DEFAULT_MOCK_QUEUE_RUNTIME_CAPABILITIES,
  DEFAULT_QUEUE_RUNTIME_CAPABILITIES,
  type QueueRuntimeCapabilities,
} from "../ports/capabilities";
import type {
  QueueRuntimeProviderId,
  QueueRuntimeRegistration,
  QueueRuntimeStatus,
} from "../ports/types";

export type QueueRuntimeRegistrySnapshot = {
  registrations: readonly QueueRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly QueueRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Queue Runtime",
    version: DEFAULT_MOCK_QUEUE_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_QUEUE_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_QUEUE_RUNTIME_CAPABILITIES,
    description:
      "Deterministic in-process Queue Runtime mock — no real queue, no workers, no backends.",
  },
  {
    providerId: "test",
    name: "Test Queue Runtime",
    version: DEFAULT_MOCK_QUEUE_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_QUEUE_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_QUEUE_RUNTIME_CAPABILITIES,
    description: "Test alias of the deterministic Queue Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Queue Runtime",
    version: DEFAULT_QUEUE_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_QUEUE_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_QUEUE_RUNTIME_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (INF-05).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Queue Runtime",
    version: DEFAULT_QUEUE_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_QUEUE_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_QUEUE_RUNTIME_CAPABILITIES,
    description: "Official INF-05 Enterprise Queue Runtime — canonical queue infrastructure only.",
  },
];

export class QueueRuntimeRegistry {
  private readonly byId = new Map<QueueRuntimeProviderId, QueueRuntimeRegistration>();

  constructor(seed: readonly QueueRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: QueueRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: QueueRuntimeProviderId): QueueRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: QueueRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly QueueRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: QueueRuntimeStatus): readonly QueueRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  capabilitiesOf(providerId: QueueRuntimeProviderId): QueueRuntimeCapabilities {
    return this.byId.get(providerId)?.capabilities ?? {};
  }

  snapshot(): QueueRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultQueueRuntimeRegistry(): QueueRuntimeRegistry {
  return new QueueRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_QUEUE_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

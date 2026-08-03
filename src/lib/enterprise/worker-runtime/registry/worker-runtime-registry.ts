/**
 * WorkerRuntimeRegistry — catálogo de mecanismos (INF-06).
 *
 * Registra: nome, versão, capacidades, status.
 * Sem lógica de negócio. Sem Workers reais. Sem Scheduler. Sem Thread Pool.
 */
import {
  DEFAULT_WORKER_RUNTIME_ADAPTER_ID,
  DEFAULT_WORKER_RUNTIME_VERSION,
} from "../adapters/default-worker-runtime-adapter";
import {
  DEFAULT_MOCK_WORKER_RUNTIME_VERSION,
  MOCK_WORKER_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-worker-runtime-adapter";
import {
  DEFAULT_MOCK_WORKER_RUNTIME_CAPABILITIES,
  DEFAULT_WORKER_RUNTIME_CAPABILITIES,
  type WorkerRuntimeCapabilities,
} from "../ports/capabilities";
import type {
  WorkerRuntimeProviderId,
  WorkerRuntimeRegistration,
  WorkerRuntimeStatus,
} from "../ports/types";

export type WorkerRuntimeRegistrySnapshot = {
  registrations: readonly WorkerRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly WorkerRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Worker Runtime",
    version: DEFAULT_MOCK_WORKER_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_WORKER_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_WORKER_RUNTIME_CAPABILITIES,
    description:
      "Deterministic in-process Worker Runtime mock — no real workers, no scheduler, no thread pool.",
  },
  {
    providerId: "test",
    name: "Test Worker Runtime",
    version: DEFAULT_MOCK_WORKER_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_WORKER_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_WORKER_RUNTIME_CAPABILITIES,
    description: "Test alias of the deterministic Worker Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Worker Runtime",
    version: DEFAULT_WORKER_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_WORKER_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_WORKER_RUNTIME_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (INF-06).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Worker Runtime",
    version: DEFAULT_WORKER_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_WORKER_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_WORKER_RUNTIME_CAPABILITIES,
    description:
      "Official INF-06 Enterprise Worker Runtime — canonical worker infrastructure only.",
  },
];

export class WorkerRuntimeRegistry {
  private readonly byId = new Map<WorkerRuntimeProviderId, WorkerRuntimeRegistration>();

  constructor(seed: readonly WorkerRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: WorkerRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: WorkerRuntimeProviderId): WorkerRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: WorkerRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly WorkerRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: WorkerRuntimeStatus): readonly WorkerRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  capabilitiesOf(providerId: WorkerRuntimeProviderId): WorkerRuntimeCapabilities {
    return this.byId.get(providerId)?.capabilities ?? {};
  }

  snapshot(): WorkerRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultWorkerRuntimeRegistry(): WorkerRuntimeRegistry {
  return new WorkerRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_WORKER_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

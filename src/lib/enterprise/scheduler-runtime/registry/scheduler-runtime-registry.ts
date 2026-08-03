/**
 * SchedulerRuntimeRegistry — catálogo de mecanismos (INF-07).
 *
 * Registra: nome, versão, capacidades, status.
 * Sem lógica de negócio. Sem Scheduler real. Sem Cron. Sem Timer.
 */
import {
  DEFAULT_SCHEDULER_RUNTIME_ADAPTER_ID,
  DEFAULT_SCHEDULER_RUNTIME_VERSION,
} from "../adapters/default-scheduler-runtime-adapter";
import {
  DEFAULT_MOCK_SCHEDULER_RUNTIME_VERSION,
  MOCK_SCHEDULER_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-scheduler-runtime-adapter";
import {
  DEFAULT_MOCK_SCHEDULER_RUNTIME_CAPABILITIES,
  DEFAULT_SCHEDULER_RUNTIME_CAPABILITIES,
  type SchedulerRuntimeCapabilities,
} from "../ports/capabilities";
import type {
  SchedulerRuntimeProviderId,
  SchedulerRuntimeRegistration,
  SchedulerRuntimeStatus,
} from "../ports/types";

export type SchedulerRuntimeRegistrySnapshot = {
  registrations: readonly SchedulerRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly SchedulerRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Scheduler Runtime",
    version: DEFAULT_MOCK_SCHEDULER_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_SCHEDULER_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_SCHEDULER_RUNTIME_CAPABILITIES,
    description:
      "Deterministic in-process Scheduler Runtime mock — no real scheduler, no cron, no timer.",
  },
  {
    providerId: "test",
    name: "Test Scheduler Runtime",
    version: DEFAULT_MOCK_SCHEDULER_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_SCHEDULER_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_SCHEDULER_RUNTIME_CAPABILITIES,
    description: "Test alias of the deterministic Scheduler Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Scheduler Runtime",
    version: DEFAULT_SCHEDULER_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_SCHEDULER_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_SCHEDULER_RUNTIME_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (INF-07).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Scheduler Runtime",
    version: DEFAULT_SCHEDULER_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_SCHEDULER_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_SCHEDULER_RUNTIME_CAPABILITIES,
    description:
      "Official INF-07 Enterprise Scheduler Runtime — canonical scheduler infrastructure only.",
  },
];

export class SchedulerRuntimeRegistry {
  private readonly byId = new Map<SchedulerRuntimeProviderId, SchedulerRuntimeRegistration>();

  constructor(seed: readonly SchedulerRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: SchedulerRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: SchedulerRuntimeProviderId): SchedulerRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: SchedulerRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly SchedulerRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: SchedulerRuntimeStatus): readonly SchedulerRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  capabilitiesOf(providerId: SchedulerRuntimeProviderId): SchedulerRuntimeCapabilities {
    return this.byId.get(providerId)?.capabilities ?? {};
  }

  snapshot(): SchedulerRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultSchedulerRuntimeRegistry(): SchedulerRuntimeRegistry {
  return new SchedulerRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_SCHEDULER_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

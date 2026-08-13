/**
 * CompletedRuntimeRegistry — catálogo de mecanismos (A10-02).
 *
 * Registra: mock, test, default, enterprise.
 * Sem lógica de negócio. Sem completedoria real. Sem IA. Sem regras TISS.
 */
import {
  DEFAULT_COMPLETED_RUNTIME_ADAPTER_ID,
  DEFAULT_COMPLETED_RUNTIME_VERSION,
} from "../adapters/default-completed-runtime-adapter";
import {
  DEFAULT_MOCK_COMPLETED_RUNTIME_VERSION,
  MOCK_COMPLETED_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-completed-runtime-adapter";
import {
  REALTISS_COMPLETED_RUNTIME_ADAPTER_ID,
  REALTISS_COMPLETED_RUNTIME_VERSION,
} from "../adapters/real-tiss-completed-runtime-adapter";
import {
  DEFAULT_COMPLETED_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_MOCK_COMPLETED_RUNTIME_ENGINE_CAPABILITIES,
} from "../ports/capabilities";
import type {
  CompletedRuntimeProviderId,
  CompletedRuntimeRegistration,
  CompletedRuntimeStatus,
} from "../ports/types";

export type CompletedRuntimeRegistrySnapshot = {
  registrations: readonly CompletedRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly CompletedRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Completed Runtime",
    version: DEFAULT_MOCK_COMPLETED_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_COMPLETED_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_COMPLETED_RUNTIME_ENGINE_CAPABILITIES,
    description: "Deterministic in-process Completed Runtime mock — no real completed, no network.",
  },
  {
    providerId: "test",
    name: "Test Completed Runtime",
    version: DEFAULT_MOCK_COMPLETED_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_COMPLETED_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_COMPLETED_RUNTIME_ENGINE_CAPABILITIES,
    description: "Test alias of the deterministic Completed Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Completed Runtime",
    version: DEFAULT_COMPLETED_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_COMPLETED_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_COMPLETED_RUNTIME_ENGINE_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (A10-02).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Completed Runtime",
    version: DEFAULT_COMPLETED_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_COMPLETED_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_COMPLETED_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Official A10-02 Enterprise Completed Runtime — structural job/request/finding completed foundation (no real completed).",
  },
  {
    providerId: "real-tiss",
    name: "RealTiss Completed Runtime",
    version: REALTISS_COMPLETED_RUNTIME_VERSION,
    status: "ready",
    adapterId: REALTISS_COMPLETED_RUNTIME_ADAPTER_ID,
    vendor: "real-tiss",
    capabilities: DEFAULT_COMPLETED_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "RealTiss production Completed Runtime provider — structural foundation, reuses DefaultCompletedRuntimeAdapter lifecycle.",
  },
];

export class CompletedRuntimeRegistry {
  private readonly byId = new Map<CompletedRuntimeProviderId, CompletedRuntimeRegistration>();

  constructor(seed: readonly CompletedRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: CompletedRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: CompletedRuntimeProviderId): CompletedRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: CompletedRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly CompletedRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: CompletedRuntimeStatus): readonly CompletedRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  snapshot(): CompletedRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultCompletedRuntimeRegistry(): CompletedRuntimeRegistry {
  return new CompletedRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_COMPLETED_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

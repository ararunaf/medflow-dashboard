/**
 * IdentityRuntimeRegistry — catálogo de mecanismos (S2-02).
 *
 * Registra: mock, test, default, enterprise, real-tiss.
 * Sem lógica de negócio. Sem identidade real. Sem criptografia.
 */
import {
  DEFAULT_IDENTITY_RUNTIME_ADAPTER_ID,
  DEFAULT_IDENTITY_RUNTIME_VERSION,
} from "../adapters/default-identity-runtime-adapter";
import {
  DEFAULT_MOCK_IDENTITY_RUNTIME_VERSION,
  MOCK_IDENTITY_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-identity-runtime-adapter";
import {
  REALTISS_IDENTITY_RUNTIME_ADAPTER_ID,
  REALTISS_IDENTITY_RUNTIME_VERSION,
} from "../adapters/real-tiss-identity-runtime-adapter";
import {
  DEFAULT_IDENTITY_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_MOCK_IDENTITY_RUNTIME_ENGINE_CAPABILITIES,
} from "../ports/capabilities";
import type {
  IdentityRuntimeProviderId,
  IdentityRuntimeRegistration,
  IdentityRuntimeStatus,
} from "../ports/types";

export type IdentityRuntimeRegistrySnapshot = {
  registrations: readonly IdentityRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly IdentityRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Identity Runtime",
    version: DEFAULT_MOCK_IDENTITY_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_IDENTITY_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_IDENTITY_RUNTIME_ENGINE_CAPABILITIES,
    description: "Deterministic in-process Identity Runtime mock — no real identity, no network.",
  },
  {
    providerId: "test",
    name: "Test Identity Runtime",
    version: DEFAULT_MOCK_IDENTITY_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_IDENTITY_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_IDENTITY_RUNTIME_ENGINE_CAPABILITIES,
    description: "Test alias of the deterministic Identity Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Identity Runtime",
    version: DEFAULT_IDENTITY_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_IDENTITY_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_IDENTITY_RUNTIME_ENGINE_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (S2-02).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Identity Runtime",
    version: DEFAULT_IDENTITY_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_IDENTITY_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_IDENTITY_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Official S2-02 Enterprise Identity Runtime — structural job/request/finding identity foundation (no real identity).",
  },
  {
    providerId: "real-tiss",
    name: "RealTiss Identity Runtime",
    version: REALTISS_IDENTITY_RUNTIME_VERSION,
    status: "ready",
    adapterId: REALTISS_IDENTITY_RUNTIME_ADAPTER_ID,
    vendor: "real-tiss",
    capabilities: DEFAULT_IDENTITY_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "RealTiss production Identity Runtime provider — structural foundation, reuses DefaultIdentityRuntimeAdapter lifecycle.",
  },
];

export class IdentityRuntimeRegistry {
  private readonly byId = new Map<IdentityRuntimeProviderId, IdentityRuntimeRegistration>();

  constructor(seed: readonly IdentityRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: IdentityRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: IdentityRuntimeProviderId): IdentityRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: IdentityRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly IdentityRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: IdentityRuntimeStatus): readonly IdentityRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  snapshot(): IdentityRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultIdentityRuntimeRegistry(): IdentityRuntimeRegistry {
  return new IdentityRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_IDENTITY_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

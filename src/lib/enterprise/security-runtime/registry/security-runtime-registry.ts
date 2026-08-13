/**
 * SecurityRuntimeRegistry — catálogo de mecanismos (S1-02).
 *
 * Registra: mock, test, default, enterprise, real-tiss.
 * Sem lógica de negócio. Sem segurança real. Sem criptografia.
 */
import {
  DEFAULT_SECURITY_RUNTIME_ADAPTER_ID,
  DEFAULT_SECURITY_RUNTIME_VERSION,
} from "../adapters/default-security-runtime-adapter";
import {
  DEFAULT_MOCK_SECURITY_RUNTIME_VERSION,
  MOCK_SECURITY_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-security-runtime-adapter";
import {
  REALTISS_SECURITY_RUNTIME_ADAPTER_ID,
  REALTISS_SECURITY_RUNTIME_VERSION,
} from "../adapters/real-tiss-security-runtime-adapter";
import {
  DEFAULT_SECURITY_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_MOCK_SECURITY_RUNTIME_ENGINE_CAPABILITIES,
} from "../ports/capabilities";
import type {
  SecurityRuntimeProviderId,
  SecurityRuntimeRegistration,
  SecurityRuntimeStatus,
} from "../ports/types";

export type SecurityRuntimeRegistrySnapshot = {
  registrations: readonly SecurityRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly SecurityRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Security Runtime",
    version: DEFAULT_MOCK_SECURITY_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_SECURITY_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_SECURITY_RUNTIME_ENGINE_CAPABILITIES,
    description: "Deterministic in-process Security Runtime mock — no real security, no network.",
  },
  {
    providerId: "test",
    name: "Test Security Runtime",
    version: DEFAULT_MOCK_SECURITY_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_SECURITY_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_SECURITY_RUNTIME_ENGINE_CAPABILITIES,
    description: "Test alias of the deterministic Security Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Security Runtime",
    version: DEFAULT_SECURITY_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_SECURITY_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_SECURITY_RUNTIME_ENGINE_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (S1-02).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Security Runtime",
    version: DEFAULT_SECURITY_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_SECURITY_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_SECURITY_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Official S1-02 Enterprise Security Runtime — structural job/request/finding security foundation (no real security).",
  },
  {
    providerId: "real-tiss",
    name: "RealTiss Security Runtime",
    version: REALTISS_SECURITY_RUNTIME_VERSION,
    status: "ready",
    adapterId: REALTISS_SECURITY_RUNTIME_ADAPTER_ID,
    vendor: "real-tiss",
    capabilities: DEFAULT_SECURITY_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "RealTiss production Security Runtime provider — structural foundation, reuses DefaultSecurityRuntimeAdapter lifecycle.",
  },
];

export class SecurityRuntimeRegistry {
  private readonly byId = new Map<SecurityRuntimeProviderId, SecurityRuntimeRegistration>();

  constructor(seed: readonly SecurityRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: SecurityRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: SecurityRuntimeProviderId): SecurityRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: SecurityRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly SecurityRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: SecurityRuntimeStatus): readonly SecurityRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  snapshot(): SecurityRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultSecurityRuntimeRegistry(): SecurityRuntimeRegistry {
  return new SecurityRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_SECURITY_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

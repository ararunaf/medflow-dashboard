/**
 * GovernanceRuntimeRegistry — catálogo de mecanismos (S6-02).
 *
 * Registra: mock, test, default, enterprise, real-tiss.
 * Sem lógica de negócio. Sem identidade real. Sem criptografia.
 */
import {
  DEFAULT_GOVERNANCE_RUNTIME_ADAPTER_ID,
  DEFAULT_GOVERNANCE_RUNTIME_VERSION,
} from "../adapters/default-governance-runtime-adapter";
import {
  DEFAULT_MOCK_GOVERNANCE_RUNTIME_VERSION,
  MOCK_GOVERNANCE_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-governance-runtime-adapter";
import {
  REALTISS_GOVERNANCE_RUNTIME_ADAPTER_ID,
  REALTISS_GOVERNANCE_RUNTIME_VERSION,
} from "../adapters/real-tiss-governance-runtime-adapter";
import {
  DEFAULT_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_MOCK_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES,
} from "../ports/capabilities";
import type {
  GovernanceRuntimeProviderId,
  GovernanceRuntimeRegistration,
  GovernanceRuntimeStatus,
} from "../ports/types";

export type GovernanceRuntimeRegistrySnapshot = {
  registrations: readonly GovernanceRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly GovernanceRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Governance Runtime",
    version: DEFAULT_MOCK_GOVERNANCE_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_GOVERNANCE_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Deterministic in-process Governance Runtime mock — no real governance, no network.",
  },
  {
    providerId: "test",
    name: "Test Governance Runtime",
    version: DEFAULT_MOCK_GOVERNANCE_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_GOVERNANCE_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES,
    description: "Test alias of the deterministic Governance Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Governance Runtime",
    version: DEFAULT_GOVERNANCE_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_GOVERNANCE_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (S6-02).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Governance Runtime",
    version: DEFAULT_GOVERNANCE_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_GOVERNANCE_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Official S6-02 Enterprise Governance Runtime — structural job/request/finding governance foundation (no real governance).",
  },
  {
    providerId: "real-tiss",
    name: "RealTiss Governance Runtime",
    version: REALTISS_GOVERNANCE_RUNTIME_VERSION,
    status: "ready",
    adapterId: REALTISS_GOVERNANCE_RUNTIME_ADAPTER_ID,
    vendor: "real-tiss",
    capabilities: DEFAULT_GOVERNANCE_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "RealTiss production Governance Runtime provider — structural foundation, reuses DefaultGovernanceRuntimeAdapter lifecycle.",
  },
];

export class GovernanceRuntimeRegistry {
  private readonly byId = new Map<GovernanceRuntimeProviderId, GovernanceRuntimeRegistration>();

  constructor(seed: readonly GovernanceRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: GovernanceRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: GovernanceRuntimeProviderId): GovernanceRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: GovernanceRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly GovernanceRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: GovernanceRuntimeStatus): readonly GovernanceRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  snapshot(): GovernanceRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultGovernanceRuntimeRegistry(): GovernanceRuntimeRegistry {
  return new GovernanceRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_GOVERNANCE_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

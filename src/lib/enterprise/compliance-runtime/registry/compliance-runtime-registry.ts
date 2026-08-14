/**
 * ComplianceRuntimeRegistry — catálogo de mecanismos (S3-02).
 *
 * Registra: mock, test, default, enterprise, real-tiss.
 * Sem lógica de negócio. Sem identidade real. Sem criptografia.
 */
import {
  DEFAULT_COMPLIANCE_RUNTIME_ADAPTER_ID,
  DEFAULT_COMPLIANCE_RUNTIME_VERSION,
} from "../adapters/default-compliance-runtime-adapter";
import {
  DEFAULT_MOCK_COMPLIANCE_RUNTIME_VERSION,
  MOCK_COMPLIANCE_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-compliance-runtime-adapter";
import {
  REALTISS_COMPLIANCE_RUNTIME_ADAPTER_ID,
  REALTISS_COMPLIANCE_RUNTIME_VERSION,
} from "../adapters/real-tiss-compliance-runtime-adapter";
import {
  DEFAULT_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_MOCK_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES,
} from "../ports/capabilities";
import type {
  ComplianceRuntimeProviderId,
  ComplianceRuntimeRegistration,
  ComplianceRuntimeStatus,
} from "../ports/types";

export type ComplianceRuntimeRegistrySnapshot = {
  registrations: readonly ComplianceRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly ComplianceRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Compliance Runtime",
    version: DEFAULT_MOCK_COMPLIANCE_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_COMPLIANCE_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Deterministic in-process Compliance Runtime mock — no real compliance, no network.",
  },
  {
    providerId: "test",
    name: "Test Compliance Runtime",
    version: DEFAULT_MOCK_COMPLIANCE_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_COMPLIANCE_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES,
    description: "Test alias of the deterministic Compliance Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Compliance Runtime",
    version: DEFAULT_COMPLIANCE_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_COMPLIANCE_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (S3-02).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Compliance Runtime",
    version: DEFAULT_COMPLIANCE_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_COMPLIANCE_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Official S3-02 Enterprise Compliance Runtime — structural job/request/finding compliance foundation (no real compliance).",
  },
  {
    providerId: "real-tiss",
    name: "RealTiss Compliance Runtime",
    version: REALTISS_COMPLIANCE_RUNTIME_VERSION,
    status: "ready",
    adapterId: REALTISS_COMPLIANCE_RUNTIME_ADAPTER_ID,
    vendor: "real-tiss",
    capabilities: DEFAULT_COMPLIANCE_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "RealTiss production Compliance Runtime provider — structural foundation, reuses DefaultComplianceRuntimeAdapter lifecycle.",
  },
];

export class ComplianceRuntimeRegistry {
  private readonly byId = new Map<ComplianceRuntimeProviderId, ComplianceRuntimeRegistration>();

  constructor(seed: readonly ComplianceRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: ComplianceRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: ComplianceRuntimeProviderId): ComplianceRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: ComplianceRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly ComplianceRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: ComplianceRuntimeStatus): readonly ComplianceRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  snapshot(): ComplianceRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultComplianceRuntimeRegistry(): ComplianceRuntimeRegistry {
  return new ComplianceRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_COMPLIANCE_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

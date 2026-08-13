/**
 * AuditRuntimeRegistry — catálogo de mecanismos (F3-CAP-10).
 *
 * Registra: mock, test, default, enterprise.
 * Sem lógica de negócio. Sem auditoria real. Sem IA. Sem regras TISS.
 */
import {
  DEFAULT_AUDIT_RUNTIME_ADAPTER_ID,
  DEFAULT_AUDIT_RUNTIME_VERSION,
} from "../adapters/default-audit-runtime-adapter";
import {
  DEFAULT_MOCK_AUDIT_RUNTIME_VERSION,
  MOCK_AUDIT_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-audit-runtime-adapter";
import {
  REALTISS_AUDIT_RUNTIME_ADAPTER_ID,
  REALTISS_AUDIT_RUNTIME_VERSION,
} from "../adapters/real-tiss-audit-runtime-adapter";
import {
  DEFAULT_AUDIT_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_MOCK_AUDIT_RUNTIME_ENGINE_CAPABILITIES,
} from "../ports/capabilities";
import type {
  AuditRuntimeProviderId,
  AuditRuntimeRegistration,
  AuditRuntimeStatus,
} from "../ports/types";

export type AuditRuntimeRegistrySnapshot = {
  registrations: readonly AuditRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly AuditRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Audit Runtime",
    version: DEFAULT_MOCK_AUDIT_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_AUDIT_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_AUDIT_RUNTIME_ENGINE_CAPABILITIES,
    description: "Deterministic in-process Audit Runtime mock — no real audit, no network.",
  },
  {
    providerId: "test",
    name: "Test Audit Runtime",
    version: DEFAULT_MOCK_AUDIT_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_AUDIT_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_AUDIT_RUNTIME_ENGINE_CAPABILITIES,
    description: "Test alias of the deterministic Audit Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Audit Runtime",
    version: DEFAULT_AUDIT_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_AUDIT_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_AUDIT_RUNTIME_ENGINE_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (F3-CAP-10).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Audit Runtime",
    version: DEFAULT_AUDIT_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_AUDIT_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_AUDIT_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Official F3-CAP-10 Enterprise Audit Runtime — structural job/request/finding audit foundation (no real audit).",
  },
  {
    providerId: "real-tiss",
    name: "RealTiss Audit Runtime",
    version: REALTISS_AUDIT_RUNTIME_VERSION,
    status: "ready",
    adapterId: REALTISS_AUDIT_RUNTIME_ADAPTER_ID,
    vendor: "real-tiss",
    capabilities: DEFAULT_AUDIT_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "RealTiss production Audit Runtime provider — structural foundation, reuses DefaultAuditRuntimeAdapter lifecycle.",
  },
];

export class AuditRuntimeRegistry {
  private readonly byId = new Map<AuditRuntimeProviderId, AuditRuntimeRegistration>();

  constructor(seed: readonly AuditRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: AuditRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: AuditRuntimeProviderId): AuditRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: AuditRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly AuditRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: AuditRuntimeStatus): readonly AuditRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  snapshot(): AuditRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultAuditRuntimeRegistry(): AuditRuntimeRegistry {
  return new AuditRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_AUDIT_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

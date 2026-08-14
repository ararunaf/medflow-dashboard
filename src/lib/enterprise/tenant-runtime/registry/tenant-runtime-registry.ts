/**
 * TenantRuntimeRegistry — catálogo de mecanismos (S3-02).
 *
 * Registra: mock, test, default, enterprise, real-tiss.
 * Sem lógica de negócio. Sem identidade real. Sem criptografia.
 */
import {
  DEFAULT_TENANT_RUNTIME_ADAPTER_ID,
  DEFAULT_TENANT_RUNTIME_VERSION,
} from "../adapters/default-tenant-runtime-adapter";
import {
  DEFAULT_MOCK_TENANT_RUNTIME_VERSION,
  MOCK_TENANT_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-tenant-runtime-adapter";
import {
  REALTISS_TENANT_RUNTIME_ADAPTER_ID,
  REALTISS_TENANT_RUNTIME_VERSION,
} from "../adapters/real-tiss-tenant-runtime-adapter";
import {
  DEFAULT_TENANT_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_MOCK_TENANT_RUNTIME_ENGINE_CAPABILITIES,
} from "../ports/capabilities";
import type {
  TenantRuntimeProviderId,
  TenantRuntimeRegistration,
  TenantRuntimeStatus,
} from "../ports/types";

export type TenantRuntimeRegistrySnapshot = {
  registrations: readonly TenantRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly TenantRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Tenant Runtime",
    version: DEFAULT_MOCK_TENANT_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_TENANT_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_TENANT_RUNTIME_ENGINE_CAPABILITIES,
    description: "Deterministic in-process Tenant Runtime mock — no real tenant, no network.",
  },
  {
    providerId: "test",
    name: "Test Tenant Runtime",
    version: DEFAULT_MOCK_TENANT_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_TENANT_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_TENANT_RUNTIME_ENGINE_CAPABILITIES,
    description: "Test alias of the deterministic Tenant Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Tenant Runtime",
    version: DEFAULT_TENANT_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_TENANT_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_TENANT_RUNTIME_ENGINE_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (S3-02).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Tenant Runtime",
    version: DEFAULT_TENANT_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_TENANT_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_TENANT_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Official S3-02 Enterprise Tenant Runtime — structural job/request/finding tenant foundation (no real tenant).",
  },
  {
    providerId: "real-tiss",
    name: "RealTiss Tenant Runtime",
    version: REALTISS_TENANT_RUNTIME_VERSION,
    status: "ready",
    adapterId: REALTISS_TENANT_RUNTIME_ADAPTER_ID,
    vendor: "real-tiss",
    capabilities: DEFAULT_TENANT_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "RealTiss production Tenant Runtime provider — structural foundation, reuses DefaultTenantRuntimeAdapter lifecycle.",
  },
];

export class TenantRuntimeRegistry {
  private readonly byId = new Map<TenantRuntimeProviderId, TenantRuntimeRegistration>();

  constructor(seed: readonly TenantRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: TenantRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: TenantRuntimeProviderId): TenantRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: TenantRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly TenantRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: TenantRuntimeStatus): readonly TenantRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  snapshot(): TenantRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultTenantRuntimeRegistry(): TenantRuntimeRegistry {
  return new TenantRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_TENANT_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

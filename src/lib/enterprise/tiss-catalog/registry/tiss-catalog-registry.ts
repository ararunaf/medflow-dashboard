/**
 * TISSCatalogRegistry — catálogo de mecanismos (TISS-02).
 *
 * Registra: nome, versão, capacidades, status.
 * Sem lógica de negócio. Sem XML. Sem operadoras.
 */
import {
  DEFAULT_TISS_CATALOG_ADAPTER_ID,
  DEFAULT_TISS_CATALOG_VERSION,
} from "../adapters/default-tiss-catalog-adapter";
import {
  DEFAULT_MOCK_TISS_CATALOG_VERSION,
  MOCK_TISS_CATALOG_ADAPTER_ID,
} from "../adapters/mock-tiss-catalog-adapter";
import {
  DEFAULT_MOCK_TISS_CATALOG_CAPABILITIES,
  DEFAULT_TISS_CATALOG_CAPABILITIES,
  type TISSCatalogCapabilities,
} from "../ports/capabilities";
import type {
  TISSCatalogProviderId,
  TISSCatalogRegistration,
  TISSCatalogStatus,
} from "../ports/types";

export type TISSCatalogRegistrySnapshot = {
  registrations: readonly TISSCatalogRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly TISSCatalogRegistration[] = [
  {
    providerId: "mock",
    name: "Mock TISS Catalog",
    version: DEFAULT_MOCK_TISS_CATALOG_VERSION,
    status: "ready",
    adapterId: MOCK_TISS_CATALOG_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_TISS_CATALOG_CAPABILITIES,
    description: "Deterministic in-process TISS catalog mock — no XML, no operators.",
  },
  {
    providerId: "test",
    name: "Test TISS Catalog",
    version: DEFAULT_MOCK_TISS_CATALOG_VERSION,
    status: "ready",
    adapterId: MOCK_TISS_CATALOG_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_TISS_CATALOG_CAPABILITIES,
    description: "Test alias of the deterministic TISS catalog mock.",
  },
  {
    providerId: "default",
    name: "Default TISS Catalog",
    version: DEFAULT_TISS_CATALOG_VERSION,
    status: "ready",
    adapterId: DEFAULT_TISS_CATALOG_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_TISS_CATALOG_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (TISS-02).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise TISS Catalog",
    version: DEFAULT_TISS_CATALOG_VERSION,
    status: "ready",
    adapterId: DEFAULT_TISS_CATALOG_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_TISS_CATALOG_CAPABILITIES,
    description:
      "Official TISS-02 Enterprise TISS Canonical Catalog — sole authorized TISS knowledge source.",
  },
];

export class TISSCatalogRegistry {
  private readonly byId = new Map<TISSCatalogProviderId, TISSCatalogRegistration>();

  constructor(seed: readonly TISSCatalogRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: TISSCatalogRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: TISSCatalogProviderId): TISSCatalogRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: TISSCatalogProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly TISSCatalogRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: TISSCatalogStatus): readonly TISSCatalogRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  capabilitiesOf(providerId: TISSCatalogProviderId): TISSCatalogCapabilities {
    return this.byId.get(providerId)?.capabilities ?? {};
  }

  snapshot(): TISSCatalogRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultTISSCatalogRegistry(): TISSCatalogRegistry {
  return new TISSCatalogRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_TISS_CATALOG_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

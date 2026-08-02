/**
 * SearchProviderRegistry — catálogo de mecanismos (SEARCH-01).
 *
 * Registra: nome, versão, capacidades, status.
 * Sem lógica de negócio. Sem motores de busca externos.
 */
import {
  DEFAULT_SEARCH_PROVIDER_ADAPTER_ID,
  DEFAULT_SEARCH_PROVIDER_VERSION,
} from "../adapters/default-search-provider-adapter";
import {
  DEFAULT_MOCK_SEARCH_PROVIDER_VERSION,
  MOCK_SEARCH_PROVIDER_ADAPTER_ID,
} from "../adapters/mock-search-provider-adapter";
import {
  DEFAULT_MOCK_SEARCH_PROVIDER_CAPABILITIES,
  DEFAULT_SEARCH_PROVIDER_CAPABILITIES,
  type SearchProviderCapabilities,
} from "../ports/capabilities";
import type {
  SearchProviderId,
  SearchProviderRegistration,
  SearchProviderStatus,
} from "../ports/types";

export type SearchProviderRegistrySnapshot = {
  registrations: readonly SearchProviderRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly SearchProviderRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Search Provider",
    version: DEFAULT_MOCK_SEARCH_PROVIDER_VERSION,
    status: "ready",
    adapterId: MOCK_SEARCH_PROVIDER_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_SEARCH_PROVIDER_CAPABILITIES,
    description: "Deterministic in-process search mock — no external engines.",
  },
  {
    providerId: "test",
    name: "Test Search Provider",
    version: DEFAULT_MOCK_SEARCH_PROVIDER_VERSION,
    status: "ready",
    adapterId: MOCK_SEARCH_PROVIDER_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_SEARCH_PROVIDER_CAPABILITIES,
    description: "Test alias of the deterministic search mock.",
  },
  {
    providerId: "default",
    name: "Default Search Provider",
    version: DEFAULT_SEARCH_PROVIDER_VERSION,
    status: "ready",
    adapterId: DEFAULT_SEARCH_PROVIDER_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_SEARCH_PROVIDER_CAPABILITIES,
    description: "Default resolution alias — maps to storage-backed (SEARCH-01).",
  },
  {
    providerId: "storage-backed",
    name: "Storage-Backed Search Provider",
    version: DEFAULT_SEARCH_PROVIDER_VERSION,
    status: "ready",
    adapterId: DEFAULT_SEARCH_PROVIDER_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_SEARCH_PROVIDER_CAPABILITIES,
    description:
      "Official SEARCH-01 storage-backed document search provider — sole authorized search path.",
  },
];

export class SearchProviderRegistry {
  private readonly byId = new Map<SearchProviderId, SearchProviderRegistration>();

  constructor(seed: readonly SearchProviderRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: SearchProviderRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: SearchProviderId): SearchProviderRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: SearchProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly SearchProviderRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: SearchProviderStatus): readonly SearchProviderRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  capabilitiesOf(providerId: SearchProviderId): SearchProviderCapabilities {
    return this.byId.get(providerId)?.capabilities ?? {};
  }

  snapshot(): SearchProviderRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultSearchProviderRegistry(): SearchProviderRegistry {
  return new SearchProviderRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_SEARCH_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

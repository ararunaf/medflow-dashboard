/**
 * StorageProviderRegistry — catálogo de mecanismos (STORAGE-01).
 *
 * Registra: nome, versão, capacidades, status.
 * Sem lógica de negócio. Sem HTTP.
 */
import {
  DEFAULT_STORAGE_PROVIDER_ADAPTER_ID,
  DEFAULT_STORAGE_PROVIDER_VERSION,
} from "../adapters/default-storage-provider-adapter";
import {
  DEFAULT_MOCK_STORAGE_PROVIDER_VERSION,
  MOCK_STORAGE_PROVIDER_ADAPTER_ID,
} from "../adapters/mock-storage-provider-adapter";
import {
  DEFAULT_MOCK_STORAGE_PROVIDER_CAPABILITIES,
  DEFAULT_STORAGE_PROVIDER_CAPABILITIES,
  type StorageProviderCapabilities,
} from "../ports/capabilities";
import type {
  StorageProviderId,
  StorageProviderRegistration,
  StorageProviderStatus,
} from "../ports/types";

export type StorageProviderRegistrySnapshot = {
  registrations: readonly StorageProviderRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly StorageProviderRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Storage Provider",
    version: DEFAULT_MOCK_STORAGE_PROVIDER_VERSION,
    status: "ready",
    adapterId: MOCK_STORAGE_PROVIDER_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_STORAGE_PROVIDER_CAPABILITIES,
    description: "Deterministic in-process storage mock.",
  },
  {
    providerId: "test",
    name: "Test Storage Provider",
    version: DEFAULT_MOCK_STORAGE_PROVIDER_VERSION,
    status: "ready",
    adapterId: MOCK_STORAGE_PROVIDER_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_STORAGE_PROVIDER_CAPABILITIES,
    description: "Test alias of the deterministic storage mock.",
  },
  {
    providerId: "default",
    name: "Default Storage Provider",
    version: DEFAULT_STORAGE_PROVIDER_VERSION,
    status: "ready",
    adapterId: DEFAULT_STORAGE_PROVIDER_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_STORAGE_PROVIDER_CAPABILITIES,
    description: "Default resolution alias — maps to supabase (STORAGE-01).",
  },
  {
    providerId: "supabase",
    name: "Supabase Storage Provider",
    version: DEFAULT_STORAGE_PROVIDER_VERSION,
    status: "ready",
    adapterId: DEFAULT_STORAGE_PROVIDER_ADAPTER_ID,
    vendor: "Supabase",
    capabilities: DEFAULT_STORAGE_PROVIDER_CAPABILITIES,
    description:
      "Official STORAGE-01 Supabase Storage provider — sole authorized document persistence path.",
  },
];

export class StorageProviderRegistry {
  private readonly byId = new Map<StorageProviderId, StorageProviderRegistration>();

  constructor(seed: readonly StorageProviderRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: StorageProviderRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: StorageProviderId): StorageProviderRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: StorageProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly StorageProviderRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: StorageProviderStatus): readonly StorageProviderRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  capabilitiesOf(providerId: StorageProviderId): StorageProviderCapabilities {
    return this.byId.get(providerId)?.capabilities ?? {};
  }

  snapshot(): StorageProviderRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultStorageProviderRegistry(): StorageProviderRegistry {
  return new StorageProviderRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_STORAGE_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

/**
 * TISSProviderRegistry — catálogo de mecanismos (TISS-01).
 *
 * Registra: nome, versão, capacidades, status.
 * Sem lógica de negócio. Sem XML. Sem operadoras.
 */
import {
  DEFAULT_TISS_PROVIDER_ADAPTER_ID,
  DEFAULT_TISS_PROVIDER_VERSION,
} from "../adapters/default-tiss-provider-adapter";
import {
  DEFAULT_MOCK_TISS_PROVIDER_VERSION,
  MOCK_TISS_PROVIDER_ADAPTER_ID,
} from "../adapters/mock-tiss-provider-adapter";
import {
  DEFAULT_MOCK_TISS_PROVIDER_CAPABILITIES,
  DEFAULT_TISS_PROVIDER_CAPABILITIES,
  type TISSProviderCapabilities,
} from "../ports/capabilities";
import type { TISSProviderId, TISSProviderRegistration, TISSProviderStatus } from "../ports/types";

export type TISSProviderRegistrySnapshot = {
  registrations: readonly TISSProviderRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly TISSProviderRegistration[] = [
  {
    providerId: "mock",
    name: "Mock TISS Provider",
    version: DEFAULT_MOCK_TISS_PROVIDER_VERSION,
    status: "ready",
    adapterId: MOCK_TISS_PROVIDER_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_TISS_PROVIDER_CAPABILITIES,
    description: "Deterministic in-process TISS mock — no XML, no operators.",
  },
  {
    providerId: "test",
    name: "Test TISS Provider",
    version: DEFAULT_MOCK_TISS_PROVIDER_VERSION,
    status: "ready",
    adapterId: MOCK_TISS_PROVIDER_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_TISS_PROVIDER_CAPABILITIES,
    description: "Test alias of the deterministic TISS mock.",
  },
  {
    providerId: "default",
    name: "Default TISS Provider",
    version: DEFAULT_TISS_PROVIDER_VERSION,
    status: "ready",
    adapterId: DEFAULT_TISS_PROVIDER_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_TISS_PROVIDER_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (TISS-01).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise TISS Provider",
    version: DEFAULT_TISS_PROVIDER_VERSION,
    status: "ready",
    adapterId: DEFAULT_TISS_PROVIDER_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_TISS_PROVIDER_CAPABILITIES,
    description:
      "Official TISS-01 Enterprise TISS Provider — sole authorized structural TISS path.",
  },
];

export class TISSProviderRegistry {
  private readonly byId = new Map<TISSProviderId, TISSProviderRegistration>();

  constructor(seed: readonly TISSProviderRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: TISSProviderRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: TISSProviderId): TISSProviderRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: TISSProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly TISSProviderRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: TISSProviderStatus): readonly TISSProviderRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  capabilitiesOf(providerId: TISSProviderId): TISSProviderCapabilities {
    return this.byId.get(providerId)?.capabilities ?? {};
  }

  snapshot(): TISSProviderRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultTISSProviderRegistry(): TISSProviderRegistry {
  return new TISSProviderRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_TISS_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

/**
 * TISSMappingRuntimeRegistry — catálogo de mecanismos (F3-CAP-11).
 *
 * Registra: mock, test, default, enterprise.
 * Sem lógica de negócio. Sem mapeamento funcional. Sem operadoras. Sem XML.
 */
import {
  DEFAULT_TISS_MAPPING_RUNTIME_ADAPTER_ID,
  DEFAULT_TISS_MAPPING_RUNTIME_VERSION,
} from "../adapters/default-tiss-mapping-runtime-adapter";
import {
  DEFAULT_MOCK_TISS_MAPPING_RUNTIME_VERSION,
  MOCK_TISS_MAPPING_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-tiss-mapping-runtime-adapter";
import {
  DEFAULT_MOCK_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES,
} from "../ports/capabilities";
import type {
  TISSMappingRuntimeProviderId,
  TISSMappingRuntimeRegistration,
  TISSMappingRuntimeStatus,
} from "../ports/types";

export type TISSMappingRuntimeRegistrySnapshot = {
  registrations: readonly TISSMappingRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly TISSMappingRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock TISS Mapping Runtime",
    version: DEFAULT_MOCK_TISS_MAPPING_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_TISS_MAPPING_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Deterministic in-process TISS Mapping Runtime mock — no functional mapping, no network.",
  },
  {
    providerId: "test",
    name: "Test TISS Mapping Runtime",
    version: DEFAULT_MOCK_TISS_MAPPING_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_TISS_MAPPING_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES,
    description: "Test alias of the deterministic TISS Mapping Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default TISS Mapping Runtime",
    version: DEFAULT_TISS_MAPPING_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_TISS_MAPPING_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (F3-CAP-11).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise TISS Mapping Runtime",
    version: DEFAULT_TISS_MAPPING_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_TISS_MAPPING_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_TISS_MAPPING_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Official F3-CAP-11 Enterprise TISS Mapping Runtime — structural canonical mapping foundation (no functional mapping).",
  },
];

export class TISSMappingRuntimeRegistry {
  private readonly byId = new Map<TISSMappingRuntimeProviderId, TISSMappingRuntimeRegistration>();

  constructor(seed: readonly TISSMappingRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: TISSMappingRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: TISSMappingRuntimeProviderId): TISSMappingRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: TISSMappingRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly TISSMappingRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: TISSMappingRuntimeStatus): readonly TISSMappingRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  snapshot(): TISSMappingRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultTISSMappingRuntimeRegistry(): TISSMappingRuntimeRegistry {
  return new TISSMappingRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_TISS_MAPPING_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

/**
 * XSDRuntimeRegistry — catálogo de mecanismos (TISS-09).
 *
 * Registra: nome, versão, capacidades, status.
 * Sem lógica de negócio. Sem XSD oficial. Sem validação real. Sem XML TISS/ANS.
 */
import {
  DEFAULT_XSD_RUNTIME_ADAPTER_ID,
  DEFAULT_XSD_RUNTIME_VERSION,
} from "../adapters/default-xsd-runtime-adapter";
import {
  DEFAULT_MOCK_XSD_RUNTIME_VERSION,
  MOCK_XSD_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-xsd-runtime-adapter";
import {
  DEFAULT_MOCK_XSD_RUNTIME_CAPABILITIES,
  DEFAULT_XSD_RUNTIME_CAPABILITIES,
  type XSDRuntimeCapabilities,
} from "../ports/capabilities";
import type {
  XSDRuntimeProviderId,
  XSDRuntimeRegistration,
  XSDRuntimeStatus,
} from "../ports/types";

export type XSDRuntimeRegistrySnapshot = {
  registrations: readonly XSDRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly XSDRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock XSD Runtime",
    version: DEFAULT_MOCK_XSD_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_XSD_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_XSD_RUNTIME_CAPABILITIES,
    description:
      "Deterministic in-process XSD Runtime mock — no official XSD, no real validation, no operators.",
  },
  {
    providerId: "test",
    name: "Test XSD Runtime",
    version: DEFAULT_MOCK_XSD_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_XSD_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_XSD_RUNTIME_CAPABILITIES,
    description: "Test alias of the deterministic XSD Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default XSD Runtime",
    version: DEFAULT_XSD_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_XSD_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_XSD_RUNTIME_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (TISS-09).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise XSD Runtime",
    version: DEFAULT_XSD_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_XSD_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_XSD_RUNTIME_CAPABILITIES,
    description: "Official TISS-09 Enterprise XSD Runtime — canonical XSD infrastructure only.",
  },
];

export class XSDRuntimeRegistry {
  private readonly byId = new Map<XSDRuntimeProviderId, XSDRuntimeRegistration>();

  constructor(seed: readonly XSDRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: XSDRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: XSDRuntimeProviderId): XSDRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: XSDRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly XSDRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: XSDRuntimeStatus): readonly XSDRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  capabilitiesOf(providerId: XSDRuntimeProviderId): XSDRuntimeCapabilities {
    return this.byId.get(providerId)?.capabilities ?? {};
  }

  snapshot(): XSDRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultXSDRuntimeRegistry(): XSDRuntimeRegistry {
  return new XSDRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_XSD_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

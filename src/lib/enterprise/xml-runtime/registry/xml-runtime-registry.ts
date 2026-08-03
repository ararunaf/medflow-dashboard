/**
 * XMLRuntimeRegistry — catálogo de mecanismos (TISS-04).
 *
 * Registra: nome, versão, capacidades, status.
 * Sem lógica de negócio. Sem XML real. Sem operadoras.
 */
import {
  DEFAULT_XML_RUNTIME_ADAPTER_ID,
  DEFAULT_XML_RUNTIME_VERSION,
} from "../adapters/default-xml-runtime-adapter";
import {
  DEFAULT_MOCK_XML_RUNTIME_VERSION,
  MOCK_XML_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-xml-runtime-adapter";
import {
  DEFAULT_MOCK_XML_RUNTIME_CAPABILITIES,
  DEFAULT_XML_RUNTIME_CAPABILITIES,
  type XMLRuntimeCapabilities,
} from "../ports/capabilities";
import type {
  XMLRuntimeProviderId,
  XMLRuntimeRegistration,
  XMLRuntimeStatus,
} from "../ports/types";

export type XMLRuntimeRegistrySnapshot = {
  registrations: readonly XMLRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly XMLRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock XML Runtime",
    version: DEFAULT_MOCK_XML_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_XML_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_XML_RUNTIME_CAPABILITIES,
    description: "Deterministic in-process XML Runtime mock — no real XML, no operators.",
  },
  {
    providerId: "test",
    name: "Test XML Runtime",
    version: DEFAULT_MOCK_XML_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_XML_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_XML_RUNTIME_CAPABILITIES,
    description: "Test alias of the deterministic XML Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default XML Runtime",
    version: DEFAULT_XML_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_XML_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_XML_RUNTIME_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (TISS-04).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise XML Runtime",
    version: DEFAULT_XML_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_XML_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_XML_RUNTIME_CAPABILITIES,
    description:
      "Official TISS-04 Enterprise XML Runtime — structural generation via Catalog + RulePackEngine.",
  },
];

export class XMLRuntimeRegistry {
  private readonly byId = new Map<XMLRuntimeProviderId, XMLRuntimeRegistration>();

  constructor(seed: readonly XMLRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: XMLRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: XMLRuntimeProviderId): XMLRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: XMLRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly XMLRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: XMLRuntimeStatus): readonly XMLRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  capabilitiesOf(providerId: XMLRuntimeProviderId): XMLRuntimeCapabilities {
    return this.byId.get(providerId)?.capabilities ?? {};
  }

  snapshot(): XMLRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultXMLRuntimeRegistry(): XMLRuntimeRegistry {
  return new XMLRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_XML_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

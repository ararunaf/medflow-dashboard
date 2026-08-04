/**
 * XMLTISSRuntimeRegistry — catálogo de mecanismos (C-01).
 *
 * Registra: mock, test, default, enterprise.
 * Sem lógica de negócio. Sem geração de XML. Sem serialização. Sem SOAP.
 */
import {
  DEFAULT_XML_TISS_RUNTIME_ADAPTER_ID,
  DEFAULT_XML_TISS_RUNTIME_VERSION,
} from "../adapters/default-xml-tiss-runtime-adapter";
import {
  DEFAULT_MOCK_XML_TISS_RUNTIME_VERSION,
  MOCK_XML_TISS_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-xml-tiss-runtime-adapter";
import {
  DEFAULT_MOCK_XML_TISS_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_XML_TISS_RUNTIME_ENGINE_CAPABILITIES,
} from "../ports/capabilities";
import type {
  XMLTISSRuntimeProviderId,
  XMLTISSRuntimeRegistration,
  XMLTISSRuntimeStatus,
} from "../ports/types";

export type XMLTISSRuntimeRegistrySnapshot = {
  registrations: readonly XMLTISSRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly XMLTISSRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock XML TISS Runtime",
    version: DEFAULT_MOCK_XML_TISS_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_XML_TISS_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_XML_TISS_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Deterministic in-process XML TISS Runtime mock — no functional XML generation, no network.",
  },
  {
    providerId: "test",
    name: "Test XML TISS Runtime",
    version: DEFAULT_MOCK_XML_TISS_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_XML_TISS_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_XML_TISS_RUNTIME_ENGINE_CAPABILITIES,
    description: "Test alias of the deterministic XML TISS Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default XML TISS Runtime",
    version: DEFAULT_XML_TISS_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_XML_TISS_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_XML_TISS_RUNTIME_ENGINE_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (C-01).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise XML TISS Runtime",
    version: DEFAULT_XML_TISS_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_XML_TISS_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_XML_TISS_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Official C-01 Enterprise XML TISS Runtime — structural canonical XML TISS foundation (no functional XML generation).",
  },
];

export class XMLTISSRuntimeRegistry {
  private readonly byId = new Map<XMLTISSRuntimeProviderId, XMLTISSRuntimeRegistration>();

  constructor(seed: readonly XMLTISSRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: XMLTISSRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: XMLTISSRuntimeProviderId): XMLTISSRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: XMLTISSRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly XMLTISSRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: XMLTISSRuntimeStatus): readonly XMLTISSRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  snapshot(): XMLTISSRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultXMLTISSRuntimeRegistry(): XMLTISSRuntimeRegistry {
  return new XMLTISSRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_XML_TISS_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

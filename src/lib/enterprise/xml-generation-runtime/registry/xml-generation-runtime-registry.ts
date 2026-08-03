/**
 * XMLGenerationRuntimeRegistry — catálogo de mecanismos (TISS-05).
 *
 * Registra: nome, versão, capacidades, status.
 * Sem lógica de negócio. Sem XML real. Sem operadoras.
 */
import {
  DEFAULT_XML_GENERATION_ADAPTER_ID,
  DEFAULT_XML_GENERATION_RUNTIME_VERSION,
} from "../adapters/default-xml-generation-adapter";
import {
  DEFAULT_MOCK_XML_GENERATION_RUNTIME_VERSION,
  MOCK_XML_GENERATION_ADAPTER_ID,
} from "../adapters/mock-xml-generation-adapter";
import {
  DEFAULT_MOCK_XML_GENERATION_RUNTIME_CAPABILITIES,
  DEFAULT_XML_GENERATION_RUNTIME_CAPABILITIES,
  type XMLGenerationRuntimeCapabilities,
} from "../ports/capabilities";
import type {
  XMLGenerationRuntimeProviderId,
  XMLGenerationRuntimeRegistration,
  XMLGenerationRuntimeStatus,
} from "../ports/types";

export type XMLGenerationRuntimeRegistrySnapshot = {
  registrations: readonly XMLGenerationRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly XMLGenerationRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock XML Generation Runtime",
    version: DEFAULT_MOCK_XML_GENERATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_XML_GENERATION_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_XML_GENERATION_RUNTIME_CAPABILITIES,
    description:
      "Deterministic in-process XML Generation Runtime mock — no real XML, no operators.",
  },
  {
    providerId: "test",
    name: "Test XML Generation Runtime",
    version: DEFAULT_MOCK_XML_GENERATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_XML_GENERATION_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_XML_GENERATION_RUNTIME_CAPABILITIES,
    description: "Test alias of the deterministic XML Generation Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default XML Generation Runtime",
    version: DEFAULT_XML_GENERATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_XML_GENERATION_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_XML_GENERATION_RUNTIME_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (TISS-05).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise XML Generation Runtime",
    version: DEFAULT_XML_GENERATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_XML_GENERATION_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_XML_GENERATION_RUNTIME_CAPABILITIES,
    description:
      "Official TISS-05 Enterprise XML Generation Runtime — canonical XML structure only.",
  },
];

export class XMLGenerationRuntimeRegistry {
  private readonly byId = new Map<
    XMLGenerationRuntimeProviderId,
    XMLGenerationRuntimeRegistration
  >();

  constructor(seed: readonly XMLGenerationRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: XMLGenerationRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: XMLGenerationRuntimeProviderId): XMLGenerationRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: XMLGenerationRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly XMLGenerationRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: XMLGenerationRuntimeStatus): readonly XMLGenerationRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  capabilitiesOf(providerId: XMLGenerationRuntimeProviderId): XMLGenerationRuntimeCapabilities {
    return this.byId.get(providerId)?.capabilities ?? {};
  }

  snapshot(): XMLGenerationRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultXMLGenerationRuntimeRegistry(): XMLGenerationRuntimeRegistry {
  return new XMLGenerationRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_XML_GENERATION_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

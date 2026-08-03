/**
 * XMLSerializerRuntimeRegistry — catálogo de mecanismos (TISS-06).
 *
 * Registra: nome, versão, capacidades, status.
 * Sem lógica de negócio. Sem XML TISS/ANS. Sem operadoras.
 */
import {
  DEFAULT_XML_SERIALIZER_ADAPTER_ID,
  DEFAULT_XML_SERIALIZER_RUNTIME_VERSION,
} from "../adapters/default-xml-serializer-adapter";
import {
  DEFAULT_MOCK_XML_SERIALIZER_RUNTIME_VERSION,
  MOCK_XML_SERIALIZER_ADAPTER_ID,
} from "../adapters/mock-xml-serializer-adapter";
import {
  DEFAULT_MOCK_XML_SERIALIZER_RUNTIME_CAPABILITIES,
  DEFAULT_XML_SERIALIZER_RUNTIME_CAPABILITIES,
  type XMLSerializerRuntimeCapabilities,
} from "../ports/capabilities";
import type {
  XMLSerializerRuntimeProviderId,
  XMLSerializerRuntimeRegistration,
  XMLSerializerRuntimeStatus,
} from "../ports/types";

export type XMLSerializerRuntimeRegistrySnapshot = {
  registrations: readonly XMLSerializerRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly XMLSerializerRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock XML Serializer Runtime",
    version: DEFAULT_MOCK_XML_SERIALIZER_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_XML_SERIALIZER_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_XML_SERIALIZER_RUNTIME_CAPABILITIES,
    description:
      "Deterministic in-process XML Serializer Runtime mock — no TISS/ANS XML, no operators.",
  },
  {
    providerId: "test",
    name: "Test XML Serializer Runtime",
    version: DEFAULT_MOCK_XML_SERIALIZER_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_XML_SERIALIZER_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_XML_SERIALIZER_RUNTIME_CAPABILITIES,
    description: "Test alias of the deterministic XML Serializer Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default XML Serializer Runtime",
    version: DEFAULT_XML_SERIALIZER_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_XML_SERIALIZER_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_XML_SERIALIZER_RUNTIME_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (TISS-06).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise XML Serializer Runtime",
    version: DEFAULT_XML_SERIALIZER_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_XML_SERIALIZER_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_XML_SERIALIZER_RUNTIME_CAPABILITIES,
    description: "Official TISS-06 Enterprise XML Serializer Runtime — canonical XML string only.",
  },
];

export class XMLSerializerRuntimeRegistry {
  private readonly byId = new Map<
    XMLSerializerRuntimeProviderId,
    XMLSerializerRuntimeRegistration
  >();

  constructor(seed: readonly XMLSerializerRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: XMLSerializerRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: XMLSerializerRuntimeProviderId): XMLSerializerRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: XMLSerializerRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly XMLSerializerRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: XMLSerializerRuntimeStatus): readonly XMLSerializerRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  capabilitiesOf(providerId: XMLSerializerRuntimeProviderId): XMLSerializerRuntimeCapabilities {
    return this.byId.get(providerId)?.capabilities ?? {};
  }

  snapshot(): XMLSerializerRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultXMLSerializerRuntimeRegistry(): XMLSerializerRuntimeRegistry {
  return new XMLSerializerRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_XML_SERIALIZER_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

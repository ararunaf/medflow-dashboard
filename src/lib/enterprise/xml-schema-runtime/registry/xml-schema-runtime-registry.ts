/**
 * XMLSchemaRuntimeRegistry — catálogo de mecanismos (TISS-07).
 *
 * Registra: nome, versão, capacidades, status.
 * Sem lógica de negócio. Sem XSD oficial. Sem validação. Sem XML TISS/ANS.
 */
import {
  DEFAULT_XML_SCHEMA_ADAPTER_ID,
  DEFAULT_XML_SCHEMA_RUNTIME_VERSION,
} from "../adapters/default-xml-schema-adapter";
import {
  DEFAULT_MOCK_XML_SCHEMA_RUNTIME_VERSION,
  MOCK_XML_SCHEMA_ADAPTER_ID,
} from "../adapters/mock-xml-schema-adapter";
import {
  DEFAULT_MOCK_XML_SCHEMA_RUNTIME_CAPABILITIES,
  DEFAULT_XML_SCHEMA_RUNTIME_CAPABILITIES,
  type XMLSchemaRuntimeCapabilities,
} from "../ports/capabilities";
import type {
  XMLSchemaRuntimeProviderId,
  XMLSchemaRuntimeRegistration,
  XMLSchemaRuntimeStatus,
} from "../ports/types";

export type XMLSchemaRuntimeRegistrySnapshot = {
  registrations: readonly XMLSchemaRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly XMLSchemaRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock XML Schema Runtime",
    version: DEFAULT_MOCK_XML_SCHEMA_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_XML_SCHEMA_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_XML_SCHEMA_RUNTIME_CAPABILITIES,
    description:
      "Deterministic in-process XML Schema Runtime mock — no official XSD, no validation, no operators.",
  },
  {
    providerId: "test",
    name: "Test XML Schema Runtime",
    version: DEFAULT_MOCK_XML_SCHEMA_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_XML_SCHEMA_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_XML_SCHEMA_RUNTIME_CAPABILITIES,
    description: "Test alias of the deterministic XML Schema Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default XML Schema Runtime",
    version: DEFAULT_XML_SCHEMA_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_XML_SCHEMA_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_XML_SCHEMA_RUNTIME_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (TISS-07).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise XML Schema Runtime",
    version: DEFAULT_XML_SCHEMA_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_XML_SCHEMA_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_XML_SCHEMA_RUNTIME_CAPABILITIES,
    description:
      "Official TISS-07 Enterprise XML Schema Runtime — canonical schema infrastructure only.",
  },
];

export class XMLSchemaRuntimeRegistry {
  private readonly byId = new Map<XMLSchemaRuntimeProviderId, XMLSchemaRuntimeRegistration>();

  constructor(seed: readonly XMLSchemaRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: XMLSchemaRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: XMLSchemaRuntimeProviderId): XMLSchemaRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: XMLSchemaRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly XMLSchemaRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: XMLSchemaRuntimeStatus): readonly XMLSchemaRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  capabilitiesOf(providerId: XMLSchemaRuntimeProviderId): XMLSchemaRuntimeCapabilities {
    return this.byId.get(providerId)?.capabilities ?? {};
  }

  snapshot(): XMLSchemaRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultXMLSchemaRuntimeRegistry(): XMLSchemaRuntimeRegistry {
  return new XMLSchemaRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_XML_SCHEMA_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

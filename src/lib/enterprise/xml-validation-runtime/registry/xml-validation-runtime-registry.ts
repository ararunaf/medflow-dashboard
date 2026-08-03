/**
 * XMLValidationRuntimeRegistry — catálogo de mecanismos (TISS-08).
 *
 * Registra: nome, versão, capacidades, status.
 * Sem lógica de negócio. Sem XSD oficial. Sem validação real. Sem XML TISS/ANS.
 */
import {
  DEFAULT_XML_VALIDATION_ADAPTER_ID,
  DEFAULT_XML_VALIDATION_RUNTIME_VERSION,
} from "../adapters/default-xml-validation-adapter";
import {
  DEFAULT_MOCK_XML_VALIDATION_RUNTIME_VERSION,
  MOCK_XML_VALIDATION_ADAPTER_ID,
} from "../adapters/mock-xml-validation-adapter";
import {
  DEFAULT_MOCK_XML_VALIDATION_RUNTIME_CAPABILITIES,
  DEFAULT_XML_VALIDATION_RUNTIME_CAPABILITIES,
  type XMLValidationRuntimeCapabilities,
} from "../ports/capabilities";
import type {
  XMLValidationRuntimeProviderId,
  XMLValidationRuntimeRegistration,
  XMLValidationRuntimeStatus,
} from "../ports/types";

export type XMLValidationRuntimeRegistrySnapshot = {
  registrations: readonly XMLValidationRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly XMLValidationRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock XML Validation Runtime",
    version: DEFAULT_MOCK_XML_VALIDATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_XML_VALIDATION_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_XML_VALIDATION_RUNTIME_CAPABILITIES,
    description:
      "Deterministic in-process XML Validation Runtime mock — no official XSD, no real validation, no operators.",
  },
  {
    providerId: "test",
    name: "Test XML Validation Runtime",
    version: DEFAULT_MOCK_XML_VALIDATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_XML_VALIDATION_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_XML_VALIDATION_RUNTIME_CAPABILITIES,
    description: "Test alias of the deterministic XML Validation Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default XML Validation Runtime",
    version: DEFAULT_XML_VALIDATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_XML_VALIDATION_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_XML_VALIDATION_RUNTIME_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (TISS-08).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise XML Validation Runtime",
    version: DEFAULT_XML_VALIDATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_XML_VALIDATION_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_XML_VALIDATION_RUNTIME_CAPABILITIES,
    description:
      "Official TISS-08 Enterprise XML Validation Runtime — canonical validation infrastructure only.",
  },
];

export class XMLValidationRuntimeRegistry {
  private readonly byId = new Map<
    XMLValidationRuntimeProviderId,
    XMLValidationRuntimeRegistration
  >();

  constructor(seed: readonly XMLValidationRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: XMLValidationRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: XMLValidationRuntimeProviderId): XMLValidationRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: XMLValidationRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly XMLValidationRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: XMLValidationRuntimeStatus): readonly XMLValidationRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  capabilitiesOf(providerId: XMLValidationRuntimeProviderId): XMLValidationRuntimeCapabilities {
    return this.byId.get(providerId)?.capabilities ?? {};
  }

  snapshot(): XMLValidationRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultXMLValidationRuntimeRegistry(): XMLValidationRuntimeRegistry {
  return new XMLValidationRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_XML_VALIDATION_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

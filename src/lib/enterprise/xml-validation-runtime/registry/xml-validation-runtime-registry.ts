/**
 * XMLValidationRuntimeRegistry — catálogo de mecanismos (C-02).
 *
 * Registra: mock, test, default, enterprise.
 * Sem lógica de negócio. Sem validação XML. Sem XSD. Sem parser.
 */
import {
  DEFAULT_XML_VALIDATION_RUNTIME_ADAPTER_ID,
  DEFAULT_XML_VALIDATION_RUNTIME_VERSION,
} from "../adapters/default-xml-validation-runtime-adapter";
import {
  DEFAULT_MOCK_XML_VALIDATION_RUNTIME_VERSION,
  MOCK_XML_VALIDATION_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-xml-validation-runtime-adapter";
import {
  DEFAULT_MOCK_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES,
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
    adapterId: MOCK_XML_VALIDATION_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Deterministic in-process XML Validation Runtime mock — no real XML validation, no network.",
  },
  {
    providerId: "test",
    name: "Test XML Validation Runtime",
    version: DEFAULT_MOCK_XML_VALIDATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_XML_VALIDATION_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES,
    description: "Test alias of the deterministic XML Validation Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default XML Validation Runtime",
    version: DEFAULT_XML_VALIDATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_XML_VALIDATION_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (C-02).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise XML Validation Runtime",
    version: DEFAULT_XML_VALIDATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_XML_VALIDATION_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_XML_VALIDATION_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Official C-02/D-02 Enterprise XML Validation Runtime — structural foundation + XSD Validation functional capability.",
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

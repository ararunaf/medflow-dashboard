/**
 * SOAPRuntimeRegistry — catálogo de mecanismos (C-03).
 *
 * Registra: mock, test, default, enterprise.
 * Sem lógica de negócio. Sem comunicação SOAP. Sem HTTP. Sem WSDL.
 */
import {
  DEFAULT_SOAP_RUNTIME_ADAPTER_ID,
  DEFAULT_SOAP_RUNTIME_VERSION,
} from "../adapters/default-soap-runtime-adapter";
import {
  DEFAULT_MOCK_SOAP_RUNTIME_VERSION,
  MOCK_SOAP_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-soap-runtime-adapter";
import {
  DEFAULT_MOCK_SOAP_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_SOAP_RUNTIME_ENGINE_CAPABILITIES,
} from "../ports/capabilities";
import type {
  SOAPRuntimeProviderId,
  SOAPRuntimeRegistration,
  SOAPRuntimeStatus,
} from "../ports/types";

export type SOAPRuntimeRegistrySnapshot = {
  registrations: readonly SOAPRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly SOAPRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock SOAP Runtime",
    version: DEFAULT_MOCK_SOAP_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_SOAP_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_SOAP_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Deterministic in-process SOAP Runtime mock — no real SOAP communication, no network.",
  },
  {
    providerId: "test",
    name: "Test SOAP Runtime",
    version: DEFAULT_MOCK_SOAP_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_SOAP_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_SOAP_RUNTIME_ENGINE_CAPABILITIES,
    description: "Test alias of the deterministic SOAP Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default SOAP Runtime",
    version: DEFAULT_SOAP_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_SOAP_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_SOAP_RUNTIME_ENGINE_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (C-03).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise SOAP Runtime",
    version: DEFAULT_SOAP_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_SOAP_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_SOAP_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Official C-03 Enterprise SOAP Runtime — structural transport encapsulator foundation (no real SOAP communication).",
  },
];

export class SOAPRuntimeRegistry {
  private readonly byId = new Map<SOAPRuntimeProviderId, SOAPRuntimeRegistration>();

  constructor(seed: readonly SOAPRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: SOAPRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: SOAPRuntimeProviderId): SOAPRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: SOAPRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly SOAPRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: SOAPRuntimeStatus): readonly SOAPRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  snapshot(): SOAPRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultSOAPRuntimeRegistry(): SOAPRuntimeRegistry {
  return new SOAPRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_SOAP_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

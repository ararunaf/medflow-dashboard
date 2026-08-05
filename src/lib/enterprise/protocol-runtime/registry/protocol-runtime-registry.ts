/**
 * ProtocolRuntimeRegistry — catálogo de mecanismos (C-07).
 *
 * Registra: mock, test, default, enterprise.
 * Sem lógica de negócio. Sem protocolos concretos. Sem resolução funcional.
 */
import {
  DEFAULT_PROTOCOL_RUNTIME_ADAPTER_ID,
  DEFAULT_PROTOCOL_RUNTIME_VERSION,
} from "../adapters/default-protocol-runtime-adapter";
import {
  DEFAULT_MOCK_PROTOCOL_RUNTIME_VERSION,
  MOCK_PROTOCOL_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-protocol-runtime-adapter";
import {
  DEFAULT_MOCK_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES,
} from "../ports/capabilities";
import type {
  ProtocolRuntimeProviderId,
  ProtocolRuntimeRegistration,
  ProtocolRuntimeStatus,
} from "../ports/types";

export type ProtocolRuntimeRegistrySnapshot = {
  registrations: readonly ProtocolRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly ProtocolRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Protocol Runtime",
    version: DEFAULT_MOCK_PROTOCOL_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_PROTOCOL_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Deterministic in-process Protocol Runtime mock — no concrete protocols, no network.",
  },
  {
    providerId: "test",
    name: "Test Protocol Runtime",
    version: DEFAULT_MOCK_PROTOCOL_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_PROTOCOL_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES,
    description: "Test alias of the deterministic Protocol Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Protocol Runtime",
    version: DEFAULT_PROTOCOL_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_PROTOCOL_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (C-07).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Protocol Runtime",
    version: DEFAULT_PROTOCOL_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_PROTOCOL_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Official C-07 Enterprise Protocol Runtime — structural ProtocolProfile / ProtocolResolver foundation (no concrete protocols).",
  },
];

export class ProtocolRuntimeRegistry {
  private readonly byId = new Map<ProtocolRuntimeProviderId, ProtocolRuntimeRegistration>();

  constructor(seed: readonly ProtocolRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: ProtocolRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: ProtocolRuntimeProviderId): ProtocolRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: ProtocolRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly ProtocolRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: ProtocolRuntimeStatus): readonly ProtocolRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  snapshot(): ProtocolRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

export function createDefaultProtocolRuntimeRegistry(): ProtocolRuntimeRegistry {
  return new ProtocolRuntimeRegistry();
}

export const BUILTIN_PROTOCOL_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

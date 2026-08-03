/**
 * NamespaceRuntimeRegistry — catálogo de mecanismos (TISS-10).
 *
 * Registra: nome, versão, capacidades, status.
 * Sem lógica de negócio. Sem namespace oficial. Sem resolução real. Sem XML TISS/ANS.
 */
import {
  DEFAULT_NAMESPACE_RUNTIME_ADAPTER_ID,
  DEFAULT_NAMESPACE_RUNTIME_VERSION,
} from "../adapters/default-namespace-runtime-adapter";
import {
  DEFAULT_MOCK_NAMESPACE_RUNTIME_VERSION,
  MOCK_NAMESPACE_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-namespace-runtime-adapter";
import {
  DEFAULT_MOCK_NAMESPACE_RUNTIME_CAPABILITIES,
  DEFAULT_NAMESPACE_RUNTIME_CAPABILITIES,
  type NamespaceRuntimeCapabilities,
} from "../ports/capabilities";
import type {
  NamespaceRuntimeProviderId,
  NamespaceRuntimeRegistration,
  NamespaceRuntimeStatus,
} from "../ports/types";

export type NamespaceRuntimeRegistrySnapshot = {
  registrations: readonly NamespaceRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly NamespaceRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Namespace Runtime",
    version: DEFAULT_MOCK_NAMESPACE_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_NAMESPACE_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_NAMESPACE_RUNTIME_CAPABILITIES,
    description:
      "Deterministic in-process Namespace Runtime mock — no official namespace, no real resolution, no operators.",
  },
  {
    providerId: "test",
    name: "Test Namespace Runtime",
    version: DEFAULT_MOCK_NAMESPACE_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_NAMESPACE_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_NAMESPACE_RUNTIME_CAPABILITIES,
    description: "Test alias of the deterministic Namespace Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Namespace Runtime",
    version: DEFAULT_NAMESPACE_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_NAMESPACE_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_NAMESPACE_RUNTIME_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (TISS-10).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Namespace Runtime",
    version: DEFAULT_NAMESPACE_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_NAMESPACE_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_NAMESPACE_RUNTIME_CAPABILITIES,
    description:
      "Official TISS-10 Enterprise Namespace Runtime — canonical namespace infrastructure only.",
  },
];

export class NamespaceRuntimeRegistry {
  private readonly byId = new Map<NamespaceRuntimeProviderId, NamespaceRuntimeRegistration>();

  constructor(seed: readonly NamespaceRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: NamespaceRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: NamespaceRuntimeProviderId): NamespaceRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: NamespaceRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly NamespaceRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: NamespaceRuntimeStatus): readonly NamespaceRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  capabilitiesOf(providerId: NamespaceRuntimeProviderId): NamespaceRuntimeCapabilities {
    return this.byId.get(providerId)?.capabilities ?? {};
  }

  snapshot(): NamespaceRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultNamespaceRuntimeRegistry(): NamespaceRuntimeRegistry {
  return new NamespaceRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_NAMESPACE_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

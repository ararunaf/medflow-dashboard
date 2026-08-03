/**
 * ObservabilityRuntimeRegistry — catálogo de mecanismos (INF-09).
 *
 * Registra: nome, versão, capacidades, status.
 * Sem lógica de negócio. Sem OpenTelemetry. Sem Application Insights. Sem Prometheus.
 */
import {
  DEFAULT_OBSERVABILITY_RUNTIME_ADAPTER_ID,
  DEFAULT_OBSERVABILITY_RUNTIME_VERSION,
} from "../adapters/default-observability-runtime-adapter";
import {
  DEFAULT_MOCK_OBSERVABILITY_RUNTIME_VERSION,
  MOCK_OBSERVABILITY_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-observability-runtime-adapter";
import {
  DEFAULT_MOCK_OBSERVABILITY_RUNTIME_CAPABILITIES,
  DEFAULT_OBSERVABILITY_RUNTIME_CAPABILITIES,
  type ObservabilityRuntimeCapabilities,
} from "../ports/capabilities";
import type {
  ObservabilityRuntimeProviderId,
  ObservabilityRuntimeRegistration,
  ObservabilityRuntimeStatus,
} from "../ports/types";

export type ObservabilityRuntimeRegistrySnapshot = {
  registrations: readonly ObservabilityRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly ObservabilityRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Observability Runtime",
    version: DEFAULT_MOCK_OBSERVABILITY_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_OBSERVABILITY_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_OBSERVABILITY_RUNTIME_CAPABILITIES,
    description:
      "Deterministic in-process Observability Runtime mock — no real observability backend, no OpenTelemetry, no Application Insights.",
  },
  {
    providerId: "test",
    name: "Test Observability Runtime",
    version: DEFAULT_MOCK_OBSERVABILITY_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_OBSERVABILITY_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_OBSERVABILITY_RUNTIME_CAPABILITIES,
    description: "Test alias of the deterministic Observability Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Observability Runtime",
    version: DEFAULT_OBSERVABILITY_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_OBSERVABILITY_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_OBSERVABILITY_RUNTIME_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (INF-09).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Observability Runtime",
    version: DEFAULT_OBSERVABILITY_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_OBSERVABILITY_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_OBSERVABILITY_RUNTIME_CAPABILITIES,
    description:
      "Official INF-09 Enterprise Observability Runtime — canonical observability infrastructure only.",
  },
];

export class ObservabilityRuntimeRegistry {
  private readonly byId = new Map<
    ObservabilityRuntimeProviderId,
    ObservabilityRuntimeRegistration
  >();

  constructor(seed: readonly ObservabilityRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: ObservabilityRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: ObservabilityRuntimeProviderId): ObservabilityRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: ObservabilityRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly ObservabilityRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: ObservabilityRuntimeStatus): readonly ObservabilityRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  capabilitiesOf(providerId: ObservabilityRuntimeProviderId): ObservabilityRuntimeCapabilities {
    return this.byId.get(providerId)?.capabilities ?? {};
  }

  snapshot(): ObservabilityRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultObservabilityRuntimeRegistry(): ObservabilityRuntimeRegistry {
  return new ObservabilityRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_OBSERVABILITY_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

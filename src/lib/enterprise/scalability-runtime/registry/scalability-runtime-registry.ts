/**
 * ScalabilityRuntimeRegistry — catálogo de mecanismos (INF-10).
 *
 * Registra: nome, versão, capacidades, status.
 * Sem lógica de negócio. Sem OpenTelemetry. Sem Application Insights. Sem Prometheus.
 */
import {
  DEFAULT_SCALABILITY_RUNTIME_ADAPTER_ID,
  DEFAULT_SCALABILITY_RUNTIME_VERSION,
} from "../adapters/default-scalability-runtime-adapter";
import {
  DEFAULT_MOCK_SCALABILITY_RUNTIME_VERSION,
  MOCK_SCALABILITY_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-scalability-runtime-adapter";
import {
  DEFAULT_MOCK_SCALABILITY_RUNTIME_CAPABILITIES,
  DEFAULT_SCALABILITY_RUNTIME_CAPABILITIES,
  type ScalabilityRuntimeCapabilities,
} from "../ports/capabilities";
import type {
  ScalabilityRuntimeProviderId,
  ScalabilityRuntimeRegistration,
  ScalabilityRuntimeStatus,
} from "../ports/types";

export type ScalabilityRuntimeRegistrySnapshot = {
  registrations: readonly ScalabilityRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly ScalabilityRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Scalability Runtime",
    version: DEFAULT_MOCK_SCALABILITY_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_SCALABILITY_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_SCALABILITY_RUNTIME_CAPABILITIES,
    description:
      "Deterministic in-process Scalability Runtime mock — no real scalability backend, no OpenTelemetry, no Application Insights.",
  },
  {
    providerId: "test",
    name: "Test Scalability Runtime",
    version: DEFAULT_MOCK_SCALABILITY_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_SCALABILITY_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_SCALABILITY_RUNTIME_CAPABILITIES,
    description: "Test alias of the deterministic Scalability Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Scalability Runtime",
    version: DEFAULT_SCALABILITY_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_SCALABILITY_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_SCALABILITY_RUNTIME_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (INF-10).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Scalability Runtime",
    version: DEFAULT_SCALABILITY_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_SCALABILITY_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_SCALABILITY_RUNTIME_CAPABILITIES,
    description:
      "Official INF-10 Enterprise Scalability Runtime — canonical scalability infrastructure only.",
  },
];

export class ScalabilityRuntimeRegistry {
  private readonly byId = new Map<ScalabilityRuntimeProviderId, ScalabilityRuntimeRegistration>();

  constructor(seed: readonly ScalabilityRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: ScalabilityRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: ScalabilityRuntimeProviderId): ScalabilityRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: ScalabilityRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly ScalabilityRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: ScalabilityRuntimeStatus): readonly ScalabilityRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  capabilitiesOf(providerId: ScalabilityRuntimeProviderId): ScalabilityRuntimeCapabilities {
    return this.byId.get(providerId)?.capabilities ?? {};
  }

  snapshot(): ScalabilityRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultScalabilityRuntimeRegistry(): ScalabilityRuntimeRegistry {
  return new ScalabilityRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_SCALABILITY_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

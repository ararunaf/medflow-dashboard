/**
 * QualityRuntimeRegistry — catálogo de mecanismos (F3-CAP-13).
 *
 * Registra: mock, test, default, enterprise.
 * Sem lógica de negócio. Sem avaliação automática. Sem score. Sem decisão.
 */
import {
  DEFAULT_QUALITY_RUNTIME_ADAPTER_ID,
  DEFAULT_QUALITY_RUNTIME_VERSION,
} from "../adapters/default-quality-runtime-adapter";
import {
  DEFAULT_MOCK_QUALITY_RUNTIME_VERSION,
  MOCK_QUALITY_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-quality-runtime-adapter";
import {
  DEFAULT_MOCK_QUALITY_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_QUALITY_RUNTIME_ENGINE_CAPABILITIES,
} from "../ports/capabilities";
import type {
  QualityRuntimeProviderId,
  QualityRuntimeRegistration,
  QualityRuntimeStatus,
} from "../ports/types";

export type QualityRuntimeRegistrySnapshot = {
  registrations: readonly QualityRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly QualityRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Quality Runtime",
    version: DEFAULT_MOCK_QUALITY_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_QUALITY_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_QUALITY_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Deterministic in-process Quality Runtime mock — no functional quality assessment, no network.",
  },
  {
    providerId: "test",
    name: "Test Quality Runtime",
    version: DEFAULT_MOCK_QUALITY_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_QUALITY_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_QUALITY_RUNTIME_ENGINE_CAPABILITIES,
    description: "Test alias of the deterministic Quality Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Quality Runtime",
    version: DEFAULT_QUALITY_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_QUALITY_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_QUALITY_RUNTIME_ENGINE_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (F3-CAP-13).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Quality Runtime",
    version: DEFAULT_QUALITY_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_QUALITY_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_QUALITY_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Official F3-CAP-13 Enterprise Quality Runtime — structural canonical quality foundation (no functional assessment).",
  },
];

export class QualityRuntimeRegistry {
  private readonly byId = new Map<QualityRuntimeProviderId, QualityRuntimeRegistration>();

  constructor(seed: readonly QualityRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: QualityRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: QualityRuntimeProviderId): QualityRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: QualityRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly QualityRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: QualityRuntimeStatus): readonly QualityRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  snapshot(): QualityRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultQualityRuntimeRegistry(): QualityRuntimeRegistry {
  return new QualityRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_QUALITY_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

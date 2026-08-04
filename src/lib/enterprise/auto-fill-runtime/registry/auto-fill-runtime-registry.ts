/**
 * AutoFillRuntimeRegistry — catálogo de mecanismos (F3-CAP-12).
 *
 * Registra: mock, test, default, enterprise.
 * Sem lógica de negócio. Sem preenchimento automático. Sem operadoras. Sem XML.
 */
import {
  DEFAULT_AUTO_FILL_RUNTIME_ADAPTER_ID,
  DEFAULT_AUTO_FILL_RUNTIME_VERSION,
} from "../adapters/default-auto-fill-runtime-adapter";
import {
  DEFAULT_MOCK_AUTO_FILL_RUNTIME_VERSION,
  MOCK_AUTO_FILL_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-auto-fill-runtime-adapter";
import {
  DEFAULT_MOCK_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES,
} from "../ports/capabilities";
import type {
  AutoFillRuntimeProviderId,
  AutoFillRuntimeRegistration,
  AutoFillRuntimeStatus,
} from "../ports/types";

export type AutoFillRuntimeRegistrySnapshot = {
  registrations: readonly AutoFillRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly AutoFillRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Auto-Fill Runtime",
    version: DEFAULT_MOCK_AUTO_FILL_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_AUTO_FILL_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Deterministic in-process Auto-Fill Runtime mock — no functional auto-fill, no network.",
  },
  {
    providerId: "test",
    name: "Test Auto-Fill Runtime",
    version: DEFAULT_MOCK_AUTO_FILL_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_AUTO_FILL_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES,
    description: "Test alias of the deterministic Auto-Fill Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Auto-Fill Runtime",
    version: DEFAULT_AUTO_FILL_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_AUTO_FILL_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (F3-CAP-12).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Auto-Fill Runtime",
    version: DEFAULT_AUTO_FILL_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_AUTO_FILL_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_AUTO_FILL_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Official F3-CAP-12 Enterprise Auto-Fill Runtime — structural canonical auto-fill foundation (no functional auto-fill).",
  },
];

export class AutoFillRuntimeRegistry {
  private readonly byId = new Map<AutoFillRuntimeProviderId, AutoFillRuntimeRegistration>();

  constructor(seed: readonly AutoFillRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: AutoFillRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: AutoFillRuntimeProviderId): AutoFillRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: AutoFillRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly AutoFillRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: AutoFillRuntimeStatus): readonly AutoFillRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  snapshot(): AutoFillRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultAutoFillRuntimeRegistry(): AutoFillRuntimeRegistry {
  return new AutoFillRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_AUTO_FILL_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

/**
 * ScannerRuntimeRegistry — catálogo de mecanismos (F3-CAP-01).
 *
 * Registra: mock, test, default, enterprise.
 * Sem lógica de negócio. Sem Scanner real. Sem Drivers.
 */
import {
  DEFAULT_SCANNER_RUNTIME_ADAPTER_ID,
  DEFAULT_SCANNER_RUNTIME_VERSION,
} from "../adapters/default-scanner-runtime-adapter";
import {
  DEFAULT_MOCK_SCANNER_RUNTIME_VERSION,
  MOCK_SCANNER_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-scanner-runtime-adapter";
import {
  DEFAULT_MOCK_SCANNER_RUNTIME_CAPABILITIES,
  DEFAULT_SCANNER_RUNTIME_CAPABILITIES,
  type ScannerRuntimeCapabilities,
} from "../ports/capabilities";
import type {
  ScannerRuntimeProviderId,
  ScannerRuntimeRegistration,
  ScannerRuntimeStatus,
} from "../ports/types";

export type ScannerRuntimeRegistrySnapshot = {
  registrations: readonly ScannerRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly ScannerRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Scanner Runtime",
    version: DEFAULT_MOCK_SCANNER_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_SCANNER_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_SCANNER_RUNTIME_CAPABILITIES,
    description:
      "Deterministic in-process Scanner Runtime mock — no real scanner, no TWAIN/WIA/ISIS, no drivers.",
  },
  {
    providerId: "test",
    name: "Test Scanner Runtime",
    version: DEFAULT_MOCK_SCANNER_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_SCANNER_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_SCANNER_RUNTIME_CAPABILITIES,
    description: "Test alias of the deterministic Scanner Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Scanner Runtime",
    version: DEFAULT_SCANNER_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_SCANNER_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_SCANNER_RUNTIME_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (F3-CAP-01).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Scanner Runtime",
    version: DEFAULT_SCANNER_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_SCANNER_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_SCANNER_RUNTIME_CAPABILITIES,
    description: "Official F3-CAP-01 Enterprise Scanner Runtime — vendor-agnostic foundation only.",
  },
];

export class ScannerRuntimeRegistry {
  private readonly byId = new Map<ScannerRuntimeProviderId, ScannerRuntimeRegistration>();

  constructor(seed: readonly ScannerRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: ScannerRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: ScannerRuntimeProviderId): ScannerRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: ScannerRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly ScannerRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: ScannerRuntimeStatus): readonly ScannerRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  capabilitiesOf(providerId: ScannerRuntimeProviderId): ScannerRuntimeCapabilities {
    return this.byId.get(providerId)?.capabilities ?? {};
  }

  snapshot(): ScannerRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultScannerRuntimeRegistry(): ScannerRuntimeRegistry {
  return new ScannerRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_SCANNER_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

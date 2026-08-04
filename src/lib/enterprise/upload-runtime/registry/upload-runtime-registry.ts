/**
 * UploadRuntimeRegistry — catálogo de mecanismos (F3-CAP-03).
 *
 * Registra: mock, test, default, enterprise.
 * Sem lógica de negócio. Sem Upload real. Sem storage providers.
 */
import {
  DEFAULT_UPLOAD_RUNTIME_ADAPTER_ID,
  DEFAULT_UPLOAD_RUNTIME_VERSION,
} from "../adapters/default-upload-runtime-adapter";
import {
  DEFAULT_MOCK_UPLOAD_RUNTIME_VERSION,
  MOCK_UPLOAD_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-upload-runtime-adapter";
import {
  DEFAULT_MOCK_UPLOAD_RUNTIME_CAPABILITIES,
  DEFAULT_UPLOAD_RUNTIME_CAPABILITIES,
  type UploadRuntimeCapabilities,
} from "../ports/capabilities";
import type {
  UploadRuntimeProviderId,
  UploadRuntimeRegistration,
  UploadRuntimeStatus,
} from "../ports/types";

export type UploadRuntimeRegistrySnapshot = {
  registrations: readonly UploadRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly UploadRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Upload Runtime",
    version: DEFAULT_MOCK_UPLOAD_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_UPLOAD_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_UPLOAD_RUNTIME_CAPABILITIES,
    description:
      "Deterministic in-process Upload Runtime mock — no real upload, no web/desktop/mobile/API upload, no storage providers.",
  },
  {
    providerId: "test",
    name: "Test Upload Runtime",
    version: DEFAULT_MOCK_UPLOAD_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_UPLOAD_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_UPLOAD_RUNTIME_CAPABILITIES,
    description: "Test alias of the deterministic Upload Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Upload Runtime",
    version: DEFAULT_UPLOAD_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_UPLOAD_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_UPLOAD_RUNTIME_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (F3-CAP-03).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Upload Runtime",
    version: DEFAULT_UPLOAD_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_UPLOAD_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_UPLOAD_RUNTIME_CAPABILITIES,
    description: "Official F3-CAP-03 Enterprise Upload Runtime — vendor-agnostic foundation only.",
  },
];

export class UploadRuntimeRegistry {
  private readonly byId = new Map<UploadRuntimeProviderId, UploadRuntimeRegistration>();

  constructor(seed: readonly UploadRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: UploadRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: UploadRuntimeProviderId): UploadRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: UploadRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly UploadRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: UploadRuntimeStatus): readonly UploadRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  capabilitiesOf(providerId: UploadRuntimeProviderId): UploadRuntimeCapabilities {
    return this.byId.get(providerId)?.capabilities ?? {};
  }

  snapshot(): UploadRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultUploadRuntimeRegistry(): UploadRuntimeRegistry {
  return new UploadRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_UPLOAD_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

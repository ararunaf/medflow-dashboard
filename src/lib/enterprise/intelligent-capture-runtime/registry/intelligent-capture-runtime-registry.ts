/**
 * IntelligentCaptureRuntimeRegistry — catálogo de mecanismos (F3-CAP-04).
 *
 * Registra: mock, test, default, enterprise.
 * Sem lógica de negócio. Sem OCR. Sem IA. Sem captura automática.
 */
import {
  DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_ADAPTER_ID,
  DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_VERSION,
} from "../adapters/default-intelligent-capture-runtime-adapter";
import {
  DEFAULT_MOCK_INTELLIGENT_CAPTURE_RUNTIME_VERSION,
  MOCK_INTELLIGENT_CAPTURE_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-intelligent-capture-runtime-adapter";
import {
  DEFAULT_MOCK_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES,
  DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES,
  type IntelligentCaptureRuntimeCapabilities,
} from "../ports/capabilities";
import type {
  IntelligentCaptureRuntimeProviderId,
  IntelligentCaptureRuntimeRegistration,
  IntelligentCaptureRuntimeStatus,
} from "../ports/types";

export type IntelligentCaptureRuntimeRegistrySnapshot = {
  registrations: readonly IntelligentCaptureRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly IntelligentCaptureRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Intelligent Capture Runtime",
    version: DEFAULT_MOCK_INTELLIGENT_CAPTURE_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_INTELLIGENT_CAPTURE_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES,
    description:
      "Deterministic in-process Intelligent Capture Runtime mock — no OCR, no AI, no automatic capture, no document processing.",
  },
  {
    providerId: "test",
    name: "Test Intelligent Capture Runtime",
    version: DEFAULT_MOCK_INTELLIGENT_CAPTURE_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_INTELLIGENT_CAPTURE_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES,
    description: "Test alias of the deterministic Intelligent Capture Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Intelligent Capture Runtime",
    version: DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (F3-CAP-04).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Intelligent Capture Runtime",
    version: DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_INTELLIGENT_CAPTURE_RUNTIME_CAPABILITIES,
    description:
      "Official F3-CAP-04 Enterprise Intelligent Capture Runtime — structural orchestration of Scanner/WatchFolder/Upload foundations only.",
  },
];

export class IntelligentCaptureRuntimeRegistry {
  private readonly byId = new Map<
    IntelligentCaptureRuntimeProviderId,
    IntelligentCaptureRuntimeRegistration
  >();

  constructor(seed: readonly IntelligentCaptureRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: IntelligentCaptureRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(
    providerId: IntelligentCaptureRuntimeProviderId,
  ): IntelligentCaptureRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: IntelligentCaptureRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly IntelligentCaptureRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(
    status: IntelligentCaptureRuntimeStatus,
  ): readonly IntelligentCaptureRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  capabilitiesOf(
    providerId: IntelligentCaptureRuntimeProviderId,
  ): IntelligentCaptureRuntimeCapabilities {
    return this.byId.get(providerId)?.capabilities ?? {};
  }

  snapshot(): IntelligentCaptureRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultIntelligentCaptureRuntimeRegistry(): IntelligentCaptureRuntimeRegistry {
  return new IntelligentCaptureRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_INTELLIGENT_CAPTURE_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

/**
 * OCRRuntimeRegistry — catálogo de mecanismos (F3-CAP-05).
 *
 * Registra: mock, test, default, enterprise.
 * Sem lógica de negócio. Sem OCR real. Sem Tesseract/Azure/Google/AWS/ABBYY/PaddleOCR.
 */
import {
  DEFAULT_OCR_RUNTIME_ADAPTER_ID,
  DEFAULT_OCR_RUNTIME_VERSION,
} from "../adapters/default-ocr-runtime-adapter";
import {
  DEFAULT_MOCK_OCR_RUNTIME_VERSION,
  MOCK_OCR_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-ocr-runtime-adapter";
import {
  DEFAULT_MOCK_OCR_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_OCR_RUNTIME_ENGINE_CAPABILITIES,
} from "../ports/capabilities";
import type {
  OCRRuntimeProviderId,
  OCRRuntimeRegistration,
  OCRRuntimeStatus,
} from "../ports/types";

export type OCRRuntimeRegistrySnapshot = {
  registrations: readonly OCRRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly OCRRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock OCR Runtime",
    version: DEFAULT_MOCK_OCR_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_OCR_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_OCR_RUNTIME_ENGINE_CAPABILITIES,
    description: "Deterministic in-process OCR Runtime mock — no real OCR engine, no network.",
  },
  {
    providerId: "test",
    name: "Test OCR Runtime",
    version: DEFAULT_MOCK_OCR_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_OCR_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_OCR_RUNTIME_ENGINE_CAPABILITIES,
    description: "Test alias of the deterministic OCR Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default OCR Runtime",
    version: DEFAULT_OCR_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_OCR_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_OCR_RUNTIME_ENGINE_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (F3-CAP-05).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise OCR Runtime",
    version: DEFAULT_OCR_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_OCR_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_OCR_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Official F3-CAP-05 Enterprise OCR Runtime — structural job/request/document orchestration foundation, with DIP-03/OCR-01 coordination/execution preserved via OCRProviderPort.",
  },
];

export class OCRRuntimeRegistry {
  private readonly byId = new Map<OCRRuntimeProviderId, OCRRuntimeRegistration>();

  constructor(seed: readonly OCRRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: OCRRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: OCRRuntimeProviderId): OCRRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: OCRRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly OCRRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: OCRRuntimeStatus): readonly OCRRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  snapshot(): OCRRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultOCRRuntimeRegistry(): OCRRuntimeRegistry {
  return new OCRRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_OCR_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

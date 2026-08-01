/**
 * OCRProviderRegistry — catálogo de mecanismos OCR (EPC-15 FASE 3/4).
 *
 * Registra: nome, versão, capacidades, status.
 * Sem lógica de negócio. Sem chamadas de rede. Sem OCR real.
 */
import {
  DEFAULT_MOCK_OCR_PROVIDER_VERSION,
  MOCK_OCR_PROVIDER_ADAPTER_ID,
} from "../adapters/mock-ocr-provider-adapter";
import { DEFAULT_MOCK_OCR_CAPABILITIES } from "../ports/capabilities";
import type { OCRCapabilities } from "../ports/capabilities";
import type { OCRProviderId, OCRProviderRegistration, OCRProviderStatus } from "../ports/types";

export type OCRProviderRegistrySnapshot = {
  registrations: readonly OCRProviderRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly OCRProviderRegistration[] = [
  {
    providerId: "mock",
    name: "Default Mock OCR Provider",
    version: DEFAULT_MOCK_OCR_PROVIDER_VERSION,
    status: "ready",
    adapterId: MOCK_OCR_PROVIDER_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_OCR_CAPABILITIES,
    description: "Deterministic in-process OCR mock — no real OCR.",
  },
  {
    providerId: "test",
    name: "Test OCR Provider",
    version: DEFAULT_MOCK_OCR_PROVIDER_VERSION,
    status: "ready",
    adapterId: MOCK_OCR_PROVIDER_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_OCR_CAPABILITIES,
    description: "Test alias of the deterministic OCR mock.",
  },
  {
    providerId: "default",
    name: "Default OCR Provider (Mock)",
    version: DEFAULT_MOCK_OCR_PROVIDER_VERSION,
    status: "ready",
    adapterId: MOCK_OCR_PROVIDER_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_OCR_CAPABILITIES,
    description: "Default resolution alias — maps to mock in foundation.",
  },
];

export class OCRProviderRegistry {
  private readonly byId = new Map<OCRProviderId, OCRProviderRegistration>();

  constructor(seed: readonly OCRProviderRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: OCRProviderRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(providerId: OCRProviderId): OCRProviderRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: OCRProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly OCRProviderRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(status: OCRProviderStatus): readonly OCRProviderRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  capabilitiesOf(providerId: OCRProviderId): OCRCapabilities {
    return this.byId.get(providerId)?.capabilities ?? {};
  }

  snapshot(): OCRProviderRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultOCRProviderRegistry(): OCRProviderRegistry {
  return new OCRProviderRegistry();
}

/** Contagem canônica de providers OCR registrados na fundação. */
export const BUILTIN_OCR_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

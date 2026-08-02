/**
 * DocumentClassificationProviderRegistry — catálogo de mecanismos (CLASS-01).
 *
 * Registra: nome, versão, capacidades, status.
 * Sem lógica de negócio. Sem IA. Sem HTTP.
 */
import {
  DEFAULT_DOCUMENT_CLASSIFICATION_ADAPTER_ID,
  DEFAULT_DOCUMENT_CLASSIFICATION_PROVIDER_VERSION,
} from "../adapters/default-document-classification-adapter";
import {
  DEFAULT_MOCK_DOCUMENT_CLASSIFICATION_PROVIDER_VERSION,
  MOCK_DOCUMENT_CLASSIFICATION_ADAPTER_ID,
} from "../adapters/mock-document-classification-adapter";
import {
  DEFAULT_MOCK_CLASSIFICATION_CAPABILITIES,
  DEFAULT_RULE_BASED_CLASSIFICATION_CAPABILITIES,
  type DocumentClassificationCapabilities,
} from "../ports/capabilities";
import type {
  DocumentClassificationProviderId,
  DocumentClassificationProviderRegistration,
  DocumentClassificationProviderStatus,
} from "../ports/types";

export type DocumentClassificationProviderRegistrySnapshot = {
  registrations: readonly DocumentClassificationProviderRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly DocumentClassificationProviderRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Document Classification Provider",
    version: DEFAULT_MOCK_DOCUMENT_CLASSIFICATION_PROVIDER_VERSION,
    status: "ready",
    adapterId: MOCK_DOCUMENT_CLASSIFICATION_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_CLASSIFICATION_CAPABILITIES,
    description: "Deterministic in-process classification mock — no AI.",
  },
  {
    providerId: "test",
    name: "Test Document Classification Provider",
    version: DEFAULT_MOCK_DOCUMENT_CLASSIFICATION_PROVIDER_VERSION,
    status: "ready",
    adapterId: MOCK_DOCUMENT_CLASSIFICATION_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_CLASSIFICATION_CAPABILITIES,
    description: "Test alias of the deterministic classification mock.",
  },
  {
    providerId: "default",
    name: "Default Document Classification Provider",
    version: DEFAULT_DOCUMENT_CLASSIFICATION_PROVIDER_VERSION,
    status: "ready",
    adapterId: DEFAULT_DOCUMENT_CLASSIFICATION_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_RULE_BASED_CLASSIFICATION_CAPABILITIES,
    description: "Default resolution alias — maps to rule-based (CLASS-01).",
  },
  {
    providerId: "rule-based",
    name: "Rule-Based Document Classification Provider",
    version: DEFAULT_DOCUMENT_CLASSIFICATION_PROVIDER_VERSION,
    status: "ready",
    adapterId: DEFAULT_DOCUMENT_CLASSIFICATION_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_RULE_BASED_CLASSIFICATION_CAPABILITIES,
    description:
      "Official CLASS-01 rule-based document classification provider — sole authorized classification path.",
  },
];

export class DocumentClassificationProviderRegistry {
  private readonly byId = new Map<
    DocumentClassificationProviderId,
    DocumentClassificationProviderRegistration
  >();

  constructor(seed: readonly DocumentClassificationProviderRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: DocumentClassificationProviderRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(
    providerId: DocumentClassificationProviderId,
  ): DocumentClassificationProviderRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: DocumentClassificationProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly DocumentClassificationProviderRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(
    status: DocumentClassificationProviderStatus,
  ): readonly DocumentClassificationProviderRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  capabilitiesOf(providerId: DocumentClassificationProviderId): DocumentClassificationCapabilities {
    return this.byId.get(providerId)?.capabilities ?? {};
  }

  snapshot(): DocumentClassificationProviderRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultDocumentClassificationProviderRegistry(): DocumentClassificationProviderRegistry {
  return new DocumentClassificationProviderRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_DOCUMENT_CLASSIFICATION_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;

/**
 * DocumentClassificationRuntimeRegistry — catálogo de mecanismos (F3-CAP-06).
 *
 * Registra: mock, test, default, enterprise.
 * Sem lógica de negócio. Sem classificação real. Sem IA. Sem ML. Sem LLM.
 */
import {
  DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ADAPTER_ID,
  DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_VERSION,
} from "../adapters/default-document-classification-runtime-adapter";
import {
  DEFAULT_MOCK_DOCUMENT_CLASSIFICATION_RUNTIME_VERSION,
  MOCK_DOCUMENT_CLASSIFICATION_RUNTIME_ADAPTER_ID,
} from "../adapters/mock-document-classification-runtime-adapter";
import {
  DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES,
  DEFAULT_MOCK_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES,
} from "../ports/capabilities";
import type {
  DocumentClassificationRuntimeProviderId,
  DocumentClassificationRuntimeRegistration,
  DocumentClassificationRuntimeStatus,
} from "../ports/types";

export type DocumentClassificationRuntimeRegistrySnapshot = {
  registrations: readonly DocumentClassificationRuntimeRegistration[];
  count: number;
};

const BUILTIN_REGISTRATIONS: readonly DocumentClassificationRuntimeRegistration[] = [
  {
    providerId: "mock",
    name: "Mock Document Classification Runtime",
    version: DEFAULT_MOCK_DOCUMENT_CLASSIFICATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_DOCUMENT_CLASSIFICATION_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Deterministic in-process Document Classification Runtime mock — no real classification, no network.",
  },
  {
    providerId: "test",
    name: "Test Document Classification Runtime",
    version: DEFAULT_MOCK_DOCUMENT_CLASSIFICATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: MOCK_DOCUMENT_CLASSIFICATION_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_MOCK_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES,
    description: "Test alias of the deterministic Document Classification Runtime mock.",
  },
  {
    providerId: "default",
    name: "Default Document Classification Runtime",
    version: DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES,
    description: "Default resolution alias — maps to enterprise (F3-CAP-06).",
  },
  {
    providerId: "enterprise",
    name: "Enterprise Document Classification Runtime",
    version: DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_VERSION,
    status: "ready",
    adapterId: DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ADAPTER_ID,
    vendor: "medicflow-enterprise",
    capabilities: DEFAULT_DOCUMENT_CLASSIFICATION_RUNTIME_ENGINE_CAPABILITIES,
    description:
      "Official F3-CAP-06 Enterprise Document Classification Runtime — structural job/request/document orchestration foundation, with DIP-04/CLASS-01 coordination/execution preserved via DocumentClassificationProviderPort.",
  },
];

export class DocumentClassificationRuntimeRegistry {
  private readonly byId = new Map<
    DocumentClassificationRuntimeProviderId,
    DocumentClassificationRuntimeRegistration
  >();

  constructor(seed: readonly DocumentClassificationRuntimeRegistration[] = BUILTIN_REGISTRATIONS) {
    for (const entry of seed) {
      this.byId.set(entry.providerId, { ...entry, capabilities: { ...entry.capabilities } });
    }
  }

  register(entry: DocumentClassificationRuntimeRegistration): void {
    this.byId.set(entry.providerId, {
      ...entry,
      capabilities: { ...entry.capabilities },
    });
  }

  get(
    providerId: DocumentClassificationRuntimeProviderId,
  ): DocumentClassificationRuntimeRegistration | undefined {
    const entry = this.byId.get(providerId);
    return entry ? { ...entry, capabilities: { ...entry.capabilities } } : undefined;
  }

  has(providerId: DocumentClassificationRuntimeProviderId): boolean {
    return this.byId.has(providerId);
  }

  list(): readonly DocumentClassificationRuntimeRegistration[] {
    return Array.from(this.byId.values()).map((entry) => ({
      ...entry,
      capabilities: { ...entry.capabilities },
    }));
  }

  listByStatus(
    status: DocumentClassificationRuntimeStatus,
  ): readonly DocumentClassificationRuntimeRegistration[] {
    return this.list().filter((entry) => entry.status === status);
  }

  snapshot(): DocumentClassificationRuntimeRegistrySnapshot {
    const registrations = this.list();
    return { registrations, count: registrations.length };
  }
}

/** Registry default com os providers da fundação. */
export function createDefaultDocumentClassificationRuntimeRegistry(): DocumentClassificationRuntimeRegistry {
  return new DocumentClassificationRuntimeRegistry();
}

/** Contagem canônica de providers registrados na fundação. */
export const BUILTIN_DOCUMENT_CLASSIFICATION_RUNTIME_PROVIDER_COUNT = BUILTIN_REGISTRATIONS.length;
